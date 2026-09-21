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
