// Captura rápida: una línea de texto → actividad, tarea, nota o logro.
// La detección es local, visible y siempre editable (nunca decide en silencio).
import * as store from './store.js';
import * as model from './model.js';
import * as db from './db.js';
import { esc, norm, addDays, dayKey, fmtDayShort } from './lib.js';
import { openSheet, closeSheet, feedback, icon, dot, KINDS } from './ui.js';
import { logActivity, completeTask } from './actions.js';

const RULES = [
  ['task', /^(tengo que|hay que|debo|necesito|pendiente|recordar|por hacer|todo)\b/],
  ['note', /^(idea|nota|pienso|pensamiento|aprendi|aprendizaje|reflexion)\b/],
  ['win', /\b(logre|consegui|aprobe|gane|me aceptaron|me contrataron|me eligieron|firmamos|cerramos el trato|record personal|publicaron)\b/],
  ['progress', /\b(avance|avanzo|avanzamos|empece|comence|trabaje en|sigo con|estoy con|progreso|mitad)\b/],
  ['done', /\b(termine|terminamos|complete|completamos|finalice|entregue|entregamos|cerre|acabe|resolvi|arregle|corregi|envie|publique|presente|hice|implemente|lance|reunion|llamada)\b/]
];

const STOP = new Set('el la los las un una unos unas de del al a en y o para por con sin que se lo le mi mis tu su sus es fue ya muy mas hoy ayer'.split(' '));
const VERBS = /^(termine|complete|finalice|entregue|cerre|acabe|resolvi|arregle|corregi|envie|publique|presente|hice|implemente|lance|avance|empece|trabaje|hecho|listo)$/;
const tokens = s => norm(s).split(' ').filter(w => w.length > 2 && !STOP.has(w) && !VERBS.test(w) && !w.startsWith('#'));
const slug = s => norm(s).replace(/\s+/g, '');

