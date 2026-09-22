// Verifica el contraste WCAG de los tokens de color de app/styles.css en claro y oscuro.
// Uso: node scripts/contrast.mjs   → sale con código 1 si algún par no llega a su mínimo.
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../app/styles.css', import.meta.url), 'utf8');
const block = selector => {
  const start = css.indexOf(selector);
  return css.slice(start, css.indexOf('}', start));
};
const tokens = text => Object.fromEntries([...text.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map(m => [m[1], m[2]]));
const light = tokens(block(':root {'));
const dark = { ...light, ...tokens(block(':root[data-theme="dark"]')) };

const lum = hex => {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

// [texto/primer plano, fondo, mínimo]: 4.5 texto normal, 3 para elementos gráficos (barras, puntos, celdas).
const PAIRS = [
  ['text', 'bg', 4.5], ['text', 'surface', 4.5], ['text-2', 'bg', 4.5], ['text-2', 'surface', 4.5], ['text-2', 'surface-2', 4.5],
  ['text-3', 'bg', 4.5], ['text-3', 'surface', 4.5],
  ['accent', 'bg', 4.5], ['accent', 'surface', 4.5], ['accent', 'accent-soft', 4.5], ['accent-ink', 'accent', 4.5],
  ['block-ink', 'block', 4.5], ['block-ink-2', 'block', 4.5],
  ['milestone-ink', 'surface', 4.5], ['milestone-ink', 'milestone-soft', 4.5],
  ['warn', 'surface', 4.5], ['warn', 'warn-soft', 4.5], ['danger', 'surface', 4.5], ['danger', 'bg', 4.5],
  ['viz-4', 'surface', 3], ['viz-3', 'surface', 3],
  ...['teal', 'blue', 'violet', 'rose', 'orange', 'amber', 'green', 'slate'].map(c => [`c-${c}`, 'surface', 3])
];

let failed = 0;
for (const [name, theme] of [['claro', light], ['oscuro', dark]]) {
  for (const [fg, bg, min] of PAIRS) {
    if (!theme[fg] || !theme[bg]) { console.error(`${name}: falta --${theme[fg] ? bg : fg}`); failed++; continue; }
    const r = ratio(theme[fg], theme[bg]);
    if (r < min) { console.error(`${name}: --${fg} sobre --${bg} = ${r.toFixed(2)} (mínimo ${min})`); failed++; }
  }
}
if (failed) process.exit(1);
console.log(`Contraste correcto: ${PAIRS.length} pares en claro y oscuro.`);
