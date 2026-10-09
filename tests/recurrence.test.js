// Actividades recurrentes: que las fechas salgan exactas, sin duplicados y sin bucles.
import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRule, matches, daysBetween, nextDay, expand, agenda, conflicts, describe, untilBefore, isSeries, isOccurrence, MAX_OCCURRENCES } from '../app/domain/recurrence.js';

// Clases de 07:00 a 11:00, de lunes a viernes, desde el martes 13 de octubre de 2026.
const clases = {
  id: 's1', title: 'Asistir a clases', due_date: '2026-10-13', start_time: '07:00', end_time: '11:00',
  repeat: { freq: 'weekly', interval: 1, byday: ['mo', 'tu', 'we', 'th', 'fr'], until: '2027-02-28' }
};

test('la regla se limpia: lo inválido no genera repeticiones', () => {
  assert.equal(normalizeRule(null), null);
  assert.equal(normalizeRule({ freq: 'cada rato' }), null);
  const r = normalizeRule({ freq: 'weekly', interval: '2', byday: ['mo', 'mo', 'xx'], until: 'mañana' });
  assert.deepEqual([r.freq, r.interval, r.byday, r.until], ['weekly', 2, ['mo'], null]);
  assert.equal(normalizeRule({ freq: 'daily', interval: 999 }).interval, 30);
  assert.equal(isSeries(clases), true);
  assert.equal(isSeries({ title: 'suelta' }), false);
  assert.equal(isOccurrence({ series_id: 's1', occurrence_date: '2026-10-14' }), true);
});

test('semanal de lunes a viernes: cae en los días correctos y no en fin de semana', () => {
  const dias = daysBetween(clases, '2026-10-12', '2026-10-25');
  assert.deepEqual(dias, ['2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', // mar–vie de la 1.ª semana
    '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23']);        // lun–vie de la 2.ª
  assert.equal(matches(clases.repeat, clases.due_date, '2026-10-17'), false, 'sábado no');
  assert.equal(matches(clases.repeat, clases.due_date, '2026-10-18'), false, 'domingo no');
  assert.equal(matches(clases.repeat, clases.due_date, '2026-10-12'), false, 'antes de empezar, no');
});

test('la fecha final corta la serie', () => {
  assert.equal(daysBetween(clases, '2027-02-25', '2027-03-10').at(-1), '2027-02-26'); // viernes
  assert.equal(matches(clases.repeat, clases.due_date, '2027-03-01'), false);
  assert.equal(nextDay(clases, '2027-03-02'), null);
  assert.equal(nextDay(clases, '2026-10-17'), '2026-10-19'); // del sábado al lunes
});

test('cada dos semanas, diaria con intervalo y mensual', () => {
  const quincenal = { id: 'q', due_date: '2026-10-05', repeat: { freq: 'weekly', interval: 2, byday: ['mo'] } };
  assert.deepEqual(daysBetween(quincenal, '2026-10-01', '2026-11-05'), ['2026-10-05', '2026-10-19', '2026-11-02']);
  const cada3 = { id: 'd', due_date: '2026-10-01', repeat: { freq: 'daily', interval: 3 } };
  assert.deepEqual(daysBetween(cada3, '2026-10-01', '2026-10-10'), ['2026-10-01', '2026-10-04', '2026-10-07', '2026-10-10']);
  const mensual = { id: 'm', due_date: '2026-01-31', repeat: { freq: 'monthly', interval: 1 } };
  const dias = daysBetween(mensual, '2026-01-01', '2026-05-01');
  assert.deepEqual(dias, ['2026-01-31', '2026-03-31']); // febrero y abril no tienen día 31: se saltan
});

test('sin días marcados se repite el mismo día de la semana que el de inicio', () => {
  const s = { id: 'x', due_date: '2026-10-14', repeat: { freq: 'weekly', interval: 1 } }; // miércoles
  assert.deepEqual(daysBetween(s, '2026-10-12', '2026-11-01'), ['2026-10-14', '2026-10-21', '2026-10-28']);
});

test('nunca genera de más: la ventana y el tope mandan', () => {
  const infinita = { id: 'i', due_date: '2020-01-01', repeat: { freq: 'daily', interval: 1 } };
  assert.equal(daysBetween(infinita, '2020-01-01', '2030-01-01').length, MAX_OCCURRENCES);
  assert.equal(daysBetween(infinita, '2026-10-01', '2026-10-31').length, 31);
  assert.equal(daysBetween({ id: 'z', due_date: null, repeat: { freq: 'daily' } }, '2026-10-01', '2026-10-31').length, 0);
});

