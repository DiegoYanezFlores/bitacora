// Service worker de Bitácora v2.
// Navegación y módulos: red primero con respaldo de caché (para que las actualizaciones lleguen solas).
// Estáticos (iconos): caché primero. Supabase nunca pasa por aquí.
const CACHE = 'bitacora-v10';
const NETWORK_TIMEOUT_MS = 3500;
const PRECACHE = [
  '/', '/index.html', '/config.js', '/manifest.json',
  '/app/styles.css', '/app/main.js', '/app/lib.js', '/app/db.js', '/app/store.js', '/app/model.js',
  '/app/api.js', '/app/sync.js', '/app/ui.js', '/app/actions.js', '/app/capture.js', '/app/migrate.js',
  '/app/motion.js', '/app/structure.js', '/app/domain/days.js', '/app/domain/templates.js',
  '/app/domain/calendar.js', '/app/domain/period.js', '/app/domain/progress.js',
  '/app/views/today.js', '/app/views/projects.js', '/app/views/project.js', '/app/views/tasks.js',
  '/app/views/calendar.js',
  '/app/views/log.js', '/app/views/progress.js', '/app/views/settings.js', '/app/views/auth.js', '/app/views/onboarding.js',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'
];

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
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  const isPage = req.mode === 'navigate';
  const isAsset = /\.(png|svg|ico|webmanifest)$/.test(url.pathname);
  const key = isPage ? '/index.html' : req;

  if (isAsset) {
    event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }

  event.respondWith((async () => {
    try {
      const res = await withTimeout(fetch(req), NETWORK_TIMEOUT_MS);
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
      return res;
    } catch (err) {
      const cached = await caches.match(key, { ignoreSearch: true });
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
