// Pantallas de acceso: bienvenida, entrar, crear cuenta, recuperar y definir nueva contraseña.
import * as api from './../api.js';
import * as store from './../store.js';
import { esc } from './../lib.js';
import { icon, googleLogo, busy } from './../ui.js';

const LOGO = `<div class="logo" aria-hidden="true">B</div>`;

const shell = (title, sub, body, foot = '') => `
  <div class="auth-card">
    ${LOGO}
    <h1>${esc(title)}</h1>
    ${sub ? `<p class="muted">${esc(sub)}</p>` : ''}
    ${body}
    ${foot}
  </div>`;

const field = (name, label, type, extra = '') => `
  <label class="field"><span>${esc(label)}</span>
    <input name="${name}" type="${type}" ${type === 'email' ? 'autocomplete="email" inputmode="email"' : ''} ${type === 'password' ? 'autocomplete="current-password" minlength="6"' : ''} required ${extra}>
  </label>`;

export function mountAuth(root, { onDone, start = 'welcome', message = '' }) {
  let screen = start;
  let note = message;
  let googleOn = false;
  api.providers().then(p => { googleOn = Boolean(p.google); draw(); });

  function draw() {
    const err = note ? `<p class="auth-note">${esc(note)}</p>` : '';
    const google = googleOn ? `<a class="btn google" href="${esc(api.googleUrl())}">${googleLogo}Continuar con Google</a><div class="or"><span>o</span></div>` : '';

    if (screen === 'welcome') {
      root.innerHTML = shell('Bitácora', 'Tu historial de trabajo: qué hiciste, en qué avanzas y qué sigue.', `
        ${err}${google}
        <div class="auth-actions">
          <button class="btn primary" data-go="signup">Crear cuenta</button>
          <button class="btn ghost" data-go="signin">Ya tengo cuenta</button>
        </div>`,
        `<button class="link center" data-go="guest">Probar sin cuenta</button>
         <p class="muted tiny center">Podrás crear la cuenta después sin perder lo registrado.</p>`);
    } else if (screen === 'signin') {
      root.innerHTML = shell('Entrar', '', `
        ${err}${google}
        <form class="form">
          ${field('email', 'Correo', 'email')}
          ${field('password', 'Contraseña', 'password')}
          <button class="btn primary block-btn" type="submit">Entrar</button>
        </form>`,
        `<div class="auth-foot"><button class="link" data-go="recover">¿Olvidaste tu contraseña?</button><button class="link" data-go="signup">Crear cuenta</button></div>`);
    } else if (screen === 'signup') {
      root.innerHTML = shell('Crear cuenta', 'Menos de un minuto.', `
        ${err}${google}
        <form class="form">
          <label class="field"><span>Tu nombre</span><input name="name" autocomplete="given-name" maxlength="80" placeholder="Opcional"></label>
          ${field('email', 'Correo', 'email')}
          ${field('password', 'Contraseña', 'password', 'autocomplete="new-password"')}
          <button class="btn primary block-btn" type="submit">Crear cuenta</button>
        </form>`,
        `<div class="auth-foot"><button class="link" data-go="signin">Ya tengo cuenta</button><button class="link" data-go="guest">Probar sin cuenta</button></div>`);
    } else if (screen === 'recover') {
      root.innerHTML = shell('Recuperar contraseña', 'Te enviamos un enlace para definir una nueva.', `
        ${err}
        <form class="form">
          ${field('email', 'Correo', 'email')}
          <button class="btn primary block-btn" type="submit">Enviar enlace</button>
        </form>`,
        `<div class="auth-foot"><button class="link" data-go="signin">Volver</button></div>`);
    } else if (screen === 'sent') {
      root.innerHTML = shell('Revisa tu correo', note, '', '<div class="auth-foot"><button class="link" data-go="signin">Volver a entrar</button></div>');
    } else if (screen === 'reset') {
      root.innerHTML = shell('Nueva contraseña', 'Elige una contraseña para tu cuenta.', `
        ${err}
        <form class="form">
          ${field('password', 'Nueva contraseña', 'password', 'autocomplete="new-password"')}
          <button class="btn primary block-btn" type="submit">Guardar y entrar</button>
        </form>`);
    }
    const first = root.querySelector('input');
    if (first && screen !== 'welcome') first.focus();
  }

  root.onclick = async e => {
    const go = e.target.closest('[data-go]');
    if (!go) return;
    const to = go.dataset.go;
    note = '';
    if (to === 'guest') { onDone({ guest: true }); return; }
    screen = to;
    draw();
  };

  root.onsubmit = async e => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const btn = form.querySelector('button[type=submit]');
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '');
    const name = String(fd.get('name') || '').trim();
    note = '';
    try {
      await busy(btn, async () => {
        if (screen === 'signin') {
          const s = await api.signIn(email, password);
          onDone({ session: s });
        } else if (screen === 'signup') {
          const s = await api.signUp(email, password, name);
          store.track('signup', {});
          if (s) { if (name) store.setProfile({ display_name: name }); onDone({ session: s, isNew: true }); }
          else { screen = 'sent'; note = `Te enviamos un correo a ${email}. Ábrelo para confirmar la cuenta y luego entra.`; draw(); }
        } else if (screen === 'recover') {
          await api.recover(email);
          screen = 'sent';
          note = `Si ${email} tiene cuenta, recibirás un enlace para cambiar la contraseña.`;
          draw();
        } else if (screen === 'reset') {
          await api.updatePassword(password);
          onDone({ session: api.getSession() });
        }
      });
    } catch (err) {
      note = api.humanError(err);
      draw();
    }
  };

  draw();
}
