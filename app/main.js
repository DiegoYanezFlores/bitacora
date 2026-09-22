// Arranque, router por hash, acciones globales y estado de sesión.
import * as db from './db.js';
import * as store from './store.js';
import * as api from './api.js';
import * as sync from './sync.js';
import * as model from './model.js';
import * as actions from './actions.js';
import { openCapture } from './capture.js';
import { runMigration, migrateV3, exportBackup, importBackup } from './migrate.js';
import { icon, initSheet, openSheet, closeSheet, confirmSheet, feedback, busy, hideToast } from './ui.js';
import { esc, debounce, plural, dayKey, addDays } from './lib.js';
import { addMonths } from './domain/calendar.js';
import * as motion from './motion.js';

import * as today from './views/today.js';
import * as projects from './views/projects.js';
import * as project from './views/project.js';
import * as structure from './structure.js';
import * as tasks from './views/tasks.js';
import * as calendar from './views/calendar.js';
import * as log from './views/log.js';
import * as progress from './views/progress.js';
import * as settings from './views/settings.js';
import { mountAuth } from './views/auth.js';
import { mountOnboarding } from './views/onboarding.js';

// Historia reúne la actividad (antes Progreso) y el registro, con pestañas.
const HISTORY_TABS = [['', 'Actividad'], ['log', 'Registro']];
const historyView = {
  render: ({ tab = '' }) => {
    const html = tab === 'log' ? log.render() : progress.render();
    const tabs = `<div class="filters subtabs" role="tablist" aria-label="Historia">${HISTORY_TABS.map(([k, l]) =>
      `<a class="pill ${tab === k ? 'on' : ''}" role="tab" aria-selected="${tab === k}" href="#/history${k ? '/' + k : ''}">${l}</a>`).join('')}</div>`;
    const cut = html.indexOf('</header>') + '</header>'.length;
    return html.slice(0, cut) + tabs + html.slice(cut);
  }
};

const VIEWS = { home: today, goals: projects, goal: project, next: tasks, calendar, history: historyView, you: settings };
// Rutas anteriores: siguen funcionando (atajos de la PWA, enlaces guardados) y se reescriben a la nueva.
const REDIRECTS = { today: 'home', log: 'history/log', progress: 'history', settings: 'you', tasks: 'next', projects: 'goals', project: 'goal' };
const NAV = [['home', 'Inicio', 'home'], ['goals', 'Objetivos', 'target'], ['calendar', 'Calendario', 'calendar'], ['history', 'Historia', 'chart'], ['you', 'Tú', 'user']];
const $ = s => document.querySelector(s);
const scrolls = new Map();
let route = { name: 'home', params: {} };
let booted = false;
let lastRenderKey = '';

// ---------- tema ----------
export function applyTheme() {
  const t = store.prefs().theme;
  document.documentElement.dataset.theme = t === 'system' ? '' : t;
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name=theme-color]').setAttribute('content', dark ? '#0B1020' : '#F5F7FB');
}

// ---------- estado de sincronización para la vista de ajustes ----------
export function syncState() {
  const map = {
    ok: 'Todo sincronizado', syncing: 'Sincronizando…', pending: 'Cambios pendientes de subir',
    offline: 'Sin conexión: se subirá al volver', error: 'Error al sincronizar', migration: 'Falta aplicar la migración en Supabase',
    guest: 'Modo prueba: solo en este dispositivo', idle: api.ENABLED ? 'Sin sesión' : 'Sin nube configurada'
  };
  return { status: sync.state.status, text: (sync.state.error || map[sync.state.status] || ''), lastSync: sync.state.lastSync, pending: store.pendingCount() };
}

function syncChip() {
  const s = syncState();
  const cls = { ok: 'ok', syncing: 'busy', pending: 'busy', offline: 'warn', error: 'warn', migration: 'warn', guest: 'muted', idle: 'muted' }[s.status] || 'muted';
  const label = s.status === 'ok' ? 'Sincronizado' : s.status === 'syncing' ? 'Sincronizando' : s.status === 'pending' ? `${s.pending} por subir` : s.status === 'guest' ? 'Sin cuenta' : s.status === 'offline' ? 'Sin conexión' : s.status === 'migration' ? 'Falta migración' : s.status === 'error' ? 'Error' : '';
  return label ? `<a class="sync-chip ${cls}" href="#/you" title="${esc(s.text)}">${icon('cloud')}<span>${esc(label)}</span></a>` : '';
}

