/*global UVServiceWorker,__uv$config*/
/*
 * UV Service Worker - Enhanced Edition
 * With specific fixes for slower devices and blank screens
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Configuration with improved settings for reliability
const CONFIG = {
  FETCH_TIMEOUT: 180000,       // 3 minute timeout for slow connections
  RETRY_COUNT: 3,              // Number of retry attempts
  RETRY_DELAY: 1000,           // Initial delay between retries in ms
};

// Initialize
console.log('[UV SW] Enhanced service worker initializing');

// Detect WebGL game content for special handling
function isGameContent(url) {
  if (!url) return false;
  
  // Common game engines and platforms
  const gamePatterns = [
    'unity', 'unitycdn', 'webgl', 'game', 'games', 'play',
    '3d', 'canvas', 'html5', 'arcade', 'gitlab.io', 
    'github.io', 'poki.com', 'crazy', 'y8.com'
  ];
  
  return gamePatterns.some(pattern => url.includes(pattern));
}

// Inject fixes for blank screen and WebGL issues
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
    
    // Add early WebGL fixes to head
    if (modifiedHtml.includes('<head')) {
      const headInsertPos = modifiedHtml.indexOf('<head') + '<head'.length;
      const headEndPos = modifiedHtml.indexOf('>', headInsertPos);
      
      if (headEndPos !== -1) {
        modifiedHtml = modifiedHtml.substring(0, headEndPos + 1) + `
        <!-- UV Early WebGL Fixes -->
        <script>
        (function() {
          // Make WebGL detection always return true
          window.hasWebGL = function() { return true; };
          window.hasWebGL2 = function() { return true; };
          window.isWebGLAvailable = function() { return true; };
          
          // Fix navigator user agent reporting
          const originalUserAgent = navigator.userAgent;
          Object.defineProperty(navigator, 'userAgent', {
            get: function() {
              return originalUserAgent.replace(/Headless/g, '');
            }
          });
          
          // Define Unity globals early
          window.unityInstance = window.unityInstance || {};
          window.Unity = window.Unity || { 
            print: function(msg) { console.log('[Unity]', msg); }
          };
          
          // Add early connectivity to common CDNs
          const commonCDNs = [
            'cdn.jsdelivr.net',
            'cdnjs.cloudflare.com',
            'unpkg.com',
            'storage.googleapis.com'
          ];
          
          commonCDNs.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = 'https://' + domain;
            document.head.appendChild(link);
          });
        })();
        </script>
        ` + modifiedHtml.substring(headEndPos + 1);
      }
    }
    
    // Add comprehensive WebGL fixes right before </head>
    if (modifiedHtml.includes('</head>')) {
      const headClosePos = modifiedHtml.indexOf('</head>');
      
      modifiedHtml = modifiedHtml.substring(0, headClosePos) + `
      <!-- UV WebGL Fixes -->
      <script>
      (function() {
        function applyWebGLFixes() {
          console.log('[UV] Applying WebGL fixes for better compatibility');
          
          // Override canvas getContext to fix WebGL issues on more devices
          const originalGetContext = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
            // Fix for zero-sized canvases
            if ((this.width === 0 || this.height === 0) && 
                (contextType === 'webgl' || contextType === 'experimental-webgl' || contextType === 'webgl2')) {
              console.log('[UV WebGL] Fixing zero-sized canvas');
              this.width = this.width || window.innerWidth * 0.8 || 800;
              this.height = this.height || window.innerHeight * 0.8 || 600;
            }
            
            // For WebGL contexts, apply optimizations and fallbacks
            if (contextType === 'webgl' || contextType === 'experimental-webgl' || contextType === 'webgl2') {
              // Make canvas visible
              this.style.display = 'block';
              this.style.visibility = 'visible';
              
              // Try with optimized context attributes first
              contextAttributes = contextAttributes || {};
              contextAttributes.alpha = contextAttributes.alpha !== false; // Use alpha channel
              contextAttributes.antialias = contextAttributes.antialias !== false; // Enable antialiasing
              contextAttributes.depth = contextAttributes.depth !== false; // Enable depth testing
              contextAttributes.premultipliedAlpha = contextAttributes.premultipliedAlpha !== false;
              contextAttributes.preserveDrawingBuffer = true; // Important for screenshots and some games
              contextAttributes.failIfMajorPerformanceCaveat = false; // Critical for slower devices
              contextAttributes.powerPreference = 'high-performance';
              
              try {
                // Try to create the context with our optimized attributes
                const ctx = originalGetContext.call(this, contextType, contextAttributes);
                if (ctx) {
                  // Fix missing methods that some games expect
                  ctx.getShaderPrecisionFormat = ctx.getShaderPrecisionFormat || function() {
                    return { precision: 23, rangeMin: 127, rangeMax: 127 };
                  };
                  
                  // Success - return the context
                  return ctx;
                }
                
                // If that failed, try alternative WebGL contexts
                console.log('[UV WebGL] Primary context creation failed, trying alternatives');
                const alternatives = ['webgl', 'experimental-webgl', 'webgl2'].filter(alt => alt !== contextType);
                
                for (const alt of alternatives) {
                  try {
                    console.log('[UV WebGL] Trying alternative:', alt);
                    const ctx2 = originalGetContext.call(this, alt, contextAttributes);
                    if (ctx2) {
                      console.log('[UV WebGL] Alternative context created successfully');
                      return ctx2;
                    }
                  } catch (e) {
                    console.log('[UV WebGL] Alternative context failed:', e.message);
                  }
                }
                
                // If all WebGL attempts failed and this is a critical canvas, create a fake context
                // Some games just need some context to avoid crashing
                console.warn('[UV WebGL] All WebGL context creation attempts failed');
                
                // If we need to create a fake context
                if (this.id && (this.id.includes('game') || this.id.includes('unity') || this.width > 400)) {
                  console.log('[UV WebGL] Creating fallback context for critical canvas');
                  return createFallbackContext(this);
                }
              } catch (e) {
                console.error('[UV WebGL] Error in WebGL initialization:', e);
                
                // Last resort, try with no attributes
                try {
                  return originalGetContext.call(this, contextType);
                } catch (e2) {
                  console.error('[UV WebGL] Final fallback failed:', e2);
                }
              }
            }
            
            // For non-WebGL contexts, use original implementation
            return originalGetContext.call(this, contextType, contextAttributes);
          };
          
          // Create a minimal fallback context to prevent crashing
          function createFallbackContext(canvas) {
            return {
              canvas: canvas,
              drawingBufferWidth: canvas.width,
              drawingBufferHeight: canvas.height,
              getExtension: function() { return null; },
              getParameter: function() { return 0; },
              getShaderPrecisionFormat: function() { return { precision: 23, rangeMin: 127, rangeMax: 127 }; },
              getError: function() { return 0; },
              getContextAttributes: function() { return {}; },
              viewport: function() {},
              clear: function() {},
              clearColor: function() {},
              clearDepth: function() {},
              enable: function() {},
              disable: function() {},
              blendFunc: function() {},
              blendEquation: function() {},
              createBuffer: function() { return {}; },
              createProgram: function() { return {}; },
              createShader: function() { return {}; },
              createTexture: function() { return {}; }
            };
          }
          
          // Fix Unity games specifically
          function fixUnityGames() {
            console.log('[UV] Applying Unity-specific fixes');
            
            // Unity global objects and functions
            window.UnityLoader = window.UnityLoader || {
              instantiate: function(container, url, params) {
                console.log('[UV Unity] Loading:', url);
                return { SetFullscreen: function() {} };
              },
              SystemInfo: {
                hasWebGL: true,
                mobile: false
              }
            };
            
            window.unityInstance = window.unityInstance || { SendMessage: function() {} };
            
            // Add common Unity callback functions
            window.unityShowBanner = function(text, type) {
              console.log('[Unity Banner]', text);
            };
            
            window.unityProgress = function(gameInstance, progress) {
              console.log('[Unity Progress]', progress);
            };
            
            // Force show Unity canvas and container elements
            setTimeout(function showUnityElements() {
              // Find and fix Unity elements
              const unityElements = [
                document.getElementById('unity-container'),
                document.getElementById('gameContainer'),
                document.getElementById('unityContainer'),
                document.getElementById('unity-canvas'),
                document.getElementById('canvas'),
                document.querySelector('[id*="unity"]'),
                document.querySelector('[id*="game"]'),
                document.querySelector('[id*="canvas"]'),
                document.querySelector('canvas')
              ].filter(Boolean);
              
              if (unityElements.length > 0) {
                console.log('[UV Unity] Found Unity elements:', unityElements.length);
                
                unityElements.forEach(element => {
                  // Make element visible
                  element.style.visibility = 'visible';
                  element.style.display = element.nodeName === 'CANVAS' ? 'block' : element.style.display || 'block';
                  
                  // Fix canvas sizing
                  if (element.nodeName === 'CANVAS') {
                    if (element.width === 0 || element.height === 0) {
                      element.width = window.innerWidth * 0.8;
                      element.height = window.innerHeight * 0.8;
                    }
                  } else {
                    // Check for nested canvas
                    const canvas = element.querySelector('canvas');
                    if (canvas) {
                      canvas.style.visibility = 'visible';
                      canvas.style.display = 'block';
                      
                      if (canvas.width === 0 || canvas.height === 0) {
                        canvas.width = window.innerWidth * 0.8;
                        canvas.height = window.innerHeight * 0.8;
                      }
                    }
                  }
                });
              } else {
                // Try again later
                setTimeout(showUnityElements, 1000);
              }
            }, 1000);
          }
          
          // Apply Unity-specific fixes
          fixUnityGames();
          
          // Fix page visibility
          setTimeout(function fixVisibility() {
            if (document.body) {
              document.body.style.backgroundColor = document.body.style.backgroundColor || '#000';
              document.body.style.color = document.body.style.color || '#fff';
              document.body.style.visibility = 'visible';
              document.body.style.display = 'block';
            }
            
            // Make all canvases visible
            document.querySelectorAll('canvas').forEach(canvas => {
              canvas.style.display = 'block';
              canvas.style.visibility = 'visible';
              
              if (canvas.width === 0 || canvas.height === 0) {
                canvas.width = canvas.width || window.innerWidth * 0.8 || 800;
                canvas.height = canvas.height || window.innerHeight * 0.8 || 600;
              }
            });
          }, 500);
        }
        
        // Apply fixes immediately
        applyWebGLFixes();
        
        // Also apply after DOMContentLoaded
        if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
          document.addEventListener('DOMContentLoaded', applyWebGLFixes);
        }
        
        // Apply again after full load for slower devices
        window.addEventListener('load', function() {
          setTimeout(applyWebGLFixes, 500);
          
          // And one more time after a longer delay
          setTimeout(applyWebGLFixes, 2000);
        });
      })();
      </script>
      ` + modifiedHtml.substring(headClosePos);
    }
    
    // Add device-specific optimizations for slower devices before </body>
    if (modifiedHtml.includes('</body>')) {
      const bodyClosePos = modifiedHtml.indexOf('</body>');
      
      modifiedHtml = modifiedHtml.substring(0, bodyClosePos) + `
      <!-- UV Device-Specific Optimizations -->
      <script>
      (function() {
        // Wait a bit before applying these fixes to ensure page has loaded
        setTimeout(function() {
          // Check if this is a slower device
          const isSlowDevice = (
            navigator.hardwareConcurrency < 4 || 
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
          );
          
          if (isSlowDevice) {
            console.log('[UV] Applying optimizations for slower device');
            
            // Force visibility of all game elements
            const gameElements = document.querySelectorAll(
              'canvas, [id*="game"], [id*="unity"], [class*="game"], [class*="unity"]'
            );
            
            gameElements.forEach(element => {
              element.style.visibility = 'visible';
              element.style.display = element.nodeName === 'CANVAS' ? 'block' : 'block';
            });
            
            // Optimize any animations for performance
            const style = document.createElement('style');
            style.textContent = `
              @media (max-width: 768px) {
                * { 
                  animation-duration: 0.001s !important;
                  animation-delay: 0s !important;
                  transition-duration: 0.001s !important; 
                }
              }
            `;
            document.head.appendChild(style);
            
            // Check if canvas needs to be created
            if (!document.querySelector('canvas')) {
              // Some games need a canvas to initialize
              const canvas = document.createElement('canvas');
              canvas.width = window.innerWidth * 0.8;
              canvas.height = window.innerHeight * 0.7;
              canvas.style.display = 'block';
              canvas.style.margin = '0 auto';
              canvas.style.backgroundColor = '#000';
              document.body.appendChild(canvas);
              
              // Initialize WebGL
              try {
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (gl) {
                  gl.clearColor(0.0, 0.0, 0.0, 1.0);
                  gl.clear(gl.COLOR_BUFFER_BIT);
                }
              } catch(e) {}
            }
          }
        }, 2000); // Wait 2 seconds for page to load
      })();
      </script>
      ` + modifiedHtml.substring(bodyClosePos);
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

// Enhanced fetch with retries
async function enhancedFetch(event, retries = CONFIG.RETRY_COUNT) {
  try {
    const url = new URL(event.request.url).toString();
    
    // Process requests through UV
    const response = await sw.fetch(event);
    
    // For HTML game content, inject WebGL fixes
    if (isGameContent(url) && response.headers.get('content-type')?.includes('text/html')) {
      return await injectGameFixes(response, url);
    }
    
    return response;
  } catch (error) {
    console.error(`[UV SW] Fetch error: ${error.message}`);
    
    // Retry logic
    if (retries > 0) {
      console.log(`[UV SW] Retrying (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      return enhancedFetch(event, retries - 1);
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
          max-width: 600px;
          margin: 40px auto;
          background: #333;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        h2 {
          margin-top: 0;
          color: #f44336;
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
        button.secondary {
          background: #757575;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>We're having trouble loading this game</h2>
        <p>Sorry! This game isn't loading properly. If the issue continues, please visit our support team by going to the home page and clicking the phone icon at the bottom.</p>
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
      // Use enhanced fetch with retries
      return await enhancedFetch(event);
    } catch (err) {
      console.error('[UV SW] Fatal error:', err);
      return createErrorPage(err);
    }
  })());
});

// Install handler
self.addEventListener('install', event => {
  console.log('[UV SW] Installing enhanced service worker...');
  self.skipWaiting();
});

// Activate handler
self.addEventListener('activate', event => {
  console.log('[UV SW] Activated');
  event.waitUntil(clients.claim());
});