// Calendario: planificación temporal. Funciones puras sobre fechas de calendario (YYYY-MM-DD),
// nunca marcas de tiempo, para que "25 de septiembre" sea el 25 en cualquier zona horaria.
//
// Tres conceptos que no se mezclan (plan §23):
//   due_date    = cuándo planeaba hacerlo   → tarea pendiente en ese día
//   completed_at= cuándo lo terminé         → tarea completada
//   occurred_at = cuándo ocurrió de verdad  → actividad registrada
// Planificar nunca cuenta como trabajo: las actividades solo salen de lo registrado.

import { dayKey, addDays, parseDay, weekStart } from '../lib.js';
import { wasDone, notDone as notDoneTask, isOpen } from './outcomes.js';

export const monthKeyOf = day => day.slice(0, 7) + '-01';
export const addMonths = (monthKey, n) => {
  const d = parseDay(monthKey);
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return dayKey(d);
};

// Rejilla del mes: siempre semanas completas de lunes a domingo (incluye días vecinos, marcados).
export function monthGrid(monthKey) {
  const first = monthKeyOf(monthKey);
  const start = weekStart(first);
  const month = first.slice(0, 7);
  const last = addDays(addMonths(first, 1), -1);
  const weeks = [];
  let day = start;
  while (day <= last) { // una semana más mientras quede algún día del mes
    const week = [];
    for (let i = 0; i < 7; i++) { week.push({ day, outside: day.slice(0, 7) !== month }); day = addDays(day, 1); }
    weeks.push(week);
  }
  return weeks;
}

// Semana (lunes a domingo) que contiene el día dado.
export const weekGrid = day => Array.from({ length: 7 }, (_, i) => ({ day: addDays(weekStart(day), i), outside: false }));

// Una tarea está vencida si su fecha ya pasó y sigue abierta. Sin culpa: es solo un estado.
export const isOverdue = (task, today) => Boolean(task.due_date) && isOpen(task) && task.due_date < today;

// Índice día → { pending, done, notDone, moved, activities } con lo que toca ver en el calendario.
// Las tareas se reparten por due_date (lo planificado) y las actividades por su día real.
// `moved` son tareas que ese día estaban previstas y se pasaron a otra fecha: el día conserva su historia.
export function indexByDay({ tasks = [], activities = [], taskLog = [], dayOfActivity, project = null }) {
  const map = new Map();
  const cell = day => {
    if (!map.has(day)) map.set(day, { day, pending: [], done: [], notDone: [], moved: [], activities: [] });
    return map.get(day);
  };
  const byId = new Map();
  for (const t of tasks) {
    byId.set(t.id, t);
    if (!t.due_date) continue; // sin fecha: nunca se coloca en un día inventado
    if (project && t.project_id !== project) continue;
    cell(t.due_date)[wasDone(t) ? 'done' : notDoneTask(t) ? 'notDone' : 'pending'].push(t);
  }
  for (const a of activities) {
    if (project && a.project_id !== project) continue;
    cell(dayOfActivity(a)).activities.push(a);
  }
  // Movimientos: la tarea vive ahora en su nueva fecha, pero el día previsto guarda lo que pasó.
  for (const e of taskLog) {
    if (e.deleted_at || e.type !== 'rescheduled' || !e.from_date) continue;
    const task = byId.get(e.task_id);
    if (!task || (project && task.project_id !== project)) continue;
    if (task.due_date === e.from_date) continue; // volvió al mismo día: no hay nada que contar
    cell(e.from_date).moved.push({ task, to: e.to_date, note: e.note || '' });
  }
  return map;
}

export const EMPTY_CELL = { pending: [], done: [], notDone: [], moved: [], activities: [] };

// Resumen de un día para pintar la celda: cantidades y si hay algo vencido.
export function daySummary(cell, day, today) {
  const c = cell || EMPTY_CELL;
  const overdue = c.pending.filter(t => day < today).length;
  const notDoneN = (c.notDone || []).length;
  const movedN = (c.moved || []).length;
  return {
    pending: c.pending.length,
    done: c.done.length,
    notDone: notDoneN,
    moved: movedN,
    activities: c.activities.length,
    overdue,
    total: c.pending.length + c.done.length + notDoneN + movedN + c.activities.length,
    isToday: day === today,
    isPast: day < today
  };
}

// Tareas abiertas sin fecha: se cuentan aparte, nunca se colocan en el calendario.
export const undatedOpen = (tasks, project = null) =>
  tasks.filter(t => isOpen(t) && !t.due_date && (!project || t.project_id === project));

// Vencidas de días anteriores: se muestran juntas para poder reprogramarlas.
export const overdueTasks = (tasks, today, project = null) =>
  tasks.filter(t => isOverdue(t, today) && (!project || t.project_id === project));

// Atajos de fecha para reprogramar (plan §10). "Próxima semana" = lunes siguiente.
export function dateShortcuts(today) {
  return [
    { key: 'today', label: 'Hoy', day: today },
    { key: 'tomorrow', label: 'Mañana', day: addDays(today, 1) },
    { key: 'next-week', label: 'Próxima semana', day: addDays(weekStart(today), 7) }
  ];
}
