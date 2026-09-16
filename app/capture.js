// Captura rápida: una línea de texto → actividad, tarea, nota o logro.
// La detección es local, visible y siempre editable (nunca decide en silencio).
import * as store from './store.js';
import * as model from './model.js';
import * as db from './db.js';
import { esc, norm, addDays, dayKey } from './lib.js';
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
  const st = { kind: kind || db.kvGet('lastKind', 'done'), projectId, daysAgo: 0, taskId: null, completeTask: true, manual: { kind: Boolean(kind), project: Boolean(projectId), when: false } };
  const el = openSheet(`
    <form class="form capture" autocomplete="off">
      <div class="sheet-head"><h2 class="sheet-title">Registrar</h2><button type="button" class="icon-btn" data-sheet="close" aria-label="Cerrar">✕</button></div>
      <label class="sr-only" for="cap-text">Qué hiciste</label>
      <textarea id="cap-text" name="text" rows="2" maxlength="500" required placeholder="¿Qué hiciste? Ej.: Terminé el informe #IoT" enterkeyhint="done">${esc(text)}</textarea>
      <div class="cap-row" data-kinds role="radiogroup" aria-label="Tipo"></div>
      <div class="cap-row" data-projects aria-label="Proyecto"></div>
      <div class="cap-row" data-extra></div>
      <div class="sheet-actions">
        <span class="muted small cap-hint" data-hint></span>
        <button type="submit" class="btn primary" data-save>Guardar</button>
      </div>
    </form>`, {
    onOpen: root => { const ta = root.querySelector('textarea'); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); refresh(root); },
    onClick: (e, root) => {
      const b = e.target.closest('[data-k],[data-p],[data-when],[data-task],[data-more-projects]');
      if (!b) return;
      if (b.dataset.k) { st.kind = b.dataset.k; st.manual.kind = true; }
      if (b.dataset.p !== undefined) { st.projectId = b.dataset.p || null; st.manual.project = true; }
      if (b.dataset.when !== undefined) { st.daysAgo = Number(b.dataset.when); st.manual.when = true; }
      if (b.dataset.task !== undefined) st.completeTask = !st.completeTask;
      if (b.dataset.moreProjects !== undefined) { st.showAll = true; }
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
    if (!st.manual.when) st.daysAgo = p.daysAgo;
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
      ? `<button type="button" class="pill ${!st.projectId ? 'on' : ''}" data-p="">Sin proyecto</button>` +
        list.map(p => `<button type="button" class="pill ${st.projectId === p.id ? 'on' : ''}" data-p="${p.id}">${dot(p.color)}${esc(p.name)}</button>`).join('') +
        (all.length > list.length ? (st.showAll
          ? `<select class="pill-select" aria-label="Otro proyecto"><option value="">Otro…</option>${all.filter(p => !list.includes(p)).map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>`
          : '<button type="button" class="pill ghost" data-more-projects>Más…</button>') : '')
      : '<span class="muted small">Sin proyectos todavía: puedes crear uno después.</span>';
    root.querySelector('[data-projects] select')?.addEventListener('change', e => { st.projectId = e.target.value || null; st.manual.project = true; render(root); });

    const task = st.taskId ? db.get('tasks', st.taskId) : null;
    const extra = [];
    if (st.kind !== 'task') {
      extra.push(`<button type="button" class="pill ${st.daysAgo === 0 ? 'on' : ''}" data-when="0">${icon('clock')}Ahora</button>`);
      extra.push(`<button type="button" class="pill ${st.daysAgo === 1 ? 'on' : ''}" data-when="1">Ayer</button>`);
    }
    if (task && (st.kind === 'done' || st.kind === 'progress')) {
      extra.push(`<button type="button" class="pill ${st.completeTask ? 'on accent' : ''}" data-task aria-pressed="${st.completeTask}">${icon('check')}Completar “${esc(task.title.slice(0, 40))}”</button>`);
    }
    root.querySelector('[data-extra]').innerHTML = extra.join('');
    const hints = [];
    if (st.projectBy && !st.manual.project) hints.push(`Proyecto por ${st.projectBy}`);
    if (!hints.length) hints.push('Enter para guardar');
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
      const created = store.create('tasks', { title: title.replace(/^(tengo que|hay que|debo|necesito|pendiente:?|recordar|por hacer:?|todo:?)\s+/i, '').replace(/^./, c => c.toUpperCase()), project_id: st.projectId });
      store.track('task_create', { from: 'capture' });
      feedback({ title: 'Tarea añadida', lines: [model.project(st.projectId)?.name ? `En ${model.project(st.projectId).name}` : 'Aparece en tus pendientes'], undo: () => store.remove('tasks', created.id) });
      return;
    }
    const task = st.taskId ? db.get('tasks', st.taskId) : null;
    if (task && st.completeTask && st.kind === 'done' && st.daysAgo === 0) {
      // Completar la tarea ya registra la actividad (con el texto de la tarea) y muestra el feedback.
      if (norm(title) !== norm(task.title)) store.update('tasks', task.id, { notes: [task.notes, title].filter(Boolean).join('\n') });
      completeTask(task.id);
      return;
    }
    const when = new Date();
    if (st.daysAgo) { when.setDate(when.getDate() - st.daysAgo); if (when.getHours() < 9 || when.getHours() > 21) when.setHours(18, 0, 0, 0); }
    logActivity({ title, kind: st.kind, project_id: st.projectId, task_id: task && st.completeTask ? task.id : null, occurred_at: when.toISOString(), source: 'capture' });
    if (task && st.completeTask && st.kind === 'done') store.update('tasks', task.id, { status: 'done', completed_at: when.toISOString() });
  }
}

export const _test = { parse, cleanTitle };
