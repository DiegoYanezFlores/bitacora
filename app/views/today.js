// Pantalla Hoy: orientación inmediata (siguiente acción, estado del día, lo hecho, pendientes, proyectos).
import * as model from './../model.js';
import * as store from './../store.js';
import { esc, dayKey, plural, fmtDayLong, cap } from './../lib.js';
import { icon, bar, empty, activityRow, taskRow, projectCard, dot } from './../ui.js';

export const state = { next: 0 }; // permite ver otra recomendación

const KIND_ACTION = { task: 'Completar', milestone: 'Marcar hito', define: 'Añadir tarea', log: 'Registrar', plan: 'Añadir tarea' };

function nextCard() {
  const items = model.nextActions();
  const n = items[state.next % items.length];
  if (!n) return '';
  const p = n.projectId ? model.project(n.projectId) : null;
  const act = n.type === 'task' ? `data-act="complete-next" data-id="${n.id}"`
    : n.type === 'milestone' ? `data-act="toggle-milestone" data-id="${n.id}"`
    : n.type === 'define' ? `data-act="new-task" data-project="${n.projectId}"`
    : `data-act="capture"`;
  return `<section class="card next">
    <div class="next-head"><h2 class="eyebrow">Siguiente acción</h2>${items.length > 1 ? `<button class="link" data-act="next-other">Otra${icon('arrow')}</button>` : ''}</div>
    <p class="next-title">${esc(n.title)}</p>
    <div class="next-why">${n.reasons.map(r => `<span class="tag">${esc(r)}</span>`).join('')}${p ? `<span class="tag">${dot(p.color)}${esc(p.name)}</span>` : ''}</div>
    <div class="next-actions">
      <button class="btn primary" ${act}>${icon(n.type === 'log' ? 'plus' : 'check')}${KIND_ACTION[n.type]}</button>
      ${n.type === 'task' ? `<button class="btn ghost" data-act="start-task" data-id="${n.id}">Empezar</button>` : ''}
      ${p ? `<a class="btn ghost" href="#/project/${p.id}">Ver proyecto</a>` : ''}
    </div>
  </section>`;
}

function statsRow() {
  const s = model.streak();
  const w = model.week();
  const todayCount = model.activeDays().get(dayKey()) || 0;
  return `<section class="stats">
    <div class="stat">
      <span class="stat-n num">${todayCount}</span>
      <span class="stat-l">${todayCount === 1 ? 'registro hoy' : 'registros hoy'}</span>
    </div>
    <div class="stat stat-week">
      <span class="stat-n num">${w.active}<span class="stat-of">/${w.goal}</span></span>
      <span class="stat-l">días activos esta semana</span>
      <div class="wdots" aria-hidden="true">${w.days.map(d => `<span class="wdot ${d.count ? 'on' : ''} ${d.key === dayKey() ? 'now' : ''}"></span>`).join('')}</div>
    </div>
    ${s.current ? `<div class="stat"><span class="stat-n num streak">${icon('flame')}${s.current}</span><span class="stat-l">${s.current === 1 ? 'día seguido' : 'días seguidos'}</span></div>` : ''}
  </section>`;
}

function noticeCard() {
  const n = model.notices()[0];
  if (!n) return '';
  return `<section class="notice" data-id="${esc(n.id)}">
    ${icon(n.icon)}
    <p>${esc(n.text)}</p>
    <div class="notice-actions">
      ${n.action ? `<a class="btn ghost small" href="${esc(n.action.href)}" data-act="notice-open" data-id="${esc(n.id)}">${esc(n.action.label)}</a>` : ''}
      ${n.secondary ? `<button class="btn ghost small" data-act="${esc(n.secondary.act)}" data-id="${esc(n.secondary.id)}" data-notice="${esc(n.id)}">${esc(n.secondary.label)}</button>` : ''}
      <button class="icon-btn" data-act="dismiss-notice" data-id="${esc(n.id)}" aria-label="Descartar">${icon('x')}</button>
    </div>
  </section>`;
}

function closingCard(acts) {
  const h = new Date().getHours();
  if (h < 18 || !acts.length) return '';
  if (model.activities().some(a => a.kind === 'note' && model.actDay(a) === dayKey())) return '';
  return `<section class="card closing">
    <h2 class="eyebrow">${icon('clock')}Cierre del día</h2>
    <p>Hoy registraste ${plural(acts.length, 'cosa', 'cosas')}. Anotar en una línea qué salió bien ayuda a retomar mañana.</p>
    <div class="next-actions">
      <button class="btn ghost" data-act="capture-note">Escribir una nota</button>
      <button class="btn ghost" data-act="new-task">Dejar lista la primera tarea</button>
    </div>
  </section>`;
}

export function render() {
  const today = dayKey();
  const acts = model.activities().filter(a => model.actDay(a) === today);
  const open = model.sortTasks(model.openTasks()).slice(0, 5);
  const openTotal = model.openTasks().length;
  const projects = model.activeProjects()
    .map(p => ({ p, info: model.projectInfo(p) }))
    .sort((a, b) => (a.info.idle ?? 999) - (b.info.idle ?? 999))
    .slice(0, 3);
  const name = model.firstName();

  return `
  <header class="view-head">
    <div>
      <p class="date">${esc(cap(fmtDayLong(today)))}</p>
      <h1>${model.greeting()}${name ? `, ${esc(name)}` : ''}</h1>
    </div>
    <a class="icon-btn" href="#/settings" aria-label="Ajustes y perfil">${icon('user')}</a>
  </header>
  ${noticeCard()}
  ${nextCard()}
  ${statsRow()}

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Hoy</h2>${acts.length ? `<a class="link" href="#/log">Ver registro${icon('arrow')}</a>` : ''}</div>
    ${acts.length
      ? `<ul class="acts">${acts.map(a => activityRow(a)).join('')}</ul>`
      : empty('plus', 'Aún no hay nada de hoy', 'Registra lo primero que hiciste: basta una línea.', '<button class="btn primary" data-act="capture">Registrar actividad</button>')}
  </section>

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Pendientes</h2>${openTotal > open.length ? `<a class="link" href="#/tasks">Ver las ${openTotal}${icon('arrow')}</a>` : ''}</div>
    ${open.length
      ? `<ul class="tasks">${open.map(t => taskRow(t)).join('')}</ul>`
      : empty('check', 'Sin tareas abiertas', 'Anota lo siguiente que quieras hacer y no tendrás que recordarlo.', '<button class="btn ghost" data-act="new-task">Nueva tarea</button>')}
  </section>

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Proyectos</h2><a class="link" href="#/projects">Ver todos${icon('arrow')}</a></div>
    ${projects.length
      ? `<div class="pcards">${projects.map(({ p }) => projectCard(p)).join('')}</div>`
      : empty('folder', 'Sin proyectos activos', 'Un proyecto agrupa lo que haces y muestra tu avance.', '<button class="btn ghost" data-act="new-project">Crear proyecto</button>')}
  </section>

  ${closingCard(acts)}`;
}
