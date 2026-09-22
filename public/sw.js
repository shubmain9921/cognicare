// CogniCare Service Worker for Patient Portal Offline Caching
const CACHE_NAME = 'cognicare-patient-v1';

const STATIC_ASSETS = [
  '/',
  '/patient/login',
  '/patient/home',
  '/patient/games',
  '/patient/games/remember-objects',
  '/patient/games/sequence-recall',
  '/patient/games/find-pair',
  '/patient/games/what-changed',
  '/patient/games/story-recall',
  '/patient/games/daily-routine-recall',
  '/patient/games/who-where-when',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Failed to pre-cache some assets during SW install:', err);
      });
    })
  );
  self.skipWaiting();
});

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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Do not interfere with caregiver dashboard routes or API endpoints
  if (url.pathname.startsWith('/caregiver') || url.pathname.startsWith('/auth')) {
    return;
  }

  // Handle static assets & patient routes: Network first with Cache fallback for HTML/navigation,
  // Cache first with Network fallback for static chunks/images/fonts.
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached, update in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Navigation and document requests for patient pages
  if (request.mode === 'navigate' || url.pathname.startsWith('/patient')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to cached patient home or games if available
          if (url.pathname.startsWith('/patient/games')) {
            const cachedGames = await caches.match('/patient/games');
            if (cachedGames) return cachedGames;
          }
          const cachedHome = await caches.match('/patient/home');
          if (cachedHome) return cachedHome;

          return new Response(
            '<html><head><meta charset="utf-8"/><title>Offline</title><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="font-family:sans-serif;text-align:center;padding:40px;background:#fffbeb;color:#000;"><h1>⚡ Offline</h1><p>You are currently offline. Please reconnect or open cached activities.</p><a href="/patient/games" style="display:inline-block;padding:12px 24px;background:#059669;color:#fff;font-weight:bold;text-decoration:none;border-radius:12px;margin-top:16px;">Brain Games</a></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
  }
});
