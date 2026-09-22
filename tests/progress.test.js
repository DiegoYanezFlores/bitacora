// Motor de progreso (plan técnico §8 y §23, casos críticos 1–5).
import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { milestoneProgress, goalProgress, metricIndicator, progressDelta } from '../app/domain/progress.js';

const goal = { id: 'g' };
const ms = (id, extra = {}) => ({ id, project_id: 'g', stage_id: null, weight: 2, status: 'open', done_at: null, sort: 0, ...extra });
const cr = (id, milestone_id, met = false) => ({ id, milestone_id, met_at: met ? '2026-09-01T00:00:00Z' : null });
const byMs = list => { const m = new Map(); list.forEach(c => { if (!m.has(c.milestone_id)) m.set(c.milestone_id, []); m.get(c.milestone_id).push(c); }); return m; };

test('las acciones no mueven el avance: sin criterios cumplidos sigue en 0 %', () => {
  const r = goalProgress(goal, [], [ms('a')], byMs([cr('c1', 'a'), cr('c2', 'a')]));
  assert.equal(r.pct, 0); // no recibe actividades: por diseño no puede verlas
});

test('ponderado: hito L a mitad (2/4) + hito S cerrado = 62,5 %', () => {
  const r = goalProgress(goal, [], [ms('a', { weight: 3 }), ms('b', { weight: 1, done_at: 'x' })],
    byMs([cr('1', 'a', true), cr('2', 'a', true), cr('3', 'a'), cr('4', 'a')]));
  assert.equal(r.p, 0.625);
  assert.equal(r.pct, 63);
  assert.deepEqual(r.milestones, { done: 1, total: 2 });
});

test('etapas e hitos omitidos salen del denominador', () => {
  const stages = [{ id: 's1', goal_id: 'g', status: 'active', sort: 0 }, { id: 's2', goal_id: 'g', status: 'skipped', sort: 1 }];
  const r = goalProgress(goal, stages, [
    ms('a', { stage_id: 's1', done_at: 'x' }),
    ms('b', { stage_id: 's1', status: 'skipped' }),
    ms('c', { stage_id: 's2' })
  ]);
  assert.equal(r.pct, 100);
  assert.deepEqual(r.stages, { done: 1, total: 1 });
});

test('cerrar un hito a mano con criterios pendientes: cuenta completo y lo dice', () => {
  const m = milestoneProgress(ms('a', { done_at: 'x' }), [cr('1', 'a', true), cr('2', 'a', true), cr('3', 'a', true), cr('4', 'a'), cr('5', 'a')]);
  assert.equal(m.p, 1);
  assert.equal(m.closedWithUnmet, 2);
});

test('hito heredado sin criterios es binario; criterios borrados no cuentan', () => {
  assert.equal(milestoneProgress(ms('a')).p, 0);
  assert.equal(milestoneProgress(ms('a'), [cr('1', 'a', true), { ...cr('2', 'a'), deleted_at: 'x' }]).p, 1);
});

test('sin hitos no hay porcentaje (no se inventa un 0 %)', () => {
  const r = goalProgress(goal, [], []);
  assert.equal(r.pct, null);
  assert.equal(r.mode, 'none');
});

test('segmentos por etapa en orden, siguiente hito y respaldo', () => {
  const stages = [{ id: 's2', goal_id: 'g', title: 'Dos', status: 'pending', sort: 1 }, { id: 's1', goal_id: 'g', title: 'Uno', status: 'active', sort: 0 }];
  const r = goalProgress(goal, stages, [ms('a', { stage_id: 's1', done_at: 'x' }), ms('b', { stage_id: 's2', weight: 3 })], new Map(), new Set(['a']));
  assert.deepEqual(r.segments.map(s => [s.title, s.weight, s.p]), [['Uno', 2, 1], ['Dos', 3, 0]]);
  assert.equal(r.nextMilestone.id, 'b');
  assert.deepEqual(r.backed, { with: 1, total: 2 });
});

test('hitos de etapas borradas o sin etapa van a la etapa implícita', () => {
  const r = goalProgress(goal, [{ id: 's', goal_id: 'g', deleted_at: 'x' }], [ms('a', { stage_id: 's', done_at: 'x' }), ms('b')]);
  assert.equal(r.pct, 50);
  assert.equal(r.chapters[0].stage, null);
});

test('la métrica es un indicador aparte', () => {
  assert.deepEqual(metricIndicator({ metric_start: 100, metric_current: 60, metric_target: 0, metric_unit: 'USD' }), { pct: 40, label: '60 → 0 USD' });
  assert.equal(metricIndicator({}), null);
});

test('texto del cambio', () => {
  const a = { pct: 40, milestones: { done: 1 }, criteriaMet: 2 };
  assert.equal(progressDelta(a, { pct: 60, milestones: { done: 2 }, criteriaMet: 3 }).text, '+1 hito');
  assert.equal(progressDelta(a, { pct: 50, milestones: { done: 1 }, criteriaMet: 3 }).text, '+1 criterio');
  assert.equal(progressDelta(a, { pct: 30, milestones: { done: 1 }, criteriaMet: 1 }).text, '−1 criterio');
});
