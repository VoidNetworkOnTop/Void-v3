/*global UVServiceWorker,__uv$config*/
/*
 * Modified service worker script for Void Network.
 * This is designed to work properly with the scope limitations.
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Important: Log what's happening to help with debugging
console.log('[UV Service Worker] Initializing with scope: /uv/');

// Standard fetch handler
self.addEventListener('fetch', event => {
  try {
    // Attempt to handle all requests through UV
    event.respondWith(sw.fetch(event));
  } catch (err) {
    console.error('[UV Service Worker] Error handling request:', err);
    // Let the browser handle it normally if there's an error
    return;
  }
});

// Add listeners for install and activate events
self.addEventListener('install', event => {
  console.log('[UV Service Worker] Installed');
  // Skip waiting to become active immediately
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[UV Service Worker] Activated');
  // Claim clients to control pages immediately
  event.waitUntil(clients.claim());
});
