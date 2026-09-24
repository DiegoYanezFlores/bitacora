// Calendario: rejillas de mes y semana, reparto por día y separación entre planificado y hecho.
import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthGrid, weekGrid, addMonths, monthKeyOf, indexByDay, daySummary, isOverdue, undatedOpen, overdueTasks, dateShortcuts, rangeSummary, monthDays } from '../app/domain/calendar.js';
import { dayKey } from '../app/lib.js';

const task = (o = {}) => ({ id: o.id || 't', status: 'todo', project_id: null, ...o });
const act = (day, o = {}) => ({ id: o.id || 'a', occurred_at: `${day}T10:00:00.000Z`, project_id: null, ...o });
const dayOfActivity = a => a.occurred_at.slice(0, 10);

test('rejilla del mes: semanas completas de lunes a domingo', () => {
  const weeks = monthGrid('2026-09-01'); // 1 de septiembre de 2026 es martes
  assert.equal(weeks[0][0].day, '2026-08-31'); // empieza el lunes anterior
  assert.equal(weeks[0][0].outside, true);
  assert.equal(weeks[0][1].day, '2026-09-01');
  assert.equal(weeks[0][1].outside, false);
  assert.ok(weeks.every(w => w.length === 7));
  const last = weeks.at(-1).at(-1).day;
  assert.ok(last >= '2026-09-30'); // el mes entero está dentro
  assert.ok(weeks.flat().filter(c => !c.outside).length === 30);
});

test('rejilla del mes: febrero de un año bisiesto empieza en lunes', () => {
  const weeks = monthGrid('2027-02-01');
  assert.equal(weeks.flat().filter(c => !c.outside).length, 28);
  assert.equal(monthGrid('2028-02-01').flat().filter(c => !c.outside).length, 29);
});

test('navegación de meses: cruza el cambio de año sin perderse', () => {
  assert.equal(addMonths('2026-12-01', 1), '2027-01-01');
  assert.equal(addMonths('2026-01-01', -1), '2025-12-01');
  assert.equal(addMonths('2026-03-31', 1), '2026-04-01'); // se normaliza al día 1
  assert.equal(monthKeyOf('2026-09-24'), '2026-09-01');
});

test('la semana empieza en lunes y trae siete días', () => {
  const week = weekGrid('2026-09-24'); // jueves
  assert.equal(week[0].day, '2026-09-21');
  assert.equal(week.at(-1).day, '2026-09-27');
  assert.equal(week.length, 7);
});

test('reparto por día: la fecha planificada no se desplaza por la zona horaria', () => {
  const prev = process.env.TZ;
  for (const tz of ['UTC', 'Pacific/Kiritimati', 'Pacific/Niue', 'America/Santiago']) {
    process.env.TZ = tz;
    const map = indexByDay({ tasks: [task({ due_date: '2026-09-25' })], activities: [], dayOfActivity });
    assert.equal(map.get('2026-09-25').pending.length, 1, tz);
    assert.equal(map.has('2026-09-24'), false, tz);
  }
  process.env.TZ = prev;
});

test('una tarea sin fecha nunca aparece en un día del calendario', () => {
  const sinFecha = task({ id: 'x', due_date: null });
  const map = indexByDay({ tasks: [sinFecha], activities: [], dayOfActivity });
  assert.equal(map.size, 0);
  assert.equal(undatedOpen([sinFecha]).length, 1);
  assert.equal(undatedOpen([task({ id: 'y', due_date: '2026-09-25' })]).length, 0);
  assert.equal(undatedOpen([task({ id: 'z', status: 'done' })]).length, 0);
});

test('planificado y hecho no se mezclan: pendiente, completada y actividad van por separado', () => {
  const map = indexByDay({
    tasks: [task({ id: '1', due_date: '2026-09-24' }), task({ id: '2', due_date: '2026-09-24', status: 'done' })],
    activities: [act('2026-09-24'), act('2026-09-24', { id: 'b' })],
    dayOfActivity
  });
  const c = map.get('2026-09-24');
  assert.deepEqual([c.pending.length, c.done.length, c.activities.length], [1, 1, 2]);
  const s = daySummary(c, '2026-09-24', '2026-09-24');
  assert.deepEqual([s.pending, s.done, s.activities, s.total, s.isToday, s.overdue], [1, 1, 2, 4, true, 0]);
});

test('un día con actividad pero sin tareas también cuenta como día trabajado', () => {
  const map = indexByDay({ tasks: [], activities: [act('2026-09-20')], dayOfActivity });
  const s = daySummary(map.get('2026-09-20'), '2026-09-20', '2026-09-24');
  assert.deepEqual([s.activities, s.pending, s.total, s.isPast], [1, 0, 1, true]);
});

test('vencida: fecha pasada y sin terminar; completar deja de serlo', () => {
  const hoy = '2026-09-24';
  const vieja = task({ id: 'v', due_date: '2026-09-20' });
  assert.equal(isOverdue(vieja, hoy), true);
  assert.equal(isOverdue({ ...vieja, status: 'done' }, hoy), false);
  assert.equal(isOverdue(task({ id: 'h', due_date: hoy }), hoy), false);
  assert.equal(isOverdue(task({ id: 'f', due_date: '2026-10-01' }), hoy), false);
  assert.equal(isOverdue(task({ id: 's' }), hoy), false);
  assert.equal(overdueTasks([vieja, task({ id: 'h', due_date: hoy })], hoy).length, 1);
  const s = daySummary(indexByDay({ tasks: [vieja], activities: [], dayOfActivity }).get('2026-09-20'), '2026-09-20', hoy);
  assert.equal(s.overdue, 1);
});

