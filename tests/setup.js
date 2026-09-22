// Entorno mínimo de navegador para importar los módulos de la app en Node (sin DOM ni IndexedDB).
// db.js funciona solo en memoria si no se llama a openDb(), que es lo que se usa aquí.
globalThis.window = globalThis.window || { BITACORA_CONFIG: { supabaseUrl: 'https://test.supabase.co', supabaseAnonKey: 'test-key' }, addEventListener() {}, dispatchEvent() {} };
Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true, writable: true });

// DOM mínimo: feedback() escribe en #toast; aquí basta con que exista y guarde lo último mostrado.
const fakeEl = () => ({ className: '', innerHTML: '', hidden: false, classList: { add() {}, remove() {}, toggle() {} }, querySelector: () => fakeEl(), addEventListener() {}, setAttribute() {}, set onclick(f) { globalThis.__lastUndo = f; } });
globalThis.document = globalThis.document || { getElementById: () => fakeEl(), querySelector: () => fakeEl(), querySelectorAll: () => [] };
globalThis.matchMedia = globalThis.matchMedia || (() => ({ matches: false, addEventListener() {} }));

const mem = new Map();
globalThis.localStorage = globalThis.localStorage || {
  getItem: k => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: k => mem.delete(k)
};

// Fechas relativas a hoy en formato día local, para no depender del día en que se corren las pruebas.
export async function reset() {
  const db = await import('../app/db.js');
  const store = await import('../app/store.js');
  await db.wipe();
  Object.assign(store.session, { userId: 'u1', email: 'a@b.c', guest: false });
}

// ISO a mediodía local de un día 'YYYY-MM-DD' (evita saltos de día por zona horaria).
export const noon = day => { const [y, m, d] = day.split('-').map(Number); return new Date(y, m - 1, d, 12).toISOString(); };
