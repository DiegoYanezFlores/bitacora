// Estructura de un objetivo: etapas, hitos con criterios, cierre de hito, evidencia (nota/enlace) y plantillas.
// Toda mutación deja constancia (goal_log) cuando cambia el rumbo o el alcance, y ofrece deshacer.
import * as store from './store.js';
import * as model from './model.js';
import * as db from './db.js';
import { esc, nowIso, plural } from './lib.js';
import { openSheet, closeSheet, confirmSheet, feedback, celebrate, icon } from './ui.js';
import { seg, setTemplateApplier } from './actions.js';
import { WEIGHTS, progressDelta } from './domain/progress.js';
import { TEMPLATES, template } from './domain/templates.js';

const MAX_CRITERIA = 8;
const val = (fd, k) => String(fd.get(k) ?? '').trim();
const WEIGHT_OPTIONS = [[1, 'S · pequeño'], [2, 'M · medio'], [3, 'L · grande']];

// ---------- registro de cambios de rumbo ----------
export function logGoal(goalId, type, meta = {}, note = '') {
  if (!goalId) return null;
  return store.create('goal_log', { goal_id: goalId, type, meta, note, occurred_at: nowIso() });
}

const pctOf = goalId => model.progress(model.project(goalId)).pct;
// Cambio visible del avance tras una mutación: "Objetivo 40% → 60% · +1 hito".
function deltaLine(goalId, before) {
  const g = model.project(goalId);
  if (!g) return [];
  const after = model.progress(g);
  const d = progressDelta(before, after);
  const pct = before.pct !== after.pct && after.pct !== null ? `${g.name} ${before.pct ?? 0}% → ${after.pct}%` : g.name;
  return [d.text ? `${pct} · ${d.text}` : pct];
}
const snap = goalId => { const g = model.project(goalId); const p = model.progress(g); return { pct: p.pct, milestones: { ...p.milestones }, criteriaMet: p.criteriaMet }; };

// ---------- etapas ----------
export function stageForm(stage = null, goalId = null) {
  const s = stage || { title: '', description: '' };
  openSheet(`
    <form class="form">
      <div class="sheet-head"><h2 class="sheet-title">${stage ? 'Editar etapa' : 'Nueva etapa'}</h2><button type="button" class="icon-btn" data-sheet="close" aria-label="Cerrar">${icon('x')}</button></div>
      <p class="muted small">Las etapas son los capítulos del objetivo: agrupan hitos.</p>
      <label class="field"><span>Nombre</span><input name="title" required maxlength="120" value="${esc(s.title)}" autocomplete="off" ${stage ? '' : 'autofocus'} placeholder="Ej.: Fundamentos"></label>
      <label class="field"><span>Descripción (opcional)</span><textarea name="description" rows="2" maxlength="1000">${esc(s.description)}</textarea></label>
      <div class="sheet-actions">
        ${stage ? `<button type="button" class="btn ghost danger-text" data-del>Eliminar</button><button type="button" class="btn ghost" data-up>${icon('up')}Subir</button><button type="button" class="btn ghost" data-skip>${stage.status === 'skipped' ? 'Reactivar' : 'No aplica'}</button><span class="spacer"></span>` : ''}
        <button type="submit" class="btn primary">Guardar</button>
      </div>
    </form>`, {
    onClick: async e => {
      if (e.target.closest('[data-up]')) { closeSheet(); moveStage(stage.id, -1); return; }
      if (e.target.closest('[data-skip]')) { closeSheet(); toggleSkipStage(stage.id); return; }
      if (!e.target.closest('[data-del]')) return;
      closeSheet();
      const n = model.milestones().filter(m => m.stage_id === stage.id).length;
      if (!(await confirmSheet(`¿Eliminar la etapa “${stage.title}”?`, { confirm: 'Eliminar', danger: true, detail: n ? `Sus ${plural(n, 'hito pasa', 'hitos pasan')} a “Sin etapa”; no se borran.` : '' }))) return;
      const moved = model.milestones().filter(m => m.stage_id === stage.id);
      moved.forEach(m => store.update('milestones', m.id, { stage_id: null }));
      const prev = store.remove('stages', stage.id);
      feedback({ title: 'Etapa eliminada', tone: 'info', undo: () => { store.restore('stages', prev); moved.forEach(m => store.update('milestones', m.id, { stage_id: stage.id })); } });
    },
    onSubmit: fd => {
      const data = { title: val(fd, 'title'), description: val(fd, 'description') };
      if (!data.title) return;
      closeSheet();
      if (stage) { store.update('stages', stage.id, data); feedback({ title: 'Etapa actualizada', tone: 'info' }); return; }
      const siblings = model.stages().filter(x => x.goal_id === goalId);
      const created = store.create('stages', { ...data, goal_id: goalId, sort: siblings.length, status: siblings.length ? 'pending' : 'active', started_at: siblings.length ? null : nowIso() });
      feedback({ title: 'Etapa creada', lines: ['Añádele hitos con criterios de “hecho”'], undo: () => store.remove('stages', created.id) });
    }
  });
}

