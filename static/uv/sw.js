/*global UVServiceWorker,__uv$config*/
/*
 * UV Service Worker for Ultraviolet proxy
 * High-Load Optimized Version
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Configuration with optimizations for high load
const CONFIG = {
  FETCH_TIMEOUT: 120000,      // 2 minute timeout
  CONNECTION_LIMIT: 30,       // Maximum simultaneous connections
  RETRY_COUNT: 3,             // Number of retry attempts
  RETRY_DELAY: 1000,          // Delay between retries in ms
  LOG_LEVEL: 'error',         // Reduce logging to improve performance
  HIGH_LOAD_THRESHOLD: 15     // Number of active requests to trigger high-load mode
};

// Request management
let activeRequests = 0;
let peakRequests = 0;
const pendingRequests = new Map(); // Track requests in progress
const requestQueue = [];

// Track connection health
let bareServerHealth = {
  successCount: 0,
  failureCount: 0,
  lastSuccessTime: Date.now(),
  isHealthy: true
};

// Process next request from queue
function processNextRequest() {
  // Don't process if we're at connection limit
  if (activeRequests >= CONFIG.CONNECTION_LIMIT || requestQueue.length === 0) {
    return;
  }
  
  // Get next request
  const nextRequest = requestQueue.shift();
  nextRequest.resolve();
}

// Detect if we're in high-load mode
function isHighLoad() {
  return activeRequests >= CONFIG.HIGH_LOAD_THRESHOLD;
}

// Check if a URL is a game resource
function isGameResource(url) {
  if (!url) return false;
  
  // Critical game resource extensions
  const gameExtensions = ['.js', '.wasm', '.json', '.unity3d', '.data'];
  
  // Check if this is likely a game file
  if (gameExtensions.some(ext => url.endsWith(ext))) {
    return true;
  }
  
  // Check for game domains
  const gameDomains = ['unity', 'webgl', 'github.io', 'gitlab.io', 'itch.io'];
  return gameDomains.some(domain => url.includes(domain));
}

// Get resource priority (1 highest, 5 lowest)
function getResourcePriority(url, headers) {
  // Document/HTML - always highest priority
  if (headers && headers.get('accept')?.includes('text/html')) {
    return 1;
  }
  
  // Game code resources - high priority
  if (url.endsWith('.js') || url.endsWith('.wasm') || url.endsWith('.json')) {
    return 2;
  }
  
  // CSS and font files - medium-high priority
  if (url.endsWith('.css') || url.includes('font') || 
      url.endsWith('.woff') || url.endsWith('.woff2') || url.endsWith('.ttf')) {
    return 3;
  }
  
  // Small images - medium priority
  if (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.svg') || 
      url.endsWith('.gif') || url.endsWith('.webp')) {
    return 4;
  }
  
  // All other resources - lowest priority
  return 5;
}

// Function to handle requests during high load
async function highLoadFetch(event, retryCount = 0) {
  const url = new URL(event.request.url);
  const request = event.request;
  const priority = getResourcePriority(url.toString(), request.headers);
  
  // During high load, possibly delay low-priority requests
  if (isHighLoad() && priority > 3 && retryCount === 0) {
    // Add random delay for low-priority requests to prevent overload
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
  }
  
  // Add request to tracking
  const requestId = Date.now() + Math.random().toString(36).substring(2, 9);
  pendingRequests.set(requestId, {
    url: url.toString(),
    startTime: Date.now(),
    priority,
    retries: retryCount
  });
  
  activeRequests++;
  updatePeakRequests();
  
  try {
    // Timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), CONFIG.FETCH_TIMEOUT);
    });
    
    // Actual fetch
    const fetchPromise = sw.fetch(event);
    
    // Race between fetch and timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    // For HTML responses in game resources, inject the loading fixes
    if (isGameResource(url.toString()) && 
        response.headers.get('content-type')?.includes('text/html')) {
      try {
        return await injectGameFixes(response);
      } catch (injectionError) {
        console.error('Error injecting game fixes:', injectionError);
        return response;
      }
    }
    
    // Update bare server health
    bareServerHealth.successCount++;
    bareServerHealth.lastSuccessTime = Date.now();
    bareServerHealth.isHealthy = true;
    
    return response;
  } catch (error) {
    // Update health status on failure
    bareServerHealth.failureCount++;
    if (bareServerHealth.failureCount > 10 && 
        bareServerHealth.successCount / Math.max(1, bareServerHealth.failureCount) < 0.7) {
      bareServerHealth.isHealthy = false;
    }
    
    // Retry logic
    if (retryCount < CONFIG.RETRY_COUNT) {
      // Add delay between retries
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * (retryCount + 1)));
      return highLoadFetch(event, retryCount + 1);
    }
    
    throw error;
  } finally {
    // Clean up tracking
    pendingRequests.delete(requestId);
    activeRequests--;
    
    // Process next queued request
    processNextRequest();
  }
}

// Update peak request count
function updatePeakRequests() {
  if (activeRequests > peakRequests) {
    peakRequests = activeRequests;
  }
}

// Inject fixes to improve game loading speed and prevent blank screens
async function injectGameFixes(response) {
  // Only process HTML responses
  if (!response.headers.get('content-type')?.includes('text/html')) {
    return response;
  }
  
  try {
    const html = await response.text();
    
    // Skip UV config data
    if (html.includes('__uv$config') || html.includes('__uv$bareData')) {
      return new Response(html, response);
    }
    
    // Apply our fixes to the HTML
    let modifiedHtml = html;
    
    // Add WebGL fixes to head
    if (modifiedHtml.includes('</head>')) {
      const headFixesCode = `
      <!-- UV WebGL Speed Fixes -->
      <script>
      (function() {
        console.log('[UV] Applying performance fixes');
        
        // Fix blank screen issues
        const originalUserAgent = navigator.userAgent;
        Object.defineProperty(navigator, 'userAgent', {
          get: function() { return originalUserAgent.replace(/Headless/g, ''); }
        });
        
        // Make WebGL always available
        window.hasWebGL = function() { return true; };
        window.WebGLRenderingContext = window.WebGLRenderingContext || function(){};
        
        // Fix canvas sizing
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
          if ((this.width === 0 || this.height === 0) && contextType.includes('webgl')) {
            this.width = window.innerWidth * 0.8 || 800;
            this.height = window.innerHeight * 0.8 || 600;
          }
          
          if (contextType.includes('webgl')) {
            contextAttributes = contextAttributes || {};
            contextAttributes.failIfMajorPerformanceCaveat = false;
            contextAttributes.powerPreference = 'high-performance';
            
            // Try to create context
            try {
              const ctx = originalGetContext.call(this, contextType, contextAttributes);
              if (ctx) {
                // Make canvas visible
                this.style.display = 'block';
                this.style.visibility = 'visible';
                return ctx;
              }
              
              // Try alternatives
              const alternatives = ['webgl', 'experimental-webgl', 'webgl2'];
              for (const alt of alternatives) {
                if (alt !== contextType) {
                  try {
                    return originalGetContext.call(this, alt, contextAttributes);
                  } catch(e) {}
                }
              }
            } catch(e) {}
          }
          
          return originalGetContext.call(this, contextType, contextAttributes);
        };
        
        // Fix loading detection
        window.addEventListener('load', function() {
          // Check if page is blank
          setTimeout(function() {
            if (document.body) {
              // Check for content
              const hasContent = document.body.innerText.trim().length > 20 ||
                                document.querySelectorAll('canvas').length > 0 ||
                                document.querySelectorAll('img').length > 0;
              
              if (!hasContent) {
                console.warn('[UV] Page appears blank, trying to fix...');
                
                // Make body visible
                document.body.style.backgroundColor = '#000';
                document.body.style.color = '#fff';
                document.body.style.visibility = 'visible';
                
                // Check for canvas
                if (!document.querySelector('canvas')) {
                  console.log('[UV] No canvas found, creating one');
                  
                  // Create placeholder canvas
                  const canvas = document.createElement('canvas');
                  canvas.width = window.innerWidth * 0.8;
                  canvas.height = window.innerHeight * 0.7;
                  canvas.style.display = 'block';
                  canvas.style.margin = '0 auto';
                  canvas.style.backgroundColor = '#000';
                  document.body.appendChild(canvas);
                  
                  // Try to initialize WebGL on this canvas
                  try {
                    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    if (gl) {
                      gl.clearColor(0.0, 0.0, 0.0, 1.0);
                      gl.clear(gl.COLOR_BUFFER_BIT);
                    }
                  } catch(e) {}
                }
              }
            }
          }, 3000);
        });
      })();
      </script>
      `;
      
      modifiedHtml = modifiedHtml.replace('</head>', headFixesCode + '</head>');
    }
    
    // Add loading indicator
    if (modifiedHtml.includes('<body')) {
      const bodyPos = modifiedHtml.indexOf('<body') + '<body'.length;
      const bodyEndPos = modifiedHtml.indexOf('>', bodyPos);
      
      if (bodyEndPos !== -1) {
        const loadingCode = `
        <!-- UV Loading Indicator -->
        <script>
        (function() {
          // Create loading indicator
          const loader = document.createElement('div');
          loader.id = 'uv-loading';
          loader.style.position = 'fixed';
          loader.style.top = '50%';
          loader.style.left = '50%';
          loader.style.transform = 'translate(-50%, -50%)';
          loader.style.background = 'rgba(0,0,0,0.8)';
          loader.style.color = 'white';
          loader.style.padding = '20px';
          loader.style.borderRadius = '10px';
          loader.style.textAlign = 'center';
          loader.style.fontFamily = 'Arial, sans-serif';
          loader.style.zIndex = '9999';
          
          // Add spinner
          const spinner = document.createElement('div');
          spinner.style.width = '40px';
          spinner.style.height = '40px';
          spinner.style.margin = '0 auto 15px auto';
          spinner.style.border = '4px solid rgba(255,255,255,0.3)';
          spinner.style.borderTop = '4px solid white';
          spinner.style.borderRadius = '50%';
          spinner.style.animation = 'uvSpin 1s linear infinite';
          
          // Add styles
          const style = document.createElement('style');
          style.textContent = '@keyframes uvSpin {0% {transform:rotate(0deg)} 100% {transform:rotate(360deg)}}';
          document.head.appendChild(style);
          
          // Add content
          loader.appendChild(spinner);
          loader.appendChild(document.createTextNode('Loading Game...'));
          document.body.appendChild(loader);
          
          // Hide when content loads
          function checkContent() {
            const hasCanvas = document.querySelector('canvas');
            const hasContent = document.body.querySelectorAll('img, canvas, svg').length > 0;
            
            if (hasCanvas || hasContent) {
              const loader = document.getElementById('uv-loading');
              if (loader && loader.parentNode) {
                loader.parentNode.removeChild(loader);
              }
              return true;
            }
            return false;
          }
          
          // Check periodically
          let checkAttempts = 0;
          const checkInterval = setInterval(function() {
            checkAttempts++;
            if (checkContent() || checkAttempts > 30) {
              clearInterval(checkInterval);
            }
          }, 1000);
          
          // Also check after load
          window.addEventListener('load', function() {
            setTimeout(checkContent, 1000);
          });
        })();
        </script>
        `;
        
        modifiedHtml = modifiedHtml.substring(0, bodyEndPos + 1) + 
                      loadingCode + 
                      modifiedHtml.substring(bodyEndPos + 1);
      }
    }
    
    // Return modified HTML
    return new Response(modifiedHtml, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    console.error('Error modifying HTML:', error);
    return response;
  }
}

// Main fetch handler with high-load optimizations
self.addEventListener('fetch', event => {
  // Only handle UV routes
  if (!event.request.url.startsWith(self.registration.scope) && 
      !event.request.url.includes('/uv/')) {
    return;
  }

  event.respondWith((async () => {
    try {
      const url = new URL(event.request.url);
      
      // Always let service and bare paths go directly to UV
      if (url.pathname.startsWith('/uv/service/') || 
          url.pathname.startsWith('/bare/')) {
        // Queue if we're at connection limit and this isn't a high priority request
        if (activeRequests >= CONFIG.CONNECTION_LIMIT) {
          const priority = getResourcePriority(url.toString(), event.request.headers);
          
          // Only queue lower priority requests
          if (priority > 2) {
            await new Promise(resolve => {
              requestQueue.push({ resolve, event, priority });
              
              // Sort queue by priority
              requestQueue.sort((a, b) => a.priority - b.priority);
            });
          }
        }
        
        return await highLoadFetch(event);
      }
      
      // For all other requests, use standard UV handling
      return await sw.fetch(event);
    } catch (error) {
      console.error('Fetch error:', error);
      
      // Create a user-friendly error page
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Loading Error</title>
          <style>
            body { font-family: Arial; color: white; background: #222; text-align: center; padding: 40px 20px; }
            .box { max-width: 500px; margin: 0 auto; background: #333; padding: 20px; border-radius: 10px; }
            button { padding: 10px 20px; background: #4a6ed3; color: white; border: none; margin: 10px; 
                    border-radius: 4px; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>Game Loading Error</h2>
            <p>The game is taking too long to load. This might be because the server is currently busy.</p>
            <p>Error: ${error.message}</p>
            <button onclick="window.location.reload()">Try Again</button>
            <button onclick="window.history.back()">Go Back</button>
          </div>
          <script>
            // Try again automatically after a delay
            setTimeout(() => window.location.reload(), 10000);
          </script>
        </body>
        </html>
      `, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    }
  })());
});

// Install handler
self.addEventListener('install', event => {
  console.log('[UV SW] Installing high-load optimized worker...');
  self.skipWaiting();
});

// Activate handler
self.addEventListener('activate', event => {
  console.log('[UV SW] Activated');
  event.waitUntil(clients.claim());
});

// Listen for messages
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Return stats if requested
  if (event.data?.type === 'GET_STATS') {
    event.ports[0].postMessage({
      activeRequests,
      peakRequests,
      queueLength: requestQueue.length,
      bareHealth: bareServerHealth,
      highLoadMode: isHighLoad()
    });
  }
});
