// Celebraciones al terminar algo. Reglas:
//   - Solo celebra lo que de verdad se hizo: completar una tarea, cerrar un hito, terminar el día
//     o un objetivo. Planificar, sincronizar o repintar la pantalla nunca celebra.
//   - Cada cosa se celebra una sola vez: la clave de deduplicación lo garantiza aunque la acción
//     se repita por un reintento, una bajada del servidor o una recarga.
//   - El usuario manda: puede dejarlas discretas o apagarlas, y la preferencia del sistema de
//     reducir movimiento baja la intensidad sola.
//   - Nada de recompensas vacías: el mensaje dice lo que pasó, no halaga.

export const LEVELS = ['off', 'soft', 'full'];

// Intensidad del confeti por tipo de evento y nivel elegido (0 = sin confeti, solo el mensaje).
const PIECES = {
  task: { soft: 0, full: 28 },
  milestone: { soft: 0, full: 70 },
  day: { soft: 0, full: 55 },
  goal: { soft: 0, full: 110 },
  streak: { soft: 0, full: 40 }
};

// Mensajes sobrios: describen el hecho. Se eligen de forma estable (sin azar) para no sentirse máquina tragaperras.
const MESSAGES = {
  task: ['Hecho', 'Una menos', 'Tarea cerrada'],
  milestone: ['Hito cerrado', 'Un tramo menos', 'Hito conseguido'],
  day: ['Terminaste lo de hoy', 'Día completo', 'Todo lo de hoy, hecho'],
  goal: ['Objetivo completado', 'Lo terminaste'],
  streak: ['Días seguidos registrando', 'Sigues ahí']
};
const pick = (list, seed) => list[Math.abs([...String(seed)].reduce((a, c) => a + c.charCodeAt(0), 0)) % list.length];

// Rachas que merecen una mención. Ni cada día ni números inventados.
export const STREAK_MARKS = [7, 30, 100, 365];
export const streakMark = n => (STREAK_MARKS.includes(n) ? n : null);

// ¿Se terminó todo lo que tocaba hoy? Solo cuenta si de verdad había algo planificado.
export function dayComplete(tasksOfDay = []) {
  const cuentan = tasksOfDay.filter(t => t.status !== 'skipped');
  if (!cuentan.length) return false;
  return cuentan.every(t => t.status === 'done');
}

// Qué celebrar, con qué intensidad y con qué clave para no repetirlo.
export function plan(event, { level = 'full', reducedMotion = false } = {}) {
  if (!event || !PIECES[event.type]) return null;
  const nivel = level === 'off' ? 'off' : reducedMotion ? 'soft' : level;
  if (nivel === 'off') return null;
  const piezas = PIECES[event.type][nivel] || 0;
  const base = pick(MESSAGES[event.type], event.key || event.id || event.type);
  return {
    type: event.type,
    level: nivel,
    pieces: piezas,
    message: event.type === 'streak' ? `${event.n} ${base.toLowerCase()}` : base,
    detail: event.detail || '',
    key: event.key
  };
}

// Deduplicación: devuelve true solo la primera vez que se ve una clave.
export function firstTime(key, seen = {}) {
  if (!key) return true;
  return !Object.prototype.hasOwnProperty.call(seen, key);
}

// Registro de lo ya celebrado, acotado para no crecer sin fin.
export function remember(key, seen = {}, at = new Date().toISOString(), max = 200) {
  if (!key) return seen;
  const next = { ...seen, [key]: at };
  const claves = Object.keys(next);
  if (claves.length <= max) return next;
  const ordenadas = claves.sort((a, b) => String(next[a]).localeCompare(String(next[b]))).slice(claves.length - max);
  return Object.fromEntries(ordenadas.map(k => [k, next[k]]));
}

// Claves estables por evento: el mismo hecho produce siempre la misma clave.
export const taskKey = id => `task:${id}`;
export const milestoneKey = id => `ms:${id}`;
export const goalKey = id => `goal:${id}`;
export const dayKeyOf = day => `day:${day}`;
export const streakKey = n => `streak:${n}`;
