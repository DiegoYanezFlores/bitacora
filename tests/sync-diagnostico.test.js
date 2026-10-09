// Fallos de sincronización encontrados en el diagnóstico (Fase 1) y ya corregidos.
// Cada prueba reproduce el caso real: sesión caducada, error al detectar el esquema,
// cola atascada por una migración que falta y migración aplicada sin recargar la app.
import './setup.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { reset } from './setup.js';
import * as store from '../app/store.js';
import * as db from '../app/db.js';
import * as sync from '../app/sync.js';
import { ApiError } from '../app/api.js';

beforeEach(async () => {
  await reset(); db.kvSet('outbox', []); sync.schema.v3 = null; sync.schema.v5 = null;
  sync.deps.token = async () => 'tok';
  sync.deps.api = async () => [];
});

test('sin token válido el estado no se queda en "Sincronizando"', async () => {
  sync.deps.token = async () => null;
  await sync.syncNow();
  assert.notEqual(sync.state.status, 'syncing');
});

test('una sesión caducada pide entrar de nuevo, sin error técnico', async () => {
  store.create('projects', { name: 'P' });
  sync.deps.api = async path => { if (path.startsWith('/rest/v1/stages')) throw new ApiError('JWT expired', 401, 'PGRST301'); return []; };
  await sync.syncNow();
  assert.equal(sync.state.status, 'idle');
  assert.match(sync.state.error, /sesión caducó/);
});

test('si falta una migración, la app dice por qué quedan cambios sin subir', async () => {
  sync.deps.api = async path => { if (path.startsWith('/rest/v1/task_log')) throw new ApiError('Not found', 404, 'PGRST205'); return []; };
  const t = store.create('tasks', { title: 'T' });
  store.create('task_log', { task_id: t.id, type: 'closed', result: 'no_show' });
  await sync.syncNow();
  assert.ok(sync.state.error, 'el usuario debería ver por qué quedan cambios sin subir');
});

test('al aplicar la migración, la cola se destraba sin recargar la app', async () => {
  let tiene005 = false;
  sync.deps.api = async path => { if (path.startsWith('/rest/v1/task_log') && !tiene005) throw new ApiError('Not found', 404, 'PGRST205'); return []; };
  const t = store.create('tasks', { title: 'T' });
  store.create('task_log', { task_id: t.id, type: 'closed', result: 'no_show' });
  await sync.syncNow();
  assert.equal(sync.schema.v5, false);
  assert.equal(sync.state.status, 'migration');
  tiene005 = true; // el dueño aplica 005 en Supabase
  await sync.syncNow();
  assert.equal(sync.schema.v5, true);
  assert.equal(store.pendingCount(), 0);
  assert.equal(sync.state.status, 'ok');
});
