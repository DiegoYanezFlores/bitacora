// Almacén local: mutaciones, cola de cambios, borrado lógico y "gana la edición más reciente".
import './setup.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { reset } from './setup.js';
import * as store from '../app/store.js';
import * as db from '../app/db.js';
import { parse } from '../app/capture.js';

beforeEach(async () => { await reset(); db.kvSet('outbox', []); });

test('crear marca la fila para subir y asigna usuario', () => {
  const a = store.create('activities', { title: 'x' });
  assert.equal(a.user_id, 'u1');
  assert.deepEqual(store.pendingKeys(), [`activities:${a.id}`]);
});

test('borrar vacía el contenido pero conserva el esqueleto; deshacer lo restaura', () => {
  const t = store.create('tasks', { title: 'secreto', notes: 'nota' });
  const prev = store.remove('tasks', t.id);
  const gone = db.get('tasks', t.id);
  assert.ok(gone.deleted_at);
  assert.equal(gone.title, '');
  assert.equal(gone.notes, '');
  assert.equal(db.live('tasks').length, 0);
  store.restore('tasks', prev);
  assert.equal(db.get('tasks', t.id).title, 'secreto');
  assert.equal(db.get('tasks', t.id).deleted_at, null);
});

test('bajada: solo se aplica una fila remota más reciente', () => {
  const a = store.create('activities', { title: 'local' });
  const older = { ...a, title: 'viejo', updated_at: '2020-01-01T00:00:00.000Z' };
  assert.equal(store.applyRemote('activities', older, new Set()), false);
  const newer = { ...a, title: 'nuevo', updated_at: new Date(Date.now() + 60000).toISOString() };
  assert.equal(store.applyRemote('activities', newer, new Set()), true);
  assert.equal(db.get('activities', a.id).title, 'nuevo');
});

test('importar no pisa filas existentes', () => {
  const a = store.create('activities', { title: 'mío' });
  const n = store.insertIfMissing('activities', [{ id: a.id, title: 'importado' }, { id: 'b', title: 'nuevo' }]);
  assert.equal(n, 1);
  assert.equal(db.get('activities', a.id).title, 'mío');
});

test('requeue vuelve a poner claves en la cola sin duplicar', () => {
  store.requeue(['tasks:1', 'tasks:1', 'tasks:2']);
  assert.deepEqual(store.pendingKeys().sort(), ['tasks:1', 'tasks:2']);
});

test('preferencias: valores por defecto y cambios', () => {
  assert.equal(store.prefs().weeklyGoal, 4);
  store.setPrefs({ weeklyGoal: 2 });
  assert.equal(store.prefs().weeklyGoal, 2);
  assert.equal(db.kvGet('profileDirty'), true);
});

test('captura: tipo, #proyecto, "ayer" y tarea parecida', () => {
  const p = store.create('projects', { name: 'Inglés' });
  const t = store.create('tasks', { title: 'Informe de ventas trimestral', project_id: p.id });
  assert.equal(parse('tengo que llamar al banco').kind, 'task');
  assert.equal(parse('aprendí algo sobre índices').kind, 'note');
  assert.equal(parse('conseguí la certificación').kind, 'win');
  const r = parse('ayer practiqué #ingles');
  assert.equal(r.projectId, p.id);
  assert.equal(r.daysAgo, 1);
  const m = parse('terminé el informe de ventas trimestral');
  assert.equal(m.kind, 'done');
  assert.equal(m.taskId, t.id);
});

test('migración local v3: respeta la meta semanal, guarda copia y es idempotente', async () => {
  const { migrateV3 } = await import('../app/migrate.js');
  // Cuenta nueva sin datos: no deja ninguna copia en el navegador.
  db.kvSet('migratedV3', false);
  localStorage.removeItem('bitacora:backup:pre-v3:u1');
  if (!db.counts().projects && !db.counts().activities) {
    assert.equal(migrateV3(), true);
    assert.equal(localStorage.getItem('bitacora:backup:pre-v3:u1'), null);
  }
  // Con datos previos sí se guarda la copia.
  store.create('projects', { name: 'Previo' });
  db.kvSet('migratedV3', false);
  store.setProfile({ prefs: { weeklyGoal: 5 } });
  assert.equal(migrateV3(), true);
  assert.equal(store.prefs().activeWeekDays, 5);
  assert.ok(localStorage.getItem('bitacora:backup:pre-v3:u1'));
  store.setPrefs({ activeWeekDays: 3 });
  assert.equal(migrateV3(), false);
  assert.equal(store.prefs().activeWeekDays, 3);
});

test('copia de seguridad: incluye tablas nuevas, el resultado de las tareas y se puede reimportar', async () => {
  const { exportBackup, importBackup } = await import('../app/migrate.js');
  const p = store.create('projects', { name: 'P' });
  store.create('stages', { goal_id: p.id, title: 'Etapa' });
  store.create('day_marks', { day: '2026-09-20' });
  const t = store.create('tasks', { title: 'Reunión', due_date: '2026-09-25', result: 'no_show', result_note: 'No asistieron.', status: 'done' });
  store.create('task_log', { task_id: t.id, type: 'rescheduled', from_date: '2026-09-25', to_date: '2026-09-27', note: 'Faltaban datos.' });
  const json = exportBackup();
  const backup = JSON.parse(json);
  assert.equal(backup.version, 4);
  // Lo que pasó con la tarea viaja en la copia: resultado, motivo y cambio de fecha.
  assert.equal(backup.rows.tasks[0].result, 'no_show');
  assert.equal(backup.rows.tasks[0].result_note, 'No asistieron.');
  assert.deepEqual([backup.rows.task_log[0].from_date, backup.rows.task_log[0].to_date], ['2026-09-25', '2026-09-27']);
  await db.wipe();
  const totals = await importBackup(json);
  assert.equal(totals.projects, 1);
  assert.equal(totals.stages, 1);
  assert.equal(totals.day_marks, 1);
  assert.equal(totals.task_log, 1);
  assert.equal(db.live('tasks')[0].result, 'no_show');
});
