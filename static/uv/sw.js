/*global UVServiceWorker,__uv$config*/
/*
 * UV Service Worker - High Performance Edition
 * Optimized for faster loading and fewer black screens
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Configuration with optimized settings
const CONFIG = {
  FETCH_TIMEOUT: 90000,        // 90 second timeout (shorter for better responsiveness)
  RETRY_COUNT: 2,              // Fewer retries for faster recovery
  RETRY_DELAY: 800,            // Initial delay between retries
  BLACK_SCREEN_TIMEOUT: 15000, // 15 seconds to detect black screens
  LOG_LEVEL: 'error'           // Reduced logging for better performance
};

// Track performance metrics
let metrics = {
  requestsTotal: 0,
  requestsSuccess: 0,
  requestsFailed: 0,
  blackScreensFixed: 0,
  startTime: Date.now()
};

// Initialize
console.log('[UV SW] High-Performance service worker initializing');

// Detect if a URL is for game content
function isGameContent(url) {
  if (!url) return false;
  
  return url.includes('/uv/service/');
}

// Ultra-fast optimized fetch with priority handling
async function optimizedFetch(event) {
  const url = new URL(event.request.url);
  const reqUrl = url.toString();
  
  // Track request
  metrics.requestsTotal++;
  
  // Process direct service or bare requests immediately
  if (url.pathname.startsWith('/bare/')) {
    try {
      const response = await sw.fetch(event);
      metrics.requestsSuccess++;
      return response;
    } catch (error) {
      metrics.requestsFailed++;
      console.error('[UV SW] Bare error:', error.message);
      throw error;
    }
  }
  
  // For game content, use specialized handling
  if (isGameContent(reqUrl)) {
    try {
      // Use a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), CONFIG.FETCH_TIMEOUT);
      });
      
      // Make the request with timeout
      const response = await Promise.race([sw.fetch(event), timeoutPromise]);
      
      // For HTML content, fix blank/black screens
      if (response.headers.get('content-type')?.includes('text/html')) {
        const modifiedResponse = await fixBlackScreens(response);
        metrics.requestsSuccess++;
        return modifiedResponse;
      }
      
      metrics.requestsSuccess++;
      return response;
    } catch (error) {
      metrics.requestsFailed++;
      console.error('[UV SW] Game content error:', error.message);
      
      // Try one more time with a clean request
      if (error.message.includes('timeout') || error.message.includes('network')) {
        try {
          console.log('[UV SW] Retrying with clean request');
          return await sw.fetch(event);
        } catch (retryError) {
          throw error; // Use original error if retry fails
        }
      }
      
      throw error;
    }
  }
  
  // Default handling for all other requests
  try {
    const response = await sw.fetch(event);
    metrics.requestsSuccess++;
    return response;
  } catch (error) {
    metrics.requestsFailed++;
    console.error('[UV SW] Default fetch error:', error.message);
    throw error;
  }
}

// Fix for blank/black screens
async function fixBlackScreens(response) {
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
    
    // Insert critical fixes for blank screens
    let modifiedHtml = text;
    
    // Add head fixes for faster load and black screen prevention
    if (modifiedHtml.includes('<head')) {
      const headEnd = modifiedHtml.indexOf('>', modifiedHtml.indexOf('<head')) + 1;
      modifiedHtml = modifiedHtml.substring(0, headEnd) + `
      <script>
      (function() {
        // Track load time
        window.__gameLoadStart = Date.now();
        
        // Fix for blank screens
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
          const element = originalCreateElement.call(document, tagName);
          
          // Make canvas visible immediately
          if (tagName.toLowerCase() === 'canvas') {
            element.style.display = 'block';
            element.style.visibility = 'visible';
            
            // Make sure Canvas has size
            const originalWidth = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width');
            const originalHeight = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'height');
            
            Object.defineProperty(element, 'width', {
              get: function() { return originalWidth.get.call(this); },
              set: function(v) {
                const result = originalWidth.set.call(this, v);
                if (v === 0) {
                  originalWidth.set.call(this, window.innerWidth * 0.8);
                }
                return result;
              }
            });
            
            Object.defineProperty(element, 'height', {
              get: function() { return originalHeight.get.call(this); },
              set: function(v) {
                const result = originalHeight.set.call(this, v);
                if (v === 0) {
                  originalHeight.set.call(this, window.innerHeight * 0.8);
                }
                return result;
              }
            });
          }
          
          return element;
        };
        
        // Make WebGL always available
        window.hasWebGL = function() { return true; };
        window.WebGLRenderingContext = window.WebGLRenderingContext || function(){};
        
        // Fix user agent for compatibility
        const originalUserAgent = navigator.userAgent;
        Object.defineProperty(navigator, 'userAgent', {
          get: function() { return originalUserAgent.replace(/Headless/g, ''); }
        });
      })();
      </script>
      ` + modifiedHtml.substring(headEnd);
    }
    
    // Add aggressive fixes at end of body
    if (modifiedHtml.includes('</body>')) {
      const bodyEnd = modifiedHtml.indexOf('</body>');
      modifiedHtml = modifiedHtml.substring(0, bodyEnd) + `
      <script>
      (function() {
        // Fast blank screen detection and fix
        window.addEventListener('load', function() {
          // Wait a short time then check for content
          setTimeout(function() {
            // Fix visibility of all canvases
            document.querySelectorAll('canvas').forEach(function(canvas) {
              canvas.style.display = 'block';
              canvas.style.visibility = 'visible';
              
              // Fix zero-sized canvas
              if (canvas.width === 0 || canvas.height === 0) {
                canvas.width = window.innerWidth * 0.8;
                canvas.height = window.innerHeight * 0.8;
              }
            });
            
            // Fix game containers
            document.querySelectorAll('[id*="game"], [id*="unity"], [class*="game"], [class*="unity"]').forEach(function(el) {
              el.style.display = 'block';
              el.style.visibility = 'visible';
            });
            
            // Create backup canvas if needed
            if (!document.querySelector('canvas') && document.body) {
              // Page might need a canvas to initialize
              const canvas = document.createElement('canvas');
              canvas.width = window.innerWidth * 0.8;
              canvas.height = window.innerHeight * 0.8;
              canvas.style.display = 'block';
              canvas.style.margin = '0 auto';
              canvas.style.background = '#000';
              document.body.appendChild(canvas);
              
              // Try to initialize WebGL
              try {
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (gl) {
                  gl.clearColor(0.0, 0.0, 0.0, 1.0);
                  gl.clear(gl.COLOR_BUFFER_BIT);
                }
              } catch(e) {}
            }
            
            // Fix body if needed
            if (document.body) {
              document.body.style.background = document.body.style.background || '#000';
              document.body.style.color = document.body.style.color || '#fff';
            }
            
            // Log load time
            if (window.__gameLoadStart) {
              console.log('Game loaded in ' + (Date.now() - window.__gameLoadStart) + 'ms');
            }
          }, 3000);
        });
      })();
      </script>
      ` + modifiedHtml.substring(bodyEnd);
    }
    
    metrics.blackScreensFixed++;
    
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

// Create better error page
function createErrorPage(error) {
  const uptime = ((Date.now() - metrics.startTime) / 1000).toFixed(1);
  const successRate = metrics.requestsTotal ? 
    ((metrics.requestsSuccess / metrics.requestsTotal) * 100).toFixed(1) : 0;
  
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error Loading Game</title>
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
          max-width: 500px;
          margin: 40px auto;
          background: #333;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        h2 { margin-top: 0; color: #f44336; }
        .details {
          margin: 15px 0;
          padding: 10px;
          background: rgba(0,0,0,0.2);
          border-radius: 4px;
          text-align: left;
          font-size: 13px;
        }
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
        button.secondary { background: #757575; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>We're having trouble loading this game</h2>
        <p>Sorry! This game isn't loading properly. If the issue continues, please visit our support team by going to the home page and clicking the phone icon at the bottom.</p>
        
        <div class="details">
          <p><b>Error:</b> ${error.message || 'Unknown error'}</p>
          <p><b>Success Rate:</b> ${successRate}% (${metrics.requestsSuccess}/${metrics.requestsTotal})</p>
          <p><b>Black Screens Fixed:</b> ${metrics.blackScreensFixed}</p>
          <p><b>Uptime:</b> ${uptime}s</p>
        </div>
        
        <div>
          <button onclick="window.location.reload()">Try Again</button>
          <button class="secondary" onclick="window.location.href='/'">Go Home</button>
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
      !event.request.url.includes('/uv/')) {
    return;
  }

  event.respondWith((async () => {
    try {
      // Use optimized fetch
      return await optimizedFetch(event);
    } catch (err) {
      console.error('[UV SW] Fatal error:', err);
      return createErrorPage(err);
    }
  })());
});

// Install handler
self.addEventListener('install', event => {
  console.log('[UV SW] Installing high-performance service worker...');
  self.skipWaiting();
});

// Activate handler
self.addEventListener('activate', event => {
  console.log('[UV SW] Activated');
  event.waitUntil(clients.claim());
});
