// Detalle de un objetivo: avance por hitos (§8), camino (etapas → hitos → criterios), próximos pasos y actividad.
import * as model from './../model.js';
import { esc, ago, fmtDayShort, plural, dayKey, daysBetween } from './../lib.js';
import { icon, bar, segBar, empty, activityRow, taskRow, dot, PROJECT_STATUS } from './../ui.js';
import { WEIGHTS } from './../domain/progress.js';

// open: etapas abiertas o cerradas a mano (sobrevive a los redibujados).
export const state = { showDone: false, limit: 12, open: new Map() };

const STAGE_STATUS = { pending: 'Pendiente', active: 'En curso', done: 'Completada', skipped: 'No aplica' };

function progressCard(p, info) {
  const g = info.progress;
  const metric = g.metric ? `<div class="indicator">
      <div class="indicator-head"><span class="muted small">Indicador</span><span class="num small">${esc(g.metric.label)}</span></div>
      ${bar(g.metric.pct, 'thin', `metric:${p.id}`)}
      <button class="btn ghost small" data-act="metric" data-id="${p.id}">Actualizar valor</button>
    </div>` : '';
  if (g.mode === 'none') {
    return `<section class="card goal-progress">
      <h2 class="goal-progress-title">Sin hitos todavía</h2>
      <p class="muted small">El avance se mide con hitos que tienen criterios de “hecho”. Registrar actividad suma a tu constancia, no al porcentaje.</p>
      <div class="prog-actions">
        <button class="btn primary" data-act="use-template" data-id="${p.id}">Usar una plantilla</button>
        <button class="btn ghost" data-act="new-milestone" data-project="${p.id}">${icon('plus')}Añadir hito</button>
      </div>
      ${metric}
    </section>`;
  }
  const context = [g.stages.total ? `${g.stages.done} de ${plural(g.stages.total, 'etapa', 'etapas')}` : '', `${g.milestones.done} de ${plural(g.milestones.total, 'hito', 'hitos')}`].filter(Boolean).join(' · ');
  return `<section class="card goal-progress">
    <div class="prog-head">
      <span class="prog-pct num">${g.pct}%</span>
      <span class="muted small">${esc(context)}</span>
      <button class="icon-btn small" data-act="explain-progress" aria-label="Cómo se calcula el avance">${icon('info')}</button>
    </div>
    ${segBar(g.segments, `goal:${p.id}`)}
    <p class="muted small prog-foot">${g.backed.total ? `${g.backed.with} de ${plural(g.backed.total, 'hito', 'hitos')} con evidencia` : ''}${g.nextMilestone ? '' : `${g.backed.total ? ' · ' : ''}Todos los hitos cerrados`}</p>
    <div class="prog-actions"><button class="btn ghost small" data-act="capture-project" data-id="${p.id}">${icon('plus')}Registrar avance</button></div>
    ${metric}
  </section>`;
}

// El foco de la vista: el siguiente hito, en el bloque cobalto (una sola cosa fuerte por pantalla).
function nextMilestoneCard(m) {
  if (!m) return '';
  const mp = model.msProgress(m);
  const st = model.stage(m.stage_id);
  return `<section class="card next goal-next" aria-label="Siguiente hito">
    <div class="next-head"><h2 class="next-title">${esc(m.title)}</h2></div>
    <div class="next-why">
      ${st ? `<span class="tag">${esc(st.title)}</span>` : ''}
      <span class="tag">Tamaño ${WEIGHTS[mp.weight]}</span>
      <span class="tag">${mp.total ? `${mp.met} de ${mp.total} criterios` : 'Sin criterios'}</span>
    </div>
    ${mp.total ? `<div class="crit-bar on-block" aria-hidden="true">${Array.from({ length: mp.total }, (_, i) => `<span class="${i < mp.met ? 'on' : ''}"></span>`).join('')}</div>` : ''}
    <div class="next-actions"><button class="btn primary" data-act="open-milestone" data-id="${m.id}">${icon('diamond')}${mp.total ? 'Ver criterios' : 'Abrir hito'}</button></div>
  </section>`;
}

function milestoneRow(m) {
  const mp = model.msProgress(m);
  const status = m.status === 'skipped' ? 'No aplica'
    : mp.closed ? (mp.closedWithUnmet ? `Cerrado · ${mp.met}/${mp.total}` : 'Cerrado')
    : mp.total ? `${mp.met} de ${mp.total} criterios` : 'Sin criterios';
  return `<li><button class="ms-row ${mp.closed ? 'is-closed' : ''} ${m.status === 'skipped' ? 'is-skipped' : ''}" data-act="open-milestone" data-id="${m.id}">
    <span class="ms-diamond ${mp.closed ? 'on' : ''}" aria-hidden="true">${icon('diamond')}</span>
    <span class="ms-main"><span class="ms-name">${esc(m.title)}</span>
      <span class="ms-meta">${esc(status)}${m.due_date && !mp.closed ? ` · ${fmtDayShort(m.due_date)}` : ''}</span></span>
    ${mp.total && !mp.closed ? `<span class="crit-bar mini" aria-hidden="true">${Array.from({ length: mp.total }, (_, i) => `<span class="${i < mp.met ? 'on' : ''}"></span>`).join('')}</span>` : ''}
    <span class="weight" title="Tamaño ${WEIGHTS[mp.weight]}">${WEIGHTS[mp.weight]}</span>
  </button></li>`;
}

