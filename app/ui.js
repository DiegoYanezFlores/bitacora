// Componentes de interfaz compartidos: iconos, hojas modales, feedback, filas y barras.
import { esc, fmtTime, ago, fmtDayShort, dayKey, daysBetween, plural } from './lib.js';
import * as store from './store.js';
import * as model from './model.js';

// ---------- iconos (trazo, 24×24) ----------
const P = {
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  list: 'M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01',
  chart: 'M4 19V11M10 19V5M16 19v-6M3 19h18',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5',
  x: 'M6 6l12 12M18 6 6 18',
  cloud: 'M7 18a4 4 0 0 1-.9-7.9A6 6 0 0 1 17.7 9 4.5 4.5 0 0 1 17 18z',
  pause: 'M9 6v12M15 6v12',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  note: 'M5 4h14v11l-5 5H5zM14 20v-5h5',
  diamond: 'M12 3.5 20.5 12 12 20.5 3.5 12z',
  up: 'M12 19V5M6 11l6-6 6 6',
  link: 'M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1',
  calendar: 'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  flame: 'M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  award: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 14 7 21l5-3 5 3-1.5-7',
  wait: 'M6 3h12M6 21h12M7 3v3l5 6-5 6v3M17 3v3l-5 6 5 6v3',
  undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  play: 'M7 5l12 7-12 7z',
  download: 'M12 4v11M7 10l5 5 5-5M4 20h16',
  upload: 'M12 20V9M7 14l5-5 5 5M4 4h16',
  logout: 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  circle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z'
};
export const icon = (name, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[name] || P.circle}"/></svg>`;
export const googleLogo = '<svg class="i" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

// ---------- metadatos ----------
export const KINDS = {
  done: { label: 'Hecho', icon: 'check' },
  progress: { label: 'Avance', icon: 'arrow' },
  note: { label: 'Nota', icon: 'note' },
  win: { label: 'Logro', icon: 'star' }
};
export const TASK_STATUS = { todo: 'Por hacer', doing: 'En curso', waiting: 'En espera', done: 'Hecha' };
export const PROJECT_STATUS = { active: 'Activo', paused: 'Pausado', done: 'Completado', archived: 'Archivado' };
export const COLORS = ['teal', 'blue', 'violet', 'rose', 'orange', 'amber', 'green', 'slate'];

// ---------- piezas ----------
// key: clave estable para animar el cambio desde el valor anterior (ver motion.js).
export function bar(pct, cls = '', key = '') {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  const motion = key ? ` data-motion="${esc(key)}" data-value="${p}"` : '';
  return `<div class="bar ${cls}" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><span style="--p:${p}%"${motion}></span></div>`;
}

export const dot = color => `<span class="pdot c-${esc(color || 'teal')}" aria-hidden="true"></span>`;

export function projectChip(p) {
  if (!p) return '';
  return `<a class="chip" href="#/goal/${p.id}">${dot(p.color)}${esc(p.name)}</a>`;
}

export function empty(iconName, title, text, action = '') {
  return `<div class="empty">${icon(iconName, 'empty-i')}<p class="empty-t">${esc(title)}</p>${text ? `<p class="empty-d">${esc(text)}</p>` : ''}${action}</div>`;
}

export function activityRow(a, { showProject = true, showDate = false } = {}) {
  const k = KINDS[a.kind] || KINDS.done;
  const p = showProject ? model.project(a.project_id) : null;
  const meta = [p ? projectChip(p) : '', a.body ? `<span class="act-sub">${esc(a.body.slice(0, 140))}</span>` : ''].filter(Boolean).join('');
  return `<li class="act k-${a.kind}" data-id="${a.id}">
    <span class="act-time num">${showDate ? fmtDayShort(dayKey(new Date(a.occurred_at))) : fmtTime(a.occurred_at)}</span>
    <span class="act-dot" aria-label="${k.label}">${icon(k.icon)}</span>
    <button class="act-body" data-act="edit-activity" data-id="${a.id}">
      <span class="act-title">${esc(a.title)}</span>
      ${meta ? `<span class="act-meta">${meta}</span>` : ''}
    </button>
  </li>`;
}

