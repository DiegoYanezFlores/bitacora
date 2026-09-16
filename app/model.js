// Lógica de dominio derivada de los datos (sin IA, sin red). Todo lo que se muestra se explica en "Cómo funciona".
import * as db from './db.js';
import * as store from './store.js';
import { dayKey, addDays, weekStart, daysBetween, parseDay, time, clamp, plural, fmtDayShort, cap } from './lib.js';

// ---------- memo por revisión de datos ----------
const memo = new Map();
function cached(key, fn) {
  const hit = memo.get(key);
  if (hit && hit.rev === db.rev && hit.day === dayKey()) return hit.value;
  const value = fn();
  memo.set(key, { rev: db.rev, day: dayKey(), value });
  return value;
}

// ---------- colecciones ----------
export const projects = () => cached('projects', () => db.live('projects').sort((a, b) => a.name.localeCompare(b.name, 'es')));
export const project = id => (id ? db.get('projects', id) : null);
export const tasks = () => cached('tasks', () => db.live('tasks'));
export const milestones = () => cached('milestones', () => db.live('milestones'));
export const activities = () => cached('activities', () => db.live('activities').sort((a, b) => time(b.occurred_at) - time(a.occurred_at)));
export const actDay = a => dayKey(new Date(a.occurred_at));

export const openTasks = () => tasks().filter(t => t.status !== 'done');
export const activeProjects = () => projects().filter(p => p.status === 'active');

const byProject = (list, id) => list.filter(x => x.project_id === id);

export function sortTasks(list) {
  const rank = { doing: 0, todo: 1, waiting: 2, done: 3 };
  return [...list].sort((a, b) =>
    rank[a.status] - rank[b.status] ||
    (a.due_date || '9999').localeCompare(b.due_date || '9999') ||
    a.priority - b.priority ||
    time(a.created_at) - time(b.created_at));
}

// ---------- días activos y racha ----------
export const activeDays = () => cached('activeDays', () => {
  const m = new Map();
  for (const a of activities()) { const k = actDay(a); m.set(k, (m.get(k) || 0) + 1); }
  return m;
});

export function streak() {
  return cached('streak', () => {
    const days = activeDays();
    const today = dayKey();
    let k = days.has(today) ? today : addDays(today, -1);
    let current = 0;
    while (days.has(k)) { current++; k = addDays(k, -1); }
    let best = 0, run = 0, prev = null;
    for (const d of [...days.keys()].sort()) {
      run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
      best = Math.max(best, run);
      prev = d;
    }
    return { current, best, today: days.has(today) };
  });
}

export function week(ws = weekStart(dayKey())) {
  const days = activeDays();
  const list = Array.from({ length: 7 }, (_, i) => { const k = addDays(ws, i); return { key: k, count: days.get(k) || 0 }; });
  const active = list.filter(d => d.count).length;
  return { start: ws, days: list, active, goal: store.prefs().weeklyGoal, total: list.reduce((a, d) => a + d.count, 0) };
}

