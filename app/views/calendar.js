// Calendario: cuándo pienso hacer las cosas y qué ocurrió de verdad cada día.
// Tareas (due_date) = lo planificado. Actividades (occurred_at) = lo que hice. No se mezclan.
// No hay fuente de datos nueva: todo sale de model.tasks() y model.activities(), ya en memoria.
import * as model from './../model.js';
import { esc, dayKey, parseDay, plural, fmtDayShort, cap, addDays } from './../lib.js';
import { icon, empty, activityRow, taskRow, dot } from './../ui.js';
import { monthGrid, weekGrid, monthKeyOf, daySummary, EMPTY_CELL, undatedOpen, overdueTasks, rangeSummary, monthDays } from './../domain/calendar.js';
import { outcomeLabel, resultInfo } from './../domain/outcomes.js';

// month: mes visible; day: día seleccionado; mode: mes o semana; project: filtro por objetivo.
export const state = { month: monthKeyOf(dayKey()), day: dayKey(), mode: 'month', project: '' };

const WEEKDAYS = [['L', 'lunes'], ['M', 'martes'], ['X', 'miércoles'], ['J', 'jueves'], ['V', 'viernes'], ['S', 'sábado'], ['D', 'domingo']];
const LOCALE = 'es';
const fmtMonthYear = k => cap(parseDay(k).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' }));
const fmtDayFull = k => cap(parseDay(k).toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' }));
const fmtWeekRange = k => {
  const days = weekGrid(k);
  const a = days[0].day, b = days.at(-1).day;
  return `${fmtDayShort(a)} – ${fmtDayShort(b)}`;
};

// Texto sin culpa para una fecha pasada: dice desde cuándo espera, no que se falló.
export const overdueLabel = (day, today) => (day < today ? `Pendiente desde ${fmtDayShort(day)}` : '');

// Marcas de una celda: hueco = pendiente, check = completada, punto = actividad registrada.
// La forma distingue, no solo el color (accesibilidad §27).
function marks(s) {
  if (!s.total) return '';
  const out = [];
  if (s.pending) out.push(`<span class="cal-mark cal-pend ${s.overdue ? 'is-overdue' : ''}"></span>`);
  if (s.done) out.push(`<span class="cal-mark cal-done">${icon('check')}</span>`);
  if (s.notDone) out.push(`<span class="cal-mark cal-undone">${icon('x')}</span>`);
  if (s.moved) out.push(`<span class="cal-mark cal-moved">${icon('undo')}</span>`);
  if (s.activities) out.push(`<span class="cal-mark cal-act"></span>`);
  return `<span class="cal-marks" aria-hidden="true">${out.join('')}</span>`;
}

// Etiqueta para lectores de pantalla: el estado del día en palabras, sin depender del color.
function dayAria(day, s) {
  const parts = [fmtDayFull(day)];
  if (s.isToday) parts.push('hoy');
  if (s.pending) parts.push(plural(s.pending, s.overdue ? 'tarea pendiente' : 'tarea planificada', s.overdue ? 'tareas pendientes' : 'tareas planificadas'));
  if (s.done) parts.push(plural(s.done, 'tarea completada', 'tareas completadas'));
  if (s.notDone) parts.push(plural(s.notDone, 'tarea no realizada', 'tareas no realizadas'));
  if (s.moved) parts.push(plural(s.moved, 'tarea movida a otra fecha', 'tareas movidas a otra fecha'));
  if (s.activities) parts.push(plural(s.activities, 'actividad registrada', 'actividades registradas'));
  if (!s.total) parts.push('sin nada anotado');
  return parts.join(', ');
}

function cellButton({ day, outside }, cells, today) {
  const s = daySummary(cells.get(day), day, today);
  const cls = ['cal-day', outside ? 'is-outside' : '', s.isToday ? 'is-today' : '', day === state.day ? 'is-selected' : '', s.overdue ? 'has-overdue' : ''].filter(Boolean).join(' ');
  return `<button class="${cls}" data-act="cal-day" data-day="${day}" role="gridcell"
    aria-label="${esc(dayAria(day, s))}" aria-current="${s.isToday ? 'date' : 'false'}" aria-pressed="${day === state.day}" tabindex="${day === state.day ? 0 : -1}">
    <span class="cal-num num">${Number(day.slice(8))}</span>
    ${marks(s)}
  </button>`;
}

function monthView(cells, today) {
  return `<div class="cal-grid" role="grid" aria-label="${esc(fmtMonthYear(state.month))}">
    <div class="cal-weekdays" role="row">${WEEKDAYS.map(([s, l]) => `<span role="columnheader" aria-label="${l}">${s}</span>`).join('')}</div>
    ${monthGrid(state.month).map(week => `<div class="cal-week" role="row">${week.map(c => cellButton(c, cells, today)).join('')}</div>`).join('')}
  </div>`;
}

// Semana: una fila por día con sus títulos, útil para planificar de un vistazo.
function weekView(cells, today) {
  return `<ul class="cal-week-list">${weekGrid(state.day).map(({ day }) => {
    const c = cells.get(day) || EMPTY_CELL;
    const s = daySummary(c, day, today);
    const items = [...c.pending.map(t => ({ cls: 'cal-pend', text: t.title })), ...c.done.map(t => ({ cls: 'cal-done', text: t.title })),
      ...(c.notDone || []).map(t => ({ cls: 'cal-undone', text: t.title })), ...(c.moved || []).map(m => ({ cls: 'cal-moved', text: m.task.title })),
      ...c.activities.map(a => ({ cls: 'cal-act', text: a.title }))];
    return `<li>
      <button class="cal-wday ${s.isToday ? 'is-today' : ''} ${day === state.day ? 'is-selected' : ''}" data-act="cal-day" data-day="${day}" aria-label="${esc(dayAria(day, s))}" aria-pressed="${day === state.day}">
        <span class="cal-wday-head"><span class="cal-wday-name">${esc(cap(parseDay(day).toLocaleDateString(LOCALE, { weekday: 'short' }).replace('.', '')))}</span><span class="cal-num num">${Number(day.slice(8))}</span>${marks(s)}</span>
        ${items.length ? `<span class="cal-wday-items">${items.slice(0, 4).map(i => `<span class="cal-item ${i.cls}"><i aria-hidden="true"></i>${esc(i.text)}</span>`).join('')}${items.length > 4 ? `<span class="cal-item cal-more">+${items.length - 4}</span>` : ''}</span>` : '<span class="cal-wday-items muted small">Sin nada anotado</span>'}
      </button>
    </li>`;
  }).join('')}</ul>`;
}

// Resumen del periodo visible: descriptivo, sin metas ni juicios. Cada número se explica solo.
function periodSummary(cells) {
  const days = state.mode === 'week' ? weekGrid(state.day).map(d => d.day) : monthDays(state.month);
  const s = rangeSummary(cells, days);
  if (!s.done && !s.notDone && !s.moved && !s.activities && !s.pending) return '';
  const periodo = state.mode === 'week' ? 'Esta semana' : cap(parseDay(state.month).toLocaleDateString(LOCALE, { month: 'long' }));
  const partes = [
    s.done ? `${plural(s.done, 'tarea completada', 'tareas completadas')}` : '',
    s.notDone ? `${plural(s.notDone, 'no realizada', 'no realizadas')}` : '',
    s.moved ? `${plural(s.moved, 'movida a otra fecha', 'movidas a otra fecha')}` : '',
    s.pending ? `${plural(s.pending, 'pendiente', 'pendientes')}` : '',
    s.activities ? `${plural(s.activities, 'actividad', 'actividades')} en ${plural(s.activeDays, 'día', 'días')}` : ''
  ].filter(Boolean);
  return `<p class="cal-summary"><strong>${esc(periodo)}:</strong> ${partes.join(' · ')}</p>`;
}

// Detalle del día: pendientes, completadas y actividad, claramente separadas.
function dayPanel(today) {
  const c = model.dayCell(state.day, state.project || null) || EMPTY_CELL;
  const past = state.day < today;
  const sections = [
    c.pending.length ? `<section class="cal-sec">
        <h3 class="eyebrow">${past ? 'Pendiente' : 'Pendientes'}</h3>
        ${past ? `<p class="muted small">${esc(overdueLabel(state.day, today))}. Puedes moverla a otro día abriéndola.</p>` : ''}
        <ul class="tasks">${c.pending.map(t => taskRow(t)).join('')}</ul>
      </section>` : '',
    c.done.length ? `<section class="cal-sec">
        <h3 class="eyebrow">Completadas</h3>
        <ul class="tasks">${c.done.map(t => taskRow(t)).join('')}</ul>
      </section>` : '',
    (c.notDone || []).length ? `<section class="cal-sec">
        <h3 class="eyebrow">No realizadas</h3>
        <ul class="tasks">${c.notDone.map(t => taskRow(t)).join('')}</ul>
      </section>` : '',
    (c.moved || []).length ? `<section class="cal-sec">
        <h3 class="eyebrow">Movidas a otra fecha</h3>
        <ul class="moves">${c.moved.map(m => `<li class="move">
          ${icon('undo')}
          <button class="move-body" data-act="edit-task" data-id="${m.task.id}">
            <span class="move-title">${esc(m.task.title)}</span>
            <span class="move-meta">${m.to ? `Ahora prevista el ${esc(fmtDayShort(m.to))}` : 'Ahora sin fecha'}${m.note ? ` · ${esc(m.note.slice(0, 80))}` : ''}</span>
          </button></li>`).join('')}</ul>
      </section>` : '',
    c.activities.length ? `<section class="cal-sec">
        <h3 class="eyebrow">Actividad registrada</h3>
        <ul class="acts">${c.activities.map(a => activityRow(a)).join('')}</ul>
      </section>` : ''
  ].filter(Boolean).join('');

  return `<section class="card cal-panel" aria-live="polite">
    <div class="cal-panel-head">
      <h2 class="cal-panel-title">${esc(fmtDayFull(state.day))}${state.day === today ? ' · hoy' : ''}</h2>
      <button class="btn ghost small" data-act="new-task-day" data-day="${state.day}">${icon('plus')}Nueva tarea</button>
    </div>
    ${sections || empty('calendar', past ? 'Nada anotado este día' : 'Este día está libre',
      past ? 'Lo que registres queda con su fecha.' : 'Puedes planificar aquí lo que quieras hacer.',
      `<button class="btn ghost" data-act="new-task-day" data-day="${state.day}">Planificar algo</button>`)}
  </section>`;
}

export function render() {
  const today = dayKey();
  const project = state.project || null;
  const cells = model.calendarDays(project);
  const all = model.tasks();
  const undated = undatedOpen(all, project);
  const overdue = overdueTasks(all, today, project);
  const projects = model.projects();
  const period = state.mode === 'week' ? fmtWeekRange(state.day) : fmtMonthYear(state.month);
  const step = state.mode === 'week' ? 'semana' : 'mes';

  return `
  <header class="view-head">
    <div><h1>Calendario</h1><p class="date">Lo que planeas y lo que hiciste</p></div>
    <button class="icon-btn" data-act="new-task-day" data-day="${state.day}" aria-label="Nueva tarea">${icon('plus')}</button>
  </header>

  <div class="filters between cal-bar">
    <div class="seg-tabs" role="tablist" aria-label="Vista del calendario">
      ${[['month', 'Mes'], ['week', 'Semana']].map(([k, l]) =>
        `<button class="pill ${state.mode === k ? 'on' : ''}" data-act="cal-mode" data-v="${k}" role="tab" aria-selected="${state.mode === k}">${l}</button>`).join('')}
    </div>
    <div class="cal-nav">
      <button class="icon-btn" data-act="cal-prev" aria-label="${step === 'mes' ? 'Mes anterior' : 'Semana anterior'}">${icon('back')}</button>
      <button class="pill" data-act="cal-today">Hoy</button>
      <button class="icon-btn" data-act="cal-next" aria-label="${step === 'mes' ? 'Mes siguiente' : 'Semana siguiente'}">${icon('arrow')}</button>
    </div>
  </div>
  <p class="cal-period num" aria-live="polite">${esc(period)}</p>
  ${projects.length ? `<div class="filters cal-filter">
    <select class="pill-select" data-act="cal-project" aria-label="Filtrar por objetivo">
      <option value="">Todos los objetivos</option>
      ${projects.map(p => `<option value="${p.id}" ${state.project === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
    </select>
    ${state.project ? `<span class="tag">${dot(model.project(state.project)?.color)}${esc(model.project(state.project)?.name || '')}</span>` : ''}
  </div>` : ''}

  <div class="cal-layout">
    <div class="cal-main">
      ${state.mode === 'week' ? weekView(cells, today) : monthView(cells, today)}
      ${periodSummary(cells)}
      <p class="cal-legend">
        <span><i class="cal-mark cal-pend"></i>Planificado</span>
        <span><i class="cal-mark cal-done">${icon('check')}</i>Completado</span>
        <span><i class="cal-mark cal-undone">${icon('x')}</i>No realizado</span>
        <span><i class="cal-mark cal-moved">${icon('undo')}</i>Movido</span>
        <span><i class="cal-mark cal-act"></i>Actividad</span>
      </p>
    </div>
    <div class="cal-side">
      ${dayPanel(today)}
      ${overdue.length ? `<section class="block cal-extra">
        <div class="block-head"><h2 class="eyebrow">Esperando desde antes</h2><span class="muted small num">${overdue.length}</span></div>
        <ul class="tasks">${model.sortTasks(overdue).slice(0, 5).map(t => taskRow(t, { move: true })).join('')}</ul>
        <p class="muted small">Mover no las marca como hechas: solo cambia el día previsto.</p>
      </section>` : ''}
      ${undated.length ? `<section class="block cal-extra">
        <div class="block-head"><h2 class="eyebrow">Sin fecha</h2><span class="muted small num">${plural(undated.length, 'tarea', 'tareas')}</span></div>
        <p class="muted small">No se colocan en ningún día hasta que les pongas fecha.</p>
        <a class="link" href="#/next">Ver pendientes${icon('arrow')}</a>
      </section>` : ''}
    </div>
  </div>`;
}

// Navegación por teclado dentro de la rejilla (flechas, inicio/fin, av/re pág).
export const KEY_STEPS = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
export function moveSelection(key) {
  const step = KEY_STEPS[key];
  if (step === undefined) return false;
  state.day = addDays(state.day, step);
  state.month = monthKeyOf(state.day);
  return true;
}
