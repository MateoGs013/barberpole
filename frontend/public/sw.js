// Service Worker — Turnero Universal PWA (v2 Calibrado)
const CACHE_NAME = 'turnero-static-v2'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch((err) => console.warn('[SW] Error en pre-cache inicial:', err))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purgando caché obsoleta:', key)
            return caches.delete(key)
          }
        })
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // 1. REGLA CRÍTICA: Solo manejar solicitudes GET.
  // Cualquier POST, PUT, DELETE, PATCH (como sacar turnos o login) debe pasar directo a la red.
  if (event.request.method !== 'GET') {
    return
  }

  const url = new URL(event.request.url)

  // 2. No interceptar dominios externos (Google Identity Services, APIs de terceros, etc.)
  if (url.origin !== self.location.origin) {
    return
  }

  // 3. Las llamadas API del backend NUNCA se interceptan ni cachean
  if (url.pathname.startsWith('/api') || url.pathname.includes('/api/')) {
    return
  }

  // 4. No interceptar rutas de desarrollo o extensiones
  if (url.pathname.includes('/@vite/') || url.pathname.includes('/@fs/')) {
    return
  }

  // 5. Navegación SPA (React Router): Network first, fallback a /index.html si no hay red
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match('/index.html')
        return cached || new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain' } })
      })
    )
    return
  }

  // 6. Archivos estáticos: Cache First con fallback a Red
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic' &&
            (url.pathname.startsWith('/assets/') ||
              url.pathname.startsWith('/icons/') ||
              url.pathname.endsWith('.svg') ||
              url.pathname.endsWith('.png') ||
              url.pathname.endsWith('.css') ||
              url.pathname.endsWith('.js'))
          ) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return networkResponse
        })
        .catch(() => {
          // Si falla la red y no está en caché, no lanzar error no controlado
          return new Response(null, { status: 404 })
        })
    })
  )
})
