// Fotos del usuario: guardar en el dispositivo, mostrar y subir al almacén privado cuando hay cuenta.
// Funciona sin conexión: la foto se ve en cuanto se elige y se sube después, igual que el resto de cambios.
import * as db from './db.js';
import * as store from './store.js';
import { api, BASE, token, ENABLED } from './api.js';
import { uuid, nowIso } from './lib.js';
import { checkFile, storagePath, mediaEntry, MAX_FILES } from './domain/media.js';
import { resolve as resolvePrefs } from './domain/prefs.js';

const BUCKET = 'evidence'; // bucket privado creado en la migración 003 (una carpeta por usuario)
const urls = new Map();    // id → object URL vivo, para no recrearlo en cada repintado

// Guarda la imagen en este dispositivo y la añade a las preferencias. La subida va aparte.
export async function addPhoto(file) {
  const media = resolvePrefs(store.profile().prefs).media;
  const check = checkFile(file, { count: media.length });
  if (!check.ok) return { ok: false, reason: check.reason };

  const id = uuid();
  const blob = file.slice(0, file.size, file.type); // copia estable del contenido
  await db.putFile({ id, kind: 'wallpaper', type: file.type, size: file.size, name: file.name || 'Foto', blob, at: nowIso(), uploaded: false });
  const entry = mediaEntry(id, { name: file.name, path: '', at: nowIso() });
  store.setPrefs({ media: [...media, entry] });
  uploadPending().catch(() => {}); // sin conexión no pasa nada: se reintenta luego
  return { ok: true, entry };
}

// Quita la foto del dispositivo, del almacén y de las preferencias (solo si el usuario lo pide).
export async function removePhoto(id) {
  const prefs = resolvePrefs(store.profile().prefs);
  const entry = prefs.media.find(m => m.id === id);
  const media = prefs.media.filter(m => m.id !== id);
  const patch = { media };
  // Si era el fondo activo, se vuelve al fondo por defecto en vez de dejar un hueco roto.
  if (prefs.background.kind === 'photo' && prefs.background.id === id) patch.background = { ...prefs.background, kind: media.length ? 'photo' : 'none', id: media[0] ? media[0].id : '' };
  store.setPrefs(patch);
  revoke(id);
  await db.deleteFile(id);
  if (entry && entry.path) { try { await remoteDelete(entry.path); } catch (e) { /* ya no existe o sin conexión */ } }
  return media.length;
}

// Dirección para pintar la foto: primero el archivo local; si no está, se baja del almacén.
export async function photoUrl(id) {
  if (urls.has(id)) return urls.get(id);
  const local = await db.getFile(id);
  if (local && local.blob) {
    const url = URL.createObjectURL(local.blob);
    urls.set(id, url);
    return url;
  }
  const entry = resolvePrefs(store.profile().prefs).media.find(m => m.id === id);
  if (!entry || !entry.path || !ENABLED) return null;
  try {
    const blob = await remoteGet(entry.path);
    await db.putFile({ id, kind: 'wallpaper', type: blob.type, size: blob.size, name: entry.name, blob, at: entry.at, uploaded: true });
    const url = URL.createObjectURL(blob);
    urls.set(id, url);
    return url;
  } catch (e) { return null; }
}

function revoke(id) {
  const url = urls.get(id);
  if (url) { try { URL.revokeObjectURL(url); } catch (e) { /* ya liberada */ } urls.delete(id); }
}

// Sube las fotos que aún no están en el almacén. Idempotente: lo ya subido no se repite.
export async function uploadPending() {
  if (!ENABLED || store.session.guest || !store.session.userId) return 0;
  const t = await token();
  if (!t) return 0;
  const prefs = resolvePrefs(store.profile().prefs);
  let subidas = 0;
  for (const entry of prefs.media) {
    if (entry.path) continue;
    const file = await db.getFile(entry.id);
    if (!file || !file.blob) continue;
    const path = storagePath(store.session.userId, entry.id, file.type);
    await remotePut(path, file.blob, t);
    await db.putFile({ ...file, uploaded: true });
    const actual = resolvePrefs(store.profile().prefs).media;
    store.setPrefs({ media: actual.map(m => (m.id === entry.id ? { ...m, path } : m)) });
    subidas++;
  }
  return subidas;
}

// ---------- almacén remoto (Supabase Storage con el token del usuario) ----------
async function remotePut(path, blob, t) {
  const res = await fetch(`${BASE}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + t, 'x-upsert': 'true', 'Content-Type': blob.type || 'application/octet-stream' },
    body: blob
  });
  if (!res.ok && res.status !== 409) throw new Error('No se pudo subir la imagen (' + res.status + ')');
}

async function remoteGet(path) {
  const t = await token();
  const res = await fetch(`${BASE}/storage/v1/object/${BUCKET}/${path}`, { headers: { Authorization: 'Bearer ' + t } });
  if (!res.ok) throw new Error('No se pudo descargar la imagen (' + res.status + ')');
  return res.blob();
}

async function remoteDelete(path) {
  const t = await token();
  if (!t) return;
  await api(`/storage/v1/object/${BUCKET}/${path}`, { method: 'DELETE', token: t });
}

export { MAX_FILES };
