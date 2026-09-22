// Acciones de dominio con feedback inmediato y deshacer.
import * as store from './store.js';
import * as model from './model.js';
import * as db from './db.js';
import { esc, nowIso, dayKey, plural } from './lib.js';
import { feedback, celebrate, openSheet, closeSheet, confirmSheet, KINDS, TASK_STATUS, PROJECT_STATUS, COLORS, dot } from './ui.js';
import { TEMPLATES } from './domain/templates.js';
import { dateShortcuts } from './domain/calendar.js';

// Estado del objetivo → tipo de registro de rumbo (goal_log).
const STATUS_LOG = { paused: 'paused', done: 'closed', archived: 'archived' };
const logGoal = (goalId, type, meta = {}) => store.create('goal_log', { goal_id: goalId, type, meta, note: '', occurred_at: nowIso() });

// ---------- feedback con el cambio real ----------
function snapshot(projectId) {
  const p = model.project(projectId);
  const s = model.streak();
  return { pct: p ? model.progress(p).pct : null, today: s.today, streak: s.current, week: model.week().active };
}

function deltaLines(before, projectId) {
  const after = snapshot(projectId);
  const p = model.project(projectId);
  const lines = [];
  // Las acciones no mueven el avance (solo hitos y criterios): aquí se nombra el objetivo y la constancia.
  if (p && before.pct !== null && after.pct !== null && after.pct !== before.pct) lines.push(`${p.name} ${before.pct}% → ${after.pct}%`);
  else if (p) lines.push(p.name);
  if (!before.today && after.today) {
    const goal = store.prefs().weeklyGoal;
    lines.push(`Día activo · ${after.week}/${goal} esta semana${after.streak > 1 ? ` · racha ${after.streak} días` : ''}`);
  }
  model.newAchievements().forEach(a => lines.push(`Logro: ${a.title}`));
  return lines;
}

// ---------- actividades ----------
export function logActivity(data, { quiet = false } = {}) {
  const before = snapshot(data.project_id);
  const a = store.create('activities', { source: 'capture', ...data });
  store.track('activity_create', { kind: a.kind, source: a.source, has_project: Boolean(a.project_id) });
  if (!quiet) {
    celebrate();
    feedback({
      title: a.kind === 'note' ? 'Nota guardada' : a.kind === 'win' ? 'Logro registrado' : 'Actividad registrada',
      lines: deltaLines(before, a.project_id),
      undo: () => store.remove('activities', a.id)
    });
  }
  return a;
}

// ---------- tareas ----------
export function completeTask(id) {
  const t = db.get('tasks', id);
  if (!t || t.status === 'done') return;
  const before = snapshot(t.project_id);
  const prevStatus = t.status;
  store.update('tasks', id, { status: 'done', completed_at: nowIso() });
  const a = store.create('activities', { kind: 'done', title: t.title, project_id: t.project_id, task_id: t.id, milestone_id: t.milestone_id || null, source: 'task' });
  store.track('task_complete', {});
  celebrate();
  feedback({
    title: 'Tarea completada',
    lines: deltaLines(before, t.project_id),
    undo: () => { store.update('tasks', id, { status: prevStatus, completed_at: null }); store.remove('activities', a.id); }
  });
}

export function reopenTask(id) {
  const t = db.get('tasks', id);
  if (!t) return;
  store.update('tasks', id, { status: 'todo', completed_at: null });
  // La actividad generada al completar se retira para que el historial sea fiel.
  model.activities().filter(a => a.task_id === id && a.source === 'task' && a.occurred_at >= (t.completed_at || '')).forEach(a => store.remove('activities', a.id));
  feedback({ title: 'Tarea reabierta', tone: 'info' });
}

export const toggleTask = id => { const t = db.get('tasks', id); if (!t) return; t.status === 'done' ? reopenTask(id) : completeTask(id); };

export function startTask(id) {
  store.update('tasks', id, { status: 'doing' });
  feedback({ title: 'En curso', lines: ['Aparecerá primero en tus pendientes'], tone: 'info' });
}

