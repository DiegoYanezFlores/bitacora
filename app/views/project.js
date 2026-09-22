// Detalle de proyecto: objetivo, progreso, siguiente acción, tareas, hitos y actividad.
import * as model from './../model.js';
import { esc, ago, fmtDayShort, plural, dayKey, daysBetween } from './../lib.js';
import { icon, bar, empty, activityRow, taskRow, dot, PROJECT_STATUS } from './../ui.js';

export const state = { showDone: false, limit: 12 };

export function render({ id }) {
  const p = model.project(id);
  if (!p) return `<header class="view-head"><h1>Proyecto no encontrado</h1></header><p class="muted">Puede que lo hayas eliminado. <a href="#/projects">Ver proyectos</a>.</p>`;
  const info = model.projectInfo(p);
  const tasks = model.sortTasks(model.tasks().filter(t => t.project_id === p.id));
  const open = tasks.filter(t => t.status !== 'done');
  const done = tasks.filter(t => t.status === 'done');
  const ms = model.milestones().filter(m => m.project_id === p.id).sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999') || a.sort - b.sort);
  const acts = model.activities().filter(a => a.project_id === p.id);
  const due = p.due_date ? daysBetween(dayKey(), p.due_date) : null;

  return `
  <header class="view-head">
    <div class="head-left">
      <a class="icon-btn" href="#/projects" aria-label="Volver a proyectos">${icon('back')}</a>
      <div><h1 class="p-title">${dot(p.color)}${esc(p.name)}</h1>
      <p class="date">${[PROJECT_STATUS[p.status], info.last ? `última actividad ${ago(info.last.occurred_at)}` : 'sin actividad', due !== null ? (due < 0 ? `fecha objetivo ${fmtDayShort(p.due_date)}` : `faltan ${plural(due, 'día', 'días')}`) : ''].filter(Boolean).join(' · ')}</p></div>
    </div>
    <button class="icon-btn" data-act="edit-project" data-id="${p.id}" aria-label="Editar proyecto">${icon('edit')}</button>
  </header>

  ${p.goal ? `<p class="goal">${icon('target')}${esc(p.goal)}</p>` : ''}
  ${p.description ? `<p class="muted desc">${esc(p.description)}</p>` : ''}

  <section class="card">
    <div class="prog-head">
      <span class="prog-pct num">${info.progress.mode === 'none' ? info.activityCount : info.progress.pct + '%'}</span>
      <span class="muted small">${info.progress.mode === 'none' ? (info.activityCount === 1 ? 'registro · sin meta definida' : 'registros · sin meta definida') : esc(info.progress.label)}</span>
      <button class="icon-btn small" data-act="explain-progress" data-mode="${info.progress.mode}" aria-label="Cómo se calcula">${icon('info')}</button>
    </div>
    ${info.progress.mode === 'none' ? '<p class="muted small">Añade una tarea, un hito o una métrica y el avance se calculará solo.</p>' : bar(info.progress.pct, 'big', `project:${p.id}`)}
    <div class="prog-actions">
      ${info.progress.mode === 'metric' ? `<button class="btn ghost small" data-act="metric" data-id="${p.id}">Actualizar valor</button>` : ''}
      <button class="btn ghost small" data-act="capture-project" data-id="${p.id}">${icon('plus')}Registrar avance</button>
    </div>
  </section>

  ${info.next ? `<section class="card next slim" aria-label="Siguiente paso">
    <h2 class="next-title">${esc(info.next.title)}</h2>
    <div class="next-actions"><button class="btn primary" data-act="complete-next" data-id="${info.next.id}">${icon('check')}Completar</button></div>
  </section>` : ''}

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Tareas</h2><button class="link" data-act="new-task" data-project="${p.id}">${icon('plus')}Añadir</button></div>
    ${open.length ? `<ul class="tasks">${open.map(t => taskRow(t, { showProject: false })).join('')}</ul>` : empty('check', 'Sin tareas abiertas', 'Define el siguiente paso para no perder el hilo.')}
    ${done.length ? `<button class="link mt" data-act="toggle-done-tasks">${state.showDone ? 'Ocultar' : 'Ver'} ${plural(done.length, 'tarea hecha', 'tareas hechas')}</button>
      ${state.showDone ? `<ul class="tasks mt">${done.map(t => taskRow(t, { showProject: false })).join('')}</ul>` : ''}` : ''}
  </section>

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Hitos</h2><button class="link" data-act="new-milestone" data-project="${p.id}">${icon('plus')}Añadir</button></div>
    ${ms.length ? `<ul class="tasks">${ms.map(m => `<li class="task ${m.done_at ? 'is-done' : ''}">
        <button class="tick ${m.done_at ? 'on' : ''}" data-act="toggle-milestone" data-id="${m.id}" aria-pressed="${Boolean(m.done_at)}" aria-label="${m.done_at ? 'Reabrir hito' : 'Marcar hito'}">${icon('check')}</button>
        <button class="task-body" data-act="edit-milestone" data-id="${m.id}">
          <span class="task-title">${esc(m.title)}</span>
          ${m.due_date ? `<span class="task-meta"><span class="tag">${icon('calendar')}${fmtDayShort(m.due_date)}</span></span>` : ''}
        </button></li>`).join('')}</ul>`
      : empty('flag', 'Sin hitos', 'Los hitos marcan los tramos grandes del proyecto.')}
  </section>

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Actividad</h2><span class="muted small num">${plural(acts.length, 'registro', 'registros')}</span></div>
    ${acts.length
      ? `<ul class="acts">${acts.slice(0, state.limit).map(a => activityRow(a, { showProject: false, showDate: true })).join('')}</ul>
         ${acts.length > state.limit ? '<button class="btn ghost block-btn" data-act="more-activity">Cargar más</button>' : ''}`
      : empty('list', 'Sin actividad', 'Cada avance que registres aparecerá aquí.')}
  </section>`;
}