export function moveStage(id, dir) {
  const st = model.stage(id);
  if (!st) return;
  const list = model.stages().filter(s => s.goal_id === st.goal_id).sort((a, b) => a.sort - b.sort);
  const i = list.findIndex(s => s.id === id);
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  list.forEach((s, k) => { if (s.sort !== k) store.update('stages', s.id, { sort: k }); });
}

// "No aplica": sale del cálculo sin borrarse (UX §6).
export function toggleSkipStage(id) {
  const st = model.stage(id);
  if (!st) return;
  const before = pctOf(st.goal_id);
  const skipped = st.status !== 'skipped';
  store.update('stages', id, { status: skipped ? 'skipped' : 'pending' });
  logGoal(st.goal_id, 'scope_changed', { stage: id, skipped, from: before, to: pctOf(st.goal_id) });
  feedback({ title: skipped ? 'Etapa marcada como “no aplica”' : 'Etapa reactivada', lines: ['El avance se recalculó sin ella'], tone: 'info', undo: () => store.update('stages', id, { status: st.status }) });
}

// ---------- hitos ----------
export function milestoneForm(ms = null, goalId = null, { stageId = null } = {}) {
  const m = ms || { title: '', due_date: '', weight: 2, stage_id: stageId, expected_evidence: '', project_id: goalId };
  const gid = ms ? ms.project_id : goalId;
  const stages = model.stages().filter(s => s.goal_id === gid).sort((a, b) => a.sort - b.sort);
  openSheet(`
    <form class="form">
      <div class="sheet-head"><h2 class="sheet-title">${ms ? 'Editar hito' : 'Nuevo hito'}</h2><button type="button" class="icon-btn" data-sheet="close" aria-label="Cerrar">${icon('x')}</button></div>
      <label class="field"><span>Hito</span><input name="title" required maxlength="200" value="${esc(m.title)}" autocomplete="off" ${ms ? '' : 'autofocus'} placeholder="Ej.: Primera conversación de 10 minutos"></label>
      ${ms ? '' : `<label class="field"><span>Criterios de “hecho” (uno por línea, 2–5 recomendado)</span><textarea name="criteria" rows="4" maxlength="1600" placeholder="Hablé 10 minutos sin cambiar de idioma&#10;Grabé la conversación"></textarea></label>`}
      <div class="field"><span>Tamaño</span>${seg('weight', WEIGHT_OPTIONS, m.weight || 2)}<small class="muted">Pesa en el avance del objetivo: S cuenta 1, M 2 y L 3.</small></div>
      ${stages.length ? `<label class="field"><span>Etapa</span><select name="stage_id"><option value="">Sin etapa</option>${stages.map(s => `<option value="${s.id}" ${s.id === m.stage_id ? 'selected' : ''}>${esc(s.title)}</option>`).join('')}</select></label>` : ''}
      <div class="row2">
        <label class="field"><span>Evidencia esperada (opcional)</span><input name="expected_evidence" maxlength="200" value="${esc(m.expected_evidence || '')}" placeholder="Ej.: grabación, certificado"></label>
        <label class="field"><span>Fecha (opcional)</span><input type="date" name="due_date" value="${esc(m.due_date || '')}"></label>
      </div>
      <div class="sheet-actions">
        ${ms ? `<button type="button" class="btn ghost danger-text" data-del>Eliminar</button><button type="button" class="btn ghost" data-skip>${ms.status === 'skipped' ? 'Reactivar' : 'No aplica'}</button><span class="spacer"></span>` : ''}
        <button type="submit" class="btn primary">Guardar</button>
      </div>
    </form>`, {
    onClick: async e => {
      if (e.target.closest('[data-skip]')) { closeSheet(); toggleSkipMilestone(ms.id); return; }
      if (!e.target.closest('[data-del]')) return;
      closeSheet();
      if (!(await confirmSheet(`¿Eliminar el hito “${ms.title}”?`, { confirm: 'Eliminar', danger: true, detail: 'Sus criterios se borran; las acciones y evidencias vinculadas se conservan sin hito. Si solo no aplica, usa “No aplica”.' }))) return;
      removeMilestone(ms.id);
    },
    onSubmit: fd => {
      const data = { title: val(fd, 'title'), due_date: val(fd, 'due_date') || null, weight: Number(val(fd, 'weight')) || 2, expected_evidence: val(fd, 'expected_evidence') };
      if (stages.length) data.stage_id = val(fd, 'stage_id') || null;
      if (!data.title) return;
      closeSheet();
      if (ms) { store.update('milestones', ms.id, data); feedback({ title: 'Hito actualizado', tone: 'info' }); return; }
      const created = store.create('milestones', { ...data, project_id: gid, status: 'open', sort: model.milestones().filter(x => x.project_id === gid).length });
      const lines = val(fd, 'criteria').split('\n').map(s => s.trim()).filter(Boolean).slice(0, MAX_CRITERIA);
      lines.forEach((title, i) => store.create('criteria', { milestone_id: created.id, title: title.slice(0, 200), sort: i }));
      feedback({ title: 'Hito creado', lines: [lines.length ? plural(lines.length, 'criterio', 'criterios') : 'Añade criterios para medir su avance'], undo: () => removeMilestone(created.id, { quiet: true }) });
    }
  });
}

