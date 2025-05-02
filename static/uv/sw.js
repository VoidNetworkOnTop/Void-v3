/global UVServiceWorker,__uv$config/
/*
 * Optimized service worker script for Ultraviolet proxy
 * Enhanced compatibility with all website types
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Configuration
const CONFIG = {
  FETCH_TIMEOUT: 60000,        // 60 second timeout for slow connections
  MAX_RETRIES: 2,              // Maximum retry attempts
  RETRY_DELAY: 1000,           // Delay between retries
};

// Log initialization
console.log('[UV Service Worker] Initializing with proper scope');

// Enhanced fetch with timeout and retries
const fetchWithRetry = async (event, retries = CONFIG.MAX_RETRIES) => {
  try {
    // Try to fetch with timeout
    return await Promise.race([
      sw.fetch(event),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), CONFIG.FETCH_TIMEOUT)
      )
    ]);
  } catch (error) {
    console.error('[UV Service Worker] Fetch error:', error.message);
    
    // Retry logic
    if (retries > 0) {
      console.log(`[UV Service Worker] Retrying fetch (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      return fetchWithRetry(event, retries - 1);
    }
    throw error;
  }
};

// Main fetch event handler
self.addEventListener('fetch', event => {
  // IMPORTANT: Don't filter by URL pattern to ensure all UV requests work
  // Check if the request is in the UV scope based on the request URL
  if (!event.request.url.toString().startsWith(self.registration.scope)) {
    return;
  }

  // Respond to the fetch event
  event.respondWith((async () => {
    try {
      // Fetch from network with retries
      const response = await fetchWithRetry(event);
      
      // For HTML responses, check if we want to add any scripts
      if (response && response.headers.get('content-type')?.includes('text/html')) {
        const clone = response.clone();
        const text = await clone.text();
        
        // Only modify text if needed (add compatibility scripts)
        if (text.includes('<body') && !text.includes('UV_COMPATIBILITY')) {
          const modifiedText = text.replace(
            '<body',
            `<body><script data-id="UV_COMPATIBILITY">
              try {
                // Compatibility fixes for various sites
                window.addEventListener('load', function() {
                  // Fix for sites that check navigator properties
                  if (typeof Navigator !== 'undefined') {
                    const originalNavigator = Navigator.prototype;
                    if (originalNavigator) {
                      // Ensure proper user agent behavior
                      if (Object.getOwnPropertyDescriptor(originalNavigator, 'userAgent')) {
                        try {
                          // Make sure userAgent getter works properly
                          const ua = navigator.userAgent;
                        } catch(e) {}
                      }
                    }
                  }
                  
                  // Notify parent window when content is loaded
                  setTimeout(function() {
                    if (window.parent && window.parent !== window) {
                      window.parent.postMessage({ type: 'UV_PAGE_LOADED' }, '*');
                    }
                  }, 1000);
                });
              } catch(e) {
                // Silently fail to avoid breaking the page
                console.error('[UV Compatibility]', e);
              }
            </script>`
          );
          
          return new Response(modifiedText, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        }
      }
      
      return response;
    } catch (err) {
      console.error('[UV Service Worker] Fatal error in fetch handler:', err);
      
      // Return user-friendly error page
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
            .error-details {
              background: rgba(0,0,0,0.2);
              padding: 10px;
              border-radius: 4px;
              margin: 15px 0;
              font-family: monospace;
              word-break: break-all;
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
            <div class="error-details">
              Error: ${err.message}<br>
              URL: ${event.request.url.split('?')[0]}
            </div>
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

// Standard handlers
self.addEventListener('install', event => {
  console.log('[UV Service Worker] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[UV Service Worker] Activated');
  event.waitUntil(clients.claim());
});

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
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
