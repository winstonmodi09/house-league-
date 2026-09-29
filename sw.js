const CACHE_NAME = "house-league-v1";
const CORE_ASSETS = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for navigation/API calls, cache-first fallback for offline resilience.
// Firebase calls (firestore.googleapis.com, gstatic.com) are always fetched live -
// we never want to serve stale game data from cache.
self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (url.includes("googleapis.com") || url.includes("gstatic.com") || url.includes("firebaseio.com")) {
    return; // let these go straight to network, untouched
  }
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
