/*global UVServiceWorker,__uv$config*/
/*
 * First-Try Service Worker for Ultraviolet proxy
 * With aggressive WebGL fixes and auto-reload logic
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Increment this version when you update files to force cache refresh
const CACHE_VERSION = 'v1.1.0';
const DEV_MODE = true; // Set to true when developing to bypass cache

// Configuration with extended timeouts
const CONFIG = {
  FETCH_TIMEOUT: 240000,  // 4 minute timeout for slow sites
  MAX_RETRIES: 3,         // Number of retry attempts
  RETRY_DELAY: 800,       // Delay between retries in ms
  LOG_LEVEL: 'debug',     // Set to 'info' to reduce logging
  CACHE_NAME: `uv-game-resources-${CACHE_VERSION}` // Versioned cache name
};

// Create a cache for game resources
const gameCache = caches.open(CONFIG.CACHE_NAME);

// Log initialization
console.log('[UV Service Worker] Initializing first-try game loader...');

// Detect WebGL-based games and sites
const isWebGLSite = (url) => {
  if (!url) return false;
  
  // Known WebGL sites and Unity games
  const webglPatterns = [
    'yujiandemo.com',
    'yujian',
    'unity',
    'unitycdn',
    'webgl',
    'game',
    'games',
    'play',
    '3d',
    'canvas'
  ];
  
  return webglPatterns.some(pattern => url.includes(pattern));
};

// Detect any game URL
const isGameUrl = (url) => {
  if (!url) return false;
  
  // Skip content modifications for these file types (common game resources)
  const gameExtensions = ['.js', '.json', '.wasm', '.data', '.unity3d', '.mem', '.bin', '.svg', '.mp3', '.ogg', '.assets'];
  for (const ext of gameExtensions) {
    if (url.endsWith(ext)) return true;
  }
  
  // Check for game URL patterns
  return url.includes('/uv/service/') || 
         url.includes('/service/') ||
         url.search.includes('game=') ||
         url.includes('unity') ||
         url.includes('webgl') ||
         url.includes('/games/') ||
         url.includes('/play/');
};

// Enhanced fetch with timeout, retries, and caching for game resources
const enhancedFetch = async (event, retries = CONFIG.MAX_RETRIES) => {
  try {
    // In dev mode, skip cache entirely
    if (DEV_MODE) {
      console.log('[UV Service Worker] DEV MODE: Skipping cache');
      return await sw.fetch(event);
    }

    // Get URL information
    const url = new URL(event.request.url);
    const reqUrl = url.toString();
    
    // Check if this is a JavaScript file that needs fresh content
    const isJsFile = reqUrl.endsWith('.js');
    const shouldBypassCache = isJsFile && 
      (event.request.headers.get('cache-control') === 'no-cache' ||
       url.searchParams.has('nocache') ||
       url.searchParams.has('v')); // Version parameter
    
    // Special handling for game resources - check cache first
    if (isGameUrl(reqUrl) && !shouldBypassCache) {
      // Try to get from cache first for speed
      const cache = await gameCache;
      const cachedResponse = await cache.match(event.request);
      
      // For JS files, check if it's stale (optional)
      if (cachedResponse && isJsFile) {
        // Check if cache is older than 1 hour (adjust as needed)
        const cacheTimestamp = cachedResponse.headers.get('sw-cache-timestamp');
        if (cacheTimestamp) {
          const age = Date.now() - parseInt(cacheTimestamp);
          if (age > 3600000) { // 1 hour in milliseconds
            console.log('[UV Service Worker] JS file cache is stale, fetching fresh copy');
          } else {
            return cachedResponse;
          }
        } else {
          return cachedResponse;
        }
      } else if (cachedResponse) {
        return cachedResponse;
      }
      
      // Not in cache, fetch it
      console.log(`[UV Service Worker] Game resource: ${reqUrl.substring(0, 80)}...`);
      const response = await sw.fetch(event);
      
      // Cache the response if it's valid and not a streamed response
      if (response.ok && !response.bodyUsed && response.status !== 101 && response.status !== 204) {
        const clonedResponse = response.clone();
        const headers = new Headers(clonedResponse.headers);
        headers.set('sw-cache-timestamp', Date.now().toString());
        
        const responseToCache = new Response(clonedResponse.body, {
          status: clonedResponse.status,
          statusText: clonedResponse.statusText,
          headers: headers
        });
        
        cache.put(event.request, responseToCache).catch(err => {
          console.warn('[UV Service Worker] Failed to cache resource:', err);
        });
      }
      
      return response;
    }
    
    // Special handling for WebGL sites - add WebGL fixes
    if (isWebGLSite(reqUrl)) {
      console.log(`[UV Service Worker] WebGL site detected: ${reqUrl.substring(0, 80)}...`);
      
      // Get the response
      const response = await sw.fetch(event);
      
      // Check if this is an HTML response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        return await addWebGLFixes(response, reqUrl);
      }
      
      return response;
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

// Add WebGL fixes to HTML responses
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
    
    console.log('[UV Service Worker] Adding WebGL fixes to HTML');
    
    // Add auto-retry and WebGL compatibility script at the beginning of the document
    if (text.includes('<head')) {
      const headPos = text.indexOf('<head') + '<head'.length;
      const headEndPos = text.indexOf('>', headPos);
      if (headEndPos !== -1) {
        // Add early initialization before any other scripts
        text = text.substring(0, headEndPos + 1) + 
              `
              <!-- UV First-Try WebGL Fix - Phase 1 -->
              <script data-uv-first-try>
              (function() {
                // Signal first load for retry logic
                try {
                  if (!sessionStorage.getItem('uv-game-loaded')) {
                    console.log('[UV Game] First visit detected, enabling enhanced compatibility mode');
                    sessionStorage.setItem('uv-game-loaded', '1');
                    sessionStorage.setItem('uv-game-load-attempts', '1');
                    // Auto-load preconnect hints for common game CDNs
                    const domains = [
                      'cdn.jsdelivr.net',
                      'cdnjs.cloudflare.com',
                      'unpkg.com',
                      'storage.googleapis.com',
                      'steamcdn-a.akamaihd.net'
                    ];
                    domains.forEach(domain => {
                      const link = document.createElement('link');
                      link.rel = 'preconnect';
                      link.href = 'https://' + domain;
                      document.head.appendChild(link);
                    });
                  } else {
                    // Increment load attempts counter
                    const attempts = parseInt(sessionStorage.getItem('uv-game-load-attempts') || '1');
                    sessionStorage.setItem('uv-game-load-attempts', (attempts + 1).toString());
                    console.log('[UV Game] Load attempt ' + (attempts + 1));
                    // If this is a reload but still failing, force compatibility mode
                    if (attempts >= 2) {
                      console.log('[UV Game] Multiple attempts detected, activating force-compatibility mode');
                      window.__forcedCompatMode = true;
                    }
                  }
                } catch(e) {
                  console.error('[UV Game] Error in session tracking:', e);
                }
                
                // Define these globals early to avoid issues
                window.unityInstance = window.unityInstance || {};
                window.Unity = window.Unity || { 
                  print: function(msg) { console.log('[Unity]', msg); }
                };
                
                // Patch navigator
                const originalUserAgent = navigator.userAgent;
                Object.defineProperty(navigator, 'userAgent', {
                  get: function() { 
                    // Remove "Headless" which causes some WebGL engines to fail
                    return originalUserAgent.replace(/Headless/g, ''); 
                  }
                });
                
                // Early WebGL detection overrides
                window.hasWebGL = function() { return true; };
                window.isWebGLAvailable = function() { return true; };
                window.hasWebGL2 = function() { return true; };
                window.WebGLRenderingContext = window.WebGLRenderingContext || function(){};
              })();
              </script>
              ` + text.substring(headEndPos + 1);
      }
    }
    
    // Add main WebGL fixes before </head>
    if (text.includes('</head>')) {
      const headClosePos = text.indexOf('</head>');
      text = text.substring(0, headClosePos) + 
            `
            <!-- UV First-Try WebGL Fix - Phase 2 -->
            <script data-uv-webgl-fixes>
            (function() {
              console.log('[UV WebGL] Initializing enhanced WebGL compatibility');
              
              // Force a reload if page is blank after loading
              let contentCheckTimer;
              function scheduleContentCheck() {
                // Wait for page to load
                window.addEventListener('load', function() {
                  contentCheckTimer = setTimeout(function() {
                    // Check if page seems empty after loading
                    const hasVisibleContent = document.body && 
                                             (document.body.innerText.trim().length > 20 ||
                                              document.body.querySelectorAll('canvas').length > 0 ||
                                              document.body.querySelectorAll('img').length > 0);
                    
                    // Check if any canvas is visible and correctly sized
                    const hasWorkingCanvas = Array.from(document.querySelectorAll('canvas')).some(canvas => {
                      const rect = canvas.getBoundingClientRect();
                      return rect.width > 10 && rect.height > 10;
                    });
                    
                    const isEmptyPage = !hasVisibleContent || !hasWorkingCanvas;
                    
                    console.log('[UV WebGL] Content check - Has visible content:', hasVisibleContent);
                    console.log('[UV WebGL] Content check - Has working canvas:', hasWorkingCanvas);
                    
                    if (isEmptyPage) {
                      console.log('[UV WebGL] Page appears empty, checking attempts...');
                      
                      try {
                        // If we haven't tried too many times, reload the page
                        const attempts = parseInt(sessionStorage.getItem('uv-game-load-attempts') || '1');
                        if (attempts < 5) {
                          console.log('[UV WebGL] Empty page detected, reloading (attempt ' + attempts + ')');
                          window.location.reload();
                        } else {
                          console.warn('[UV WebGL] Too many reload attempts, showing message instead');
                          
                          // Create a message for the user after too many attempts
                          const div = document.createElement('div');
                          div.style.position = 'fixed';
                          div.style.top = '50%';
                          div.style.left = '50%';
                          div.style.transform = 'translate(-50%, -50%)';
                          div.style.backgroundColor = 'rgba(0,0,0,0.8)';
                          div.style.color = 'white';
                          div.style.padding = '20px';
                          div.style.borderRadius = '10px';
                          div.style.textAlign = 'center';
                          div.style.zIndex = '9999';
                          div.style.maxWidth = '80%';
                          div.innerHTML = '<h2>Game Loading Issue</h2>' +
                                         '<p>We\'re having trouble loading this game. Please try:</p>' +
                                         '<ul style="text-align:left">' +
                                         '<li>Clearing your browser cache</li>' +
                                         '<li>Disabling browser extensions</li>' +
                                         '<li>Using Chrome/Edge if you\'re on another browser</li>' +
                                         '</ul>' +
                                         '<button onclick="window.location.reload()" style="padding:8px 15px;background:#4a6ed3;color:white;border:none;border-radius:5px;margin:10px;cursor:pointer">Try Again</button>';
                          document.body.appendChild(div);
                        }
                      } catch(e) {
                        console.error('[UV WebGL] Error in empty page detection:', e);
                      }
                    }
                  }, 5000);
                });
              }
              
              scheduleContentCheck();
              
              // Override HTMLCanvasElement.prototype.getContext to fix WebGL
              const originalGetContext = HTMLCanvasElement.prototype.getContext;
              HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
                console.log("[UV WebGL] getContext called:", contextType);
                
                // Fix canvas size if it's zero
                if (this.width === 0 || this.height === 0) {
                  this.width = this.width || window.innerWidth * 0.8 || 800;
                  this.height = this.height || window.innerHeight * 0.8 || 600;
                  console.log("[UV WebGL] Fixed zero-sized canvas:", this.width, "x", this.height);
                }
                
                // For WebGL contexts, apply fixes
                if (contextType === 'webgl' || contextType === 'experimental-webgl' || contextType === 'webgl2') {
                  try {
                    // Fix WebGL context attributes
                    contextAttributes = contextAttributes || {};
                    
                    // Force attributes that help with compatibility
                    contextAttributes.preserveDrawingBuffer = true;
                    contextAttributes.failIfMajorPerformanceCaveat = false;
                    contextAttributes.powerPreference = 'high-performance';
                    contextAttributes.premultipliedAlpha = contextAttributes.premultipliedAlpha !== false;
                    contextAttributes.antialias = contextAttributes.antialias !== false;
                    
                    console.log("[UV WebGL] Using fixed WebGL attributes:", contextAttributes);
                    
                    // Try to create the context with our fixed attributes
                    let ctx = originalGetContext.call(this, contextType, contextAttributes);
                    
                    if (!ctx) {
                      // Try alternative context types
                      const alternatives = ['webgl', 'experimental-webgl', 'webgl2'];
                      for (const alt of alternatives) {
                        if (alt !== contextType) {
                          try {
                            console.log("[UV WebGL] Trying alternative context:", alt);
                            ctx = originalGetContext.call(this, alt, contextAttributes);
                            if (ctx) {
                              console.log("[UV WebGL] Created alternative context:", alt);
                              break;
                            }
                          } catch (e) {
                            console.warn("[UV WebGL] Error creating alternative context:", e);
                          }
                        }
                      }
                    }
                    
                    if (ctx) {
                      // Add missing properties or methods
                      ctx.getShaderPrecisionFormat = ctx.getShaderPrecisionFormat || function() {
                        return { precision: 23, rangeMin: 127, rangeMax: 127 };
                      };
                      
                      // Make sure canvas is visible
                      this.style.display = 'block';
                      this.style.visibility = 'visible';
                      
                      // Add extra method to force resize the canvas
                      ctx.uvResize = function(width, height) {
                        const canvas = this.canvas;
                        canvas.width = width;
                        canvas.height = height;
                        canvas.style.width = width + 'px';
                        canvas.style.height = height + 'px';
                      };
                      
                      return ctx;
                    } else {
                      console.error("[UV WebGL] Failed to create any WebGL context!");
                      
                      // Create a fake context as last resort for games that require WebGL
                      // This prevents crashes but the game won't render properly
                      if (window.__forcedCompatMode) {
                        console.warn("[UV WebGL] Creating fallback fake WebGL context");
                        const fakeContext = {
                          canvas: this,
                          drawingBufferWidth: this.width,
                          drawingBufferHeight: this.height,
                          getExtension: function() { return null; },
                          getParameter: function() { return 0; },
                          getShaderPrecisionFormat: function() { return { precision: 23, rangeMin: 127, rangeMax: 127 }; },
                          getError: function() { return 0; },
                          viewport: function() {},
                          clear: function() {},
                          clearColor: function() {},
                          createBuffer: function() { return {}; },
                          bindBuffer: function() {},
                          bufferData: function() {},
                          enable: function() {},
                          disable: function() {},
                          blendFunc: function() {},
                          createShader: function() { return {}; },
                          shaderSource: function() {},
                          compileShader: function() {},
                          getShaderParameter: function() { return true; },
                          createProgram: function() { return {}; },
                          attachShader: function() {},
                          linkProgram: function() {},
                          getProgramParameter: function() { return true; },
                          useProgram: function() {},
                          createTexture: function() { return {}; },
                          bindTexture: function() {},
                          texParameteri: function() {},
                          texImage2D: function() {}
                        };
                        return fakeContext;
                      }
                    }
                  } catch (e) {
                    console.error("[UV WebGL] Error creating WebGL context:", e);
                  }
                }
                
                // Fall back to the original method
                return originalGetContext.call(this, contextType, contextAttributes);
              };
              
              // Fix Unity games specifically
              function fixUnityGames() {
                console.log("[UV WebGL] Applying Unity-specific fixes");
                
                // Force show Unity canvas and container
                function fixUnityCanvas() {
                  // Find Unity game containers and canvases
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
                    console.log("[UV WebGL] Found Unity elements:", unityElements.length);
                    
                    unityElements.forEach(element => {
                      // Make sure element is visible
                      element.style.visibility = 'visible';
                      element.style.display = element.nodeName === 'CANVAS' ? 'block' : element.style.display || 'block';
                      
                      // Find and fix canvas
                      if (element.nodeName === 'CANVAS') {
                        if (element.width === 0 || element.height === 0) {
                          element.width = window.innerWidth * 0.8;
                          element.height = window.innerHeight * 0.8;
                          console.log("[UV WebGL] Fixed Unity canvas size:", element.width, "x", element.height);
                        }
                      } else {
                        // Check for canvas inside this container
                        const canvas = element.querySelector('canvas');
                        if (canvas) {
                          canvas.style.visibility = 'visible';
                          canvas.style.display = 'block';
                          
                          if (canvas.width === 0 || canvas.height === 0) {
                            canvas.width = window.innerWidth * 0.8;
                            canvas.height = window.innerHeight * 0.8;
                            console.log("[UV WebGL] Fixed nested Unity canvas size:", canvas.width, "x", canvas.height);
                          }
                        }
                      }
                    });
                    
                    // If we found Unity elements but still have no visible canvas, create one as a last resort
                    if (!document.querySelector('canvas:not([style*="display: none"]):not([style*="visibility: hidden"])')) {
                      const placeholder = document.createElement('canvas');
                      placeholder.width = window.innerWidth * 0.8;
                      placeholder.height = window.innerHeight * 0.8;
                      placeholder.style.display = 'block';
                      placeholder.style.margin = '0 auto';
                      placeholder.style.backgroundColor = '#000';
                      document.body.appendChild(placeholder);
                      console.log("[UV WebGL] Created placeholder canvas as last resort");
                    }
                  } else {
                    // Try again later
                    setTimeout(fixUnityCanvas, 500);
                  }
                }
                
                // Try to fix Unity canvas after other content loads
                setTimeout(fixUnityCanvas, 500);
                
                // Make global objects that Unity games expect
                window.UnityLoader = window.UnityLoader || {
                  instantiate: function(containerElement, fileUrl, onProgress) {
                    console.log("[UV WebGL] Unity game loading:", fileUrl);
                    return {};
                  },
                  Error: {
                    handler: function() {}
                  },
                  SystemInfo: {
                    hasWebGL: true,
                    mobile: false
                  }
                };
                
                // Add unity progress handlers
                window.unityShowBanner = function(msg, type) {
                  console.log("[Unity Banner]", msg);
                };
                
                window.unityProgress = function(gameInstance, progress) {
                  console.log("[Unity Progress]", progress);
                  if (progress === 1) {
                    // Game has loaded, clear content check to prevent unnecessary reload
                    clearTimeout(contentCheckTimer);
                  }
                };
              }
              
              // Apply Unity fixes
              fixUnityGames();
              
              // General visibility fixes 
              function fixPageVisibility() {
                // Make sure body is visible
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
                  
                  // Fix any zero-sized canvases
                  if (canvas.width === 0 || canvas.height === 0) {
                    canvas.width = canvas.width || window.innerWidth * 0.8 || 800;
                    canvas.height = canvas.height || window.innerHeight * 0.8 || 600;
                  }
                });
              }
              
              // Run visibility fixes on load and periodically
              window.addEventListener('load', fixPageVisibility);
              setInterval(fixPageVisibility, 1000);
              
              console.log("[UV WebGL] Enhanced WebGL compatibility initialized");
            })();
            </script>
            
            <!-- Fix for yujiandemo.com specifically -->
            <script data-uv-yujian-fix>
            (function() {
              if (window.location.href.includes('yujiandemo') || window.location.href.includes('yujian')) {
                console.log("[UV WebGL] Adding yujiandemo.com specific fixes");
                
                // Specific fixes for this site
                window.addEventListener('DOMContentLoaded', function() {
                  // Force the page background to be visible
                  document.documentElement.style.backgroundColor = '#000';
                  document.body.style.backgroundColor = '#000'; 
                  
                  // Create a backup canvas if none exists after a delay
                  setTimeout(function() {
                    if (!document.querySelector('canvas')) {
                      console.log("[UV WebGL] No canvas found, creating backup for yujiandemo");
                      const canvas = document.createElement('canvas');
                      canvas.width = window.innerWidth * 0.8;
                      canvas.height = window.innerHeight * 0.8;
                      canvas.style.display = 'block';
                      canvas.style.margin = '20px auto';
                      canvas.style.backgroundColor = '#000';
                      document.body.appendChild(canvas);
                      
                      // Try to initialize WebGL on this canvas
                      try {
                        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                        if (gl) {
                          gl.clearColor(0.0, 0.0, 0.0, 1.0);
                          gl.clear(gl.COLOR_BUFFER_BIT);
                          console.log("[UV WebGL] Successfully initialized WebGL on backup canvas");
                        }
                      } catch(e) {
                        console.error("[UV WebGL] Error initializing WebGL on backup canvas:", e);
                      }
                    }
                  }, 2000);
                });
              }
            })();
            </script>
            ` + text.substring(headClosePos);
    }
    
    // Add auto-retry script at the beginning of body
    if (text.includes('<body')) {
      const bodyPos = text.indexOf('<body') + '<body'.length;
      const bodyEndPos = text.indexOf('>', bodyPos);
      if (bodyEndPos !== -1) {
        // Add early body script
        text = text.substring(0, bodyEndPos + 1) + 
              `
              <!-- UV First-Try WebGL Fix - Phase 3 -->
              <script data-uv-body-fix>
              (function() {
                // Make sure page is visible
                document.body.style.backgroundColor = document.body.style.backgroundColor || '#000';
                document.body.style.color = document.body.style.color || '#fff';
                document.body.style.visibility = 'visible';
                document.body.style.display = 'block';
                
                // Create loading indicator that will hide when game loads
                const loadingDiv = document.createElement('div');
                loadingDiv.id = 'uv-game-loading';
                loadingDiv.style.position = 'fixed';
                loadingDiv.style.top = '50%';
                loadingDiv.style.left = '50%';
                loadingDiv.style.transform = 'translate(-50%, -50%)';
                loadingDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
                loadingDiv.style.color = 'white';
                loadingDiv.style.padding = '20px';
                loadingDiv.style.borderRadius = '10px';
                loadingDiv.style.textAlign = 'center';
                loadingDiv.style.zIndex = '9999';
                loadingDiv.style.transition = 'opacity 0.5s ease';
                
                // Create loading spinner
                const spinner = document.createElement('div');
                spinner.style.width = '40px';
                spinner.style.height = '40px';
                spinner.style.margin = '0 auto 15px auto';
                spinner.style.border = '4px solid rgba(255, 255, 255, 0.3)';
                spinner.style.borderTop = '4px solid white';
                spinner.style.borderRadius = '50%';
                spinner.style.animation = 'uvSpinAnim 1s linear infinite';
                
                // Add keyframes for the spinner
                const styleTag = document.createElement('style');
                styleTag.textContent = '@keyframes uvSpinAnim {0% {transform: rotate(0deg);} 100% {transform: rotate(360deg);}}';
                document.head.appendChild(styleTag);
                
                loadingDiv.appendChild(spinner);
                loadingDiv.appendChild(document.createTextNode('Loading Game...'));
                document.body.appendChild(loadingDiv);
                
                // Hide loading indicator when we detect game content
                function checkForGameContent() {
                  const hasCanvas = document.querySelector('canvas');
                  const hasUnityContainer = document.querySelector('#unity-container, #gameContainer, #unityContainer, [id*="unity"], [id*="game"]');
                  
                  if (hasCanvas || hasUnityContainer) {
                    // Get the loading indicator
                    const loadingDiv = document.getElementById('uv-game-loading');
                    if (loadingDiv) {
                      // Fade it out
                      loadingDiv.style.opacity = '0';
                      // Remove it after the animation
                      setTimeout(() => {
                        if (loadingDiv.parentNode) {
                          loadingDiv.parentNode.removeChild(loadingDiv);
                        }
                      }, 500);
                    }
                    return true;
                  }
                  return false;
                }
                
                // Check for game content immediately and then periodically
                if (!checkForGameContent()) {
                  const checkInterval = setInterval(() => {
                    if (checkForGameContent()) {
                      clearInterval(checkInterval);
                    }
                  }, 500);
                  
                  // Also try after page load event
                  window.addEventListener('load', () => {
                    if (checkForGameContent()) {
                      clearInterval(checkInterval);
                    }
                  });
                  
                  // Stop checking after 20 seconds to avoid unnecessary checks
                  setTimeout(() => {
                    clearInterval(checkInterval);
                    // Remove loading indicator if it's still there
                    const loadingDiv = document.getElementById('uv-game-loading');
                    if (loadingDiv && loadingDiv.parentNode) {
                      loadingDiv.parentNode.removeChild(loadingDiv);
                    }
                  }, 20000);
                }
              })();
              </script>
              ` + text.substring(bodyEndPos + 1);
      }
    }
    
    // Return modified HTML with WebGL fixes
    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    console.error('[UV Service Worker] Error adding WebGL fixes:', error);
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

// Precache commonly used game resources
self.addEventListener('install', event => {
  console.log('[UV Service Worker] Installing with game precaching...');
  
  // Skip waiting so the service worker activates immediately
  self.skipWaiting();
  
  // Precache essential WebGL polyfills and helpers
  event.waitUntil(
    caches.open(CONFIG.CACHE_NAME).then(cache => {
      return cache.addAll([
        '/uv/uv.bundle.js',
        '/uv/uv.config.js',
        '/uv/uv.sw.js'
      ]).catch(err => {
        console.warn('[UV Service Worker] Failed to precache some resources:', err);
      });
    })
  );
});

self.addEventListener('activate', event => {
  console.log('[UV Service Worker] Activated');
  
  // Claim clients so the service worker starts controlling current pages
  event.waitUntil(clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Delete old versions of our cache
            return cacheName.startsWith('uv-game-resources-') && 
                   cacheName !== CONFIG.CACHE_NAME;
          })
          .map(cacheName => {
            console.log('[UV Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
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
        status: 'healthy',
        version: 'first-try-1.0'
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
  
  // Clear specific file from cache
  if (event.data && event.data.type === 'CLEAR_FILE_CACHE') {
    const { url } = event.data;
    caches.open(CONFIG.CACHE_NAME).then(cache => {
      cache.delete(url).then(() => {
        console.log('[UV Service Worker] File cache cleared:', url);
        if (event.source) {
          event.source.postMessage({
            type: 'FILE_CACHE_CLEARED',
            url: url,
            timestamp: Date.now()
          });
        }
      });
    });
  }
  
  // Force refresh for specific patterns
  if (event.data && event.data.type === 'FORCE_REFRESH') {
    const { pattern } = event.data;
    caches.open(CONFIG.CACHE_NAME).then(cache => {
      cache.keys().then(requests => {
        requests.forEach(request => {
          if (request.url.includes(pattern)) {
            cache.delete(request);
            console.log('[UV Service Worker] Deleted cache for:', request.url);
          }
        });
        if (event.source) {
          event.source.postMessage({
            type: 'REFRESH_COMPLETE',
            timestamp: Date.now()
          });
        }
      });
    });
  }
});