export function toggleSkipMilestone(id) {
  const m = model.milestone(id);
  if (!m) return;
  const before = pctOf(m.project_id);
  const skipped = m.status !== 'skipped';
  store.update('milestones', id, { status: skipped ? 'skipped' : (m.done_at ? 'done' : 'open') });
  logGoal(m.project_id, 'scope_changed', { milestone: id, skipped, from: before, to: pctOf(m.project_id) });
  feedback({ title: skipped ? 'Hito marcado como “no aplica”' : 'Hito reactivado', lines: ['Queda registrado como ajuste de alcance'], tone: 'info', undo: () => store.update('milestones', id, { status: m.status }) });
}

// Borrar un hito pendiente sube el %; por eso se registra el cambio de alcance (visible, no bloqueante).
export function removeMilestone(id, { quiet = false } = {}) {
  const m = model.milestone(id);
  if (!m) return;
  const before = pctOf(m.project_id);
  const crit = model.criteriaOf(id);
  const acts = model.activities().filter(a => a.milestone_id === id);
  const evs = model.evidence().filter(e => e.milestone_id === id);
  crit.forEach(c => store.remove('criteria', c.id));
  acts.forEach(a => store.update('activities', a.id, { milestone_id: null, criterion_id: null }));
  evs.forEach(e => store.update('evidence', e.id, { milestone_id: null, criterion_id: null }));
  const prev = store.remove('milestones', id);
  const log = quiet ? null : logGoal(m.project_id, 'scope_changed', { milestone_removed: m.title, from: before, to: pctOf(m.project_id) });
  if (quiet) return;
  feedback({
    title: 'Hito eliminado', tone: 'info',
    undo: () => {
      store.restore('milestones', prev);
      crit.forEach(c => store.restore('criteria', c));
      acts.forEach(a => store.update('activities', a.id, { milestone_id: id, criterion_id: a.criterion_id }));
      evs.forEach(e => store.update('evidence', e.id, { milestone_id: id, criterion_id: e.criterion_id }));
      if (log) store.remove('goal_log', log.id);
    }
  });
}

// ---------- criterios ----------
export function toggleCriterion(id) {
  const c = db.get('criteria', id);
  if (!c || c.deleted_at) return;
  const m = model.milestone(c.milestone_id);
  if (!m) return;
  const before = snap(m.project_id);
  const met = !c.met_at;
  store.update('criteria', id, { met_at: met ? nowIso() : null });
  const mp = model.msProgress(m);
  const lines = deltaLine(m.project_id, before);
  if (met && mp.met === mp.total && !mp.closed) lines.push('Todos los criterios cumplidos: ya puedes cerrar el hito');
  if (met) celebrate();
  feedback({ title: met ? `Criterio cumplido · ${mp.met} de ${mp.total}` : 'Criterio desmarcado', lines, tone: met ? 'ok' : 'info', undo: () => store.update('criteria', id, { met_at: c.met_at }) });
}

