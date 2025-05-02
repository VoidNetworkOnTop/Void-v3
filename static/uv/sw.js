/global UVServiceWorker,__uv$config/
/*
 * Optimized service worker script for Ultraviolet proxy
 * Features improved performance, caching, and compatibility
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Enhanced configuration
const CONFIG = {
  FETCH_TIMEOUT: 60000,          // 60 second timeout for slow connections
  CACHE_NAME: 'uv-cache-v1',     // Cache storage name
  CACHE_EXPIRY: 3600000,         // Cache expiry (1 hour)
  MAX_RETRIES: 2,                // Maximum retry attempts
  RETRY_DELAY: 1000,             // Delay between retries
  CACHE_EXEMPTIONS: [            // URLs that shouldn't be cached
    'login', 'signin', 'signup', 'auth', 'oauth', 'account',
    'session', 'token', 'checkout', 'payment', 'purchase'
  ]
};

// Initialize cache
self.addEventListener('install', event => {
  console.log('[UV Service Worker] Installed');
  self.skipWaiting();
});

// Clean up old caches when activated
self.addEventListener('activate', event => {
  console.log('[UV Service Worker] Activated');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('uv-cache-') && cacheName !== CONFIG.CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => clients.claim())
  );
});

// Enhanced fetch with timeout, retries and better error handling
const fetchWithRetry = async (request, retries = CONFIG.MAX_RETRIES) => {
  try {
    // Try to fetch with timeout
    return await Promise.race([
      sw.fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), CONFIG.FETCH_TIMEOUT)
      )
    ]);
  } catch (error) {
    // Retry logic
    if (retries > 0) {
      console.log(`[UV Service Worker] Retrying fetch (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      return fetchWithRetry(request, retries - 1);
    }
    throw error;
  }
};

// Determine if a request should be cached
const shouldCache = (request, response) => {
  // Don't cache non-GET requests
  if (request.method !== 'GET') return false;
  
  // Don't cache if response isn't successful
  if (!response || response.status !== 200) return false;
  
  // Don't cache sensitive URLs
  const url = request.url.toLowerCase();
  if (CONFIG.CACHE_EXEMPTIONS.some(term => url.includes(term))) return false;
  
  // Only cache specific content types
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('text/html') || 
         contentType.includes('text/css') || 
         contentType.includes('application/javascript') ||
         contentType.includes('image/') ||
         contentType.includes('font/') ||
         contentType.includes('application/font');
};

// Main fetch event handler
self.addEventListener('fetch', event => {
  // Only handle requests in our scope
  if (!event.request.url.includes('/uv/service/')) {
    return;
  }

  // Clone the request for potential caching
  const requestClone = event.request.clone();

  event.respondWith((async () => {
    try {
      // Check cache first
      const cache = await caches.open(CONFIG.CACHE_NAME);
      const cachedResponse = await cache.match(event.request);
      
      if (cachedResponse) {
        // Return cached response if we have it
        console.log('[UV Service Worker] Serving from cache');
        return cachedResponse;
      }
      
      // Fetch from network with retries
      const response = await fetchWithRetry(event.request);
      const responseClone = response.clone();
      
      // Cache if appropriate
      if (shouldCache(requestClone, response)) {
        try {
          await cache.put(requestClone, responseClone);
          console.log('[UV Service Worker] Cached response');
          
          // Set expiry for this cache entry
          setTimeout(async () => {
            try {
              const cache = await caches.open(CONFIG.CACHE_NAME);
              await cache.delete(requestClone);
              console.log('[UV Service Worker] Expired cache entry removed');
            } catch (err) {
              console.error('[UV Service Worker] Error removing expired cache:', err);
            }
          }, CONFIG.CACHE_EXPIRY);
        } catch (err) {
          console.error('[UV Service Worker] Error caching response:', err);
        }
      }
      
      // Add performance optimization headers
      const enhancedHeaders = new Headers(response.headers);
      
      // Return the response
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: enhancedHeaders
      });
    } catch (err) {
      console.error('[UV Service Worker] Error in fetch:', err);
      
      // Return friendly error page
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Connection Error</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: white;
              background: #222;
              margin: 0;
              padding: 20px;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: #333;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            h2 {
              margin-top: 0;
              color: #4a6ed3;
            }
            ul {
              margin-bottom: 20px;
            }
            button {
              padding: 10px 16px;
              background: #4a6ed3;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              margin-right: 10px;
              font-size: 14px;
            }
            button.secondary {
              background: #555;
            }
            button:hover {
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Connection Error</h2>
            <p>The service encountered an error: ${err.message}</p>
            <p>This might be due to:</p>
            <ul>
              <li>Slow or unstable internet connection</li>
              <li>The website being temporarily unavailable</li>
              <li>The website using features that require direct access</li>
            </ul>
            <div>
              <button onclick="window.location.reload()">Try Again</button>
              <button class="secondary" onclick="window.history.back()">Go Back</button>
            </div>
          </div>
        </body>
        </html>`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }
  })());
});

// Handle messages from clients
self.addEventListener('message', event => {
  // Handle skip waiting
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Handle cache clearing
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CONFIG.CACHE_NAME).then(() => {
      if (event.source) {
        event.source.postMessage({
          type: 'CACHE_CLEARED',
          timestamp: Date.now()
        });
      }
    });
  }

  // Handle ping/health check
  if (event.data && event.data.type === 'PING') {
    if (event.source) {
      event.source.postMessage({
        type: 'PONG',
        timestamp: Date.now(),
        status: 'healthy'
      });
    }
  }
});