// ---------- periodos ----------
export function period(range, offset = 0) {
  const today = dayKey();
  let start, end, buckets;
  if (range === 'week') {
    start = addDays(weekStart(today), 7 * offset);
    end = addDays(start, 6);
    buckets = Array.from({ length: 7 }, (_, i) => { const k = addDays(start, i); return { key: k, from: k, to: k }; });
  } else if (range === 'month') {
    const d = parseDay(today); d.setDate(1); d.setMonth(d.getMonth() + offset);
    start = dayKey(d);
    end = dayKey(new Date(d.getFullYear(), d.getMonth() + 1, 0));
    const n = daysBetween(start, end) + 1;
    buckets = Array.from({ length: n }, (_, i) => { const k = addDays(start, i); return { key: k, from: k, to: k }; });
  } else {
    const y = parseDay(today).getFullYear() + offset;
    start = `${y}-01-01`; end = `${y}-12-31`;
    buckets = Array.from({ length: 12 }, (_, i) => {
      const from = `${y}-${String(i + 1).padStart(2, '0')}-01`;
      return { key: from, from, to: dayKey(new Date(y, i + 1, 0)) };
    });
  }
  const acts = activities().filter(a => { const k = actDay(a); return k >= start && k <= end; });
  const inRange = iso => { if (!iso) return false; const k = dayKey(new Date(iso)); return k >= start && k <= end; };
  const counts = new Map();
  acts.forEach(a => { const k = actDay(a); counts.set(k, (counts.get(k) || 0) + 1); });
  const series = buckets.map(b => {
    let c = 0;
    if (b.from === b.to) c = counts.get(b.from) || 0;
    else for (const [k, v] of counts) if (k >= b.from && k <= b.to) c += v;
    return { ...b, count: c };
  });
  const perProject = new Map();
  acts.forEach(a => perProject.set(a.project_id || '', (perProject.get(a.project_id || '') || 0) + 1));
  return {
    range, start, end, series,
    activities: acts.length,
    activeDays: counts.size,
    tasksDone: tasks().filter(t => t.status === 'done' && inRange(t.completed_at)).length,
    milestonesDone: milestones().filter(m => inRange(m.done_at)).length,
    wins: acts.filter(a => a.kind === 'win').length,
    byProject: [...perProject.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ project: project(id), count: n }))
  };
}

// ---------- proyectos ----------
export function progress(p) {
  if (!p) return { pct: 0, mode: 'none', label: '' };
  const num = v => (v === null || v === undefined || v === '' ? null : Number(v));
  const [s, c, t] = [num(p.metric_start), num(p.metric_current), num(p.metric_target)];
  if (s !== null && c !== null && t !== null && t !== s) {
    const pct = Math.round(clamp(((c - s) / (t - s)) * 100, 0, 100));
    const unit = p.metric_unit ? ' ' + p.metric_unit : '';
    return { pct, mode: 'metric', label: `${fmtNum(c)} → ${fmtNum(t)}${unit}` };
  }
  const ms = byProject(milestones(), p.id);
  const ts = byProject(tasks(), p.id);
  if (ms.length || ts.length) {
    const doneMs = ms.filter(m => m.done_at).length;
    const doneTs = ts.filter(x => x.status === 'done').length;
    const pct = p.status === 'done' ? 100 : Math.round(((doneMs * 2 + doneTs) / (ms.length * 2 + ts.length)) * 100);
    const parts = [];
    if (ts.length) parts.push(`${doneTs}/${ts.length} tareas`);
    if (ms.length) parts.push(`${doneMs}/${ms.length} hitos`);
    return { pct, mode: 'auto', label: parts.join(' · ') };
  }
  if (p.progress_manual !== null && p.progress_manual !== undefined) return { pct: p.progress_manual, mode: 'manual', label: 'Manual' };
  return { pct: p.status === 'done' ? 100 : 0, mode: 'none', label: 'Sin tareas ni hitos' };
}

export const fmtNum = n => Number(n).toLocaleString('es', { maximumFractionDigits: 2 });

export function projectInfo(p) {
  const acts = byProject(activities(), p.id);
  const last = acts[0] || null;
  const open = sortTasks(byProject(openTasks(), p.id));
  const nextMs = byProject(milestones(), p.id).filter(m => !m.done_at).sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999') || a.sort - b.sort)[0] || null;
  return {
    progress: progress(p),
    last,
    idle: last ? daysBetween(actDay(last), dayKey()) : null,
    next: open.find(t => t.status !== 'waiting') || null,
    open: open.length,
    nextMilestone: nextMs,
    activityCount: acts.length
  };
}

