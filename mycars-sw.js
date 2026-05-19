/**
 * MyCars — Service Worker
 * Version: 3.12.0 · Build: 20260519-010
 *
 * Strategy: Cache-first for the app shell (HTML, SW itself).
 * On activation, old caches are purged so updates take effect
 * as soon as the user closes all tabs and reopens the app.
 *
 * Data lives in localStorage — the SW never touches it.
 * Network requests (Google Fonts) are handled with a
 * network-first + cache-fallback strategy so fonts work offline
 * after the first visit.
 *
 * ── Release notes ────────────────────────────────────────────
 * 20260519: Glass theme, improved apple-touch-icon, iOS fixes,
 *           GPL §7 attribution, SW APP_SHELL fix for GitHub Pages
 */

const CACHE_NAME = 'mycars-v3';

// Everything we want available offline
const APP_SHELL = [
  './MyCars.html',
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
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim()) // take control of open tabs
  );
});

// ── Fetch: serve from cache, fall back to network ────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Google Fonts: network-first, cache as fallback (fonts work offline after first load)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
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
