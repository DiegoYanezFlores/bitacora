// Actividades recurrentes: una serie es UNA tarea con su regla; los días concretos se calculan aquí.
// Solo se guarda una fila por ocurrencia cuando pasa algo con ella (se completa, se mueve, se omite),
// así un semestre de clases no llena la base ni duplica filas al sincronizar.
//
// Todo son fechas de calendario (YYYY-MM-DD) y horas locales (HH:MM): nunca marcas de tiempo,
// para que "los lunes a las 07:00" sea eso en cualquier zona horaria.

import { addDays, parseDay, dayKey, weekStart } from '../lib.js';

export const DAYS = [['mo', 'lunes', 'L'], ['tu', 'martes', 'M'], ['we', 'miércoles', 'X'], ['th', 'jueves', 'J'], ['fr', 'viernes', 'V'], ['sa', 'sábado', 'S'], ['su', 'domingo', 'D']];
export const FREQS = { daily: 'Cada día', weekly: 'Cada semana', monthly: 'Cada mes' };
const DAY_INDEX = { mo: 1, tu: 2, we: 3, th: 4, fr: 5, sa: 6, su: 0 }; // getDay(): domingo = 0
const CODE_OF = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
export const MAX_OCCURRENCES = 400; // tope de seguridad por consulta: nunca se genera de más

export const codeOfDay = day => CODE_OF[parseDay(day).getDay()];
export const isSeries = task => Boolean(task && task.repeat && normalizeRule(task.repeat));
export const isOccurrence = task => Boolean(task && task.series_id && task.occurrence_date);

// Deja la regla en una forma válida, o null si no describe nada repetible.
export function normalizeRule(rule) {
  if (!rule || typeof rule !== 'object') return null;
  const freq = Object.prototype.hasOwnProperty.call(FREQS, rule.freq) ? rule.freq : null;
  if (!freq) return null;
  const interval = Math.min(30, Math.max(1, Math.round(Number(rule.interval) || 1)));
  const byday = Array.isArray(rule.byday) ? [...new Set(rule.byday.filter(d => d in DAY_INDEX))] : [];
  const until = /^\d{4}-\d{2}-\d{2}$/.test(rule.until || '') ? rule.until : null;
  const bymonthday = Number(rule.bymonthday) >= 1 && Number(rule.bymonthday) <= 31 ? Math.round(Number(rule.bymonthday)) : null;
  return { freq, interval, byday: freq === 'weekly' ? byday : [], bymonthday: freq === 'monthly' ? bymonthday : null, until };
}

// ¿Toca este día, según la regla y el día de inicio?
export function matches(rule, startDay, day) {
  const r = normalizeRule(rule);
  if (!r || !startDay || day < startDay) return false;
  if (r.until && day > r.until) return false;
  const start = parseDay(startDay);
  const d = parseDay(day);
  const diasDesde = Math.round((d - start) / 86400000);

  if (r.freq === 'daily') return diasDesde % r.interval === 0;

  if (r.freq === 'weekly') {
    const semanas = Math.floor((parseDay(day) - parseDay(weekStart(startDay))) / (7 * 86400000));
    if (semanas % r.interval !== 0) return false;
    // Sin días marcados, se repite el mismo día de la semana que el de inicio.
    const dias = r.byday.length ? r.byday : [codeOfDay(startDay)];
    return dias.some(code => DAY_INDEX[code] === d.getDay());
  }

  // Mensual: el mismo número de día (o el elegido). Si el mes no tiene ese día, ese mes se salta.
  const objetivo = r.bymonthday || start.getDate();
  if (d.getDate() !== objetivo) return false;
  const meses = (d.getFullYear() - start.getFullYear()) * 12 + (d.getMonth() - start.getMonth());
  return meses >= 0 && meses % r.interval === 0;
}

// Días en los que toca, dentro de una ventana. Siempre acotado: nunca bucles infinitos.
export function daysBetween(series, from, to) {
  const r = normalizeRule(series && series.repeat);
  const start = series && (series.due_date || series.start_date);
  if (!r || !start) return [];
  const desde = from > start ? from : start;
  const hasta = r.until && r.until < to ? r.until : to;
  const out = [];
  for (let d = desde; d <= hasta && out.length < MAX_OCCURRENCES; d = addDays(d, 1)) {
    if (matches(r, start, d)) out.push(d);
  }
  return out;
}

// Siguiente día en que toca, a partir de uno dado (null si la serie ya terminó).
export function nextDay(series, fromDay) {
  const r = normalizeRule(series && series.repeat);
  const start = series && series.due_date;
  if (!r || !start) return null;
  const limite = r.until || addDays(fromDay, 366 * 2);
  for (let d = fromDay > start ? fromDay : start; d <= limite; d = addDays(d, 1)) {
    if (matches(r, start, d)) return d;
  }
  return null;
}