// ---------- siguiente acción ----------
export function nextActions() {
  return cached('next', () => {
    const today = dayKey();
    const items = [];
    const idleOf = id => { if (!id) return null; const p = project(id); return p ? projectInfo(p).idle : null; };

    for (const t of openTasks()) {
      if (t.status === 'waiting') continue;
      const reasons = [];
      let score = 1;
      if (t.status === 'doing') { score += 3; reasons.push('En curso'); }
      if (t.priority === 1) { score += 3; reasons.push('Prioridad alta'); } else if (t.priority === 2) score += 1;
      if (t.due_date) {
        const d = daysBetween(today, t.due_date);
        if (d < 0) { score += 5; reasons.push(`Fecha pasada (${fmtDayShort(t.due_date)})`); }
        else if (d === 0) { score += 4; reasons.push('Vence hoy'); }
        else if (d === 1) { score += 3; reasons.push('Vence mañana'); }
        else if (d <= 3) { score += 2; reasons.push(`Vence en ${d} días`); }
      }
      const idle = idleOf(t.project_id);
      if (idle !== null && idle >= 2) { score += 1; reasons.push(`Proyecto sin avances hace ${idle} días`); }
      items.push({ type: 'task', id: t.id, title: t.title, projectId: t.project_id, score, reasons });
    }

    for (const m of milestones()) {
      if (m.done_at || !m.due_date) continue;
      const d = daysBetween(today, m.due_date);
      if (d > 7) continue;
      const p = project(m.project_id);
      if (!p || p.status !== 'active') continue;
      items.push({ type: 'milestone', id: m.id, title: m.title, projectId: m.project_id, score: 3 + (d <= 1 ? 2 : 0), reasons: [d < 0 ? 'Hito con fecha pasada' : d === 0 ? 'Hito para hoy' : `Hito en ${plural(d, 'día', 'días')}`] });
    }

    for (const p of activeProjects()) {
      const info = projectInfo(p);
      if (info.open || (info.idle !== null && info.idle < 3)) continue;
      items.push({ type: 'define', id: p.id, title: `Define el siguiente paso de ${p.name}`, projectId: p.id, score: 2, reasons: [info.idle === null ? 'Proyecto sin actividad todavía' : `Sin tareas abiertas ni avances hace ${info.idle} días`] });
    }

    items.sort((a, b) => b.score - a.score);
    if (!items.length) {
      items.push(streak().today
        ? { type: 'plan', title: 'Anota la próxima tarea para no perder el hilo', score: 0, reasons: ['No hay tareas abiertas'] }
        : { type: 'log', title: 'Registra lo primero que hiciste hoy', score: 0, reasons: ['Aún no hay actividad hoy'] });
    }
    return items;
  });
}

// ---------- avisos dentro de la app (máx. 1 visible; nunca culpa ni urgencia artificial) ----------
export function notices() {
  const mode = store.prefs().notices;
  if (mode === 'none') return [];
  const dismissed = db.kvGet('dismissed', {});
  const today = dayKey();
  const out = [];

  for (const m of milestones()) {
    if (m.done_at || !m.due_date) continue;
    const d = daysBetween(today, m.due_date);
    const p = project(m.project_id);
    if (d < 0 || d > 3 || !p || p.status !== 'active') continue;
    out.push({ id: `ms:${m.id}:${m.due_date}`, prio: 3, icon: 'flag', text: `Hito “${m.title}” (${p.name}) ${d === 0 ? 'es hoy' : `en ${plural(d, 'día', 'días')}`}.`, action: { label: 'Ver proyecto', href: `#/project/${p.id}` } });
  }

  const dow = (parseDay(today).getDay() + 6) % 7;
  if (dow <= 2) {
    const prev = period('week', -1);
    if (prev.activities) {
      out.push({ id: `week:${prev.start}`, prio: 2, icon: 'chart', text: `Tu semana pasada: ${plural(prev.activities, 'actividad', 'actividades')} en ${plural(prev.activeDays, 'día activo', 'días activos')} y ${plural(prev.tasksDone, 'tarea cerrada', 'tareas cerradas')}.`, action: { label: 'Ver resumen', href: '#/progress' } });
    }
  }

  if (mode === 'all') {
    for (const p of activeProjects()) {
      const info = projectInfo(p);
      if (info.idle === null || info.idle < 5) continue;
      out.push({ id: `stale:${p.id}:${weekStart(today)}`, prio: 1, icon: 'pause', text: `“${p.name}” lleva ${info.idle} días sin avances. ¿Lo retomas o lo pausas por ahora?`, action: { label: 'Abrir', href: `#/project/${p.id}` }, secondary: { label: 'Pausar', act: 'pause-project', id: p.id } });
    }
  }
  return out.filter(n => !dismissed[n.id]).sort((a, b) => b.prio - a.prio);
}

