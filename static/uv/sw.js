/*global UVServiceWorker,__uv$config*/
/*
 * UV Service Worker - Lean Performance Edition
 * Optimized for fastest possible game loading with no UI or CSS injection
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Minimal configuration for performance
const CONFIG = {
  FETCH_TIMEOUT: 90000,        // 90 second timeout for large games
  ENABLE_CACHE: true,          // Enable resource caching
  CACHE_NAME: 'uv-game-cache', // Cache name for game resources
  // Game markers for detection
  GAME_MARKERS: [
    'fnaf', 'five-night', 'unity', 'webgl', 'game', 
    'minecraft', 'slope', '1v1.lol', 'cookieclicker',
    'basketballstars', 'retrobowl', 'subway-surfers'
  ]
};

// Initialize
console.log('[UV SW] Lean performance service worker initializing');

// Detect game content for special handling
function isGameContent(url) {
  if (!url) return false;
  return CONFIG.GAME_MARKERS.some(marker => url.toLowerCase().includes(marker));
}

// Get resource priority level (1-3, with 1 being highest)
function getResourcePriority(url) {
  if (!url) return 3;
  
  const urlLower = url.toLowerCase();
  
  // Highest priority - core game engine files and frameworks
  if (urlLower.includes('framework') || 
      urlLower.includes('engine') || 
      urlLower.includes('core') || 
      urlLower.includes('loader') ||
      urlLower.endsWith('.wasm') || 
      urlLower.endsWith('.unity3d') || 
      urlLower.endsWith('.data') || 
      urlLower.includes('build.js') ||
      urlLower.includes('main.js')) {
    return 1;
  }
  
  // Medium priority - other JavaScript, JSON, and game assets
  if (urlLower.endsWith('.js') || 
      urlLower.endsWith('.json') || 
      urlLower.endsWith('.mem')) {
    return 2;
  }
  
  // Lower priority - everything else
  return 3;
}

// Create the minimal essential game compatibility script (no UI or decorative CSS)
function createEssentialGameScript() {
  return `
  // Minimal Game Compatibility Script - No UI or CSS injection
  (function() {
    // Only run once per page
    if (window.GameCompatibilityActive) return;
    window.GameCompatibilityActive = true;
    
    console.log('[UV] Applying minimal game compatibility fixes');
    
    // WebGL fixes
    function applyWebGLFixes() {
      // Fix canvas getContext to ensure WebGL works properly
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
        // Fix for zero-sized canvases
        if ((this.width === 0 || this.height === 0) && 
            ['webgl', 'experimental-webgl', 'webgl2'].includes(contextType)) {
          this.width = this.width || window.innerWidth * 0.8 || 800;
          this.height = this.height || window.innerHeight * 0.8 || 600;
        }
        
        // For WebGL contexts, apply only essential optimizations
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
    
    // Fix visibility issues without adding decorative CSS
    function fixGameVisibility() {
      // Wait until document is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixCanvasVisibility);
        window.addEventListener('load', fixCanvasVisibility);
      } else {
        fixCanvasVisibility();
        // Also try after a short delay to catch dynamically created elements
        setTimeout(fixCanvasVisibility, 1000);
        setTimeout(fixCanvasVisibility, 3000);
      }
      
      // Continue checking periodically for late-loading content
      setInterval(fixCanvasVisibility, 5000);
    }
    
    function fixCanvasVisibility() {
      // Fix canvas visibility - only essential properties, no decorative CSS
      document.querySelectorAll('canvas').forEach(canvas => {
        if (canvas.style.display === 'none') canvas.style.display = 'block';
        if (canvas.style.visibility === 'hidden') canvas.style.visibility = 'visible';
        
        // Fix any zero-sized canvases
        if (canvas.width === 0 || canvas.height === 0) {
          canvas.width = canvas.width || window.innerWidth * 0.8 || 800;
          canvas.height = canvas.height || window.innerHeight * 0.8 || 600;
        }
      });
      
      // Fix game containers - minimal changes, only visibility properties
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
        } catch (e) {} // Ignore selector errors
      });
      
      // Remove loading overlays that might be blocking the game
      try {
        document.querySelectorAll('[id*="loading"], [class*="loading"]').forEach(element => {
          // Only if it's potentially blocking content
          if (element.offsetWidth > 200 && element.offsetHeight > 200) {
            element.style.display = 'none';
          }
        });
      } catch (e) {} // Ignore errors
    }
    
    // Essential game globals without UI or logging
    function setupGameGlobals() {
      // Unity global objects
      window.UnityLoader = window.UnityLoader || {
        instantiate: function(container, url, params) {
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
      
      // Silent progress trackers
      window.unityShowBanner = window.unityShowBanner || function() {};
      window.unityProgress = window.unityProgress || function() {};
      
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
    
    // Apply the fixes
    applyWebGLFixes();
    setupGameGlobals();
    fixGameVisibility();
  })();
  `;
}

// Inject only essential compatibility script, no UI or CSS
async function injectMinimalCompatibility(response, url) {
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
    
    // Create modified HTML with minimal compatibility script
    let modifiedHtml = text;
    
    // Inject our script at the end of head
    if (modifiedHtml.includes('</head>')) {
      const headClosePos = modifiedHtml.indexOf('</head>');
      
      modifiedHtml = modifiedHtml.substring(0, headClosePos) + `
      <script>
      ${createEssentialGameScript()}
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

// Fetch with timeout
async function fetchWithTimeout(event, timeout) {
  const url = new URL(event.request.url);
  const isGameRequest = isGameContent(url.toString());
  
  // Use AbortController for timeout if supported
  const supportsAbort = typeof AbortController !== 'undefined';
  let controller;
  let abortTimeout;
  
  try {
    if (supportsAbort) {
      controller = new AbortController();
      const signal = controller.signal;
      
      // Set timeout
      abortTimeout = setTimeout(() => {
        controller.abort();
      }, timeout);
      
      // Clone request with abort signal
      const modifiedRequest = new Request(event.request, {
        signal: signal
      });
      
      // Process through UV
      const response = await sw.fetch({
        request: modifiedRequest
      });
      
      clearTimeout(abortTimeout);
      
      // For game content, inject minimal compatibility script
      if (isGameRequest && 
          response.headers.get('content-type')?.includes('text/html')) {
        return await injectMinimalCompatibility(response, url.toString());
      }
      
      return response;
    } else {
      // Fallback for browsers without AbortController
      const timeoutPromise = new Promise((_, reject) => {
        abortTimeout = setTimeout(() => {
          reject(new Error(`Request timed out after ${timeout}ms`));
        }, timeout);
      });
      
      // Race between fetch and timeout
      const response = await Promise.race([
        sw.fetch(event),
        timeoutPromise
      ]);
      
      clearTimeout(abortTimeout);
      
      // For game content, inject minimal compatibility script
      if (isGameRequest && 
          response.headers.get('content-type')?.includes('text/html')) {
        return await injectMinimalCompatibility(response, url.toString());
      }
      
      return response;
    }
  } catch (error) {
    if (abortTimeout) clearTimeout(abortTimeout);
    throw error;
  }
}

// Fetch and cache resource
async function fetchAndCache(event, timeout) {
  const url = new URL(event.request.url);
  
  try {
    const response = await fetchWithTimeout(event, timeout);
    
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

// Enhanced fetch with prioritization
async function enhancedFetch(event) {
  const url = new URL(event.request.url);
  const priority = getResourcePriority(url.toString());
  
  // Use a dynamic timeout based on resource priority
  const timeout = priority === 1 ? CONFIG.FETCH_TIMEOUT : 
                 priority === 2 ? CONFIG.FETCH_TIMEOUT * 0.75 : 
                 CONFIG.FETCH_TIMEOUT * 0.5;
  
  // For non-critical resources, try cache first
  if (CONFIG.ENABLE_CACHE && 
      event.request.method === 'GET' && 
      priority !== 1) {
    try {
      const cache = await caches.open(CONFIG.CACHE_NAME);
      const cachedResponse = await cache.match(event.request);
      
      if (cachedResponse) {
        // For lowest priority, just return cached version
        if (priority === 3) {
          return cachedResponse;
        }
        
        // For medium priority, refresh cache in background but return cached immediately
        fetchAndCache(event, timeout).catch(() => {
          // Silent fail
        });
        
        return cachedResponse;
      }
    } catch (cacheError) {
      // Silent fail
    }
  }
  
  // If not in cache or cache disabled, fetch from network
  return await fetchAndCache(event, timeout);
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
      // Set higher priority for game content
      if (isGameContent(event.request.url)) {
        event.request.importance = 'high';
      }
      
      return await enhancedFetch(event);
    } catch (err) {
      // Try once more with basic approach before giving up
      try {
        return await sw.fetch(event);
      } catch (finalError) {
        // Create minimal error page only for navigation requests
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

// Install handler with minimal setup
self.addEventListener('install', event => {
  console.log('[UV SW] Installing lean service worker...');
  self.skipWaiting();
});

// Activate handler
self.addEventListener('activate', event => {
  console.log('[UV SW] Lean service worker activated');
  event.waitUntil(clients.claim());
});