// Ocurrencias de una serie en una ventana, ya cruzadas con las que están guardadas.
// Una ocurrencia guardada manda sobre la calculada (puede estar hecha, movida o cancelada).
export function expand(series, from, to, saved = []) {
  const porDia = new Map();
  for (const s of saved) {
    if (s.deleted_at || s.series_id !== series.id || !s.occurrence_date) continue;
    porDia.set(s.occurrence_date, s);
  }
  const out = daysBetween(series, from, to).map(day => {
    const row = porDia.get(day);
    // Si la guardada se movió a otro día, ese día ya no tiene nada que mostrar aquí.
    if (row && row.due_date && row.due_date !== day) return null;
    return {
      day,
      series,
      saved: row || null,
      title: (row && row.title) || series.title,
      start_time: (row && row.start_time) || series.start_time || null,
      end_time: (row && row.end_time) || series.end_time || null,
      status: row ? row.status : 'todo',
      result: row ? row.result : null
    };
  }).filter(Boolean);
  // Las ocurrencias guardadas que se movieron a un día dentro de la ventana también se ven.
  for (const s of porDia.values()) {
    if (s.due_date && s.due_date !== s.occurrence_date && s.due_date >= from && s.due_date <= to) {
      out.push({ day: s.due_date, series, saved: s, title: s.title || series.title, start_time: s.start_time || series.start_time || null, end_time: s.end_time || series.end_time || null, status: s.status, result: s.result, movedFrom: s.occurrence_date });
    }
  }
  return out.sort((a, b) => a.day.localeCompare(b.day) || String(a.start_time || '').localeCompare(String(b.start_time || '')));
}

// Cortar una serie el día anterior a `day`: se usa al editar "esta y las siguientes".
export const untilBefore = day => addDays(day, -1);

// Agenda de un día: lo que tiene hora, ordenado, con los huecos libres entre medias.
export function agenda(items, { gapMin = 30 } = {}) {
  const conHora = items.filter(i => i.start_time).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const sinHora = items.filter(i => !i.start_time);
  const min = t => Number(String(t).slice(0, 2)) * 60 + Number(String(t).slice(3, 5));
  const hhmm = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  const filas = [];
  let anterior = null;
  for (const item of conHora) {
    if (anterior && anterior.end_time) {
      const hueco = min(item.start_time) - min(anterior.end_time);
      if (hueco >= gapMin) filas.push({ kind: 'gap', from: anterior.end_time, to: item.start_time, minutes: hueco, label: `${hhmm(hueco)} libre` });
    }
    filas.push({ kind: 'item', item });
    if (!anterior || !anterior.end_time || (item.end_time && min(item.end_time) > min(anterior.end_time))) anterior = item;
  }
  return { rows: filas, untimed: sinHora };
}

// Choques de horario: se avisan, pero nunca se impide guardarlos (lo decide el usuario).
export function conflicts(items) {
  const conHora = items.filter(i => i.start_time && i.end_time).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const out = [];
  for (let i = 1; i < conHora.length; i++) {
    const prev = conHora[i - 1];
    const cur = conHora[i];
    if (cur.start_time < prev.end_time) out.push([prev, cur]);
  }
  return out;
}

// Texto claro de la regla: "De lunes a viernes · 07:00–11:00 · hasta el 28 feb".
export function describe(series, { fmtDay = d => d } = {}) {
  const r = normalizeRule(series && series.repeat);
  if (!r) return '';
  const partes = [];
  if (r.freq === 'daily') partes.push(r.interval === 1 ? 'Cada día' : `Cada ${r.interval} días`);
  else if (r.freq === 'weekly') {
    const codes = r.byday.length ? r.byday : [codeOfDay(series.due_date || dayKey())];
    const nombres = DAYS.filter(([c]) => codes.includes(c)).map(([, n]) => n);
    const laborables = codes.length === 5 && ['mo', 'tu', 'we', 'th', 'fr'].every(c => codes.includes(c));
    const texto = laborables ? 'De lunes a viernes' : nombres.length === 1 ? `Cada ${nombres[0]}` : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`;
    partes.push(r.interval === 1 ? texto : `${texto}, cada ${r.interval} semanas`);
  } else {
    const dia = r.bymonthday || (series.due_date ? parseDay(series.due_date).getDate() : 1);
    partes.push(r.interval === 1 ? `El día ${dia} de cada mes` : `El día ${dia}, cada ${r.interval} meses`);
  }
  if (series.start_time) partes.push(series.end_time ? `${series.start_time}–${series.end_time}` : series.start_time);
  if (r.until) partes.push(`hasta el ${fmtDay(r.until)}`);
  return partes.join(' · ');
}
