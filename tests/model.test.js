// Comportamiento de los derivados actuales (model.js). Fija la v2 antes de reorganizar el código.
import './setup.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { reset, noon } from './setup.js';
import * as store from '../app/store.js';
import * as model from '../app/model.js';
import { dayKey, addDays, weekStart } from '../app/lib.js';

const today = dayKey();
const act = (day, extra = {}) => store.create('activities', { title: 'x', occurred_at: noon(day), ...extra });

beforeEach(reset);

test('racha: cuenta desde hoy y guarda la mejor', () => {
  [0, 1, 2].forEach(n => act(addDays(today, -n)));
  [10, 11, 12, 13].forEach(n => act(addDays(today, -n)));
  assert.deepEqual(model.streak(), { current: 3, best: 4, today: true });
});

test('racha: si hoy no hay nada, cuenta desde ayer', () => {
  [1, 2].forEach(n => act(addDays(today, -n)));
  assert.deepEqual(model.streak(), { current: 2, best: 2, today: false });
});

test('semana: días activos frente a la meta', () => {
  const ws = weekStart(today);
  act(ws); act(ws); act(addDays(ws, 2));
  const w = model.week(ws);
  assert.equal(w.active, 2);
  assert.equal(w.total, 3);
  assert.equal(w.goal, store.prefs().weeklyGoal);
  assert.equal(w.days.length, 7);
});

test('mapa: niveles por conteo y días futuros', () => {
  for (let i = 0; i < 6; i++) act(today);
  act(addDays(today, -1));
  const cells = model.heatmap(2).flat();
  assert.equal(cells.length, 14);
  assert.equal(cells.find(c => c.key === today).level, 4);
  assert.equal(cells.find(c => c.key === addDays(today, -1))?.level ?? 1, 1);
  assert.ok(cells.filter(c => c.key > today).every(c => c.future));
});

test('avance: sale de hitos y criterios; las tareas completadas no lo mueven', () => {
  const p = store.create('projects', { name: 'P' });
  const m = store.create('milestones', { project_id: p.id, title: 'H', weight: 2 });
  const c1 = store.create('criteria', { milestone_id: m.id, title: 'a' });
  store.create('criteria', { milestone_id: m.id, title: 'b' });
  for (let i = 0; i < 50; i++) store.create('tasks', { project_id: p.id, title: 't' + i, status: 'done' });
  assert.equal(model.progress(p).pct, 0);
  store.update('criteria', c1.id, { met_at: new Date().toISOString() });
  const r = model.progress(p);
  assert.equal(r.pct, 50);
  assert.equal(r.criteriaMet, 1);
  assert.equal(r.nextMilestone.id, m.id);
});

test('avance: sin hitos no hay %, la métrica es un indicador aparte', () => {
  const p = store.create('projects', { name: 'Capital', metric_start: 100, metric_current: 60, metric_target: 0, metric_unit: 'USD' });
  const r = model.progress(p);
  assert.equal(r.mode, 'none');
  assert.equal(r.pct, null);
  assert.deepEqual(r.metric, { pct: 40, label: '60 → 0 USD' });
});

test('respaldo: evidencia de nivel ≥2 en el hito o en una de sus acciones', () => {
  const p = store.create('projects', { name: 'P' });
  const m1 = store.create('milestones', { project_id: p.id, title: 'A' });
  const m2 = store.create('milestones', { project_id: p.id, title: 'B' });
  const a = store.create('activities', { title: 'x', project_id: p.id, milestone_id: m2.id });
  store.create('evidence', { goal_id: p.id, milestone_id: m1.id, type: 'link', url: 'https://x.dev', level: 2 });
  store.create('evidence', { goal_id: p.id, activity_id: a.id, type: 'note', title: 'nota', level: 1 });
  assert.deepEqual(model.progress(p).backed, { with: 1, total: 2 });
});

test('periodo semanal: actividades, días activos y por proyecto', () => {
  const p = store.create('projects', { name: 'P' });
  const ws = weekStart(today);
  act(ws, { project_id: p.id }); act(ws, { project_id: p.id }); act(addDays(ws, 1));
  act(addDays(ws, -3)); // semana anterior
  const r = model.period('week', 0);
  assert.equal(r.activities, 3);
  assert.equal(r.activeDays, 2);
  assert.equal(r.series.length, 7);
  assert.equal(r.byProject[0].project.id, p.id);
  assert.equal(model.period('week', -1).activities, 1);
});

test('periodo anual: 12 meses', () => {
  const r = model.period('year', 0);
  assert.equal(r.series.length, 12);
  assert.equal(r.start.slice(5), '01-01');
});

test('project() no devuelve proyectos borrados', () => {
  const p = store.create('projects', { name: 'Borrable' });
  store.remove('projects', p.id);
  assert.equal(model.project(p.id), null);
});

test('logros: se calculan del historial real', () => {
  act(today);
  const a = model.achievements().find(x => x.id === 'first');
  assert.equal(a.unlocked, true);
});
