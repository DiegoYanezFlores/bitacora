// Resumen de un periodo (semana, mes o año) con desplazamiento: 0 = actual, -1 = anterior…
// Función pura: recibe hoy, las colecciones y cómo obtener el día de una actividad.
import { addDays, weekStart, daysBetween, parseDay, dayKey } from '../lib.js';

export function periodOf(range, offset, { today, activities, tasks, milestones, project, dayOf }) {
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
  const acts = activities.filter(a => { const k = dayOf(a); return k >= start && k <= end; });
  const inRange = iso => { if (!iso) return false; const k = dayKey(new Date(iso)); return k >= start && k <= end; };
  const counts = new Map();
  acts.forEach(a => { const k = dayOf(a); counts.set(k, (counts.get(k) || 0) + 1); });
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
    tasksDone: tasks.filter(t => t.status === 'done' && inRange(t.completed_at)).length,
    milestonesDone: milestones.filter(m => inRange(m.done_at)).length,
    wins: acts.filter(a => a.kind === 'win').length,
    byProject: [...perProject.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ project: project(id), count: n }))
  };
}
