// Ajustes: perfil, apariencia, meta semanal, feedback, avisos, datos y cuenta.
import * as store from './../store.js';
import * as model from './../model.js';
import * as db from './../db.js';
import * as sync from './../sync.js';
import { syncState } from './../main.js';
import { esc, plural, ago } from './../lib.js';
import { icon } from './../ui.js';
import { PALETTES, PALETTE_FAMILIES } from './../domain/prefs.js';
import { LIBRARY, CATEGORIES, srcOf } from './../domain/library.js';
import { MAX_FILES } from './../domain/media.js';

// Apariencia: paleta, fondo y fotos propias. Todo tiene un valor por defecto válido, así que
// esta pantalla es opcional: la app ya se ve bien sin tocar nada.
function appearanceBlock(prefs) {
  const bg = prefs.background;
  const paletas = PALETTE_FAMILIES.map(([fam, nombre]) => {
    const lista = Object.entries(PALETTES).filter(([, [, f]]) => f === fam);
    if (!lista.length) return '';
    return `<div class="pal-group"><h3 class="muted small">${esc(nombre)}</h3>
      <div class="pal-grid">${lista.map(([key, [label]]) => `
        <button class="pal ${prefs.palette === key ? 'on' : ''}" data-act="set-palette" data-v="${key}" aria-pressed="${prefs.palette === key}" title="${esc(label)}">
          <span class="pal-swatch" data-pal="${key}"><i></i><i></i><i></i></span>
          <span class="pal-name">${esc(label)}</span>
        </button>`).join('')}</div></div>`;
  }).join('');

  const fotos = prefs.media.map(m => `<div class="bg-card ${bg.kind === 'photo' && bg.id === m.id ? 'on' : ''}">
      <button class="bg-pick" data-act="set-bg" data-kind="photo" data-id="${esc(m.id)}" aria-pressed="${bg.kind === 'photo' && bg.id === m.id}">
        <img src="" alt="" data-photo="${esc(m.id)}" loading="lazy"><span class="bg-name">${esc(m.name || 'Foto')}</span>
      </button>
      <button class="icon-btn small bg-del" data-act="remove-photo" data-id="${esc(m.id)}" aria-label="Borrar ${esc(m.name || 'foto')}">${icon('trash')}</button>
    </div>`).join('');

  return `
  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Apariencia</h2>
      <button class="link" data-act="reset-appearance">Restaurar</button></div>
    <p class="muted small">Tema del sistema, claro u oscuro:</p>
    <div class="filters">${THEMES.map(([k, l]) => `<button class="pill ${prefs.theme === k ? 'on' : ''}" data-act="set-theme" data-v="${k}">${l}</button>`).join('')}</div>

    <h3 class="set-sub">Paleta de colores</h3>
    ${paletas}

    <h3 class="set-sub">Fondo</h3>
    <div class="filters">
      <button class="pill ${bg.kind === 'none' ? 'on' : ''}" data-act="set-bg" data-kind="none">Sin fondo</button>
      <button class="pill ${bg.kind === 'library' ? 'on' : ''}" data-act="set-bg" data-kind="library" data-id="${esc(bg.kind === 'library' ? bg.id : LIBRARY[0].id)}">Biblioteca</button>
      <button class="pill ${bg.kind === 'photo' ? 'on' : ''}" data-act="set-bg" data-kind="photo" data-id="${esc(bg.kind === 'photo' ? bg.id : (prefs.media[0] ? prefs.media[0].id : ''))}" ${prefs.media.length ? '' : 'disabled'}>Mis fotos</button>
    </div>

    ${bg.kind === 'library' ? CATEGORIES.map(([cat, nombre]) => {
      const lista = LIBRARY.filter(b => b.category === cat);
      return lista.length ? `<div class="pal-group"><h3 class="muted small">${esc(nombre)}</h3>
        <div class="bg-grid">${lista.map(b => `<div class="bg-card ${bg.id === b.id ? 'on' : ''}">
          <button class="bg-pick" data-act="set-bg" data-kind="library" data-id="${esc(b.id)}" aria-pressed="${bg.id === b.id}">
            <img src="${esc(srcOf(b.id))}" alt="${esc(b.name)}" loading="lazy"><span class="bg-name">${esc(b.name)}</span>
          </button></div>`).join('')}</div></div>` : '';
    }).join('') : ''}

    ${bg.kind === 'photo' ? `<div class="bg-grid">${fotos}</div>
      <p class="muted small">${prefs.media.length}/${MAX_FILES} fotos · JPG, PNG o WebP hasta 8 MB. Se guardan en tu cuenta y solo las ves tú.</p>` : ''}
    ${bg.kind === 'photo' || prefs.media.length ? `<button class="btn ghost small" data-act="add-photo" ${prefs.media.length >= MAX_FILES ? 'disabled' : ''}>${icon('plus')}Añadir fotos</button>` : `<button class="link" data-act="add-photo">${icon('plus')}Subir una foto mía</button>`}

    ${bg.kind !== 'none' ? `
      <h3 class="set-sub">Ajustes del fondo</h3>
      <p class="muted small">Encuadre</p>
      <div class="filters">${FIT.map(([k, l]) => `<button class="pill ${bg.fit === k ? 'on' : ''}" data-act="set-bg-opt" data-k="fit" data-v="${k}">${l}</button>`).join('')}</div>
      <p class="muted small">Suavizar el fondo, para que el texto se lea bien</p>
      <div class="filters">${DIM.map(v => `<button class="pill ${bg.dim === v ? 'on' : ''}" data-act="set-bg-opt" data-k="dim" data-v="${v}">${v}%</button>`).join('')}</div>
      <p class="muted small">Desenfoque</p>
      <div class="filters">${BLUR.map(v => `<button class="pill ${bg.blur === v ? 'on' : ''}" data-act="set-bg-opt" data-k="blur" data-v="${v}">${v ? v + ' px' : 'Ninguno'}</button>`).join('')}</div>
      <ul class="set"><li class="set-row">
        <div><span>Cambiar de imagen cada día</span><small class="muted">Usa una distinta cada día, dentro de lo elegido</small></div>
        <button class="switch ${bg.rotate ? 'on' : ''}" data-act="set-bg-opt" data-k="rotate" role="switch" aria-checked="${bg.rotate}" aria-label="Cambiar de imagen cada día"><span></span></button>
      </li></ul>` : ''}
  </section>`;
}

