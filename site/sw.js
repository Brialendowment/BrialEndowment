// Brial Endowment service worker — offline resilience.
// Navigations: network-first (fresh deploys win), cached shell when offline.
// Static assets (fonts, CDN scripts, Supabase images): stale-while-revalidate.
const VER = "brial-v3";
const SHELL = "/";
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VER).then(c => c.add(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // never cache Supabase REST/auth data — only storage objects (images)
  const isData = url.hostname.endsWith("supabase.co") && !url.pathname.startsWith("/storage/v1/object/public/");
  if (isData) return;
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => {
        // only the home page is the offline shell; other pages (e.g. /impact) are never stored under "/"
        if (url.pathname === "/" && res.ok) { const copy = res.clone(); caches.open(VER).then(c => c.put(SHELL, copy)).catch(() => {}); }
        return res;
      }).catch(() => caches.match(url.pathname === "/" ? SHELL : req).then(hit => hit || caches.match(SHELL)))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.status === 200 && (res.type === "basic" || res.type === "cors")) {
          const copy = res.clone();
          caches.open(VER).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
