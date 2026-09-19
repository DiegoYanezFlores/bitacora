// Días activos, racha, semana y mapa de actividad.
// Funciones puras: reciben los datos y devuelven el resultado, sin leer db ni tocar el DOM (se prueban con node --test).
import { addDays, daysBetween, weekStart } from '../lib.js';

// Cuántas actividades hubo cada día: Map<'YYYY-MM-DD', n>.
export function countByDay(activities, dayOf) {
  const m = new Map();
  for (const a of activities) { const k = dayOf(a); m.set(k, (m.get(k) || 0) + 1); }
  return m;
}

// Racha actual (cuenta desde hoy, o desde ayer si hoy aún no hay nada) y la mejor de todo el historial.
export function streakOf(days, today) {
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
}

// Los 7 días de la semana que empieza en ws (lunes), con su conteo.
export function weekOf(days, ws, goal) {
  const list = Array.from({ length: 7 }, (_, i) => { const k = addDays(ws, i); return { key: k, count: days.get(k) || 0 }; });
  const active = list.filter(d => d.count).length;
  return { start: ws, days: list, active, goal, total: list.reduce((a, d) => a + d.count, 0) };
}

export const heatLevel = c => (c === 0 ? 0 : c === 1 ? 1 : c <= 3 ? 2 : c <= 5 ? 3 : 4);

// Columnas de semanas (lunes a domingo) que terminan en la semana de hoy.
export function heatmapOf(days, today, weeks) {
  const first = addDays(weekStart(today), -7 * (weeks - 1));
  const cols = [];
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let i = 0; i < 7; i++) {
      const k = addDays(first, w * 7 + i);
      const c = days.get(k) || 0;
      col.push({ key: k, count: c, future: k > today, level: heatLevel(c) });
    }
    cols.push(col);
  }
  return cols;
}
