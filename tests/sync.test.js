// Sincronización: ningún cambio debe perderse en silencio (plan técnico, hallazgo H1).
import './setup.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { reset } from './setup.js';
import * as store from '../app/store.js';
import * as db from '../app/db.js';
import * as sync from '../app/sync.js';
import { ApiError } from '../app/api.js';

// Servidor falso: `fail(path, body)` decide si una escritura falla; las lecturas devuelven [].
let calls = [];
let fail = () => null;
function fakeServer() {
  sync.deps.token = async () => 'tok';
  sync.deps.api = async (path, { method = 'GET', body } = {}) => {
    calls.push({ path, method, body });
    if (method === 'GET') return [];
    const err = fail(path, body);
    if (err) throw err;
    return null;
  };
}

beforeEach(async () => {
  await reset();
  db.kvSet('outbox', []);
  db.kvSet('syncRejected', []);
  db.kvSet('syncRetries', {});
  calls = [];
  fail = () => null;
  sync.schema.v3 = null;
  fakeServer();
});

const fk = () => new ApiError('insert or update on table "milestones" violates foreign key constraint', 409, '23503');

test('un 409 (padre aún no está en el servidor) deja la fila en la cola', async () => {
  const p = store.create('projects', { name: 'P' });
  const m = store.create('milestones', { project_id: p.id, title: 'H' });
  fail = path => (path.startsWith('/rest/v1/milestones') ? fk() : null);
  await sync.syncNow();
  assert.deepEqual(store.pendingKeys(), [`milestones:${m.id}`]);
  assert.equal(sync.rejected().length, 0);
  assert.equal(sync.state.status, 'pending');
});

test('cuando el padre llega, la siguiente pasada sube la fila', async () => {
  const p = store.create('projects', { name: 'P' });
  store.create('milestones', { project_id: p.id, title: 'H' });
  let first = true;
  fail = path => (path.startsWith('/rest/v1/milestones') && first ? fk() : null);
  await sync.syncNow();
  first = false;
  await sync.syncNow();
  assert.equal(store.pendingCount(), 0);
  assert.equal(sync.state.status, 'ok');
  assert.deepEqual(db.kvGet('syncRetries'), {});
});

test('tras 5 pasadas con 409 se aparta como rechazada y se ve en Ajustes', async () => {
  const p = store.create('projects', { name: 'P' });
  const m = store.create('milestones', { project_id: p.id, title: 'H' });
  fail = path => (path.startsWith('/rest/v1/milestones') ? fk() : null);
  for (let i = 0; i < 5; i++) await sync.syncNow();
  assert.equal(store.pendingCount(), 0);
  assert.equal(sync.rejected().length, 1);
  assert.equal(sync.rejected()[0].key, `milestones:${m.id}`);
  assert.equal(sync.rejected()[0].status, 409);
});

test('un 400 (dato inválido) se rechaza sin bloquear al resto del lote', async () => {
  const ok = store.create('activities', { title: 'bien' });
  const bad = store.create('activities', { title: 'mal' });
  fail = (path, body) => (body.length > 1 || body[0].id === bad.id ? new ApiError('violates check constraint', 400, '23514') : null);
  await sync.syncNow();
  assert.equal(store.pendingCount(), 0);
  assert.deepEqual(sync.rejected().map(r => r.key), [`activities:${bad.id}`]);
  assert.ok(calls.some(c => c.body && c.body.length === 1 && c.body[0].id === ok.id));
});

test('reintentar vuelve a poner en cola lo rechazado', async () => {
  const a = store.create('activities', { title: 'x' });
  fail = () => new ApiError('bad', 400);
  await sync.syncNow();
  assert.equal(sync.rejected().length, 1);
  fail = () => null;
  await sync.retryRejected();
  assert.equal(sync.rejected().length, 0);
  assert.equal(store.pendingCount(), 0);
  assert.ok(calls.some(c => c.body && c.body.some?.(r => r.id === a.id) && c.method === 'POST'));
});

test('un error 500 no saca nada de la cola', async () => {
  store.create('activities', { title: 'x' });
  fail = () => new ApiError('boom', 500);
  await sync.syncNow();
  assert.equal(store.pendingCount(), 1);
  assert.equal(sync.state.status, 'error');
});

test('una fila editada mientras se subía sigue en la cola', async () => {
  const a = store.create('activities', { title: 'v1' });
  // Edición durante la subida (con otra marca de tiempo; en la misma milésima no se distingue).
  fail = path => {
    if (path.startsWith('/rest/v1/activities')) db.put('activities', { ...db.get('activities', a.id), title: 'v2', updated_at: new Date(Date.now() + 1000).toISOString() });
    return null;
  };
  await sync.syncNow();
  assert.deepEqual(store.pendingKeys(), [`activities:${a.id}`]);
});

test('ocultar el aviso vacía la lista sin tocar los datos locales', async () => {
  const a = store.create('activities', { title: 'x' });
  fail = () => new ApiError('bad', 400);
  await sync.syncNow();
  sync.dismissRejected();
  assert.equal(sync.rejected().length, 0);
  assert.equal(db.get('activities', a.id).title, 'x');
});

// Servidor sin la migración 003: la app sigue sincronizando lo de siempre sin romper nada.
const noV3 = () => {
  const inner = sync.deps.api;
  sync.deps.api = async (path, opts = {}) => {
    if (/^\/rest\/v1\/(stages|criteria|evidence|reflections|achievements|day_marks|goal_log|recaps)/.test(path)) {
      calls.push({ path, method: opts.method || 'GET', body: opts.body });
      throw new ApiError('Could not find the table', 404, 'PGRST205');
    }
    return inner(path, opts);
  };
};

test('sin 003 en el servidor: columnas nuevas fuera del envío y tablas nuevas en espera', async () => {
  noV3();
  const p = store.create('projects', { name: 'P' });
  const st = store.create('stages', { goal_id: p.id, title: 'Etapa' });
  store.create('milestones', { project_id: p.id, stage_id: st.id, title: 'H', weight: 3 });
  await sync.syncNow();
  assert.equal(sync.schema.v3, false);
  const ms = calls.find(c => c.path.startsWith('/rest/v1/milestones') && c.method === 'POST');
  assert.ok(ms, 'los hitos se suben');
  assert.equal('weight' in ms.body[0], false);
  assert.equal('stage_id' in ms.body[0], false);
  assert.ok(!calls.some(c => c.path.startsWith('/rest/v1/stages') && c.method === 'POST'), 'las etapas no se suben');
  assert.deepEqual(store.pendingKeys(), [`stages:${st.id}`]);
  assert.equal(sync.state.status, 'pending');
});

test('con 003: se suben las tablas nuevas en orden de dependencias', async () => {
  const p = store.create('projects', { name: 'P' });
  const st = store.create('stages', { goal_id: p.id, title: 'Etapa' });
  const m = store.create('milestones', { project_id: p.id, stage_id: st.id, title: 'H', weight: 3 });
  store.create('criteria', { milestone_id: m.id, title: 'C' });
  await sync.syncNow();
  assert.equal(sync.schema.v3, true);
  const order = calls.filter(c => c.method === 'POST').map(c => c.path.split('?')[0].replace('/rest/v1/', ''));
  assert.deepEqual(order, ['projects', 'stages', 'milestones', 'criteria']);
  assert.equal(calls.find(c => c.path.startsWith('/rest/v1/milestones') && c.method === 'POST').body[0].weight, 3);
  assert.equal(store.pendingCount(), 0);
});
