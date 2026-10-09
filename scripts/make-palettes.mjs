// Genera app/palettes.css a partir de una definición corta por paleta.
// Cada paleta solo redefine tokens que ya existen: ningún componente conoce colores propios.
// Los tonos de texto y acento se ajustan solos hasta cumplir el contraste AA, en claro y en oscuro.
// Uso: node scripts/make-palettes.mjs
import { writeFileSync, readFileSync } from 'node:fs';

// Tokens que no dependen de la paleta (ámbar de hito, avisos, colores de objetivo): se toman de
// styles.css. Una paleta oscura necesita la versión oscura de esos tokens para seguir siendo legible.
const base = readFileSync(new URL('../app/styles.css', import.meta.url), 'utf8');
const bloque = sel => { const i = base.indexOf(sel); return base.slice(i, base.indexOf('}', i)); };
const leer = text => Object.fromEntries([...text.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map(m => [m[1], m[2]]));
const EXTRA_OSCURO = Object.fromEntries(Object.entries(leer(bloque(':root[data-theme="dark"]')))
  .filter(([k]) => /^(milestone|streak|warn|danger|c-)/.test(k)));

// familia, tono base (0-360), saturación del color de acción, carácter del fondo.
const PALETTES = [
  { key: 'pastel-lavanda', name: 'Lavanda', family: 'pastel', hue: 268, sat: 58, soft: true },
  { key: 'pastel-menta', name: 'Menta', family: 'pastel', hue: 168, sat: 52, soft: true },
  { key: 'pastel-durazno', name: 'Durazno', family: 'pastel', hue: 18, sat: 62, soft: true },
  { key: 'neon-magenta', name: 'Magenta neón', family: 'psicodelica', hue: 320, sat: 88, vivid: true },
  { key: 'neon-citrico', name: 'Cítrico neón', family: 'psicodelica', hue: 92, sat: 80, vivid: true },
  { key: 'tierra', name: 'Tierra', family: 'natural', hue: 28, sat: 44 },
  { key: 'bosque', name: 'Bosque', family: 'natural', hue: 150, sat: 40 },
  { key: 'grafito', name: 'Grafito', family: 'minimalista', hue: 220, sat: 10 },
  { key: 'medianoche', name: 'Medianoche', family: 'oscura', hue: 232, sat: 55, darkFirst: true }
];

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
function hsl(h, s, l) {
  const c = (1 - Math.abs(2 * l / 100 - 1)) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l / 100 - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}
const lum = hex => {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

// Busca la luminosidad más cercana al gusto que cumpla el contraste pedido sobre el fondo.
function fit(h, s, startL, bg, min, dir) {
  for (let l = startL; l >= 0 && l <= 100; l += dir) {
    const c = hsl(h, s, l);
    if (ratio(c, bg) >= min) return c;
  }
  return dir < 0 ? '#000000' : '#ffffff';
}

// Igual que fit, pero cumpliendo el contraste sobre varios fondos a la vez (superficie, fondo y
// la versión suave del acento): así el color de acción se lee en todos los sitios donde se usa.
function fitAll(h, s, startL, fondos, min, dir) {
  for (let l = startL; l >= 0 && l <= 100; l += dir) {
    const c = hsl(h, s, l);
    if (fondos.every(f => ratio(c, f) >= min)) return c;
  }
  return dir < 0 ? '#000000' : '#ffffff';
}

// Tinta legible sobre un relleno: blanco si llega, y si no, el tono oscuro del mismo color.
const inkFor = (h, bgColor) => (ratio('#ffffff', bgColor) >= 4.6 ? '#ffffff' : fit(h, 30, 20, bgColor, 4.6, -1));

function build(p, dark) {
  const h = p.hue;
  const sFondo = p.vivid ? 22 : p.soft ? 26 : 14;
  const bg = dark ? hsl(h, Math.min(30, sFondo), p.vivid ? 9 : 8) : hsl(h, sFondo, p.soft ? 97 : 97.5);
  const surface = dark ? hsl(h, Math.min(26, sFondo), 13) : '#ffffff';
  const surface2 = dark ? hsl(h, Math.min(24, sFondo), 19) : hsl(h, sFondo, p.soft ? 93 : 94);
  const dirTexto = dark ? 1 : -1;
  const text = fit(h, dark ? 18 : 28, dark ? 92 : 20, surface, 12, dirTexto);
  const text2 = fit(h, dark ? 16 : 22, dark ? 72 : 38, surface, 5.2, dirTexto);
  const text3 = fit(h, dark ? 15 : 20, dark ? 66 : 42, surface, 4.8, dirTexto);
  const accentSoft = dark ? hsl(h, Math.min(40, p.sat), 22) : hsl(h, Math.min(70, p.sat), 94);
  const fondos = [surface, bg, accentSoft];
  const accent = fitAll(h, p.sat, dark ? 70 : 46, fondos, 4.6, dirTexto);
  const accentStrong = dark ? fitAll(h, p.sat, 80, fondos, 5.5, 1) : fitAll(h, p.sat, 36, fondos, 6.5, -1);
  // Bloque protagonista: relleno sólido con texto blanco, igual que el cobalto de la base.
  const block = fit(h, Math.max(50, p.sat), dark ? 44 : 46, '#ffffff', 4.6, -1);
  const accentInk = inkFor(h, accent);
  const blockInk = inkFor(h, block);
  // Segundo tono sobre el bloque: se aclara (o se oscurece) hasta ser legible.
  const blockInk2 = blockInk === '#ffffff' ? fit(h, 55, 86, block, 4.6, 1) : fit(h, 55, 26, block, 4.6, -1);
  const viz3 = fit(h, dark ? 60 : 65, dark ? 55 : 56, surface, 3.1, dirTexto);
  return {
    ...(dark ? EXTRA_OSCURO : {}),
    bg, surface, 'surface-2': surface2, text, 'text-2': text2, 'text-3': text3,
    line: dark ? hsl(h, 18, 24) : hsl(h, sFondo, 90),
    'line-2': dark ? hsl(h, 18, 34) : hsl(h, sFondo, 80),
    accent, 'accent-strong': accentStrong, 'accent-ink': accentInk, 'accent-soft': accentSoft,
    block, 'block-ink': blockInk, 'block-ink-2': blockInk2,
    'block-line': blockInk === '#ffffff' ? 'rgba(255, 255, 255, .42)' : 'rgba(0, 0, 0, .35)',
    'block-fill': blockInk === '#ffffff' ? 'rgba(255, 255, 255, .14)' : 'rgba(0, 0, 0, .12)',
    'viz-1': dark ? hsl(h, 40, 30) : hsl(h, 55, 84), 'viz-2': dark ? hsl(h, 50, 42) : hsl(h, 60, 70),
    'viz-3': viz3, 'viz-4': accent
  };
}

const vars = obj => Object.entries(obj).map(([k, v]) => `    --${k}: ${v};`).join('\n');
let out = `/* Paletas de color. Generado por scripts/make-palettes.mjs: no editar a mano.
   Cada paleta solo redefine tokens que ya existen; el contraste AA está verificado al generarla
   y lo revisa de nuevo scripts/contrast.mjs. La paleta base (cobalto) vive en styles.css. */\n`;

for (const p of PALETTES) {
  const claro = build(p, Boolean(p.darkFirst));
  const oscuro = build(p, true);
  out += `\n/* ${p.name} (${p.family}) */\n`;
  out += `:root[data-palette="${p.key}"] {\n${vars(claro)}\n}\n`;
  out += `@media (prefers-color-scheme: dark) {\n  :root[data-palette="${p.key}"]:not([data-theme="light"]) {\n${vars(oscuro).replace(/^ {4}/gm, '      ')}\n  }\n}\n`;
  out += `:root[data-palette="${p.key}"][data-theme="dark"] {\n${vars(oscuro)}\n}\n`;
}

// Muestras del selector: tres colores por paleta, para verla sin aplicarla.
out += `\n/* Muestras del selector de paletas */\n`;
out += `.pal-swatch[data-pal="cobalto"] i:nth-child(1) { background: #2F4BF5; }\n.pal-swatch[data-pal="cobalto"] i:nth-child(2) { background: #E6EBFF; }\n.pal-swatch[data-pal="cobalto"] i:nth-child(3) { background: #F5F7FB; }\n`;
for (const p of PALETTES) {
  const c = build(p, Boolean(p.darkFirst));
  out += `.pal-swatch[data-pal="${p.key}"] i:nth-child(1) { background: ${c.accent}; }\n`;
  out += `.pal-swatch[data-pal="${p.key}"] i:nth-child(2) { background: ${c['accent-soft']}; }\n`;
  out += `.pal-swatch[data-pal="${p.key}"] i:nth-child(3) { background: ${c.bg}; }\n`;
}

writeFileSync(new URL('../app/palettes.css', import.meta.url), out);
console.log(`palettes.css generado: ${PALETTES.length} paletas.`);
