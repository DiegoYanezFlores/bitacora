// Celebraciones: solo cuando se hizo algo, una sola vez, y siempre bajo el control del usuario.
import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plan, dayComplete, firstTime, remember, streakMark, taskKey, dayKeyOf, streakKey, STREAK_MARKS } from '../app/domain/celebration.js';

test('apagadas no celebran nada, pase lo que pase', () => {
  for (const type of ['task', 'milestone', 'day', 'goal', 'streak']) {
    assert.equal(plan({ type, key: 'k' }, { level: 'off' }), null, type);
    assert.equal(plan({ type, key: 'k' }, { level: 'off', reducedMotion: true }), null);
  }
});

test('discretas: mensaje sí, confeti no', () => {
  const p = plan({ type: 'milestone', key: 'ms:1' }, { level: 'soft' });
  assert.equal(p.pieces, 0);
  assert.ok(p.message);
  assert.equal(p.level, 'soft');
});

test('si el sistema pide menos movimiento, la intensidad baja sola', () => {
  const p = plan({ type: 'goal', key: 'g:1' }, { level: 'full', reducedMotion: true });
  assert.equal(p.level, 'soft');
  assert.equal(p.pieces, 0);
  assert.ok(plan({ type: 'goal', key: 'g:1' }, { level: 'full' }).pieces > 0);
});

test('cada tipo celebra con la intensidad que le corresponde', () => {
  const piezas = t => plan({ type: t, key: t }, { level: 'full' }).pieces;
  assert.ok(piezas('goal') > piezas('milestone'));
  assert.ok(piezas('milestone') > piezas('task'));
  assert.ok(piezas('task') > 0);
  assert.equal(plan({ type: 'inventado', key: 'x' }, { level: 'full' }), null);
  assert.equal(plan(null, { level: 'full' }), null);
});

test('el mensaje describe el hecho y es estable para el mismo evento', () => {
  const a = plan({ type: 'task', key: 'task:42' }, { level: 'full' });
  const b = plan({ type: 'task', key: 'task:42' }, { level: 'full' });
  assert.equal(a.message, b.message, 'la misma tarea siempre dice lo mismo');
  assert.match(plan({ type: 'streak', key: streakKey(7), n: 7 }, { level: 'full' }).message, /^7 /);
});

test('el día solo se celebra si había algo planificado y está todo hecho', () => {
  assert.equal(dayComplete([]), false, 'un día vacío no es un logro');
  assert.equal(dayComplete([{ status: 'done' }, { status: 'done' }]), true);
  assert.equal(dayComplete([{ status: 'done' }, { status: 'todo' }]), false);
  // Una tarea no realizada cierra el día igual: lo que cuenta es que no queda nada abierto.
  assert.equal(dayComplete([{ status: 'done' }, { status: 'done', result: 'no_show' }]), true);
});

test('las rachas solo se mencionan en marcas concretas', () => {
  assert.deepEqual(STREAK_MARKS, [7, 30, 100, 365]);
  assert.equal(streakMark(7), 7);
  assert.equal(streakMark(8), null);
  assert.equal(streakMark(1), null);
});

test('nada se celebra dos veces, aunque la acción se repita', () => {
  let visto = {};
  const clave = taskKey('t1');
  assert.equal(firstTime(clave, visto), true);
  visto = remember(clave, visto);
  assert.equal(firstTime(clave, visto), false, 'un reintento o una bajada del servidor no repite la fiesta');
  assert.equal(firstTime(dayKeyOf('2026-10-08'), visto), true);
});

test('el registro de lo celebrado no crece sin fin', () => {
  let visto = {};
  for (let i = 0; i < 260; i++) visto = remember(`task:${i}`, visto, `2026-10-08T00:${String(i % 60).padStart(2, '0')}:00Z`, 200);
  assert.ok(Object.keys(visto).length <= 200);
  assert.equal(firstTime('task:259', visto), false, 'lo más reciente se conserva');
});
