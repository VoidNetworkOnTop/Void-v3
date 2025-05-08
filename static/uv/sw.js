/*global UVServiceWorker,__uv$config*/
/*
 * UV Service Worker - Performance Optimized Edition
 * With focused optimizations for faster game loading and black screen fixes
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Streamlined configuration for better performance
const CONFIG = {
  FETCH_TIMEOUT: 60000,       // 1 minute timeout should be sufficient
  RETRY_COUNT: 2,              // Reduced number of retries to prevent excessive requests
  RETRY_DELAY: 500,           // Faster retry delay (milliseconds)
  ENABLE_CACHE: true,         // Enable resource caching for faster subsequent loads
  CACHE_NAME: 'uv-game-cache', // Cache name for game resources
  MAX_CACHE_SIZE: 100 * 1024 * 1024, // 100MB max cache size
  PARALLEL_LOAD_LIMIT: 8,     // Allow more concurrent requests for asset loading
};

// Cache control
let cacheSize = 0;

// Initialize
console.log('[UV SW] Performance-optimized service worker initializing');

// Detect WebGL game content for special handling - simplified version
function isGameContent(url) {
  if (!url) return false;
  
  // Simplified detection focusing on most common game patterns
  return /unity|webgl|game|play|3d|canvas|html5|arcade|\.io|poki\.com/i.test(url);
}

// Inject minimal but effective fixes for black screen and WebGL issues
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
    
    // Create modified HTML with essential fixes only
    let modifiedHtml = text;
    
    // Add focused WebGL fixes to head - reduced to essential fixes only
    if (modifiedHtml.includes('<head')) {
      const headInsertPos = modifiedHtml.indexOf('<head') + '<head'.length;
      const headEndPos = modifiedHtml.indexOf('>', headInsertPos);
      
      if (headEndPos !== -1) {
        modifiedHtml = modifiedHtml.substring(0, headEndPos + 1) + `
        <!-- UV Essential WebGL Fixes -->
        <script>
        (function() {
          // Make WebGL detection always return true
          window.hasWebGL = window.hasWebGL2 = window.isWebGLAvailable = function() { return true; };
          
          // Fix navigator user agent reporting
          const originalUserAgent = navigator.userAgent;
          Object.defineProperty(navigator, 'userAgent', {
            get: function() { return originalUserAgent.replace(/Headless/g, ''); }
          });
        })();
        </script>
        ` + modifiedHtml.substring(headEndPos + 1);
      }
    }
    
    // Add minimal canvas/WebGL fixes right before </head>
    if (modifiedHtml.includes('</head>')) {
      const headClosePos = modifiedHtml.indexOf('</head>');
      
      modifiedHtml = modifiedHtml.substring(0, headClosePos) + `
      <!-- UV Core WebGL Fixes -->
      <script>
      (function() {
        // Only the essential canvas/WebGL patches
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
          // Fix for zero-sized canvases
          if ((this.width === 0 || this.height === 0) && 
              ['webgl', 'experimental-webgl', 'webgl2'].includes(contextType)) {
            this.width = this.width || window.innerWidth * 0.8 || 800;
            this.height = this.height || window.innerHeight * 0.8 || 600;
          }
          
          // For WebGL contexts, apply optimizations
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
        
        // Ensure page and canvases are visible after load
        window.addEventListener('load', function() {
          // Force visibility of all canvases
          document.querySelectorAll('canvas').forEach(canvas => {
            canvas.style.display = 'block';
            canvas.style.visibility = 'visible';
            
            if (canvas.width === 0 || canvas.height === 0) {
              canvas.width = canvas.width || window.innerWidth * 0.8 || 800;
              canvas.height = canvas.height || window.innerHeight * 0.8 || 600;
            }
          });
          
          // Fix Unity canvas elements specifically
          const unityElements = [...document.querySelectorAll('[id*="unity"],[id*="game"],[id*="canvas"],canvas')];
          unityElements.forEach(el => {
            el.style.visibility = 'visible';
            el.style.display = el.nodeName === 'CANVAS' ? 'block' : 'block';
          });
        });
      })();
      </script>
      ` + modifiedHtml.substring(headClosePos);
    }
    
    return new Response(modifiedHtml, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    console.error('[UV SW] HTML modification error:', error);
    return response;
  }
}

// Streamlined fetch with improved performance
async function enhancedFetch(event) {
  const url = new URL(event.request.url);
  const isGame = isGameContent(url.toString());
  
  // For game content, set higher priority and streaming optimizations
  if (isGame) {
    event.request.importance = 'high';
  }
  
  // Try cache first for GET requests if cache is enabled
  if (CONFIG.ENABLE_CACHE && event.request.method === 'GET') {
    try {
      const cache = await caches.open(CONFIG.CACHE_NAME);
      const cachedResponse = await cache.match(event.request);
      
      if (cachedResponse) {
        console.log(`[UV SW] Cache hit for: ${url.pathname}`);
        return cachedResponse;
      }
    } catch (cacheError) {
      console.warn('[UV SW] Cache error:', cacheError);
    }
  }
  
  try {
    // Process requests through UV
    const response = await sw.fetch(event);
    
    // For GET requests, cache the response if appropriate
    if (CONFIG.ENABLE_CACHE && 
        event.request.method === 'GET' && 
        response.status === 200) {
      
      try {
        const cache = await caches.open(CONFIG.CACHE_NAME);
        const clone = response.clone();
        
        // Store in cache
        cache.put(event.request, clone).catch(err => 
          console.warn('[UV SW] Cache write error:', err));
      } catch (cacheError) {
        console.warn('[UV SW] Cache save error:', cacheError);
      }
    }
    
    // For HTML game content, inject WebGL fixes
    if (isGame && response.headers.get('content-type')?.includes('text/html')) {
      return await injectGameFixes(response, url.toString());
    }
    
    return response;
  } catch (error) {
    console.error(`[UV SW] Fetch error: ${error.message}`);
    
    // Retry once more with a clean approach
    try {
      return await sw.fetch(event);
    } catch (retryError) {
      throw error; // Throw original error if retry also fails
    }
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
        body {
          font-family: Arial, sans-serif;
          color: white;
          background: #222;
          margin: 0;
          padding: 20px;
          line-height: 1.6;
          text-align: center;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #333;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        h2 { margin-top: 0; color: #f44336; }
        button {
          padding: 10px 16px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin: 5px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Game Loading Error</h2>
        <p>The game couldn't load properly. This may be due to network issues or compatibility problems.</p>
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

// Periodic cache cleanup to prevent excessive storage use
async function cleanupCache() {
  try {
    const cache = await caches.open(CONFIG.CACHE_NAME);
    const requests = await cache.keys();
    
    if (requests.length > 1000) { // Too many items
      console.log(`[UV SW] Cache cleanup: removing ${requests.length - 500} oldest items`);
      // Keep the 500 most recent items
      const toDelete = requests.slice(0, requests.length - 500);
      for (const request of toDelete) {
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.warn('[UV SW] Cache cleanup error:', error);
  }
}

// Main fetch handler
self.addEventListener('fetch', event => {
  // Only handle UV routes
  if (!event.request.url.startsWith(self.registration.scope) && 
      !event.request.url.includes('/uv/')) {
    return;
  }

  // High performance fetch handling
  event.respondWith((async () => {
    try {
      // Use enhanced fetch with optimizations
      return await enhancedFetch(event);
    } catch (err) {
      console.error('[UV SW] Fatal error:', err);
      return createErrorPage(err);
    }
  })());
});

// Install handler with cache setup
self.addEventListener('install', event => {
  console.log('[UV SW] Installing performance-optimized service worker...');
  
  // Initialize cache during installation
  if (CONFIG.ENABLE_CACHE) {
    event.waitUntil((async () => {
      try {
        const cache = await caches.open(CONFIG.CACHE_NAME);
        console.log('[UV SW] Cache initialized');
      } catch (error) {
        console.warn('[UV SW] Cache initialization error:', error);
      }
    })());
  }
  
  self.skipWaiting();
});

// Activate handler with cache cleanup
self.addEventListener('activate', event => {
  console.log('[UV SW] Activated');
  
  // Clean up old caches
  if (CONFIG.ENABLE_CACHE) {
    event.waitUntil((async () => {
      try {
        // Delete old caches
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name !== CONFIG.CACHE_NAME && name.startsWith('uv-'))
            .map(name => caches.delete(name))
        );
        console.log('[UV SW] Old caches cleaned up');
      } catch (error) {
        console.warn('[UV SW] Cache cleanup error:', error);
      }
    })());
  }
  
  event.waitUntil(clients.claim());
});

// Periodic cache cleanup
setInterval(cleanupCache, 30 * 60 * 1000); // Every 30 minutes
