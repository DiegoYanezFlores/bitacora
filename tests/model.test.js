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

test('progreso: métrica', () => {
  const p = store.create('projects', { name: 'Capital', metric_start: 100, metric_current: 60, metric_target: 0, metric_unit: 'USD' });
  const r = model.progress(p);
  assert.equal(r.mode, 'metric');
  assert.equal(r.pct, 40);
  assert.match(r.label, /USD$/);
});

test('progreso: hitos pesan el doble que tareas (fórmula v2)', () => {
  const p = store.create('projects', { name: 'P' });
  store.create('milestones', { project_id: p.id, title: 'H', done_at: new Date().toISOString() });
  store.create('tasks', { project_id: p.id, title: 'a', status: 'done' });
  store.create('tasks', { project_id: p.id, title: 'b' });
  const r = model.progress(p);
  assert.equal(r.mode, 'auto');
  assert.equal(r.pct, 75); // (1·2 + 1) / (1·2 + 2)
  assert.equal(r.label, '1/2 tareas · 1/1 hitos');
});

test('progreso: manual, sin datos y completado', () => {
  assert.equal(model.progress(store.create('projects', { name: 'M', progress_manual: 30 })).pct, 30);
  assert.equal(model.progress(store.create('projects', { name: 'N' })).mode, 'none');
  assert.equal(model.progress(store.create('projects', { name: 'D', status: 'done' })).pct, 100);
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
