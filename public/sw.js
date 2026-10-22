// Offline shell for PaisaX. Game state lives in localStorage so cached pages are all it needs.
const CACHE = "paisax-v1"
const SHELL = ["/", "/plans", "/my-plans", "/wallet", "/refer", "/profile"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => {}) // a missing page shouldn't block install; it gets cached on first visit
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const keep = (request, response) => {
  if (response.ok) {
    const copy = response.clone()
    caches.open(CACHE).then((cache) => cache.put(request, copy))
  }
  return response
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return

  // Hashed build files never change: serve from cache first.
  if (request.url.includes("/_next/static/")) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((res) => keep(request, res))))
    return
  }

  // Pages and data: network first, then the last copy, then the home screen.
  event.respondWith(
    fetch(request)
      .then((res) => keep(request, res))
      .catch(() =>
        caches
          .match(request, { ignoreVary: true })
          .then((hit) => hit || (request.mode === "navigate" ? caches.match("/") : Response.error())),
      ),
  )
})
