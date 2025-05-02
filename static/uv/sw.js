/*global UVServiceWorker,__uv$config*/
/*
 * Enhanced service worker script for Void Network.
 * Minimal fix focused on TikTok and avoiding false errors.
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Configuration
const FETCH_TIMEOUT = 50000; // 50 seconds timeout for slow connections
const MIN_HTML_SIZE = 100; // Reduced from 800 to 100 bytes

// TikTok mobile user agent that works well
const TIKTOK_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';

// Log initialization
console.log('[UV Service Worker] Initializing with scope: /uv/');

// Add timeout to fetch operations (using exact original code)
const timeoutFetch = async (request, timeout) => {
  return Promise.race([
    sw.fetch(request),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

// Check if URL is for TikTok
function isTikTok(url) {
  const hostname = new URL(url).hostname.toLowerCase();
  return hostname.includes('tiktok.com');
}

// Enhanced fetch handler with timeout and better error handling
self.addEventListener('fetch', event => {
  // Only handle requests in our scope
  if (!event.request.url.includes('/uv/service/')) {
    return;
  }

  event.respondWith((async () => {
    try {
      // Special handling for TikTok
      let modifiedRequest = event.request;
      
      if (isTikTok(event.request.url)) {
        // Create a new request with TikTok-specific headers
        const headers = new Headers(event.request.headers);
        headers.set('User-Agent', TIKTOK_UA);
        headers.set('Accept-Language', 'en-US,en;q=0.9');
        
        modifiedRequest = new Request(event.request, {
          headers: headers
        });
      }
      
      // Try with timeout
      const response = await timeoutFetch(modifiedRequest, FETCH_TIMEOUT);
      
      // For successful responses, check content
      if (response && response.status === 200) {
        const contentType = response.headers.get('content-type');
        
        // Skip content check for TikTok
        if (isTikTok(event.request.url)) {
          return response;
        }
        
        // For HTML responses, verify content length
        if (contentType && contentType.includes('text/html')) {
          // Clone to check content
          const clone = response.clone();
          const text = await clone.text();
          
          // If no substantial content, return error page (with reduced threshold)
          if (text.length < MIN_HTML_SIZE) {
            console.log('[UV Service Worker] Empty or minimal content detected');
            // Return the original response instead of an error page
            return response;
          }
          
          // Add a script to notify the parent page when the game is ready
          if (text.includes('<body') && !text.includes('GAME_READY')) {
            const modifiedText = text.replace(
              '<body',
              `<body><script>
                try {
                  // Hide bot detection flags
                  Object.defineProperty(navigator, 'webdriver', { get: () => false });
                  
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
      
      // For error responses, create helpful error page with less specific messaging
      console.log(`[UV Service Worker] Non-success response: ${response ? response.status : 'unknown'}`);
      return new Response(
        `<html><body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Connection Issue</h2>
          <p>The site couldn't be reached.</p>
          <p>This might be temporary - please try again.</p>
          <div style="margin-top: 20px;">
            <button onclick="window.location.reload()" style="padding: 8px 16px; background: #4a6ed3; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Reload</button>
            <button onclick="window.history.back()" style="padding: 8px 16px; background: #f0f0f0; color: #333; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">Go Back</button>
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
        `<html><body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Connection Issue</h2>
          <p>The connection to the site couldn't be established.</p>
          <div style="margin-top: 20px;">
            <button onclick="window.location.reload()" style="padding: 8px 16px; background: #4a6ed3; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Try Again</button>
            <button onclick="window.history.back()" style="padding: 8px 16px; background: #f0f0f0; color: #333; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">Go Back</button>
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