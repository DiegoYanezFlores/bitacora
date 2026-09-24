// Estado de la app: mutaciones de dominio, cola de cambios pendientes (outbox), perfil y preferencias.
import * as db from './db.js';
import { uuid, nowIso } from './lib.js';

export const DEFAULT_PREFS = { theme: 'system', weeklyGoal: 4, activeWeekDays: 2, sound: false, haptics: true, notices: 'all', analytics: true };

// Valores por defecto por tabla (reflejan los de supabase/migrations/002 y 003).
const DEFAULTS = {
  projects: () => ({ name: '', description: '', goal: '', status: 'active', color: 'teal', tags: [], start_date: null, due_date: null, progress_manual: null, metric_unit: null, metric_start: null, metric_current: null, metric_target: null, template: null, completed_at: null, success_indicator: '' }),
  stages: () => ({ goal_id: null, title: '', description: '', sort: 0, status: 'pending', started_at: null, completed_at: null }),
  milestones: () => ({ project_id: null, stage_id: null, title: '', description: '', expected_evidence: '', weight: 2, status: 'open', due_date: null, done_at: null, sort: 0 }),
  criteria: () => ({ milestone_id: null, title: '', sort: 0, met_at: null, requires_evidence: false }),
  tasks: () => ({ project_id: null, milestone_id: null, title: '', notes: '', status: 'todo', priority: 2, due_date: null, waiting_on: '', completed_at: null, sort: 0, result: null, result_note: '', result_at: null }),
  task_log: () => ({ task_id: null, type: 'closed', result: null, note: '', from_date: null, to_date: null, occurred_at: nowIso() }),
  activities: () => ({ project_id: null, task_id: null, milestone_id: null, criterion_id: null, duration_min: null, kind: 'done', title: '', body: '', occurred_at: nowIso(), tags: [], source: 'capture' }),
  evidence: () => ({ goal_id: null, milestone_id: null, activity_id: null, criterion_id: null, type: 'note', title: '', note: '', url: null, storage_path: null, thumb_path: null, mime: null, size_bytes: null, level: 1, captured_at: nowIso(), upload_state: 'uploaded' }),
  reflections: () => ({ type: 'learning', body: '', prompt: '', goal_id: null, stage_id: null, milestone_id: null, activity_id: null, evidence_id: null, favorite: false, rating: null, occurred_at: nowIso() }),
  achievements: () => ({ kind: 'progress', rule_key: null, title: '', description: '', earned_at: nowIso(), goal_id: null, milestone_id: null, evidence_id: null, announced_at: null }),
  day_marks: () => ({ day: null, kind: 'rest', note: '' }),
  goal_log: () => ({ goal_id: null, type: 'created', note: '', meta: {}, occurred_at: nowIso() }),
  recaps: () => ({ period: 'week', start_date: null, seen_at: null, answer: '', pinned: [] })
};

// Al borrar se conserva solo el esqueleto (para propagar el borrado), nunca el contenido.
const BLANK = {
  projects: { name: '', description: '', goal: '', tags: [], success_indicator: '' },
  milestones: { title: '', description: '', expected_evidence: '' },
  tasks: { title: '', notes: '', waiting_on: '', result_note: '' },
  task_log: { note: '' },
  activities: { title: '', body: '', tags: [] },
  stages: { title: '', description: '' },
  criteria: { title: '' },
  evidence: { title: '', note: '', url: null, storage_path: null, thumb_path: null },
  reflections: { body: '', prompt: '' },
  achievements: { title: '', description: '' },
  day_marks: { note: '' },
  goal_log: { note: '', meta: {} },
  recaps: { answer: '', pinned: [] }
};

// ---------- suscripción ----------
const listeners = new Set();
let queued = false;
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function emit() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => { queued = false; listeners.forEach(fn => fn()); });
}

// ---------- sesión local ----------
export const session = { userId: null, email: '', guest: false };
export const owner = () => db.kvGet('owner');

