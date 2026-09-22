// Progreso: evolución por semana, mes o año + mapa de actividad, patrones, récords y logros.
import * as model from './../model.js';
import { esc, fmtDayShort, fmtWeekday, fmtMonth, dayKey, plural, cap, parseDay } from './../lib.js';
import { icon, bar, empty, dot } from './../ui.js';

// El lunes es el día de reflexión semanal (ver PRODUCT.md): al abrir Progreso ese día,
// arranca en la semana anterior, que es la que hay que revisar, no la actual (casi vacía).
export const state = { range: 'week', offset: new Date().getDay() === 1 ? -1 : 0 };

const RANGES = [['week', 'Semana'], ['month', 'Mes'], ['year', 'Año']];

const label = (range, start) => {
  if (range === 'week') return `Semana del ${fmtDayShort(start)}`;
  if (range === 'month') return cap(parseDay(start).toLocaleDateString('es', { month: 'long', year: 'numeric' }));
  return start.slice(0, 4);
};

function delta(now, before) {
  if (!before) return '';
  const d = Math.round(((now - before) / before) * 100);
  if (!isFinite(d) || Math.abs(d) < 5) return '<span class="delta">=</span>';
  return `<span class="delta ${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : ''}${d}%</span>`;
}

function chart(p) {
  const max = Math.max(1, ...p.series.map(s => s.count));
  const isYear = p.range === 'year';
  const today = dayKey();
  return `<div class="chart" role="img" aria-label="Actividades por ${isYear ? 'mes' : 'día'}">
    ${p.series.map(s => `<div class="chart-col ${s.from === today ? 'now' : ''}" title="${esc(fmtDayShort(s.from))}: ${s.count}">
      <div class="chart-bar"><span style="--h:${Math.round((s.count / max) * 100)}%"></span></div>
      <span class="chart-x">${isYear ? fmtMonth(s.from) : p.range === 'week' ? fmtWeekday(s.from) : (parseDay(s.from).getDate() % 5 === 0 || parseDay(s.from).getDate() === 1 ? parseDay(s.from).getDate() : '')}</span>
    </div>`).join('')}
  </div>`;
}

function heat() {
  const cols = model.heatmap(18);
  return `<div class="heat" role="img" aria-label="Mapa de actividad de las últimas 18 semanas">
    ${cols.map(col => `<div class="heat-col">${col.map(c => `<span class="heat-c l${c.level} ${c.future ? 'fut' : ''}" title="${esc(fmtDayShort(c.key))}: ${plural(c.count, 'actividad', 'actividades')}"></span>`).join('')}</div>`).join('')}
  </div>
  <div class="heat-legend muted small"><span>Menos</span>${[0, 1, 2, 3, 4].map(l => `<span class="heat-c l${l}"></span>`).join('')}<span>Más</span></div>`;
}

export function render() {
  const p = model.period(state.range, state.offset);
  const prev = model.period(state.range, state.offset - 1);
  const r = model.records();
  const ins = model.insights();
  const ach = model.achievements();
  const unlocked = ach.filter(a => a.unlocked);
  const next = ach.filter(a => !a.unlocked).sort((a, b) => b.cur / b.target - a.cur / a.target).slice(0, 3);

  return `
  <header class="view-head">
    <div><h1>Historia</h1><p class="date">${esc(label(state.range, p.start))}</p></div>
  </header>

  <div class="filters between">
    <div class="seg-tabs" role="tablist">
      ${RANGES.map(([k, l]) => `<button class="pill ${state.range === k ? 'on' : ''}" data-act="range" data-v="${k}" role="tab" aria-selected="${state.range === k}">${l}</button>`).join('')}
    </div>
    <div class="nav-arrows">
      <button class="icon-btn" data-act="period" data-v="-1" aria-label="Periodo anterior">${icon('back')}</button>
      <button class="icon-btn" data-act="period" data-v="1" aria-label="Periodo siguiente" ${state.offset >= 0 ? 'disabled' : ''}>${icon('arrow')}</button>
    </div>
  </div>

  <section class="tiles">
    <div class="tile"><span class="tile-n num">${p.activities}${delta(p.activities, prev.activities)}</span><span class="tile-l">${p.activities === 1 ? 'actividad' : 'actividades'}</span></div>
    <div class="tile"><span class="tile-n num">${p.activeDays}</span><span class="tile-l">${p.activeDays === 1 ? 'día activo' : 'días activos'}</span></div>
    <div class="tile"><span class="tile-n num">${p.tasksDone}${delta(p.tasksDone, prev.tasksDone)}</span><span class="tile-l">${p.tasksDone === 1 ? 'tarea cerrada' : 'tareas cerradas'}</span></div>
    <div class="tile"><span class="tile-n num">${p.milestonesDone}</span><span class="tile-l">${p.milestonesDone === 1 ? 'hito' : 'hitos'}</span></div>
  </section>

  ${p.activities ? chart(p) : empty('chart', 'Sin actividad en este periodo', 'Cuando registres algo aparecerá aquí.')}

  ${p.byProject.length ? `<section class="block">
    <div class="block-head"><h2 class="eyebrow">Por proyecto</h2></div>
    <ul class="dist">${p.byProject.slice(0, 6).map(x => `<li>
      <span class="dist-name">${x.project ? dot(x.project.color) + esc(x.project.name) : '<span class="muted">Sin proyecto</span>'}</span>
      ${bar((x.count / p.activities) * 100, 'thin')}
      <span class="num dist-n">${x.count}</span>
    </li>`).join('')}</ul>
  </section>` : ''}

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Mapa de actividad</h2><span class="muted small">18 semanas</span></div>
    ${heat()}
  </section>

  ${ins.length ? `<section class="block">
    <div class="block-head"><h2 class="eyebrow">Patrones</h2></div>
    <ul class="insights">${ins.map(i => `<li>${icon(i.icon)}<span>${esc(i.text)}</span></li>`).join('')}</ul>
  </section>` : ''}

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Récords</h2></div>
    <ul class="records">
      <li><span class="num ${r.currentStreak ? '' : 'muted'}">${r.currentStreak}</span><span>racha actual</span></li>
      <li><span class="num">${r.bestStreak}</span><span>mejor racha</span></li>
      <li><span class="num">${r.bestWeek ? r.bestWeek.count : 0}</span><span>mejor semana</span></li>
      <li><span class="num">${r.total}</span><span>actividades en total</span></li>
      <li><span class="num">${r.activeDays}</span><span>días activos</span></li>
      ${r.since ? `<li><span class="num">${esc(fmtDayShort(r.since))}</span><span>primer registro</span></li>` : ''}
    </ul>
  </section>

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Logros</h2><span class="muted small num">${unlocked.length}/${ach.length}</span></div>
    <ul class="achs">
      ${unlocked.map(a => `<li class="ach on">${icon('award')}<div><strong>${esc(a.title)}</strong><span>${esc(a.desc)}</span></div></li>`).join('')}
      ${next.map(a => `<li class="ach"><span class="ach-prog num">${a.cur}/${a.target}</span><div><strong>${esc(a.title)}</strong><span>${esc(a.desc)}</span></div></li>`).join('')}
    </ul>
  </section>`;
}