export function dismissNotice(id) {
  const d = db.kvGet('dismissed', {});
  d[id] = dayKey();
  // Se olvidan descartes de más de 60 días para no crecer sin límite.
  for (const [k, v] of Object.entries(d)) if (daysBetween(v, dayKey()) > 60) delete d[k];
  db.kvSet('dismissed', d);
  store.emit();
}

// ---------- patrones (estadística simple, base para IA futura) ----------
export function insights() {
  return cached('insights', () => {
    const since = addDays(dayKey(), -56);
    const recent = activities().filter(a => actDay(a) >= since);
    const out = [];
    const captured = recent.filter(a => a.source === 'capture' || a.source === 'task');
    if (captured.length >= 8) {
      const hours = captured.map(a => new Date(a.created_at).getHours()).sort((a, b) => a - b);
      const h = hours[Math.floor(hours.length / 2)];
      out.push({ id: 'hour', icon: 'clock', text: `Sueles registrar alrededor de las ${String(h).padStart(2, '0')}:00.` });
    }
    if (recent.length >= 10) {
      const byDow = Array(7).fill(0);
      recent.forEach(a => { byDow[(new Date(a.occurred_at).getDay() + 6) % 7]++; });
      const max = Math.max(...byDow);
      const avg = recent.length / 7;
      if (max >= avg * 1.3) {
        const names = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos'];
        out.push({ id: 'dow', icon: 'calendar', text: `Tu actividad aumenta los ${names[byDow.indexOf(max)]}.` });
      }
    }
    const last7 = period('week', 0);
    const prev = period('week', -1);
    if (prev.activities >= 3 && last7.activities) {
      const delta = Math.round(((last7.activities - prev.activities) / prev.activities) * 100);
      if (Math.abs(delta) >= 15) out.push({ id: 'trend', icon: 'trend', text: `Esta semana llevas ${delta > 0 ? '+' : ''}${delta}% de actividad frente a la semana pasada completa.` });
    }
    const focus = last7.byProject.filter(x => x.project);
    if (last7.activities >= 5 && focus.length && focus[0].count / last7.activities >= 0.5) {
      out.push({ id: 'focus', icon: 'target', text: `El ${Math.round((focus[0].count / last7.activities) * 100)}% de tu actividad esta semana fue en ${focus[0].project.name}.` });
    }
    for (const p of activeProjects()) {
      const info = projectInfo(p);
      if (info.idle !== null && info.idle >= 5) out.push({ id: 'idle:' + p.id, icon: 'pause', text: `${p.name} lleva ${info.idle} días sin actualización.` });
    }
    return out.slice(0, 5);
  });
}

