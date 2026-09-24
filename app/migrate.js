// Migración v1 → v2. Convierte el documento JSON de Bitácora v1 en proyectos, hitos, tareas y actividades.
// Ids deterministas (mismo origen → mismo id): se puede ejecutar en varios dispositivos sin duplicar.
// Las filas migradas conservan una fecha de edición antigua, así un borrado posterior siempre gana.
import * as store from './store.js';
import * as db from './db.js';
import { stableUuid, dayKey, addDays, parseDay } from './lib.js';

const V1_KEYS = ['bitacora-v1', 'bitacora:v1'];
const OLD = '2020-01-01T00:00:00.000Z'; // fecha de edición de lo migrado

const readLocal = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };

export function hasV1Data() {
  return V1_KEYS.some(k => {
    const d = readLocal(k);
    return d && (Array.isArray(d.tasks) || Array.isArray(d.goals) || (d.english && Object.keys(d.english).length));
  });
}

const atNoon = (day, hour = 12) => { const d = parseDay(day); d.setHours(hour, 0, 0, 0); return d.toISOString(); };

// Convierte un documento v1 en filas v2.
async function convert(doc, ns) {
  const id = key => stableUuid(`${ns}:${key}`);
  const out = { projects: [], milestones: [], tasks: [], activities: [] };
  if (!doc || typeof doc !== 'object') return out;

  const addProject = async (key, data) => {
    const pid = await id('project:' + key);
    out.projects.push({ id: pid, status: 'active', color: 'teal', created_at: OLD, updated_at: OLD, deleted_at: null, ...data });
    return pid;
  };
  const addActivity = async (key, data) => {
    out.activities.push({ id: await id('activity:' + key), kind: 'done', source: 'import', created_at: OLD, updated_at: OLD, deleted_at: null, ...data });
  };

  // 1. Racha de inglés → proyecto con una actividad por día registrado.
  const english = doc.english && typeof doc.english === 'object' ? Object.keys(doc.english).filter(k => doc.english[k]) : [];
  if (english.length) {
    const pid = await addProject('english', { name: 'Inglés', goal: 'Práctica diaria', color: 'orange', description: 'Importado de Bitácora v1 (racha diaria).' });
    for (const day of english) await addActivity('en:' + day, { project_id: pid, title: 'Práctica de inglés', occurred_at: atNoon(day), kind: 'done' });
  }

  // 2. Plan de 12 meses: hoja de ruta → hitos; tareas y pendientes → tareas; historial semanal → notas.
  const hasPlan = (doc.tasks && doc.tasks.length) || (doc.roadmap && doc.roadmap.length) || (doc.hist && doc.hist.length) || (doc.waiting && doc.waiting.length);
  if (hasPlan) {
    const pid = await addProject('plan', { name: 'Plan 12 meses', goal: doc.started ? `Plan iniciado el ${doc.started}` : '', color: 'violet', description: 'Importado de Bitácora v1.', start_date: doc.started || null });

    for (const [i, r] of (doc.roadmap || []).entries()) {
      out.milestones.push({ id: await id('ms:' + (r.id || i)), project_id: pid, title: [r.m, r.t].filter(Boolean).join(' — ').slice(0, 200), due_date: null, done_at: r.d ? OLD : null, sort: i, created_at: OLD, updated_at: OLD, deleted_at: null });
    }
    for (const [i, t] of (doc.tasks || []).entries()) {
      out.tasks.push({ id: await id('task:' + (t.id || i)), project_id: pid, title: String(t.t || '').slice(0, 300) || 'Tarea', notes: String(t.w || ''), priority: [1, 2, 3].includes(+t.p) ? +t.p : 2, status: t.d ? 'done' : 'todo', completed_at: t.d ? OLD : null, due_date: null, waiting_on: '', sort: i, created_at: OLD, updated_at: OLD, deleted_at: null });
    }
    for (const [i, w] of (doc.waiting || []).entries()) {
      out.tasks.push({ id: await id('wait:' + (w.id || i)), project_id: pid, title: String(w.t || '').slice(0, 300) || 'Pendiente', notes: '', priority: 2, status: 'waiting', waiting_on: '', due_date: null, completed_at: null, sort: i, created_at: w.since ? atNoon(w.since, 9) : OLD, updated_at: OLD, deleted_at: null });
    }
    for (const h of doc.hist || []) {
      const pct = h.total ? Math.round((h.done / h.total) * 100) : 0;
      await addActivity('hist:' + h.week, { project_id: pid, kind: 'note', title: `Semana del ${h.week}: ${h.done}/${h.total} tareas (${pct}%)`, occurred_at: atNoon(addDays(h.week, 6), 20) });
    }
  }

  // 3. Contadores de búsqueda de empleo (no tenían fecha: se guardan como nota histórica).
  if (doc.apps > 0 || doc.interviews > 0) {
    const pid = await addProject('jobs', { name: 'Búsqueda de empleo', color: 'blue', goal: 'Aplicaciones y entrevistas' });
    await addActivity('jobs-counters', { project_id: pid, kind: 'note', title: `Histórico v1: ${doc.apps || 0} aplicaciones y ${doc.interviews || 0} entrevistas`, body: 'Los contadores de la versión anterior no guardaban fechas. A partir de ahora cada aplicación o entrevista se registra como una actividad.', occurred_at: doc.updatedAt || OLD });
  }

  // 4. Capital → proyecto con métrica (inicio → meta 0).
  if (doc.capital !== null && doc.capital !== undefined) {
    await addProject('capital', { name: 'Capital', color: 'slate', goal: 'Reducir el saldo', metric_unit: 'USD', metric_start: Number(doc.capital0 ?? doc.capital), metric_current: Number(doc.capital), metric_target: 0 });
  }

  // 5. Notas libres.
  if (doc.notes && String(doc.notes).trim()) {
    const text = String(doc.notes).trim();
    await addActivity('notes', { kind: 'note', title: text.split('\n')[0].slice(0, 120) || 'Notas', body: text, occurred_at: doc.updatedAt || OLD });
  }

  // 6. Objetivos del primer tracker genérico (campo legacy o clave antigua).
  for (const g of Array.isArray(doc.legacy) ? doc.legacy : Array.isArray(doc.goals) ? doc.goals : []) {
    const isTarget = g.kind === 'target' && Number(g.target) > 0;
    const total = (g.entries || []).reduce((a, e) => a + (Number(e.amount) || 0), 0);
    const pid = await addProject('goal:' + g.id, {
      name: String(g.title || 'Objetivo').slice(0, 120), color: 'green', status: g.archived ? 'archived' : 'active',
      ...(isTarget ? { metric_unit: g.unit || '', metric_start: 0, metric_current: total, metric_target: Number(g.target) } : {})
    });
    for (const e of g.entries || []) {
      await addActivity('entry:' + e.id, { project_id: pid, kind: isTarget ? 'progress' : 'done', title: isTarget ? `${e.amount} ${g.unit || ''}`.trim() : g.title, occurred_at: e.at || atNoon(e.date || dayKey()) });
    }
  }
  return out;
}

