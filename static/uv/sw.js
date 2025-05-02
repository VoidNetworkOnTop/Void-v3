/*global UVServiceWorker,__uv$config*/
/*
 * Enhanced service worker script for Void Network.
 * Improved error handling and timeout support for slow devices.
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Configuration
const FETCH_TIMEOUT = 50000; // Increased from 40 to 50 seconds timeout for slow connections
const MIN_HTML_SIZE = 800; // Increased from 500 to 800 bytes for more reliable content detection

// Log initialization
console.log('[UV Service Worker] Initializing with scope: /uv/');

// Add timeout to fetch operations
const timeoutFetch = async (request, timeout) => {
  return Promise.race([
    sw.fetch(request),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

// Enhanced fetch handler with timeout and better error handling
self.addEventListener('fetch', event => {
  // Only handle requests in our scope
  if (!event.request.url.includes('/uv/service/')) {
    return;
  }

  event.respondWith((async () => {
    try {
      // Try with timeout
      const response = await timeoutFetch(event, FETCH_TIMEOUT);
      
      // For successful responses, check content
      if (response && response.status === 200) {
        const contentType = response.headers.get('content-type');
        
        // For HTML responses, verify content length
        if (contentType && contentType.includes('text/html')) {
          // Clone to check content
          const clone = response.clone();
          const text = await clone.text();
          
          // If no substantial content, return error page
          if (text.length < MIN_HTML_SIZE) {
            console.log('[UV Service Worker] Empty or minimal content detected');
            return new Response(
              `<html><body style="font-family: sans-serif; color: white; background: #222; margin: 0; padding: 20px;">
                <h2>Page Content Error</h2>
                <p>The requested page loaded but has insufficient content.</p>
                <p>URL: ${event.request.url}</p>
                <p>This might be because:</p>
                <ul>
                  <li>The site is blocking proxy access</li>
                  <li>The site requires JavaScript that isn't running in the proxy</li>
                  <li>The site has anti-bot protection</li>
                </ul>
                <button onclick="window.location.reload()" style="padding: 10px; background: #4a6ed3; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Retry</button>
                <button onclick="window.history.back()" style="padding: 10px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">Go Back</button>
              </body></html>`,
              {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
              }
            );
          }
          
          // Add a script to notify the parent page when the game is ready
          if (text.includes('<body') && !text.includes('GAME_READY')) {
            const modifiedText = text.replace(
              '<body',
              `<body><script>
                try {
                  // Notify parent when game content is fully loaded
                  window.addEventListener('load', function() {
                    // Wait a bit for resources to actually render
                    setTimeout(function() {
                      if (window.parent && window.parent !== window) {
                        window.parent.postMessage({ type: 'GAME_READY' }, '*');
                      }
                    }, 1000);
                  });
                } catch(e) {
                  // Silently fail
                }
              </script>`
            );
            
            return new Response(modifiedText, {
              status: 200,
              headers: response.headers
            });
          }
        }
        
        return response;
      }
      
      // For error responses, create helpful error page
      console.log(`[UV Service Worker] Non-success response: ${response ? response.status : 'unknown'}`);
      return new Response(
        `<html><body style="font-family: sans-serif; color: white; background: #222; margin: 0; padding: 20px;">
          <h2>Proxy Error</h2>
          <p>The proxy received a ${response ? response.status : 'unknown'} response.</p>
          <p>This might be because:</p>
          <ul>
            <li>The site is blocking proxy access</li>
            <li>The connection is too slow</li>
            <li>The site is temporarily unavailable</li>
          </ul>
          <div style="margin-top: 20px;">
            <button onclick="window.location.reload()" style="padding: 10px; background: #4a6ed3; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Retry</button>
            <button onclick="window.history.back()" style="padding: 10px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">Go Back</button>
          </div>
        </body></html>`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    } catch (err) {
      console.error('[UV Service Worker] Error in fetch:', err);
      
      // Return a user-friendly error page
      return new Response(
        `<html><body style="font-family: sans-serif; color: white; background: #222; margin: 0; padding: 20px;">
          <h2>Connection Error</h2>
          <p>The proxy service encountered an error: ${err.message}</p>
          <p>This often happens when:</p>
          <ul>
            <li>Your internet connection is slow or unstable</li>
            <li>The site is blocking proxy access</li>
            <li>The site is temporarily down</li>
          </ul>
          <div style="margin-top: 20px;">
            <button onclick="window.location.reload()" style="padding: 10px; background: #4a6ed3; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Reload</button>
            <button onclick="window.history.back()" style="padding: 10px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">Go Back</button>
          </div>
        </body></html>`,
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
        timestamp: Date.now()
      });
    }
  }
});