const CACHE_NAME = 'goftan-v1';

// Core app shell — always cached
const SHELL_ASSETS = [
  '/quiz/',
  '/quiz/index.html',
  '/quiz/index.css',
  '/quiz/js_src/logic.js',
  '/quiz/js_src/index.js',
  '/quiz/js_src/hangman.js',
  '/quiz/js_src/crossword.js',
  '/quiz/js_src/prepare_crossword.js',
  '/quiz/js_src/init_nav_menu.js',
  '/quiz/js_src/d3.v7.min.js',
  '/quiz/font-awesome.min.css',
  '/quiz/manifest.json'
];

// Quiz data — cached on first access (cache-first)
const DATA_PATHS = [
  '/quiz/Persian/', '/quiz/German/', '/quiz/Spanish/',
  '/quiz/Korean/', '/quiz/Turkish/', '/quiz/Arabic/',
  '/quiz/English/', '/quiz/Rust/', '/quiz/CPP/'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // JSON quiz data: cache-first
  const isData = DATA_PATHS.some(p => url.pathname.startsWith(p)) && url.pathname.endsWith('.json');
  if (isData) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // App shell: network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
