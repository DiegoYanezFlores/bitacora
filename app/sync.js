// Sincronización por filas con Supabase.
// Subida: cola persistente de cambios (outbox) → upsert por lotes. Bajada: filas con synced_at posterior al cursor.
// Conflictos: gana la edición más reciente (trigger bt_sync_row en el servidor + comparación local).
import * as db from './db.js';
import * as store from './store.js';
import { api, token, ENABLED, ApiError } from './api.js';

// Transporte inyectable: las pruebas lo sustituyen por uno falso (tests/sync.test.js).
export const deps = { api, token };

const ORDER = db.TABLES; // padres antes que hijos: respeta las claves foráneas

// Tablas y columnas de la migración 003. Mientras el servidor no la tenga, no se suben ni se bajan
// (se quedan en la cola) y las columnas nuevas se quitan de lo que se envía.
const V3_TABLES = ['stages', 'criteria', 'evidence', 'reflections', 'achievements', 'day_marks', 'goal_log', 'recaps'];
// Igual con la migración 005 (resultado real de la tarea y su registro).
const V5_TABLES = ['task_log'];
const V5_COLUMNS = { tasks: ['result', 'result_note', 'result_at'] };
const V3_COLUMNS = {
  projects: ['template', 'completed_at', 'success_indicator'],
  milestones: ['stage_id', 'weight', 'description', 'expected_evidence', 'status'],
  tasks: ['milestone_id'],
  activities: ['milestone_id', 'criterion_id', 'duration_min'],
  profiles: ['vision']
};
export const schema = { v3: null, v5: null }; // null = sin comprobar en esta sesión
const skipped = () => [...(schema.v3 ? [] : V3_TABLES), ...(schema.v5 ? [] : V5_TABLES)];
const tables = () => ORDER.filter(t => !skipped().includes(t));

async function probe(path, t) {
  try {
    await deps.api(path, { token: t });
    return true;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.code === 'PGRST205')) return false;
    throw e;
  }
}

async function detectSchema(t) {
  if (schema.v3 === null) schema.v3 = await probe('/rest/v1/stages?select=id&limit=1', t);
  if (schema.v5 === null) schema.v5 = await probe('/rest/v1/task_log?select=id&limit=1', t);
}
const stripV3 = (table, row) => {
  if (!schema.v3) (V3_COLUMNS[table] || []).forEach(k => delete row[k]);
  if (!schema.v5) (V5_COLUMNS[table] || []).forEach(k => delete row[k]);
  return row;
};
const CHUNK = 200;
const OVERLAP_MS = 30000; // solapamiento de seguridad para commits concurrentes
const SERVER_ONLY = ['synced_at'];
// Un 409 (p. ej. la fila padre aún no llegó al servidor) se reintenta en las siguientes pasadas
// en lugar de descartarse; solo tras RETRY_LIMIT pasadas se aparta como rechazada.
const RETRY_LIMIT = 5;

export const state = { status: 'idle', error: '', lastSync: null };

