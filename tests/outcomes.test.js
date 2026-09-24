// Resultado real de una tarea: cerrar sin haberla hecho, reprogramar y conservar lo previsto.
import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RESULTS, isResult, outcomeLabel, closePatch, reopenPatch, reschedulePatch, closeEntry, rescheduleEntry, reopenEntry, plannedDate, dayEvents, wasDone, notDone, isOpen } from '../app/domain/outcomes.js';

const task = (o = {}) => ({ id: 't1', title: 'Reunión con equipo', status: 'todo', due_date: '2026-09-25', ...o });

test('los resultados cubren lo que pasa de verdad y solo uno significa que se hizo', () => {
  assert.deepEqual(Object.keys(RESULTS), ['done', 'not_done', 'no_show', 'blocked', 'canceled']);
  assert.equal(Object.values(RESULTS).filter(r => r.did).length, 1);
  assert.equal(isResult('no_show'), true);
  assert.equal(isResult('fracaso'), false);
  assert.throws(() => closePatch('fracaso'), /Resultado desconocido/);
});

test('cerrar como no realizada no la deja como completada', () => {
  const p = closePatch('no_show', { note: 'No asistieron dos participantes.', at: '2026-09-25T18:00:00.000Z' });
  assert.equal(p.status, 'done');
  assert.equal(p.result, 'no_show');
  assert.equal(p.completed_at, null); // solo se completa lo que se hizo
  assert.equal(p.result_at, '2026-09-25T18:00:00.000Z');
  const t = task({ ...p });
  assert.equal(wasDone(t), false);
  assert.equal(notDone(t), true);
  assert.equal(isOpen(t), false);
  assert.equal(outcomeLabel(t), 'Falta de asistencia');
});

test('cerrar como completada sí marca completed_at', () => {
  const p = closePatch('done', { at: '2026-09-25T18:00:00.000Z' });
  assert.equal(p.completed_at, '2026-09-25T18:00:00.000Z');
  assert.equal(wasDone(task(p)), true);
  assert.equal(outcomeLabel(task(p)), 'Completada');
});

test('una tarea cerrada antes de 005, sin resultado, se sigue leyendo como completada', () => {
  const vieja = task({ status: 'done', completed_at: '2026-09-01T10:00:00.000Z', result: undefined });
  assert.equal(wasDone(vieja), true);
  assert.equal(notDone(vieja), false);
  assert.equal(outcomeLabel(vieja), 'Completada');
});

test('la nota es opcional y se recorta a 500 caracteres', () => {
  assert.equal(closePatch('blocked').result_note, '');
  assert.equal(closePatch('blocked', { note: 'x'.repeat(600) }).result_note.length, 500);
});

test('reprogramar deja la tarea pendiente, nunca completada', () => {
  const t = task();
  const p = reschedulePatch('2026-09-27', t);
  assert.deepEqual([p.due_date, p.status, p.result, p.completed_at], ['2026-09-27', 'todo', null, null]);
  // También sirve para devolver a pendiente una que se había cerrado.
  const cerrada = task({ ...closePatch('blocked') });
  assert.equal(reschedulePatch('2026-09-27', cerrada).status, 'todo');
  // Una tarea en curso conserva su estado.
  assert.equal(reschedulePatch('2026-09-27', task({ status: 'doing' })).status, 'doing');
  assert.throws(() => reschedulePatch('27/09/2026', t), /Fecha inválida/);
});

test('reabrir borra el resultado sin dejar rastro falso de haberse hecho', () => {
  const p = reopenPatch();
  assert.deepEqual([p.status, p.result, p.result_note, p.completed_at], ['todo', null, '', null]);
});

test('el registro conserva la fecha prevista aunque la tarea se mueva', () => {
  const t = task({ due_date: '2026-09-25' });
  const mov1 = rescheduleEntry(t, '2026-09-27', 'Faltaban documentos.');
  assert.deepEqual([mov1.type, mov1.from_date, mov1.to_date], ['rescheduled', '2026-09-25', '2026-09-27']);
  const t2 = { ...t, due_date: '2026-09-27' };
  const mov2 = rescheduleEntry(t2, '2026-10-01');
  const log = [mov1, mov2].map((e, i) => ({ ...e, id: 'l' + i }));
  // La primera fecha prevista sigue siendo el 25, aunque ya vaya por el 1 de octubre.
  assert.equal(plannedDate({ ...t, due_date: '2026-10-01' }, log), '2026-09-25');
  assert.equal(plannedDate(task({ id: 'otra', due_date: '2026-11-02' }), log), '2026-11-02');
});

test('el cierre queda anotado en el día en que estaba planificada', () => {
  const t = task({ due_date: '2026-09-25' });
  const e = closeEntry(t, 'no_show', 'Nadie asistió.', '2026-09-26T09:00:00.000Z');
  assert.deepEqual([e.type, e.result, e.from_date, e.note], ['closed', 'no_show', '2026-09-25', 'Nadie asistió.']);
  assert.equal(reopenEntry(t).type, 'reopened');
});

test('el calendario ve en cada día lo no realizado y lo movido, no lo completado', () => {
  const t = task({ due_date: '2026-09-25' });
  const log = [
    { id: '1', ...closeEntry(t, 'no_show') },
    { id: '2', ...rescheduleEntry(t, '2026-09-27') },
    { id: '3', ...closeEntry(t, 'done') },
    { id: '4', ...closeEntry({ ...t, due_date: '2026-09-20' }, 'canceled') },
    { id: '5', ...rescheduleEntry(t, '2026-09-28'), deleted_at: '2026-09-26T00:00:00.000Z' }
  ];
  const del25 = dayEvents(log, '2026-09-25');
  assert.deepEqual(del25.map(e => e.id), ['1', '2']); // ni la completada ni la borrada
  assert.deepEqual(dayEvents(log, '2026-09-20').map(e => e.id), ['4']);
  assert.equal(dayEvents(log, '2026-09-27').length, 0); // el día nuevo la verá como pendiente, no como evento
});