export function taskRow(t, { showProject = true } = {}) {
  const p = showProject ? model.project(t.project_id) : null;
  const due = t.due_date ? daysBetween(dayKey(), t.due_date) : null;
  // Una fecha pasada se nombra sin culpa: dice desde cuándo espera, no que se falló.
  const dueTxt = due === null ? '' : due < 0 ? `Desde ${fmtDayShort(t.due_date)}` : due === 0 ? 'Hoy' : due === 1 ? 'Mañana' : fmtDayShort(t.due_date);
  const meta = [
    t.status === 'doing' ? '<span class="tag tag-accent">En curso</span>' : '',
    t.status === 'waiting' ? `<span class="tag">${icon('wait')}En espera${t.waiting_on ? ' · ' + esc(t.waiting_on) : ''}</span>` : '',
    t.priority === 1 && t.status !== 'done' ? '<span class="tag tag-warn">Alta</span>' : '',
    dueTxt && t.status !== 'done' ? `<span class="tag ${due < 0 ? 'tag-warn' : ''}">${icon('calendar')}${dueTxt}</span>` : '',
    t.milestone_id && model.milestone(t.milestone_id) ? `<span class="tag">${icon('diamond')}${esc(model.milestone(t.milestone_id).title)}</span>` : '',
    p ? projectChip(p) : ''
  ].join('');
  return `<li class="task ${t.status === 'done' ? 'is-done' : ''}" data-id="${t.id}">
    <button class="tick ${t.status === 'done' ? 'on' : ''}" data-act="toggle-task" data-id="${t.id}" aria-pressed="${t.status === 'done'}" aria-label="${t.status === 'done' ? 'Marcar como pendiente' : 'Completar tarea'}">${icon('check')}</button>
    <button class="task-body" data-act="edit-task" data-id="${t.id}">
      <span class="task-title">${esc(t.title)}</span>
      ${meta.trim() ? `<span class="task-meta">${meta}</span>` : ''}
    </button>
  </li>`;
}

// Barra segmentada por etapas: cada tramo pesa lo que sus hitos (UX §10) y se llena con su avance.
export function segBar(segments, key = '', cls = '') {
  if (!segments.length) return '';
  const total = segments.reduce((a, s) => a + s.weight, 0) || 1;
  const pct = Math.round(segments.reduce((a, s) => a + s.weight * (s.p || 0), 0) / total * 100);
  return `<div class="segbar ${cls}" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Avance ${pct}%">${segments.map(s => {
    const v = Math.round((s.p || 0) * 100);
    return `<span class="segbar-seg" style="flex:${s.weight}" title="${esc(s.title)}: ${v}%"><i style="--p:${v}%"${key ? ` data-motion="${esc(key)}:${s.id || 'x'}" data-value="${v}"` : ''}></i></span>`;
  }).join('')}</div>`;
}

export function projectCard(p) {
  const info = model.projectInfo(p);
  const g = info.progress;
  const none = g.mode === 'none';
  return `<a class="pcard" href="#/goal/${p.id}">
    <div class="pcard-head">${dot(p.color)}<span class="pcard-name">${esc(p.name)}</span>${p.status !== 'active' ? `<span class="tag">${PROJECT_STATUS[p.status]}</span>` : ''}
      <span class="pcard-pct num">${none ? 'Sin hitos' : g.pct + '%'}</span></div>
    ${none ? (g.metric ? bar(g.metric.pct, 'thin', `metric:${p.id}`) : '') : segBar(g.segments, `project:${p.id}`, 'thin')}
    <div class="pcard-meta">
      ${none ? '' : `<span>${icon('diamond')}<span class="trunc">${g.milestones.done} de ${plural(g.milestones.total, 'hito', 'hitos')}${g.nextMilestone ? ` · siguiente: ${esc(g.nextMilestone.title)}` : ''}</span></span>`}
      ${info.last ? `<span>${icon('clock')}<span class="trunc">${esc(info.last.title)}</span> · ${ago(info.last.occurred_at)}</span>` : '<span class="muted">Sin actividad todavía</span>'}
      ${info.next ? `<span>${icon('arrow')}<span class="trunc">${esc(info.next.title)}</span></span>` : ''}
    </div>
  </a>`;
}

