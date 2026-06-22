// ══════════════════════════════════════════════════════════════
//  EL TITI — Service Worker v4 (kill-switch + reconstrucción)
// ══════════════════════════════════════════════════════════════

const CACHE_NAME = 'eltiti-cache-v4';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './assets/logo/logo-el-titi.png',
  './assets/logo/no-image.webp',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/favicon.png',
  './assets/productos/hamburguesa-simple.webp',
  './assets/productos/hamburguesa-doble.webp',
  './assets/productos/hamburguesa-triple.webp',
  './assets/productos/hamburguesa-especial.webp',
  './assets/productos/hamburguesa-x.webp',
  './assets/productos/salchipapa-simple.webp',
  './assets/productos/salchipapa-doble.webp',
  './assets/productos/salchipapa-triple.webp',
  './assets/productos/salchipapa-especial.webp',
  './assets/productos/salchipapa-x.webp',
  './assets/productos/choripapa.webp',
  './assets/productos/chuzo-pollo.webp',
  './assets/productos/chuzo-cerdo.webp',
  './assets/productos/butifarra.webp',
  './assets/productos/empanadas.webp',
  './assets/galeria/foto1.webp',
  './assets/galeria/foto2.webp',
  './assets/galeria/foto3.webp',
  './assets/galeria/foto4.webp',
  './assets/galeria/foto5.webp',
  './assets/videos/cocina.mp4',
  './assets/videos/especialidades.mp4',
  './assets/videos/promo.mp4'
];

// ── Instalación: elimina TODOS los cachés anteriores primero ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => caches.open(CACHE_NAME))
      .then(cache => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ── Activación: toma control inmediato de todos los clientes ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
      .then(() => {
        // Forzar recarga en todos los clientes abiertos
        self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => client.navigate(client.url));
        });
      })
  );
});

// ── Fetch: network-first para HTML, cache-first para assets ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const esHTML = request.destination === 'document' || url.pathname.endsWith('.html') || url.pathname === '/eltiti/' || url.pathname === '/eltiti';
  const esAsset = url.origin === self.location.origin && url.pathname.includes('/assets/');

  if (esHTML) {
    // HTML: siempre network-first para tener versión fresca
    event.respondWith(
      fetch(request)
        .then(response => {
          const copia = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copia));
          return response;
        })
        .catch(() => caches.match(request))
    );
  } else if (esAsset) {
    // Assets: cache-first
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          const copia = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copia));
          return response;
        }).catch(() => cached);
      })
    );
  } else {
    // Resto: network-first
    event.respondWith(
      fetch(request)
        .then(response => {
          if (request.url.startsWith(self.location.origin)) {
            const copia = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copia));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