export let onStatus = () => {};
export function setStatusListener(fn) { onStatus = fn; }
function setStatus(status, error = '') {
  state.status = status;
  state.error = error;
  onStatus(); // solo repinta; no es un cambio de datos y no programa otra sincronización
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
    const t = await deps.token();
    if (!t) return;
    await detectSchema(t);
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

const payload = (table, row) => {
  const out = { ...row, user_id: store.session.userId };
  SERVER_ONLY.forEach(k => delete out[k]);
  return stripV3(table, out);
};

async function upsert(t, table, rows) {
  await deps.api(`/rest/v1/${table}?on_conflict=id`, {
    method: 'POST', token: t, body: rows.map(r => payload(table, r)),
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
  });
}

async function push(t) {
  const keys = store.pendingKeys();
  if (!keys.length) return;
  for (const table of tables()) {
    const mine = keys.filter(k => k.startsWith(table + ':'));
    // Claves sin fila local (no deberían existir) salen de la cola para no dejarla atascada.
    store.clearPending(mine.filter(k => !db.get(table, k.slice(table.length + 1))));
    for (let i = 0; i < mine.length; i += CHUNK) {
      const batch = mine.slice(i, i + CHUNK).map(k => [k, db.get(table, k.slice(table.length + 1))]).filter(([, r]) => r);
      if (!batch.length) continue;
      const sent = batch.map(([k, r]) => [k, r.updated_at]);
      const keep = new Set(); // se quedan en la cola para la siguiente pasada
      try {
        await upsert(t, table, batch.map(([, r]) => r));
      } catch (e) {
        if (!(e instanceof ApiError) || e.status === 401 || e.status === 404 || e.status >= 500) throw e;
        // Un registro inválido no debe bloquear la cola: se reintenta uno a uno.
        for (const [k, r] of batch) {
          try { await upsert(t, table, [r]); } catch (err) {
            if (!(err instanceof ApiError) || err.status >= 500 || err.status === 401) throw err;
            if (err.status === 409 && bumpRetry(k) < RETRY_LIMIT) { keep.add(k); continue; }
            reject(k, err);
          }
        }
      }
      // Sale de la cola lo enviado (o rechazado) que no cambió mientras se subía.
      const done = sent.filter(([k, at]) => { if (keep.has(k)) return false; const r = db.get(table, k.slice(table.length + 1)); return r && r.updated_at === at; }).map(([k]) => k);
      store.clearPending(done);
      clearRetries(done);
    }
  }
}

function bumpRetry(key) {
  const r = db.kvGet('syncRetries', {});
  r[key] = (r[key] || 0) + 1;
  db.kvSet('syncRetries', r);
  return r[key];
}
function clearRetries(keys) {
  const r = db.kvGet('syncRetries', {});
  if (!keys.some(k => k in r)) return;
  keys.forEach(k => delete r[k]);
  db.kvSet('syncRetries', r);
}
function reject(key, err) {
  const bad = db.kvGet('syncRejected', []).filter(b => b.key !== key);
  bad.push({ key, error: err.message, status: err.status, at: new Date().toISOString() });
  db.kvSet('syncRejected', bad.slice(-50));
}

// Cambios que el servidor rechazó: siguen en este dispositivo y se muestran en Ajustes.
export const rejected = () => db.kvGet('syncRejected', []);
export function retryRejected() {
  const keys = rejected().map(b => b.key);
  db.kvSet('syncRejected', []);
  const r = db.kvGet('syncRetries', {});
  keys.forEach(k => delete r[k]);
  db.kvSet('syncRetries', r);
  store.requeue(keys);
  return syncNow();
}
export function dismissRejected() {
  db.kvSet('syncRejected', []);
  onStatus();
}

async function pull(t) {
  const pending = new Set(store.pendingKeys());
  let changed = false;
  for (const table of tables()) {
    let cursor = db.kvGet(`cursor:${table}`, '1970-01-01T00:00:00Z');
    for (;;) {
      const since = new Date(Date.parse(cursor) - OVERLAP_MS).toISOString();
      const rows = await deps.api(`/rest/v1/${table}?select=*&synced_at=gt.${encodeURIComponent(since)}&order=synced_at.asc&limit=1000`, { token: t });
      for (const r of rows) if (store.applyRemote(table, r, pending)) changed = true;
      if (rows.length) cursor = rows[rows.length - 1].synced_at;
      db.kvSet(`cursor:${table}`, cursor);
      if (rows.length < 1000) break;
    }
  }
  if (changed) store.emit();
}

const PROFILE_FIELDS = ['display_name', 'timezone', 'focus_areas', 'prefs', 'onboarded_at', 'migrated_v1_at', 'vision', 'updated_at'];

async function pushProfile(t) {
  if (!db.kvGet('profileDirty')) return;
  const p = store.profile();
  const body = { id: store.session.userId };
  PROFILE_FIELDS.forEach(k => { if (p[k] !== undefined) body[k] = p[k]; });
  if (!body.updated_at) body.updated_at = new Date().toISOString();
  stripV3('profiles', body);
  await deps.api('/rest/v1/profiles?on_conflict=id', { method: 'POST', token: t, body, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } });
  if (store.profile().updated_at === body.updated_at) db.kvSet('profileDirty', false);
}

async function pullProfile(t) {
  const rows = await deps.api(`/rest/v1/profiles?select=*&id=eq.${store.session.userId}`, { token: t });
  const remote = rows[0];
  if (!remote) return;
  const local = store.profile();
  if (db.kvGet('profileDirty') && Date.parse(local.updated_at) > Date.parse(remote.updated_at)) return;
  const next = {};
  PROFILE_FIELDS.forEach(k => { if (k in remote) next[k] = remote[k]; });
  // El nombre de Google/registro solo se usa si el usuario no ha puesto uno.
  if (!next.display_name && local.display_name) next.display_name = local.display_name;
  db.kvSet('profile', { ...local, ...next });
  store.emit();
}

const EVENT_NAME = /^[a-z_]{2,40}$/; // misma regla que la tabla events

// Las métricas son secundarias: si fallan se descartan, nunca bloquean ni reintentan en bucle.
async function pushEvents(t) {
  const q = db.kvGet('events', []);
  if (!q.length) return;
  const drop = () => db.kvSet('events', db.kvGet('events', []).slice(q.length));
  const valid = store.prefs().analytics ? q.filter(e => EVENT_NAME.test(e.name)) : [];
  if (!valid.length) { drop(); return; }
  try {
    await deps.api('/rest/v1/events', { method: 'POST', token: t, body: valid.map(e => ({ ...e, user_id: store.session.userId })), headers: { Prefer: 'return=minimal' } });
    drop();
  } catch (e) {
    if (e instanceof ApiError && e.status >= 400 && e.status < 500) drop(); // datos rechazados: no se reintentan
  }
}

// Borra en el servidor todas las filas del usuario (derecho de supresión desde la app).
export async function deleteRemoteData() {
  const t = await deps.token();
  if (!t) return;
  await detectSchema(t);
  for (const table of [...tables()].reverse().concat('events')) {
    await deps.api(`/rest/v1/${table}?user_id=eq.${store.session.userId}`, { method: 'DELETE', token: t, headers: { Prefer: 'return=minimal' } });
  }
}

// Lee el documento v1 del servidor (solo para la migración).
export async function fetchV1Doc() {
  const t = await deps.token();
  if (!t) return null;
  try {
    const rows = await deps.api(`/rest/v1/bitacora_state?select=data&user_id=eq.${store.session.userId}`, { token: t });
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
