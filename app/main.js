// Arranque, router por hash, acciones globales y estado de sesión.
import * as db from './db.js';
import * as store from './store.js';
import * as api from './api.js';
import * as sync from './sync.js';
import * as model from './model.js';
import * as actions from './actions.js';
import { openCapture } from './capture.js';
import { runMigration, exportBackup, importBackup } from './migrate.js';
import { icon, initSheet, openSheet, closeSheet, confirmSheet, feedback, busy, hideToast } from './ui.js';
import { esc, debounce, plural, dayKey } from './lib.js';

import * as today from './views/today.js';
import * as projects from './views/projects.js';
import * as project from './views/project.js';
import * as tasks from './views/tasks.js';
import * as log from './views/log.js';
import * as progress from './views/progress.js';
import * as settings from './views/settings.js';
import { mountAuth } from './views/auth.js';
import { mountOnboarding } from './views/onboarding.js';

const VIEWS = { today, projects, project, tasks, log, progress, settings };
const NAV = [['today', 'Hoy', 'home'], ['projects', 'Proyectos', 'folder'], ['log', 'Registro', 'list'], ['progress', 'Progreso', 'chart']];
const $ = s => document.querySelector(s);
const scrolls = new Map();
let route = { name: 'today', params: {} };
let booted = false;

// ---------- tema ----------
export function applyTheme() {
  const t = store.prefs().theme;
  document.documentElement.dataset.theme = t === 'system' ? '' : t;
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name=theme-color]').setAttribute('content', dark ? '#0D1210' : '#F6F7F5');
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
  return label ? `<a class="sync-chip ${cls}" href="#/settings" title="${esc(s.text)}">${icon('cloud')}<span>${esc(label)}</span></a>` : '';
}

// ---------- router ----------
function parseHash() {
  const h = (location.hash || '#/today').replace(/^#\/?/, '');
  const [name, param] = h.split('/');
  if (name === 'project' && param) return { name: 'project', params: { id: param } };
  return { name: VIEWS[name] ? name : 'today', params: {} };
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

  root.innerHTML = view.render(route.params);
  $('#chip').innerHTML = syncChip();
  document.querySelectorAll('[data-nav]').forEach(a => {
    const on = a.dataset.nav === route.name || (route.name === 'project' && a.dataset.nav === 'projects') || (route.name === 'tasks' && a.dataset.nav === 'today');
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
  if (!same) { project.state.limit = 12; log.state.limit = 60; }
  render();
  const y = same ? window.scrollY : (scrolls.get(route.name + JSON.stringify(route.params)) || 0);
  window.scrollTo(0, same ? window.scrollY : y);
}

// ---------- acciones ----------
const ACTIONS = {
  capture: () => openCapture(),
  'capture-note': () => openCapture({ kind: 'note' }),
  'capture-project': el => openCapture({ projectId: el.dataset.id }),
  'new-task': el => actions.taskForm(null, { project_id: el.dataset.project || (route.name === 'project' ? route.params.id : '') }),
  'edit-task': el => actions.taskForm(db.get('tasks', el.dataset.id)),
  'toggle-task': el => actions.toggleTask(el.dataset.id),
  'complete-next': el => actions.completeTask(el.dataset.id),
  'start-task': el => actions.startTask(el.dataset.id),
  'next-other': () => { today.state.next++; render(); },
  'new-project': () => actions.projectForm(null),
  'edit-project': el => actions.projectForm(db.get('projects', el.dataset.id)),
  'pause-project': el => { store.update('projects', el.dataset.id, { status: 'paused' }); if (el.dataset.notice) model.dismissNotice(el.dataset.notice); feedback({ title: 'Proyecto pausado', lines: ['Puedes reactivarlo cuando quieras'], tone: 'info' }); },
  'new-milestone': el => actions.milestoneForm(null, el.dataset.project || route.params.id),
  'edit-milestone': el => actions.milestoneForm(db.get('milestones', el.dataset.id)),
  'toggle-milestone': el => actions.toggleMilestone(el.dataset.id),
  'edit-activity': el => actions.activityForm(db.get('activities', el.dataset.id)),
  metric: el => actions.metricForm(db.get('projects', el.dataset.id)),
  'explain-progress': el => openSheet(`<h2 class="sheet-title">Cómo se calcula el progreso</h2>
      <p>${el.dataset.mode === 'metric' ? 'Este proyecto usa una <strong>métrica</strong>: el avance va del valor inicial al valor meta.' : el.dataset.mode === 'auto' ? 'Se calcula con lo que ya tienes: cada <strong>hito</strong> pesa el doble que una <strong>tarea</strong>. No hay estimaciones ocultas.' : 'Aún no hay tareas, hitos ni métrica: añade alguno y el progreso se calculará solo.'}</p>
      <p class="muted small">Puedes cambiar el método editando el proyecto.</p>
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
    location.hash = '#/today';
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
    <p><strong>Progreso de un proyecto</strong>: si defines una métrica, va del valor inicial al objetivo. Si no, cuenta hitos (peso doble) y tareas completadas. Sin estimaciones inventadas.</p>
    <p><strong>Siguiente acción</strong>: ordena tus tareas abiertas por estado, prioridad, fecha y días sin avance del proyecto, y te muestra la primera con el motivo a la vista.</p>
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
  });

  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); openCapture(); return; }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'n' || e.key === 'c') { e.preventDefault(); openCapture(); }
    else if (e.key === '/' && route.name === 'log') { e.preventDefault(); document.getElementById('log-q')?.focus(); }
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

  window.addEventListener('hashchange', navigate);
  window.addEventListener('bitacora:signedout', () => { store.session.userId = null; showAuth('signin', 'Tu sesión expiró. Vuelve a entrar.'); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  store.subscribe(() => { scheduleRender(); if (!store.session.guest) sync.schedule(); });
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
    if (prev && prev !== 'guest' && prev !== s.user.id) await db.wipe(); // otra cuenta en este dispositivo
    const adopting = prev === 'guest';
    store.session = { userId: s.user.id, email: s.user.email, guest: false };
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
  model.markAchievementsSeen();

  const empty = db.counts().activities === 0 && db.counts().projects === 0;
  if (!fresh && (isNew || (!store.profile().onboarded_at && empty))) showOnboarding();
  else {
    enterApp();
    if (migrated && Object.values(migrated).some(Boolean)) welcomeBack(migrated);
  }
  if (!guest) sync.syncNow();
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
$('#nav').innerHTML = NAV.map(([k, l, ic]) => `<a data-nav="${k}" href="#/${k}">${icon(ic)}<span>${l}</span></a>`).join('');
$('#navside').innerHTML = `<div class="brand">${icon('flame')}<span>Bitácora</span></div>` +
  NAV.map(([k, l, ic]) => `<a data-nav="${k}" href="#/${k}">${icon(ic)}<span>${l}</span></a>`).join('') +
  `<button class="btn primary side-cap" data-act="capture">${icon('plus')}Registrar <kbd>N</kbd></button>`;

boot();

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
