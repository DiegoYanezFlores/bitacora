// Almacén local: memoria (lecturas y escrituras instantáneas) + IndexedDB (persistencia).
// Si IndexedDB no está disponible (algún modo privado), la app funciona en memoria.

// En orden de dependencias (padres antes que hijos): la sincronización sube en este orden.
export const TABLES = ['projects', 'stages', 'milestones', 'criteria', 'tasks', 'task_log', 'activities',
  'evidence', 'reflections', 'achievements', 'day_marks', 'goal_log', 'recaps'];
const DB_NAME = 'bitacora';
const DB_VERSION = 3; // 2: tablas de 003 + 'files'; 3: task_log (qué pasó con cada tarea, migración 005)

const mem = Object.fromEntries(TABLES.map(t => [t, new Map()]));
const kv = new Map();
let idb = null;
export let rev = 0; // cambia con cada escritura: invalida cálculos derivados

function req(r) {
  return new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
}

export async function openDb() {
  try {
    idb = await new Promise((resolve, reject) => {
      const r = indexedDB.open(DB_NAME, DB_VERSION);
      r.onupgradeneeded = () => {
        const db = r.result;
        for (const t of TABLES) if (!db.objectStoreNames.contains(t)) db.createObjectStore(t, { keyPath: 'id' });
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'k' });
        if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'id' });
      };
      // Otra pestaña con una versión anterior mantiene la base abierta: no se sigue en memoria (se perderían datos).
      r.onblocked = () => reject(Object.assign(new Error('Bitácora está abierta en otra pestaña con una versión anterior. Ciérrala y recarga esta página.'), { name: 'BlockedError' }));
      r.onsuccess = () => {
        // Si una versión futura necesita actualizar la base, esta pestaña la suelta y se recarga.
        r.result.onversionchange = () => { r.result.close(); location.reload(); };
        resolve(r.result);
      };
      r.onerror = () => reject(r.error);
    });
    const tx = idb.transaction([...TABLES, 'kv'], 'readonly');
    const loads = TABLES.map(t => req(tx.objectStore(t).getAll()).then(rows => rows.forEach(r => mem[t].set(r.id, r))));
    loads.push(req(tx.objectStore('kv').getAll()).then(rows => rows.forEach(r => kv.set(r.k, r.v))));
    await Promise.all(loads);
    return true;
  } catch (e) {
    if (e && e.name === 'BlockedError') throw e;
    console.warn('IndexedDB no disponible; datos solo en memoria', e);
    idb = null;
    return false;
  }
}

function write(store, value) {
  if (!idb) return;
  try {
    const tx = idb.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
  } catch (e) { console.warn('No se pudo guardar', e); }
}

export const get = (t, id) => mem[t].get(id);
export const raw = t => [...mem[t].values()];
export const live = t => raw(t).filter(r => !r.deleted_at);

export function put(t, row) {
  rev++;
  mem[t].set(row.id, row);
  write(t, row);
  return row;
}

export const kvGet = (k, fallback = null) => (kv.has(k) ? kv.get(k) : fallback);
export function kvSet(k, v) {
  kv.set(k, v);
  write('kv', { k, v });
}

export async function wipe() {
  rev++;
  for (const t of TABLES) mem[t].clear();
  memFiles.clear();
  kv.clear();
  if (!idb) return;
  const stores = [...TABLES, 'kv', 'files'];
  const tx = idb.transaction(stores, 'readwrite');
  for (const t of stores) tx.objectStore(t).clear();
  await new Promise(r => { tx.oncomplete = r; tx.onerror = r; });
}

export const counts = () => Object.fromEntries(TABLES.map(t => [t, live(t).length]));

// ---------- archivos locales (fotos del usuario y evidencia pendiente de subir) ----------
// El binario nunca va a la base de datos remota: aquí se guarda el original, y su referencia
// viaja en las preferencias o en la fila de evidencia. Sin IndexedDB, se mantiene en memoria.
const memFiles = new Map();

export async function putFile(file) {
  memFiles.set(file.id, file);
  if (!idb) return file;
  try {
    const tx = idb.transaction('files', 'readwrite');
    tx.objectStore('files').put(file);
    await new Promise(r => { tx.oncomplete = r; tx.onerror = r; });
  } catch (e) { console.warn('No se pudo guardar el archivo', e); }
  return file;
}

export async function getFile(id) {
  if (memFiles.has(id)) return memFiles.get(id);
  if (!idb) return null;
  try {
    const row = await req(idb.transaction('files', 'readonly').objectStore('files').get(id));
    if (row) memFiles.set(id, row);
    return row || null;
  } catch (e) { return null; }
}

export async function listFiles() {
  if (!idb) return [...memFiles.values()];
  try { return await req(idb.transaction('files', 'readonly').objectStore('files').getAll()); } catch (e) { return [...memFiles.values()]; }
}

export async function deleteFile(id) {
  memFiles.delete(id);
  if (!idb) return;
  try {
    const tx = idb.transaction('files', 'readwrite');
    tx.objectStore('files').delete(id);
    await new Promise(r => { tx.oncomplete = r; tx.onerror = r; });
  } catch (e) { console.warn('No se pudo borrar el archivo', e); }
}
