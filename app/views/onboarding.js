// Onboarding en 4 pasos, pensado para terminar en menos de un minuto.
import * as store from './../store.js';
import { esc, dayKey } from './../lib.js';
import { icon, COLORS } from './../ui.js';
import { logActivity } from './../actions.js';

const AREAS = [
  ['trabajo', 'Trabajo', ['Proyecto principal', 'Cliente', 'Mi equipo']],
  ['estudio', 'Estudios', ['Curso actual', 'Certificación', 'Tesis']],
  ['personal', 'Proyectos personales', ['Proyecto propio', 'Idea nueva']],
  ['salud', 'Hábitos y salud', ['Entrenamiento', 'Rutina diaria']],
  ['otro', 'Otra cosa', ['Mi proyecto']]
];

export function mountOnboarding(root, { onDone }) {
  const st = { step: 1, name: store.profile().display_name || '', areas: [], projectName: '', projectId: null };

  const head = () => `<div class="ob-dots">${[1, 2, 3, 4].map(n => `<span class="${n === st.step ? 'on' : ''} ${n < st.step ? 'done' : ''}"></span>`).join('')}</div>`;

  function draw() {
    if (st.step === 1) {
      root.innerHTML = `<div class="auth-card">${head()}
        <h1>¿Cómo te llamas?</h1><p class="muted">Solo para saludarte.</p>
        <form class="form"><label class="field"><span>Nombre</span><input name="name" maxlength="80" value="${esc(st.name)}" autocomplete="given-name" autofocus placeholder="Tu nombre"></label>
        <button class="btn primary block-btn" type="submit">Continuar</button></form></div>`;
    } else if (st.step === 2) {
      root.innerHTML = `<div class="auth-card">${head()}
        <h1>¿Qué quieres registrar?</h1><p class="muted">Elige lo que se parezca a tu día a día. Puedes cambiarlo luego.</p>
        <div class="ob-areas">${AREAS.map(([k, l]) => `<button type="button" class="pill big ${st.areas.includes(k) ? 'on' : ''}" data-area="${k}">${esc(l)}</button>`).join('')}</div>
        <button class="btn primary block-btn" data-next>Continuar</button></div>`;
    } else if (st.step === 3) {
      const suggestions = [...new Set(st.areas.flatMap(a => (AREAS.find(x => x[0] === a) || [])[2] || []))].slice(0, 4);
      root.innerHTML = `<div class="auth-card">${head()}
        <h1>¿Qué quieres construir?</h1><p class="muted">Tu primer objetivo. Puedes cambiarlo después.</p>
        <form class="form">
          <label class="field"><span>Objetivo</span><input name="project" maxlength="120" value="${esc(st.projectName)}" autofocus placeholder="Ej.: Certificación Google Cloud"></label>
          ${suggestions.length ? `<div class="filters">${suggestions.map(s => `<button type="button" class="pill" data-sug="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : ''}
          <button class="btn primary block-btn" type="submit">Crear objetivo</button>
        </form>
        <button class="link center" data-skip>Ahora no</button></div>`;
    } else {
      root.innerHTML = `<div class="auth-card">${head()}
        <h1>Registra lo primero</h1><p class="muted">${st.projectName ? `Algo que ya hayas hecho en ${esc(st.projectName)}.` : 'Algo que hayas hecho hoy.'} Una línea basta.</p>
        <form class="form">
          <label class="field"><span>¿Qué hiciste?</span><input name="act" maxlength="300" autofocus placeholder="Ej.: Terminé el módulo 1"></label>
          <button class="btn primary block-btn" type="submit">Guardar y empezar</button>
        </form>
        <button class="link center" data-skip>Saltar</button></div>`;
    }
  }

  root.onclick = e => {
    const area = e.target.closest('[data-area]');
    if (area) { const k = area.dataset.area; st.areas = st.areas.includes(k) ? st.areas.filter(x => x !== k) : [...st.areas, k]; draw(); return; }
    const sug = e.target.closest('[data-sug]');
    if (sug) { root.querySelector('input[name=project]').value = sug.dataset.sug; return; }
    if (e.target.closest('[data-next]')) { st.step = 3; draw(); return; }
    if (e.target.closest('[data-skip]')) { finish(); }
  };

  root.onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (st.step === 1) {
      st.name = String(fd.get('name') || '').trim();
      if (st.name) store.setProfile({ display_name: st.name });
      st.step = 2;
    } else if (st.step === 3) {
      st.projectName = String(fd.get('project') || '').trim();
      if (st.projectName) {
        const p = store.create('projects', { name: st.projectName, color: COLORS[0], start_date: dayKey() });
        st.projectId = p.id;
      }
      st.step = 4;
    } else if (st.step === 4) {
      const title = String(fd.get('act') || '').trim();
      if (title) logActivity({ title, kind: 'done', project_id: st.projectId, source: 'onboarding' }, { quiet: true });
      finish(Boolean(title));
      return;
    }
    draw();
  };

  function finish(logged = false) {
    store.setProfile({ onboarded_at: new Date().toISOString(), focus_areas: st.areas, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '' });
    store.track('onboarding_complete', { areas: st.areas.length, project: Boolean(st.projectId), activity: logged });
    onDone({ logged });
  }

  draw();
}
