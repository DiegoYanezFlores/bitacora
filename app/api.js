// Cliente mínimo de Supabase (Auth + REST) con fetch. Sin SDK: cero dependencias.
const cfg = window.BITACORA_CONFIG || {};
export const BASE = String(cfg.supabaseUrl || '').trim().replace(/\/+$/, '');
const KEY = String(cfg.supabaseAnonKey || '').trim();
export const ENABLED = Boolean(BASE && KEY);
const SESSION_KEY = 'bitacora:session'; // misma clave que v1: quien ya tenía sesión sigue dentro

export class ApiError extends Error {
  constructor(message, status, code) { super(message); this.status = status; this.code = code; }
}

export async function api(path, { method = 'GET', body, token, headers = {}, signal } = {}) {
  const res = await fetch(BASE + path, {
    method,
    signal,
    headers: {
      apikey: KEY,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) {
    const msg = data && (data.msg || data.message || data.error_description || data.error);
    throw new ApiError(msg || 'HTTP ' + res.status, res.status, data && (data.code || data.error_code));
  }
  return data;
}

export function humanError(e) {
  const m = String((e && e.message) || '').toLowerCase();
  if (e instanceof TypeError) return 'Sin conexión. Inténtalo de nuevo.';
  if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.';
  if (m.includes('not confirmed')) return 'Confirma tu correo antes de entrar (revisa tu bandeja).';
  if (m.includes('already registered') || m.includes('already exists')) return 'Ese correo ya tiene cuenta. Entra con tu contraseña.';
  if (m.includes('password') && (m.includes('6') || m.includes('weak') || m.includes('short'))) return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('same') && m.includes('password')) return 'La nueva contraseña debe ser distinta de la anterior.';
  if (m.includes('email') && m.includes('rate limit')) return 'La app alcanzó su límite de correos por hora. Inténtalo más tarde o avisa a quien la administra.';
  if (m.includes('rate limit') || e.status === 429) return 'Demasiados intentos. Espera un minuto.';
  if (m.includes('email') && m.includes('invalid')) return 'Revisa el formato del correo.';
  if (e.code === 'PGRST205' || m.includes('schema cache')) return 'Falta aplicar la migración de la base de datos.';
  return (e && e.message) || 'Algo salió mal.';
}

// ---------- sesión ----------
function claims(token) {
  try {
    const b = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(b + '='.repeat((4 - (b.length % 4)) % 4)))));
  } catch (e) { return {}; }
}

function toSession(r) {
  const c = claims(r.access_token);
  const u = r.user || {};
  const meta = u.user_metadata || c.user_metadata || {};
  return {
    access_token: r.access_token,
    refresh_token: r.refresh_token,
    expires_at: Number(r.expires_at) || c.exp || Math.floor(Date.now() / 1000) + (Number(r.expires_in) || 3600),
    user: { id: u.id || c.sub, email: u.email || c.email || '', name: meta.full_name || meta.name || '' }
  };
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
}
function setSession(s) {
  try { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); } catch (e) { /* sin almacenamiento */ }
}

let refreshing = null;
// Devuelve un access token válido (renueva si caduca en <60 s). null si no hay sesión.
export async function token() {
  const s = getSession();
  if (!s) return null;
  if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
  if (!refreshing) {
    refreshing = api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: s.refresh_token } })
      .then(r => { const n = toSession(r); setSession(n); return n.access_token; })
      .catch(e => {
        if (e.status >= 400 && e.status < 500) { setSession(null); window.dispatchEvent(new Event('bitacora:signedout')); return null; }
        throw e; // sin red: se reintentará
      })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

export async function signIn(email, password) {
  const r = await api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
  const s = toSession(r);
  setSession(s);
  return s;
}

// Devuelve la sesión, o null si Supabase exige confirmar el correo.
export async function signUp(email, password, name) {
  const r = await api('/auth/v1/signup?redirect_to=' + encodeURIComponent(location.origin + '/'), {
    method: 'POST', body: { email, password, data: name ? { full_name: name } : {} }
  });
  if (r && r.access_token) { const s = toSession(r); setSession(s); return s; }
  return null;
}

export async function signOut() {
  const s = getSession();
  setSession(null);
  if (s) api('/auth/v1/logout', { method: 'POST', token: s.access_token }).catch(() => {});
}

export const recover = email =>
  api('/auth/v1/recover?redirect_to=' + encodeURIComponent(location.origin + '/'), { method: 'POST', body: { email } });

export async function updatePassword(password) {
  const t = await token();
  return api('/auth/v1/user', { method: 'PUT', token: t, body: { password } });
}

export function googleUrl() {
  return `${BASE}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(location.origin + '/')}`;
}

let providersCache = null;
export async function providers() {
  if (!ENABLED) return {};
  if (providersCache) return providersCache;
  try {
    const s = await api('/auth/v1/settings');
    providersCache = s.external || {};
  } catch (e) { providersCache = {}; }
  return providersCache;
}

// Procesa el regreso desde Supabase (confirmación, Google o recuperación): tokens en el hash de la URL.
// Devuelve { type: 'signin' | 'recovery' | 'error', message? } o null.
export function captureRedirect() {
  if (!location.hash || location.hash.startsWith('#/')) return null;
  const p = new URLSearchParams(location.hash.slice(1));
  let out = null;
  if (p.get('access_token') && p.get('refresh_token')) {
    setSession(toSession({ access_token: p.get('access_token'), refresh_token: p.get('refresh_token'), expires_at: p.get('expires_at') }));
    out = { type: p.get('type') === 'recovery' ? 'recovery' : 'signin' };
  } else if (p.get('error_description') || p.get('error')) {
    const code = p.get('error_code') || '';
    out = { type: 'error', message: code === 'otp_expired' ? 'El enlace expiró o ya se usó. Pide uno nuevo.' : (p.get('error_description') || 'No se pudo completar el acceso.').replace(/\+/g, ' ') };
  }
  if (out) history.replaceState(null, '', location.pathname + location.search + '#/');
  return out;
}
