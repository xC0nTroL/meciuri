// Service worker: păstrează aplicația în cache ca să se deschidă și fără semnal.
// Datele (Supabase, Apps Script) merg mereu la rețea; ultima listă e salvată de aplicație.
const CACHE = 'meciuri-v3';
const SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // doar fișierele aplicației și fonturile/bibliotecile — network first, cu rezervă din cache
  const sameOrigin = url.origin === self.location.origin;
  const asset = sameOrigin || url.hostname.endsWith('jsdelivr.net') ||
                url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com');
  if (!asset) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
