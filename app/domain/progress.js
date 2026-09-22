// Motor de progreso (plan técnico §8). Funciones puras: reciben filas y devuelven números, sin leer db.
// Avance = criterios cumplidos → hito → etapa → objetivo, ponderado por el peso del hito (S=1, M=2, L=3).
// Las acciones NO entran aquí: alimentan la constancia, nunca el avance ("100 tareas" no suben el %).

export const fmtNum = n => Number(n).toLocaleString('es', { maximumFractionDigits: 2 });
export const WEIGHTS = { 1: 'S', 2: 'M', 3: 'L' };
const weightOf = m => (m.weight === 1 || m.weight === 3 ? m.weight : 2);
const live = rows => rows.filter(r => !r.deleted_at);
export const isClosed = m => Boolean(m.done_at) || m.status === 'done';
export const isSkipped = m => m.status === 'skipped';

// Hito: cerrado = 1; si no, criterios cumplidos / totales; sin criterios = 0 (binario hasta cerrarse).
export function milestoneProgress(milestone, criteria = []) {
  const list = live(criteria);
  const met = list.filter(c => c.met_at).length;
  const total = list.length;
  const closed = isClosed(milestone);
  const p = closed ? 1 : total ? met / total : 0;
  return { p, met, total, closed, skipped: isSkipped(milestone), closedWithUnmet: closed && total ? total - met : 0, weight: weightOf(milestone) };
}

// Agrupa los hitos por etapa. Los que no tienen etapa válida van a la etapa implícita (id null).
function groups(stages, milestones) {
  const valid = new Map(live(stages).map(s => [s.id, s]));
  const byStage = new Map([[null, []]]);
  for (const s of valid.values()) byStage.set(s.id, []);
  for (const m of live(milestones)) byStage.get(valid.has(m.stage_id) ? m.stage_id : null).push(m);
  return { valid, byStage };
}

function aggregate(milestones, criteriaByMilestone) {
  let wDone = 0, wTotal = 0, done = 0, total = 0;
  for (const m of milestones) {
    if (isSkipped(m)) continue;
    const mp = milestoneProgress(m, criteriaByMilestone.get(m.id) || []);
    wDone += mp.weight * mp.p;
    wTotal += mp.weight;
    total++;
    if (mp.closed) done++;
  }
  return { p: wTotal ? wDone / wTotal : null, done, total, weightDone: wDone, weightTotal: wTotal };
}

export function stageProgress(stage, milestones, criteriaByMilestone = new Map()) {
  const mine = live(milestones).filter(m => m.stage_id === (stage ? stage.id : null));
  return { ...aggregate(mine, criteriaByMilestone), skipped: stage ? stage.status === 'skipped' : false };
}

const bySort = (a, b) => (a.sort || 0) - (b.sort || 0) || String(a.created_at || '').localeCompare(String(b.created_at || ''));

// Objetivo: media de todos sus hitos (no omitidos, en etapas no omitidas) ponderada por peso.
// backedIds: ids de hitos con evidencia de nivel ≥2 (indicador de respaldo, informativo).
export function goalProgress(goal, stages, milestones, criteriaByMilestone = new Map(), backedIds = new Set()) {
  const { valid, byStage } = groups(stages.filter(s => s.goal_id === goal.id), milestones.filter(m => m.project_id === goal.id));
  const ordered = [...valid.values()].sort(bySort);
  const chapters = [];
  const implicit = byStage.get(null);
  if (implicit.length) chapters.push({ stage: null, milestones: implicit.sort(bySort) });
  for (const s of ordered) chapters.push({ stage: s, milestones: byStage.get(s.id).sort(bySort) });

  const counted = [];
  const segments = [];
  let stagesDone = 0, stagesTotal = 0;
  for (const ch of chapters) {
    if (ch.stage && ch.stage.status === 'skipped') continue;
    const agg = aggregate(ch.milestones, criteriaByMilestone);
    if (ch.stage) {
      stagesTotal++;
      if (ch.stage.status === 'done' || (agg.total && agg.done === agg.total)) stagesDone++;
    }
    if (agg.weightTotal) segments.push({ id: ch.stage ? ch.stage.id : null, title: ch.stage ? ch.stage.title : 'Hitos', weight: agg.weightTotal, p: agg.p });
    counted.push(...ch.milestones.filter(m => !isSkipped(m)));
  }
  const all = aggregate(counted, criteriaByMilestone);
  const next = counted.find(m => !isClosed(m)) || null;
  return {
    p: all.p,
    pct: all.p === null ? null : Math.round(all.p * 100),
    mode: all.p === null ? 'none' : 'milestones',
    stages: { done: stagesDone, total: stagesTotal },
    milestones: { done: all.done, total: all.total },
    segments,
    chapters,
    backed: { with: counted.filter(m => backedIds.has(m.id)).length, total: counted.length },
    nextMilestone: next
  };
}

// Indicador de éxito (métrica del objetivo): se muestra aparte, nunca es el avance.
export function metricIndicator(goal) {
  const num = v => (v === null || v === undefined || v === '' ? null : Number(v));
  const [s, c, t] = [num(goal.metric_start), num(goal.metric_current), num(goal.metric_target)];
  if (s === null || c === null || t === null || t === s) return null;
  const pct = Math.round(Math.min(100, Math.max(0, ((c - s) / (t - s)) * 100)));
  return { pct, label: `${fmtNum(c)} → ${fmtNum(t)}${goal.metric_unit ? ' ' + goal.metric_unit : ''}` };
}

// Texto del cambio tras una acción: "+1 hito", "+1 criterio", "−1 criterio"…
export function progressDelta(before, after) {
  const parts = [];
  const dm = after.milestones.done - before.milestones.done;
  if (dm) parts.push(`${dm > 0 ? '+' : '−'}${Math.abs(dm)} ${Math.abs(dm) === 1 ? 'hito' : 'hitos'}`);
  const dc = (after.criteriaMet || 0) - (before.criteriaMet || 0);
  if (dc && !dm) parts.push(`${dc > 0 ? '+' : '−'}${Math.abs(dc)} ${Math.abs(dc) === 1 ? 'criterio' : 'criterios'}`);
  return { text: parts.join(' · '), from: before.pct, to: after.pct };
}
