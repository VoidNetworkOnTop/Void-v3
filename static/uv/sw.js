/*global UVServiceWorker,__uv$config*/
/*
 * UV Service Worker for Ultraviolet proxy
 * Fixed version that resolves 404 errors
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Configuration with improved settings for reliability
const CONFIG = {
  FETCH_TIMEOUT: 90000,       // 90 second timeout for better reliability
  MAX_RETRIES: 4,             // Number of retry attempts
  RETRY_DELAY: 800,           // Initial delay between retries
  RETRY_BACKOFF: 1.5,         // Exponential backoff factor
  MAX_CONCURRENT_REQUESTS: 20, // Higher limit for concurrent requests
  LOG_LEVEL: 'debug'          // Detailed logging for diagnostics
};

// More cautious caching settings
const CACHE_NAME = 'uv-game-cache-v1';
const CACHE_MAX_AGE = 3 * 24 * 60 * 60 * 1000; // 3 days (reduced from 7)
const CACHE_MAX_SIZE = 150; // Maximum number of cached items (reduced from 250)

// Request tracking
let activeRequests = 0;
const requestQueue = [];

// Detect game content for special handling (simplified)
function isGameContent(url) {
  if (!url) return false;
  
  // Game patterns - reduced list to minimize false positives
  const gamePatterns = [
    'unity', 'webgl', '/game/', '/play/'
  ];
  
  return gamePatterns.some(pattern => url.includes(pattern));
}

// Process next request from queue
function processNextRequest() {
  if (requestQueue.length > 0 && activeRequests < CONFIG.MAX_CONCURRENT_REQUESTS) {
    const nextRequest = requestQueue.shift();
    nextRequest.resolve();
  }
}

// Enable or disable caching based on URL 
function shouldCache(url) {
  // Skip caching certain URL patterns
  const skipCachePatterns = [
    '/uv/service', 'bare', 'data:', 'blob:'
  ];
  
  if (skipCachePatterns.some(pattern => url.includes(pattern))) {
    return false;
  }
  
  // Only cache specific asset types
  const cacheableExtensions = [
    '.js', '.css', '.wasm', '.png', '.jpg', '.jpeg', '.gif', 
    '.svg', '.webp', '.ttf', '.woff', '.woff2', '.ico'
  ];
  
  return cacheableExtensions.some(ext => url.endsWith(ext));
}

// Enhanced fetch with proper error handling
const enhancedFetch = async (event, retries = CONFIG.MAX_RETRIES, retryDelay = CONFIG.RETRY_DELAY) => {
  // Queue management
  if (activeRequests >= CONFIG.MAX_CONCURRENT_REQUESTS) {
    await new Promise(resolve => {
      requestQueue.push({ resolve, event });
    });
  }
  
  // Increment active requests
  activeRequests++;
  
  try {
    const url = new URL(event.request.url).toString();
    
    // IMPORTANT: Let the UV service worker handle all service/ and bare/ paths directly
    // This is critical to prevent 404 errors
    if (url.includes('/uv/service/') || url.includes('/bare/')) {
      return await sw.fetch(event);
    }
    
    // For game content, apply special handling
    if (isGameContent(url)) {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);
      
      try {
        // Fetch with timeout
        const fetchPromise = sw.fetch(event);
        const response = await fetchPromise;
        clearTimeout(timeoutId);
        
        // Process HTML content for games to improve loading
        if (response.headers.get('content-type')?.includes('text/html')) {
          return await injectLoadingFixes(response, url);
        }
        
        return response;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    }
    
    // Standard handling for all other content
    return await sw.fetch(event);
    
  } catch (error) {
    console.error(`[UV SW] Fetch error: ${error.message}`);
    
    // Retry logic with exponential backoff
    if (retries > 0) {
      console.log(`[UV SW] Retrying fetch (${retries} attempts left) after ${retryDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Calculate next retry delay
      const nextRetryDelay = Math.min(30000, retryDelay * CONFIG.RETRY_BACKOFF);
      
      return enhancedFetch(event, retries - 1, nextRetryDelay);
    }
    
    throw error;
  } finally {
    // Decrement active requests counter
    activeRequests--;
    
    // Process next request in queue
    processNextRequest();
  }
};

// Inject fixes to improve loading and prevent blank pages
const injectLoadingFixes = async (response, url) => {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('text/html')) {
    return response;
  }
  
  try {
    const text = await response.text();
    
    // Skip UV configuration data
    if (text.includes('__uv$bareData') || text.includes('__uv$cookies')) {
      return new Response(text, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }
    
    // Create a modified version with our fixes
    let modifiedHtml = text;
    
    // Fix 1: WebGL compatibility
    if (modifiedHtml.includes('</head>')) {
      const headEndPos = modifiedHtml.indexOf('</head>');
      
      modifiedHtml = modifiedHtml.substring(0, headEndPos) + `
      <!-- UV WebGL Compatibility Fixes -->
      <script>
      (function() {
        console.log('[UV WebGL] Applying WebGL compatibility fixes');
        
        // Fix for broken WebGL detection
        window.requestAnimationFrame = window.requestAnimationFrame || function(callback) {
          return window.setTimeout(callback, 1000/60);
        };
        
        // Override WebGL detection functions
        window.hasWebGL = function() { return true; };
        window.isWebGLAvailable = function() { return true; };
        window.hasWebGL2 = function() { return true; };
        
        // Fix navigator user agent reporting
        const originalUserAgent = navigator.userAgent;
        Object.defineProperty(navigator, 'userAgent', {
          get: function() {
            return originalUserAgent.replace(/Headless/g, '');
          }
        });
        
        // Override canvas getContext to fix WebGL issues
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
          // Fix for zero-sized canvases
          if ((this.width === 0 || this.height === 0) && 
              (contextType === 'webgl' || contextType === 'experimental-webgl' || contextType === 'webgl2')) {
            console.log('[UV WebGL] Fixing zero-sized canvas');
            this.width = this.width || window.innerWidth * 0.8 || 800;
            this.height = this.height || window.innerHeight * 0.8 || 600;
          }
          
          // Optimize WebGL context attributes for compatibility
          if (contextType === 'webgl' || contextType === 'experimental-webgl' || contextType === 'webgl2') {
            contextAttributes = contextAttributes || {};
            contextAttributes.preserveDrawingBuffer = true;
            contextAttributes.failIfMajorPerformanceCaveat = false;
            contextAttributes.powerPreference = 'high-performance';
            
            try {
              const ctx = originalGetContext.call(this, contextType, contextAttributes);
              if (ctx) {
                // Make sure canvas is visible
                this.style.display = 'block';
                this.style.visibility = 'visible';
                return ctx;
              }
              
              // Try alternative context types
              const alternatives = ['webgl', 'experimental-webgl', 'webgl2'];
              for (const alt of alternatives) {
                if (alt !== contextType) {
                  try {
                    const ctx2 = originalGetContext.call(this, alt, contextAttributes);
                    if (ctx2) return ctx2;
                  } catch (e) {}
                }
              }
            } catch (e) {
              console.error('[UV WebGL] Context creation error:', e);
            }
          }
          
          // Default fallback
          return originalGetContext.call(this, contextType, contextAttributes);
        };
        
        // Fix Unity objects
        window.Unity = window.Unity || {};
        window.UnityLoader = window.UnityLoader || {
          instantiate: function() { return {}; },
          SystemInfo: {
            hasWebGL: true,
            mobile: false
          }
        };
      })();
      </script>
      ` + modifiedHtml.substring(headEndPos);
    }
    
    // Fix 2: Add body loading indicator
    if (modifiedHtml.includes('<body')) {
      const bodyPos = modifiedHtml.indexOf('<body') + '<body'.length;
      const bodyEndPos = modifiedHtml.indexOf('>', bodyPos);
      
      if (bodyEndPos !== -1) {
        modifiedHtml = modifiedHtml.substring(0, bodyEndPos + 1) + `
        <!-- UV Loading Indicator -->
        <script>
        (function() {
          // Create and add loading indicator
          const loadingDiv = document.createElement('div');
          loadingDiv.id = 'uv-loading-indicator';
          loadingDiv.style.position = 'fixed';
          loadingDiv.style.top = '50%';
          loadingDiv.style.left = '50%';
          loadingDiv.style.transform = 'translate(-50%, -50%)';
          loadingDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
          loadingDiv.style.color = 'white';
          loadingDiv.style.padding = '20px';
          loadingDiv.style.borderRadius = '10px';
          loadingDiv.style.zIndex = '9999';
          loadingDiv.style.textAlign = 'center';
          loadingDiv.style.fontFamily = 'Arial, sans-serif';
          loadingDiv.style.transition = 'opacity 0.5s ease';
          
          // Create spinner
          const spinner = document.createElement('div');
          spinner.style.width = '40px';
          spinner.style.height = '40px';
          spinner.style.margin = '0 auto 15px auto';
          spinner.style.border = '4px solid rgba(255, 255, 255, 0.3)';
          spinner.style.borderTop = '4px solid white';
          spinner.style.borderRadius = '50%';
          spinner.style.animation = 'uv-spin 1s linear infinite';
          
          // Add keyframes
          const style = document.createElement('style');
          style.textContent = '@keyframes uv-spin {0% {transform: rotate(0deg);} 100% {transform: rotate(360deg);}}';
          document.head.appendChild(style);
          
          // Add content
          loadingDiv.appendChild(spinner);
          loadingDiv.appendChild(document.createTextNode('Loading Game...'));
          
          // Add to body
          document.body.appendChild(loadingDiv);
          
          // Hide loading indicator when content appears
          function hideLoader() {
            // Check if any meaningful game content has loaded
            const hasCanvas = document.querySelector('canvas');
            const hasGameContainer = document.querySelector('[id*="unity"], [id*="game"], #gameContainer');
            const hasMultipleElements = document.body.children.length > 5;
            
            if (hasCanvas || hasGameContainer || hasMultipleElements) {
              const loadingDiv = document.getElementById('uv-loading-indicator');
              if (loadingDiv) {
                loadingDiv.style.opacity = '0';
                setTimeout(function() {
                  if (loadingDiv.parentNode) {
                    loadingDiv.parentNode.removeChild(loadingDiv);
                  }
                }, 500);
              }
              return true;
            }
            return false;
          }
          
          // Check periodically for game content
          let checkCount = 0;
          const checkInterval = setInterval(function() {
            checkCount++;
            if (hideLoader() || checkCount > 30) {
              clearInterval(checkInterval);
            }
          }, 1000);
          
          // Also check after window load
          window.addEventListener('load', function() {
            setTimeout(hideLoader, 1000);
          });
        })();
        </script>
        ` + modifiedHtml.substring(bodyEndPos + 1);
      }
    }
    
    // Return the modified HTML
    return new Response(modifiedHtml, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    console.error('[UV SW] HTML modification error:', error);
    return response;
  }
};

// Create a nice error page
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
        button:hover {
          opacity: 0.9;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Game Loading Error</h2>
        <p>There was a problem loading this game. This might be due to:</p>
        <ul>
          <li>High server traffic</li>
          <li>The game blocking proxy access</li>
          <li>Temporary network issues</li>
        </ul>
        <p>Error: ${error.message || 'Unknown error'}</p>
        <p>Try these options:</p>
        <button onclick="window.location.reload()">Reload Game</button>
        <button onclick="window.history.back()">Go Back</button>
        <button onclick="window.location.href='/'">Home</button>
      </div>
    </body>
    </html>
  `, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

// Main fetch handler - SIMPLIFIED to fix 404 errors
self.addEventListener('fetch', event => {
  // Only handle UV routes
  if (!event.request.url.startsWith(self.registration.scope) && 
      !event.request.url.includes('/uv/')) {
    return;
  }

  event.respondWith((async () => {
    try {
      // Process with enhanced fetch
      return await enhancedFetch(event);
    } catch (err) {
      console.error('[UV SW] Fatal error:', err);
      return createErrorPage(err);
    }
  })());
});

// Install handler
self.addEventListener('install', event => {
  console.log('[UV SW] Installing fixed service worker...');
  self.skipWaiting();
});

// Activate handler
self.addEventListener('activate', event => {
  console.log('[UV SW] Activated');
  
  // Claim clients immediately
  event.waitUntil(clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

// Message handler
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
