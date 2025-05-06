/*global UVServiceWorker,__uv$config*/
/*
 * UV Service Worker for Ultraviolet proxy
 * High-Performance Edition for handling high user load
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Performance-focused configuration
const CONFIG = {
  FETCH_TIMEOUT: 120000,      // 2 minute timeout (reduced to be more responsive)
  MAX_RETRIES: 3,             // Number of retry attempts for failed requests
  RETRY_DELAY: 800,           // Initial delay between retries in ms
  RETRY_BACKOFF: 1.5,         // Exponential backoff factor
  MAX_CONCURRENT_REQUESTS: 18, // Higher limit for concurrent requests to handle more users
  CRITICAL_RESOURCE_BOOST: 1, // Extra retries for critical resources
  LOG_LEVEL: 'error'          // Reduce logging to improve performance
};

// Monitor active requests to prevent overloading
let activeRequests = 0;
let peakRequests = 0;
const requestQueue = [];
const QUEUE_PRIORITY = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2
};

// Keep track of game resources to prioritize them
const gameUrls = new Set();

// Process next request from queue based on priority
function processNextRequest() {
  if (requestQueue.length === 0 || activeRequests >= CONFIG.MAX_CONCURRENT_REQUESTS) {
    return;
  }
  
  // Sort queue by priority
  requestQueue.sort((a, b) => a.priority - b.priority);
  
  // Get next request
  const nextRequest = requestQueue.shift();
  nextRequest.resolve();
}

// Update peak requests metric
function updatePeakRequests() {
  if (activeRequests > peakRequests) {
    peakRequests = activeRequests;
    console.log(`[UV SW] New peak concurrent requests: ${peakRequests}`);
  }
}

// Detect WebGL and game content for special handling
function isGameResource(url) {
  if (!url) return false;
  
  // Check for game URLs we've seen before
  if (gameUrls.has(url)) return true;
  
  // Game-related patterns
  const gamePatterns = [
    'unity', 'webgl', 'game', '/play/', '.unity3d', 
    'canvas', '/games/', 'arcade', '3d', 'asset'
  ];
  
  // Critical game resources and libraries
  const criticalResources = [
    '.js', '.wasm', '.json', '.data', '.unity3d', 
    '.mem', '.bin', '.dll', '.assets', '.resource'
  ];
  
  // Check if this is a known game pattern
  const isGamePattern = gamePatterns.some(pattern => url.includes(pattern));
  
  // Check if this is a critical resource file
  const isCriticalResource = criticalResources.some(ext => url.endsWith(ext));
  
  // If this is a game resource, remember it for future prioritization
  if (isGamePattern || isCriticalResource) {
    // Store game URLs to prioritize them in the future
    // Limit the set size to prevent memory issues
    if (gameUrls.size < 1000) {
      gameUrls.add(url);
    }
    return true;
  }
  
  return false;
}

// Prioritize request based on URL patterns
function getPriority(url) {
  // Game resources get high priority
  if (isGameResource(url)) {
    return QUEUE_PRIORITY.HIGH;
  }
  
  // HTML pages get medium priority
  if (url.endsWith('.html') || url.endsWith('/')) {
    return QUEUE_PRIORITY.MEDIUM;
  }
  
  // Default to low priority
  return QUEUE_PRIORITY.LOW;
}

// High-performance fetch with retry, timeout, and priority queue
const enhancedFetch = async (event, retries = CONFIG.MAX_RETRIES, retryDelay = CONFIG.RETRY_DELAY) => {
  const url = new URL(event.request.url).toString();
  const priority = getPriority(url);
  
  // Check if we need to queue this request
  if (activeRequests >= CONFIG.MAX_CONCURRENT_REQUESTS) {
    // Queue the request with appropriate priority
    await new Promise(resolve => {
      requestQueue.push({ resolve, event, priority });
    });
  }
  
  // Increment active requests counter
  activeRequests++;
  updatePeakRequests();
  
  try {
    // Give game resources more retries for reliability
    if (isGameResource(url) && retries === CONFIG.MAX_RETRIES) {
      retries += CONFIG.CRITICAL_RESOURCE_BOOST;
    }
    
    // Use a timeout promise to prevent hanging requests
    return await Promise.race([
      sw.fetch(event),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), CONFIG.FETCH_TIMEOUT)
      )
    ]);
  } catch (error) {
    // Only log errors for high-priority resources to reduce overhead
    if (priority === QUEUE_PRIORITY.HIGH) {
      console.error(`[UV SW] Error fetching game resource: ${url.substring(0, 50)}... - ${error.message}`);
    }
    
    // Retry with exponential backoff
    if (retries > 0) {
      // Reduced logging for better performance
      if (priority === QUEUE_PRIORITY.HIGH) {
        console.log(`[UV SW] Retrying game resource (${retries} left)`);
      }
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return enhancedFetch(event, retries - 1, retryDelay * CONFIG.RETRY_BACKOFF);
    }
    
    throw error;
  } finally {
    // Decrement active requests counter
    activeRequests--;
    
    // Process next request in queue
    processNextRequest();
  }
};

// Fix blank screen issues with WebGL games and Unity content
const injectGameFixes = async (response, url) => {
  // Only process HTML responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('text/html')) {
    return response;
  }
  
  const clone = response.clone();
  try {
    let text = await clone.text();
    
    // Skip if it's UV configuration data
    if (text.includes('__uv$bareData') || text.includes('__uv$cookies')) {
      return response;
    }
    
    // Add fixes to make games load faster and prevent blank screens
    
    // Add head scripts for early initialization
    if (text.includes('<head')) {
      const headPos = text.indexOf('<head') + '<head'.length;
      const headEndPos = text.indexOf('>', headPos);
      if (headEndPos !== -1) {
        text = text.substring(0, headEndPos + 1) + 
              `
              <!-- UV Performance Booster -->
              <script data-uv-boost>
              (function() {
                console.log('[UV Boost] Initializing performance booster');
                
                // Track loading attempts
                try {
                  if (!sessionStorage.getItem('uv-game-loaded')) {
                    sessionStorage.setItem('uv-game-loaded', '1');
                    sessionStorage.setItem('uv-load-attempts', '1');
                  } else {
                    const attempts = parseInt(sessionStorage.getItem('uv-load-attempts') || '1');
                    sessionStorage.setItem('uv-load-attempts', (attempts + 1).toString());
                  }
                } catch(e) {}
                
                // Set up faster resource loading
                const observer = new PerformanceObserver((list) => {
                  list.getEntries().forEach((entry) => {
                    if (entry.initiatorType === 'script' && entry.duration > 1000) {
                      console.log('[UV Boost] Slow script detected:', entry.name);
                    }
                  });
                });
                try { observer.observe({entryTypes: ['resource']}); } catch(e) {}
                
                // Speed up canvas operations
                window.requestAnimationFrame = window.requestAnimationFrame || function(callback) {
                  return window.setTimeout(callback, 1000/60);
                };
                
                // Preconnect to common CDNs
                const cdns = [
                  'cdn.jsdelivr.net',
                  'cdnjs.cloudflare.com',
                  'unpkg.com',
                  'fonts.googleapis.com'
                ];
                cdns.forEach(cdn => {
                  const link = document.createElement('link');
                  link.rel = 'preconnect';
                  link.href = 'https://' + cdn;
                  link.crossOrigin = 'anonymous';
                  document.head.appendChild(link);
                });
                
                // Prevent blank screen by fixing navigator
                const originalUserAgent = navigator.userAgent;
                Object.defineProperty(navigator, 'userAgent', {
                  get: function() {
                    return originalUserAgent.replace(/Headless/g, '');
                  }
                });
                
                // Ensure WebGL is available
                window.hasWebGL = function() { return true; };
                window.WebGLRenderingContext = window.WebGLRenderingContext || function(){};
              })();
              </script>
              ` + text.substring(headEndPos + 1);
      }
    }
    
    // Add blank screen detection before closing head
    if (text.includes('</head>')) {
      const headClosePos = text.indexOf('</head>');
      text = text.substring(0, headClosePos) + 
            `
            <!-- UV Blank Screen Detector -->
            <script data-uv-blank-detector>
            (function() {
              // Detect and fix blank screens
              let blankScreenTimer;
              let gameLoadTimer;
              
              function detectBlankScreen() {
                window.addEventListener('load', function() {
                  // Give the game a moment to initialize
                  setTimeout(function() {
                    if (document.body) {
                      // Check if the page appears empty
                      const hasContent = document.body.innerText.trim().length > 20 || 
                                        document.querySelectorAll('canvas').length > 0 || 
                                        document.querySelectorAll('img').length > 0;
                                        
                      // Check if the canvas is working
                      const hasWorkingCanvas = Array.from(document.querySelectorAll('canvas')).some(canvas => {
                        const rect = canvas.getBoundingClientRect();
                        return rect.width > 10 && rect.height > 10;
                      });
                      
                      if (!hasContent || !hasWorkingCanvas) {
                        console.log('[UV Boost] Blank screen detected, attempting recovery...');
                        
                        // Get attempt count
                        let attempts = 1;
                        try {
                          attempts = parseInt(sessionStorage.getItem('uv-load-attempts') || '1');
                        } catch(e) {}
                        
                        // Reload if not too many attempts
                        if (attempts < 4) {
                          console.log('[UV Boost] Reloading (attempt ' + attempts + ')');
                          window.location.reload();
                        } else {
                          // After multiple attempts, try to create a fallback canvas
                          console.log('[UV Boost] Creating fallback canvas...');
                          createFallbackCanvas();
                        }
                      }
                    }
                  }, 5000);
                });
              }
              
              // Creates a fallback canvas when games fail to load
              function createFallbackCanvas() {
                if (document.body && !document.querySelector('#uv-fallback-canvas')) {
                  // Create a container for the game
                  const container = document.createElement('div');
                  container.id = 'uv-game-container';
                  container.style.position = 'fixed';
                  container.style.top = '0';
                  container.style.left = '0';
                  container.style.width = '100%';
                  container.style.height = '100%';
                  container.style.display = 'flex';
                  container.style.flexDirection = 'column';
                  container.style.alignItems = 'center';
                  container.style.justifyContent = 'center';
                  container.style.background = '#000';
                  container.style.zIndex = '9999';
                  
                  // Add a canvas
                  const canvas = document.createElement('canvas');
                  canvas.id = 'uv-fallback-canvas';
                  canvas.width = window.innerWidth * 0.8;
                  canvas.height = window.innerHeight * 0.8;
                  canvas.style.border = '1px solid #333';
                  canvas.style.background = '#000';
                  container.appendChild(canvas);
                  
                  // Add a message
                  const message = document.createElement('div');
                  message.style.color = '#fff';
                  message.style.marginTop = '20px';
                  message.style.fontFamily = 'Arial, sans-serif';
                  message.innerHTML = 'Game is taking longer than usual to load...<br>You can wait or try a different game.';
                  container.appendChild(message);
                  
                  // Add a retry button
                  const button = document.createElement('button');
                  button.style.marginTop = '15px';
                  button.style.padding = '8px 15px';
                  button.style.background = '#4a6ed3';
                  button.style.color = '#fff';
                  button.style.border = 'none';
                  button.style.borderRadius = '4px';
                  button.style.cursor = 'pointer';
                  button.textContent = 'Try Again';
                  button.onclick = function() {
                    window.location.reload();
                  };
                  container.appendChild(button);
                  
                  // Add to body
                  document.body.appendChild(container);
                  
                  // Initialize WebGL on fallback canvas
                  try {
                    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    if (gl) {
                      gl.clearColor(0.0, 0.0, 0.0, 1.0);
                      gl.clear(gl.COLOR_BUFFER_BIT);
                    }
                  } catch(e) {}
                }
              }
              
              // Fix common WebGL issues
              const originalGetContext = HTMLCanvasElement.prototype.getContext;
              HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
                // Fix WebGL contexts
                if (contextType === 'webgl' || contextType === 'experimental-webgl' || contextType === 'webgl2') {
                  // Fix zero-sized canvas
                  if (this.width === 0 || this.height === 0) {
                    this.width = this.width || window.innerWidth * 0.8 || 800;
                    this.height = this.height || window.innerHeight * 0.8 || 600;
                  }
                  
                  // Apply context attributes that improve compatibility
                  contextAttributes = contextAttributes || {};
                  contextAttributes.failIfMajorPerformanceCaveat = false;
                  contextAttributes.powerPreference = 'high-performance';
                  contextAttributes.preserveDrawingBuffer = true;
                  
                  // Try to create context
                  try {
                    return originalGetContext.call(this, contextType, contextAttributes);
                  } catch (e) {
                    console.error('[UV Boost] WebGL context creation failed, trying alternatives');
                    
                    // Try alternative WebGL contexts
                    const alternatives = ['webgl', 'experimental-webgl', 'webgl2'].filter(t => t !== contextType);
                    for (const alt of alternatives) {
                      try {
                        const ctx = originalGetContext.call(this, alt, contextAttributes);
                        if (ctx) return ctx;
                      } catch (e2) {}
                    }
                  }
                }
                
                // Default fallback
                return originalGetContext.call(this, contextType, contextAttributes);
              };
              
              // Prevent redirect loops
              let pageLoads = 0;
              try {
                pageLoads = parseInt(sessionStorage.getItem('uv-page-loads') || '0');
                sessionStorage.setItem('uv-page-loads', (pageLoads + 1).toString());
              } catch(e) {}
              
              // Only detect blank screens if we haven't reloaded too many times
              if (pageLoads < 5) {
                detectBlankScreen();
              }
              
              // Make sure page elements are visible
              window.addEventListener('load', function() {
                if (document.body) {
                  document.body.style.backgroundColor = document.body.style.backgroundColor || '#000';
                  document.body.style.color = document.body.style.color || '#fff';
                  document.body.style.visibility = 'visible';
                  document.body.style.display = 'block';
                }
              });
            })();
            </script>
            ` + text.substring(headClosePos);
    }
    
    // Add loader to body
    if (text.includes('<body')) {
      const bodyPos = text.indexOf('<body') + '<body'.length;
      const bodyEndPos = text.indexOf('>', bodyPos);
      if (bodyEndPos !== -1) {
        text = text.substring(0, bodyEndPos + 1) + 
              `
              <!-- UV Game Loader -->
              <script data-uv-loader>
              (function() {
                // Ensure the body is visible
                document.body.style.backgroundColor = document.body.style.backgroundColor || '#000';
                document.body.style.color = document.body.style.color || '#fff';
                document.body.style.visibility = 'visible';
                
                // Create loading indicator
                const loader = document.createElement('div');
                loader.id = 'uv-game-loading';
                loader.style.position = 'fixed';
                loader.style.top = '50%';
                loader.style.left = '50%';
                loader.style.transform = 'translate(-50%, -50%)';
                loader.style.backgroundColor = 'rgba(0,0,0,0.8)';
                loader.style.color = 'white';
                loader.style.padding = '20px';
                loader.style.borderRadius = '10px';
                loader.style.textAlign = 'center';
                loader.style.zIndex = '9999';
                loader.style.transition = 'opacity 0.3s ease';
                
                // Create spinner
                const spinner = document.createElement('div');
                spinner.style.width = '40px';
                spinner.style.height = '40px';
                spinner.style.margin = '0 auto 15px auto';
                spinner.style.border = '4px solid rgba(255, 255, 255, 0.3)';
                spinner.style.borderTop = '4px solid white';
                spinner.style.borderRadius = '50%';
                spinner.style.animation = 'uv-spin 1s linear infinite';
                
                // Add keyframes for spinner
                const style = document.createElement('style');
                style.textContent = '@keyframes uv-spin {0% {transform: rotate(0deg);} 100% {transform: rotate(360deg);}}';
                document.head.appendChild(style);
                
                loader.appendChild(spinner);
                loader.appendChild(document.createTextNode('Loading Game...'));
                document.body.appendChild(loader);
                
                // Hide loader when content appears
                function hideLoader() {
                  const hasContent = document.querySelector('canvas') || 
                                    document.querySelector('iframe') ||
                                    document.querySelectorAll('img').length > 2;
                  
                  if (hasContent) {
                    const loader = document.getElementById('uv-game-loading');
                    if (loader) {
                      loader.style.opacity = '0';
                      setTimeout(() => {
                        if (loader.parentNode) {
                          loader.parentNode.removeChild(loader);
                        }
                      }, 300);
                    }
                    return true;
                  }
                  return false;
                }
                
                // Check for content and hide loader when found
                if (!hideLoader()) {
                  let checkCount = 0;
                  const interval = setInterval(() => {
                    if (hideLoader() || checkCount > 30) {
                      clearInterval(interval);
                    }
                    checkCount++;
                  }, 500);
                  
                  // Also check after load event
                  window.addEventListener('load', hideLoader);
                }
              })();
              </script>
              ` + text.substring(bodyEndPos + 1);
      }
    }
    
    // Return modified HTML with fixes
    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    console.error('[UV SW] Error adding game fixes:', error);
  }
  
  return response;
};

// Process fetch events
self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.registration.scope) && 
      !event.request.url.includes('/uv/')) {
    return;
  }

  // Health check endpoint
  if (event.request.url.includes('/status-check')) {
    return event.respondWith(new Response(JSON.stringify({
      status: 'ok',
      timestamp: Date.now(),
      activeRequests,
      peakRequests,
      queueLength: requestQueue.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    }));
  }

  event.respondWith((async () => {
    try {
      const url = new URL(event.request.url).toString();
      
      // Get response with enhanced fetch
      const response = await enhancedFetch(event);
      
      // Apply game fixes if this is a game resource
      if (isGameResource(url) && response.headers.get('content-type')?.includes('text/html')) {
        return injectGameFixes(response, url);
      }
      
      return response;
    } catch (err) {
      console.error('[UV SW] Fatal error:', err);
      
      // Return simple error page to conserve resources
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error</title>
          <style>
            body {font-family:system-ui,sans-serif; color:white; background:#333; margin:0; padding:20px; text-align:center;}
            .box {max-width:500px; margin:40px auto; background:#444; padding:20px; border-radius:8px; box-shadow:0 4px 8px rgba(0,0,0,0.2);}
            button {padding:8px 16px; background:#4a6ed3; color:white; border:none; border-radius:4px; cursor:pointer; margin:5px;}
          </style>
        </head>
        <body>
          <div class="box">
            <h2>Game Load Error</h2>
            <p>There was a problem loading this game. The server might be experiencing high traffic.</p>
            <button onclick="window.location.reload()">Try Again</button>
            <button onclick="window.history.back()">Go Back</button>
          </div>
          <script>
            // Auto-retry once after 5 seconds
            setTimeout(() => window.location.reload(), 5000);
          </script>
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

// Optimized install handler - NO CACHING
self.addEventListener('install', event => {
  console.log('[UV SW] Installing high-performance service worker...');
  self.skipWaiting();
});

// Optimized activate handler
self.addEventListener('activate', event => {
  console.log('[UV SW] Activated');
  event.waitUntil(clients.claim());
  
  // Clean up any old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

// Simple message handler with minimal processing
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Status request
  if (event.data && event.data.type === 'STATUS') {
    if (event.source) {
      event.source.postMessage({
        type: 'STATUS_RESPONSE',
        timestamp: Date.now(),
        metrics: {
          activeRequests,
          queueLength: requestQueue.length,
          peakRequests,
          gameUrlsTracked: gameUrls.size
        }
      });
    }
  }
});
