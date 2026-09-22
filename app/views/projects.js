// Lista de objetivos con filtro por estado.
import * as model from './../model.js';
import { icon, empty, projectCard, PROJECT_STATUS } from './../ui.js';

const FILTERS = [['active', 'Activos'], ['paused', 'Pausados'], ['done', 'Completados'], ['archived', 'Archivados']];
export const state = { filter: 'active' };

export function render() {
  const all = model.projects();
  const counts = Object.fromEntries(FILTERS.map(([k]) => [k, all.filter(p => p.status === k).length]));
  const list = all.filter(p => p.status === state.filter);
  return `
  <header class="view-head">
    <div><h1>Objetivos</h1><p class="date">${all.length ? `${all.length} en total` : 'Lo que quieres construir, paso a paso'}</p></div>
    <button class="icon-btn" data-act="new-project" aria-label="Nuevo objetivo">${icon('plus')}</button>
  </header>
  <div class="filters" role="tablist">
    ${FILTERS.filter(([k]) => counts[k] || k === state.filter || k === 'active').map(([k, l]) =>
      `<button class="pill ${state.filter === k ? 'on' : ''}" data-act="filter-projects" data-v="${k}" role="tab" aria-selected="${state.filter === k}">${l}${counts[k] ? ` <span class="num">${counts[k]}</span>` : ''}</button>`).join('')}
  </div>
  ${list.length
    ? `<div class="pcards">${list.map(p => projectCard(p)).join('')}</div>`
    : empty('folder',
        state.filter === 'active' ? 'Aquí verás lo que estás construyendo' : `Nada en ${PROJECT_STATUS[state.filter].toLowerCase()}`,
        state.filter === 'active' ? 'Empieza con una idea: aprender algo, terminar algo, crear algo.' : '',
        state.filter === 'active' ? '<button class="btn primary" data-act="new-project">Crear mi primer objetivo</button>' : '')}`;
}
