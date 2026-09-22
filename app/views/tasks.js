// Todas las tareas con filtros por estado.
import * as model from './../model.js';
import { icon, empty, taskRow } from './../ui.js';
import { plural } from './../lib.js';

const FILTERS = [['open', 'Abiertas'], ['doing', 'En curso'], ['waiting', 'En espera'], ['done', 'Hechas']];
export const state = { filter: 'open' };

export function render() {
  const all = model.tasks();
  const by = {
    open: all.filter(t => t.status !== 'done'),
    doing: all.filter(t => t.status === 'doing'),
    waiting: all.filter(t => t.status === 'waiting'),
    done: model.sortTasks(all.filter(t => t.status === 'done')).sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''))
  };
  const list = state.filter === 'done' ? by.done : model.sortTasks(by[state.filter]);
  return `
  <header class="view-head">
    <div><h1>Tareas</h1><p class="date">${plural(by.open.length, 'abierta', 'abiertas')}</p></div>
    <div class="head-links">
      <a class="link" href="#/calendar">${icon('calendar')}Calendario</a>
      <button class="icon-btn" data-act="new-task" aria-label="Nueva tarea">${icon('plus')}</button>
    </div>
  </header>
  <div class="filters" role="tablist">
    ${FILTERS.map(([k, l]) => `<button class="pill ${state.filter === k ? 'on' : ''}" data-act="filter-tasks" data-v="${k}" role="tab" aria-selected="${state.filter === k}">${l}${by[k].length ? ` <span class="num">${by[k].length}</span>` : ''}</button>`).join('')}
  </div>
  ${list.length
    ? `<ul class="tasks">${list.map(t => taskRow(t)).join('')}</ul>`
    : empty('check', state.filter === 'open' ? 'Sin tareas abiertas' : 'Nada por aquí', state.filter === 'open' ? 'Anota lo siguiente que quieras hacer.' : '', state.filter === 'open' ? '<button class="btn primary" data-act="new-task">Nueva tarea</button>' : '')}`;
}