export function parse(text) {
  const n = norm(text);
  const out = { kind: null, projectId: null, projectBy: '', daysAgo: 0, taskId: null };
  for (const [kind, re] of RULES) if (re.test(n)) { out.kind = kind; break; }

  const projects = model.projects().filter(p => p.status !== 'archived');
  const tag = (n.match(/#([a-z0-9]+)/) || [])[1];
  if (tag) {
    const hit = projects.find(p => slug(p.name).startsWith(tag) || (p.tags || []).some(t => slug(t) === tag));
    if (hit) { out.projectId = hit.id; out.projectBy = `#${tag}`; }
  }
  if (!out.projectId) {
    const hit = projects.filter(p => p.name.length >= 3).sort((a, b) => b.name.length - a.name.length)
      .find(p => (' ' + n + ' ').includes(' ' + norm(p.name) + ' '));
    if (hit) { out.projectId = hit.id; out.projectBy = 'nombre'; }
  }

  if (/\banteayer\b/.test(n)) out.daysAgo = 2;
  else if (/\bayer\b/.test(n)) out.daysAgo = 1;

  // ¿Se parece a una tarea abierta? (≥60% de sus palabras presentes y al menos 2, o todas si es corta)
  const words = new Set(tokens(text));
  if (words.size && out.kind !== 'task' && out.kind !== 'note') {
    let best = null;
    for (const t of model.openTasks()) {
      const tw = tokens(t.title);
      if (!tw.length) continue;
      const shared = tw.filter(w => words.has(w)).length;
      const score = shared / tw.length;
      if ((score >= 0.6 && shared >= 2) || (tw.length <= 2 && shared === tw.length)) {
        if (!best || score > best.score) best = { id: t.id, score, projectId: t.project_id };
      }
    }
    if (best) { out.taskId = best.id; if (!out.projectId && best.projectId) { out.projectId = best.projectId; out.projectBy = 'tarea'; } }
  }
  return out;
}

const cleanTitle = (text, by) => {
  let s = text.trim();
  if (by && by.startsWith('#')) s = s.replace(/#[\p{L}\p{N}]+/u, '').replace(/\s{2,}/g, ' ').trim();
  return s.replace(/^[,.\s]+|[,\s]+$/g, '');
};

function recentProjects(limit = 4) {
  const seen = new Set();
  const out = [];
  for (const a of model.activities()) {
    if (a.project_id && !seen.has(a.project_id)) {
      const p = model.project(a.project_id);
      if (p && p.status === 'active') { seen.add(p.id); out.push(p); }
    }
    if (out.length >= limit) break;
  }
  for (const p of model.activeProjects()) { if (out.length >= limit) break; if (!seen.has(p.id)) { seen.add(p.id); out.push(p); } }
  return out;
}

const CAPTURE_KINDS = [['done', 'Hecho', 'check'], ['progress', 'Avance', 'arrow'], ['task', 'Tarea', 'circle'], ['note', 'Nota', 'note'], ['win', 'Logro', 'star']];

export function openCapture({ text = '', kind = null, projectId = null } = {}) {
  store.track('capture_open', {});
  // day = el día al que pertenece lo registrado (no el día en que se escribe); time = hora opcional.
  const st = { kind: kind || db.kvGet('lastKind', 'done'), projectId, milestoneId: null, milestoneFor: null, learned: false, day: dayKey(), time: '', taskId: null, completeTask: true, manual: { kind: Boolean(kind), project: Boolean(projectId), when: false, milestone: false } };
  const el = openSheet(`
    <form class="form capture" autocomplete="off">
      <div class="sheet-head"><h2 class="sheet-title">Registrar</h2><button type="button" class="icon-btn" data-sheet="close" aria-label="Cerrar">✕</button></div>
      <label class="sr-only" for="cap-text">Qué hiciste</label>
      <textarea id="cap-text" name="text" rows="2" maxlength="500" required placeholder="¿Qué hiciste? Ej.: Terminé el informe #IoT" enterkeyhint="done">${esc(text)}</textarea>
      <div class="cap-row" data-kinds role="radiogroup" aria-label="Tipo"></div>
      <div class="cap-row" data-projects aria-label="Objetivo"></div>
      <div class="cap-row" data-milestones aria-label="Hito"></div>
      <div class="cap-row" data-extra></div>
      <label class="field" data-learned hidden><span>¿Qué aprendiste? (una línea, opcional)</span><input name="learned" maxlength="300" autocomplete="off"></label>
      <div class="sheet-actions">
        <span class="muted small cap-hint" data-hint></span>
        <button type="submit" class="btn primary" data-save>Guardar</button>
      </div>
    </form>`, {
    onOpen: root => { const ta = root.querySelector('textarea'); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); refresh(root); },
    onClick: (e, root) => {
      const b = e.target.closest('[data-k],[data-p],[data-m],[data-when],[data-task],[data-more-projects],[data-learn],[data-time-add]');
      if (!b) return;
      if (b.dataset.k) { st.kind = b.dataset.k; st.manual.kind = true; }
      if (b.dataset.p !== undefined) { st.projectId = b.dataset.p || null; st.manual.project = true; }
      if (b.dataset.when !== undefined) { st.day = b.dataset.when; st.manual.when = true; }
      if (b.dataset.task !== undefined) st.completeTask = !st.completeTask;
      if (b.dataset.moreProjects !== undefined) { st.showAll = true; }
      if (b.dataset.m !== undefined) { st.milestoneId = b.dataset.m || null; st.manual.milestone = true; }
      if (b.dataset.timeAdd !== undefined) { st.showTime = true; render(root); root.querySelector('[name=time]').focus(); return; }
      if (b.dataset.learn !== undefined) { st.learned = true; render(root); root.querySelector('[name=learned]').focus(); return; }
      render(root);
      root.querySelector('textarea').focus();
    },
    onSubmit: (fd, form) => save(form)
  });

  const ta = el.querySelector('textarea');
  let t;
  ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => refresh(el), 120); });
  ta.addEventListener('blur', () => refresh(el));
  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); el.querySelector('form').requestSubmit(); }
  });
  el.querySelector('select')?.addEventListener('change', e => { st.projectId = e.target.value || null; st.manual.project = true; render(el); });

  function refresh(root) {
    const p = parse(root.querySelector('textarea').value);
    if (!st.manual.kind && p.kind) st.kind = p.kind;
    if (!st.manual.project) st.projectId = p.projectId || (st.manual.project ? st.projectId : projectId);
    if (!st.manual.when) st.day = addDays(dayKey(), -p.daysAgo);
    st.taskId = p.taskId;
    st.projectBy = p.projectBy;
    render(root);
  }

  function render(root) {
    root.querySelector('[data-kinds]').innerHTML = CAPTURE_KINDS.map(([k, l, ic]) =>
      `<button type="button" class="pill ${st.kind === k ? 'on' : ''}" data-k="${k}" role="radio" aria-checked="${st.kind === k}">${icon(ic)}${l}</button>`).join('');

    const recents = recentProjects();
    const selected = st.projectId ? model.project(st.projectId) : null;
    const list = selected && !recents.some(p => p.id === selected.id) ? [selected, ...recents.slice(0, 3)] : recents;
    const all = model.projects().filter(p => p.status !== 'archived');
    root.querySelector('[data-projects]').innerHTML = all.length
      ? `<button type="button" class="pill ${!st.projectId ? 'on' : ''}" data-p="">Sin objetivo</button>` +
        list.map(p => `<button type="button" class="pill ${st.projectId === p.id ? 'on' : ''}" data-p="${p.id}">${dot(p.color)}${esc(p.name)}</button>`).join('') +
        (all.length > list.length ? (st.showAll
          ? `<select class="pill-select" aria-label="Otro objetivo"><option value="">Otro…</option>${all.filter(p => !list.includes(p)).map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>`
          : '<button type="button" class="pill ghost" data-more-projects>Más…</button>') : '')
      : '<span class="muted small">Sin objetivos todavía: puedes crear uno después.</span>';
    root.querySelector('[data-projects] select')?.addEventListener('change', e => { st.projectId = e.target.value || null; st.manual.project = true; render(root); });

    // Hito: por defecto el siguiente hito abierto del objetivo elegido (la acción cuenta para la constancia y queda vinculada).
    const openMs = st.projectId ? model.milestones().filter(m => m.project_id === st.projectId && !m.done_at && m.status !== 'skipped') : [];
    if (st.milestoneFor !== st.projectId) {
      st.milestoneFor = st.projectId;
      if (!st.manual.milestone || !openMs.some(m => m.id === st.milestoneId)) st.milestoneId = st.projectId ? (model.progress(model.project(st.projectId)).nextMilestone?.id || null) : null;
    }
    const msList = openMs.slice().sort((a, b) => (a.id === st.milestoneId ? -1 : b.id === st.milestoneId ? 1 : (a.sort || 0) - (b.sort || 0))).slice(0, 3);
    root.querySelector('[data-milestones]').innerHTML = st.kind === 'note' || !openMs.length ? '' :
      `<button type="button" class="pill ${!st.milestoneId ? 'on' : ''}" data-m="">Sin hito</button>` +
      msList.map(m => `<button type="button" class="pill ${st.milestoneId === m.id ? 'on' : ''}" data-m="${m.id}">${icon('diamond')}${esc(m.title.slice(0, 40))}</button>`).join('');
    root.querySelector('[data-learned]').hidden = !st.learned || st.kind === 'task';

    const task = st.taskId ? db.get('tasks', st.taskId) : null;
    const extra = [];
    // Fecha de la actividad: a qué día pertenece lo que hiciste, no cuándo lo escribes.
    // De noche, pasada la medianoche, "Ayer" evita que el trabajo salte al día siguiente.
    if (st.kind !== 'task') {
      const hoy = dayKey();
      const ayer = addDays(hoy, -1);
      const otro = st.day !== hoy && st.day !== ayer;
      extra.push(`<button type="button" class="pill ${st.day === hoy ? 'on' : ''}" data-when="${hoy}">${icon('clock')}Hoy</button>`);
      extra.push(`<button type="button" class="pill ${st.day === ayer ? 'on' : ''}" data-when="${ayer}">Ayer</button>`);
      extra.push(`<label class="pill pill-field ${otro ? 'on' : ''}"><span class="sr-only">Otra fecha</span><input type="date" name="day" value="${esc(st.day)}" max="${esc(hoy)}"></label>`);
      // La hora es opcional: solo aparece si se pide, para no llenar la pantalla de campos.
      extra.push(st.showTime || st.time
        ? `<label class="pill pill-field on"><span class="sr-only">Hora</span>${icon('clock')}<input type="time" name="time" value="${esc(st.time)}"></label>`
        : `<button type="button" class="pill" data-time-add>${icon('clock')}Hora</button>`);
    }
    if (task && (st.kind === 'done' || st.kind === 'progress')) {
      extra.push(`<button type="button" class="pill ${st.completeTask ? 'on accent' : ''}" data-task aria-pressed="${st.completeTask}">${icon('check')}Completar “${esc(task.title.slice(0, 40))}”</button>`);
    }
    if (!st.learned && st.kind !== 'task' && st.kind !== 'note') extra.push(`<button type="button" class="pill" data-learn>${icon('plus')}Qué aprendí</button>`);
    root.querySelector('[data-extra]').innerHTML = extra.join('');
    root.querySelector('[data-extra] input[name=day]')?.addEventListener('change', e => {
      if (e.target.value) { st.day = e.target.value; st.manual.when = true; render(root); }
    });
    root.querySelector('[data-extra] input[name=time]')?.addEventListener('change', e => { st.time = e.target.value; st.manual.when = true; });
    const hints = [];
    if (st.kind !== 'task' && st.day !== dayKey()) hints.push(`Se guarda en el ${fmtDayShort(st.day)}`);
    if (st.projectBy && !st.manual.project) hints.push(`Objetivo por ${st.projectBy}`);
    if (!hints.length && !matchMedia('(hover: none)').matches) hints.push('Enter para guardar'); // en táctil no hay tecla Enter a mano
    root.querySelector('[data-hint]').textContent = hints.join(' · ');
    root.querySelector('[data-save]').textContent = st.kind === 'task' ? 'Añadir tarea' : 'Guardar';
  }

  function save(form) {
    const raw = form.elements.text.value;
    const title = cleanTitle(raw, st.projectBy).slice(0, 500);
    if (!title) { form.elements.text.focus(); return; }
    db.kvSet('lastKind', st.kind === 'task' ? db.kvGet('lastKind', 'done') : st.kind);
    closeSheet();

    if (st.kind === 'task') {
      const created = store.create('tasks', { title: title.replace(/^(tengo que|hay que|debo|necesito|pendiente:?|recordar|por hacer:?|todo:?)\s+/i, '').replace(/^./, c => c.toUpperCase()), project_id: st.projectId, milestone_id: st.milestoneId });
      store.track('task_create', { from: 'capture' });
      feedback({ title: 'Tarea añadida', lines: [model.project(st.projectId)?.name ? `En ${model.project(st.projectId).name}` : 'Aparece en tus pendientes'], undo: () => store.remove('tasks', created.id) });
      return;
    }
    const task = st.taskId ? db.get('tasks', st.taskId) : null;
    if (task && st.completeTask && st.kind === 'done' && st.day === dayKey() && !st.time) {
      // Completar la tarea ya registra la actividad (con el texto de la tarea) y muestra el feedback.
      if (norm(title) !== norm(task.title)) store.update('tasks', task.id, { notes: [task.notes, title].filter(Boolean).join('\n') });
      completeTask(task.id);
      return;
    }
    const when = whenOf(st.day, st.time);
    const act = logActivity({ title, kind: st.kind, project_id: st.projectId, milestone_id: st.kind === 'note' ? null : st.milestoneId, task_id: task && st.completeTask ? task.id : null, occurred_at: when.toISOString(), source: 'capture' });
    // Reflexión de una línea ligada a la acción (P0): alimenta el recap y la historia.
    const learned = String(form.elements.learned?.value || '').trim();
    if (learned) store.create('reflections', { type: 'learning', body: learned.slice(0, 4000), prompt: '¿Qué aprendiste?', activity_id: act.id, milestone_id: act.milestone_id, goal_id: st.projectId, occurred_at: act.occurred_at });
    if (task && st.completeTask && st.kind === 'done') store.update('tasks', task.id, { status: 'done', result: 'done', result_at: when.toISOString(), completed_at: when.toISOString() });
  }
}

// Marca de tiempo local del día elegido. Sin hora: mediodía, para que ningún cambio de zona
// horaria mueva la actividad de día. Nunca se usa toISOString() sobre "hoy" para deducir el día.
export function whenOf(day, time = '') {
  const [y, m, d] = String(day || dayKey()).split('-').map(Number);
  const isToday = day === dayKey();
  const now = new Date();
  const [hh, mm] = time ? time.split(':').map(Number) : [isToday ? now.getHours() : 12, isToday ? now.getMinutes() : 0];
  const out = new Date(y, m - 1, d, hh || 0, mm || 0, isToday && !time ? now.getSeconds() : 0, 0);
  return isNaN(out) ? new Date() : out;
}

export const _test = { parse, cleanTitle, whenOf };
