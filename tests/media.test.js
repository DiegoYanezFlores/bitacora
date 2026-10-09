// Fotos del usuario: validación, rutas en el almacén y guardado local sin conexión.
import './setup.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { reset } from './setup.js';
import * as db from '../app/db.js';
import * as store from '../app/store.js';
import { checkFile, storagePath, shortName, mediaEntry, ACCEPTED, MAX_FILES, MAX_BYTES, prettySize } from '../app/domain/media.js';
import { resolve } from '../app/domain/prefs.js';

const file = (o = {}) => ({ type: 'image/jpeg', size: 120000, name: 'montaña.JPG', ...o });

beforeEach(async () => { await reset(); });

test('se aceptan JPG, PNG y WebP; lo demás se rechaza con un motivo claro', () => {
  for (const type of ACCEPTED) assert.equal(checkFile(file({ type })).ok, true, type);
  const gif = checkFile(file({ type: 'image/gif' }));
  assert.equal(gif.ok, false);
  assert.match(gif.reason, /JPG, PNG o WebP/);
  assert.match(checkFile(null).reason, /No se pudo leer/);
  assert.match(checkFile(file({ size: 0 })).reason, /vacío/);
});

test('una imagen demasiado grande se rechaza diciendo cuánto pesa', () => {
  const r = checkFile(file({ size: MAX_BYTES + 1 }));
  assert.equal(r.ok, false);
  assert.match(r.reason, /8\.0 MB/);
  assert.equal(prettySize(2 * 1048576), '2.0 MB');
  assert.equal(prettySize(5000), '5 KB');
});

test('hay un tope de fotos y se explica qué hacer', () => {
  const r = checkFile(file(), { count: MAX_FILES });
  assert.equal(r.ok, false);
  assert.match(r.reason, /borra alguna/);
  assert.equal(checkFile(file(), { count: MAX_FILES - 1 }).ok, true);
});

test('la ruta del almacén va siempre bajo la carpeta del propio usuario', () => {
  const p = storagePath('u-123', 'foto-1', 'image/webp');
  assert.equal(p, 'u-123/wallpaper/foto-1.webp');
  assert.ok(p.startsWith('u-123/'), 'la política de Supabase exige la carpeta del usuario');
  assert.equal(storagePath('u-123', 'f', 'image/jpeg').endsWith('.jpg'), true);
});

test('el nombre se acorta sin perder sentido', () => {
  assert.equal(shortName('montaña.JPG'), 'montaña');
  assert.equal(shortName(''), 'Foto');
  assert.ok(shortName('x'.repeat(80)).length <= 28);
  const e = mediaEntry('id1', { name: 'playa.png', path: 'u/wallpaper/id1.png' });
  assert.deepEqual([e.id, e.name, e.path], ['id1', 'playa', 'u/wallpaper/id1.png']);
  assert.ok(e.at);
});

test('el archivo se guarda en el dispositivo y se recupera; borrar lo quita', async () => {
  await db.putFile({ id: 'f1', kind: 'wallpaper', type: 'image/png', size: 10, name: 'Foto', blob: 'binario' });
  assert.equal((await db.getFile('f1')).blob, 'binario');
  assert.equal((await db.listFiles()).length, 1);
  await db.deleteFile('f1');
  assert.equal(await db.getFile('f1'), null);
});

test('las fotos guardadas quedan en las preferencias y sobreviven a una recarga', () => {
  store.setPrefs({ media: [mediaEntry('f1', { name: 'playa.png' })] });
  const leido = resolve(store.profile().prefs);
  assert.equal(leido.media.length, 1);
  assert.equal(leido.media[0].id, 'f1');
  // Una preferencia nueva no borra las demás.
  store.setPrefs({ palette: 'pastel-menta' });
  assert.equal(store.prefs().media.length, 1);
  assert.equal(store.prefs().palette, 'pastel-menta');
});
