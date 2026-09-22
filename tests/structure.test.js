// Estructura de objetivos: plantillas, cierre y reapertura de hitos, alcance y deshacer.
import './setup.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { reset } from './setup.js';
import * as store from '../app/store.js';
import * as model from '../app/model.js';
import * as structure from '../app/structure.js';
import * as db from '../app/db.js';

beforeEach(reset);
const undo = () => globalThis.__lastUndo();

test('plantilla con progreso dotado: el primer hito empieza con un criterio real cumplido', () => {
  const g = store.create('projects', { name: 'Inglés' });
  const n = structure.applyTemplate(g.id, 'idioma', { endowed: true });
  assert.equal(n, 6);
  assert.equal(model.stages().filter(s => s.goal_id === g.id).length, 3);
  const first = model.progress(g).chapters[0].milestones[0];
  const crit = model.criteriaOf(first.id);
  assert.equal(crit[0].title, 'Definiste tu objetivo');
  assert.ok(crit[0].met_at);
  assert.ok(model.progress(g).pct > 0);
});

test('cerrar hito: acción vinculada, evidencia, reflexión y etapa completada; deshacer lo revierte todo', () => {
  const g = store.create('projects', { name: 'G' });
  const s = store.create('stages', { goal_id: g.id, title: 'E1', sort: 0 });
  const m = store.create('milestones', { project_id: g.id, stage_id: s.id, title: 'H', weight: 2 });
  structure.closeMilestone(m.id, { url: 'https://ejemplo.dev/repo', reflection: 'Aprendí X' });
  assert.ok(model.milestone(m.id).done_at);
  assert.equal(model.activities().filter(a => a.milestone_id === m.id && a.source === 'milestone').length, 1);
  assert.equal(model.evidenceOf(m.id)[0].level, 2);
  assert.equal(model.reflections().filter(r => r.milestone_id === m.id && r.type === 'milestone_close').length, 1);
  assert.equal(model.stage(s.id).status, 'done');
  assert.equal(model.progress(g).pct, 100);
  undo();
  assert.equal(model.milestone(m.id).done_at, null);
  assert.equal(model.activities().filter(a => a.milestone_id === m.id).length, 0);
  assert.equal(model.evidenceOf(m.id).length, 0);
  assert.notEqual(model.stage(s.id).status, 'done');
});

test('reabrir retira la acción del cierre por vínculo, aunque el hito se haya renombrado', () => {
  const g = store.create('projects', { name: 'G' });
  const m = store.create('milestones', { project_id: g.id, title: 'Viejo nombre' });
  structure.closeMilestone(m.id);
  store.update('milestones', m.id, { title: 'Nombre nuevo' });
  structure.reopenMilestone(m.id);
  assert.equal(model.activities().filter(a => a.milestone_id === m.id).length, 0);
  assert.equal(model.milestone(m.id).status, 'open');
});

test('borrar un hito pendiente sube el % y queda registrado como ajuste de alcance', () => {
  const g = store.create('projects', { name: 'G' });
  store.create('milestones', { project_id: g.id, title: 'Hecho', done_at: new Date().toISOString(), status: 'done' });
  const pend = store.create('milestones', { project_id: g.id, title: 'Pendiente' });
  assert.equal(model.progress(g).pct, 50);
  structure.removeMilestone(pend.id);
  assert.equal(model.progress(g).pct, 100);
  const entry = db.live('goal_log').find(e => e.goal_id === g.id && e.type === 'scope_changed');
  assert.ok(entry, 'se registra el ajuste de alcance');
  assert.deepEqual([entry.meta.from, entry.meta.to], [50, 100]);
});

test('criterios: tope de 8 y marcar/desmarcar mueve el hito', () => {
  const g = store.create('projects', { name: 'G' });
  const m = store.create('milestones', { project_id: g.id, title: 'H' });
  for (let i = 0; i < 8; i++) assert.equal(structure.addCriterion(m.id, 'c' + i), true);
  assert.equal(structure.addCriterion(m.id, 'noveno'), false);
  const c = model.criteriaOf(m.id)[0];
  structure.toggleCriterion(c.id);
  assert.equal(model.msProgress(model.milestone(m.id)).met, 1);
  structure.toggleCriterion(c.id);
  assert.equal(model.msProgress(model.milestone(m.id)).met, 0);
});
