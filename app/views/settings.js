// Ajustes: perfil, apariencia, meta semanal, feedback, avisos, datos y cuenta.
import * as store from './../store.js';
import * as model from './../model.js';
import * as db from './../db.js';
import { syncState } from './../main.js';
import { esc, plural, ago } from './../lib.js';
import { icon } from './../ui.js';

const THEMES = [['system', 'Sistema'], ['light', 'Claro'], ['dark', 'Oscuro']];
const NOTICES = [['all', 'Todos'], ['important', 'Solo importantes'], ['none', 'Ninguno']];

const toggle = (key, label, on, help = '') => `<li class="set-row">
  <div><span>${esc(label)}</span>${help ? `<small class="muted">${esc(help)}</small>` : ''}</div>
  <button class="switch ${on ? 'on' : ''}" data-act="toggle-pref" data-k="${key}" role="switch" aria-checked="${on}" aria-label="${esc(label)}"><span></span></button>
</li>`;

export function render() {
  const p = store.profile();
  const prefs = store.prefs();
  const c = db.counts();
  const s = syncState();
  return `
  <header class="view-head"><div><h1>Ajustes</h1><p class="date">${esc(store.session.guest ? 'Modo prueba, sin cuenta' : store.session.email || '')}</p></div></header>

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Perfil</h2></div>
    <ul class="set">
      <li class="set-row"><div><span>Tu nombre</span><small class="muted">Se usa para el saludo</small></div>
        <button class="btn ghost small" data-act="edit-name">${esc(p.display_name || 'Añadir')}</button></li>
      <li class="set-row"><div><span>Sincronización</span><small class="muted">${esc(s.text)}${s.lastSync ? ` · ${ago(s.lastSync)}` : ''}</small></div>
        ${store.session.guest ? '<button class="btn primary small" data-act="signup-from-guest">Crear cuenta</button>' : `<button class="btn ghost small" data-act="sync-now">Sincronizar</button>`}</li>
    </ul>
  </section>

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Apariencia</h2></div>
    <div class="filters">${THEMES.map(([k, l]) => `<button class="pill ${prefs.theme === k ? 'on' : ''}" data-act="set-theme" data-v="${k}">${l}</button>`).join('')}</div>
  </section>

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Meta semanal</h2></div>
    <p class="muted small">Días por semana en los que quieres registrar algo. Tú eliges el listón; no hay castigo si no llegas.</p>
    <div class="stepper" role="group" aria-label="Meta semanal">
      <button class="icon-btn" data-act="set-goal" data-v="${Math.max(1, prefs.weeklyGoal - 1)}" aria-label="Bajar meta" ${prefs.weeklyGoal <= 1 ? 'disabled' : ''}>${icon('back')}</button>
      <span class="stepper-n num">${prefs.weeklyGoal}<span class="stepper-l">${prefs.weeklyGoal === 1 ? 'día' : 'días'}/semana</span></span>
      <button class="icon-btn" data-act="set-goal" data-v="${Math.min(7, prefs.weeklyGoal + 1)}" aria-label="Subir meta" ${prefs.weeklyGoal >= 7 ? 'disabled' : ''}>${icon('arrow')}</button>
    </div>
  </section>

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Feedback y avisos</h2></div>
    <ul class="set">
      ${toggle('haptics', 'Vibración al completar', prefs.haptics, 'Solo en Android; iOS no lo permite en la web')}
      ${toggle('sound', 'Sonido al completar', prefs.sound)}
      <li class="set-row col"><div><span>Avisos dentro de la app</span><small class="muted">Resumen semanal, hitos cercanos y proyectos parados. Nunca notificaciones para que vuelvas porque sí.</small></div>
        <div class="filters">${NOTICES.map(([k, l]) => `<button class="pill ${prefs.notices === k ? 'on' : ''}" data-act="set-notices" data-v="${k}">${l}</button>`).join('')}</div></li>
    </ul>
  </section>

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Tus datos</h2></div>
    <p class="muted small">${plural(c.activities, 'actividad', 'actividades')} · ${plural(c.projects, 'proyecto', 'proyectos')} · ${plural(c.tasks, 'tarea', 'tareas')} · ${plural(c.milestones, 'hito', 'hitos')}</p>
    <ul class="set">
      <li class="set-row"><div><span>Exportar copia</span><small class="muted">Archivo JSON con todo tu historial</small></div><button class="btn ghost small" data-act="export">${icon('download')}Exportar</button></li>
      <li class="set-row"><div><span>Importar copia</span><small class="muted">Acepta copias de esta versión y de la anterior</small></div><button class="btn ghost small" data-act="import">${icon('upload')}Importar</button></li>
      ${toggle('analytics', 'Métricas internas de uso', prefs.analytics, 'Solo eventos técnicos (app abierta, actividad creada). Nunca el contenido de lo que escribes, y no salen de tu Supabase')}
      <li class="set-row"><div><span>Borrar mis datos</span><small class="muted">Borra todo en este dispositivo y en la nube</small></div><button class="btn ghost danger-text small" data-act="delete-data">Borrar</button></li>
    </ul>
  </section>

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Cuenta</h2></div>
    <ul class="set">
      <li class="set-row"><div><span>Cómo funciona Bitácora</span><small class="muted">Qué cuenta como día activo, cómo se calcula el progreso y la siguiente acción</small></div><button class="btn ghost small" data-act="how">Ver</button></li>
      ${store.session.guest
        ? '<li class="set-row"><div><span>Estás en modo prueba</span><small class="muted">Los datos solo están en este dispositivo</small></div><button class="btn primary small" data-act="signup-from-guest">Crear cuenta</button></li>'
        : `<li class="set-row"><div><span>Cerrar sesión</span><small class="muted">${esc(store.session.email)}</small></div><button class="btn ghost small" data-act="signout">${icon('logout')}Salir</button></li>`}
    </ul>
    <p class="muted small mt">Bitácora v2 · datos en Supabase con acceso restringido a tu cuenta</p>
  </section>`;
}
