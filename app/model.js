// Lógica de dominio derivada de los datos (sin IA, sin red). Todo lo que se muestra se explica en "Cómo funciona".
import * as db from './db.js';
import * as store from './store.js';
import { dayKey, addDays, weekStart, daysBetween, parseDay, time, plural, fmtDayShort, cap } from './lib.js';
import { countByDay, streakOf, weekOf, heatmapOf } from './domain/days.js';
import { goalProgress, metricIndicator, milestoneProgress, fmtNum } from './domain/progress.js';
import { periodOf } from './domain/period.js';
import { indexByDay, EMPTY_CELL } from './domain/calendar.js';

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
// Un objetivo (tabla projects) borrado no existe para la interfaz (antes aparecía como chip con nombre vacío).
export const project = id => { const p = id ? db.get('projects', id) : null; return p && !p.deleted_at ? p : null; };
export const tasks = () => cached('tasks', () => db.live('tasks'));
export const milestones = () => cached('milestones', () => db.live('milestones'));
export const stages = () => cached('stages', () => db.live('stages'));
export const criteria = () => cached('criteria', () => db.live('criteria'));
export const evidence = () => cached('evidence', () => db.live('evidence').sort((a, b) => time(b.captured_at) - time(a.captured_at)));
export const reflections = () => cached('reflections', () => db.live('reflections'));
export const milestone = id => { const m = id ? db.get('milestones', id) : null; return m && !m.deleted_at ? m : null; };
export const stage = id => { const s = id ? db.get('stages', id) : null; return s && !s.deleted_at ? s : null; };

// Índices por padre (una pasada por revisión de datos).
const indexBy = (key, list, field) => cached(key, () => {
  const m = new Map();
  for (const r of list()) { const k = r[field]; if (!m.has(k)) m.set(k, []); m.get(k).push(r); }
  return m;
});
export const criteriaByMilestone = () => indexBy('criteriaByMilestone', criteria, 'milestone_id');
export const criteriaOf = id => (criteriaByMilestone().get(id) || []).slice().sort((a, b) => (a.sort || 0) - (b.sort || 0) || time(a.created_at) - time(b.created_at));
export const evidenceOf = id => evidence().filter(e => e.milestone_id === id);

// Hitos con evidencia de nivel ≥2 (en el hito, en uno de sus criterios o en una de sus acciones).
export const backedIds = () => cached('backed', () => {
  const critMs = new Map(criteria().map(c => [c.id, c.milestone_id]));
  const actMs = new Map(db.live('activities').filter(a => a.milestone_id).map(a => [a.id, a.milestone_id]));
  const out = new Set();
  for (const e of evidence()) {
    if ((e.level ?? 1) < 2) continue;
    const id = e.milestone_id || critMs.get(e.criterion_id) || actMs.get(e.activity_id);
    if (id) out.add(id);
  }
  return out;
});

export const msProgress = m => milestoneProgress(m, criteriaByMilestone().get(m.id) || []);
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

// ---------- calendario ----------
// Reparto por día de lo planificado (tareas con due_date) y lo ocurrido (actividades).
// Se calcula una vez por revisión de datos y filtro: la vista no consulta nada más.
export const calendarDays = (project = null) =>
  cached('calendar:' + (project || 'all'), () => indexByDay({ tasks: tasks(), activities: activities(), dayOfActivity: actDay, project }));
export const dayCell = (day, project = null) => calendarDays(project).get(day) || { day, ...EMPTY_CELL };

// ---------- días activos y racha ----------
export const activeDays = () => cached('activeDays', () => countByDay(activities(), actDay));

export const streak = () => cached('streak', () => streakOf(activeDays(), dayKey()));

export const week = (ws = weekStart(dayKey())) => weekOf(activeDays(), ws, store.prefs().weeklyGoal);

// ---------- periodos ----------
export const period = (range, offset = 0) =>
  periodOf(range, offset, { today: dayKey(), activities: activities(), tasks: tasks(), milestones: milestones(), project, dayOf: actDay });

// ---------- objetivos (tabla projects) ----------
// Avance de un objetivo (motor de progreso §8) + indicador de éxito si tiene métrica.
const EMPTY_PROGRESS = { p: null, pct: null, mode: 'none', milestones: { done: 0, total: 0 }, stages: { done: 0, total: 0 }, segments: [], chapters: [], backed: { with: 0, total: 0 }, nextMilestone: null, metric: null, criteriaMet: 0 };
export const progress = p => (p ? cached('goal:' + p.id, () => {
  const g = goalProgress(p, stages(), milestones(), criteriaByMilestone(), backedIds());
  const mine = new Set(milestones().filter(m => m.project_id === p.id).map(m => m.id));
  const criteriaMet = criteria().filter(c => mine.has(c.milestone_id) && c.met_at).length;
  return { ...g, metric: metricIndicator(p), criteriaMet };
}) : EMPTY_PROGRESS);

export { fmtNum };

export function projectInfo(p) {
  const acts = byProject(activities(), p.id);
  const last = acts[0] || null;
  const open = sortTasks(byProject(openTasks(), p.id));
  const prog = progress(p);
  const nextMs = prog.nextMilestone;
  return {
    progress: prog,
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
      if (idle !== null && idle >= 2) { score += 1; reasons.push(`Objetivo sin actividad hace ${idle} días`); }
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
      items.push({ type: 'define', id: p.id, title: `Define el siguiente paso de ${p.name}`, projectId: p.id, score: 2, reasons: [info.idle === null ? 'Objetivo sin actividad todavía' : `Sin tareas abiertas ni avances hace ${info.idle} días`] });
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
    out.push({ id: `ms:${m.id}:${m.due_date}`, prio: 3, icon: 'flag', text: `Hito “${m.title}” (${p.name}) ${d === 0 ? 'es hoy' : `en ${plural(d, 'día', 'días')}`}.`, action: { label: 'Ver objetivo', href: `#/goal/${p.id}` } });
  }

  const dow = (parseDay(today).getDay() + 6) % 7;
  if (dow <= 2) {
    const prev = period('week', -1);
    if (prev.activities) {
      out.push({ id: `week:${prev.start}`, prio: 2, icon: 'chart', text: `Tu semana pasada: ${plural(prev.activities, 'actividad', 'actividades')} en ${plural(prev.activeDays, 'día activo', 'días activos')} y ${plural(prev.tasksDone, 'tarea cerrada', 'tareas cerradas')}.`, action: { label: 'Ver resumen', href: '#/history' } });
    }
  }

  if (mode === 'all') {
    for (const p of activeProjects()) {
      const info = projectInfo(p);
      if (info.idle === null || info.idle < 5) continue;
      out.push({ id: `stale:${p.id}:${weekStart(today)}`, prio: 1, icon: 'pause', text: `“${p.name}” lleva ${info.idle} días sin avances. ¿Lo retomas o lo pausas por ahora?`, action: { label: 'Abrir', href: `#/goal/${p.id}` }, secondary: { label: 'Pausar', act: 'pause-project', id: p.id } });
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
      ['milestone1', 'Primer hito', 'Cerraste tu primer hito.', msDone, 1],
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
export const heatmap = (weeks = 18) => heatmapOf(activeDays(), dayKey(), weeks);

export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; };
export const firstName = () => cap((store.profile().display_name || '').trim().split(/\s+/)[0] || '');