// ---------- feedback (toast con deshacer) ----------
let toastTimer = null;
export function feedback({ title, lines = [], undo = null, tone = 'ok' }) {
  const el = document.getElementById('toast');
  el.className = `toast show t-${tone}`;
  el.innerHTML = `
    <span class="toast-icon">${tone === 'ok' ? '<svg viewBox="0 0 24 24" class="i draw" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : tone === 'milestone' ? icon('diamond') : icon('info')}</span>
    <div class="toast-body"><strong>${esc(title)}</strong>${lines.filter(Boolean).map(l => `<span>${esc(l)}</span>`).join('')}</div>
    ${undo ? '<button class="toast-undo" type="button">Deshacer</button>' : ''}`;
  if (undo) el.querySelector('.toast-undo').onclick = () => { hideToast(); undo(); };
  clearTimeout(toastTimer);
  const hide = () => { toastTimer = setTimeout(hideToast, undo ? 8000 : 3200); }; // 8 s para deshacer (UX §8)
  el.onmouseenter = () => clearTimeout(toastTimer);
  el.onmouseleave = hide;
  hide();
}
export function hideToast() {
  const el = document.getElementById('toast');
  el.classList.remove('show');
}

// ---------- háptica y sonido (opcionales) ----------
export function haptic(pattern = 10) {
  if (!store.prefs().haptics) return;
  try { if (navigator.userActivation?.hasBeenActive && navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* no soportado */ }
}

let audio = null;
export function chime() {
  if (!store.prefs().sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const t = audio.currentTime;
    [[660, 0], [880, 0.07]].forEach(([f, d]) => {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + d);
      g.gain.exponentialRampToValueAtTime(0.05, t + d + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.12);
      o.connect(g).connect(audio.destination);
      o.start(t + d);
      o.stop(t + d + 0.13);
    });
  } catch (e) { /* sin audio */ }
}

export function celebrate() { haptic(10); chime(); }

// ---------- hoja modal ----------
const sheet = () => document.getElementById('sheet');
let current = null;

// panel: en escritorio se abre como panel lateral derecho; en móvil sigue siendo hoja inferior.
export function openSheet(html, { onSubmit, onClick, onClose, onOpen, wide = false, panel = false } = {}) {
  const el = sheet();
  if (el.open) {
    // Se cierra la hoja anterior ya (su onClose incluido): el evento close puede llegar tarde (según el navegador).
    const prev = current;
    current = null;
    el.close();
    if (prev && prev.onClose) prev.onClose();
  }
  el.className = 'sheet' + (wide ? ' wide' : '') + (panel ? ' panel' : '');
  el.innerHTML = `<div class="sheet-inner">${html}</div>`;
  current = { onSubmit, onClick, onClose };
  el.showModal();
  if (onOpen) onOpen(el);
  else { const f = el.querySelector('[autofocus]'); if (f) f.focus(); }
  return el;
}

export function closeSheet() {
  const el = sheet();
  if (el.open) el.close();
}

export function initSheet() {
  const el = sheet();
  el.addEventListener('click', e => {
    if (e.target === el) { closeSheet(); return; } // clic en el fondo
    const b = e.target.closest('[data-sheet]');
    if (b && b.dataset.sheet === 'close') { closeSheet(); return; }
    if (current && current.onClick) current.onClick(e, el);
  });
  el.addEventListener('submit', e => {
    e.preventDefault();
    if (current && current.onSubmit) current.onSubmit(new FormData(e.target), e.target, el);
  });
  el.addEventListener('close', () => {
    if (el.open) return; // cierre tardío de una hoja anterior: ya hay otra abierta, no se toca
    const c = current;
    current = null;
    el.innerHTML = '';
    if (c && c.onClose) c.onClose();
  });
}

export function confirmSheet(message, { confirm = 'Confirmar', danger = false, detail = '' } = {}) {
  return new Promise(resolve => {
    let answer = false;
    openSheet(`
      <h2 class="sheet-title">${esc(message)}</h2>
      ${detail ? `<p class="muted">${esc(detail)}</p>` : ''}
      <div class="sheet-actions">
        <button type="button" class="btn ghost" data-sheet="close">Cancelar</button>
        <button type="button" class="btn ${danger ? 'danger' : 'primary'}" data-ok autofocus>${esc(confirm)}</button>
      </div>`, {
      onClick: (e) => { if (e.target.closest('[data-ok]')) { answer = true; closeSheet(); } },
      onClose: () => resolve(answer)
    });
  });
}

// Mantiene un botón en estado "cargando" mientras dura una promesa.
export async function busy(button, fn) {
  if (!button) return fn();
  const label = button.innerHTML;
  button.disabled = true;
  button.classList.add('is-loading');
  button.setAttribute('aria-busy', 'true');
  try { return await fn(); } finally {
    button.disabled = false;
    button.classList.remove('is-loading');
    button.removeAttribute('aria-busy');
    button.innerHTML = label;
  }
}