export function addCriterion(milestoneId, title) {
  const t = String(title || '').trim().slice(0, 200);
  if (!t) return false;
  const list = model.criteriaOf(milestoneId);
  if (list.length >= MAX_CRITERIA) { feedback({ title: `Máximo ${MAX_CRITERIA} criterios por hito`, lines: ['Si hay más, quizá sean dos hitos'], tone: 'info' }); return false; }
  store.create('criteria', { milestone_id: milestoneId, title: t, sort: list.length });
  return true;
}

export function removeCriterion(id) {
  const prev = store.remove('criteria', id);
  if (prev) feedback({ title: 'Criterio eliminado', tone: 'info', undo: () => store.restore('criteria', prev) });
}

// ---------- panel del hito ----------
const diamond = closed => `<span class="ms-diamond ${closed ? 'on' : ''}" aria-hidden="true">${icon('diamond')}</span>`;

export function openMilestone(id) {
  let el = null;
  const draw = () => {
    const m = model.milestone(id);
    if (!m) { closeSheet(); return ''; }
    const g = model.project(m.project_id);
    const st = model.stage(m.stage_id);
    const mp = model.msProgress(m);
    const crit = model.criteriaOf(id);
    const evs = model.evidenceOf(id);
    const acts = model.activities().filter(a => a.milestone_id === id);
    return `
      <div class="sheet-head"><h2 class="sheet-title ms-title">${diamond(mp.closed)}${esc(m.title)}</h2><button type="button" class="icon-btn" data-sheet="close" aria-label="Cerrar">${icon('x')}</button></div>
      <p class="muted small">${[g ? esc(g.name) : '', st ? esc(st.title) : '', `Tamaño ${WEIGHTS[mp.weight]}`, m.status === 'skipped' ? 'No aplica' : ''].filter(Boolean).join(' · ')}</p>
      <div class="ms-progress">
        <strong class="num">${mp.closed ? (mp.closedWithUnmet ? `Cerrado con ${mp.met} de ${mp.total} criterios` : 'Cerrado') : mp.total ? `${mp.met} de ${mp.total} criterios` : 'Sin criterios todavía'}</strong>
        ${mp.total ? `<div class="crit-bar" aria-hidden="true">${crit.map(c => `<span class="${c.met_at ? 'on' : ''}"></span>`).join('')}</div>` : ''}
      </div>
      <ul class="criteria">
        ${crit.map(c => `<li class="criterion ${c.met_at ? 'is-met' : ''}">
          <button type="button" class="tick ${c.met_at ? 'on' : ''}" data-crit="${c.id}" aria-pressed="${Boolean(c.met_at)}" aria-label="${c.met_at ? 'Desmarcar' : 'Marcar como cumplido'}: ${esc(c.title)}">${icon('check')}</button>
          <span class="criterion-title">${esc(c.title)}</span>
          <button type="button" class="icon-btn small" data-crit-del="${c.id}" aria-label="Eliminar criterio">${icon('x')}</button>
        </li>`).join('')}
      </ul>
      ${crit.length < MAX_CRITERIA && !mp.closed ? `<form class="crit-add" data-crit-add><input name="t" maxlength="200" placeholder="Añadir criterio de “hecho”" aria-label="Nuevo criterio" autocomplete="off"><button class="btn ghost small" type="submit">${icon('plus')}Añadir</button></form>` : ''}
      ${m.expected_evidence ? `<p class="muted small">Evidencia esperada: ${esc(m.expected_evidence)}</p>` : ''}
      <div class="block-head mt"><h3 class="eyebrow">Evidencia</h3><button type="button" class="link" data-ev-add>${icon('plus')}Añadir</button></div>
      ${evs.length ? `<ul class="evs">${evs.map(evidenceRow).join('')}</ul>` : '<p class="muted small">La evidencia convierte lo que hiciste en algo que puedes mostrar.</p>'}
      <p class="muted small mt">${plural(acts.length, 'acción vinculada', 'acciones vinculadas')}</p>
      <div class="sheet-actions">
        <button type="button" class="btn ghost" data-ms-edit>${icon('edit')}Editar</button>
        <span class="spacer"></span>
        ${mp.closed ? '<button type="button" class="btn ghost" data-ms-reopen>Reabrir</button>' : m.status === 'skipped' ? ''
          : !mp.total || mp.met === mp.total ? `<button type="button" class="btn primary" data-ms-close>${icon('diamond')}Cerrar hito</button>`
          : '<button type="button" class="btn ghost" data-ms-close>Cerrar igualmente</button>'}
      </div>`;
  };
  el = openSheet(draw(), {
    panel: true,
    onClick: (e, root) => {
      const t = e.target;
      const crit = t.closest('[data-crit]');
      if (crit) { toggleCriterion(crit.dataset.crit); refresh(); return; }
      const del = t.closest('[data-crit-del]');
      if (del) { removeCriterion(del.dataset.critDel); refresh(); return; }
      if (t.closest('[data-ev-add]')) { const m = model.milestone(id); evidenceForm({ goalId: m.project_id, milestoneId: id, onDone: () => openMilestone(id) }); return; }
      const evDel = t.closest('[data-ev-del]');
      if (evDel) { removeEvidence(evDel.dataset.evDel); refresh(); return; }
      if (t.closest('[data-ms-edit]')) { milestoneForm(model.milestone(id)); return; }
      if (t.closest('[data-ms-close]')) { closeMilestoneFlow(id); return; }
      if (t.closest('[data-ms-reopen]')) { reopenMilestone(id); refresh(); }
    },
    onSubmit: (fd, form) => {
      if (form.matches('[data-crit-add]') && addCriterion(id, fd.get('t'))) { refresh(); el.querySelector('[data-crit-add] input')?.focus(); }
    }
  });
  function refresh() { const inner = el.querySelector('.sheet-inner'); if (inner && el.open) inner.innerHTML = draw(); }
}

