/*global UVServiceWorker,__uv$config*/
/*
 * UV Service Worker for Ultraviolet proxy
 * Fixed version for blank page and loading issues
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Configuration with focus on reducing timeouts
const CONFIG = {
  FETCH_TIMEOUT: 90000,       // 90 second maximum timeout (more responsive)
  MAX_RETRIES: 5,             // Increased retries for better success rate
  RETRY_DELAY: 800,           // Initial delay between retries
  RETRY_BACKOFF: 1.5,         // Exponential backoff factor
  MAX_CONCURRENT_REQUESTS: 20, // Higher limit for concurrent requests
  LOG_LEVEL: 'debug'          // Enable detailed logging for diagnostics
};

// Request tracking
let activeRequests = 0;
const requestQueue = [];
const failedUrls = new Map(); // Track problematic URLs

// Detect game content
const isGameContent = (url) => {
  if (!url) return false;
  
  // Game patterns
  const gamePatterns = [
    '.gitlab.io',
    'superliquid',
    'unity',
    'webgl',
    'game',
    'play',
    '3d',
    'html5',
    'canvas'
  ];
  
  return gamePatterns.some(pattern => url.includes(pattern));
};

// Process next request from queue
function processNextRequest() {
  if (requestQueue.length > 0 && activeRequests < CONFIG.MAX_CONCURRENT_REQUESTS) {
    const nextRequest = requestQueue.shift();
    nextRequest.resolve();
  }
}

// Enhanced fetch with better timeout handling
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
    const url = new URL(event.request.url);
    const reqUrl = url.toString();
    
    // Check if this URL has consistently failed
    if (failedUrls.has(reqUrl) && failedUrls.get(reqUrl) > 3) {
      console.log(`[UV SW] Skipping known problematic URL: ${reqUrl}`);
      
      // For HTML content, return a modified response that will auto-reload
      if (event.request.headers.get('accept')?.includes('text/html')) {
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Loading Game...</title>
            <script>
              // Try again with a clean slate
              sessionStorage.clear();
              localStorage.removeItem('uv-game-failed');
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            </script>
          </head>
          <body style="background:#000;color:#fff;text-align:center;font-family:sans-serif;padding-top:20%;">
            <h2>Reloading Game...</h2>
            <p>Please wait...</p>
          </body>
          </html>
        `, {
          headers: {'Content-Type': 'text/html'}
        });
      }
    }
    
    // Special handling for game content
    const isGame = isGameContent(reqUrl);
    
    // For game content, use a more reliable timeout approach
    if (isGame) {
      console.log(`[UV SW] Game content detected: ${reqUrl.substring(0, 50)}...`);
      
      // Create an AbortController for precise timing control
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);
      
      try {
        // Fetch with abort capability
        const fetchPromise = sw.fetch(event, {
          // Only pass signal if AbortController is supported
          signal: controller.signal
        });
        
        // Wait for response
        const response = await fetchPromise;
        clearTimeout(timeoutId);
        
        // Process HTML content for games to improve loading
        if (response.headers.get('content-type')?.includes('text/html')) {
          return await injectLoadingFixes(response, reqUrl);
        }
        
        return response;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // Check if the error was due to timeout
        if (fetchError.name === 'AbortError') {
          console.error(`[UV SW] Timeout for game URL: ${reqUrl}`);
          throw new Error(`Timeout loading game content after ${CONFIG.FETCH_TIMEOUT}ms`);
        }
        
        throw fetchError;
      }
    }
    
    // Standard handling for non-game content
    return await sw.fetch(event);
    
  } catch (error) {
    console.error(`[UV SW] Fetch error: ${error.message}`);
    
    // Track failed URLs
    const failedUrl = new URL(event.request.url).toString();
    failedUrls.set(failedUrl, (failedUrls.get(failedUrl) || 0) + 1);
    
    // Retry logic with exponential backoff
    if (retries > 0) {
      console.log(`[UV SW] Retrying fetch (${retries} attempts left) after ${retryDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Calculate next retry delay with exponential backoff
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
    
    // Fix 1: Add extensive early-loading fixes to the head
    if (modifiedHtml.includes('<head')) {
      const headInsertPos = modifiedHtml.indexOf('<head') + '<head'.length;
      const headEndPos = modifiedHtml.indexOf('>', headInsertPos);
      
      if (headEndPos !== -1) {
        modifiedHtml = modifiedHtml.substring(0, headEndPos + 1) + `
        <!-- UV Enhanced Loading Fixes -->
        <script>
        (function() {
          console.log('[UV Loader] Initializing loading fixes');
          
          // Track page load start time
          window.__uvLoadStartTime = Date.now();
          
          // Fix for broken proxy paths
          const originalFetch = window.fetch;
          window.fetch = function(resource, options) {
            // Fix relative URLs that might break in the proxy
            if (typeof resource === 'string' && resource.startsWith('/') && !resource.startsWith('//')) {
              const currentPath = window.location.pathname.split('/');
              // Remove the last segment if it has a dot (likely a file)
              if (currentPath[currentPath.length - 1].includes('.')) {
                currentPath.pop();
              }
              resource = currentPath.join('/') + resource;
              console.log('[UV Loader] Fixed relative path:', resource);
            }
            return originalFetch.call(this, resource, options);
          };
          
          // Track slow resources
          let slowResources = [];
          const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              if (entry.duration > 5000) {
                slowResources.push(entry.name);
                console.warn('[UV Loader] Slow resource:', entry.name, entry.duration.toFixed(0) + 'ms');
              }
            });
          });
          try { observer.observe({entryTypes: ['resource']}); } catch(e) {}
          
          // Fix for DNS prefetching and preconnect
          const domains = ['gitlab.io', 'github.io', 'cloudflare.com', 'jsdelivr.net'];
          domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = '//' + domain;
            document.head.appendChild(link);
            
            const preconnect = document.createElement('link');
            preconnect.rel = 'preconnect';
            preconnect.href = 'https://' + domain;
            document.head.appendChild(preconnect);
          });
          
          // Load detection
          let isLoaded = false;
          window.addEventListener('load', function() {
            isLoaded = true;
            const loadTime = Date.now() - window.__uvLoadStartTime;
            console.log('[UV Loader] Page loaded in ' + loadTime + 'ms');
            
            // Detect problems after load
            setTimeout(checkLoadProblems, 2000);
          });
          
          // Function to detect and fix load problems
          function checkLoadProblems() {
            // Check if page appears to be blank
            const hasContent = document.body && (
              document.body.innerText.trim().length > 50 ||
              document.querySelectorAll('canvas, img, svg, iframe').length > 0
            );
            
            if (!hasContent) {
              console.warn('[UV Loader] Page appears blank after loading');
              
              // Check for canvas
              const hasCanvas = document.querySelector('canvas');
              if (!hasCanvas) {
                console.log('[UV Loader] No canvas found, attempting to create one');
                
                // Create placeholder canvas
                const canvas = document.createElement('canvas');
                canvas.width = window.innerWidth * 0.8;
                canvas.height = window.innerHeight * 0.7;
                canvas.style.display = 'block';
                canvas.style.margin = '50px auto';
                canvas.style.border = '1px solid #333';
                
                // Add placeholder to body
                document.body.appendChild(canvas);
                
                // Try to initialize WebGL on this canvas
                try {
                  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                  if (gl) {
                    gl.clearColor(0.0, 0.0, 0.0, 1.0);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    console.log('[UV Loader] Created WebGL context');
                  }
                } catch(e) {
                  console.error('[UV Loader] WebGL initialization failed:', e);
                }
                
                // Add reload message
                const message = document.createElement('div');
                message.style.textAlign = 'center';
                message.style.padding = '20px';
                message.style.color = 'white';
                message.style.fontSize = '16px';
                message.style.fontFamily = 'Arial, sans-serif';
                message.innerHTML = 'Game is taking longer than expected to load.<br>You can <a href="#" onclick="window.location.reload()" style="color:#4a6ed3;text-decoration:underline;">reload the page</a> or try a different game.';
                document.body.appendChild(message);
                
                // Create reload button
                const button = document.createElement('button');
                button.textContent = 'Reload Game';
                button.style.display = 'block';
                button.style.margin = '0 auto';
                button.style.padding = '10px 20px';
                button.style.backgroundColor = '#4a6ed3';
                button.style.color = 'white';
                button.style.border = 'none';
                button.style.borderRadius = '4px';
                button.style.fontSize = '16px';
                button.style.cursor = 'pointer';
                button.onclick = function() {
                  window.location.reload();
                };
                document.body.appendChild(button);
              }
            }
          }
          
          // Blank page failsafe - if page isn't loaded within 30 seconds, reload
          setTimeout(function() {
            if (!isLoaded || document.body.innerText.trim().length < 50) {
              console.error('[UV Loader] Page failed to load properly in 30s, reloading');
              window.location.reload();
            }
          }, 30000);
        })();
        </script>
        ` + modifiedHtml.substring(headEndPos + 1);
      }
    }
    
    // Fix 2: Add WebGL compatibility fixes before end of head
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
                // Fix missing methods
                ctx.getShaderPrecisionFormat = ctx.getShaderPrecisionFormat || function() {
                  return { precision: 23, rangeMin: 127, rangeMax: 127 };
                };
                
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
    
    // Fix 3: Add body loading indicator
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
          
          // Add progress info
          const progress = document.createElement('div');
          progress.style.fontSize = '12px';
          progress.style.marginTop = '10px';
          progress.style.color = '#aaa';
          loadingDiv.appendChild(progress);
          
          // Add to body
          document.body.appendChild(loadingDiv);
          
          // Update progress info
          let dots = '';
          const progressInterval = setInterval(function() {
            dots = dots.length >= 3 ? '' : dots + '.';
            progress.textContent = 'Please wait' + dots;
          }, 500);
          
          // Hide loading indicator when content appears
          function hideLoader() {
            // Check if any meaningful game content has loaded
            const hasCanvas = document.querySelector('canvas');
            const hasUnityContainer = document.querySelector('[id*="unity"], [id*="game"], #gameContainer');
            const hasMultipleElements = document.body.children.length > 5;
            
            if (hasCanvas || hasUnityContainer || hasMultipleElements) {
              const loadingDiv = document.getElementById('uv-loading-indicator');
              if (loadingDiv) {
                loadingDiv.style.opacity = '0';
                setTimeout(function() {
                  if (loadingDiv.parentNode) {
                    loadingDiv.parentNode.removeChild(loadingDiv);
                  }
                }, 500);
              }
              clearInterval(progressInterval);
              return true;
            }
            return false;
          }
          
          // Check periodically for game content
          let checkCount = 0;
          const checkInterval = setInterval(function() {
            checkCount++;
            
            // Update loading message for long loads
            if (checkCount > 10) {
              progress.textContent = 'Still loading... (' + checkCount + 's)';
            }
            
            // Extra message if really slow
            if (checkCount === 20) {
              const message = document.createElement('div');
              message.style.marginTop = '10px';
              message.style.fontSize = '12px';
              message.innerHTML = 'Taking longer than expected.<br>Game may still be loading...';
              loadingDiv.appendChild(message);
            }
            
            // Add reload button for very slow loads
            if (checkCount === 30) {
              const button = document.createElement('button');
              button.textContent = 'Reload';
              button.style.marginTop = '10px';
              button.style.padding = '5px 10px';
              button.style.background = '#4a6ed3';
              button.style.color = 'white';
              button.style.border = 'none';
              button.style.borderRadius = '4px';
              button.style.cursor = 'pointer';
              button.onclick = function() {
                window.location.reload();
              };
              loadingDiv.appendChild(button);
            }
            
            if (hideLoader() || checkCount > 60) {
              clearInterval(checkInterval);
            }
          }, 1000);
          
          // Also check after window load
          window.addEventListener('load', function() {
            // Wait a moment after load to check again
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
        .error-details {
          background: rgba(0,0,0,0.2);
          padding: 10px;
          border-radius: 4px;
          margin: 15px 0;
          font-family: monospace;
          word-break: break-all;
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
        <div class="error-details">
          ${error.message || 'Unknown error'}
        </div>
        <p>Try these options:</p>
        <button onclick="window.location.reload()">Reload Game</button>
        <button onclick="window.history.back()">Go Back</button>
        <button onclick="window.location.href='/'">Home</button>
      </div>
      <script>
        // Auto-reload after a short delay
        setTimeout(function() {
          window.location.reload();
        }, 10000);
      </script>
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
  event.waitUntil(clients.claim());
  
  // Clear any caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
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