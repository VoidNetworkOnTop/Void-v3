/*global UVServiceWorker,__uv$config*/
/*
 * UV Service Worker - High Performance Edition
 * Optimized for reliability and performance under high load
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Configuration for optimal performance
const CONFIG = {
  FETCH_TIMEOUT: 120000,      // 2 minute timeout for slow connections
  RETRY_COUNT: 3,             // Increased number of retry attempts
  RETRY_DELAY: 1000,          // Initial delay between retries in ms
  ENABLE_CACHE: true,         // Enable resource caching
  CACHE_NAME: 'uv-game-cache', // Cache name for game resources
  MAX_CACHE_SIZE: 250,        // Maximum number of items to cache
  MAX_CACHE_AGE: 3600000 * 24, // Cache expiration (24 hours)
  
  // Resources that should be cached aggressively
  CACHE_PATTERNS: [
    '.js', '.css', '.woff', '.woff2', '.ttf', '.png', '.jpg', '.jpeg', '.gif', '.svg',
    'unity', 'webgl', 'game', '/assets/', '/static/'
  ],
  
  // URL patterns that should always bypass special handling
  BYPASS_PATTERNS: [
    '/bare/',
    '/uv/service/',
    '/service/'
  ]
};

// Initialize
console.log('[UV SW] High Performance Service Worker initializing');

// Add cache management
async function trimCache() {
  try {
    const cache = await caches.open(CONFIG.CACHE_NAME);
    const keys = await cache.keys();
    
    if (keys.length > CONFIG.MAX_CACHE_SIZE) {
      console.log(`[UV SW] Trimming cache: ${keys.length} items (max: ${CONFIG.MAX_CACHE_SIZE})`);
      
      // Sort by last accessed time (if available) or default to FIFO
      const deletionCount = keys.length - CONFIG.MAX_CACHE_SIZE;
      for (let i = 0; i < deletionCount; i++) {
        await cache.delete(keys[i]);
      }
    }
  } catch (err) {
    console.error('[UV SW] Cache trimming error:', err);
  }
}

// Clear expired cache entries
async function clearExpiredCache() {
  try {
    const cache = await caches.open(CONFIG.CACHE_NAME);
    const keys = await cache.keys();
    const now = Date.now();
    let deleted = 0;
    
    for (const request of keys) {
      const response = await cache.match(request);
      
      // Check for cache timestamp header
      if (response && response.headers) {
        const timestamp = parseInt(response.headers.get('x-cache-timestamp') || '0');
        
        if (timestamp && now - timestamp > CONFIG.MAX_CACHE_AGE) {
          await cache.delete(request);
          deleted++;
        }
      }
    }
    
    if (deleted > 0) {
      console.log(`[UV SW] Cleared ${deleted} expired cache entries`);
    }
  } catch (err) {
    console.error('[UV SW] Error clearing expired cache:', err);
  }
}

// Check if a URL should be bypassed (no special handling)
function shouldBypassUrl(url) {
  if (!url) return false;
  return CONFIG.BYPASS_PATTERNS.some(pattern => url.includes(pattern));
}

// Check if a URL should be cached
function shouldCacheUrl(url) {
  if (!url || !CONFIG.ENABLE_CACHE) return false;
  
  // Don't cache bypass URLs
  if (shouldBypassUrl(url)) return false;
  
  // Check against cache patterns
  return CONFIG.CACHE_PATTERNS.some(pattern => url.includes(pattern));
}

// Detect game content for special handling
function isGameContent(url) {
  if (!url || shouldBypassUrl(url)) return false;
  
  // Common game keywords
  const gamePatterns = [
    'unity', 'unitycdn', 'webgl', 'game', 'games', 'play',
    '3d', 'canvas', 'html5', 'arcade', 'gitlab.io', 
    'github.io', 'poki.com', 'crazy', 'y8.com', 'fnaf',
    'five-night', 'minecraft', 'slope', '1v1.lol'
  ];
  
  return gamePatterns.some(pattern => url.toLowerCase().includes(pattern));
}

// Inject WebGL and canvas fixes for games
async function injectGameFixes(response, url) {
  // Only process HTML responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('text/html')) {
    return response;
  }
  
  try {
    const text = await response.text();
    
    // Skip UV configuration data
    if (text.includes('__uv$config') || text.includes('__uv$bareData')) {
      return new Response(text, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }
    
    // Create modified HTML with our fixes
    let modifiedHtml = text;
    
    // Add WebGL fixes to head
    if (modifiedHtml.includes('<head')) {
      const headInsertPos = modifiedHtml.indexOf('<head') + '<head'.length;
      const headEndPos = modifiedHtml.indexOf('>', headInsertPos);
      
      if (headEndPos !== -1) {
        modifiedHtml = modifiedHtml.substring(0, headEndPos + 1) + `
        <script>
        (function() {
          // Fix WebGL detection
          window.hasWebGL = window.hasWebGL2 = window.isWebGLAvailable = function() { return true; };
          
          // Fix navigator user agent
          const originalUserAgent = navigator.userAgent;
          Object.defineProperty(navigator, 'userAgent', {
            get: function() { return originalUserAgent.replace(/Headless/g, ''); }
          });
          
          // Fix canvas getContext
          const originalGetContext = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
            // Fix zero-sized canvases
            if ((this.width === 0 || this.height === 0) && 
                ['webgl', 'experimental-webgl', 'webgl2'].includes(contextType)) {
              this.width = this.width || window.innerWidth * 0.8 || 800;
              this.height = this.height || window.innerHeight * 0.8 || 600;
            }
            
            // Optimize WebGL contexts
            if (['webgl', 'experimental-webgl', 'webgl2'].includes(contextType)) {
              contextAttributes = contextAttributes || {};
              contextAttributes.failIfMajorPerformanceCaveat = false;
              contextAttributes.powerPreference = 'high-performance';
              contextAttributes.preserveDrawingBuffer = true;
              
              const ctx = originalGetContext.call(this, contextType, contextAttributes);
              if (ctx) return ctx;
              
              // Try alternative contexts if primary fails
              for (const alt of ['webgl', 'experimental-webgl', 'webgl2'].filter(alt => alt !== contextType)) {
                try {
                  const ctx2 = originalGetContext.call(this, alt, contextAttributes);
                  if (ctx2) return ctx2;
                } catch (e) {}
              }
            }
            
            // Default fallback
            return originalGetContext.call(this, contextType, contextAttributes);
          };
        })();
        </script>
        ` + modifiedHtml.substring(headEndPos + 1);
      }
    }
    
    // Add visibility fixes before </body>
    if (modifiedHtml.includes('</body>')) {
      const bodyClosePos = modifiedHtml.indexOf('</body>');
      
      modifiedHtml = modifiedHtml.substring(0, bodyClosePos) + `
      <script>
      (function() {
        // Function to fix visibility issues
        function fixVisibility() {
          // Fix canvas visibility
          document.querySelectorAll('canvas').forEach(canvas => {
            if (canvas.style.display === 'none') canvas.style.display = 'block';
            if (canvas.style.visibility === 'hidden') canvas.style.visibility = 'visible';
            
            // Fix sizes
            if (canvas.width === 0 || canvas.height === 0) {
              canvas.width = canvas.width || window.innerWidth * 0.8 || 800;
              canvas.height = canvas.height || window.innerHeight * 0.8 || 600;
            }
          });
          
          // Fix game containers
          const containerSelectors = [
            '#unity-container', '#gameContainer', '#unityContainer', 
            '#canvas', '#game', '#unity-canvas', '#webgl-content',
            '[id*="unity"]', '[id*="game"]', '[id*="canvas"]'
          ];
          
          containerSelectors.forEach(selector => {
            try {
              document.querySelectorAll(selector).forEach(container => {
                if (container.style.display === 'none') container.style.display = 'block';
                if (container.style.visibility === 'hidden') container.style.visibility = 'visible';
              });
            } catch (e) {}
          });
          
          // Remove loading overlays
          document.querySelectorAll('[id*="loading"], [class*="loading"]').forEach(element => {
            if (element.offsetWidth > 200 && element.offsetHeight > 200) {
              if (element.id?.toLowerCase().includes('loading') || 
                  (typeof element.className === 'string' && element.className.toLowerCase().includes('loading'))) {
                element.style.display = 'none';
              }
            }
          });
        }
        
        // Setup Unity globals
        window.UnityLoader = window.UnityLoader || {
          instantiate: function(container, url, params) { return { SetFullscreen: function() {} }; },
          SystemInfo: { hasWebGL: true, mobile: false }
        };
        
        window.unityInstance = window.unityInstance || { SendMessage: function() {}, SetFullscreen: function() {} };
        window.unityShowBanner = window.unityShowBanner || function() {};
        window.unityProgress = window.unityProgress || function() {};
        
        // Run visibility fixes
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', fixVisibility);
          window.addEventListener('load', fixVisibility);
        } else {
          fixVisibility();
        }
        
        // Add delayed visibility fix for dynamic content
        setTimeout(fixVisibility, 1000);
        setTimeout(fixVisibility, 3000);
      })();
      </script>
      ` + modifiedHtml.substring(bodyClosePos);
    }
    
    // Create the modified response with a cache timestamp
    const modifiedHeaders = new Headers(response.headers);
    modifiedHeaders.set('x-cache-timestamp', Date.now().toString());
    
    return new Response(modifiedHtml, {
      status: response.status,
      statusText: response.statusText,
      headers: modifiedHeaders
    });
  } catch (error) {
    console.error('[UV SW] HTML modification error:', error);
    return response;
  }
}

// Enhanced fetch with retries and caching for better reliability
async function enhancedFetch(event, retries = CONFIG.RETRY_COUNT) {
  const url = new URL(event.request.url).toString();
  
  // Direct passthrough for bypass URLs
  if (shouldBypassUrl(url)) {
    return await sw.fetch(event);
  }
  
  // Look for cached response first if caching is enabled
  if (CONFIG.ENABLE_CACHE && shouldCacheUrl(url)) {
    try {
      const cache = await caches.open(CONFIG.CACHE_NAME);
      const cachedResponse = await cache.match(event.request);
      
      if (cachedResponse) {
        // Return cached response immediately, but update cache in background
        fetch(event.request.url, { 
          method: event.request.method, 
          headers: event.request.headers 
        })
        .then(freshResponse => {
          if (freshResponse && freshResponse.ok) {
            // Add cache timestamp
            const headers = new Headers(freshResponse.headers);
            headers.set('x-cache-timestamp', Date.now().toString());
            
            // Update cache with fresh response
            const clonedResponse = new Response(freshResponse.clone().body, {
              status: freshResponse.status,
              statusText: freshResponse.statusText,
              headers: headers
            });
            
            cache.put(event.request, clonedResponse);
          }
        })
        .catch(() => {}); // Ignore errors in background update
        
        return cachedResponse;
      }
    } catch (cacheError) {
      console.error('[UV SW] Cache error:', cacheError);
      // Continue to network request on cache error
    }
  }
  
  try {
    // Process through UV
    const response = await sw.fetch(event);
    
    // Cache the response if appropriate
    if (CONFIG.ENABLE_CACHE && shouldCacheUrl(url) && response.ok) {
      try {
        const cache = await caches.open(CONFIG.CACHE_NAME);
        
        // Add cache timestamp
        const headers = new Headers(response.headers);
        headers.set('x-cache-timestamp', Date.now().toString());
        
        // Clone the response for caching
        const clonedResponse = new Response(response.clone().body, {
          status: response.status,
          statusText: response.statusText,
          headers: headers
        });
        
        // Store in cache
        cache.put(event.request, clonedResponse);
        
        // Periodically trim cache
        if (Math.random() < 0.01) { // 1% chance
          trimCache();
          clearExpiredCache();
        }
      } catch (cacheError) {
        console.error('[UV SW] Error caching response:', cacheError);
      }
    }
    
    // For game content HTML, inject fixes
    if (isGameContent(url) && response.headers.get('content-type')?.includes('text/html')) {
      return await injectGameFixes(response, url);
    }
    
    return response;
  } catch (error) {
    console.error(`[UV SW] Fetch error: ${error.message}`);
    
    // Retry logic with exponential backoff
    if (retries > 0) {
      const delay = CONFIG.RETRY_DELAY * (CONFIG.RETRY_COUNT - retries + 1);
      console.log(`[UV SW] Retrying (${retries} attempts left) after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return enhancedFetch(event, retries - 1);
    }
    
    // Check cache once more after all retries failed
    if (CONFIG.ENABLE_CACHE) {
      try {
        const cache = await caches.open(CONFIG.CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          console.log('[UV SW] Returning stale cached response after failed retries');
          return cachedResponse;
        }
      } catch (e) {}
    }
    
    throw error;
  }
}

// Simplified error page
function createErrorPage(error) {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Game Loading Error</title>
      <style>
        body { font-family: Arial, sans-serif; color: white; background: #222; margin: 0; padding: 20px; text-align: center; }
        .container { max-width: 600px; margin: 40px auto; background: #333; border-radius: 8px; padding: 20px; }
        h2 { color: #f44336; margin-top: 0; }
        button { padding: 10px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Game Loading Error</h2>
        <p>The game couldn't be loaded. This may be due to network issues or temporarily high traffic.</p>
        <div>
          <button onclick="window.location.reload()">Try Again</button>
          <button onclick="window.location.href='/'">Go Home</button>
        </div>
      </div>
    </body>
    </html>
  `, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

// Main fetch handler
self.addEventListener('fetch', event => {
  // Only handle UV routes
  if (!event.request.url.startsWith(self.registration.scope) && 
      !event.request.url.includes('/uv/') &&
      !event.request.url.includes('/service/') &&
      !event.request.url.includes('/bare/')) {
    return;
  }

  event.respondWith((async () => {
    try {
      // Use our enhanced fetch with error handling
      return await enhancedFetch(event);
    } catch (err) {
      console.error('[UV SW] Fatal error:', err);
      
      // Only show error page for navigation requests
      if (event.request.mode === 'navigate') {
        return createErrorPage(err);
      }
      
      // Last resort - try basic fetch
      try {
        return await sw.fetch(event);
      } catch (finalError) {
        throw finalError;
      }
    }
  })());
});

// Install handler
self.addEventListener('install', event => {
  console.log('[UV SW] Installing optimized service worker...');
  
  // Pre-cache important resources
  if (CONFIG.ENABLE_CACHE) {
    event.waitUntil((async () => {
      try {
        const cache = await caches.open(CONFIG.CACHE_NAME);
        
        // Add commonly used scripts to the cache
        await cache.addAll([
          '/uv/uv.bundle.js',
          '/uv/uv.handler.js',
          '/uv/uv.client.js',
          '/uv/uv.config.js',
          '/uv/uv.sw.js'
        ]);
        
        console.log('[UV SW] Pre-cached essential resources');
      } catch (err) {
        console.error('[UV SW] Pre-cache error:', err);
      }
    })());
  }
  
  self.skipWaiting();
});

// Activate handler
self.addEventListener('activate', event => {
  console.log('[UV SW] Activated');
  
  // Clean up old caches
  if (CONFIG.ENABLE_CACHE) {
    event.waitUntil((async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name !== CONFIG.CACHE_NAME && name.startsWith('uv-'))
            .map(name => caches.delete(name))
        );
        
        // Trim current cache
        await trimCache();
        await clearExpiredCache();
      } catch (error) {
        // Silent fail
      }
    })());
  }
  
  // Claim clients immediately to ensure consistent behavior
  event.waitUntil(clients.claim());
});
