/global UVServiceWorker,__uv$config/
/*
 * Enhanced service worker script for Ultraviolet proxy
 * With specific fixes for WebGL games and yujiandemo.com
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Configuration with extended timeouts
const CONFIG = {
  FETCH_TIMEOUT: 240000,  // 4 minute timeout for slow sites
  MAX_RETRIES: 3,         // Number of retry attempts
  RETRY_DELAY: 800,       // Delay between retries in ms
  LOG_LEVEL: 'debug'      // Set to 'info' to reduce logging
};

// Log initialization
console.log('[UV Service Worker] Initializing with WebGL game fixes...');

// Enhanced fetch with timeout and retries
const enhancedFetch = async (event, retries = CONFIG.MAX_RETRIES) => {
  try {
    // Get URL information
    const url = new URL(event.request.url);
    const reqUrl = url.toString();
    
    // Special handling for known problem sites
    const isSpecialSite = 
      reqUrl.includes('yujiandemo.com') || 
      reqUrl.includes('yujian');
      
    if (isSpecialSite) {
      console.log(`[UV Service Worker] Handling special site: ${reqUrl.substring(0, 100)}...`);
      
      // Use direct fetch with no timeout for this site
      const response = await sw.fetch(event);
      
      // Check if this is an HTML response that might need WebGL fixes
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        return await addWebGLFixes(response, reqUrl);
      }
      
      return response;
    }
    
    // Special handling for all game URLs
    const isGameUrl = 
      url.pathname.includes('/uv/service/') || 
      url.pathname.includes('/service/') ||
      url.search.includes('game=');
      
    if (isGameUrl) {
      console.log(`[UV Service Worker] Handling game URL: ${reqUrl.substring(0, 100)}...`);
      return await sw.fetch(event);
    }
    
    // For non-game URLs, use timeout
    return await Promise.race([
      sw.fetch(event),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), CONFIG.FETCH_TIMEOUT)
      )
    ]);
  } catch (error) {
    console.error('[UV Service Worker] Fetch error:', error.message);
    
    // Retry logic
    if (retries > 0) {
      console.log(`[UV Service Worker] Retrying fetch (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      return enhancedFetch(event, retries - 1);
    }
    throw error;
  }
};

// Add WebGL fixes for specific sites
const addWebGLFixes = async (response, url) => {
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
      console.error('[UV Service Worker] Detected UV configuration in response body!');
      return response; // Return the original response
    }
    
    // Add WebGL compatibility script for yujiandemo.com
    if (url.includes('yujiandemo.com') || url.includes('yujian')) {
      console.log('[UV Service Worker] Adding WebGL fixes for yujiandemo.com');
      
      // Check if <head> exists
      const headPos = text.indexOf('</head>');
      if (headPos !== -1) {
        // Insert WebGL compatibility scripts before head closes
        text = text.substring(0, headPos) + 
              `
              <!-- WebGL Compatibility Fix -->
              <script>
                // Fix WebGL context creation
                (function() {
                  console.log("[UV WebGL Fix] Initializing WebGL compatibility layer");
                  
                  // Override HTMLCanvasElement.prototype.getContext to fix WebGL
                  const originalGetContext = HTMLCanvasElement.prototype.getContext;
                  HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
                    console.log("[UV WebGL Fix] getContext called with:", contextType);
                    
                    if (contextType === 'webgl' || contextType === 'experimental-webgl' || contextType === 'webgl2') {
                      // Fix WebGL context attributes
                      contextAttributes = contextAttributes || {};
                      
                      // Force attributes that help with compatibility
                      contextAttributes.preserveDrawingBuffer = true;
                      contextAttributes.failIfMajorPerformanceCaveat = false;
                      contextAttributes.powerPreference = 'high-performance';
                      
                      console.log("[UV WebGL Fix] Using fixed WebGL context attributes:", contextAttributes);
                      
                      try {
                        // First try with the requested type
                        const ctx = originalGetContext.call(this, contextType, contextAttributes);
                        if (ctx) {
                          console.log("[UV WebGL Fix] Successfully created WebGL context");
                          
                          // Patch for yujiandemo.com - add missing properties
                          if (!ctx.getShaderPrecisionFormat) {
                            ctx.getShaderPrecisionFormat = function() {
                              return { precision: 23, rangeMin: 127, rangeMax: 127 };
                            };
                          }
                          
                          // Make sure this canvas is visible and properly sized
                          setTimeout(() => {
                            this.style.display = 'block';
                            this.style.visibility = 'visible';
                            if (this.width === 0 || this.height === 0) {
                              this.width = 800;
                              this.height = 600;
                            }
                          }, 100);
                          
                          return ctx;
                        }
                      } catch (e) {
                        console.warn("[UV WebGL Fix] Error creating WebGL context:", e);
                      }
                      
                      // If we're here, the original request failed, try alternatives
                      const alternatives = ['webgl', 'experimental-webgl', 'webgl2'];
                      for (const alt of alternatives) {
                        if (alt !== contextType) {
                          try {
                            console.log("[UV WebGL Fix] Trying alternative context:", alt);
                            const ctx = originalGetContext.call(this, alt, contextAttributes);
                            if (ctx) {
                              console.log("[UV WebGL Fix] Successfully created alternative WebGL context:", alt);
                              return ctx;
                            }
                          } catch (e) {
                            console.warn("[UV WebGL Fix] Error creating alternative context:", e);
                          }
                        }
                      }
                    }
                    
                    // For non-WebGL contexts or if all WebGL attempts failed
                    return originalGetContext.call(this, contextType, contextAttributes);
                  };
                  
                  // Fix for yujiandemo.com - Make sure Unity loader works
                  window.addEventListener('DOMContentLoaded', function() {
                    console.log("[UV WebGL Fix] DOM loaded, checking for Unity container");
                    
                    // Force visibility of game container
                    setTimeout(function checkGameContainer() {
                      const containers = [
                        document.getElementById('unity-container'),
                        document.getElementById('game-container'),
                        document.getElementById('gameContainer'),
                        document.getElementById('canvas'),
                        document.querySelector('canvas'),
                        document.querySelector('[data-unity-canvas]'),
                        document.querySelector('[data-game-canvas]')
                      ].filter(Boolean);
                      
                      if (containers.length > 0) {
                        console.log("[UV WebGL Fix] Found game containers:", containers.length);
                        
                        containers.forEach(container => {
                          container.style.display = 'block';
                          container.style.visibility = 'visible';
                          container.style.opacity = '1';
                          
                          const canvas = container.querySelector('canvas') || container;
                          if (canvas.tagName === 'CANVAS') {
                            canvas.style.display = 'block';
                            canvas.style.visibility = 'visible';
                            canvas.style.opacity = '1';
                            console.log("[UV WebGL Fix] Fixed canvas visibility");
                          }
                        });
                      } else {
                        // Try again in a bit - the Unity container might be created later
                        setTimeout(checkGameContainer, 500);
                      }
                    }, 500);
                  });
                  
                  // Make sure body is visible
                  window.addEventListener('load', function() {
                    if (document.body) {
                      document.body.style.backgroundColor = document.body.style.backgroundColor || '#000';
                      document.body.style.color = document.body.style.color || '#fff';
                      document.body.style.display = 'block';
                      document.body.style.visibility = 'visible';
                    }
                  });
                  
                  // Provide WebGL availability methods
                  window.hasWebGL = function() { return true; };
                  window.isWebGLAvailable = function() { return true; };
                  if (!window.WebGLRenderingContext) {
                    window.WebGLRenderingContext = function(){};
                  }
                  
                  console.log("[UV WebGL Fix] WebGL compatibility layer initialized");
                })();
              </script>
              ` + text.substring(headPos);
              
        // Return modified response
        return new Response(text, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      }
    }
  } catch (error) {
    console.error('[UV Service Worker] Error processing HTML:', error);
  }
  
  return response;
};

// Main fetch event handler
self.addEventListener('fetch', event => {
  // Check if this is a request we should handle
  if (!event.request.url.startsWith(self.registration.scope) && 
      !event.request.url.includes('/uv/')) {
    return;
  }

  event.respondWith((async () => {
    try {
      // Get response with enhanced fetch
      const response = await enhancedFetch(event);
      return response;
    } catch (err) {
      console.error('[UV Service Worker] Fatal error:', err);
      
      // Return user-friendly error page
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Connection Error</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
            ul {
              margin-bottom: 20px;
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
            button.secondary {
              background: #555;
            }
            button:hover {
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Connection Error</h2>
            <p>The service encountered an error: ${err.message}</p>
            <div class="error-details">
              ${err.message}
            </div>
            <p>This might be due to:</p>
            <ul>
              <li>The website blocking proxy access</li>
              <li>Slow or unstable internet connection</li>
              <li>The website using features that require direct access</li>
            </ul>
            <div>
              <button onclick="window.location.reload()">Try Again</button>
              <button class="secondary" onclick="window.history.back()">Go Back</button>
              <button class="secondary" onclick="window.location.href='/'">Home</button>
            </div>
          </div>
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

  // Handle health check
  if (event.data && event.data.type === 'PING') {
    if (event.source) {
      event.source.postMessage({
        type: 'PONG',
        timestamp: Date.now(),
        status: 'healthy'
      });
    }
  }
  
  // Handle cache clearing
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      console.log('[UV Service Worker] Cache cleared by request');
      if (event.source) {
        event.source.postMessage({
          type: 'CACHE_CLEARED',
          timestamp: Date.now()
        });
      }
    });
  }
});
