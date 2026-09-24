// Fecha de la actividad: a qué día pertenece lo registrado, sin que la zona horaria lo mueva.
import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _test } from '../app/capture.js';
import { dayKey, addDays } from '../app/lib.js';

const { whenOf } = _test;
const withTZ = (tz, fn) => { const prev = process.env.TZ; process.env.TZ = tz; try { fn(); } finally { process.env.TZ = prev; } };

test('un día pasado se guarda en ese día, no en el de registro', () => {
  const d = whenOf('2026-09-23', '23:50');
  assert.equal(dayKey(d), '2026-09-23');
  assert.equal(d.getHours(), 23);
  assert.equal(d.getMinutes(), 50);
});

test('sin hora, la actividad se sitúa al mediodía del día elegido', () => {
  const d = whenOf('2026-09-23');
  assert.equal(dayKey(d), '2026-09-23');
  assert.equal(d.getHours(), 12);
});

test('registrar a las 00:10 lo de ayer lo deja en ayer, no en hoy', () => {
  // El caso real: se llena la bitácora de noche y ya cambió la fecha.
  const ayer = addDays(dayKey(), -1);
  const d = whenOf(ayer, '23:55');
  assert.equal(dayKey(d), ayer);
  assert.notEqual(dayKey(d), dayKey());
});

test('la fecha no se desplaza un día en ninguna zona horaria', () => {
  // toISOString() sobre una hora local tardía daría el día siguiente: por eso no se usa.
  for (const tz of ['America/Guayaquil', 'UTC', 'Pacific/Kiritimati', 'Pacific/Niue', 'Asia/Kolkata']) {
    withTZ(tz, () => {
      const d = whenOf('2026-09-23', '23:30');
      assert.equal(dayKey(d), '2026-09-23', tz);
      assert.equal(whenOf('2026-09-23', '00:10').getDate(), 23, tz);
    });
  }
});

test('el cambio de horario de verano no pierde el día', () => {
  withTZ('Europe/Madrid', () => { // 29-03-2026 y 25-10-2026
    assert.equal(dayKey(whenOf('2026-03-29')), '2026-03-29');
    assert.equal(dayKey(whenOf('2026-10-25', '02:30')), '2026-10-25');
  });
});

test('hoy sin hora conserva la hora actual (la actividad de ahora)', () => {
  const now = new Date();
  const d = whenOf(dayKey());
  assert.equal(dayKey(d), dayKey());
  assert.ok(Math.abs(d - now) < 60000);
});

test('una fecha imposible no rompe: cae en la fecha y hora actuales', () => {
  const d = whenOf('no-es-fecha');
  assert.equal(dayKey(d), dayKey());
});