test('una ocurrencia guardada manda sobre la calculada, sin duplicarla', () => {
  const guardadas = [
    { id: 'o1', series_id: 's1', occurrence_date: '2026-10-14', title: 'Clases', status: 'done', result: 'done' },
    { id: 'o2', series_id: 's1', occurrence_date: '2026-10-15', status: 'done', result: 'no_show' },
    { id: 'otra', series_id: 'otra-serie', occurrence_date: '2026-10-14', status: 'done' }
  ];
  const lista = expand(clases, '2026-10-13', '2026-10-16', guardadas);
  assert.deepEqual(lista.map(o => o.day), ['2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16']);
  assert.equal(lista.filter(o => o.day === '2026-10-14').length, 1, 'no se duplica');
  assert.equal(lista.find(o => o.day === '2026-10-14').result, 'done');
  assert.equal(lista.find(o => o.day === '2026-10-15').result, 'no_show');
  assert.equal(lista.find(o => o.day === '2026-10-13').saved, null, 'las no tocadas no ocupan sitio en la base');
  assert.equal(lista.every(o => o.start_time === '07:00'), true);
});

test('una ocurrencia movida desaparece de su día y aparece en el nuevo', () => {
  const movida = [{ id: 'o3', series_id: 's1', occurrence_date: '2026-10-14', due_date: '2026-10-17', title: 'Clases' }];
  const lista = expand(clases, '2026-10-13', '2026-10-18', movida);
  assert.equal(lista.some(o => o.day === '2026-10-14'), false, 'ya no está el día previsto');
  const nueva = lista.find(o => o.day === '2026-10-17');
  assert.ok(nueva, 'está en el día nuevo');
  assert.equal(nueva.movedFrom, '2026-10-14');
});

test('agenda del día: orden por hora y huecos libres', () => {
  const items = [
    { title: 'Clases', start_time: '07:00', end_time: '11:00' },
    { title: 'Gimnasio', start_time: '18:00', end_time: '19:00' },
    { title: 'Leer', start_time: null }
  ];
  const a = agenda(items);
  assert.deepEqual(a.rows.map(r => r.kind), ['item', 'gap', 'item']);
  assert.equal(a.rows[0].item.title, 'Clases');
  assert.equal(a.rows[1].minutes, 420);
  assert.equal(a.rows[1].label, '07:00 libre');
  assert.deepEqual(a.untimed.map(i => i.title), ['Leer']);
  // Huecos muy cortos no ensucian la agenda.
  assert.equal(agenda([{ start_time: '09:00', end_time: '09:30' }, { start_time: '09:40', end_time: '10:00' }]).rows.filter(r => r.kind === 'gap').length, 0);
});

test('los choques de horario se detectan, pero no se prohíben', () => {
  const choque = conflicts([
    { title: 'Clases', start_time: '07:00', end_time: '11:00' },
    { title: 'Reunión', start_time: '10:30', end_time: '11:30' },
    { title: 'Comida', start_time: '13:00', end_time: '14:00' }
  ]);
  assert.equal(choque.length, 1);
  assert.deepEqual(choque[0].map(i => i.title), ['Clases', 'Reunión']);
  assert.equal(conflicts([{ start_time: '07:00', end_time: '08:00' }, { start_time: '08:00', end_time: '09:00' }]).length, 0);
});

test('la regla se explica en palabras', () => {
  assert.equal(describe(clases, { fmtDay: d => d }), 'De lunes a viernes · 07:00–11:00 · hasta el 2027-02-28');
  assert.equal(describe({ due_date: '2026-10-13', repeat: { freq: 'daily', interval: 1 } }), 'Cada día');
  assert.equal(describe({ due_date: '2026-10-13', repeat: { freq: 'weekly', byday: ['tu', 'th'] } }), 'martes y jueves');
  assert.equal(describe({ due_date: '2026-10-05', repeat: { freq: 'monthly', interval: 2 } }), 'El día 5, cada 2 meses');
  assert.equal(describe({ title: 'suelta' }), '');
});

test('cortar una serie: "esta y las siguientes" termina la anterior el día antes', () => {
  assert.equal(untilBefore('2026-11-02'), '2026-11-01');
  const cortada = { ...clases, repeat: { ...clases.repeat, until: untilBefore('2026-11-02') } };
  assert.equal(daysBetween(cortada, '2026-10-26', '2026-11-10').at(-1), '2026-10-30');
  assert.equal(matches(cortada.repeat, cortada.due_date, '2026-11-02'), false);
});
