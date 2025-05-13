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
  FETCH_TIMEOUT: 240000,      // 4 minute timeout for slower connections (increased from 3)
  RETRY_COUNT: 6,             // More retry attempts (increased from 4)
  RETRY_DELAY: 800,           // Initial delay between retries in ms (reduced for faster recovery)
  ENABLE_CACHE: true,         // Enable resource caching
  CACHE_NAME: 'uv-game-cache', // Cache name for game resources
  MAX_CACHE_SIZE: 750,        // Increased maximum number of items to cache (from 500)
  MAX_CACHE_AGE: 3600000 * 72, // Cache expiration (72 hours, increased from 48)
  PREFETCH_DEPENDENCIES: true, // Prefetch related resources
  AGGRESSIVE_CACHING: true,   // More aggressive caching strategy
  EARLY_REVEAL: false,        // Changed to false - don't show game content until ready
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
  
  // Track active connections - INCREASED FOR HIGH TRAFFIC
  MAX_CONCURRENT_CONNECTIONS: 250,  // Significantly increased from 75
  CONNECTION_TIMEOUT: 45000,  // 45 seconds (increased from 30)
  
  // Resource loading priorities
  PRIORITIES: {
    CRITICAL: ['wasm', 'unity', 'data', 'framework', 'loader', 'bundle'],
    HIGH: ['js', 'json', 'css'],
    MEDIUM: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'woff'],
    LOW: ['wav', 'mp3', 'ogg']
  },
  
  // High traffic mode settings - NEW
  HIGH_TRAFFIC: {
    ENABLED: false,           // Auto-detected based on connection count
    THRESHOLD: 150,           // Number of active connections to trigger high traffic mode
    CONNECTION_LIMIT: 350,    // Higher limit during high traffic mode
    AGGRESSIVE_CLEANUP: true, // More aggressive connection cleanup
    PRIORITIZE_HTML: true,    // Prioritize HTML responses over other resource types
    SKIP_PREFETCH: true,      // Skip prefetching in high traffic mode
    SIMPLER_LOADING: true     // Use simpler loading screens with fewer animations
  }
};

