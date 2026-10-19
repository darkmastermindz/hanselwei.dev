// hanselwei.dev service worker: makes the site installable and usable offline.
// - Build assets (/_nuxt/*, icons) are cache-first: their names are content-hashed.
// - Pages are network-first, falling back to the last cached copy when offline.
// - API responses (/api/*) are network-first so the gear inventory stays fresh.
const VERSION = 'v7'
const STATIC_CACHE = `static-${VERSION}`
const RUNTIME_CACHE = `runtime-${VERSION}`
const PRECACHE = ['/', '/bio', '/blog', '/blog/feed', '/gear', '/projects', '/manifest.webmanifest', '/icons/icon-192.png']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys.filter(key => ![STATIC_CACHE, RUNTIME_CACHE].includes(key)).map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

const networkFirst = async request => {
  const cache = await caches.open(RUNTIME_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch (err) {
    const cached = (await cache.match(request)) || (await caches.match(request))
    if (cached) return cached
    if (request.mode === 'navigate') return caches.match('/')
    throw err
  }
}

const cacheFirst = async request => {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE)
    cache.put(request, response.clone())
  }
  return response
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // Let the browser follow the contact card redirect itself
  if (url.pathname === '/connect') return
  // Never cache sign-in traffic or who's signed in
  if (url.pathname.startsWith('/.netlify/') || url.pathname.startsWith('/api/auth/') || url.pathname === '/api/me') return

  if (url.pathname.startsWith('/_nuxt/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request))
  } else {
    event.respondWith(networkFirst(request))
  }
})