// ---------- borrar con deshacer ----------
export async function removeWithUndo(table, id, label, { ask = false } = {}) {
  if (ask && !(await confirmSheet(`¿Eliminar ${label}?`, { confirm: 'Eliminar', danger: true }))) return false;
  const prev = store.remove(table, id);
  if (prev) feedback({ title: `${label[0].toUpperCase() + label.slice(1)} eliminado`, tone: 'info', undo: () => store.restore(table, prev) });
  return true;
}

// ---------- formularios ----------
const projectOptions = (selected, { none = 'Sin objetivo' } = {}) =>
  `<option value="">${none}</option>` + model.projects().filter(p => p.status !== 'archived' || p.id === selected)
    .map(p => `<option value="${p.id}" ${p.id === selected ? 'selected' : ''}>${esc(p.name)}</option>`).join('');

const seg = (name, options, value) => `<div class="seg" role="radiogroup">${options.map(([v, l]) =>
  `<label><input type="radio" name="${name}" value="${v}" ${String(v) === String(value) ? 'checked' : ''}><span>${esc(l)}</span></label>`).join('')}</div>`;

const toLocalInput = iso => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const val = (fd, k) => String(fd.get(k) ?? '').trim();
const numOrNull = v => (v === '' || v === null || !isFinite(Number(v)) ? null : Number(v));

// Hitos abiertos agrupados por objetivo: vincular una tarea a un hito la asigna también a su objetivo.
function milestoneOptions(selected) {
  const open = model.milestones().filter(m => !m.done_at && m.status !== 'skipped' && model.project(m.project_id));
  if (!open.length) return '';
  const byGoal = new Map();
  open.forEach(m => { if (!byGoal.has(m.project_id)) byGoal.set(m.project_id, []); byGoal.get(m.project_id).push(m); });
  return `<label class="field"><span>Hito (opcional)</span><select name="milestone_id"><option value="">Sin hito</option>${[...byGoal].map(([gid, list]) =>
    `<optgroup label="${esc(model.project(gid).name)}">${list.map(m => `<option value="${m.id}" ${m.id === selected ? 'selected' : ''}>${esc(m.title)}</option>`).join('')}</optgroup>`).join('')}</select></label>`;
}

export function taskForm(task = null, defaults = {}) {
  // defaults.due_date llega del calendario: la fecha del día elegido viene puesta.
  const t = task || { title: '', project_id: defaults.project_id || '', status: 'todo', priority: 2, due_date: defaults.due_date || '', waiting_on: '', notes: '' };
  const chips = dateShortcuts(dayKey());
  openSheet(`
    <form class="form">
      <div class="sheet-head"><h2 class="sheet-title">${task ? 'Editar tarea' : 'Nueva tarea'}</h2><button type="button" class="icon-btn" data-sheet="close" aria-label="Cerrar">✕</button></div>
      <label class="field"><span>Tarea</span><input name="title" required maxlength="300" value="${esc(t.title)}" autocomplete="off" ${task ? '' : 'autofocus'}></label>
      <label class="field"><span>Objetivo</span><select name="project_id">${projectOptions(t.project_id)}</select></label>
      ${milestoneOptions(t.milestone_id)}
      <div class="field"><span>Estado</span>${seg('status', Object.entries(TASK_STATUS), t.status)}</div>
      <div class="field"><span>Prioridad</span>${seg('priority', [[1, 'Alta'], [2, 'Media'], [3, 'Baja']], t.priority)}</div>
      <div class="row2">
        <label class="field"><span>Fecha</span><input type="date" name="due_date" value="${esc(t.due_date || '')}">
          <span class="day-chips">${chips.map(c => `<button type="button" class="pill" data-day-set="${c.day}">${esc(c.label)}</button>`).join('')}${t.due_date ? '<button type="button" class="pill" data-day-set="">Sin fecha</button>' : ''}</span>
        </label>
        <label class="field" data-waiting ${t.status === 'waiting' ? '' : 'hidden'}><span>Esperando a</span><input name="waiting_on" maxlength="200" value="${esc(t.waiting_on)}" placeholder="Persona o equipo"></label>
      </div>
      <label class="field"><span>Notas</span><textarea name="notes" rows="3" maxlength="4000">${esc(t.notes)}</textarea></label>
      <div class="sheet-actions">
        ${task ? '<button type="button" class="btn ghost danger-text" data-del>Eliminar</button><span class="spacer"></span>' : ''}
        <button type="submit" class="btn primary">Guardar</button>
      </div>
    </form>`, {
    onClick: (e, el) => {
      if (e.target.closest('[data-del]')) { closeSheet(); removeWithUndo('tasks', task.id, 'tarea'); }
      if (e.target.name === 'status') el.querySelector('[data-waiting]').hidden = e.target.value !== 'waiting';
      // Atajos de fecha: rellenan el campo, no guardan solos (el usuario sigue decidiendo).
      const chip = e.target.closest('[data-day-set]');
      if (chip) { const input = el.querySelector('input[name=due_date]'); input.value = chip.dataset.daySet; input.focus(); }
    },
    onSubmit: fd => {
      const msId = val(fd, 'milestone_id') || null;
      const ms = msId ? model.milestone(msId) : null;
      const data = { title: val(fd, 'title'), project_id: ms ? ms.project_id : (val(fd, 'project_id') || null), milestone_id: msId, status: val(fd, 'status') || 'todo', priority: Number(val(fd, 'priority')) || 2, due_date: val(fd, 'due_date') || null, waiting_on: val(fd, 'waiting_on'), notes: val(fd, 'notes') };
      if (!data.title) return;
      closeSheet();
      if (task) {
        const wasDone = task.status === 'done';
        if (!wasDone && data.status === 'done') { store.update('tasks', task.id, { ...data, status: task.status }); completeTask(task.id); return; }
        if (wasDone && data.status !== 'done') data.completed_at = null;
        store.update('tasks', task.id, data);
        feedback({ title: 'Tarea actualizada', tone: 'info' });
      } else {
        const created = store.create('tasks', { ...data, completed_at: data.status === 'done' ? nowIso() : null });
        store.track('task_create', {});
        feedback({ title: 'Tarea creada', lines: [model.project(created.project_id)?.name].filter(Boolean), undo: () => store.remove('tasks', created.id) });
      }
    }
  });
}

