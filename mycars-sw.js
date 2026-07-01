/**
 * MyCars — Service Worker
 * Version: 3.15.0 · Build: 20260616-007
 *
 * Strategy: Cache-first for the app shell (HTML, SW itself).
 * On activation, old caches are purged so updates take effect
 * as soon as the user closes all tabs and reopens the app.
 *
 * Data lives in localStorage — the SW never touches it.
 * Network requests (Google Fonts) are handled with a
 * network-first + cache-fallback strategy so fonts work offline
 * after the first visit.
 */

const CACHE_NAME = 'mycars-v36';
const FONTS_CACHE = 'mycars-fonts-v1';
// Maximum age of a cached Google Fonts response before it must be re-validated
// from the network (mitigates serving a compromised cached asset indefinitely).
const FONTS_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Everything we want available offline
const APP_SHELL = [
  './MyCars.html',
  './mycars.js',
  './manifest.json',
];

// ── Install: pre-cache app shell ─────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()) // activate immediately
  );
});

// ── Activate: remove old cache versions ──────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== FONTS_CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim()) // take control of open tabs
  );
});

// ── Fetch: serve from cache, fall back to network ────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Google Fonts: network-first with bounded cache TTL.
  // Cached responses are tagged with a timestamp and discarded when older
  // than FONTS_MAX_AGE_MS to limit exposure to a potentially compromised
  // upstream font CDN.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        // Cachujeme jen ne-opaque, úspěšné odpovědi — opaque cross-origin
        // odpovědi nelze ověřit (status=0) a měly by se neukládat.
        if (response && response.ok && response.type !== 'opaque') {
          const cache = await caches.open(FONTS_CACHE);
          // Tag with timestamp via custom header on a cloned response
          const headers = new Headers(response.headers);
          headers.set('x-sw-cached-at', String(Date.now()));
          const body = await response.clone().blob();
          const tagged = new Response(body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
          cache.put(event.request, tagged);
        }
        return response;
      } catch {
        const cache = await caches.open(FONTS_CACHE);
        const cached = await cache.match(event.request);
        if (!cached) return Response.error();
        const ts = parseInt(cached.headers.get('x-sw-cached-at') || '0', 10);
        if (ts && (Date.now() - ts) > FONTS_MAX_AGE_MS) {
          // Stale beyond TTL — drop and fail closed
          cache.delete(event.request);
          return Response.error();
        }
        return cached;
      }
    })());
    return;
  }

  // App shell: cache-first
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(response => {
          // Cache any new same-origin resource we fetch
          if (url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
      )
  );
});
