/*global UVServiceWorker,__uv$config*/
/*
 * UV Service Worker - No Extra UI Edition
 * Only functional fixes without injecting UI elements or custom CSS
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Configuration for game optimization
const CONFIG = {
  FETCH_TIMEOUT: 90000,       // 90 second timeout for very large games
  RETRY_COUNT: 2,             // Number of retry attempts for failed requests
  ENABLE_CACHE: true,         // Enable resource caching
  CACHE_NAME: 'uv-game-cache', // Cache name for game resources
  // Game markers for detection
  GAME_MARKERS: [
    'fnaf', 'five-night', 'unity', 'webgl', 'game', 
    'minecraft', 'slope', '1v1.lol', 'cookieclicker',
    'basketballstars', 'retrobowl', 'subway-surfers'
  ]
};

// Initialize
console.log('[UV SW] Service worker initializing');

// Detect game content for special handling
function isGameContent(url) {
  if (!url) return false;
  return CONFIG.GAME_MARKERS.some(marker => url.toLowerCase().includes(marker));
}

// Create functional script that DOESN'T modify game CSS
function createFunctionalScript() {
  return `
  // Game Compatibility Script - No UI or CSS modifications
  (function() {
    // Only run once per page
    if (window.GameCompatibilityActive) return;
    window.GameCompatibilityActive = true;
    
    console.log('[UV] Applying game compatibility fixes');
    
    // Fix WebGL issues without changing appearance
    function fixWebGL() {
      // Fix canvas getContext to ensure WebGL works properly
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
    }
    
    // Make sure canvases are visible, without changing their styling
    function fixCanvasVisibility() {
      document.querySelectorAll('canvas').forEach(canvas => {
        // Only fix visibility properties, don't add any styling
        if (canvas.style.display === 'none') canvas.style.display = 'block';
        if (canvas.style.visibility === 'hidden') canvas.style.visibility = 'visible';
        
        // Fix any zero-sized canvases
        if (canvas.width === 0 || canvas.height === 0) {
          canvas.width = canvas.width || window.innerWidth * 0.8 || 800;
          canvas.height = canvas.height || window.innerHeight * 0.8 || 600;
        }
      });
      
      // Show game containers without changing their styling
      const containerSelectors = [
        '#unity-container', '#gameContainer', '#unityContainer', 
        '#canvas', '#game', '#unity-canvas', '#webgl-content',
        '[id*="unity"]', '[id*="game"]', '[id*="canvas"]'
      ];
      
      containerSelectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(container => {
            // Only change visibility properties, not styling
            if (container.style.display === 'none') container.style.display = 'block';
            if (container.style.visibility === 'hidden') container.style.visibility = 'visible';
          });
        } catch (e) {} // Ignore selector errors
      });
      
      // Remove loading overlays that might be blocking the game
      try {
        document.querySelectorAll('[id*="loading"], [class*="loading"]').forEach(element => {
          if (element.offsetWidth > 200 && element.offsetHeight > 200) {
            // Check if this is actually a loading screen and not game content
            const isLoadingScreen = 
              element.id && element.id.toLowerCase().includes('loading') ||
              (element.className && typeof element.className === 'string' && 
               element.className.toLowerCase().includes('loading'));
            
            if (isLoadingScreen) {
              element.style.display = 'none';
            }
          }
        });
      } catch (e) {} // Ignore errors
    }
    
    // Setup game globals without UI modifications
    function setupGameGlobals() {
      // Unity global objects
      window.UnityLoader = window.UnityLoader || {
        instantiate: function(container, url, params) {
          console.log('[Unity Loader] Loading game from:', url);
          return { SetFullscreen: function() {} };
        },
        SystemInfo: {
          hasWebGL: true,
          mobile: false
        }
      };
      
      window.unityInstance = window.unityInstance || { 
        SendMessage: function() {},
        SetFullscreen: function() {}
      };
      
      // Silent progress handlers that don't modify UI
      window.unityShowBanner = window.unityShowBanner || function(text, type) {
        console.log('[Unity Banner]', text);
      };
      
      window.unityProgress = window.unityProgress || function(gameInstance, progress) {
        console.log('[Unity Progress]', Math.round(progress * 100) + '%');
      };
      
      // FNAF specific globals
      window.FNaFApp = window.FNaFApp || { 
        isReady: true,
        onReady: function(callback) {
          if (callback) setTimeout(callback, 10);
        }
      };
      
      // For WebGL detection
      window.hasWebGL = function() { return true; };
      window.hasWebGL2 = function() { return true; };
      window.isWebGLAvailable = function() { return true; };
      
      // Fix navigator user agent reporting
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        get: function() { return originalUserAgent.replace(/Headless/g, ''); }
      });
    }
    
    // Initialize compatibility features
    function initialize() {
      // Apply core fixes
      fixWebGL();
      setupGameGlobals();
      
      // Try to fix visibility issues once the page is loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixCanvasVisibility);
        window.addEventListener('load', fixCanvasVisibility);
      } else {
        fixCanvasVisibility();
      }
      
      // Also check for visibility issues after a delay to catch dynamic content
      setTimeout(fixCanvasVisibility, 2000);
      setTimeout(fixCanvasVisibility, 5000);
      
      // Check for game instance periodically
      const gameInstanceChecker = setInterval(() => {
        if (window.gameInstance || window.unityGame || window.unityInstance) {
          console.log('[Game] Game instance detected');
          clearInterval(gameInstanceChecker);
          setTimeout(fixCanvasVisibility, 1000);
        }
      }, 1000);
      
      // Monitor for new canvases with MutationObserver
      if (typeof MutationObserver !== 'undefined' && document.body) {
        const observer = new MutationObserver((mutations) => {
          let newCanvasFound = false;
          
          mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
              if (node.tagName === 'CANVAS') {
                newCanvasFound = true;
              } else if (node.querySelectorAll) {
                const canvases = node.querySelectorAll('canvas');
                if (canvases.length > 0) newCanvasFound = true;
              }
            });
          });
          
          if (newCanvasFound) {
            fixCanvasVisibility();
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    }
    
    // Start the initialization process
    initialize();
  })();
  `;
}

// Inject only functional fixes without UI or custom CSS
async function injectFunctionalFixes(response, url) {
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
    
    // Create modified HTML with functional script only
    let modifiedHtml = text;
    
    // Add our script at the end of head
    if (modifiedHtml.includes('</head>')) {
      const headClosePos = modifiedHtml.indexOf('</head>');
      
      modifiedHtml = modifiedHtml.substring(0, headClosePos) + `
      <script>
      ${createFunctionalScript()}
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

// Fetch with timeout and retry
async function fetchWithRetry(event, retries = CONFIG.RETRY_COUNT) {
  const url = new URL(event.request.url);
  const isGameRequest = isGameContent(url.toString());
  
  try {
    // Process through UV
    const response = await sw.fetch(event);
    
    // For game content, inject functional fixes only
    if (isGameRequest && 
        response.headers.get('content-type')?.includes('text/html')) {
      return await injectFunctionalFixes(response, url.toString());
    }
    
    return response;
  } catch (error) {
    // Retry logic
    if (retries > 0) {
      console.log(`[UV SW] Retrying (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return fetchWithRetry(event, retries - 1);
    }
    
    throw error;
  }
}

// Fetch and cache resource
async function fetchAndCache(event) {
  try {
    const response = await fetchWithRetry(event);
    
    // Cache successful GET responses
    if (CONFIG.ENABLE_CACHE && 
        event.request.method === 'GET' && 
        response.status === 200) {
      
      try {
        // Clone response before reading body
        const responseToCache = response.clone();
        
        // Cache in background without blocking
        caches.open(CONFIG.CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache).catch(() => {
            // Silent fail on cache errors - don't slow down response
          });
        }).catch(() => {
          // Silent fail
        });
      } catch (cacheError) {
        // Silent fail - prioritize speed over perfect caching
      }
    }
    
    return response;
  } catch (error) {
    // Try to get from cache if network fails
    if (CONFIG.ENABLE_CACHE && event.request.method === 'GET') {
      try {
        const cache = await caches.open(CONFIG.CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        
        if (cachedResponse) {
          return cachedResponse;
        }
      } catch (cacheError) {
        // Silent fail
      }
    }
    
    throw error;
  }
}

// Main fetch handler
self.addEventListener('fetch', event => {
  // Only handle UV routes
  if (!event.request.url.startsWith(self.registration.scope) && 
      !event.request.url.includes('/uv/')) {
    return;
  }

  // Performance-focused fetch handling
  event.respondWith((async () => {
    try {
      // For game content, set higher priority
      if (isGameContent(event.request.url)) {
        if (event.request.importance) {
          event.request.importance = 'high';
        }
      }
      
      // Try cache first for non-HTML requests
      if (CONFIG.ENABLE_CACHE && 
          event.request.method === 'GET' &&
          !event.request.url.endsWith('.html') && 
          !/text\/html/.test(event.request.headers.get('accept'))) {
        try {
          const cache = await caches.open(CONFIG.CACHE_NAME);
          const cachedResponse = await cache.match(event.request);
          
          if (cachedResponse) {
            // Refresh cache in background without blocking response
            fetchAndCache(event).catch(() => {}); 
            return cachedResponse;
          }
        } catch (e) {}
      }
      
      // If not in cache or it's an HTML request, fetch from network
      return await fetchAndCache(event);
    } catch (err) {
      // Try once more with basic approach before giving up
      try {
        return await sw.fetch(event);
      } catch (finalError) {
        // Only create error page for navigation requests
        if (event.request.mode === 'navigate') {
          return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Game Loading Error</title>
              <style>
                body{font-family:system-ui;background:#222;color:#fff;text-align:center;padding:20px}
                div{max-width:500px;margin:40px auto;background:#333;padding:20px;border-radius:8px}
                button{background:#2196f3;color:#fff;border:none;padding:8px 16px;margin:5px;cursor:pointer;border-radius:4px}
              </style>
            </head>
            <body>
              <div>
                <h2>Game Loading Error</h2>
                <p>The game couldn't be loaded. This may be due to network issues.</p>
                <button onclick="window.location.reload()">Try Again</button>
                <button onclick="window.location.href='/'">Go Home</button>
              </div>
            </body>
            </html>
          `, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
          });
        }
        
        throw finalError;
      }
    }
  })());
});

// Install handler - just init cache
self.addEventListener('install', event => {
  console.log('[UV SW] Installing service worker...');
  self.skipWaiting();
});

// Activate handler - claim clients and clean old caches
self.addEventListener('activate', event => {
  console.log('[UV SW] Service worker activated');
  
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
      } catch (error) {
        // Silent fail
      }
    })());
  }
  
  event.waitUntil(clients.claim());
});