function path(p, info) {
  const chapters = info.progress.chapters;
  const hasStages = chapters.some(c => c.stage);
  if (!chapters.length || !chapters.some(c => c.milestones.length || c.stage)) {
    return empty('diamond', 'Un objetivo grande se vuelve alcanzable por etapas', '¿Empezamos con una estructura sugerida?',
      `<div class="prog-actions center-actions"><button class="btn primary" data-act="use-template" data-id="${p.id}">Usar plantilla</button><button class="btn ghost" data-act="new-stage" data-project="${p.id}">Añadir etapa</button></div>`);
  }
  const current = chapters.find(c => c.stage && c.stage.status !== 'skipped' && c.stage.status !== 'done') || null;
  return chapters.map((c, i) => {
    const st = c.stage;
    if (!st) {
      if (!c.milestones.length) return '';
      return `<div class="chapter">${hasStages ? '<h3 class="chapter-title">Sin etapa</h3>' : ''}<ul class="ms-list">${c.milestones.map(milestoneRow).join('')}</ul></div>`;
    }
    const counted = c.milestones.filter(m => m.status !== 'skipped');
    const done = counted.filter(m => m.done_at).length;
    const open = state.open.has(st.id) ? state.open.get(st.id) : st === (current && current.stage) || !counted.length;
    return `<details class="chapter stage-card ${st.status === 'skipped' ? 'is-skipped' : ''}" data-stage="${st.id}" ${open ? 'open' : ''}>
      <summary>
        <span class="chapter-title">${esc(st.title)}</span>
        <span class="muted small">${st.status === 'skipped' ? 'No aplica' : counted.length ? `${done} de ${plural(counted.length, 'hito', 'hitos')}` : STAGE_STATUS[st.status]}</span>
        <span class="stage-tools"><button class="icon-btn small" data-act="edit-stage" data-id="${st.id}" aria-label="Editar etapa: ${esc(st.title)}">${icon('edit')}</button></span>
      </summary>
      ${c.milestones.length ? `<ul class="ms-list">${c.milestones.map(milestoneRow).join('')}</ul>` : '<p class="muted small">Los hitos marcan puntos importantes del camino.</p>'}
      ${st.status === 'skipped' ? '' : `<button class="link" data-act="new-milestone" data-project="${p.id}" data-stage="${st.id}">${icon('plus')}Añadir hito</button>`}
    </details>`;
  }).join('');
}

export function render({ id }) {
  const p = model.project(id);
  if (!p) return `<header class="view-head"><h1>Objetivo no encontrado</h1></header><p class="muted">Puede que lo hayas eliminado. <a class="link" href="#/goals">Ver objetivos</a></p>`;
  const info = model.projectInfo(p);
  const tasks = model.sortTasks(model.tasks().filter(t => t.project_id === p.id));
  const open = tasks.filter(t => t.status !== 'done');
  const done = tasks.filter(t => t.status === 'done');
  const acts = model.activities().filter(a => a.project_id === p.id);
  const due = p.due_date ? daysBetween(dayKey(), p.due_date) : null;

  return `
  <header class="view-head">
    <div class="head-left">
      <a class="icon-btn" href="#/goals" aria-label="Volver a objetivos">${icon('back')}</a>
      <div><h1 class="p-title">${dot(p.color)}${esc(p.name)}</h1>
      <p class="date">${[PROJECT_STATUS[p.status], info.last ? `última actividad ${ago(info.last.occurred_at)}` : 'sin actividad', due !== null ? (due < 0 ? `fecha objetivo ${fmtDayShort(p.due_date)}` : `faltan ${plural(due, 'día', 'días')}`) : ''].filter(Boolean).join(' · ')}</p></div>
    </div>
    <button class="icon-btn" data-act="edit-project" data-id="${p.id}" aria-label="Editar objetivo">${icon('edit')}</button>
  </header>

  ${p.goal ? `<p class="goal">${icon('target')}${esc(p.goal)}</p>` : ''}
  ${p.description ? `<p class="muted desc">${esc(p.description)}</p>` : ''}

  ${progressCard(p, info)}
  ${nextMilestoneCard(info.progress.nextMilestone)}

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Camino</h2>
      <span class="head-links"><button class="link" data-act="new-stage" data-project="${p.id}">${icon('plus')}Etapa</button><button class="link" data-act="new-milestone" data-project="${p.id}">${icon('plus')}Hito</button></span></div>
    ${path(p, info)}
  </section>

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Tareas</h2><button class="link" data-act="new-task" data-project="${p.id}">${icon('plus')}Añadir</button></div>
    ${open.length ? `<ul class="tasks">${open.map(t => taskRow(t, { showProject: false })).join('')}</ul>` : empty('check', 'Sin tareas abiertas', 'Anota el siguiente paso para no perder el hilo.')}
    ${done.length ? `<button class="link mt" data-act="toggle-done-tasks">${state.showDone ? 'Ocultar' : 'Ver'} ${plural(done.length, 'tarea hecha', 'tareas hechas')}</button>
      ${state.showDone ? `<ul class="tasks mt">${done.map(t => taskRow(t, { showProject: false })).join('')}</ul>` : ''}` : ''}
  </section>

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Actividad</h2><span class="muted small num">${plural(acts.length, 'registro', 'registros')}</span></div>
    ${acts.length
      ? `<ul class="acts">${acts.slice(0, state.limit).map(a => activityRow(a, { showProject: false, showDate: true })).join('')}</ul>
         ${acts.length > state.limit ? '<button class="btn ghost block-btn" data-act="more-activity">Cargar más</button>' : ''}`
      : empty('list', 'Sin actividad', 'Cada acción que registres acerca un hito.')}
  </section>`;
}
