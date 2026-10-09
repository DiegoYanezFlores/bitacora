// Aplica la apariencia elegida: tema, paleta y fondo. Una sola función para toda la app,
// así ningún componente define colores por su cuenta.
import * as store from './store.js';
import { activeBackground } from './domain/prefs.js';
import { LIBRARY, srcOf } from './domain/library.js';
import { photoUrl } from './media.js';
import { dayKey } from './lib.js';

const root = () => document.documentElement;

// Color de la barra del sistema: se toma del fondo real ya aplicado, no de una tabla aparte.
function syncThemeColor() {
  const meta = document.querySelector('meta[name=theme-color]');
  if (!meta) return;
  const bg = getComputedStyle(root()).getPropertyValue('--bg').trim();
  if (bg) meta.setAttribute('content', bg);
}

export function applyAppearance() {
  const prefs = store.prefs();
  const el = root();
  el.dataset.theme = prefs.theme === 'system' ? '' : prefs.theme;
  if (prefs.palette && prefs.palette !== 'cobalto') el.dataset.palette = prefs.palette;
  else delete el.dataset.palette;
  applyBackground(prefs);
  syncThemeColor();
}

// El fondo vive en una capa propia detrás de todo: nunca tapa controles ni cambia el contraste
// del texto, porque encima va un velo que se puede regular.
export async function applyBackground(prefs = store.prefs()) {
  let capa = document.getElementById('bg-layer');
  const bg = activeBackground(prefs, { day: dayKey(), library: LIBRARY });
  if (!bg) {
    if (capa) capa.remove();
    root().style.removeProperty('--bg-dim');
    root().dataset.bg = '';
    return;
  }
  if (!capa) {
    capa = document.createElement('div');
    capa.id = 'bg-layer';
    capa.setAttribute('aria-hidden', 'true');
    document.body.prepend(capa);
  }
  const src = bg.kind === 'photo' ? await photoUrl(bg.item.id) : srcOf(bg.item.id);
  if (!src) { capa.remove(); root().dataset.bg = ''; return; }
  capa.style.backgroundImage = `url("${src}")`;
  capa.style.backgroundPosition = bg.fit === 'top' ? 'top center' : bg.fit === 'bottom' ? 'bottom center' : 'center';
  capa.style.backgroundSize = bg.fit === 'contain' ? 'contain' : 'cover';
  capa.style.filter = bg.blur ? `blur(${bg.blur}px)` : '';
  root().style.setProperty('--bg-dim', String(bg.dim / 100));
  root().dataset.bg = 'on';
}
