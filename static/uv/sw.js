/*global UVServiceWorker,__uv$config*/
/*
 * Enhanced service worker script for Void Network.
 * This improved version includes proper error handling, retries,
 * and better cache management to prevent black screens.
 */

// Import required dependencies
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();
console.log('[UV Service Worker] Initializing with scope: /uv/');

// Enhanced fetch handler with retries
self.addEventListener('fetch', event => {
  // Maximum number of retry attempts
  const MAX_RETRIES = 3;
  
  // Function to handle fetch with retry
  const fetchWithRetry = async (request, retryCount = 0) => {
    try {
      // Try to process the request through Ultraviolet
      return await sw.fetch(event);
    } catch (err) {
      console.error(`[UV Service Worker] Error handling request (attempt ${retryCount + 1}):`, err);
      
      // If we have retries left, try again
      if (retryCount < MAX_RETRIES) {
        console.log(`[UV Service Worker] Retrying request (${retryCount + 1}/${MAX_RETRIES})...`);
        // Add slight delay before retry to allow network conditions to change
        await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
        return fetchWithRetry(request, retryCount + 1);
      }
      
      // If all retries failed, check if request is for a game frame
      const url = new URL(request.url);
      const isGameFrame = url.pathname.includes('Classes.html') || 
                          request.referrer.includes('Classes.html');
      
      if (isGameFrame) {
        // For game frames, return a useful error page
        console.error('[UV Service Worker] Game frame failed to load after all retries');
        return new Response(
          `<html><body style="background:#000; color:#fff; font-family:sans-serif; padding:20px; text-align:center;">
           <h1>Game loading error</h1>
           <p>The game couldn't be loaded through the proxy. This may be due to:</p>
           <ul style="list-style:none; padding:0;">
             <li>• Temporary network issues</li>
             <li>• Server blocking the proxy</li>
             <li>• Service worker cache conflicts</li>
           </ul>
           <div style="margin-top:30px;">
             <button onclick="window.location.reload(true)" style="background:#5865f2; color:white; border:none; padding:10px 20px; margin:10px; border-radius:5px; cursor:pointer;">Hard Refresh</button>
             <button onclick="window.location='/index.html'" style="background:#36393f; color:white; border:none; padding:10px 20px; margin:10px; border-radius:5px; cursor:pointer;">Back to Games</button>
           </div>
           <p style="margin-top:20px; font-size:12px; opacity:0.7;">Error ID: SW-${Date.now().toString(36)}</p>
           </body></html>`,
          {
            status: 500,
            headers: { 'Content-Type': 'text/html' }
          }
        );
      } else {
        // For other requests, let the browser handle the error
        console.error('[UV Service Worker] Non-game request failed after all retries');
        return fetch(request).catch(() => {
          return new Response('Network error', { status: 500 });
        });
      }
    }
  };
  
  // Use the retry mechanism for all requests
  event.respondWith(fetchWithRetry(event.request));
});

// Enhanced installation event - clear old caches
self.addEventListener('install', event => {
  console.log('[UV Service Worker] Installing new service worker version');
  
  // Skip waiting to become active immediately
  self.skipWaiting();
  
  // Clear old caches during installation
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          // Filter for UV related caches
          return cacheName.includes('uv-') || cacheName.includes('ultraviolet-');
        }).map(cacheName => {
          console.log('[UV Service Worker] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[UV Service Worker] Successfully installed and cleared old caches');
    })
  );
});

// Enhanced activation event
self.addEventListener('activate', event => {
  console.log('[UV Service Worker] Activating new service worker version');
  
  // Claim clients to control pages immediately
  event.waitUntil(
    clients.claim().then(() => {
      console.log('[UV Service Worker] Successfully claimed all clients');
      
      // Notify all clients that the service worker has been updated
      return clients.matchAll().then(clients => {
        return Promise.all(
          clients.map(client => {
            return client.postMessage({
              type: 'SW_ACTIVATED',
              timestamp: Date.now()
            });
          })
        );
      });
    })
  );
});

// Comprehensive message handler
self.addEventListener('message', event => {
  console.log('[UV Service Worker] Received message:', event.data?.type);
  
  if (!event.data) return;
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => {
              console.log('[UV Service Worker] Clearing cache:', cacheName);
              return caches.delete(cacheName);
            })
          );
        }).then(() => {
          console.log('[UV Service Worker] All caches cleared successfully');
          // Respond to the client
          if (event.source) {
            event.source.postMessage({
              type: 'CACHE_CLEARED',
              success: true,
              timestamp: Date.now()
            });
          }
        }).catch(error => {
          console.error('[UV Service Worker] Error clearing caches:', error);
          // Notify client of failure
          if (event.source) {
            event.source.postMessage({
              type: 'CACHE_CLEARED',
              success: false,
              error: error.message,
              timestamp: Date.now()
            });
          }
        })
      );
      break;
      
    case 'PING':
      // Health check ping
      if (event.source) {
        event.source.postMessage({
          type: 'PONG',
          timestamp: Date.now()
        });
      }
      break;
      
    case 'CLEAR_GAME_CACHE':
      // Selective game cache clearing
      if (event.data.gameUrl) {
        const gameUrlPattern = new URL(event.data.gameUrl).hostname;
        event.waitUntil(
          caches.keys().then(cacheNames => {
            return Promise.all(
              cacheNames.map(cacheName => {
                return caches.open(cacheName).then(cache => {
                  return cache.keys().then(requests => {
                    const gameRequests = requests.filter(request => 
                      request.url.includes(gameUrlPattern)
                    );
                    
                    return Promise.all(
                      gameRequests.map(request => cache.delete(request))
                    );
                  });
                });
              })
            );
          }).then(() => {
            console.log(`[UV Service Worker] Cache cleared for game: ${gameUrlPattern}`);
            if (event.source) {
              event.source.postMessage({
                type: 'GAME_CACHE_CLEARED',
                gameUrl: event.data.gameUrl,
                success: true,
                timestamp: Date.now()
              });
            }
          })
        );
      }
      break;
  }
});

// Add periodic maintenance
setInterval(() => {
  // Clean up any problematic caches periodically
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      // Check for corrupted or problematic caches
      caches.open(cacheName).then(cache => {
        cache.keys().then(keys => {
          if (keys.length > 5000) {
            // Cache is too large, clear it
            console.log(`[UV Service Worker] Cache ${cacheName} has too many entries (${keys.length}), clearing it`);
            caches.delete(cacheName);
          }
        }).catch(err => {
          // Cache might be corrupted
          console.error(`[UV Service Worker] Error accessing cache ${cacheName}, deleting it:`, err);
          caches.delete(cacheName);
        });
      });
    });
  });
}, 1000 * 60 * 60); // Run every hour
