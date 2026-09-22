// Funciones puras: fechas, días activos, racha, mapa y periodos.
import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayKey, addDays, weekStart, daysBetween, esc, stableUuid, plural } from '../app/lib.js';
import { countByDay, streakOf, weekOf, heatLevel, heatmapOf } from '../app/domain/days.js';
import { periodOf } from '../app/domain/period.js';

const days = keys => new Map(keys.map(k => [k, 1]));

test('fechas: suma de días, lunes de la semana y diferencia', () => {
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(weekStart('2026-09-20'), '2026-09-14'); // domingo → lunes anterior
  assert.equal(weekStart('2026-09-14'), '2026-09-14');
  assert.equal(daysBetween('2026-09-01', '2026-09-18'), 17);
});

test('fechas: el cambio de horario no duplica ni pierde días', () => {
  const prev = process.env.TZ;
  process.env.TZ = 'Europe/Madrid'; // DST el 29-03-2026 y el 25-10-2026
  try {
    assert.equal(addDays('2026-03-28', 1), '2026-03-29');
    assert.equal(addDays('2026-03-29', 1), '2026-03-30');
    assert.equal(addDays('2026-10-25', 1), '2026-10-26');
    assert.equal(daysBetween('2026-03-01', '2026-04-01'), 31);
    assert.equal(dayKey(new Date(2026, 2, 29, 23, 30)), '2026-03-29');
  } finally { process.env.TZ = prev; }
});

test('escape de HTML y plurales', () => {
  assert.equal(esc('<img src=x onerror="a">'), '&lt;img src=x onerror=&quot;a&quot;&gt;');
  assert.equal(esc(null), '');
  assert.equal(plural(1, 'día', 'días'), '1 día');
  assert.equal(plural(0, 'día', 'días'), '0 días');
});

test('uuid determinista: misma entrada, mismo id (migraciones idempotentes)', async () => {
  const a = await stableUuid('u1:milestone_first');
  assert.equal(a, await stableUuid('u1:milestone_first'));
  assert.notEqual(a, await stableUuid('u2:milestone_first'));
  assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('conteo por día', () => {
  const m = countByDay([{ d: 'a' }, { d: 'a' }, { d: 'b' }], x => x.d);
  assert.deepEqual([...m], [['a', 2], ['b', 1]]);
});

test('racha: huecos cortan la actual; la mejor cruza años', () => {
  const d = days(['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02', '2026-09-16', '2026-09-18']);
  assert.deepEqual(streakOf(d, '2026-09-18'), { current: 1, best: 4, today: true });
  assert.deepEqual(streakOf(new Map(), '2026-09-18'), { current: 0, best: 0, today: false });
});

test('semana y niveles del mapa', () => {
  const w = weekOf(new Map([['2026-09-14', 2], ['2026-09-16', 1]]), '2026-09-14', 4);
  assert.equal(w.active, 2);
  assert.equal(w.total, 3);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 40].map(heatLevel), [0, 1, 2, 2, 3, 3, 4, 4]);
  const cols = heatmapOf(new Map(), '2026-09-18', 18);
  assert.equal(cols.length, 18);
  assert.equal(cols[17][0].key, '2026-09-14');
  assert.equal(cols[0][0].key, addDays('2026-09-14', -7 * 17));
});

test('periodo mensual: días del mes y cambio de año', () => {
  const ctx = { today: '2026-01-15', activities: [], tasks: [], milestones: [], project: () => null, dayOf: a => a.day };
  const feb = periodOf('month', 1, ctx);
  assert.equal(feb.start, '2026-02-01');
  assert.equal(feb.series.length, 28);
  const dec = periodOf('month', -1, ctx);
  assert.equal(dec.start, '2025-12-01');
  assert.equal(dec.end, '2025-12-31');
});

test('periodo: hitos y tareas cerrados dentro del rango', () => {
  const noonIso = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12).toISOString(); };
  const r = periodOf('week', 0, {
    today: '2026-09-18',
    activities: [{ day: '2026-09-15', kind: 'win' }, { day: '2026-09-10', kind: 'done' }],
    tasks: [{ status: 'done', completed_at: noonIso('2026-09-16') }, { status: 'done', completed_at: noonIso('2026-09-01') }],
    milestones: [{ done_at: noonIso('2026-09-14') }],
    project: () => null,
    dayOf: a => a.day
  });
  assert.equal(r.activities, 1);
  assert.equal(r.wins, 1);
  assert.equal(r.tasksDone, 1);
  assert.equal(r.milestonesDone, 1);
});
