const CACHE = "dieta-a-dois-v2";
const SHELL = ["./", "index.html", "config.js", "exercises.js", "exercises.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Rede primeiro, cache como reserva. Os dados (Supabase) nunca passam pelo cache.
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  const ok = u.origin === location.origin || ["cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com", "raw.githubusercontent.com"].includes(u.hostname);
  if (!ok) return;
  e.respondWith(
    fetch(r)
      .then((res) => {
        if (res && (res.ok || res.type === "opaque")) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(r, copy));
        }
        return res;
      })
      .catch(() => caches.match(r).then((m) => m || caches.match("index.html")))
  );
});
