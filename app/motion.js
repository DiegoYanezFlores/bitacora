// Movimiento con significado: cuando un valor cambia (p. ej. el % de una barra), se anima desde el valor anterior.
// El render reescribe la vista entera, así que antes de redibujar se leen los valores actuales y después se interpola.
// Marca el elemento con data-motion="<clave estable>" y data-value="<número>" (ancho en %).

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function capture(root) {
  const values = new Map();
  root.querySelectorAll('[data-motion]').forEach(el => values.set(el.dataset.motion, Number(el.dataset.value)));
  return values;
}

export function play(root, previous) {
  if (!previous.size || reduced()) return;
  root.querySelectorAll('[data-motion]').forEach(el => {
    const from = previous.get(el.dataset.motion);
    const to = Number(el.dataset.value);
    if (from === undefined || from === to || !el.animate) return;
    el.animate([{ width: `${from}%` }, { width: `${to}%` }], { duration: 400, easing: 'cubic-bezier(.2, .8, .2, 1)' });
  });
}
