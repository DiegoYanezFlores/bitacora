// Preferencias del usuario: una sola fuente de verdad para apariencia, celebraciones y frases.
// Viven en profiles.prefs (jsonb ya existente y ya sincronizado): ninguna tabla nueva.
// Todo tiene un valor por defecto válido, así que la app se ve bien sin configurar nada,
// y cualquier valor desconocido o corrupto se ignora en lugar de romper la pantalla.

export const PALETTES = {
  // key: [nombre, familia]. Los colores concretos los define el CSS; aquí solo vive la elección.
  cobalto: ['Cobalto', 'base'],
  'pastel-lavanda': ['Lavanda', 'pastel'],
  'pastel-menta': ['Menta', 'pastel'],
  'pastel-durazno': ['Durazno', 'pastel'],
  'neon-magenta': ['Magenta neón', 'psicodelica'],
  'neon-citrico': ['Cítrico neón', 'psicodelica'],
  tierra: ['Tierra', 'natural'],
  bosque: ['Bosque', 'natural'],
  grafito: ['Grafito', 'minimalista'],
  medianoche: ['Medianoche', 'oscura']
};
export const PALETTE_FAMILIES = [['base', 'Base'], ['pastel', 'Pastel'], ['psicodelica', 'Psicodélicas'], ['natural', 'Naturales'], ['minimalista', 'Minimalistas'], ['oscura', 'Oscuras']];

export const CELEBRATE = { off: 'Ninguna', soft: 'Discreta', full: 'Completa' };
export const QUOTE_SPOTS = { off: 'Ocultas', home: 'Solo en Inicio', all: 'Inicio y esquina' };

// Fondo: 'none' (liso), 'library' (imagen incluida) o 'photo' (foto del usuario).
export const DEFAULT_BACKGROUND = { kind: 'none', id: '', fit: 'cover', dim: 35, blur: 0, rotate: false };

export const DEFAULTS = {
  theme: 'system',
  palette: 'cobalto',
  background: DEFAULT_BACKGROUND,
  celebrate: 'full',
  quotes: 'all',
  quoteTopics: [],       // vacío = todas las categorías
  weeklyGoal: 4,
  activeWeekDays: 2,
  sound: false,
  haptics: true,
  notices: 'all',
  analytics: true,
  media: []              // fotos propias: { id, path, name, at } — el archivo vive en el almacén
};

const clamp = (n, a, b) => Math.min(b, Math.max(a, Number(n)));
const oneOf = (v, obj, fallback) => (Object.prototype.hasOwnProperty.call(obj, v) ? v : fallback);
export const MAX_MEDIA = 12; // tope para que prefs quepa de sobra en el límite de 8 KB del servidor

// Normaliza el fondo guardado: cualquier campo inválido vuelve a su valor por defecto.
export function normalizeBackground(bg) {
  const b = bg && typeof bg === 'object' ? bg : {};
  const kind = ['none', 'library', 'photo'].includes(b.kind) ? b.kind : 'none';
  return {
    kind,
    id: kind === 'none' ? '' : String(b.id || '').slice(0, 120),
    fit: ['cover', 'contain', 'top', 'bottom'].includes(b.fit) ? b.fit : 'cover',
    dim: isFinite(Number(b.dim)) ? clamp(b.dim, 0, 80) : DEFAULT_BACKGROUND.dim,
    blur: isFinite(Number(b.blur)) ? clamp(b.blur, 0, 12) : 0,
    rotate: Boolean(b.rotate)
  };
}

function normalizeMedia(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter(m => m && typeof m === 'object' && m.id)
    .map(m => ({ id: String(m.id).slice(0, 64), path: String(m.path || '').slice(0, 200), name: String(m.name || '').slice(0, 80), at: String(m.at || '') }))
    .slice(0, MAX_MEDIA);
}

// Preferencias efectivas: lo guardado sobre los valores por defecto, con todo validado.
export function resolve(saved = {}) {
  const p = saved && typeof saved === 'object' ? saved : {};
  return {
    ...DEFAULTS,
    ...p,
    theme: oneOf(p.theme, { system: 1, light: 1, dark: 1 }, DEFAULTS.theme),
    palette: oneOf(p.palette, PALETTES, DEFAULTS.palette),
    celebrate: oneOf(p.celebrate, CELEBRATE, DEFAULTS.celebrate),
    quotes: oneOf(p.quotes, QUOTE_SPOTS, DEFAULTS.quotes),
    quoteTopics: Array.isArray(p.quoteTopics) ? p.quoteTopics.filter(t => typeof t === 'string').slice(0, 12) : [],
    background: normalizeBackground(p.background),
    media: normalizeMedia(p.media),
    weeklyGoal: isFinite(Number(p.weeklyGoal)) ? clamp(p.weeklyGoal, 1, 7) : DEFAULTS.weeklyGoal,
    activeWeekDays: isFinite(Number(p.activeWeekDays)) ? clamp(p.activeWeekDays, 1, 7) : DEFAULTS.activeWeekDays
  };
}

// Qué fondo toca pintar ahora. Devuelve null si no hay ninguno (fondo liso, siempre legible).
// Con rotación activa, la imagen cambia por día: estable dentro del mismo día, sin parpadeos.
export function activeBackground(prefs, { day = '', library = [] } = {}) {
  const bg = normalizeBackground(prefs.background);
  if (bg.kind === 'none') return null;
  const pool = bg.kind === 'photo' ? (prefs.media || []) : library;
  if (!pool.length) return null;
  let item = pool.find(x => x.id === bg.id) || pool[0];
  if (bg.rotate && pool.length > 1) {
    const n = [...String(day)].reduce((a, c) => a + c.charCodeAt(0), 0);
    item = pool[n % pool.length];
  }
  return { ...bg, item };
}

// ¿Se celebra? El usuario manda; si el sistema pide menos movimiento, se baja a lo discreto.
export function celebrationLevel(prefs, { reducedMotion = false } = {}) {
  const level = oneOf(prefs.celebrate, CELEBRATE, DEFAULTS.celebrate);
  if (level === 'off') return 'off';
  return reducedMotion ? 'soft' : level;
}

// Restaurar la apariencia por defecto sin tocar el resto de preferencias ni los datos.
export const resetAppearance = () => ({ palette: DEFAULTS.palette, background: { ...DEFAULT_BACKGROUND } });
