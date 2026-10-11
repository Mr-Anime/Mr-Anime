/* Mr.Anime service worker — installable PWA shell + image/static caching. */

const VERSION = "mr-anime-v1";
const PRECACHE = `${VERSION}-precache`;
const RUNTIME = `${VERSION}-runtime`;
const PAGES = `${VERSION}-pages`;

const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const IMAGE_HOSTS = new Set([
  "s4.anilist.co",
  "image.tmdb.org",
  "i.ytimg.com",
  "img.youtube.com",
  "cdn-icons-png.flaticon.com",
]);

const MAX_RUNTIME_ENTRIES = 160;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    if (request.mode === "navigate") return; // cross-origin nav: browser default
    if (IMAGE_HOSTS.has(url.hostname)) {
      event.respondWith(imageStrategy(request));
    }
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(pageStrategy(request));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/favicon.ico"
  ) {
    event.respondWith(cacheFirst(request, RUNTIME));
    return;
  }

  // Everything else (pages, APIs, RSC payloads): network, no caching.
});

/** Navigations: network-first, cached page, then offline fallback. */
async function pageStrategy(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(PAGES);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response("You are offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

/** Cross-origin images: cache-first with background refresh. */
async function imageStrategy(request) {
  const cached = await caches.match(request);
  if (cached) {
    eventRefresh(request);
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === "opaque")) {
      const cache = await caches.open(RUNTIME);
      cache.put(request, response.clone()).catch(() => {});
      trimCache(RUNTIME, MAX_RUNTIME_ENTRIES);
    }
    return response;
  } catch {
    return new Response("", { status: 504 });
  }
}

function eventRefresh(request) {
  fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === "opaque")) {
        return caches.open(RUNTIME).then((cache) => cache.put(request, response));
      }
    })
    .catch(() => {});
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const excess = keys.length - maxEntries;
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i]);
  }
}