// Connection tracking with improved high traffic handling
const connections = {
  active: new Map(),
  pending: new Set(),
  completed: new Set(),
  
  // Stats tracking - NEW
  stats: {
    total: 0,
    successful: 0,
    failed: 0,
    retried: 0,
    averageTime: 0,
    highWaterMark: 0,
    lastHighTrafficMode: 0
  },
  
  add(url, promise) {
    this.pending.add(url);
    const startTime = Date.now();
    this.stats.total++;
    
    // Check if we should enter high traffic mode
    this.checkHighTrafficMode();
    
    // Monitor completion with better error handling
    promise.then(() => {
      this.stats.successful++;
      const duration = Date.now() - startTime;
      // Update average time with weighted approach
      this.stats.averageTime = this.stats.averageTime * 0.95 + duration * 0.05;
    }).catch(() => {
      this.stats.failed++;
    }).finally(() => {
      this.pending.delete(url);
      this.completed.add(url);
      
      // Remove from completed after a delay (reduced in high traffic mode)
      const completedTimeout = CONFIG.HIGH_TRAFFIC.ENABLED ? 5000 : 10000;
      setTimeout(() => {
        this.completed.delete(url);
      }, completedTimeout);
    });
    
    // Track active connection
    this.active.set(url, {
      timestamp: startTime,
      promise
    });
    
    // Update high water mark if needed
    if (this.active.size > this.stats.highWaterMark) {
      this.stats.highWaterMark = this.active.size;
    }
    
    // Clean up old connections (more aggressively in high traffic mode)
    this.cleanup();
    
    return promise;
  },
  
  // Check if we should enter or exit high traffic mode
  checkHighTrafficMode() {
    const now = Date.now();
    const activeCount = this.active.size;
    
    // Enter high traffic mode if we exceed the threshold
    if (!CONFIG.HIGH_TRAFFIC.ENABLED && activeCount > CONFIG.HIGH_TRAFFIC.THRESHOLD) {
      CONFIG.HIGH_TRAFFIC.ENABLED = true;
      CONFIG.MAX_CONCURRENT_CONNECTIONS = CONFIG.HIGH_TRAFFIC.CONNECTION_LIMIT;
      this.stats.lastHighTrafficMode = now;
      console.log(`[UV SW] Entering high traffic mode (${activeCount} connections)`);
      
      // Broadcast high traffic mode to clients
      this.broadcastHighTrafficMode(true);
    } 
    // Exit after at least 30 seconds if connections drop significantly
    else if (CONFIG.HIGH_TRAFFIC.ENABLED && 
             now - this.stats.lastHighTrafficMode > 30000 &&
             activeCount < CONFIG.HIGH_TRAFFIC.THRESHOLD / 2) {
      CONFIG.HIGH_TRAFFIC.ENABLED = false;
      CONFIG.MAX_CONCURRENT_CONNECTIONS = 250; // Back to normal but still higher than original
      console.log(`[UV SW] Exiting high traffic mode (${activeCount} connections)`);
      
      // Broadcast high traffic mode ended to clients
      this.broadcastHighTrafficMode(false);
    }
  },
  
  // Broadcast high traffic mode status to clients
  broadcastHighTrafficMode(isHighTraffic) {
    // Only run in browser context with self.clients
    try {
      if (self.clients) {
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'HIGH_TRAFFIC_MODE',
              enabled: isHighTraffic,
              connections: this.active.size,
              stats: this.stats
            });
          });
        }).catch(err => {
          console.error('[UV SW] Error broadcasting high traffic mode:', err);
        });
      }
    } catch (err) {
      // Ignore errors - the broadcast is optional
    }
  },
  
  cleanup() {
    const now = Date.now();
    
    // Adjust cleanup behavior based on traffic mode
    const connectionTimeout = CONFIG.HIGH_TRAFFIC.ENABLED ? 
      CONFIG.CONNECTION_TIMEOUT / 2 : CONFIG.CONNECTION_TIMEOUT;
    
    // Remove expired connections
    for (const [url, data] of this.active.entries()) {
      if (now - data.timestamp > connectionTimeout) {
        this.active.delete(url);
      }
    }
    
    // Ensure we don't exceed max connections - more aggressive in high traffic mode
    if (this.active.size > CONFIG.MAX_CONCURRENT_CONNECTIONS) {
      // Find oldest non-critical connections to remove
      const connections = Array.from(this.active.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .filter(([url]) => {
          // Don't remove critical or pending resources
          return !CONFIG.PRIORITIES.CRITICAL.some(type => url.includes(type)) && 
                 !this.pending.has(url);
        });
      
      // Calculate how many to remove
      let removeCount = this.active.size - CONFIG.MAX_CONCURRENT_CONNECTIONS;
      
      // In high traffic mode, remove more to stay well under the limit
      if (CONFIG.HIGH_TRAFFIC.ENABLED && CONFIG.HIGH_TRAFFIC.AGGRESSIVE_CLEANUP) {
        removeCount = Math.ceil(removeCount * 1.25); // Remove 25% more than needed
      }
      
      // Remove oldest connections to get under limit
      const toRemove = connections.slice(0, removeCount);
      for (const [url] of toRemove) {
        this.active.delete(url);
      }
      
      if (toRemove.length > 0) {
        console.log(`[UV SW] Cleaned up ${toRemove.length} old connections (traffic mode: ${CONFIG.HIGH_TRAFFIC.ENABLED ? 'high' : 'normal'})`);
      }
    }
  },
  
  isPending(url) {
    return this.pending.has(url);
  },
  
  isCompleted(url) {
    return this.completed.has(url);
  },
  
  // Get current connection stats - NEW
  getStats() {
    return {
      ...this.stats,
      active: this.active.size,
      pending: this.pending.size,
      completed: this.completed.size,
      highTrafficMode: CONFIG.HIGH_TRAFFIC.ENABLED
    };
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
    
    // Determine if we should use simpler loading screens in high traffic mode
    const useSimpleLoading = CONFIG.HIGH_TRAFFIC.ENABLED && CONFIG.HIGH_TRAFFIC.SIMPLER_LOADING;
    
    // Add advanced loading optimizations to head - IMPROVED FOR HIGH TRAFFIC
    if (modifiedHtml.includes('<head')) {
      const headInsertPos = modifiedHtml.indexOf('<head') + '<head'.length;
      const headEndPos = modifiedHtml.indexOf('>', headInsertPos);
      
      if (headEndPos !== -1) {
        modifiedHtml = modifiedHtml.substring(0, headEndPos + 1) + `
        <script>
        /* Advanced Game Loading Optimizations - High Traffic Edition */
        (function() {
          // Track loading state
          window.__gameLoading = {
            start: Date.now(),
            resources: new Map(),
            complete: false,
            resourcesLoaded: 0,
            criticalResourcesLoaded: false,
            readyStates: [],
            errors: [],
            highTrafficMode: ${CONFIG.HIGH_TRAFFIC.ENABLED}, // Pass high traffic mode status
            useSimpleLoading: ${useSimpleLoading}, // Use simpler loading screens in high traffic
            
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
                  time: Date.now() - this.start,
                  highTrafficMode: this.highTrafficMode
                }, '*');
              } catch(e) {}
            },
            
            // Record errors
            recordError: function(error) {
              this.errors.push({
                error: error.toString(),
                time: Date.now() - this.start
              });
              
              // Send error to parent with current mode
              try {
                window.parent.postMessage({
                  type: 'GAME_ERROR',
                  error: error.toString(),
                  time: Date.now() - this.start,
                  highTrafficMode: this.highTrafficMode
                }, '*');
              } catch(e) {}
            },
            
            // Mark critical resources loaded
            markCritical: function() {
              this.criticalResourcesLoaded = true;
              this.recordState('critical-resources-loaded');
              
              // Send ready state to parent with high traffic flag
              try {
                window.parent.postMessage({
                  type: 'GAME_CRITICAL_READY',
                  time: Date.now() - this.start,
                  highTrafficMode: this.highTrafficMode
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
                    time: Date.now() - this.start,
                    highTrafficMode: this.highTrafficMode,
                    resourceStats: {
                      total: this.resources.size,
                      loaded: this.resourcesLoaded,
                      errors: this.errors.length
                    }
                  }, '*');
                } catch(e) {}
              }
            }
          };

          // Handler for high traffic mode updates from service worker
          navigator.serviceWorker.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'HIGH_TRAFFIC_MODE') {
              window.__gameLoading.highTrafficMode = event.data.enabled;
              window.__gameLoading.useSimpleLoading = event.data.enabled && ${CONFIG.HIGH_TRAFFIC.SIMPLER_LOADING};
              
              // Notify parent of mode change
              try {
                window.parent.postMessage({
                  type: 'HIGH_TRAFFIC_UPDATE',
                  enabled: event.data.enabled,
                  stats: event.data.stats
                }, '*');
              } catch(e) {}
              
              console.log('High traffic mode ' + (event.data.enabled ? 'enabled' : 'disabled'));
            }
          });
          
          // Record initial state
          window.__gameLoading.recordState('init');

          // --- PERFORMANCE OPTIMIZATION SECTION ---
          
          // 1. PRELOAD CRITICAL RESOURCES
          // Add preload hints for common game dependencies
          function addPreloadHints() {
            // Skip in high traffic mode if configured
            if (window.__gameLoading.highTrafficMode && ${CONFIG.HIGH_TRAFFIC.SKIP_PREFETCH}) {
              console.log('Skipping preload hints in high traffic mode');
              return;
            }
            
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
              
              // Optimize WebGL contexts - even more aggressive in high traffic mode
              if (['webgl', 'experimental-webgl', 'webgl2'].includes(contextType)) {
                contextAttributes = contextAttributes || {};
                contextAttributes.failIfMajorPerformanceCaveat = false;
                contextAttributes.powerPreference = 'high-performance';
                contextAttributes.preserveDrawingBuffer = window.__gameLoading.highTrafficMode ? false : true;
                contextAttributes.antialias = false; // Disable antialiasing for faster loading
                contextAttributes.depth = true;
                contextAttributes.stencil = false; // Only enable if needed
                contextAttributes.alpha = true;
                
                // In high traffic mode, reduce quality further
                if (window.__gameLoading.highTrafficMode) {
                  contextAttributes.precision = 'lowp'; // Use lower precision in high traffic
                }
                
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
                    
                    // After 8 seconds in normal mode, 15 in high traffic mode, try to enable better quality
                    setTimeout(function() {
                      try {
                        // Only improve quality if not in high traffic mode
                        if (!window.__gameLoading.highTrafficMode) {
                          ctx.enableAntiAlias();
                        }
                      } catch(e) {}
                    }, window.__gameLoading.highTrafficMode ? 15000 : 8000);
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
          
          // 3. OPTIMIZE RESOURCE LOADING - IMPROVED
          // Resource loader optimization with high traffic awareness
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
              let resourcePriority = 'low';
              if (resourceUrl.includes('wasm') || 
                  resourceUrl.includes('framework') || 
                  resourceUrl.includes('loader') || 
                  resourceUrl.includes('data') ||
                  resourceUrl.includes('unity')) {
                resourcePriority = 'high';
                options.priority = 'high';
              }
              
              // For non-critical resources, use cache when possible
              if (resourcePriority !== 'high') {
                options.cache = options.cache || 'force-cache';
              }
              
              // Add shorter timeout for faster failure recovery
              // Use even shorter timeouts in high traffic mode
              const controller = new AbortController();
              const signal = controller.signal;
              options.signal = signal;
              
              // Set appropriate timeout based on importance and traffic mode
              const highTrafficFactor = window.__gameLoading.highTrafficMode ? 1.5 : 1;
              const timeout = setTimeout(() => {
                controller.abort();
              }, resourcePriority === 'high' ? 
                 60000 * highTrafficFactor : 
                 30000 * highTrafficFactor);
                
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
                  
                  // Check if we've loaded critical resources
                  const isCriticalResource = 
                    resourceUrl.includes('framework.js') ||
                    resourceUrl.includes('loader.js') ||
                    resourceUrl.includes('unity') ||
                    resourceUrl.includes('game') ||
                    resourceUrl.includes('wasm');
                    
                  if (isCriticalResource && !window.__gameLoading.criticalResourcesLoaded) {
                    // Check if most critical resources are loaded
                    const criticalTotal = 
                      Array.from(window.__gameLoading.resources.entries())
                        .filter(([url]) => 
                          url.includes('framework.js') ||
                          url.includes('loader.js') ||
                          url.includes('unity') ||
                          url.includes('game') ||
                          url.includes('wasm')
                        ).length;
                        
                    const criticalLoaded = 
                      Array.from(window.__gameLoading.resources.entries())
                        .filter(([url, data]) => 
                          (url.includes('framework.js') ||
                           url.includes('loader.js') ||
                           url.includes('unity') ||
                           url.includes('game') ||
                           url.includes('wasm')) && 
                          data.status === 'loaded'
                        ).length;
                    
                    // Mark critical when we have at least 3 critical resources loaded
                    // or when at least 80% of detected critical resources are loaded
                    if (criticalLoaded >= 3 || (criticalTotal > 0 && criticalLoaded / criticalTotal >= 0.8)) {
                      window.__gameLoading.markCritical();
                    }
                  }
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
          
          // 4. OPTIMIZE IMAGE LOADING - IMPROVED FOR HIGH TRAFFIC
          // Replace Image constructor for optimized loading
          const OriginalImage = window.Image;
          window.Image = function(width, height) {
            const img = new OriginalImage(width, height);
            
            // Add loading priority - lazy in high traffic mode, eager otherwise
            img.loading = window.__gameLoading.highTrafficMode ? 'lazy' : 'eager';
            
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
                
                // In high traffic mode, add a flag to know this is a dynamic image
                if (window.__gameLoading.highTrafficMode) {
                  this.setAttribute('data-dynamic', 'true');
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
          
          // 5. SCRIPT LOADING OPTIMIZATION - IMPROVED
          // Optimize script loading and execution with high traffic awareness
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
                    
                    // In high traffic mode, we still need async but will
                    // use a more controlled approach
                    if (window.__gameLoading.highTrafficMode) {
                      // High traffic mode: defer non-critical scripts
                      if (!value.includes('framework') && 
                          !value.includes('loader')) {
                        this.setAttribute('defer', '');
                      } else {
                        // Critical scripts: use async for parallel loading
                        this.setAttribute('async', '');
                      }
                    } else {
                      // Normal mode: force async to get parallel loading
                      this.setAttribute('async', '');
                    }
                    
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
              // In high traffic mode, lazy load all images
              // In normal mode, only non-critical images
              element.setAttribute('loading', window.__gameLoading.highTrafficMode ? 'lazy' : 'eager');
              
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
                  
                  if (isCritical && !window.__gameLoading.highTrafficMode) {
                    this.setAttribute('fetchpriority', 'high');
                    this.removeAttribute('loading'); // Don't lazy-load critical images
                  } else if (window.__gameLoading.highTrafficMode) {
                    // In high traffic mode, always lazy load
                    this.setAttribute('loading', 'lazy');
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
              // In high traffic mode, we still use async but more carefully
              if (window.__gameLoading.highTrafficMode) {
                // Only framework and loader should be async in high traffic
                if (script.src.includes('framework') || 
                    script.src.includes('loader')) {
                  script.async = true;
                } else {
                  script.defer = true;
                }
              } else {
                script.async = true; // Use async for parallel loading in normal mode
              }
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
          // Periodically check for page states - less frequently in high traffic mode
          const stateCheckInterval = window.__gameLoading.highTrafficMode ? 200 : 100;
          let checkStatesInterval = setInterval(function() {
            // Record current state
            window.__gameLoading.recordState('check-' + document.readyState);
            
            if (document.readyState === 'interactive' || document.readyState === 'complete') {
              // Apply priorities when DOM is ready
              prioritizeCriticalResources();
              
              // Call again after a delay to catch dynamically added resources
              // Longer delays in high traffic mode
              const secondPriorityDelay = window.__gameLoading.highTrafficMode ? 2000 : 1000;
              const thirdPriorityDelay = window.__gameLoading.highTrafficMode ? 6000 : 3000;
              
              setTimeout(prioritizeCriticalResources, secondPriorityDelay);
              setTimeout(prioritizeCriticalResources, thirdPriorityDelay);
              
              // Mark critical resources as loaded
              window.__gameLoading.markCritical();
              
              // Clear the interval once we've reached complete state
              if (document.readyState === 'complete') {
                clearInterval(checkStatesInterval);
                
                // Wait a bit longer for any final resources
                // Even longer in high traffic mode
                const completeDelay = window.__gameLoading.highTrafficMode ? 4000 : 2000;
                setTimeout(function() {
                  window.__gameLoading.markComplete();
                }, completeDelay);
              }
            }
          }, stateCheckInterval);
          
          // 8. DETECT AND RESPOND TO PAGE LOADING EVENTS
          // Detect page load
          window.addEventListener('load', function() {
            window.__gameLoading.recordState('window-load');
            
            // Mark critical resources loaded if not already
            if (!window.__gameLoading.criticalResourcesLoaded) {
              window.__gameLoading.markCritical();
            }
            
            // Final check for resources after window load
            // Longer delay in high traffic mode
            const finalDelay = window.__gameLoading.highTrafficMode ? 4000 : 2000;
            setTimeout(function() {
              prioritizeCriticalResources();
              window.__gameLoading.markComplete();
            }, finalDelay);
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
          // Longer timeout in high traffic mode
          const visibilityTimeout = window.__gameLoading.highTrafficMode ? 20000 : 10000;
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
                time: performance.now(),
                highTrafficMode: window.__gameLoading.highTrafficMode
              }, '*');
            } catch(e) {}
          }, visibilityTimeout);
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
  /* Game Rendering and Visibility Fixes - High Traffic Edition */
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
    
    // Track high traffic mode
    const isHighTrafficMode = window.__gameLoading && window.__gameLoading.highTrafficMode;
    
    // Run visibility fixes with multiple attempts for reliability
    // More attempts with longer intervals in high traffic mode
    let fixCount = 0;
    const maxFixes = isHighTrafficMode ? 8 : 5;
    
    function runFixes() {
      fixCount++;
      fixVisibility();
      
      if (fixCount < maxFixes) {
        // Progressive timing - longer intervals in high traffic mode
        const interval = isHighTrafficMode ? 
          fixCount * 1500 : // 1.5s, 3s, 4.5s, etc. in high traffic
          fixCount * 1000;  // 1s, 2s, 3s, etc. in normal mode
        
        setTimeout(runFixes, interval);
      }
    }
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runFixes);
      window.addEventListener('load', runFixes);
    } else {
      runFixes();
    }
    
    // Listen for high traffic mode updates
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'HIGH_TRAFFIC_UPDATE') {
        console.log('High traffic mode update received by visibility fixes');
        // Run visibility fixes again when mode changes
        fixCount = 0;
        runFixes();
      }
    });
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

// Prefetch related resources for a given URL with high traffic awareness
async function prefetchRelatedResources(url, originalResponse) {
  // Skip prefetching in high traffic mode
  if (CONFIG.HIGH_TRAFFIC.ENABLED && CONFIG.HIGH_TRAFFIC.SKIP_PREFETCH) {
    return;
  }
  
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
    
    // Limit to a reasonable number - even fewer in high traffic
    const maxPrefetch = CONFIG.HIGH_TRAFFIC.ENABLED ? 5 : 10;
    const uniqueResources = [...new Set(resources)].slice(0, maxPrefetch);
    
    // Prefetch in background with staggered delays in high traffic mode
    for (let i = 0; i < uniqueResources.length; i++) {
      const resourceUrl = uniqueResources[i];
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
        
        // Calculate delay - staggered in high traffic mode
        const delay = CONFIG.HIGH_TRAFFIC.ENABLED ? 
          50 + (i * 200) : // Staggered delays in high traffic
          50;              // Constant small delay in normal traffic
        
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
        }, delay);
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
        // Skip background update in high traffic mode to reduce load
        if (!CONFIG.HIGH_TRAFFIC.ENABLED) {
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
        }
        
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
  
  // Set timeout based on priority and traffic mode
  const priority = getResourcePriority(url);
  const highTrafficFactor = CONFIG.HIGH_TRAFFIC.ENABLED ? 1.5 : 1; // 50% longer timeouts in high traffic
  
  // Longer timeouts for critical resources
  const timeout = setTimeout(() => {
    controller.abort();
  }, priority === 'CRITICAL' ? 
     CONFIG.FETCH_TIMEOUT * highTrafficFactor : 
     Math.min(60000, CONFIG.FETCH_TIMEOUT / 2) * highTrafficFactor);
  
  // In high traffic mode, prioritize HTML responses
  const shouldPrioritize = CONFIG.HIGH_TRAFFIC.ENABLED && 
                        CONFIG.HIGH_TRAFFIC.PRIORITIZE_HTML &&
                        (url.endsWith('.html') || url.includes('/games/') || url.includes('/game/'));
  
  try {
    // Process through UV with proper signal
    const options = {
      signal: signal,
      priority: shouldPrioritize ? 'high' : 
               (priority === 'CRITICAL' ? 'high' : 
               (priority === 'HIGH' ? 'high' : 'auto'))
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
        
        // Periodically trim cache - less often in high traffic mode
        if (Math.random() < (CONFIG.HIGH_TRAFFIC.ENABLED ? 0.005 : 0.01)) { // 0.5% in high traffic, 1% in normal
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
      
      // Prefetch related resources in background (skip in high traffic mode)
      if (CONFIG.PREFETCH_DEPENDENCIES && !(CONFIG.HIGH_TRAFFIC.ENABLED && CONFIG.HIGH_TRAFFIC.SKIP_PREFETCH)) {
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
      
      // Update retry stats
      connections.stats.retried++;
      
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
  // Create a simpler error page in high traffic mode
  const isHighTraffic = CONFIG.HIGH_TRAFFIC.ENABLED;
  
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
        ${isHighTraffic ? '.high-traffic { color: #ffeb3b; font-weight: bold; }' : ''}
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Game Loading Error</h2>
        ${isHighTraffic ? '<p class="high-traffic">Our system is experiencing high traffic right now.</p>' : ''}
        <p>The game couldn't be loaded. This may be due to network issues or temporarily high traffic.</p>
        <div>
          <button onclick="window.location.reload()">Try Again</button>
          <button onclick="window.location.href='/'">Go Home</button>
        </div>
        ${isHighTraffic ? '<p>Please try again in a few minutes when our servers are less busy.</p>' : ''}
      </div>
      <script>
        // Report error to service worker after a short delay
        setTimeout(function() {
          try {
            navigator.serviceWorker.controller.postMessage({
              type: 'ERROR_REPORT',
              url: location.href,
              timestamp: Date.now()
            });
          } catch(e) {}
        }, 1000);
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

// Message handler for client communication
self.addEventListener('message', event => {
  if (!event.data) return;
  
  // Handle ping/pong
  if (event.data.type === 'PING') {
    try {
      event.source.postMessage({
        type: 'PONG',
        timestamp: event.data.timestamp
      });
    } catch (e) {
      // Silent fail
    }
    return;
  }
  
  // Handle error reports
  if (event.data.type === 'ERROR_REPORT') {
    console.log(`[UV SW] Error report received for ${event.data.url}`);
    return;
  }
  
  // Handle status requests
  if (event.data.type === 'STATUS_REQUEST') {
    try {
      event.source.postMessage({
        type: 'STATUS_RESPONSE',
        connectionStats: connections.getStats(),
        highTrafficMode: CONFIG.HIGH_TRAFFIC.ENABLED,
        timestamp: Date.now()
      });
    } catch (e) {
      // Silent fail
    }
    return;
  }
});
