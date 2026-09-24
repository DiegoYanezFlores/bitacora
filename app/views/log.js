// Registro: línea temporal por día, con búsqueda y filtros. Paginado con botón (nunca scroll infinito).
import * as model from './../model.js';
import { esc, norm, dayLabel, plural } from './../lib.js';
import { icon, empty, activityRow, taskEventRow, KINDS } from './../ui.js';
import { dayKey } from './../lib.js';

export const state = { q: '', kind: '', project: '', limit: 60 };

export function render() {
  const q = norm(state.q);
  const acts = model.activities().filter(a =>
    (!state.kind || a.kind === state.kind) &&
    (!state.project || a.project_id === state.project) &&
    (!q || norm(a.title + ' ' + a.body).includes(q)))
    .map(a => ({ kind: 'activity', day: model.actDay(a), at: a.occurred_at, row: a }));

  // Lo que pasó con las tareas (no realizadas y movidas) se ve aquí como información,
  // nunca como actividad: no cuenta para la constancia y se puede ocultar con los filtros.
  const events = state.kind ? [] : model.taskLog()
    .filter(e => e.type === 'rescheduled' || (e.type === 'closed' && e.result && e.result !== 'done'))
    .map(e => ({ e, task: model.tasks().find(t => t.id === e.task_id) }))
    .filter(({ e, task }) =>
      (!state.project || (task && task.project_id === state.project)) &&
      (!q || norm((task ? task.title : '') + ' ' + (e.note || '')).includes(q)))
    .map(({ e, task }) => ({ kind: 'event', day: dayKey(new Date(e.occurred_at)), at: e.occurred_at, row: e, task }));

  const all = [...acts, ...events].sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const shown = all.slice(0, state.limit);
  const groups = [];
  for (const item of shown) {
    if (!groups.length || groups[groups.length - 1].day !== item.day) groups.push({ day: item.day, items: [] });
    groups[groups.length - 1].items.push(item);
  }
  const projects = model.projects();

  return `
  <header class="view-head">
    <div><h1>Historia</h1><p class="date">${state.q || state.kind || state.project ? plural(all.length, 'resultado', 'resultados') : `${plural(acts.length, 'actividad', 'actividades')}${events.length ? ` · ${events.length} en tareas` : ''}`}</p></div>
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
    ${projects.length ? `<select class="pill-select" data-act="filter-project" aria-label="Objetivo">
      <option value="">Todos los objetivos</option>
      ${projects.map(p => `<option value="${p.id}" ${state.project === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
    </select>` : ''}
  </div>

  ${groups.length
    ? groups.map(g => `<section class="day">
        <h2 class="day-head"><span>${esc(dayLabel(g.day))}</span><span class="day-n num">${g.items.length}</span></h2>
        <ul class="acts">${g.items.map(i => i.kind === 'event' ? taskEventRow(i.row, i.task) : activityRow(i.row)).join('')}</ul>
      </section>`).join('') + (all.length > shown.length ? `<button class="btn ghost block-btn" data-act="more-log">Cargar más (${all.length - shown.length})</button>` : '')
    : empty('list', state.q || state.kind || state.project ? 'Nada con esos filtros' : 'Tu historial empieza aquí',
        state.q || state.kind || state.project ? 'Prueba con otra búsqueda.' : 'Cada cosa que registres queda con su fecha y su objetivo: usa el botón de abajo.',
        state.q || state.kind || state.project ? '<button class="btn ghost" data-act="clear-filters">Quitar filtros</button>' : '')}`;
}