export function projectForm(project = null, { onCreated } = {}) {
  const p = project || { name: '', goal: '', description: '', status: 'active', color: COLORS[model.projects().length % COLORS.length], tags: [], start_date: dayKey(), due_date: '', metric_unit: '', metric_start: '', metric_current: '', metric_target: '', progress_manual: null };
  const hasMetric = p.metric_target !== null && p.metric_target !== '' && p.metric_target !== undefined;
  openSheet(`
    <form class="form">
      <div class="sheet-head"><h2 class="sheet-title">${project ? 'Editar objetivo' : 'Nuevo objetivo'}</h2><button type="button" class="icon-btn" data-sheet="close" aria-label="Cerrar">✕</button></div>
      <label class="field"><span>¿Qué quieres construir?</span><input name="name" required maxlength="120" value="${esc(p.name)}" autocomplete="off" ${project ? '' : 'autofocus'} placeholder="Ej.: Certificación Google Cloud"></label>
      ${project ? '' : `<label class="field"><span>Estructura (opcional)</span><select name="template"><option value="">Empezar sin plantilla</option>${TEMPLATES.map(t => `<option value="${t.key}">${esc(t.label)}</option>`).join('')}</select><small class="muted">Crea etapas e hitos con criterios sugeridos; todo es editable.</small></label>`}
      <label class="field"><span>Por qué (opcional)</span><input name="goal" maxlength="500" value="${esc(p.goal)}" placeholder="Una o dos frases: qué cambia cuando lo logres"></label>
      <label class="field"><span>Descripción</span><textarea name="description" rows="2" maxlength="2000">${esc(p.description)}</textarea></label>
      ${project ? `<div class="field"><span>Estado</span>${seg('status', Object.entries(PROJECT_STATUS), p.status)}</div>` : ''}
      <div class="field"><span>Color</span><div class="swatches">${COLORS.map(c => `<label><input type="radio" name="color" value="${c}" ${c === p.color ? 'checked' : ''}><span class="swatch c-${c}" aria-label="${c}"></span></label>`).join('')}</div></div>
      <label class="field"><span>Etiquetas</span><input name="tags" value="${esc((p.tags || []).join(', '))}" placeholder="trabajo, cloud" autocomplete="off"></label>
      <div class="row2">
        <label class="field"><span>Inicio</span><input type="date" name="start_date" value="${esc(p.start_date || '')}"></label>
        <label class="field"><span>Fecha objetivo</span><input type="date" name="due_date" value="${esc(p.due_date || '')}"></label>
      </div>
      <details class="more" ${hasMetric ? 'open' : ''}>
        <summary>Indicador numérico (opcional)</summary>
        <p class="muted small">Para seguir un número (páginas, clientes, dinero, km). Se muestra aparte del avance, que sale de los hitos.</p>
        <div class="row3">
          <label class="field"><span>Inicio</span><input type="number" step="any" inputmode="decimal" name="metric_start" value="${esc(p.metric_start ?? '')}"></label>
          <label class="field"><span>Actual</span><input type="number" step="any" inputmode="decimal" name="metric_current" value="${esc(p.metric_current ?? '')}"></label>
          <label class="field"><span>Meta</span><input type="number" step="any" inputmode="decimal" name="metric_target" value="${esc(p.metric_target ?? '')}"></label>
        </div>
        <label class="field"><span>Unidad</span><input name="metric_unit" maxlength="24" value="${esc(p.metric_unit || '')}" placeholder="páginas, USD, clientes"></label>
      </details>
      <div class="sheet-actions">
        ${project ? '<button type="button" class="btn ghost danger-text" data-del>Eliminar</button><span class="spacer"></span>' : ''}
        <button type="submit" class="btn primary">${project ? 'Guardar' : 'Crear objetivo'}</button>
      </div>
    </form>`, {
    onClick: async e => {
      if (!e.target.closest('[data-del]')) return;
      closeSheet();
      const n = model.activities().filter(a => a.project_id === project.id).length;
      const ok = await confirmSheet(`¿Eliminar “${project.name}”?`, { confirm: 'Eliminar', danger: true, detail: `Sus etapas, hitos y criterios se eliminan; sus ${plural(n, 'actividad', 'actividades')} y tareas se conservan sin objetivo. Si solo quieres dejarlo de lado, usa “Archivado”.` });
      if (!ok) return;
      const ms = model.milestones().filter(m => m.project_id === project.id);
      ms.forEach(m => model.criteriaOf(m.id).forEach(c => store.remove('criteria', c.id)));
      ms.forEach(m => store.remove('milestones', m.id));
      model.stages().filter(s => s.goal_id === project.id).forEach(s => store.remove('stages', s.id));
      model.evidence().filter(e => e.goal_id === project.id).forEach(e => store.remove('evidence', e.id));
      store.remove('projects', project.id);
      location.hash = '#/goals';
      feedback({ title: 'Objetivo eliminado', tone: 'info' });
    },
    onSubmit: fd => {
      const data = {
        name: val(fd, 'name'), goal: val(fd, 'goal'), description: val(fd, 'description'),
        color: val(fd, 'color') || 'teal',
        tags: val(fd, 'tags').split(',').map(s => s.trim().toLowerCase()).filter(Boolean).slice(0, 12),
        start_date: val(fd, 'start_date') || null, due_date: val(fd, 'due_date') || null,
        metric_unit: val(fd, 'metric_unit') || null,
        metric_start: numOrNull(val(fd, 'metric_start')), metric_current: numOrNull(val(fd, 'metric_current')), metric_target: numOrNull(val(fd, 'metric_target'))
      };
      if (data.metric_target !== null && data.metric_start === null) data.metric_start = 0;
      if (data.metric_target !== null && data.metric_current === null) data.metric_current = data.metric_start;
      if (project) data.status = val(fd, 'status') || project.status;
      if (!data.name) return;
      closeSheet();
      if (project) {
        if (data.status !== project.status) {
          data.completed_at = data.status === 'done' ? nowIso() : null;
          logGoal(project.id, STATUS_LOG[data.status] || (project.status === 'paused' ? 'resumed' : 'reopened'), { from: project.status });
        }
        store.update('projects', project.id, data);
        feedback({ title: 'Objetivo actualizado', tone: 'info' });
      } else {
        const created = store.create('projects', data);
        logGoal(created.id, 'created');
        const tpl = val(fd, 'template');
        if (tpl) { applyTemplateFn?.(created.id, tpl, { endowed: true }); store.update('projects', created.id, { template: tpl }); }
        store.track('project_create', { template: tpl || null });
        feedback({ title: 'Objetivo creado', lines: [tpl ? 'Con etapas e hitos sugeridos: edítalos a tu medida' : 'Añade su primer hito con criterios de “hecho”'] });
        if (onCreated) onCreated(created); else location.hash = `#/goal/${created.id}`;
      }
    }
  });
}

