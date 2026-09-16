// Almacén local: memoria (lecturas y escrituras instantáneas) + IndexedDB (persistencia).
// Si IndexedDB no está disponible (algún modo privado), la app funciona en memoria.

export const TABLES = ['projects', 'milestones', 'tasks', 'activities'];
const DB_NAME = 'bitacora';
const DB_VERSION = 1;

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
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const tx = idb.transaction([...TABLES, 'kv'], 'readonly');
    const loads = TABLES.map(t => req(tx.objectStore(t).getAll()).then(rows => rows.forEach(r => mem[t].set(r.id, r))));
    loads.push(req(tx.objectStore('kv').getAll()).then(rows => rows.forEach(r => kv.set(r.k, r.v))));
    await Promise.all(loads);
    return true;
  } catch (e) {
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
  kv.clear();
  if (!idb) return;
  const tx = idb.transaction([...TABLES, 'kv'], 'readwrite');
  for (const t of [...TABLES, 'kv']) tx.objectStore(t).clear();
  await new Promise(r => { tx.oncomplete = r; tx.onerror = r; });
}

export const counts = () => Object.fromEntries(TABLES.map(t => [t, live(t).length]));
