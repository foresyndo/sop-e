const CACHE_NAME = "sop-kontraktor-pro-pwa-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "https://img.icons8.com/color/192/000000/engineering.png",
  "https://img.icons8.com/color/512/000000/engineering.png"
];

// Install event - caching the shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Pre-caching static assets");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate event - clearing old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service Worker: Clearing Old Cache", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serving assets and falling back to cache
self.addEventListener("fetch", (event) => {
  // Only handle standard GET requests
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  // Ignore WebSockets or browser-extension internal protocols
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Handle local API endpoints fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch((err) => {
        console.warn("API request failed due to offline status:", url.pathname);
        return new Response(
          JSON.stringify({
            error: "Koneksi Anda offline. Fitur AI membutuhkan akses internet.",
            offline: true
          }),
          {
            headers: { "Content-Type": "application/json" }
          }
        );
      })
    );
    return;
  }

  // Network-First with Cache Fallback strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache success responses dynamically
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network is unavailable
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If a navigable page/document (like navigation or routing) fails, return the root page
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Konten tidak tersedia secara offline.", {
            status: 503,
            statusText: "Service Unavailable"
          });
        });
      })
  );
});
