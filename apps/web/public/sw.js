// HealthOS Service Worker: speichert nur die App-Hülle und statische Dateien.
// API-Antworten, Supabase-Anfragen und Nutzerdaten werden nie zwischengespeichert.
const CACHE = 'healthos-shell-v1';
const SHELL = ['/', '/offline.html', '/manifest.webmanifest', '/icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return; // fremde Hosts (Supabase) nie anfassen
  if (e.request.mode === 'navigate') { e.respondWith(fetch(e.request).catch(() => caches.match('/offline.html'))); return; }
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || url.pathname.endsWith('.woff2')) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; })));
  }
});