// ---------- cerrar / reabrir hito ----------
export function closeMilestoneFlow(id) {
  const m = model.milestone(id);
  if (!m) return;
  const mp = model.msProgress(m);
  const acts = model.activities().filter(a => a.milestone_id === id);
  openSheet(`
    <form class="form">
      <div class="sheet-head"><h2 class="sheet-title ms-title">${diamond(true)}Cerrar “${esc(m.title)}”</h2><button type="button" class="icon-btn" data-sheet="close" aria-label="Cerrar">${icon('x')}</button></div>
      <p>${mp.total ? (mp.met === mp.total ? `Cumpliste los ${mp.total} criterios.` : `Se cerrará con ${mp.met} de ${mp.total} criterios; quedará indicado así.`) : 'Este hito no tiene criterios: se cerrará completo.'} ${acts.length ? `${plural(acts.length, 'acción', 'acciones')} registradas.` : ''}</p>
      <div class="field"><span>¿Qué te gustaría guardar de este momento? (opcional)</span>
        <input name="ev_url" type="url" inputmode="url" maxlength="2048" placeholder="Enlace: repositorio, publicación, certificado…" autocomplete="off">
        <input name="ev_note" maxlength="300" placeholder="O una nota: resultado, puntaje, qué conseguiste" autocomplete="off">
      </div>
      <label class="field"><span>¿Qué aprendiste? (opcional, una línea)</span><input name="reflection" maxlength="300" autocomplete="off"></label>
      <div class="sheet-actions"><button type="button" class="btn ghost" data-sheet="close">Ahora no</button><button type="submit" class="btn primary">${icon('diamond')}Cerrar hito</button></div>
    </form>`, {
    onSubmit: (fd, form) => {
      const url = val(fd, 'ev_url');
      if (url && !/^https?:\/\//i.test(url)) { form.elements.ev_url.setCustomValidity('Usa un enlace que empiece por http:// o https://'); form.reportValidity(); form.elements.ev_url.setCustomValidity(''); return; }
      closeSheet();
      closeMilestone(id, { url, note: val(fd, 'ev_note'), reflection: val(fd, 'reflection') });
    }
  });
}

export function closeMilestone(id, { url = '', note = '', reflection = '' } = {}) {
  const m = model.milestone(id);
  if (!m) return;
  const gid = m.project_id;
  const before = snap(gid);
  const now = nowIso();
  const created = [];
  store.update('milestones', id, { done_at: now, status: 'done' });
  created.push(['activities', store.create('activities', { kind: 'win', title: `Hito: ${m.title}`, project_id: gid, milestone_id: id, source: 'milestone', occurred_at: now })]);
  if (url || note) created.push(['evidence', store.create('evidence', { goal_id: gid, milestone_id: id, type: url ? 'link' : 'result', title: url ? '' : note.slice(0, 200), url: url || null, note: url ? note : '', level: url ? 2 : 1, captured_at: now })]);
  if (reflection) created.push(['reflections', store.create('reflections', { type: 'milestone_close', body: reflection, prompt: '¿Qué aprendiste?', goal_id: gid, stage_id: m.stage_id || null, milestone_id: id, occurred_at: now })]);

  // ¿Se completó la etapa? Se marca y queda en el registro de rumbo (el usuario puede reabrir).
  const st = model.stage(m.stage_id);
  let stageDone = false;
  if (st && st.status !== 'done') {
    const sp = model.progress(model.project(gid)).chapters.find(c => c.stage && c.stage.id === st.id);
    if (sp && sp.milestones.filter(x => x.status !== 'skipped').every(x => x.done_at || x.id === id)) {
      store.update('stages', st.id, { status: 'done', completed_at: now });
      created.push(['goal_log', logGoal(gid, 'stage_completed', { stage: st.id })]);
      stageDone = true;
    }
  }
  const next = model.progress(model.project(gid)).nextMilestone;
  celebrate();
  store.track('milestone_close', { criteria: model.msProgress(model.milestone(id)).total, evidence: Boolean(url || note) });
  feedback({
    tone: 'milestone',
    title: stageDone ? `Etapa completada: ${st.title}` : 'Hito cerrado',
    lines: [...deltaLine(gid, before), next ? `Siguiente: ${next.title}` : 'Todos los hitos cerrados'],
    undo: () => {
      store.update('milestones', id, { done_at: m.done_at, status: m.status });
      created.forEach(([t, row]) => row && store.remove(t, row.id));
      if (stageDone) store.update('stages', st.id, { status: st.status, completed_at: st.completed_at });
    }
  });
}

export function reopenMilestone(id) {
  const m = model.milestone(id);
  if (!m) return;
  store.update('milestones', id, { done_at: null, status: 'open' });
  // La acción del cierre se retira por vínculo (y por título para cierres anteriores a los vínculos).
  model.activities().filter(a => a.source === 'milestone' && (a.milestone_id === id || (!a.milestone_id && a.title === `Hito: ${m.title}` && a.project_id === m.project_id))).forEach(a => store.remove('activities', a.id));
  const st = model.stage(m.stage_id);
  if (st && st.status === 'done') store.update('stages', st.id, { status: 'active', completed_at: null });
  feedback({ title: 'Hito reabierto', tone: 'info' });
}

// ---------- evidencia (nota, enlace, resultado; archivos en F6) ----------
const EV_TYPES = [['link', 'Enlace'], ['note', 'Nota'], ['result', 'Resultado'], ['commit', 'Commit / repositorio']];
const EV_LEVELS = [[1, 'Nota o dato'], [2, 'Con artefacto'], [3, 'Verificable por terceros']];
const suggestedLevel = type => (type === 'commit' ? 3 : type === 'link' ? 2 : 1);

export function evidenceRow(e) {
  const label = e.title || e.note || e.url || 'Evidencia';
  const body = e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>` : esc(label);
  return `<li class="ev">${icon(e.url ? 'link' : 'note')}<span class="ev-body">${body}</span><span class="ev-level" title="Nivel de respaldo ${e.level}" aria-label="Nivel de respaldo ${e.level} de 3">${'<i></i>'.repeat(e.level || 1)}</span><button type="button" class="icon-btn small" data-ev-del="${e.id}" aria-label="Eliminar evidencia">${icon('x')}</button></li>`;
}

export function evidenceForm({ goalId, milestoneId = null, onDone = null }) {
  openSheet(`
    <form class="form">
      <div class="sheet-head"><h2 class="sheet-title">Añadir evidencia</h2><button type="button" class="icon-btn" data-sheet="close" aria-label="Cerrar">${icon('x')}</button></div>
      <div class="field"><span>Tipo</span>${seg('type', EV_TYPES, 'link')}</div>
      <label class="field"><span>Enlace</span><input name="url" type="url" inputmode="url" maxlength="2048" placeholder="https://…" autocomplete="off"></label>
      <label class="field"><span>Título o nota</span><input name="title" maxlength="200" placeholder="Qué muestra" autocomplete="off"></label>
      <div class="field"><span>Nivel de respaldo</span>${seg('level', EV_LEVELS, 2)}<small class="muted">Informativo: distingue “lo anoté” de “lo puedo demostrar”. Nunca bloquea nada.</small></div>
      <div class="sheet-actions"><button type="submit" class="btn primary">Guardar</button></div>
    </form>`, {
    onClick: (e, root) => { if (e.target.name === 'type') root.querySelector(`input[name=level][value="${suggestedLevel(e.target.value)}"]`).checked = true; },
    onSubmit: (fd, form) => {
      const type = val(fd, 'type') || 'link';
      const url = val(fd, 'url');
      const title = val(fd, 'title');
      if (url && !/^https?:\/\//i.test(url)) { form.elements.url.setCustomValidity('Usa un enlace que empiece por http:// o https://'); form.reportValidity(); form.elements.url.setCustomValidity(''); return; }
      if (!url && !title) { form.elements.title.focus(); return; }
      closeSheet();
      const created = store.create('evidence', { goal_id: goalId, milestone_id: milestoneId, type, url: url || null, title: url ? title : title.slice(0, 200), note: '', level: Number(val(fd, 'level')) || suggestedLevel(type) });
      store.track('evidence_add', { type, level: created.level });
      feedback({ title: 'Evidencia guardada', lines: [created.level >= 2 ? 'Cuenta como respaldo del hito' : 'Guardada como nota'], undo: () => store.remove('evidence', created.id) });
      if (onDone) onDone(created);
    }
  });
}

export function removeEvidence(id) {
  const prev = store.remove('evidence', id);
  if (prev) feedback({ title: 'Evidencia eliminada', tone: 'info', undo: () => store.restore('evidence', prev) });
}

// ---------- plantillas ----------
// endowed: el primer hito empieza con un criterio ya cumplido ("Definiste tu objetivo") — progreso dotado real.
export function applyTemplate(goalId, key, { endowed = false } = {}) {
  const t = template(key);
  if (!t || !goalId) return 0;
  const offset = model.stages().filter(s => s.goal_id === goalId).length;
  const msOffset = model.milestones().filter(m => m.project_id === goalId).length;
  let n = 0, first = true;
  t.stages.forEach((s, i) => {
    const stage = store.create('stages', { goal_id: goalId, title: s.title, sort: offset + i, status: offset + i === 0 ? 'active' : 'pending', started_at: offset + i === 0 ? nowIso() : null });
    s.milestones.forEach(ms => {
      const m = store.create('milestones', { project_id: goalId, stage_id: stage.id, title: ms.title, weight: ms.weight, status: 'open', sort: msOffset + n++ });
      const crit = endowed && first ? ['Definiste tu objetivo', ...ms.criteria] : ms.criteria;
      crit.slice(0, MAX_CRITERIA).forEach((c, k) => store.create('criteria', { milestone_id: m.id, title: c, sort: k, met_at: endowed && first && k === 0 ? nowIso() : null }));
      first = false;
    });
  });
  store.track('template_apply', { key });
  return n;
}

setTemplateApplier(applyTemplate);

export function templatePicker(goalId) {
  openSheet(`
    <div class="sheet-head"><h2 class="sheet-title">Usar una plantilla</h2><button type="button" class="icon-btn" data-sheet="close" aria-label="Cerrar">${icon('x')}</button></div>
    <p class="muted small">Añade etapas e hitos con criterios sugeridos. Todo es editable y puedes borrar lo que no te sirva.</p>
    <div class="template-list">${TEMPLATES.map(t => `<button type="button" class="template" data-tpl="${t.key}">
      <strong>${esc(t.label)}</strong>
      <span class="muted small">${t.stages.map(s => esc(s.title)).join(' · ')}</span>
    </button>`).join('')}</div>`, {
    onClick: e => {
      const b = e.target.closest('[data-tpl]');
      if (!b) return;
      closeSheet();
      const n = applyTemplate(goalId, b.dataset.tpl);
      feedback({ title: 'Plantilla aplicada', lines: [`${plural(n, 'hito creado', 'hitos creados')} con sus criterios`] });
    }
  });
}
