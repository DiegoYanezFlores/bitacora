// Resultado real de una tarea: qué ocurrió, no si el usuario "cumplió".
// Una tarea se cierra con un resultado; solo `done` significa que se hizo.
// Nada de esto penaliza: las demás opciones no restan racha, avance ni logros,
// porque el avance sale de hitos y criterios y la constancia, de lo registrado.
//
// Fechas: `due_date` es la fecha prevista (fecha de calendario, YYYY-MM-DD) y se conserva
// en el registro cuando la tarea se mueve, para no perder lo que estaba planificado.

export const RESULTS = {
  done: { label: 'Completada', short: 'Completada', icon: 'check', did: true },
  not_done: { label: 'No realizada', short: 'No realizada', icon: 'circle', did: false },
  no_show: { label: 'No realizada — falta de asistencia', short: 'Falta de asistencia', icon: 'user', did: false },
  blocked: { label: 'No realizada — inconveniente', short: 'Inconveniente', icon: 'wait', did: false },
  canceled: { label: 'Cancelada', short: 'Cancelada', icon: 'x', did: false }
};

export const RESULT_KEYS = Object.keys(RESULTS);
export const isResult = r => Object.prototype.hasOwnProperty.call(RESULTS, r);
export const resultInfo = r => (isResult(r) ? RESULTS[r] : null);

// Una tarea está cerrada cuando su estado es `done`, con cualquier resultado.
export const isClosed = t => t.status === 'done';
// Se hizo de verdad: cerrada y con resultado `done` (o sin resultado, como las tareas de antes de 005).
export const wasDone = t => isClosed(t) && (!t.result || t.result === 'done');
// Cerrada sin haberse hecho: información real, nunca un fallo del usuario.
export const notDone = t => isClosed(t) && Boolean(t.result) && t.result !== 'done';
export const isOpen = t => !isClosed(t);

// Cómo se lee el estado de una tarea en una lista, sin lenguaje de culpa.
export function outcomeLabel(task) {
  if (!isClosed(task)) return '';
  const info = resultInfo(task.result);
  return info && !info.did ? info.short : 'Completada';
}

// Cambios que cierra una tarea con un resultado. `done` es la única que marca completada.
export function closePatch(result, { note = '', at = new Date().toISOString() } = {}) {
  if (!isResult(result)) throw new Error('Resultado desconocido: ' + result);
  return {
    status: 'done',
    result,
    result_note: String(note || '').slice(0, 500),
    result_at: at,
    completed_at: result === 'done' ? at : null
  };
}

// Reabrir: vuelve a estar pendiente y se borra el resultado (no se inventa un historial nuevo).
export const reopenPatch = () => ({ status: 'todo', result: null, result_note: '', result_at: null, completed_at: null });

// Reprogramar: la tarea sigue pendiente, solo cambia el día previsto.
export function reschedulePatch(day, task = {}) {
  if (day && !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Fecha inválida: ' + day);
  return { due_date: day || null, status: isClosed(task) ? 'todo' : (task.status || 'todo'), result: null, result_note: '', result_at: null, completed_at: null };
}

// Fila del registro (task_log) para cada cosa que le pasa a una tarea.
export const closeEntry = (task, result, note = '', at = new Date().toISOString()) =>
  ({ task_id: task.id, type: 'closed', result, note: String(note || '').slice(0, 500), from_date: task.due_date || null, to_date: null, occurred_at: at });
export const rescheduleEntry = (task, to, note = '', at = new Date().toISOString()) =>
  ({ task_id: task.id, type: 'rescheduled', result: null, note: String(note || '').slice(0, 500), from_date: task.due_date || null, to_date: to || null, occurred_at: at });
export const reopenEntry = (task, at = new Date().toISOString()) =>
  ({ task_id: task.id, type: 'reopened', result: null, note: '', from_date: task.due_date || null, to_date: null, occurred_at: at });

// Primera fecha prevista de una tarea: la más antigua del registro, o la actual si nunca se movió.
export function plannedDate(task, log = []) {
  const moves = log.filter(e => !e.deleted_at && e.task_id === task.id && e.type === 'rescheduled' && e.from_date);
  if (!moves.length) return task.due_date || null;
  return moves.reduce((min, e) => (min && min <= e.from_date ? min : e.from_date), null) || task.due_date || null;
}

// Qué pasó con tareas en un día concreto: cierres sin hacer y movimientos a otra fecha.
// Sirve para que el calendario conserve el día en el que estaba planificado.
export function dayEvents(log, day) {
  return log.filter(e => !e.deleted_at && e.from_date === day && (e.type === 'rescheduled' || (e.type === 'closed' && e.result && e.result !== 'done')));
}