// ---------- récords y logros ----------
export function records() {
  return cached('records', () => {
    const days = activeDays();
    const s = streak();
    let bestDay = null;
    for (const [k, v] of days) if (!bestDay || v > bestDay.count) bestDay = { key: k, count: v };
    const weeks = new Map();
    for (const [k, v] of days) { const w = weekStart(k); weeks.set(w, (weeks.get(w) || 0) + v); }
    let bestWeek = null;
    for (const [k, v] of weeks) if (!bestWeek || v > bestWeek.count) bestWeek = { key: k, count: v };
    const goal = store.prefs().weeklyGoal;
    const activeByWeek = new Map();
    for (const k of days.keys()) { const w = weekStart(k); activeByWeek.set(w, (activeByWeek.get(w) || 0) + 1); }
    const weeksMet = [...activeByWeek.values()].filter(n => n >= goal).length;
    const all = activities();
    return {
      bestStreak: s.best, currentStreak: s.current, bestDay, bestWeek, weeksMet,
      total: all.length, activeDays: days.size,
      since: all.length ? actDay(all[all.length - 1]) : null
    };
  });
}

export function achievements() {
  return cached('achievements', () => {
    const r = records();
    const done = tasks().filter(t => t.status === 'done').length;
    const msDone = milestones().filter(m => m.done_at).length;
    const wins = activities().filter(a => a.kind === 'win').length;
    const projDone = projects().filter(p => p.status === 'done').length;
    const def = [
      ['first', 'Primer registro', 'Anotaste tu primera actividad.', r.total, 1],
      ['acts10', '10 actividades', 'Tu historial empieza a tomar forma.', r.total, 10],
      ['acts50', '50 actividades', 'Constancia visible.', r.total, 50],
      ['acts100', '100 actividades', 'Un historial de verdad.', r.total, 100],
      ['acts500', '500 actividades', 'Meses de trabajo documentado.', r.total, 500],
      ['days7', '7 días activos', 'Una semana de registros, no necesariamente seguidos.', r.activeDays, 7],
      ['days30', '30 días activos', 'Un mes de trabajo registrado.', r.activeDays, 30],
      ['days100', '100 días activos', 'Cien días con avances.', r.activeDays, 100],
      ['streak7', 'Racha de 7 días', 'Siete días seguidos con actividad.', r.bestStreak, 7],
      ['goal1', 'Meta semanal cumplida', 'Alcanzaste tus días activos de la semana.', r.weeksMet, 1],
      ['goal4', '4 semanas en meta', 'Un mes cumpliendo tu meta semanal.', r.weeksMet, 4],
      ['tasks25', '25 tareas cerradas', 'Cosas terminadas, no solo empezadas.', done, 25],
      ['milestone1', 'Primer hito', 'Alcanzaste un hito de proyecto.', msDone, 1],
      ['win1', 'Primer logro anotado', 'Registraste un logro.', wins, 1],
      ['project1', 'Proyecto completado', 'Llevaste un proyecto hasta el final.', projDone, 1]
    ];
    return def.map(([id, title, desc, cur, target]) => ({ id, title, desc, cur: Math.min(cur, target), target, unlocked: cur >= target }));
  });
}

// Logros desbloqueados desde la última vez (para mencionarlos en el feedback, una sola vez).
export function newAchievements() {
  const seen = new Set(db.kvGet('seenAch', []));
  const unlocked = achievements().filter(a => a.unlocked);
  const fresh = unlocked.filter(a => !seen.has(a.id));
  if (fresh.length) db.kvSet('seenAch', unlocked.map(a => a.id));
  return fresh;
}
export function markAchievementsSeen() { db.kvSet('seenAch', achievements().filter(a => a.unlocked).map(a => a.id)); }

// ---------- mapa de actividad ----------
export function heatmap(weeks = 18) {
  const days = activeDays();
  const today = dayKey();
  const first = addDays(weekStart(today), -7 * (weeks - 1));
  const cols = [];
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let i = 0; i < 7; i++) {
      const k = addDays(first, w * 7 + i);
      const c = days.get(k) || 0;
      col.push({ key: k, count: c, future: k > today, level: c === 0 ? 0 : c === 1 ? 1 : c <= 3 ? 2 : c <= 5 ? 3 : 4 });
    }
    cols.push(col);
  }
  return cols;
}

export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; };
export const firstName = () => cap((store.profile().display_name || '').trim().split(/\s+/)[0] || '');