test('filtro por objetivo: solo lo de ese objetivo, tareas y actividades', () => {
  const map = indexByDay({
    tasks: [task({ id: '1', due_date: '2026-09-24', project_id: 'p1' }), task({ id: '2', due_date: '2026-09-24', project_id: 'p2' })],
    activities: [act('2026-09-24', { project_id: 'p1' }), act('2026-09-24', { id: 'b', project_id: 'p2' })],
    dayOfActivity,
    project: 'p1'
  });
  const c = map.get('2026-09-24');
  assert.deepEqual([c.pending.length, c.activities.length], [1, 1]);
  assert.equal(c.pending[0].id, '1');
  assert.equal(overdueTasks([task({ id: 'v', due_date: '2026-09-01', project_id: 'p2' })], '2026-09-24', 'p1').length, 0);
});

test('atajos de fecha: hoy, mañana y el lunes siguiente', () => {
  const s = dateShortcuts('2026-09-24'); // jueves
  assert.deepEqual(s.map(x => x.day), ['2026-09-24', '2026-09-25', '2026-09-28']);
  assert.equal(dateShortcuts(dayKey())[0].day, dayKey());
});

// --- resultados y reprogramación en el calendario (005) ---
import { closePatch, rescheduleEntry } from '../app/domain/outcomes.js';

test('una tarea no realizada no se cuenta como completada y sigue en su día', () => {
  const t = task({ id: 'r1', due_date: '2026-09-25', ...closePatch('no_show') });
  const map = indexByDay({ tasks: [t], activities: [], dayOfActivity });
  const c = map.get('2026-09-25');
  assert.deepEqual([c.done.length, c.notDone.length, c.pending.length], [0, 1, 0]);
  const s = daySummary(c, '2026-09-25', '2026-09-26');
  assert.deepEqual([s.notDone, s.done, s.overdue, s.total], [1, 0, 0, 1]);
  assert.equal(overdueTasks([t], '2026-09-26').length, 0); // cerrada: ya no espera nada
  assert.equal(undatedOpen([t]).length, 0);
});

test('reprogramar deja huella en el día previsto y la tarea pendiente en el nuevo', () => {
  const original = task({ id: 'r2', due_date: '2026-09-25' });
  const log = [{ id: 'l1', ...rescheduleEntry(original, '2026-09-27', 'Faltaban documentos.') }];
  const movida = { ...original, due_date: '2026-09-27' };
  const map = indexByDay({ tasks: [movida], activities: [], taskLog: log, dayOfActivity });
  const viejo = map.get('2026-09-25');
  assert.equal(viejo.moved.length, 1);
  assert.equal(viejo.moved[0].to, '2026-09-27');
  assert.equal(viejo.moved[0].note, 'Faltaban documentos.');
  assert.equal(viejo.pending.length, 0); // ya no está prevista ahí
  assert.equal(map.get('2026-09-27').pending.length, 1); // sigue siendo una tarea por hacer
  assert.equal(daySummary(viejo, '2026-09-25', '2026-09-28').moved, 1);
});

test('si la tarea vuelve a su día original, el movimiento deja de contarse', () => {
  const t = task({ id: 'r3', due_date: '2026-09-25' });
  const log = [{ id: 'l2', ...rescheduleEntry(t, '2026-09-27') }];
  const map = indexByDay({ tasks: [t], activities: [], taskLog: log, dayOfActivity });
  assert.equal(map.get('2026-09-25').moved.length, 0);
  assert.equal(map.get('2026-09-25').pending.length, 1);
});

test('resumen del periodo: cuenta lo hecho, lo no hecho y lo movido, sin juzgar', () => {
  const cells = indexByDay({
    tasks: [
      task({ id: 'a', due_date: '2026-09-02', status: 'done' }),
      task({ id: 'b', due_date: '2026-09-03', ...closePatch('blocked') }),
      task({ id: 'c', due_date: '2026-09-30' }),
      task({ id: 'd', due_date: '2026-10-05', status: 'done' }) // otro mes: fuera del resumen
    ],
    activities: [act('2026-09-02'), act('2026-09-02', { id: 'a2' }), act('2026-09-15', { id: 'a3' })],
    taskLog: [{ id: 'l', ...rescheduleEntry(task({ id: 'c', due_date: '2026-09-10' }), '2026-09-30') }],
    dayOfActivity
  });
  const s = rangeSummary(cells, monthDays('2026-09-01'));
  assert.deepEqual([s.done, s.notDone, s.moved, s.pending, s.activities, s.activeDays], [1, 1, 1, 1, 3, 2]);
  assert.equal(monthDays('2026-09-01').length, 30);
  assert.equal(monthDays('2026-02-01').length, 28);
  // Un mes sin nada no inventa números.
  assert.deepEqual(rangeSummary(cells, monthDays('2026-11-01')), { done: 0, notDone: 0, moved: 0, pending: 0, activities: 0, activeDays: 0 });
});
