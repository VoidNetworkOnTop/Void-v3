/*global UVServiceWorker,__uv$config*/
/*
 * UV Service Worker - Extreme Performance Edition
 * Optimized for very high traffic and game loading
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Configuration for maximum performance
const CONFIG = {
  FETCH_TIMEOUT: 180000,      // 3 minute timeout for slow connections
  RETRY_COUNT: 4,             // More retry attempts
  RETRY_DELAY: 1000,          // Initial delay between retries in ms
  ENABLE_CACHE: true,         // Enable resource caching
  CACHE_NAME: 'uv-game-cache', // Cache name for game resources
  MAX_CACHE_SIZE: 500,        // Increased maximum number of items to cache
  MAX_CACHE_AGE: 3600000 * 48, // Cache expiration (48 hours)
  PREFETCH_DEPENDENCIES: true, // Prefetch related resources
  AGGRESSIVE_CACHING: true,   // More aggressive caching strategy
  EARLY_REVEAL: true,         // Show game content earlier (may show loading screens)
  DISABLE_INTEGRITY_CHECKS: true, // Disable integrity checks for faster loading
  
  // Resources that should be cached aggressively
  CACHE_PATTERNS: [
    '.js', '.css', '.woff', '.woff2', '.ttf', '.png', '.jpg', '.jpeg', '.gif', '.svg',
    'unity', 'webgl', 'game', '/assets/', '/static/', '.data', '.wasm', '.mem', 
    'jsdelivr', 'cloudfront', 'akamai', 'cdn'
  ],
  
  // URL patterns that should always bypass special handling
  BYPASS_PATTERNS: [
    '/bare/',
    '/uv/service/',
    '/service/'
  ],
  
  // Domains that should be prioritized for loading
  PRIORITY_DOMAINS: [
    'unity.com', 'unitycdn', 'unity3d', 'jsdelivr.net', 
    'cloudfront.net', 'amazonaws.com', 'googleusercontent.com'
  ],
  
  // Track active connections
  MAX_CONCURRENT_CONNECTIONS: 75,
  CONNECTION_TIMEOUT: 30000,  // 30 seconds
  
  // Resource loading priorities
  PRIORITIES: {
    CRITICAL: ['wasm', 'unity', 'data', 'framework', 'loader', 'bundle'],
    HIGH: ['js', 'json', 'css'],
    MEDIUM: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'woff'],
    LOW: ['wav', 'mp3', 'ogg']
  }
};

// Connection tracking
const connections = {
  active: new Map(),
  pending: new Set(),
  completed: new Set(),
  
  add(url, promise) {
    this.pending.add(url);
    
    // Monitor completion
    promise.finally(() => {
      this.pending.delete(url);
      this.completed.add(url);
      
      // Remove from completed after a delay
      setTimeout(() => {
        this.completed.delete(url);
      }, 10000);
    });
    
    // Track active connection
    this.active.set(url, {
      timestamp: Date.now(),
      promise
    });
    
    // Clean up old connections
    this.cleanup();
    
    return promise;
  },
  
  cleanup() {
    const now = Date.now();
    
    // Remove expired connections
    for (const [url, data] of this.active.entries()) {
      if (now - data.timestamp > CONFIG.CONNECTION_TIMEOUT) {
        this.active.delete(url);
      }
    }
    
    // Ensure we don't exceed max connections
    if (this.active.size > CONFIG.MAX_CONCURRENT_CONNECTIONS) {
      // Find oldest non-critical connections to remove
      const connections = Array.from(this.active.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .filter(([url]) => {
          // Don't remove critical or pending resources
          return !CONFIG.PRIORITIES.CRITICAL.some(type => url.includes(type)) && 
                 !this.pending.has(url);
        });
      
      // Remove oldest connections to get under limit
      const toRemove = connections.slice(0, this.active.size - CONFIG.MAX_CONCURRENT_CONNECTIONS);
      for (const [url] of toRemove) {
        this.active.delete(url);
      }
    }
  },
  
  isPending(url) {
    return this.pending.has(url);
  },
  
  isCompleted(url) {
    return this.completed.has(url);
  }
};

// Initialize
console.log('[UV SW] Extreme Performance Service Worker initializing');

// Add cache management
async function trimCache() {
  try {
    const cache = await caches.open(CONFIG.CACHE_NAME);
    const keys = await cache.keys();
    
    if (keys.length > CONFIG.MAX_CACHE_SIZE) {
      console.log(`[UV SW] Trimming cache: ${keys.length} items (max: ${CONFIG.MAX_CACHE_SIZE})`);
      
      // Sort by last accessed time (if available) or default to FIFO
      const deletionCount = keys.length - CONFIG.MAX_CACHE_SIZE;
      for (let i = 0; i < deletionCount; i++) {
        await cache.delete(keys[i]);
      }
    }
  } catch (err) {
    console.error('[UV SW] Cache trimming error:', err);
  }
}

// Clear expired cache entries
async function clearExpiredCache() {
  try {
    const cache = await caches.open(CONFIG.CACHE_NAME);
    const keys = await cache.keys();
    const now = Date.now();
    let deleted = 0;
    
    for (const request of keys) {
      const response = await cache.match(request);
      
      // Check for cache timestamp header
      if (response && response.headers) {
        const timestamp = parseInt(response.headers.get('x-cache-timestamp') || '0');
        
        if (timestamp && now - timestamp > CONFIG.MAX_CACHE_AGE) {
          await cache.delete(request);
          deleted++;
        }
      }
    }
    
    if (deleted > 0) {
      console.log(`[UV SW] Cleared ${deleted} expired cache entries`);
    }
  } catch (err) {
    console.error('[UV SW] Error clearing expired cache:', err);
  }
}

// Get resource priority based on file extension
function getResourcePriority(url) {
  if (!url) return 'LOW';
  const urlLower = url.toLowerCase();
  
  // Check critical resources first
  if (CONFIG.PRIORITIES.CRITICAL.some(type => urlLower.includes(type))) {
    return 'CRITICAL';
  }
  
  // Check HIGH priority resources
  if (CONFIG.PRIORITIES.HIGH.some(ext => urlLower.endsWith('.' + ext))) {
    return 'HIGH';
  }
  
  // Check MEDIUM priority resources
  if (CONFIG.PRIORITIES.MEDIUM.some(ext => urlLower.endsWith('.' + ext))) {
    return 'MEDIUM';
  }
  
  // Default to LOW
  return 'LOW';
}

// Check if a URL should be bypassed (no special handling)
function shouldBypassUrl(url) {
  if (!url) return false;
  return CONFIG.BYPASS_PATTERNS.some(pattern => url.includes(pattern));
}

// Check if a URL should be cached
function shouldCacheUrl(url) {
  if (!url || !CONFIG.ENABLE_CACHE) return false;
  
  // Don't cache bypass URLs
  if (shouldBypassUrl(url)) return false;
  
  // Check against cache patterns
  return CONFIG.CACHE_PATTERNS.some(pattern => url.includes(pattern));
}

// Detect game content for special handling
function isGameContent(url) {
  if (!url || shouldBypassUrl(url)) return false;
  
  // Common game keywords
  const gamePatterns = [
    'unity', 'unitycdn', 'webgl', 'game', 'games', 'play',
    '3d', 'canvas', 'html5', 'arcade', 'gitlab.io', 
    'github.io', 'poki.com', 'crazy', 'y8.com', 'fnaf',
    'five-night', 'minecraft', 'slope', '1v1.lol'
  ];
  
  return gamePatterns.some(pattern => url.toLowerCase().includes(pattern));
}

// Inject optimized loading and WebGL fixes for games
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
    
    // Add advanced loading optimizations to head
    if (modifiedHtml.includes('<head')) {
      const headInsertPos = modifiedHtml.indexOf('<head') + '<head'.length;
      const headEndPos = modifiedHtml.indexOf('>', headInsertPos);
      
      if (headEndPos !== -1) {
        modifiedHtml = modifiedHtml.substring(0, headEndPos + 1) + `
        <script>
        /* Advanced Game Loading Optimizations */
        (function() {
          console.log('Game loading optimizations activated');
          
          // Track loading state
          window.__gameLoading = {
            start: Date.now(),
            resources: new Map(),
            complete: false,
            resourcesLoaded: 0,
            criticalResourcesLoaded: false,
            readyStates: [],
            errors: [],
            
            // Monitor loading progress
            recordState: function(state) {
              this.readyStates.push({
                state: state,
                time: Date.now() - this.start
              });
              
              // Send status to parent
              try {
                window.parent.postMessage({
                  type: 'GAME_LOADING',
                  state: state,
                  time: Date.now() - this.start
                }, '*');
              } catch(e) {}
            },
            
            // Record errors
            recordError: function(error) {
              this.errors.push({
                error: error.toString(),
                time: Date.now() - this.start
              });
              
              // Send error to parent
              try {
                window.parent.postMessage({
                  type: 'GAME_ERROR',
                  error: error.toString(),
                  time: Date.now() - this.start
                }, '*');
              } catch(e) {}
            },
            
            // Mark critical resources loaded
            markCritical: function() {
              this.criticalResourcesLoaded = true;
              this.recordState('critical-resources-loaded');
              
              // Send ready state to parent
              try {
                window.parent.postMessage({
                  type: 'GAME_CRITICAL_READY',
                  time: Date.now() - this.start
                }, '*');
              } catch(e) {}
            },
            
            // Mark game as completely loaded
            markComplete: function() {
              if (!this.complete) {
                this.complete = true;
                this.recordState('complete');
                
                // Send ready state to parent
                try {
                  window.parent.postMessage({
                    type: 'GAME_READY',
                    time: Date.now() - this.start
                  }, '*');
                } catch(e) {}
              }
            }
          };
          
          // Record initial state
          window.__gameLoading.recordState('init');

          // --- PERFORMANCE OPTIMIZATION SECTION ---
          
          // 1. PRELOAD CRITICAL RESOURCES
          // Add preload hints for common game dependencies
          function addPreloadHints() {
            const criticalResources = [
              { type: 'script', hint: 'preload', ext: 'wasm', as: 'fetch', crossorigin: 'anonymous' },
              { type: 'script', hint: 'preload', ext: 'framework.js', as: 'script' },
              { type: 'script', hint: 'preload', ext: 'loader.js', as: 'script' },
              { type: 'script', hint: 'preload', ext: 'data', as: 'fetch', crossorigin: 'anonymous' }
            ];
            
            const head = document.head;
            if (!head) return;
            
            // Scan page for resources matching our critical patterns
            const scripts = document.querySelectorAll('script[src]');
            scripts.forEach(script => {
              const src = script.getAttribute('src');
              if (!src) return;
              
              // Add preload for critical resources
              criticalResources.forEach(resource => {
                if (src.includes(resource.ext)) {
                  const link = document.createElement('link');
                  link.rel = resource.hint;
                  link.href = src;
                  link.as = resource.as;
                  if (resource.crossorigin) {
                    link.crossOrigin = resource.crossorigin;
                  }
                  head.appendChild(link);
                }
              });
            });
          }
          
          // Try to discover and preload resources as early as possible
          if (document.head) {
            addPreloadHints();
          } else {
            document.addEventListener('DOMContentLoaded', addPreloadHints);
          }

          // 2. OPTIMIZE WEBGL FOR FASTER LOADING
          const optimizeWebGL = function() {
            // Fix WebGL detection
            window.hasWebGL = window.hasWebGL2 = window.isWebGLAvailable = function() { return true; };
            
            // Fix navigator user agent
            const originalUserAgent = navigator.userAgent;
            Object.defineProperty(navigator, 'userAgent', {
              get: function() { return originalUserAgent.replace(/Headless/g, ''); }
            });
            
            // Fix canvas getContext with optimized parameters
            const originalGetContext = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
              // Fix zero-sized canvases
              if ((this.width === 0 || this.height === 0) && 
                  ['webgl', 'experimental-webgl', 'webgl2'].includes(contextType)) {
                this.width = this.width || window.innerWidth * 0.8 || 800;
                this.height = this.height || window.innerHeight * 0.8 || 600;
              }
              
              // Optimize WebGL contexts
              if (['webgl', 'experimental-webgl', 'webgl2'].includes(contextType)) {
                contextAttributes = contextAttributes || {};
                contextAttributes.failIfMajorPerformanceCaveat = false;
                contextAttributes.powerPreference = 'high-performance';
                contextAttributes.preserveDrawingBuffer = true;
                contextAttributes.antialias = false; // Disable antialiasing initially for faster loading
                contextAttributes.depth = true;
                contextAttributes.stencil = false; // Only enable if needed
                contextAttributes.alpha = true;
                
                const ctx = originalGetContext.call(this, contextType, contextAttributes);
                if (ctx) {
                  // Apply performance optimizations to WebGL context
                  try {
                    // Optimize parameters for performance
                    ctx.hint(ctx.GENERATE_MIPMAP_HINT, ctx.FASTEST);
                    ctx.disable(ctx.DITHER);
                    
                    // Create a function to enable antialias later
                    ctx.enableAntiAlias = function() {
                      try {
                        // We can't actually change antialias after creation,
                        // but we can apply techniques to improve appearance
                        ctx.hint(ctx.GENERATE_MIPMAP_HINT, ctx.NICEST);
                        ctx.enable(ctx.DITHER);
                      } catch(e) {}
                    };
                    
                    // After 5 seconds, try to enable better quality
                    setTimeout(function() {
                      try {
                        ctx.enableAntiAlias();
                      } catch(e) {}
                    }, 5000);
                  } catch(e) {
                    // Ignore errors in optimization
                  }
                  
                  return ctx;
                }
                
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
          };
          
          // Install optimizations right away
          optimizeWebGL();
          
          // 3. OPTIMIZE RESOURCE LOADING
          // Resource loader optimization
          const originalFetch = window.fetch;
          window.fetch = function(resource, options) {
            try {
              // Start time for resource
              const startTime = performance.now();
              const resourceUrl = resource.url || resource.toString();
              
              // Record resource being loaded
              window.__gameLoading.resources.set(resourceUrl, {
                startTime: startTime,
                status: 'loading'
              });
              
              // Add priority to options
              options = options || {};
              
              // Set priority based on resource type
              if (resourceUrl.includes('wasm') || 
                  resourceUrl.includes('framework') || 
                  resourceUrl.includes('loader') || 
                  resourceUrl.includes('data') ||
                  resourceUrl.includes('unity')) {
                options.priority = 'high';
              }
              
              // For non-critical resources, use cache when possible
              if (!options.priority || options.priority !== 'high') {
                options.cache = options.cache || 'force-cache';
              }
              
              // Add shorter timeout for faster failure recovery
              const controller = new AbortController();
              const signal = controller.signal;
              options.signal = signal;
              
              // Set appropriate timeout based on importance
              const timeout = setTimeout(() => {
                controller.abort();
              }, options.priority === 'high' ? 60000 : 30000);
                
              // Execute the original fetch
              const fetchPromise = originalFetch.call(this, resource, options);
              
              // Process response
              return fetchPromise.then(function(response) {
                clearTimeout(timeout);
                
                // Update resource status
                if (response.ok) {
                  window.__gameLoading.resources.set(resourceUrl, {
                    startTime: startTime,
                    endTime: performance.now(),
                    duration: performance.now() - startTime,
                    status: 'loaded',
                    size: response.headers.get('content-length')
                  });
                  
                  window.__gameLoading.resourcesLoaded++;
                } else {
                  window.__gameLoading.resources.set(resourceUrl, {
                    startTime: startTime,
                    endTime: performance.now(),
                    duration: performance.now() - startTime,
                    status: 'error',
                    error: 'HTTP ' + response.status
                  });
                }
                
                return response;
              }).catch(function(error) {
                clearTimeout(timeout);
                
                // Record error
                window.__gameLoading.resources.set(resourceUrl, {
                  startTime: startTime,
                  endTime: performance.now(),
                  duration: performance.now() - startTime,
                  status: 'error',
                  error: error.toString()
                });
                
                window.__gameLoading.recordError(error);
                throw error;
              });
            } catch(e) {
              // Fallback to original in case of any error
              return originalFetch.apply(this, arguments);
            }
          };
          
          // 4. OPTIMIZE IMAGE LOADING
          // Replace Image constructor for optimized loading
          const OriginalImage = window.Image;
          window.Image = function(width, height) {
            const img = new OriginalImage(width, height);
            
            // Add loading priority
            img.loading = 'lazy';
            
            // Intercept src setter
            const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
            Object.defineProperty(img, 'src', {
              get: function() {
                return originalSrcDescriptor.get.call(this);
              },
              set: function(value) {
                // Record loading
                if (window.__gameLoading) {
                  window.__gameLoading.resources.set(value, {
                    startTime: performance.now(),
                    status: 'loading',
                    type: 'image'
                  });
                }
                
                // Apply original setter
                originalSrcDescriptor.set.call(this, value);
              }
            });
            
            // Track load completion
            img.addEventListener('load', function() {
              if (window.__gameLoading) {
                const src = img.src;
                window.__gameLoading.resources.set(src, {
                  startTime: window.__gameLoading.resources.get(src)?.startTime || performance.now() - 100,
                  endTime: performance.now(),
                  status: 'loaded',
                  type: 'image'
                });
              }
            });
            
            img.addEventListener('error', function() {
              if (window.__gameLoading && img.src) {
                window.__gameLoading.recordError('Failed to load image: ' + img.src);
              }
            });
            
            return img;
          };
          
          // 5. SCRIPT LOADING OPTIMIZATION
          // Optimize script loading and execution
          const originalCreateElement = document.createElement;
          document.createElement = function(tagName) {
            const element = originalCreateElement.apply(this, arguments);
            
            // Add priority loading for scripts and other resources
            if (tagName.toLowerCase() === 'script') {
              // Record when script is added to DOM
              const originalSetAttribute = element.setAttribute;
              element.setAttribute = function(name, value) {
                if (name === 'src' && value) {
                  // Critical path scripts should load first
                  if (value.includes('framework') || 
                      value.includes('loader') || 
                      value.includes('unity') ||
                      value.includes('game')) {
                    this.setAttribute('fetchpriority', 'high');
                    // Force async to get parallel loading but prioritize execution
                    this.setAttribute('async', '');
                    
                    // Track script loading
                    if (window.__gameLoading) {
                      window.__gameLoading.resources.set(value, {
                        startTime: performance.now(),
                        status: 'loading',
                        type: 'script'
                      });
                      
                      // Track script execution
                      this.addEventListener('load', function() {
                        if (window.__gameLoading) {
                          window.__gameLoading.resources.set(value, {
                            startTime: window.__gameLoading.resources.get(value)?.startTime || performance.now() - 100,
                            endTime: performance.now(),
                            status: 'loaded',
                            type: 'script'
                          });
                        }
                      });
                      
                      this.addEventListener('error', function() {
                        if (window.__gameLoading) {
                          window.__gameLoading.recordError('Failed to load script: ' + value);
                        }
                      });
                    }
                  } else {
                    // Non-critical scripts can be deferred
                    this.setAttribute('defer', '');
                  }
                }
                return originalSetAttribute.apply(this, arguments);
              };
            }
            
            // Add loading="lazy" to images that aren't critical
            if (tagName.toLowerCase() === 'img') {
              element.setAttribute('loading', 'lazy');
              
              // Intercept src attribute setting for tracking
              const originalSetAttribute = element.setAttribute;
              element.setAttribute = function(name, value) {
                if (name === 'src' && value) {
                  // Track image loading
                  if (window.__gameLoading) {
                    window.__gameLoading.resources.set(value, {
                      startTime: performance.now(),
                      status: 'loading',
                      type: 'image'
                    });
                  }
                  
                  // Check if this is likely a critical image
                  const isCritical = value.includes('splash') || 
                                    value.includes('icon') || 
                                    value.includes('logo');
                  
                  if (isCritical) {
                    this.setAttribute('fetchpriority', 'high');
                    this.removeAttribute('loading'); // Don't lazy-load critical images
                  }
                }
                return originalSetAttribute.apply(this, arguments);
              };
            }
            
            return element;
          };
          
          // 6. FIND AND PRIORITIZE CRITICAL RESOURCES
          // Function to find and prioritize loading of critical resources
          const prioritizeCriticalResources = function() {
            // Find all scripts with game engine resources
            const scripts = Array.from(document.getElementsByTagName('script'));
            const criticalScripts = scripts.filter(script => {
              const src = script.src || '';
              return src.includes('unity') || 
                     src.includes('unityloader') || 
                     src.includes('framework') ||
                     src.includes('game') ||
                     src.includes('engine');
            });
            
            // Prioritize their loading
            criticalScripts.forEach(script => {
              script.setAttribute('fetchpriority', 'high');
              script.async = true; // Use async for parallel loading
            });
            
            // Find canvas elements
            const canvases = Array.from(document.getElementsByTagName('canvas'));
            canvases.forEach(canvas => {
              // Ensure they're visible
              if (canvas.style.display === 'none') canvas.style.display = 'block';
              if (canvas.style.visibility === 'hidden') canvas.style.visibility = 'visible';
              
              // Fix sizes
              if (canvas.width === 0 || canvas.height === 0) {
                canvas.width = canvas.width || window.innerWidth * 0.8 || 800;
                canvas.height = canvas.height || window.innerHeight * 0.8 || 600;
              }
            });
            
            // Find game containers and make them visible
            const gameContainers = document.querySelectorAll(
              '#unity-container, #gameContainer, #unityContainer, ' +
              '#canvas, #game, #unity-canvas, #webgl-content, ' +
              '[id*="unity"], [id*="game"], [id*="canvas"]'
            );
            
            gameContainers.forEach(container => {
              if (container.style.display === 'none') container.style.display = 'block';
              if (container.style.visibility === 'hidden') container.style.visibility = 'visible';
            });
          };
          
          // 7. MONITOR PAGE LOADING STATE AND FORCE VISIBILITY
          // Periodically check for page states
          let checkStatesInterval = setInterval(function() {
            // Record current state
            window.__gameLoading.recordState('check-' + document.readyState);
            
            if (document.readyState === 'interactive' || document.readyState === 'complete') {
              // Apply priorities when DOM is ready
              prioritizeCriticalResources();
              
              // Call again after a delay to catch dynamically added resources
              setTimeout(prioritizeCriticalResources, 1000);
              setTimeout(prioritizeCriticalResources, 3000);
              
              // Mark critical resources as loaded
              window.__gameLoading.markCritical();
              
              // Clear the interval once we've reached complete state
              if (document.readyState === 'complete') {
                clearInterval(checkStatesInterval);
                
                // Wait a bit longer for any final resources
                setTimeout(function() {
                  window.__gameLoading.markComplete();
                }, 2000);
              }
            }
          }, 100);
          
          // 8. DETECT AND RESPOND TO PAGE LOADING EVENTS
          // Detect page load
          window.addEventListener('load', function() {
            window.__gameLoading.recordState('window-load');
            
            // Mark critical resources loaded if not already
            if (!window.__gameLoading.criticalResourcesLoaded) {
              window.__gameLoading.markCritical();
            }
            
            // Final check for resources after window load
            setTimeout(function() {
              prioritizeCriticalResources();
              window.__gameLoading.markComplete();
            }, 2000);
          });
          
          // 9. HANDLE ERRORS GRACEFULLY
          // Detect page errors
          window.addEventListener('error', function(e) {
            window.__gameLoading.recordError(e.error || e.message);
          });
          
          window.addEventListener('unhandledrejection', function(e) {
            window.__gameLoading.recordError(e.reason || 'Promise rejected');
          });
          
          // Record initial document state
          window.__gameLoading.recordState('document-' + document.readyState);
          
          // 10. FORCE TIMEOUT VISIBILITY
          // After a certain time, force game visibility regardless of loading state
          setTimeout(function() {
            console.log('Forcing game visibility after timeout');
            
            // Find and remove loading screens
            document.querySelectorAll('[id*="loading"], [class*="loading"]').forEach(element => {
              if (element.offsetWidth > 100 && element.offsetHeight > 100) {
                if (element.id?.toLowerCase().includes('loading') || 
                    (typeof element.className === 'string' && element.className.toLowerCase().includes('loading'))) {
                  element.style.display = 'none';
                }
              }
            });
            
            // Force visibility of all game elements
            const gameElements = [
              'canvas',
              '#unity-container', '#gameContainer', '#unityContainer', 
              '#canvas', '#game', '#unity-canvas', '#webgl-content',
              '[id*="unity"]', '[id*="game"]', '[id*="canvas"]',
              '.unity-desktop', '.webgl-content', '.webgl-container'
            ];
            
            gameElements.forEach(selector => {
              try {
                document.querySelectorAll(selector).forEach(element => {
                  element.style.display = 'block';
                  element.style.visibility = 'visible';
                  element.style.opacity = '1';
                });
              } catch(e) {}
            });
            
            // Force a resize event to trigger game rendering
            try {
              window.dispatchEvent(new Event('resize'));
            } catch(e) {}
            
            // Notify parent that we've forced visibility
            try {
              window.parent.postMessage({
                type: 'GAME_FORCE_VISIBLE',
                time: performance.now()
              }, '*');
            } catch(e) {}
          }, 10000); // Force visibility after 10 seconds
        })();
        </script>
        ` + modifiedHtml.substring(headEndPos + 1);
      }
    }
    
// Add visibility fixes before </body>
if (modifiedHtml.includes('</body>')) {
  const bodyClosePos = modifiedHtml.indexOf('</body>');
  
  modifiedHtml = modifiedHtml.substring(0, bodyClosePos) + `
  <script>
  /* Game Rendering and Visibility Fixes */
  (function() {
    // Function to fix visibility issues
    function fixVisibility() {
      // Fix canvas visibility
      document.querySelectorAll('canvas').forEach(canvas => {
        if (canvas.style.display === 'none') canvas.style.display = 'block';
        if (canvas.style.visibility === 'hidden') canvas.style.visibility = 'visible';
        
        // Fix sizes
        if (canvas.width === 0 || canvas.height === 0) {
          canvas.width = canvas.width || window.innerWidth * 0.8 || 800;
          canvas.height = canvas.height || window.innerHeight * 0.8 || 600;
        }
      });
      
      // Fix game containers
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
        } catch (e) {}
      });
      
      // Remove loading overlays
      document.querySelectorAll('[id*="loading"], [class*="loading"]').forEach(element => {
        if (element.offsetWidth > 200 && element.offsetHeight > 200) {
          if (element.id?.toLowerCase().includes('loading') || 
              (typeof element.className === 'string' && element.className.toLowerCase().includes('loading'))) {
            element.style.display = 'none';
          }
        }
      });
      
      // Force game containers to be visible
      const gameContainers = document.querySelectorAll('#unity-canvas, #game, canvas, [id*="game"], [id*="unity"]');
      gameContainers.forEach(container => {
        container.style.display = 'block';
        container.style.visibility = 'visible';
        container.style.opacity = '1';
      });
    }
    
    // Setup Unity globals
    window.UnityLoader = window.UnityLoader || {
      instantiate: function(container, url, params) { return { SetFullscreen: function() {} }; },
      SystemInfo: { hasWebGL: true, mobile: false }
    };
    
    window.unityInstance = window.unityInstance || { SendMessage: function() {}, SetFullscreen: function() {} };
    window.unityShowBanner = window.unityShowBanner || function() {};
    window.unityProgress = window.unityProgress || function() {};
    
    // Run visibility fixes with multiple attempts for reliability
    let fixCount = 0;
    
    function runFixes() {
      fixCount++;
      fixVisibility();
      
      if (fixCount < 5) {
        setTimeout(runFixes, fixCount * 1000);
      }
    }
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runFixes);
      window.addEventListener('load', runFixes);
    } else {
      runFixes();
    }
  })();
  </script>
  ` + modifiedHtml.substring(bodyClosePos);
}

// Create the modified response with a cache timestamp
const modifiedHeaders = new Headers(response.headers);
modifiedHeaders.set('x-cache-timestamp', Date.now().toString());

return new Response(modifiedHtml, {
  status: response.status,
  statusText: response.statusText,
  headers: modifiedHeaders
});
  } catch (error) {
    console.error('[UV SW] HTML modification error:', error);
    return response;
  }
}

// Prefetch related resources for a given URL
async function prefetchRelatedResources(url, originalResponse) {
  if (!CONFIG.PREFETCH_DEPENDENCIES || !url || !originalResponse) {
    return;
  }
  
  try {
    // Only prefetch for HTML content
    const contentType = originalResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      return;
    }
    
    const textContent = await originalResponse.clone().text();
    
    // Extract critical resources
    const resourceUrls = [];
    
    // Extract script sources
    const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
    let match;
    while ((match = scriptRegex.exec(textContent)) !== null) {
      if (match[1] && !match[1].startsWith('data:')) {
        resourceUrls.push(match[1]);
      }
    }
    
    // Extract CSS sources
    const cssRegex = /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["']/gi;
    while ((match = cssRegex.exec(textContent)) !== null) {
      if (match[1] && !match[1].startsWith('data:')) {
        resourceUrls.push(match[1]);
      }
    }
    
    // Prioritize critical resources
    const criticalResources = resourceUrls.filter(resource => 
      CONFIG.PRIORITIES.CRITICAL.some(pattern => resource.includes(pattern))
    );
    
    // Prefetch critical resources first, then others
    const resources = [...criticalResources, ...resourceUrls.filter(r => !criticalResources.includes(r))];
    
    // Limit to a reasonable number
    const uniqueResources = [...new Set(resources)].slice(0, 10);
    
    // Prefetch in background
    for (const resourceUrl of uniqueResources) {
      try {
        let fullUrl;
        
        // Handle relative URLs
        if (resourceUrl.startsWith('/')) {
          const baseUrl = new URL(url);
          fullUrl = baseUrl.origin + resourceUrl;
        } else if (!resourceUrl.startsWith('http')) {
          // Handle relative paths without leading /
          const urlObj = new URL(url);
          const path = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
          fullUrl = urlObj.origin + path + resourceUrl;
        } else {
          fullUrl = resourceUrl;
        }
        
        // Don't prefetch if already fetched or in progress
        if (connections.isPending(fullUrl) || connections.isCompleted(fullUrl)) {
          continue;
        }
        
        // Prefetch with low priority and cache
        setTimeout(() => {
          fetch(fullUrl, { 
            priority: 'low',
            cache: 'force-cache'
          })
          .then(response => {
            if (response.ok && CONFIG.ENABLE_CACHE) {
              // Cache the response
              caches.open(CONFIG.CACHE_NAME).then(cache => {
                const headers = new Headers(response.headers);
                headers.set('x-cache-timestamp', Date.now().toString());
                
                // Create cacheable response
                const cacheResponse = new Response(response.clone().body, {
                  status: response.status,
                  statusText: response.statusText,
                  headers: headers
                });
                
                // Store in cache
                cache.put(new Request(fullUrl), cacheResponse);
              }).catch(() => {});
            }
          })
          .catch(() => {}); // Ignore errors in prefetch
        }, 50);
      } catch (e) {
        // Ignore errors in prefetch URL handling
      }
    }
  } catch (e) {
    // Ignore errors in prefetch
  }
}

// Enhanced fetch with retries, caching, and parallel loading
async function enhancedFetch(event, retries = CONFIG.RETRY_COUNT) {
  const url = new URL(event.request.url).toString();
  
  // Direct passthrough for bypass URLs
  if (shouldBypassUrl(url)) {
    return await sw.fetch(event);
  }
  
  // Look for cached response first if caching is enabled
  if (CONFIG.ENABLE_CACHE && shouldCacheUrl(url)) {
    try {
      const cache = await caches.open(CONFIG.CACHE_NAME);
      const cachedResponse = await cache.match(event.request);
      
      if (cachedResponse) {
        // Return cached response immediately, but update cache in background
        fetch(event.request.url, { 
          method: event.request.method, 
          headers: event.request.headers,
          cache: 'reload', // Force revalidation
          priority: getResourcePriority(url) // Set priority based on resource type
        })
        .then(freshResponse => {
          if (freshResponse && freshResponse.ok) {
            // Add cache timestamp
            const headers = new Headers(freshResponse.headers);
            headers.set('x-cache-timestamp', Date.now().toString());
            
            // Update cache with fresh response
            const clonedResponse = new Response(freshResponse.clone().body, {
              status: freshResponse.status,
              statusText: freshResponse.statusText,
              headers: headers
            });
            
            cache.put(event.request, clonedResponse);
          }
        })
        .catch(() => {}); // Ignore errors in background update
        
        return cachedResponse;
      }
    } catch (cacheError) {
      console.error('[UV SW] Cache error:', cacheError);
      // Continue to network request on cache error
    }
  }
  
  // Create a connection tracker for this request
  const controller = new AbortController();
  const signal = controller.signal;
  
  // Set timeout based on priority
  const priority = getResourcePriority(url);
  const timeout = setTimeout(() => {
    controller.abort();
  }, priority === 'CRITICAL' ? CONFIG.FETCH_TIMEOUT : Math.min(60000, CONFIG.FETCH_TIMEOUT / 2));
  
  try {
    // Process through UV with proper signal
    const options = {
      signal: signal,
      priority: priority === 'CRITICAL' ? 'high' : (priority === 'HIGH' ? 'high' : 'auto')
    };
    
    // Process through UV, register as a tracked connection
    const fetchPromise = sw.fetch(event, options);
    const response = await connections.add(url, fetchPromise);
    
    // Clear timeout
    clearTimeout(timeout);
    
    // Cache the response if appropriate
    if (CONFIG.ENABLE_CACHE && shouldCacheUrl(url) && response.ok) {
      try {
        const cache = await caches.open(CONFIG.CACHE_NAME);
        
        // Add cache timestamp
        const headers = new Headers(response.headers);
        headers.set('x-cache-timestamp', Date.now().toString());
        
        // Clone the response for caching
        const clonedResponse = new Response(response.clone().body, {
          status: response.status,
          statusText: response.statusText,
          headers: headers
        });
        
        // Store in cache
        cache.put(event.request, clonedResponse);
        
        // Periodically trim cache
        if (Math.random() < 0.01) { // 1% chance
          trimCache();
          clearExpiredCache();
        }
      } catch (cacheError) {
        console.error('[UV SW] Error caching response:', cacheError);
      }
    }
    
    // Special handling for game content HTML
    if (isGameContent(url) && response.headers.get('content-type')?.includes('text/html')) {
      const modifiedResponse = await injectGameFixes(response, url);
      
      // Prefetch related resources in background
      if (CONFIG.PREFETCH_DEPENDENCIES) {
        prefetchRelatedResources(url, response.clone());
      }
      
      return modifiedResponse;
    }
    
    return response;
  } catch (error) {
    // Clear timeout
    clearTimeout(timeout);
    
    console.error(`[UV SW] Fetch error: ${error.message}`);
    
    // Retry logic with exponential backoff
    if (retries > 0) {
      const delay = CONFIG.RETRY_DELAY * Math.pow(2, CONFIG.RETRY_COUNT - retries);
      console.log(`[UV SW] Retrying (${retries} attempts left) after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return enhancedFetch(event, retries - 1);
    }
    
    // Check cache once more after all retries failed
    if (CONFIG.ENABLE_CACHE) {
      try {
        const cache = await caches.open(CONFIG.CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          console.log('[UV SW] Returning stale cached response after failed retries');
          return cachedResponse;
        }
      } catch (e) {}
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
      <title>Game Loading Error</title>
      <style>
        body { font-family: Arial, sans-serif; color: white; background: #222; margin: 0; padding: 20px; text-align: center; }
        .container { max-width: 600px; margin: 40px auto; background: #333; border-radius: 8px; padding: 20px; }
        h2 { color: #f44336; margin-top: 0; }
        button { padding: 10px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Game Loading Error</h2>
        <p>The game couldn't be loaded. This may be due to network issues or temporarily high traffic.</p>
        <div>
          <button onclick="window.location.reload()">Try Again</button>
          <button onclick="window.location.href='/'">Go Home</button>
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
      !event.request.url.includes('/uv/') &&
      !event.request.url.includes('/service/') &&
      !event.request.url.includes('/bare/')) {
    return;
  }

  event.respondWith((async () => {
    try {
      // Use our enhanced fetch with error handling
      return await enhancedFetch(event);
    } catch (err) {
      console.error('[UV SW] Fatal error:', err);
      
      // Only show error page for navigation requests
      if (event.request.mode === 'navigate') {
        return createErrorPage(err);
      }
      
      // Last resort - try basic fetch
      try {
        return await sw.fetch(event);
      } catch (finalError) {
        throw finalError;
      }
    }
  })());
});

// Install handler
self.addEventListener('install', event => {
  console.log('[UV SW] Installing optimized service worker...');
  
  // Pre-cache important resources
  if (CONFIG.ENABLE_CACHE) {
    event.waitUntil((async () => {
      try {
        const cache = await caches.open(CONFIG.CACHE_NAME);
        
        // Add commonly used scripts to the cache
        await cache.addAll([
          '/uv/uv.bundle.js',
          '/uv/uv.handler.js',
          '/uv/uv.client.js',
          '/uv/uv.config.js',
          '/uv/uv.sw.js'
        ]);
        
        console.log('[UV SW] Pre-cached essential resources');
      } catch (err) {
        console.error('[UV SW] Pre-cache error:', err);
      }
    })());
  }
  
  self.skipWaiting();
});

// Activate handler
self.addEventListener('activate', event => {
  console.log('[UV SW] Activated');
  
  // Clean up old caches
  if (CONFIG.ENABLE_CACHE) {
    event.waitUntil((async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name !== CONFIG.CACHE_NAME && name.startsWith('uv-'))
            .map(name => caches.delete(name))
        );
        
        // Trim current cache
        await trimCache();
        await clearExpiredCache();
      } catch (error) {
        // Silent fail
      }
    })());
  }
  
  // Claim clients immediately to ensure consistent behavior
  event.waitUntil(clients.claim());
});
