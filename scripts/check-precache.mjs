// Verifica que el service worker precachee todos los archivos de la app (si falta uno, la app no abre sin conexión).
// Uso: node scripts/check-precache.mjs   → sale con código 1 si falta o sobra algo.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const block = sw.match(/const PRECACHE = \[([\s\S]*?)\];/);
if (!block) { console.error('No se encontró PRECACHE en sw.js'); process.exit(1); }
const listed = new Set([...block[1].matchAll(/'([^']+)'/g)].map(m => m[1]));

const walk = dir => readdirSync(join(root, dir)).flatMap(f => {
  const rel = `${dir}/${f}`;
  return statSync(join(root, rel)).isDirectory() ? walk(rel) : [rel];
});
const expected = new Set(['/', '/index.html', '/config.js', '/manifest.json',
  ...walk('app').filter(f => /\.(js|css)$/.test(f)).map(f => '/' + f),
  ...walk('icons').filter(f => f.endsWith('.png')).map(f => '/' + f)]);

const missing = [...expected].filter(f => !listed.has(f));
const stale = [...listed].filter(f => f !== '/' && !existsSync(join(root, f)));
if (missing.length) console.error('Faltan en PRECACHE de sw.js:\n  ' + missing.join('\n  '));
if (stale.length) console.error('Están en PRECACHE pero no existen:\n  ' + stale.join('\n  '));
if (missing.length || stale.length) process.exit(1);
console.log(`PRECACHE correcto: ${listed.size} archivos.`);
