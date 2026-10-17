const CACHE_NAME = 'meteo-montevideo-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://unpkg.com/lucide@latest'
];

// Instalación: Guardar en caché la interfaz estática
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activación: Limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de peticiones
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // SI ES LA API DEL CLIMA: Ir directo a la red (no guardar respuesta obsoleta en caché)
  if (url.hostname.includes('open-meteo.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // PARA EL RESTO DE RECURSOS: Caché con respaldo de red (Cache First)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Guardar dinámicamente recursos estáticos
          if (event.request.method === 'GET') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    })
  );
});