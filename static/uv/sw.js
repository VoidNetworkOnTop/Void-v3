/*global UVServiceWorker,__uv$config*/
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// VERSION - CHANGE THIS WHEN YOU UPDATE YOUR SITE
const CACHE_VERSION = 'v1.1.2';

// Simplified configuration
const CONFIG = {
  CACHE_NAME: `site-cache-${CACHE_VERSION}`,
  TIMEOUT: 10000 // 10 seconds timeout
};

// Cache everything strategy
self.addEventListener('install', event => {
  console.log('[SW] Installing new version:', CACHE_VERSION);
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CONFIG.CACHE_NAME).then(cache => {
      console.log('[SW] Opened cache');
      
      // If you want to precache specific files, add them here
      return cache.addAll([
        '/',
        '/ga',
        '/app',
        '/learn',
        '/credits',
        '/settings',
        '/chat',
        '/voidgpt',
        '/uv/uv.bundle.js',
        '/uv/uv.config.js',
        '/uv/uv.sw.js'
      ]).catch(err => {
        console.warn('[SW] Precache failed for some resources:', err);
      });
    })
  );
});

// Clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating');
  
  event.waitUntil(
    Promise.all([
      // Claim all clients immediately
      clients.claim(),
      
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // Delete caches that don't match current version
              return cacheName.startsWith('site-cache-') && 
                     cacheName !== CONFIG.CACHE_NAME;
            })
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
    ])
  );
});

// Fetch strategy: Cache-first for most resources, network-first for important updates
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-HTTP/HTTPS requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle UV proxy requests
  if (sw.shouldRoute(event.request)) {
    event.respondWith(sw.fetch(event));
    return;
  }
  
  // Network-first strategy for certain files to ensure updates show up
  const isNetworkFirst = 
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    url.pathname.endsWith('.json') ||
    url.pathname.includes('api/') ||
    url.searchParams.has('nocache');
  
  if (isNetworkFirst) {
    // Network-first strategy
    event.respondWith(
      fetch(event.request.clone(), { cache: 'no-cache' })
        .then(response => {
          if (response.ok) {
            // Clone the response before caching
            const responseToCache = response.clone();
            caches.open(CONFIG.CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first strategy for everything else
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          // Cache hit - return the cached version
          return response;
        }
        
        // Cache miss - fetch from network
        return fetch(event.request).then(fetchResponse => {
          // Check if we received a valid response
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type === 'error') {
            return fetchResponse;
          }
          
          // Clone the response to store it in the cache
          const responseToCache = fetchResponse.clone();
          
          caches.open(CONFIG.CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return fetchResponse;
        });
      })
    );
  }
});

// Handle messages
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Clear all caches
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0]?.postMessage({ type: 'CACHE_CLEARED' });
    });
  }
});

// Log when service worker is running
console.log('[SW] Service Worker loaded - Version:', CACHE_VERSION);
