// Celebración visible al terminar algo. Se engancha al único sitio donde algo se da por hecho
// (completar una tarea, cerrar un hito, terminar el día o un objetivo): no hay detector paralelo.
// Sin dependencias: un canvas que se crea al momento y se destruye al acabar.
import * as db from './db.js';
import * as store from './store.js';
import { haptic, chime } from './ui.js';
import { plan, firstTime, remember, dayComplete, streakMark, taskKey, milestoneKey, goalKey, dayKeyOf, streakKey } from './domain/celebration.js';
import { celebrationLevel } from './domain/prefs.js';

const reducedMotion = () => (typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)').matches : false);
const seen = () => db.kvGet('celebrated', {});

// Dispara la celebración de un hecho concreto. Devuelve lo celebrado, o null si no tocaba.
export function celebrateEvent(event) {
  const nivel = celebrationLevel(store.prefs(), { reducedMotion: reducedMotion() });
  const p = plan(event, { level: nivel, reducedMotion: reducedMotion() });
  if (!p) return null;
  if (!firstTime(p.key, seen())) return null; // ya se celebró: un reintento o una recarga no lo repiten
  db.kvSet('celebrated', remember(p.key, seen()));
  haptic(p.type === 'task' ? 10 : [12, 40, 18]);
  chime();
  if (p.pieces) confetti(p.pieces);
  return p;
}

// ¿Quedó el día completo? Se pregunta después de completar algo, con los datos reales del día.
export function checkDayComplete(day, tasksOfDay) {
  if (!dayComplete(tasksOfDay)) return null;
  return celebrateEvent({ type: 'day', key: dayKeyOf(day) });
}

export function checkStreak(n) {
  const marca = streakMark(n);
  return marca ? celebrateEvent({ type: 'streak', key: streakKey(marca), n: marca }) : null;
}

export { taskKey, milestoneKey, goalKey, dayKeyOf };

// Muestra de prueba al cambiar la preferencia: no cuenta como logro ni se guarda en ningún sitio.
export function demo() {
  const nivel = celebrationLevel(store.prefs(), { reducedMotion: reducedMotion() });
  if (nivel === 'off') return null;
  haptic([12, 40, 18]);
  chime();
  if (nivel === 'full') confetti(45);
  return nivel;
}

// ---------- confeti ----------
// Piezas de color que caen y se desvanecen. Dura menos de dos segundos, no tapa nada
// (no recibe clics) y se limpia sola. Si el sistema pide menos movimiento, no se llega aquí.
function confetti(pieces) {
  // Solo en un navegador de verdad: en pruebas o sin canvas, la celebración es el mensaje.
  if (typeof document === 'undefined' || typeof document.createElement !== 'function' || typeof requestAnimationFrame !== 'function') return;
  const lienzo = document.createElement('canvas');
  lienzo.className = 'confetti';
  lienzo.setAttribute('aria-hidden', 'true');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = window.innerWidth;
  const h = window.innerHeight;
  lienzo.width = w * dpr;
  lienzo.height = h * dpr;
  document.body.appendChild(lienzo);
  const ctx = lienzo.getContext('2d');
  ctx.scale(dpr, dpr);

  const estilo = getComputedStyle(document.documentElement);
  const colores = ['--accent', '--milestone', '--viz-3', '--viz-2', '--c-green']
    .map(v => estilo.getPropertyValue(v).trim()).filter(Boolean);
  const piezas = Array.from({ length: pieces }, () => ({
    x: w / 2 + (Math.random() - 0.5) * w * 0.5,
    y: h * 0.42 + (Math.random() - 0.5) * 60,
    vx: (Math.random() - 0.5) * 7,
    vy: -6 - Math.random() * 7,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    size: 8 + Math.random() * 8,
    color: colores[Math.floor(Math.random() * colores.length)] || '#2F4BF5'
  }));

  const inicio = performance.now();
  const DURACION = 1600;
  function frame(ahora) {
    const t = ahora - inicio;
    if (t > DURACION) { lienzo.remove(); return; }
    ctx.clearRect(0, 0, w, h);
    // Opaco mientras se ve el movimiento; solo se desvanece al final.
    ctx.globalAlpha = t < DURACION * 0.6 ? 1 : Math.max(0, 1 - (t - DURACION * 0.6) / (DURACION * 0.4));
    for (const p of piezas) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.32;      // gravedad
      p.vx *= 0.995;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
