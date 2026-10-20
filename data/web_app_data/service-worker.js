const CACHE = 'runner-starter-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', '../ui_data/ui.css', '../player_data/player.css', '../player_data/player.js', '../player_data/player-sprites.svg'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));