export function metricForm(p) {
  openSheet(`
    <form class="form">
      <div class="sheet-head"><h2 class="sheet-title">Actualizar ${esc(p.metric_unit || 'valor')}</h2><button type="button" class="icon-btn" data-sheet="close" aria-label="Cerrar">✕</button></div>
      <label class="field"><span>Valor actual (meta ${model.fmtNum(p.metric_target)})</span><input type="number" step="any" inputmode="decimal" name="v" value="${esc(p.metric_current ?? '')}" required autofocus></label>
      <label class="field"><span>Nota (opcional)</span><input name="note" maxlength="200" placeholder="¿Qué cambió?"></label>
      <div class="sheet-actions"><button type="submit" class="btn primary">Guardar</button></div>
    </form>`, {
    onSubmit: fd => {
      const v = numOrNull(val(fd, 'v'));
      if (v === null) return;
      closeSheet();
      const before = snapshot(p.id);
      store.update('projects', p.id, { metric_current: v });
      const a = store.create('activities', { kind: 'progress', project_id: p.id, title: val(fd, 'note') || `${p.name}: ${model.fmtNum(v)}${p.metric_unit ? ' ' + p.metric_unit : ''}`, source: 'capture' });
      celebrate();
      feedback({ title: 'Progreso actualizado', lines: deltaLines(before, p.id), undo: () => { store.update('projects', p.id, { metric_current: p.metric_current }); store.remove('activities', a.id); } });
    }
  });
}

