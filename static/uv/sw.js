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

// Standard fetch handler with a better fallback mechanism
self.addEventListener('fetch', event => {
  // Only handle requests in our scope
  if (!event.request.url.startsWith(self.registration.scope)) {
    return;
  }

  // Handle fetch with error recovery
  event.respondWith(
    (async () => {
      try {
        // First try the normal UV handling
        const response = await sw.fetch(event);
        
        // Check if the response is valid
        if (response && response.status === 200) {
          // For HTML responses, verify they actually have content
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            // Clone the response so we can check its content
            const clone = response.clone();
            const text = await clone.text();
            
            // If the HTML content is too small, it might be an error page
            if (text.length < 100) {
              console.log('[UV Service Worker] Response too small, trying direct fetch');
              // Try a direct fetch as fallback
              return fetch(event.request);
            }
          }
          return response;
        } else {
          // If UV returns an error response (not 200), try direct fetch
          console.log(`[UV Service Worker] Non-200 response (${response.status}), trying direct fetch`);
          return fetch(event.request);
        }
      } catch (err) {
        // Log the error for debugging
        console.error('[UV Service Worker] Error in fetch:', err);
        
        // Try a direct fetch as the fallback option
        return fetch(event.request).catch(fetchErr => {
          console.error('[UV Service Worker] Direct fetch also failed:', fetchErr);
          
          // If all else fails, return a custom error page
          return new Response(
            `<html><body>
              <h1>Error loading content</h1>
              <p>The proxy service encountered an error. Please try reloading.</p>
              <button onclick="window.location.reload()">Reload</button>
            </body></html>`,
            {
              status: 500,
              headers: { 'Content-Type': 'text/html' }
            }
          );
        });
      }
    })()
  );
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

// Add message listener
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