// Ejecuta la migración una sola vez por dispositivo/cuenta. Devuelve un resumen o null.
export async function runMigration({ remoteDoc = null } = {}) {
  if (db.kvGet('migratedV1')) return null;
  const ns = store.session.userId || 'guest';
  const docs = [...V1_KEYS.map(readLocal), remoteDoc].filter(Boolean);
  if (!docs.length) { db.kvSet('migratedV1', true); return null; }

  const totals = { projects: 0, milestones: 0, tasks: 0, activities: 0 };
  for (const doc of docs) {
    const rows = await convert(doc, ns);
    for (const table of Object.keys(totals)) totals[table] += store.insertIfMissing(table, rows[table]);
  }
  db.kvSet('migratedV1', true);
  if (Object.values(totals).some(Boolean)) {
    store.setProfile({ migrated_v1_at: new Date().toISOString() });
    store.track('migrated_legacy', totals);
  }
  return totals;
}

// Importación manual de una copia (v1 o v2) desde Ajustes.
export async function importBackup(json) {
  const data = JSON.parse(json);
  if (data && data.version >= 2 && data.rows) {
    const totals = {};
    for (const table of db.TABLES) totals[table] = store.insertIfMissing(table, (data.rows[table] || []).filter(r => r && r.id));
    if (data.profile) store.setProfile({ ...data.profile, migrated_v1_at: store.profile().migrated_v1_at });
    return totals;
  }
  const rows = await convert(data, (store.session.userId || 'guest') + ':import:' + (data.updatedAt || Date.now()));
  const totals = {};
  for (const table of db.TABLES) totals[table] = store.insertIfMissing(table, rows[table]);
  return totals;
}

// Preparación local para la migración 003 (una vez por dispositivo). No cambia datos de otros
// dispositivos: solo guarda una copia de seguridad y fija la preferencia de constancia semanal.
export function migrateV3() {
  if (db.kvGet('migratedV3')) return false;
  // Solo hay algo que respaldar si este navegador ya tenía datos (una cuenta nueva no deja copias).
  if (db.counts().projects || db.counts().activities) {
    try { localStorage.setItem(`bitacora:backup:pre-v3:${store.session.userId || 'guest'}`, exportBackup()); } catch (e) { /* sin espacio: no bloquea */ }
  }
  const raw = store.profile().prefs || {};
  if (raw.activeWeekDays === undefined) store.setPrefs({ activeWeekDays: raw.weeklyGoal ?? 2 });
  db.kvSet('migratedV3', true);
  return true;
}

export function exportBackup() {
  return JSON.stringify({
    version: 4, // 4: incluye task_log (qué pasó con cada tarea) y el resultado de las tareas
    exported_at: new Date().toISOString(),
    profile: store.profile(),
    rows: Object.fromEntries(db.TABLES.map(t => [t, db.raw(t)]))
  }, null, 2);
}
