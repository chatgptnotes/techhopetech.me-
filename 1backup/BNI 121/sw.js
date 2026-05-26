// BNI 121 — service worker. Network-first for HTML & API; cache-first for assets.
const VERSION = 'bni-v2';
const CORE = [
  '/bni/dashboard.html',
  '/bni/tracker.html',
  '/bni/contact.html',
  '/bni/teams.html',
  '/bni/referrals.html',
  '/bni/members-met.html',
  '/bni/templates.html',
  '/bni/zoom-completed.html',
  '/bni/scheduler.html',
  '/bni/followup.html',
  '/bni/bni-sidebar.js',
  '/bni/supabase-config.js',
  '/bni/auth-guard.js',
  '/bni/manifest.json',
  '/bni/bni-logo.jpg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE).catch(() => null)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Don't cache Supabase API or Anthropic — must always be live.
  if (url.host.includes('supabase.co') || url.host.includes('api.anthropic.com')) return;
  if (e.request.method !== 'GET') return;

  // Network-first for navigations, cache fallback when offline.
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('/bni/dashboard.html')))
    );
    return;
  }

  // Cache-first for assets (images, scripts, styles).
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(net => {
      const copy = net.clone();
      caches.open(VERSION).then(c => c.put(e.request, copy));
      return net;
    }).catch(() => r))
  );
});
