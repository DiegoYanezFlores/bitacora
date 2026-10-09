// Genera la biblioteca de fondos en img/bg/*.svg. Son composiciones propias (sin fotos de terceros,
// sin dependencias y sin enlaces externos): pesan unos pocos KB, escalan a cualquier pantalla y
// funcionan sin conexión desde el primer arranque.
// Uso: node scripts/make-backgrounds.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const W = 1200, H = 1600; // vertical: el fondo se recorta bien en móvil y en escritorio

const grad = (id, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const svg = (body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">` +
  `<defs>${defs}</defs>${body}</svg>`;

// Montañas superpuestas: capas de silueta sobre un cielo en degradado.
const montanas = () => {
  const capas = [
    ['#1d2a5e', 980, 220], ['#27407e', 1120, 300], ['#39629f', 1250, 380], ['#5b8cbf', 1380, 460]
  ].map(([color, base, alto], i) => {
    const puntos = Array.from({ length: 7 }, (_, n) => {
      const x = (n / 6) * W;
      const y = base - Math.abs(Math.sin(n * 1.3 + i)) * alto;
      return `${x.toFixed(0)},${y.toFixed(0)}`;
    });
    return `<polygon points="0,${H} ${puntos.join(' ')} ${W},${H}" fill="${color}"/>`;
  });
  return svg(`<rect width="${W}" height="${H}" fill="url(#cielo)"/><circle cx="880" cy="320" r="90" fill="#ffd9a3" opacity=".9"/>${capas.join('')}`,
    grad('cielo', [[0, '#0b1230'], [.45, '#2b3f7a'], [.75, '#8a7fb0'], [1, '#e8a98a']]));
};

// Bosque: troncos verticales y niebla entre ellos.
const bosque = () => {
  const troncos = Array.from({ length: 16 }, (_, i) => {
    const x = (i * 97 + (i % 3) * 37) % W;
    const w = 14 + (i % 4) * 9;
    const op = 0.25 + (i % 5) * 0.14;
    return `<rect x="${x}" y="${120 + (i % 3) * 60}" width="${w}" height="${H}" fill="#06281f" opacity="${op.toFixed(2)}"/>`;
  });
  return svg(`<rect width="${W}" height="${H}" fill="url(#verde)"/>${troncos.join('')}<rect width="${W}" height="${H}" fill="url(#niebla)"/>`,
    grad('verde', [[0, '#123d2e'], [.6, '#0d2c22'], [1, '#07180f']]) + grad('niebla', [[0, 'rgba(255,255,255,0)'], [.55, 'rgba(210,230,215,.22)'], [1, 'rgba(255,255,255,0)']]));
};

// Océano: franjas de olas en degradado.
const oceano = () => {
  const olas = Array.from({ length: 9 }, (_, i) => {
    const y = 700 + i * 100;
    const amp = 26 + i * 4;
    return `<path d="M0 ${y} C ${W * 0.25} ${y - amp}, ${W * 0.5} ${y + amp}, ${W} ${y - amp / 2} L ${W} ${H} L 0 ${H} Z" fill="#0a3550" opacity="${(0.12 + i * 0.07).toFixed(2)}"/>`;
  });
  return svg(`<rect width="${W}" height="${H}" fill="url(#mar)"/>${olas.join('')}`,
    grad('mar', [[0, '#9fd6e8'], [.4, '#2e86ab'], [1, '#07263c']]));
};

// Ciudad: rascacielos con ventanas encendidas.
const ciudad = () => {
  let edificios = '';
  let x = 0;
  let i = 0;
  while (x < W) {
    const w = 70 + ((i * 53) % 90);
    const alto = 420 + ((i * 167) % 760);
    const y = H - alto;
    edificios += `<rect x="${x}" y="${y}" width="${w}" height="${alto}" fill="#111a33" opacity="${(0.72 + (i % 3) * 0.1).toFixed(2)}"/>`;
    for (let fy = y + 26; fy < H - 40; fy += 46) {
      for (let fx = x + 14; fx < x + w - 14; fx += 30) {
        if ((fx + fy + i) % 7 < 3) edificios += `<rect x="${fx}" y="${fy}" width="12" height="18" fill="#ffd27d" opacity=".75"/>`;
      }
    }
    x += w + 10;
    i++;
  }
  return svg(`<rect width="${W}" height="${H}" fill="url(#noche)"/>${edificios}`,
    grad('noche', [[0, '#1b2559'], [.5, '#3c3b73'], [1, '#c96f61']]));
};

// Disciplina: una escalera de barras que sube, constante.
const escalera = () => {
  const barras = Array.from({ length: 14 }, (_, i) => {
    const w = W / 14;
    const alto = 120 + i * 95;
    return `<rect x="${(i * w).toFixed(0)}" y="${(H - alto).toFixed(0)}" width="${(w - 6).toFixed(0)}" height="${alto}" fill="#ffffff" opacity="${(0.06 + i * 0.045).toFixed(3)}"/>`;
  });
  return svg(`<rect width="${W}" height="${H}" fill="url(#subida)"/>${barras.join('')}`,
    grad('subida', [[0, '#101a3d'], [1, '#2f4bf5']], 1, 1));
};

// Serenidad: círculos concéntricos, respiración.
const serenidad = () => {
  const anillos = Array.from({ length: 11 }, (_, i) =>
    `<circle cx="600" cy="820" r="${90 + i * 95}" fill="none" stroke="#ffffff" stroke-width="${(10 - i * 0.7).toFixed(1)}" opacity="${(0.3 - i * 0.022).toFixed(3)}"/>`);
  return svg(`<rect width="${W}" height="${H}" fill="url(#calma)"/>${anillos.join('')}`,
    grad('calma', [[0, '#f3ece4'], [.5, '#d9c7b8'], [1, '#8d7a6b']]));
};

// Conocimiento: lomos de libros apilados.
const libros = () => {
  const colores = ['#7b3f2e', '#2f5d50', '#324a7a', '#8a6a2b', '#5c3a63', '#2c6b74'];
  let y = H - 60;
  let i = 0;
  let pila = '';
  while (y > 180) {
    const alto = 54 + ((i * 37) % 40);
    const ancho = 620 + ((i * 97) % 380);
    const x = 120 + ((i * 61) % 120);
    pila += `<rect x="${x}" y="${y - alto}" width="${ancho}" height="${alto}" rx="8" fill="${colores[i % colores.length]}"/>` +
      `<rect x="${x + 22}" y="${y - alto + 12}" width="${ancho - 44}" height="6" rx="3" fill="#ffffff" opacity=".35"/>`;
    y -= alto + 10;
    i++;
  }
  return svg(`<rect width="${W}" height="${H}" fill="url(#biblio)"/>${pila}`,
    grad('biblio', [[0, '#1b1710'], [1, '#3b2f22']]));
};

// Proyecto: una red de nodos conectados que crece hacia arriba.
const red = () => {
  const nodos = Array.from({ length: 26 }, (_, i) => ({
    x: 120 + ((i * 263) % (W - 240)),
    y: 180 + ((i * 421) % (H - 360)),
    r: 7 + (i % 4) * 4
  }));
  const lineas = nodos.slice(1).map((n, i) => {
    const p = nodos[i];
    return `<line x1="${p.x}" y1="${p.y}" x2="${n.x}" y2="${n.y}" stroke="#8fa2ff" stroke-width="2" opacity=".35"/>`;
  });
  const puntos = nodos.map(n => `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="#cdd7ff" opacity=".9"/>`);
  return svg(`<rect width="${W}" height="${H}" fill="url(#plano)"/>${lineas.join('')}${puntos.join('')}`,
    grad('plano', [[0, '#0a1030'], [1, '#1b2a6b']]));
};

// Abstracto cálido y abstracto frío: formas grandes, sin figura.
const abstracto = (id, colores) => {
  const formas = colores.map((c, i) =>
    `<circle cx="${200 + i * 260}" cy="${300 + ((i * 437) % 900)}" r="${260 + i * 60}" fill="${c}" opacity=".55"/>`);
  return svg(`<rect width="${W}" height="${H}" fill="url(#${id})"/>${formas.join('')}`,
    grad(id, [[0, colores[0]], [1, colores.at(-1)]], 1, 1));
};

const FONDOS = [
  ['montanas', montanas()], ['bosque', bosque()], ['oceano', oceano()], ['ciudad', ciudad()],
  ['escalera', escalera()], ['serenidad', serenidad()], ['libros', libros()], ['red', red()],
  ['abstracto-calido', abstracto('calido', ['#ff8a5b', '#ffd166', '#ef476f', '#f78c6b'])],
  ['abstracto-frio', abstracto('frio', ['#2f4bf5', '#4cc9f0', '#7209b7', '#4361ee'])]
];

mkdirSync(new URL('../img/bg/', import.meta.url), { recursive: true });
let total = 0;
for (const [nombre, contenido] of FONDOS) {
  const limpio = contenido.replace(/\s{2,}/g, ' ');
  writeFileSync(new URL(`../img/bg/${nombre}.svg`, import.meta.url), limpio);
  total += limpio.length;
}
console.log(`${FONDOS.length} fondos generados (${Math.round(total / 1024)} KB en total).`);
