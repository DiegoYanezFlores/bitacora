// Sincronización por filas con Supabase.
// Subida: cola persistente de cambios (outbox) → upsert por lotes. Bajada: filas con synced_at posterior al cursor.
// Conflictos: gana la edición más reciente (trigger bt_sync_row en el servidor + comparación local).
import * as db from './db.js';
import * as store from './store.js';
import { api, token, ENABLED, ApiError } from './api.js';

const ORDER = ['projects', 'milestones', 'tasks', 'activities']; // respeta las claves foráneas
const CHUNK = 200;
const OVERLAP_MS = 30000; // solapamiento de seguridad para commits concurrentes
const SERVER_ONLY = ['synced_at'];

export const state = { status: 'idle', error: '', lastSync: null };

function setStatus(status, error = '') {
  state.status = status;
  state.error = error;
  store.emit();
}

let running = null;
let again = false;

export function syncNow() {
  if (running) { again = true; return running; }
  running = run().finally(() => {
    running = null;
    if (again) { again = false; syncNow(); }
  });
  return running;
}

async function run() {
  if (!ENABLED || store.session.guest || !store.session.userId) { setStatus(store.session.guest ? 'guest' : 'idle'); return; }
  if (!navigator.onLine) { setStatus('offline'); return; }
  setStatus('syncing');
  try {
    const t = await token();
    if (!t) return;
    await pushProfile(t);
    await push(t);
    await pull(t);
    await pullProfile(t);
    await pushEvents(t);
    state.lastSync = new Date().toISOString();
    db.kvSet('lastSync', state.lastSync);
    setStatus(store.pendingCount() ? 'pending' : 'ok');
  } catch (e) {
    if (e instanceof ApiError && (e.code === 'PGRST205' || e.status === 404)) setStatus('migration', 'Falta aplicar la migración 002 en Supabase.');
    else if (e instanceof TypeError || !navigator.onLine) setStatus('offline');
    else setStatus('error', e.message);
  }
}

const payload = row => {
  const out = { ...row, user_id: store.session.userId };
  SERVER_ONLY.forEach(k => delete out[k]);
  return out;
};

async function upsert(t, table, rows) {
  await api(`/rest/v1/${table}?on_conflict=id`, {
    method: 'POST', token: t, body: rows.map(payload),
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
  });
}

async function push(t) {
  const keys = store.pendingKeys();
  if (!keys.length) return;
  for (const table of ORDER) {
    const mine = keys.filter(k => k.startsWith(table + ':'));
    for (let i = 0; i < mine.length; i += CHUNK) {
      const batch = mine.slice(i, i + CHUNK).map(k => [k, db.get(table, k.slice(table.length + 1))]).filter(([, r]) => r);
      if (!batch.length) continue;
      const sent = batch.map(([k, r]) => [k, r.updated_at]);
      try {
        await upsert(t, table, batch.map(([, r]) => r));
      } catch (e) {
        if (!(e instanceof ApiError) || e.status === 401 || e.status === 404 || e.status >= 500) throw e;
        // Un registro inválido no debe bloquear la cola: se reintenta uno a uno y se aparta el que falle.
        for (const [k, r] of batch) {
          try { await upsert(t, table, [r]); } catch (err) {
            if (!(err instanceof ApiError) || err.status >= 500 || err.status === 401) throw err;
            const bad = db.kvGet('syncRejected', []);
            bad.push({ key: k, error: err.message, at: new Date().toISOString() });
            db.kvSet('syncRejected', bad.slice(-50));
          }
        }
      }
      // Solo sale de la cola lo que no cambió mientras se subía.
      store.clearPending(sent.filter(([k, at]) => { const r = db.get(table, k.slice(table.length + 1)); return r && r.updated_at === at; }).map(([k]) => k));
    }
  }
}

