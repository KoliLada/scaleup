/* ==========================================================================
   Innercraft Meditation — Service Worker
   Cacht App-Dateien und Gongs für die Offline-Nutzung.
   Die Journey-Definition (journey.json) kommt immer zuerst vom Netz,
   damit Änderungen des Autors sofort bei allen Nutzern ankommen.
   ========================================================================== */

"use strict";

const CACHE_NAME = "innercraft-meditation-v5";

const PRECACHE_URLS = [
  "./",
  "index.html",
  "app.css",
  "app.js",
  "i18n.js",
  "journey.js",
  "manifest.webmanifest",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "audio/gong.wav",
  "audio/gong-deep.wav",
  "audio/gong-deepest.wav",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Nur eigene GET-Anfragen behandeln (keine Google Fonts, keine GitHub-API)
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;

  // Journey-Definitionen (alle Sprachen): immer Netz zuerst,
  // Cache nur als Offline-Fallback
  if (/\/journey[^/]*\.json$/.test(url.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request, { ignoreSearch: true }))
    );
    return;
  }

  // Übrige Audio-Dateien (Meditation, Anweisungen, Gongs): Cache zuerst,
  // sonst Netz + nachträglich cachen — die Dateinamen ändern sich bei
  // jeder Veröffentlichung, daher ist Cache-First hier sicher.
  if (url.pathname.includes("/audio/")) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // App-Dateien: Netz zuerst (damit Updates ankommen), Cache als Fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
