// Preferencias: valores por defecto válidos desde el primer arranque y tolerancia a datos corruptos.
import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, PALETTES, resolve, normalizeBackground, activeBackground, celebrationLevel, resetAppearance, MAX_MEDIA } from '../app/domain/prefs.js';

test('sin nada guardado, la app tiene una apariencia válida', () => {
  const p = resolve();
  assert.equal(p.palette, 'cobalto');
  assert.equal(p.background.kind, 'none');
  assert.equal(p.celebrate, 'full');
  assert.equal(p.quotes, 'all');
  assert.ok(Object.keys(PALETTES).includes(p.palette));
  assert.deepEqual(resolve(null), resolve(undefined));
});

test('lo guardado manda, pero lo inválido vuelve al valor por defecto', () => {
  const p = resolve({ palette: 'neon-magenta', celebrate: 'soft', theme: 'dark', weeklyGoal: 6 });
  assert.deepEqual([p.palette, p.celebrate, p.theme, p.weeklyGoal], ['neon-magenta', 'soft', 'dark', 6]);
  const malo = resolve({ palette: 'no-existe', celebrate: 'fiesta', theme: 'arcoíris', weeklyGoal: 99, quotes: 'x' });
  assert.deepEqual([malo.palette, malo.celebrate, malo.theme, malo.weeklyGoal, malo.quotes], ['cobalto', 'full', 'system', 7, 'all']);
  // Un prefs corrupto no rompe la pantalla.
  assert.equal(resolve('basura').palette, 'cobalto');
  assert.equal(resolve({ background: 'rota' }).background.kind, 'none');
});

test('el fondo se normaliza: recortes, opacidad y desenfoque dentro de rango', () => {
  const b = normalizeBackground({ kind: 'library', id: 'montana', fit: 'top', dim: 120, blur: -5, rotate: 'sí' });
  assert.deepEqual([b.kind, b.id, b.fit, b.dim, b.blur, b.rotate], ['library', 'montana', 'top', 90, 0, true]);
  assert.equal(normalizeBackground({ kind: 'none', id: 'x' }).id, '');
  assert.equal(normalizeBackground({ kind: 'inventado' }).kind, 'none');
});

test('el fondo activo sale de la biblioteca o de las fotos propias', () => {
  const library = [{ id: 'montana' }, { id: 'bosque' }];
  const prefs = resolve({ background: { kind: 'library', id: 'bosque' } });
  assert.equal(activeBackground(prefs, { library }).item.id, 'bosque');
  // Si la imagen elegida ya no está, se usa otra válida en vez de dejar un hueco roto.
  assert.equal(activeBackground(resolve({ background: { kind: 'library', id: 'borrada' } }), { library }).item.id, 'montana');
  // Sin fotos propias no se pinta un fondo vacío.
  assert.equal(activeBackground(resolve({ background: { kind: 'photo', id: 'x' } }), { library }), null);
  assert.equal(activeBackground(resolve(), { library }), null);
});

test('la rotación cambia por día y no parpadea dentro del mismo día', () => {
  const library = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const prefs = resolve({ background: { kind: 'library', id: 'a', rotate: true } });
  const hoy = activeBackground(prefs, { day: '2026-10-08', library }).item.id;
  assert.equal(activeBackground(prefs, { day: '2026-10-08', library }).item.id, hoy);
  const dias = ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'].map(d => activeBackground(prefs, { day: d, library }).item.id);
  assert.ok(new Set(dias).size > 1, 'rota entre días');
});

test('las fotos propias se limitan y se limpian', () => {
  const muchas = Array.from({ length: 30 }, (_, i) => ({ id: 'f' + i, path: 'u/x' + i, name: 'foto', at: '2026-10-08' }));
  const p = resolve({ media: [...muchas, null, { sinId: 1 }] });
  assert.equal(p.media.length, MAX_MEDIA);
  assert.ok(p.media.every(m => m.id));
  assert.deepEqual(resolve({ media: 'nada' }).media, []);
});

test('las celebraciones respetan al usuario y la preferencia de menos movimiento', () => {
  assert.equal(celebrationLevel(resolve({ celebrate: 'off' })), 'off');
  assert.equal(celebrationLevel(resolve({ celebrate: 'off' }), { reducedMotion: true }), 'off');
  assert.equal(celebrationLevel(resolve({ celebrate: 'full' })), 'full');
  // Con menos movimiento se baja a lo discreto, nunca se ignora la preferencia del sistema.
  assert.equal(celebrationLevel(resolve({ celebrate: 'full' }), { reducedMotion: true }), 'soft');
});

test('restaurar la apariencia no toca el resto de preferencias', () => {
  const guardado = { palette: 'neon-citrico', background: { kind: 'photo', id: 'f1' }, weeklyGoal: 6, media: [{ id: 'f1' }] };
  const p = resolve({ ...guardado, ...resetAppearance() });
  assert.equal(p.palette, DEFAULTS.palette);
  assert.equal(p.background.kind, 'none');
  assert.equal(p.weeklyGoal, 6);            // la meta semanal no se pierde
  assert.equal(p.media.length, 1);          // las fotos subidas siguen ahí
});