// ---------- outbox ----------
const outbox = () => new Set(db.kvGet('outbox', []));
function markDirty(t, id) {
  const o = outbox();
  o.add(`${t}:${id}`);
  db.kvSet('outbox', [...o]);
}
export const pendingKeys = () => [...outbox()];
export const pendingCount = () => outbox().size;
export function clearPending(keys) {
  const o = outbox();
  keys.forEach(k => o.delete(k));
  db.kvSet('outbox', [...o]);
}
// Vuelve a poner en cola claves concretas (p. ej. cambios rechazados que el usuario reintenta).
export function requeue(keys) {
  const o = outbox();
  keys.forEach(k => o.add(k));
  db.kvSet('outbox', [...o]);
}
export function markAllDirty() {
  const o = outbox();
  for (const t of db.TABLES) db.raw(t).forEach(r => o.add(`${t}:${r.id}`));
  db.kvSet('outbox', [...o]);
}

// ---------- mutaciones ----------
export function create(t, data = {}) {
  const now = nowIso();
  const row = { ...DEFAULTS[t](), ...data, id: data.id || uuid(), user_id: session.userId, created_at: data.created_at || now, updated_at: now, deleted_at: null };
  db.put(t, row);
  markDirty(t, row.id);
  emit();
  return row;
}

export function update(t, id, patch) {
  const prev = db.get(t, id);
  if (!prev) return null;
  const row = { ...prev, ...patch, updated_at: nowIso() };
  db.put(t, row);
  markDirty(t, id);
  emit();
  return row;
}

// Borrado lógico. Devuelve la fila previa para poder deshacer.
export function remove(t, id) {
  const prev = db.get(t, id);
  if (!prev) return null;
  const now = nowIso();
  db.put(t, { ...prev, ...BLANK[t], deleted_at: now, updated_at: now });
  markDirty(t, id);
  emit();
  return prev;
}

export function restore(t, prev) {
  db.put(t, { ...prev, deleted_at: null, updated_at: nowIso() });
  markDirty(t, prev.id);
  emit();
}

// Inserta filas externas (migración/importación) sin pisar lo existente.
export function insertIfMissing(t, rows) {
  let n = 0;
  for (const r of rows) {
    if (db.get(t, r.id)) continue;
    db.put(t, { ...DEFAULTS[t](), ...r, user_id: session.userId });
    markDirty(t, r.id);
    n++;
  }
  if (n) emit();
  return n;
}

// Aplica una fila llegada del servidor si es más reciente que la local.
export function applyRemote(t, row, pending) {
  const local = db.get(t, row.id);
  if (local && Date.parse(local.updated_at) >= Date.parse(row.updated_at)) return false;
  if (local && pending.has(`${t}:${row.id}`) && Date.parse(local.updated_at) > Date.parse(row.updated_at)) return false;
  db.put(t, row);
  return true;
}

// ---------- perfil y preferencias ----------
export function profile() {
  return db.kvGet('profile', { display_name: '', timezone: '', focus_areas: [], prefs: {}, onboarded_at: null, migrated_v1_at: null, updated_at: null });
}
export const prefs = () => ({ ...DEFAULT_PREFS, ...(profile().prefs || {}) });

export function setProfile(patch, { dirty = true } = {}) {
  const p = { ...profile(), ...patch, updated_at: nowIso() };
  db.kvSet('profile', p);
  if (dirty) db.kvSet('profileDirty', true);
  emit();
  return p;
}
export const setPrefs = patch => setProfile({ prefs: { ...prefs(), ...patch } });

// ---------- eventos internos (métricas de producto, sin contenido) ----------
export function track(name, props = {}) {
  if (!prefs().analytics) return;
  const q = db.kvGet('events', []);
  q.push({ name, props, created_at: nowIso() });
  db.kvSet('events', q.slice(-200));
}