export function activityForm(a) {
  openSheet(`
    <form class="form">
      <div class="sheet-head"><h2 class="sheet-title">Editar actividad</h2><button type="button" class="icon-btn" data-sheet="close" aria-label="Cerrar">✕</button></div>
      <label class="field"><span>Qué</span><input name="title" required maxlength="500" value="${esc(a.title)}" autocomplete="off"></label>
      <div class="field"><span>Tipo</span>${seg('kind', Object.entries(KINDS).map(([k, v]) => [k, v.label]), a.kind)}</div>
      <div class="row2">
        <label class="field"><span>Objetivo</span><select name="project_id">${projectOptions(a.project_id)}</select></label>
        <label class="field"><span>Cuándo</span><input type="datetime-local" name="occurred_at" value="${toLocalInput(a.occurred_at)}" required></label>
      </div>
      <label class="field"><span>Detalle</span><textarea name="body" rows="3" maxlength="20000">${esc(a.body)}</textarea></label>
      <div class="sheet-actions">
        <button type="button" class="btn ghost danger-text" data-del>Eliminar</button><span class="spacer"></span>
        <button type="submit" class="btn primary">Guardar</button>
      </div>
    </form>`, {
    onClick: e => { if (e.target.closest('[data-del]')) { closeSheet(); removeWithUndo('activities', a.id, 'actividad'); } },
    onSubmit: fd => {
      const when = new Date(val(fd, 'occurred_at'));
      const data = { title: val(fd, 'title'), kind: val(fd, 'kind') || a.kind, project_id: val(fd, 'project_id') || null, body: val(fd, 'body'), occurred_at: isNaN(when) ? a.occurred_at : when.toISOString() };
      if (!data.title) return;
      closeSheet();
      store.update('activities', a.id, data);
      feedback({ title: 'Actividad actualizada', tone: 'info' });
    }
  });
}

// structure.js registra aquí cómo aplicar plantillas (evita una importación circular).
let applyTemplateFn = null;
export const setTemplateApplier = fn => { applyTemplateFn = fn; };

export { projectOptions, seg, dot };
