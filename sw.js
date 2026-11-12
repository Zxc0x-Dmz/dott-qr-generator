// Keeps the app working with no internet. The HTML page is network-first, so when online
// you always get the latest version; icons/manifest stay cache-first. Bump VERSION each release.
const VERSION = "dott-qr-1.64";
const FILES = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const isDoc = req.mode === "navigate" || req.destination === "document";
  if (isDoc) {
    // Network-first: fresh page when online, cached page when offline.
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put("index.html", copy)).catch(() => {});
        return res;
      }).catch(() => caches.match("index.html").then(h => h || caches.match("./")))
    );
    return;
  }
  event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
