// Registro: línea temporal por día, con búsqueda y filtros. Paginado con botón (nunca scroll infinito).
import * as model from './../model.js';
import { esc, norm, dayLabel, plural } from './../lib.js';
import { icon, empty, activityRow, KINDS } from './../ui.js';

export const state = { q: '', kind: '', project: '', limit: 60 };

export function render() {
  const q = norm(state.q);
  const all = model.activities().filter(a =>
    (!state.kind || a.kind === state.kind) &&
    (!state.project || a.project_id === state.project) &&
    (!q || norm(a.title + ' ' + a.body).includes(q)));
  const shown = all.slice(0, state.limit);
  const groups = [];
  for (const a of shown) {
    const k = model.actDay(a);
    if (!groups.length || groups[groups.length - 1].day !== k) groups.push({ day: k, items: [] });
    groups[groups.length - 1].items.push(a);
  }
  const projects = model.projects();

  return `
  <header class="view-head">
    <div><h1>Registro</h1><p class="date">${state.q || state.kind || state.project ? plural(all.length, 'resultado', 'resultados') : plural(all.length, 'actividad', 'actividades')}</p></div>
    <button class="icon-btn" data-act="capture" aria-label="Registrar">${icon('plus')}</button>
  </header>

  <div class="search">
    ${icon('search')}
    <input type="search" id="log-q" value="${esc(state.q)}" placeholder="Buscar en tu historial" aria-label="Buscar" data-keep-focus>
    ${state.q ? `<button class="icon-btn" data-act="clear-search" aria-label="Limpiar">${icon('x')}</button>` : ''}
  </div>
  <div class="filters">
    <button class="pill ${!state.kind ? 'on' : ''}" data-act="filter-kind" data-v="">Todo</button>
    ${Object.entries(KINDS).map(([k, v]) => `<button class="pill ${state.kind === k ? 'on' : ''}" data-act="filter-kind" data-v="${k}">${icon(v.icon)}${v.label}</button>`).join('')}
    ${projects.length ? `<select class="pill-select" data-act="filter-project" aria-label="Proyecto">
      <option value="">Todos los proyectos</option>
      ${projects.map(p => `<option value="${p.id}" ${state.project === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
    </select>` : ''}
  </div>

  ${groups.length
    ? groups.map(g => `<section class="day">
        <h2 class="day-head"><span>${esc(dayLabel(g.day))}</span><span class="day-n num">${g.items.length}</span></h2>
        <ul class="acts">${g.items.map(a => activityRow(a)).join('')}</ul>
      </section>`).join('') + (all.length > shown.length ? `<button class="btn ghost block-btn" data-act="more-log">Cargar más (${all.length - shown.length})</button>` : '')
    : empty('list', state.q || state.kind || state.project ? 'Nada con esos filtros' : 'Tu historial empieza aquí',
        state.q || state.kind || state.project ? 'Prueba con otra búsqueda.' : 'Cada cosa que registres queda con su fecha y su proyecto.',
        state.q || state.kind || state.project ? '<button class="btn ghost" data-act="clear-filters">Quitar filtros</button>' : '<button class="btn primary" data-act="capture">Registrar actividad</button>')}`;
}
