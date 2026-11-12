// OneSignal push notifications (push + notification click handlers).
// Wrapped so the game still works offline if the CDN cannot be reached.
try { importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js'); } catch (e) {}

// Bump this when you change any file, so phones pick up the new version.
const VERSION = 'keepy-uppy-v9';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: cache on first use so the game keeps its font offline
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(VERSION).then((c) =>
        c.match(req).then((hit) => hit || fetch(req).then((res) => { c.put(req, res.clone()); return res; }))
      )
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // The page itself: network first so updates show up right away;
  // the cached copy is used offline or if the network takes longer than 4 s.
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    const network = fetch(req, { cache: 'no-cache' }).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put('./index.html', copy));
      }
      return res;
    });
    const cached = () => caches.match('./index.html').then((hit) => hit || caches.match(req, { ignoreSearch: true }));
    const timeout = new Promise((resolve) => setTimeout(resolve, 4000));
    event.respondWith(
      Promise.race([network, timeout.then(() => cached())])
        .then((res) => res || network)
        .catch(() => cached())
        .then((res) => res || network)
    );
    return;
  }

  // Icons, manifest: cache first, fall back to network, then to the cached index
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) =>
      hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
