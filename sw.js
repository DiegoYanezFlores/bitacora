// Service worker de Bitácora: red primero, caché como respaldo offline.
// Sube CACHE (v2, v3…) si cambias la lista de archivos precargados.
const CACHE = 'bitacora-v2';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const PRECACHE = [
  '/',
  '/index.html',
  '/config.js',
  '/sync.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  // IBM Plex (Google Fonts): caché primero para que la tipografía funcione offline.
  if (req.method === 'GET' && FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }));
    return;
  }
  // Solo recursos propios; las llamadas a Supabase van directo a la red.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  const isPage = req.mode === 'navigate';
  const cacheKey = isPage ? '/index.html' : req;

  event.respondWith((async () => {
    try {
      const res = await withTimeout(fetch(req), NETWORK_TIMEOUT_MS);
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(cacheKey, copy));
      }
      return res;
    } catch (err) {
      const cached = await caches.match(cacheKey, { ignoreSearch: true });
      if (cached) return cached;
      throw err;
    }
  })());
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}
