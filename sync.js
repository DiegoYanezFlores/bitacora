// Sincronización de Bitácora con Supabase, sin dependencias (Auth + REST vía fetch).
// localStorage sigue siendo la copia local (funciona offline). Cada cambio se sube a
// Supabase ~1 s después; al abrir o volver a la app se bajan cambios de otros dispositivos.
// Si ambos lados cambiaron, se fusionan por id (las marcas de borrado evitan resucitar datos).
(function () {
  'use strict';

  const cfg = window.BITACORA_CONFIG || {};
  const BASE = String(cfg.supabaseUrl || '').trim().replace(/\/+$/, '');
  const KEY = String(cfg.supabaseAnonKey || '').trim();
  const ENABLED = Boolean(BASE && KEY);
  const SESSION_KEY = 'bitacora:session';
  const META_KEY = 'bitacora:sync';
  const TABLE = 'bitacora_state';
  const PUSH_DELAY_MS = 1000;
  const PULL_EVERY_MS = 60000;
  const TOMBSTONE_TTL_MS = 180 * 86400000;

  const App = window.Bitacora;
  const mount = document.getElementById('sync');
  if (!App || !mount) return;

  // ---------- estilos del indicador ----------
  const style = document.createElement('style');
  style.textContent = `
    .sync-pill { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--line); background: transparent;
      border-radius: 99px; padding: 6px 10px; font-size: 12px; color: var(--ink-2); white-space: nowrap; }
    .sync-pill i { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); }
    .sync-synced i { background: #3F7A5A; }
    .sync-syncing i, .sync-pending i { background: #B8892B; }
    .sync-error i { background: var(--danger); }
    .sync-msg { font-size: 13px; margin: 0 0 12px; color: var(--ink-2); }
    .sync-msg.err { color: var(--danger); }
    .sync-kv { font-size: 14px; margin: 0 0 6px; }
    .sync-kv span { color: var(--ink-2); }`;
  document.head.appendChild(style);

  // ---------- almacenamiento local ----------
  const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const write = (k, v) => {
    try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin espacio */ }
  };
  const freshMeta = () => ({ dirty: false, remoteUpdatedAt: null, lastSyncAt: null });
  let meta = read(META_KEY) || freshMeta();
  const saveMeta = () => write(META_KEY, meta);
  const getSession = () => read(SESSION_KEY);
  const setSession = s => write(SESSION_KEY, s);

  // ---------- HTTP ----------
  async function api(path, { method = 'GET', body, token, headers = {} } = {}) {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        apikey: KEY,
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...headers
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    if (!res.ok) {
      const msg = data && (data.msg || data.message || data.error_description || data.error);
      const err = new Error(msg || 'HTTP ' + res.status);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function humanError(e) {
    const m = String((e && e.message) || '').toLowerCase();
    if (e instanceof TypeError) return 'No hay conexión con Supabase.';
    if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.';
    if (m.includes('not confirmed')) return 'Confirma tu correo antes de entrar (revisa tu bandeja).';
    if (m.includes('already registered') || m.includes('already exists')) return 'Ese correo ya tiene cuenta. Usa "Entrar".';
    if (m.includes('password')) return 'La contraseña no es válida (mínimo 6 caracteres).';
    if (m.includes('rate limit')) return 'Demasiados intentos. Espera un momento.';
    if (m.includes('does not exist') || m.includes('schema cache')) return 'Falta crear la tabla: ejecuta supabase/schema.sql en Supabase.';
    if (m.includes('invalid api key') || e.status === 401) return 'La clave de Supabase en config.js no es válida.';
    return (e && e.message) || 'Error desconocido';
  }

  // ---------- sesión ----------
  function jwtClaims(token) {
    try {
      const b = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(b + '='.repeat((4 - (b.length % 4)) % 4)));
    } catch (e) { return {}; }
  }

  function fromToken(r) {
    const claims = jwtClaims(r.access_token);
    const user = r.user || {};
    return {
      access_token: r.access_token,
      refresh_token: r.refresh_token,
      expires_at: Number(r.expires_at) || claims.exp || Math.floor(Date.now() / 1000) + (Number(r.expires_in) || 3600),
      user: { id: user.id || claims.sub, email: user.email || claims.email || '' }
    };
  }

  function startSession(tokenResponse) {
    setSession(fromToken(tokenResponse));
    // Si ya había datos en este dispositivo, se fusionan con los de la nube.
    meta = { ...freshMeta(), dirty: App.getState().goals.length > 0 };
    saveMeta();
    renderPill();
    sync();
  }

  async function accessToken() {
    const s = getSession();
    if (!s) return null;
    if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
    try {
      const r = await api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: s.refresh_token } });
      const next = fromToken(r);
      setSession(next);
      return next.access_token;
    } catch (e) {
      if (e.status >= 400 && e.status < 500) {
        setSession(null);
        App.toast('Tu sesión expiró. Vuelve a entrar para sincronizar.');
        renderPill();
        return null;
      }
      throw e; // sin red: se reintenta después
    }
  }

  const signIn = (email, password) =>
    api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }).then(startSession);

  async function signUp(email, password) {
    const r = await api('/auth/v1/signup?redirect_to=' + encodeURIComponent(location.origin + '/'), {
      method: 'POST', body: { email, password }
    });
    if (r && r.access_token) { startSession(r); return true; }
    return false; // requiere confirmar el correo
  }

  function signOut() {
    const s = getSession();
    setSession(null);
    meta = freshMeta();
    saveMeta();
    renderPill();
    App.toast('Sesión cerrada. Tus datos siguen en este dispositivo.');
    if (s) api('/auth/v1/logout', { method: 'POST', token: s.access_token }).catch(() => {});
  }

  // Al confirmar el correo, Supabase redirige con la sesión en el hash de la URL.
  function captureRedirect() {
    if (!location.hash) return;
    const p = new URLSearchParams(location.hash.slice(1));
    if (p.get('access_token') && p.get('refresh_token')) {
      startSession({ access_token: p.get('access_token'), refresh_token: p.get('refresh_token'), expires_at: p.get('expires_at') });
      App.toast('Correo confirmado. Sincronizando…');
    } else if (p.get('error_description')) {
      App.toast(p.get('error_description').replace(/\+/g, ' '));
    } else {
      return;
    }
    history.replaceState(null, '', location.pathname + location.search);
  }

  // ---------- fusión ----------
  function mergeEntries(kind, list, deleted) {
    const byId = new Map();
    for (const e of list) if (!deleted[e.id]) byId.set(e.id, e);
    let out = [...byId.values()];
    if (kind === 'habit') {
      const byDay = new Map();
      for (const e of out) if (!byDay.has(e.date)) byDay.set(e.date, e);
      out = [...byDay.values()];
    }
    return out;
  }

  function merge(local, remote) {
    const lt = Date.parse(local.updatedAt) || 0;
    const rt = Date.parse(remote.updatedAt) || 0;
    const [newer, older] = lt >= rt ? [local, remote] : [remote, local];
    const deleted = { ...(older.deleted || {}), ...(newer.deleted || {}) };
    const goals = new Map();
    for (const g of older.goals || []) goals.set(g.id, g);
    for (const g of newer.goals || []) {
      const o = goals.get(g.id);
      // Campos del objetivo: gana la versión más reciente; registros: unión de ambos.
      goals.set(g.id, o ? { ...g, entries: (o.entries || []).concat(g.entries || []) } : g);
    }
    return {
      ...newer,
      deleted,
      goals: [...goals.values()]
        .filter(g => !deleted[g.id])
        .map(g => ({ ...g, entries: mergeEntries(g.kind, g.entries || [], deleted) })),
      updatedAt: new Date().toISOString()
    };
  }

  function pruneTombstones(deleted) {
    const cutoff = Date.now() - TOMBSTONE_TTL_MS;
    const out = {};
    for (const [id, at] of Object.entries(deleted || {})) if ((Date.parse(at) || 0) > cutoff) out[id] = at;
    return out;
  }

  // ---------- sincronización ----------
  let status = 'idle';
  let lastError = '';
  let inFlight = null;
  let rerun = false;
  let pushTimer = null;
  let authRetried = false;

  function setStatus(s, err) {
    status = s;
    lastError = err || '';
    renderPill();
    if (dlg.open && !dlg.querySelector('form')) renderDialog();
  }

  function sync() {
    if (inFlight) { rerun = true; return inFlight; }
    inFlight = run().finally(() => {
      inFlight = null;
      if (rerun) { rerun = false; sync(); }
    });
    return inFlight;
  }

  async function push(doc, token, userId) {
    const sentAt = doc.updatedAt || null;
    const data = { ...doc, updatedAt: sentAt || new Date().toISOString(), deleted: pruneTombstones(doc.deleted) };
    await api(`/rest/v1/${TABLE}?on_conflict=user_id`, {
      method: 'POST',
      token,
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: { user_id: userId, data, updated_at: data.updatedAt }
    });
    meta.remoteUpdatedAt = data.updatedAt;
    // Si hubo cambios mientras se subía, quedan pendientes para la siguiente vuelta.
    meta.dirty = (App.getState().updatedAt || null) !== sentAt;
    if (meta.dirty) rerun = true;
  }

  async function run() {
    if (!ENABLED || !getSession()) { renderPill(); return; }
    if (!navigator.onLine) { setStatus('offline'); return; }
    setStatus('syncing');
    try {
      const token = await accessToken();
      if (!token) return;
      const userId = getSession().user.id;
      const rows = await api(`/rest/v1/${TABLE}?select=data&user_id=eq.${encodeURIComponent(userId)}`, { token });
      const remote = rows && rows[0] && rows[0].data;
      const local = App.getState();

      if (!remote) {
        await push(local, token, userId);
      } else if (!meta.dirty) {
        if (remote.updatedAt !== local.updatedAt) App.replaceState(remote);
        meta.remoteUpdatedAt = remote.updatedAt;
      } else if (remote.updatedAt === meta.remoteUpdatedAt) {
        await push(local, token, userId);
      } else {
        const merged = merge(local, remote);
        App.replaceState(merged);
        await push(merged, token, userId);
      }

      authRetried = false;
      meta.lastSyncAt = new Date().toISOString();
      saveMeta();
      setStatus(meta.dirty ? 'pending' : 'synced');
    } catch (e) {
      saveMeta();
      if (e.status === 401 && !authRetried) {
        // Token rechazado (p. ej. reloj desfasado): fuerza refresco y reintenta una vez.
        authRetried = true;
        const s = getSession();
        if (s) { s.expires_at = 0; setSession(s); rerun = true; }
      }
      setStatus(navigator.onLine ? 'error' : 'offline', humanError(e));
    }
  }

  // ---------- indicador y diálogo ----------
  function pillState() {
    if (!ENABLED) return ['local', 'Solo local'];
    if (!getSession()) return ['signedout', 'Conectar nube'];
    switch (status) {
      case 'syncing': return ['syncing', 'Sincronizando…'];
      case 'synced': return ['synced', 'Sincronizado'];
      case 'offline': return ['offline', meta.dirty ? 'Sin conexión · pendiente' : 'Sin conexión'];
      case 'error': return ['error', 'Error de sync'];
      default: return ['pending', 'Pendiente'];
    }
  }

  function renderPill() {
    const [cls, label] = pillState();
    mount.innerHTML = `<button class="sync-pill sync-${cls}" type="button" data-sync-open><i></i><span>${label}</span></button>`;
  }

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dlg = document.createElement('dialog');
  dlg.id = 'syncDialog';
  document.body.appendChild(dlg);

  function renderDialog(msg, isError) {
    const note = msg ? `<p class="sync-msg${isError ? ' err' : ''}">${esc(msg)}</p>` : '';
    const s = getSession();

    if (!ENABLED) {
      dlg.innerHTML = `<div class="dlg"><h2>Nube</h2>
        <p class="sync-msg">La sincronización con Supabase aún no está configurada (config.js). Tus datos se guardan solo en este dispositivo.</p>
        <div class="actions"><button class="btn" type="button" data-sync-close>Cerrar</button></div></div>`;
      return;
    }

    if (!s) {
      dlg.innerHTML = `<form class="dlg" novalidate>
        <h2>Conectar nube</h2>
        <p class="sync-msg">Entra para guardar tu bitácora en Supabase y usarla en varios dispositivos.</p>
        ${note}
        <div class="field"><label for="s-email">Correo</label>
          <input type="email" id="s-email" name="email" autocomplete="email" required></div>
        <div class="field"><label for="s-pass">Contraseña</label>
          <input type="password" id="s-pass" name="password" autocomplete="current-password" minlength="6" required></div>
        <div class="actions">
          <button class="btn ghost" type="button" data-sync-close>Cancelar</button>
          <span class="spacer"></span>
          <button class="btn ghost" type="button" data-sync-signup>Crear cuenta</button>
          <button class="btn" type="submit">Entrar</button>
        </div></form>`;
      return;
    }

    const [, label] = pillState();
    const last = meta.lastSyncAt ? new Date(meta.lastSyncAt).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' }) : '—';
    dlg.innerHTML = `<div class="dlg"><h2>Nube</h2>
      ${note}
      <p class="sync-kv"><span>Cuenta:</span> ${esc(s.user.email)}</p>
      <p class="sync-kv"><span>Estado:</span> ${esc(label)}</p>
      <p class="sync-kv"><span>Última sincronización:</span> ${esc(last)}</p>
      ${lastError && status === 'error' ? `<p class="sync-msg err">${esc(lastError)}</p>` : ''}
      <div class="actions">
        <button class="btn danger small" type="button" data-sync-logout>Cerrar sesión</button>
        <span class="spacer"></span>
        <button class="btn ghost small" type="button" data-sync-now>Sincronizar ahora</button>
        <button class="btn small" type="button" data-sync-close>Cerrar</button>
      </div></div>`;
  }

  async function submitAuth(mode) {
    const f = dlg.querySelector('form');
    if (!f || !f.reportValidity()) return;
    const email = f.elements.email.value.trim();
    const password = f.elements.password.value;
    f.querySelectorAll('button').forEach(b => { b.disabled = true; });
    try {
      if (mode === 'signup' && !(await signUp(email, password))) {
        renderDialog('Te enviamos un correo de confirmación. Ábrelo y después entra con tu contraseña.');
        return;
      }
      if (mode === 'signin') await signIn(email, password);
      dlg.close();
      App.toast('Sesión iniciada. Sincronizando…');
    } catch (e) {
      renderDialog(humanError(e), true);
      const nf = dlg.querySelector('form');
      if (nf) nf.elements.email.value = email;
    }
  }

  mount.addEventListener('click', e => {
    if (!e.target.closest('[data-sync-open]')) return;
    renderDialog();
    dlg.showModal();
  });

  dlg.addEventListener('click', async e => {
    const t = e.target;
    if (t.closest('[data-sync-close]')) dlg.close();
    else if (t.closest('[data-sync-signup]')) submitAuth('signup');
    else if (t.closest('[data-sync-logout]')) { dlg.close(); signOut(); }
    else if (t.closest('[data-sync-now]')) { await sync(); renderDialog(); }
  });

  dlg.addEventListener('submit', e => { e.preventDefault(); submitAuth('signin'); });

  // ---------- disparadores ----------
  document.addEventListener('bitacora:change', () => {
    meta.dirty = true;
    saveMeta();
    if (!ENABLED || !getSession()) return;
    setStatus(navigator.onLine ? 'pending' : 'offline');
    clearTimeout(pushTimer);
    pushTimer = setTimeout(sync, PUSH_DELAY_MS);
  });
  window.addEventListener('online', () => sync());
  window.addEventListener('offline', () => setStatus('offline'));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden || meta.dirty) { clearTimeout(pushTimer); sync(); }
  });
  setInterval(() => { if (!document.hidden) sync(); }, PULL_EVERY_MS);

  captureRedirect();
  renderPill();
  sync();
})();
