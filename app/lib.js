// Utilidades sin dependencias: fechas en hora local, escape de HTML, ids.

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return fmtUuid(b);
}

const fmtUuid = b => [...b].map(x => x.toString(16).padStart(2, '0')).join('').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');

// UUID determinista (SHA-256 del texto): la misma entrada produce el mismo id → migraciones idempotentes.
export async function stableUuid(text) {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  const b = hash.slice(0, 16);
  b[6] = (b[6] & 0x0f) | 0x50;
  b[8] = (b[8] & 0x3f) | 0x80;
  return fmtUuid(b);
}

export const nowIso = () => new Date().toISOString();
export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
export const time = v => (v ? Date.parse(v) || 0 : 0);

// ---------- fechas (día local YYYY-MM-DD) ----------
const pad = n => String(n).padStart(2, '0');
export const dayKey = (d = new Date()) => { d = d instanceof Date ? d : new Date(d); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const parseDay = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k, n) => { const d = parseDay(k); d.setDate(d.getDate() + n); return dayKey(d); };
export const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 86400000);
export const weekStart = k => { const d = parseDay(k); return addDays(k, -((d.getDay() + 6) % 7)); }; // lunes
export const monthStart = k => k.slice(0, 8) + '01';
export const isToday = iso => dayKey(new Date(iso)) === dayKey();

const LOCALE = 'es';
export const fmtTime = iso => new Date(iso).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
export const fmtDayShort = k => parseDay(k).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
export const fmtDayLong = k => parseDay(k).toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtWeekday = k => parseDay(k).toLocaleDateString(LOCALE, { weekday: 'short' }).replace('.', '');
export const fmtMonth = k => parseDay(k).toLocaleDateString(LOCALE, { month: 'short' }).replace('.', '');
export const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function dayLabel(k) {
  const diff = daysBetween(k, dayKey());
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7) return cap(parseDay(k).toLocaleDateString(LOCALE, { weekday: 'long' }));
  return cap(fmtDayLong(k));
}

export function ago(iso) {
  if (!iso) return '';
  const days = daysBetween(dayKey(new Date(iso)), dayKey());
  if (days <= 0) {
    const min = Math.round((Date.now() - time(iso)) / 60000);
    if (min < 1) return 'ahora';
    if (min < 60) return `hace ${min} min`;
    return `hace ${Math.round(min / 60)} h`;
  }
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  return fmtDayShort(dayKey(new Date(iso)));
}

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// Normaliza texto para comparar: minúsculas, sin tildes ni signos.
export const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9#\s]/g, ' ').replace(/\s+/g, ' ').trim();