async function pull(t) {
  const pending = new Set(store.pendingKeys());
  let changed = false;
  for (const table of ORDER) {
    let cursor = db.kvGet(`cursor:${table}`, '1970-01-01T00:00:00Z');
    for (;;) {
      const since = new Date(Date.parse(cursor) - OVERLAP_MS).toISOString();
      const rows = await api(`/rest/v1/${table}?select=*&synced_at=gt.${encodeURIComponent(since)}&order=synced_at.asc&limit=1000`, { token: t });
      for (const r of rows) if (store.applyRemote(table, r, pending)) changed = true;
      if (rows.length) cursor = rows[rows.length - 1].synced_at;
      db.kvSet(`cursor:${table}`, cursor);
      if (rows.length < 1000) break;
    }
  }
  if (changed) store.emit();
}

const PROFILE_FIELDS = ['display_name', 'timezone', 'focus_areas', 'prefs', 'onboarded_at', 'migrated_v1_at', 'updated_at'];

async function pushProfile(t) {
  if (!db.kvGet('profileDirty')) return;
  const p = store.profile();
  const body = { id: store.session.userId };
  PROFILE_FIELDS.forEach(k => { if (p[k] !== undefined) body[k] = p[k]; });
  if (!body.updated_at) body.updated_at = new Date().toISOString();
  await api('/rest/v1/profiles?on_conflict=id', { method: 'POST', token: t, body, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } });
  if (store.profile().updated_at === body.updated_at) db.kvSet('profileDirty', false);
}

async function pullProfile(t) {
  const rows = await api(`/rest/v1/profiles?select=*&id=eq.${store.session.userId}`, { token: t });
  const remote = rows[0];
  if (!remote) return;
  const local = store.profile();
  if (db.kvGet('profileDirty') && Date.parse(local.updated_at) > Date.parse(remote.updated_at)) return;
  const next = {};
  PROFILE_FIELDS.forEach(k => { next[k] = remote[k]; });
  // El nombre de Google/registro solo se usa si el usuario no ha puesto uno.
  if (!next.display_name && local.display_name) next.display_name = local.display_name;
  db.kvSet('profile', { ...local, ...next });
  store.emit();
}

async function pushEvents(t) {
  const q = db.kvGet('events', []);
  if (!q.length) return;
  if (!store.prefs().analytics) { db.kvSet('events', []); return; }
  await api('/rest/v1/events', { method: 'POST', token: t, body: q.map(e => ({ ...e, user_id: store.session.userId })), headers: { Prefer: 'return=minimal' } });
  db.kvSet('events', db.kvGet('events', []).slice(q.length));
}

// Borra en el servidor todas las filas del usuario (derecho de supresión desde la app).
export async function deleteRemoteData() {
  const t = await token();
  if (!t) return;
  for (const table of [...ORDER].reverse().concat('events')) {
    await api(`/rest/v1/${table}?user_id=eq.${store.session.userId}`, { method: 'DELETE', token: t, headers: { Prefer: 'return=minimal' } });
  }
}

// Lee el documento v1 del servidor (solo para la migración).
export async function fetchV1Doc() {
  const t = await token();
  if (!t) return null;
  try {
    const rows = await api(`/rest/v1/bitacora_state?select=data&user_id=eq.${store.session.userId}`, { token: t });
    return rows && rows[0] ? rows[0].data : null;
  } catch (e) { return null; }
}

// Programación: al volver a la app, al recuperar conexión, tras cambios y cada minuto con la app visible.
let timer = null;
let autoStarted = false;
export function schedule(ms = 1200) {
  clearTimeout(timer);
  timer = setTimeout(syncNow, ms);
}
export function startAutoSync() {
  state.lastSync = db.kvGet('lastSync');
  if (autoStarted) { syncNow(); return; } // ya hay temporizador y escuchas: no se duplican
  autoStarted = true;
  window.addEventListener('online', () => syncNow());
  window.addEventListener('offline', () => setStatus('offline'));
  document.addEventListener('visibilitychange', () => { if (!document.hidden || store.pendingCount()) syncNow(); });
  setInterval(() => { if (!document.hidden) syncNow(); }, 60000);
  syncNow();
}