// ---------- router ----------
function parseHash() {
  let raw = (location.hash || '#/home').replace(/^#\/?/, '');
  const [first] = raw.split(/[/?]/);
  if (REDIRECTS[first]) {
    raw = REDIRECTS[first] + raw.slice(first.length);
    window.history.replaceState(null, '', location.pathname + location.search + '#/' + raw);
  }
  const [path, query] = raw.split('?');
  const [name, param] = path.split('/');
  const q = new URLSearchParams(query || '');
  if (name === 'goal' && param) return { name: 'goal', params: { id: param }, query: q };
  if (name === 'history') return { name, params: { tab: param === 'log' ? 'log' : '' }, query: q };
  if (name === 'calendar') return { name, params: {}, query: q };
  return { name: VIEWS[name] ? name : 'home', params: {}, query: q };
}

let rafId = null;
function scheduleRender() {
  if (rafId) return;
  rafId = requestAnimationFrame(() => { rafId = null; render(); });
}

function render() {
  if (!booted) return;
  const view = VIEWS[route.name];
  const root = $('#view');
  const active = document.activeElement;
  const keepId = active && active.dataset && active.dataset.keepFocus !== undefined ? active.id : null;
  const sel = keepId ? [active.selectionStart, active.selectionEnd] : null;

  // Los valores que cambian en la misma vista (p. ej. el % de una barra) se animan desde el anterior.
  const renderKey = route.name + JSON.stringify(route.params);
  const previous = renderKey === lastRenderKey ? motion.capture(root) : new Map();
  lastRenderKey = renderKey;
  root.dataset.view = route.name === 'history' ? (route.params.tab || 'activity') : route.name;
  root.innerHTML = view.render(route.params);
  motion.play(root, previous);
  $('#chip').innerHTML = syncChip();
  document.querySelectorAll('[data-nav]').forEach(a => {
    const on = a.dataset.nav === route.name || (route.name === 'goal' && a.dataset.nav === 'goals') || (route.name === 'next' && a.dataset.nav === 'home');
    a.classList.toggle('on', on);
    a.setAttribute('aria-current', on ? 'page' : 'false');
  });
  if (keepId) {
    const el = document.getElementById(keepId);
    if (el) { el.focus(); try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { /* input sin selección */ } }
  }
}

function navigate() {
  scrolls.set(route.name + JSON.stringify(route.params), window.scrollY);
  const next = parseHash();
  const same = next.name === route.name && JSON.stringify(next.params) === JSON.stringify(route.params);
  route = next;
  // Acceso directo de la PWA: /#/home?capture=1 abre la captura al entrar.
  if (next.query.get('capture')) {
    window.history.replaceState(null, '', location.pathname + location.search + '#/' + (next.name === 'history' && next.params.tab ? 'history/' + next.params.tab : next.name));
    setTimeout(() => openCapture(), 60);
  }
  if (!same) { project.state.limit = 12; log.state.limit = 60; }
  render();
  const y = same ? window.scrollY : (scrolls.get(route.name + JSON.stringify(route.params)) || 0);
  window.scrollTo(0, same ? window.scrollY : y);
}

// Un paso adelante o atrás en el calendario: un mes en la vista de mes, una semana en la de semana.
function calStep(dir) {
  if (calendar.state.mode === 'week') {
    calendar.state.day = addDays(calendar.state.day, 7 * dir);
    calendar.state.month = calendar.state.day.slice(0, 8) + '01';
  } else {
    calendar.state.month = addMonths(calendar.state.month, dir);
    // El día seleccionado acompaña al mes visible para que el detalle siempre corresponda.
    const same = calendar.state.month.slice(0, 7) === calendar.state.day.slice(0, 7);
    if (!same) calendar.state.day = calendar.state.month.slice(0, 7) === dayKey().slice(0, 7) ? dayKey() : calendar.state.month;
  }
}

// ---------- acciones ----------
const ACTIONS = {
  capture: () => openCapture(),
  'capture-note': () => openCapture({ kind: 'note' }),
  'capture-project': el => openCapture({ projectId: el.dataset.id }),
  'new-task': el => actions.taskForm(null, { project_id: el.dataset.project || (route.name === 'goal' ? route.params.id : '') }),
  // Nueva tarea desde un día del calendario: la fecha ya viene puesta (§8).
  'new-task-day': el => actions.taskForm(null, { due_date: el.dataset.day || '', project_id: calendar.state.project || '' }),
  'cal-day': el => { calendar.state.day = el.dataset.day; calendar.state.month = el.dataset.day.slice(0, 8) + '01'; render(); },
  'cal-mode': el => { calendar.state.mode = el.dataset.v; render(); },
  'cal-prev': () => { calStep(-1); render(); },
  'cal-next': () => { calStep(1); render(); },
  'cal-today': () => { calendar.state.day = dayKey(); calendar.state.month = dayKey().slice(0, 8) + '01'; render(); },
  'edit-task': el => actions.taskForm(db.get('tasks', el.dataset.id)),
  'toggle-task': el => actions.toggleTask(el.dataset.id),
  'complete-next': el => actions.completeTask(el.dataset.id),
  'start-task': el => actions.startTask(el.dataset.id),
  'next-other': () => { today.state.next++; render(); },
  'new-project': () => actions.projectForm(null),
  'edit-project': el => actions.projectForm(db.get('projects', el.dataset.id)),
  'pause-project': el => { store.update('projects', el.dataset.id, { status: 'paused' }); structure.logGoal(el.dataset.id, 'paused'); if (el.dataset.notice) model.dismissNotice(el.dataset.notice); feedback({ title: 'Objetivo pausado', lines: ['Lo que construiste sigue aquí; reactívalo cuando quieras'], tone: 'info' }); },
  'new-milestone': el => structure.milestoneForm(null, el.dataset.project || route.params.id, { stageId: el.dataset.stage || null }),
  'edit-milestone': el => structure.milestoneForm(model.milestone(el.dataset.id)),
  'open-milestone': el => structure.openMilestone(el.dataset.id),
  'toggle-milestone': el => structure.openMilestone(el.dataset.id), // desde la siguiente acción: abre el hito (cerrar pide confirmación)
  'new-stage': el => structure.stageForm(null, el.dataset.project || route.params.id),
  'edit-stage': el => structure.stageForm(model.stage(el.dataset.id)),
  'stage-up': el => structure.moveStage(el.dataset.id, -1),
  'skip-stage': el => structure.toggleSkipStage(el.dataset.id),
  'use-template': el => structure.templatePicker(el.dataset.id),
  'edit-activity': el => actions.activityForm(db.get('activities', el.dataset.id)),
  metric: el => actions.metricForm(db.get('projects', el.dataset.id)),
  'explain-progress': () => openSheet(`<h2 class="sheet-title">Cómo se calcula el avance</h2>
      <div class="prose">
        <p>El avance sale solo de <strong>hitos</strong> y de sus <strong>criterios de “hecho”</strong>. Un hito con 2 de 4 criterios cumplidos va al 50 %; al cerrarlo cuenta completo.</p>
        <p>Cada hito pesa según su tamaño: <strong>S</strong> cuenta 1, <strong>M</strong> 2 y <strong>L</strong> 3. El objetivo es la media ponderada de todos sus hitos; las etapas o hitos marcados como “no aplica” no cuentan.</p>
        <p>Registrar acciones y completar próximos pasos <strong>no sube el porcentaje</strong>: eso es tu constancia. Así, cien tareas pequeñas no fingen un avance que no hubo.</p>
        <p>Si el objetivo tiene una métrica (páginas, dinero, km), se muestra aparte como <strong>indicador</strong>.</p>
      </div>
      <div class="sheet-actions"><button class="btn primary" data-sheet="close">Entendido</button></div>`),
  'more-activity': () => { project.state.limit += 20; render(); },
  'toggle-done-tasks': () => { project.state.showDone = !project.state.showDone; render(); },
  'filter-projects': el => { projects.state.filter = el.dataset.v; render(); },
  'filter-tasks': el => { tasks.state.filter = el.dataset.v; render(); },
  'filter-kind': el => { log.state.kind = el.dataset.v; log.state.limit = 60; render(); },
  'clear-search': () => { log.state.q = ''; render(); },
  'clear-filters': () => { log.state.q = ''; log.state.kind = ''; log.state.project = ''; render(); },
  'more-log': () => { log.state.limit += 60; render(); },
  range: el => { progress.state.range = el.dataset.v; progress.state.offset = 0; render(); },
  period: el => { progress.state.offset = Math.min(0, progress.state.offset + Number(el.dataset.v)); render(); },
  'dismiss-notice': el => { store.track('notice_action', { action: 'dismiss' }); model.dismissNotice(el.dataset.id); },
  'notice-open': el => { store.track('notice_action', { action: 'open' }); model.dismissNotice(el.dataset.id); },
  'set-theme': el => { store.setPrefs({ theme: el.dataset.v }); applyTheme(); },
  'set-goal': el => { store.setPrefs({ weeklyGoal: Number(el.dataset.v) }); feedback({ title: `Meta: ${plural(Number(el.dataset.v), 'día activo', 'días activos')} por semana`, tone: 'info' }); },
  'set-notices': el => store.setPrefs({ notices: el.dataset.v }),
  'toggle-pref': el => store.setPrefs({ [el.dataset.k]: !store.prefs()[el.dataset.k] }),
  'sync-now': el => busy(el, () => sync.syncNow()),
  'sync-retry': el => busy(el, () => sync.retryRejected()),
  'sync-dismiss': () => sync.dismissRejected(),
  'edit-name': () => openSheet(`<form class="form"><h2 class="sheet-title">Tu nombre</h2>
      <label class="field"><span>Nombre</span><input name="n" maxlength="80" value="${esc(store.profile().display_name)}" autofocus></label>
      <div class="sheet-actions"><button class="btn ghost" type="button" data-sheet="close">Cancelar</button><button class="btn primary" type="submit">Guardar</button></div></form>`,
    { onSubmit: fd => { store.setProfile({ display_name: String(fd.get('n') || '').trim().slice(0, 80) }); closeSheet(); } }),
  how: () => openSheet(howItWorks(), { wide: true }),
  export: () => {
    const blob = new Blob([exportBackup()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bitacora-${dayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    feedback({ title: 'Copia exportada', tone: 'info' });
  },
  import: () => $('#import-file').click(),
  'delete-data': async () => {
    const ok = await confirmSheet('¿Borrar todos tus datos?', { confirm: 'Borrar todo', danger: true, detail: 'Se elimina tu historial en este dispositivo y en la nube. No se puede deshacer. Exporta una copia antes si quieres conservarlo.' });
    if (!ok) return;
    try { if (!store.session.guest) await sync.deleteRemoteData(); } catch (e) { feedback({ title: 'No se pudo borrar en la nube', lines: [api.humanError(e)], tone: 'info' }); }
    await db.wipe();
    location.hash = '#/home';
    startAfterAuth({ fresh: true });
    feedback({ title: 'Datos borrados', tone: 'info' });
  },
  signout: async () => {
    const pending = store.pendingCount();
    const ok = await confirmSheet('¿Cerrar sesión?', { confirm: 'Cerrar sesión', detail: pending ? `Tienes ${plural(pending, 'cambio', 'cambios')} sin subir. Se intentarán subir antes de salir.` : 'Tus datos quedan guardados en la nube.' });
    if (!ok) return;
    if (pending && navigator.onLine) { try { await sync.syncNow(); } catch (e) { /* se avisa abajo */ } }
    if (store.pendingCount() && !(await confirmSheet('Quedan cambios sin subir', { confirm: 'Salir igualmente', danger: true, detail: 'Si cierras sesión ahora, esos cambios se perderán en este dispositivo.' }))) return;
    await api.signOut();
    await db.wipe();
    store.session.userId = null; store.session.email = ''; store.session.guest = false;
    showAuth('welcome');
  },
  'signup-from-guest': () => showAuth('signup')
};

function howItWorks() {
  return `<h2 class="sheet-title">Cómo funciona Bitácora</h2>
  <div class="prose">
    <p><strong>Día activo</strong>: un día en el que registraste al menos una actividad. Tu meta semanal la eliges tú en Ajustes y no pasa nada si no llegas.</p>
    <p><strong>Racha</strong>: días activos seguidos. Se muestra como dato, nunca como algo que "pierdes". Si olvidaste registrar ayer, puedes hacerlo con el botón "Ayer" de la captura.</p>
    <p><strong>Avance de un objetivo</strong>: sale solo de hitos y de sus criterios de “hecho”, ponderados por tamaño (S = 1, M = 2, L = 3). Las acciones y los próximos pasos no suben el porcentaje: son tu constancia. Si hay métrica, se muestra aparte como indicador.</p>
    <p><strong>Siguiente acción</strong>: ordena tus tareas abiertas por estado, prioridad, fecha y días sin avance del objetivo, y te muestra la primera con el motivo a la vista.</p>
    <p><strong>Logros y récords</strong>: se calculan de tus datos reales; no hay premios aleatorios ni puntos inventados.</p>
    <p><strong>Tus datos</strong>: se guardan en este dispositivo y, si tienes cuenta, en tu fila de Supabase, a la que solo accede tu usuario. Puedes exportarlos o borrarlos cuando quieras.</p>
  </div>
  <div class="sheet-actions"><button class="btn primary" data-sheet="close">Entendido</button></div>`;
}

// ---------- eventos globales ----------
function wire() {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.closest('#sheet')) return;
    const fn = ACTIONS[el.dataset.act];
    if (!fn) return;
    if (el.tagName !== 'A') e.preventDefault();
    fn(el, e);
  });

  document.addEventListener('input', debounce(e => {
    if (e.target.id === 'log-q') { log.state.q = e.target.value; log.state.limit = 60; render(); }
  }, 160));

  document.addEventListener('change', e => {
    if (e.target.dataset.act === 'filter-project') { log.state.project = e.target.value; render(); }
    if (e.target.dataset.act === 'cal-project') { calendar.state.project = e.target.value; render(); }
  });

  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); openCapture(); return; }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'n' || e.key === 'c') { e.preventDefault(); openCapture(); }
    else if (e.key === '/' && route.name === 'history' && route.params.tab === 'log') { e.preventDefault(); document.getElementById('log-q')?.focus(); }
    // Calendario: las flechas mueven el día seleccionado y el foco se queda en la rejilla.
    else if (route.name === 'calendar' && calendar.moveSelection(e.key)) {
      e.preventDefault();
      render();
      document.querySelector('.cal-day.is-selected, .cal-wday.is-selected')?.focus();
    }
  });

  $('#import-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const totals = await importBackup(await file.text());
      const n = Object.values(totals).reduce((a, b) => a + b, 0);
      feedback({ title: n ? 'Copia importada' : 'Nada nuevo que importar', lines: n ? [`${plural(totals.activities || 0, 'actividad', 'actividades')}, ${plural(totals.projects || 0, 'proyecto', 'proyectos')}`] : ['Ya tenías todo ese contenido'] });
    } catch (err) {
      feedback({ title: 'No se pudo leer el archivo', lines: ['¿Es una copia de Bitácora?'], tone: 'info' });
    }
  });

  // Recuerda qué etapas abrió o cerró el usuario (el evento toggle no burbujea: se escucha en captura).
  document.addEventListener('toggle', e => { if (e.target.matches?.('details[data-stage]')) project.state.open.set(e.target.dataset.stage, e.target.open); }, true);
  window.addEventListener('hashchange', navigate);
  window.addEventListener('bitacora:signedout', () => { store.session.userId = null; showAuth('signin', 'Tu sesión expiró. Vuelve a entrar.'); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  store.subscribe(() => {
    scheduleRender();
    if (!store.session.guest && (store.pendingCount() || db.kvGet('profileDirty'))) sync.schedule();
  });
  sync.setStatusListener(scheduleRender);
}

// ---------- pantallas de acceso ----------
function showAuth(screen = 'welcome', message = '') {
  booted = false;
  $('#app').hidden = true;
  $('#overlay').hidden = false;
  hideToast();
  mountAuth($('#overlay'), {
    start: screen, message,
    onDone: async res => {
      if (res.guest) { db.kvSet('guest', true); await startAfterAuth({ guest: true }); return; }
      await startAfterAuth({ session: res.session, isNew: res.isNew });
    }
  });
}

function showOnboarding() {
  $('#app').hidden = true;
  $('#overlay').hidden = false;
  mountOnboarding($('#overlay'), {
    onDone: ({ logged }) => {
      db.kvSet('seenProgressV3', true); // quien empieza ya conoce el modelo nuevo
      enterApp();
      if (logged) feedback({ title: 'Ya empezaste', lines: ['Tu historial acaba de arrancar'] });
    }
  });
}

function enterApp() {
  $('#overlay').hidden = true;
  $('#overlay').innerHTML = '';
  $('#app').hidden = false;
  booted = true;
  navigate();
}

// Arranque tras identificarse (o como invitado).
async function startAfterAuth({ session = null, guest = false, isNew = false, fresh = false } = {}) {
  if (guest) {
    store.session.guest = true;
    store.session.userId = null;
    db.kvSet('owner', 'guest');
    sync.state.status = 'guest';
  } else {
    const s = session || api.getSession();
    if (!s) { showAuth('welcome'); return; }
    const prev = db.kvGet('owner');
    if (prev && prev !== 'guest' && prev !== s.user.id) {
      // Otra cuenta en este dispositivo: antes de limpiar se guarda una copia por si quedaban cambios sin subir.
      try { localStorage.setItem(`bitacora:backup:${prev}`, exportBackup()); } catch (e) { /* sin espacio */ }
      await db.wipe();
    }
    const adopting = prev === 'guest';
    Object.assign(store.session, { userId: s.user.id, email: s.user.email, guest: false }); // las importaciones de módulo son de solo lectura
    db.kvSet('owner', s.user.id);
    db.kvSet('guest', false);
    if (adopting) store.markAllDirty(); // lo registrado sin cuenta se sube ahora
    if (!store.profile().display_name && s.user.name) store.setProfile({ display_name: s.user.name });
    if (!store.profile().timezone) store.setProfile({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '' });
  }

  store.track('app_open', {});
  if (!guest) sync.startAutoSync();

  let migrated = null;
  try {
    const remote = guest ? null : await sync.fetchV1Doc();
    migrated = await runMigration({ remoteDoc: remote });
  } catch (e) { console.warn('migración v1', e); }
  try { migrateV3(); } catch (e) { console.warn('migración v3', e); }
  model.markAchievementsSeen();

  const empty = db.counts().activities === 0 && db.counts().projects === 0;
  if (!fresh && (isNew || (!store.profile().onboarded_at && empty))) showOnboarding();
  else {
    enterApp();
    if (migrated && Object.values(migrated).some(Boolean)) welcomeBack(migrated);
    else explainNewProgress();
  }
  if (!guest) sync.syncNow();
}

// Una sola vez: explica el cambio de cálculo del avance (plan técnico §8.6, riesgo R2). Nada se borró.
function explainNewProgress() {
  if (db.kvGet('seenProgressV3')) return;
  db.kvSet('seenProgressV3', true);
  if (!model.projects().length) return;
  const sinHitos = model.projects().filter(p => model.progress(p).mode === 'none').length;
  openSheet(`<h2 class="sheet-title">Así se mide ahora tu avance</h2>
    <div class="prose">
      <p>Los proyectos ahora son <strong>objetivos</strong>, con etapas e <strong>hitos</strong> que tienen criterios de “hecho”.</p>
      <p>El porcentaje sale solo de esos hitos y criterios. Las tareas y actividades <strong>ya no suben el %</strong>: cuentan como tu constancia. Así el avance refleja lo que de verdad lograste.</p>
      ${sinHitos ? `<p>${plural(sinHitos, 'objetivo muestra', 'objetivos muestran')} “Sin hitos” hasta que le definas hitos; puedes empezar con una plantilla. <strong>Nada se borró.</strong></p>` : '<p><strong>Nada se borró.</strong></p>'}
    </div>
    <div class="sheet-actions"><button class="btn ghost" data-sheet="close">Entendido</button><a class="btn primary" href="#/goals" data-sheet="close">Ver mis objetivos</a></div>`, { wide: true });
}

function welcomeBack(t) {
  openSheet(`<h2 class="sheet-title">Tu Bitácora anterior está aquí</h2>
    <div class="prose">
      <p>Se importaron <strong>${plural(t.activities, 'actividad', 'actividades')}</strong>, ${plural(t.projects, 'proyecto', 'proyectos')}, ${plural(t.tasks, 'tarea', 'tareas')} y ${plural(t.milestones, 'hito', 'hitos')}.</p>
      <ul>
        <li>La <strong>racha de inglés</strong> es ahora el proyecto “Inglés”, con un registro por día.</li>
        <li>Las <strong>tareas semanales</strong> y los <strong>pendientes de terceros</strong> están en “Plan 12 meses”.</li>
        <li>La <strong>hoja de ruta</strong> pasó a hitos; el <strong>historial semanal</strong>, a notas con su fecha.</li>
        <li>El <strong>capital</strong> es un proyecto con métrica; los contadores quedaron como nota histórica.</li>
      </ul>
      <p class="muted small">Nada se borró: tus datos anteriores siguen guardados en Supabase y puedes exportarlos desde Ajustes.</p>
    </div>
    <div class="sheet-actions"><button class="btn primary" data-sheet="close">Ver mi Bitácora</button></div>`, { wide: true });
}

// ---------- boot ----------
async function boot() {
  applyTheme();
  await db.openDb();
  applyTheme();
  initSheet();
  wire();

  const redirect = api.captureRedirect();
  if (redirect && redirect.type === 'recovery') { showAuth('reset'); return; }
  const message = redirect && redirect.type === 'error' ? redirect.message : '';

  if (api.getSession()) await startAfterAuth({ session: api.getSession() });
  else if (db.kvGet('guest')) await startAfterAuth({ guest: true });
  else if (!api.ENABLED) await startAfterAuth({ guest: true }); // sin Supabase configurado: modo local
  else showAuth('welcome', message);
}

// Barra de navegación (una sola vez).
// Navegación (una sola vez). Móvil: Inicio · Objetivos · + · Calendario · Historia · Tú. Escritorio: rail/barra lateral con Tú al pie.
const navLink = ([k, l, ic], cls = '') => `<a data-nav="${k}" href="#/${k}" class="${cls}" title="${l}" aria-label="${l}">${icon(ic)}<span>${l}</span></a>`;
$('#nav').innerHTML = NAV.slice(0, 2).map(n => navLink(n)).join('') +
  `<button class="tab-add" data-act="capture" aria-label="Registrar actividad">${icon('plus')}</button>` +
  NAV.slice(2).map(n => navLink(n)).join('');
$('#navside').innerHTML = `<div class="brand"><span class="logo-mark" aria-hidden="true">B</span><span class="brand-name">Bitácora</span></div>` +
  NAV.slice(0, -1).map(n => navLink(n)).join('') +
  `<button class="btn primary side-cap" data-act="capture" title="Registrar (N)" aria-label="Registrar actividad">${icon('plus')}<span>Registrar</span> <kbd>N</kbd></button>` +
  navLink(NAV.at(-1), 'nav-you');

boot().catch(err => {
  // Nunca dejar la pantalla en blanco: mostrar el error con una salida.
  console.error('Error al arrancar', err);
  const box = $('#overlay');
  $('#app').hidden = true;
  box.hidden = false;
  box.innerHTML = `<div class="auth-card">
    <h1>No se pudo abrir Bitácora</h1>
    <p class="muted">Tus datos siguen guardados. Recarga la página; si el problema continúa, copia este mensaje y envíalo.</p>
    <pre class="muted small" style="white-space:pre-wrap">${esc(String(err && (err.stack || err.message) || err))}</pre>
    <button class="btn primary block-btn" type="button" id="boot-reload">Recargar</button>
  </div>`;
  document.getElementById('boot-reload').onclick = () => location.reload();
});

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