const THEMES = [['system', 'Sistema'], ['light', 'Claro'], ['dark', 'Oscuro']];
const FIT = [['cover', 'Llenar'], ['contain', 'Entera'], ['top', 'Arriba'], ['bottom', 'Abajo']];
const DIM = [0, 25, 40, 55, 70, 85];
const BLUR = [0, 3, 6, 10];
const NOTICES = [['all', 'Todos'], ['important', 'Solo importantes'], ['none', 'Ninguno']];

const toggle = (key, label, on, help = '') => `<li class="set-row">
  <div><span>${esc(label)}</span>${help ? `<small class="muted">${esc(help)}</small>` : ''}</div>
  <button class="switch ${on ? 'on' : ''}" data-act="toggle-pref" data-k="${key}" role="switch" aria-checked="${on}" aria-label="${esc(label)}"><span></span></button>
</li>`;

// Panel de diagnóstico: todo lo que hace falta para entender por qué algo no sube.
// Nunca muestra tokens, claves ni contraseñas: solo estados, cantidades y el último error.
const SCHEMA_LABEL = { true: 'aplicada', false: 'falta aplicarla', null: 'sin comprobar' };
function diagnosticsRow() {
  if (store.session.guest) return `<li class="set-row col"><div><span>Estás en modo prueba</span>
    <small class="muted">Nada se sincroniza: los datos viven solo en este dispositivo. Crea una cuenta para tenerlos en la nube.</small></div></li>`;
  const d = sync.diagnostics();
  const filas = [
    ['Conexión', d.online ? 'con internet' : 'sin internet'],
    ['Nube', d.configurado ? 'configurada' : 'no configurada en esta copia'],
    ['Sesión', `${d.sesion}${d.email ? ` · ${d.email}` : ''}`],
    ['Última sincronización correcta', d.lastSync ? `${ago(d.lastSync)}` : 'todavía ninguna'],
    ['Cambios por subir', d.pending ? `${d.pending}${Object.keys(d.pendingByTable).length ? ` (${Object.entries(d.pendingByTable).map(([t, n]) => `${t}: ${n}`).join(', ')})` : ''}` : 'ninguno'],
    ['Esperando una migración', d.waitingForSchema ? `${d.waitingForSchema}` : 'no'],
    ['Rechazados por el servidor', d.rejected ? `${d.rejected}` : 'ninguno'],
    ['Migración 003 (objetivos y evidencia)', SCHEMA_LABEL[String(d.schema.v3)]],
    ['Migración 005 (resultados de tareas)', SCHEMA_LABEL[String(d.schema.v5)]],
    ['Migración 006 (recurrencias y diario)', SCHEMA_LABEL[String(d.schema.v6)]],
    ['Sincronizando ahora', d.running ? 'sí' : 'no'],
    ['Último error', d.error ? `${d.error}${d.errorAt ? ` · ${ago(d.errorAt)}` : ''}` : 'ninguno']
  ];
  return `<li class="set-row col"><details class="diag">
    <summary><span>Estado de la sincronización</span><small class="muted">${esc(d.error || (d.pending ? `${plural(d.pending, 'cambio', 'cambios')} por subir` : 'todo al día'))}</small></summary>
    <dl class="diag-list">${filas.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(String(v))}</dd></div>`).join('')}</dl>
    ${d.errorDetail ? `<p class="diag-detail"><strong>Detalle técnico:</strong> ${esc(d.errorDetail)}</p>` : ''}
    <div class="filters"><button class="btn ghost small" data-act="sync-now">Reintentar ahora</button>
      <button class="btn ghost small" data-act="copy-diag">Copiar para soporte</button></div>
  </details></li>`;
}

// Solo aparece si el servidor rechazó algún cambio: nunca se pierde en silencio.
function rejectedRow() {
  const bad = sync.rejected();
  if (!bad.length || store.session.guest) return '';
  return `<li class="set-row col"><div><span>${plural(bad.length, 'cambio no se pudo subir', 'cambios no se pudieron subir')}</span>
    <small class="muted">Siguen guardados en este dispositivo. Motivo: ${esc(bad[bad.length - 1].error || 'rechazado por el servidor')}</small></div>
    <div class="filters"><button class="btn ghost small" data-act="sync-retry">Reintentar</button><button class="btn ghost small" data-act="sync-dismiss">Ocultar aviso</button></div></li>`;
}

export function render() {
  const p = store.profile();
  const prefs = store.prefs();
  const c = db.counts();
  const s = syncState();
  return `
  <header class="view-head"><div><h1>Tú</h1><p class="date">${esc(store.session.guest ? 'Modo prueba, sin cuenta' : store.session.email || '')}</p></div></header>

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Perfil</h2></div>
    <ul class="set">
      <li class="set-row"><div><span>Tu nombre</span><small class="muted">Se usa para el saludo</small></div>
        <button class="btn ghost small" data-act="edit-name">${esc(p.display_name || 'Añadir')}</button></li>
      <li class="set-row"><div><span>Sincronización</span><small class="muted">${esc(s.text)}${s.lastSync ? ` · ${ago(s.lastSync)}` : ''}</small></div>
        ${store.session.guest ? '<button class="btn primary small" data-act="signup-from-guest">Crear cuenta</button>' : `<button class="btn ghost small" data-act="sync-now">Sincronizar</button>`}</li>
      ${diagnosticsRow()}
      ${rejectedRow()}
    </ul>
  </section>

  ${appearanceBlock(prefs)}

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
      <li class="set-row col"><div><span>Avisos dentro de la app</span><small class="muted">Resumen semanal, hitos cercanos y objetivos parados. Nunca notificaciones para que vuelvas porque sí.</small></div>
        <div class="filters">${NOTICES.map(([k, l]) => `<button class="pill ${prefs.notices === k ? 'on' : ''}" data-act="set-notices" data-v="${k}">${l}</button>`).join('')}</div></li>
    </ul>
  </section>

  <section class="block">
    <div class="block-head"><h2 class="eyebrow">Tus datos</h2></div>
    <p class="muted small">${plural(c.activities, 'actividad', 'actividades')} · ${plural(c.projects, 'objetivo', 'objetivos')} · ${plural(c.tasks, 'tarea', 'tareas')} · ${plural(c.milestones, 'hito', 'hitos')}</p>
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
