// ══════════════════════════════════════════════════════════════
//  EL TITI — Service Worker
//  Cachea el shell de la app y los assets locales para uso offline
// ══════════════════════════════════════════════════════════════

const CACHE_NAME = 'eltiti-cache-v1';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',

  // Logo
  './assets/logo/logo-el-titi.png',
  './assets/logo/no-image.webp',

  // Iconos
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/favicon.png',

  // Productos
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
  './assets/productos/butifarra.webp',
  './assets/productos/empanadas.webp',

  // Galería
  './assets/galeria/foto1.webp',
  './assets/galeria/foto2.webp',
  './assets/galeria/foto3.webp',
  './assets/galeria/foto4.webp',
  './assets/galeria/foto5.webp',

  // Videos "Nuestra Cocina"
  './assets/videos/cocina.mp4',
  './assets/videos/especialidades.mp4',
  './assets/videos/promo.mp4'
];

// ── Instalación: precachea el app shell y los assets ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {}) // si algún asset aún no existe, no bloquea la instalación
      .then(() => self.skipWaiting())
  );
});

// ── Activación: limpia cachés antiguas ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first para assets locales, network-first para el resto ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const esAssetLocal = url.origin === self.location.origin && url.pathname.includes('/assets/');

  if (esAssetLocal) {
    // Assets (imágenes/videos): cache-first
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const copia = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
          return response;
        }).catch(() => cached);
      })
    );
  } else {
    // App shell / datos: network-first con fallback a caché (offline)
    event.respondWith(
      fetch(request).then((response) => {
        if (request.url.startsWith(self.location.origin)) {
          const copia = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
        }
        return response;
      }).catch(() => caches.match(request))
    );
  }
});
