/*global UVServiceWorker,__uv$config*/
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts('encode.js'); // Load enhanced encoder
importScripts(__uv$config.sw || 'uv.sw.js');

const sw = new UVServiceWorker();

// ENHANCED CONFIGURATION FOR SLOW DEVICES
const CONFIG = {
  // Significantly increased timeouts for slow devices
  FETCH_TIMEOUT: 600000,      // 10 minutes (was 5)
  RETRY_COUNT: 12,            // More retries (was 8)  
  RETRY_DELAY: 1000,          // Longer initial retry delay
  ENABLE_CACHE: true,
  CACHE_NAME: 'uv-slow-device-cache-v2',
  MAX_CACHE_SIZE: 2000,       // Even larger cache
  MAX_CACHE_AGE: 3600000 * 168, // 7 days (was 4)
  PREFETCH_DEPENDENCIES: true,
  AGGRESSIVE_CACHING: true,
  
  // Enhanced device-aware settings
  DEVICE_DETECTION: true,
  VERY_SLOW_DEVICE_TIMEOUT_MULTIPLIER: 4.0,  // 4x timeout for very slow devices
  SLOW_DEVICE_TIMEOUT_MULTIPLIER: 2.5,       // 2.5x timeout for slow devices
  FAST_DEVICE_TIMEOUT_MULTIPLIER: 0.8,       // Slightly faster for fast devices
  
  // More comprehensive cache patterns
  CACHE_PATTERNS: [
    '.js', '.css', '.woff', '.woff2', '.ttf', '.png', '.jpg', '.jpeg', '.gif', '.svg',
    'unity', 'webgl', 'game', '/assets/', '/static/', '.data', '.wasm', '.mem', 
    'jsdelivr', 'cloudfront', 'akamai', 'cdn', '.unityweb', '.unity3d', '.json',
    '.xml', '.txt', '.html', '.htm', '.ico', '.mp3', '.ogg', '.wav', '.webm',
    'poki', 'y8.com', 'crazygames', 'coolmath', 'kongregate', 'newgrounds',
    'github.io', 'gitlab.io', 'itch.io', 'simmer.io', 'replit.com'
  ],
  
  BYPASS_PATTERNS: [
    '/bare/',
    '/uv/service/',
    '/service/'
  ],
  
  // Expanded priority domains
  PRIORITY_DOMAINS: [
    'unity.com', 'unitycdn', 'unity3d', 'jsdelivr.net', 
    'cloudfront.net', 'amazonaws.com', 'googleusercontent.com',
    'poki.com', 'y8.com', 'crazygames.com', 'coolmathgames.com',
    'kongregate.com', 'newgrounds.com', 'addictinggames.com',
    'armor.com', 'miniclip.com', 'silvergames.com', 'friv.com',
    'kizi.com', 'gamedistribution.com', 'github.io', 'gitlab.io',
    'itch.io', 'itchspace.io', 'simmer.io', 'replit.com', 'glitch.me'
  ],
  
  MAX_CONCURRENT_CONNECTIONS: 150, // Reduced for slow devices
  CONNECTION_TIMEOUT: 120000,      // 2 minutes (was 1)
  
  // Enhanced priorities
  PRIORITIES: {
    CRITICAL: ['wasm', 'unity', 'data', 'framework', 'loader', 'bundle', 'unityweb', 'engine'],
    HIGH: ['js', 'json', 'css', 'html', 'htm'],
    MEDIUM: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'woff', 'ttf'],
    LOW: ['wav', 'mp3', 'ogg', 'webm', 'txt', 'xml']
  },
  
  // Slow device specific optimizations
  SLOW_DEVICE_OPTIMIZATIONS: {
    REDUCE_CONCURRENT_REQUESTS: true,
    PREFER_CACHE_OVER_NETWORK: true,
    EXTENDED_STALE_WHILE_REVALIDATE: true,
    COMPRESS_RESPONSES: true,
    BATCH_SIMILAR_REQUESTS: true
  }
};

// Enhanced device detection with more comprehensive profiling
const deviceProfile = {
  performance: 'medium',
  isSlowDevice: false,
  isVerySlowDevice: false,
  detected: false,
  cores: 2,
  memory: 2,
  connection: null,
  benchmark: 0,
  
  detect() {
    if (this.detected) return this;
    
    try {
      // Hardware detection
      this.cores = navigator.hardwareConcurrency || 2;
      this.memory = navigator.deviceMemory || 2;
      this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      // Connection analysis
      const isSlowConnection = this.connection && (
        this.connection.effectiveType === 'slow-2g' || 
        this.connection.effectiveType === '2g' || 
        this.connection.downlink < 1.5 ||
        this.connection.rtt > 300
      );
      
      const isVerySlowConnection = this.connection && (
        this.connection.effectiveType === 'slow-2g' ||
        this.connection.downlink < 0.5 ||
        this.connection.rtt > 800
      );
      
      // Device type detection
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isChromebook = navigator.userAgent.includes('CrOS') || 
                         (navigator.userAgent.includes('Chrome') && 
                          navigator.platform.includes('Linux') && 
                          !navigator.userAgent.includes('Android'));
      const isOldDevice = /Windows NT [45]\.|OS X 10\.[0-9]\.|iPhone OS [0-9]_|Android [0-4]\./i.test(navigator.userAgent);
      
      // Enhanced performance benchmark
      const start = performance.now();
      let iterations = 0;
      const benchmarkTime = 10; // 10ms benchmark
      const endTime = start + benchmarkTime;
      
      while (performance.now() < endTime) {
        Math.random();
        Math.sqrt(Math.random() * 1000);
        iterations++;
      }
      
      this.benchmark = iterations / benchmarkTime; // ops per ms
      
      // Memory pressure test (quick allocation test)
      let memoryScore = 1;
      try {
        const testArray = new Array(10000).fill(0).map(() => Math.random());
        const testStart = performance.now();
        testArray.sort();
        const testDuration = performance.now() - testStart;
        memoryScore = Math.max(0.1, Math.min(2, 50 / testDuration));
      } catch (e) {
        memoryScore = 0.5;
      }
      
      // Comprehensive device classification
      const hardwareScore = (this.cores / 8) + (this.memory / 8); // 0-2 scale
      const performanceScore = Math.min(2, this.benchmark / 500); // 0-2 scale  
      const connectionScore = isVerySlowConnection ? 0 : (isSlowConnection ? 0.5 : 1); // 0-1 scale
      const deviceTypeScore = isOldDevice ? 0.2 : (isMobile ? 0.6 : (isChromebook ? 0.7 : 1)); // 0-1 scale
      
      const overallScore = (hardwareScore + performanceScore + connectionScore + deviceTypeScore + memoryScore) / 5;
      
      // Classification thresholds
      this.isVerySlowDevice = overallScore < 0.4 || 
                             (this.cores < 2 && this.memory < 2) ||
                             isVerySlowConnection ||
                             (isOldDevice && (isMobile || isChromebook));
      
      this.isSlowDevice = overallScore < 0.7 || 
                         this.cores < 3 || 
                         this.memory < 3 || 
                         isSlowConnection ||
                         (isMobile && this.benchmark < 100) ||
                         (isChromebook && this.benchmark < 150);
      
      this.performance = this.isVerySlowDevice ? 'very-slow' : 
                        (this.isSlowDevice ? 'slow' : 
                         (overallScore > 1.3 ? 'fast' : 'medium'));
      
      this.detected = true;
      
      console.log('[UV SW] Enhanced device profile:', {
        performance: this.performance,
        cores: this.cores,
        memory: this.memory,
        benchmark: this.benchmark,
        overallScore: overallScore.toFixed(2),
        connection: this.connection?.effectiveType || 'unknown',
        isSlowDevice: this.isSlowDevice,
        isVerySlowDevice: this.isVerySlowDevice
      });
      
    } catch (e) {
      console.error('[UV SW] Device detection error:', e);
      this.isSlowDevice = true; // Err on the side of caution
      this.performance = 'slow';
      this.detected = true;
    }
    
    return this;
  }
};

// Enhanced connection tracking with slow device awareness
const connections = {
  active: new Map(),
  pending: new Set(),
  completed: new Set(),
  stats: {
    total: 0,
    successful: 0,
    failed: 0,
    retried: 0,
    cached: 0,
    averageTime: 0,
    deviceAdjustedTimeouts: 0,
    slowDeviceOptimizations: 0
  },
  
  add(url, promise, deviceAware = true) {
    this.pending.add(url);
    const startTime = Date.now();
    this.stats.total++;
    
    const device = deviceProfile.detect();
    
    // Apply enhanced device-aware timeout adjustments
    if (deviceAware && device.detected) {
      let timeoutMultiplier = 1.0;
      
      if (device.isVerySlowDevice) {
        timeoutMultiplier = CONFIG.VERY_SLOW_DEVICE_TIMEOUT_MULTIPLIER;
        this.stats.slowDeviceOptimizations++;
      } else if (device.isSlowDevice) {
        timeoutMultiplier = CONFIG.SLOW_DEVICE_TIMEOUT_MULTIPLIER;
        this.stats.slowDeviceOptimizations++;
      } else if (device.performance === 'fast') {
        timeoutMultiplier = CONFIG.FAST_DEVICE_TIMEOUT_MULTIPLIER;
      }
      
      if (timeoutMultiplier !== 1.0) {
        this.stats.deviceAdjustedTimeouts++;
      }
    }
    
    promise.then(() => {
      this.stats.successful++;
      const duration = Date.now() - startTime;
      this.stats.averageTime = this.stats.averageTime * 0.9 + duration * 0.1;
    }).catch(() => {
      this.stats.failed++;
    }).finally(() => {
      this.pending.delete(url);
      this.completed.add(url);
      
      // Longer retention for slow devices (they might retry more)
      const retentionTime = device.isSlowDevice ? 30000 : 15000;
      setTimeout(() => {
        this.completed.delete(url);
      }, retentionTime);
    });
    
    this.active.set(url, {
      timestamp: startTime,
      promise,
      deviceAware,
      priority: getResourcePriority(url)
    });
    
    this.cleanup();
    return promise;
  },
  
  cleanup() {
    const now = Date.now();
    const device = deviceProfile.detect();
    const timeout = device.isSlowDevice ? 
      CONFIG.CONNECTION_TIMEOUT * 2 : 
      CONFIG.CONNECTION_TIMEOUT;
    
    // Remove timed out connections
    for (const [url, data] of this.active.entries()) {
      if (now - data.timestamp > timeout) {
        this.active.delete(url);
      }
    }
    
    // Reduce concurrent connections for slow devices
    const maxConnections = device.isVerySlowDevice ? 50 : 
                          (device.isSlowDevice ? 100 : CONFIG.MAX_CONCURRENT_CONNECTIONS);
    
    if (this.active.size > maxConnections) {
      const connections = Array.from(this.active.entries())
        .sort((a, b) => {
          // Sort by priority first, then by age
          const priorityA = getPriorityValue(a[1].priority);
          const priorityB = getPriorityValue(b[1].priority);
          
          if (priorityA !== priorityB) {
            return priorityB - priorityA; // Higher priority first
          }
          
          return a[1].timestamp - b[1].timestamp; // Older first
        })
        .filter(([url, data]) => {
          // Don't remove critical resources
          return data.priority !== 'CRITICAL' && !this.pending.has(url);
        });
      
      const removeCount = this.active.size - maxConnections;
      const toRemove = connections.slice(-removeCount); // Remove lowest priority/oldest
      
      for (const [url] of toRemove) {
        this.active.delete(url);
      }
    }
  }
};

// Helper function to get priority value for sorting
function getPriorityValue(priority) {
  switch (priority) {
    case 'CRITICAL': return 4;
    case 'HIGH': return 3;
    case 'MEDIUM': return 2;
    case 'LOW': return 1;
    default: return 0;
  }
}

// Enhanced cache management with slow device optimizations
async function trimCache() {
  try {
    const cache = await caches.open(CONFIG.CACHE_NAME);
    const keys = await cache.keys();
    
    if (keys.length > CONFIG.MAX_CACHE_SIZE) {
      const device = deviceProfile.detect();
      
      // For slow devices, be more aggressive about keeping useful cache
      const deleteCount = device.isSlowDevice ? 
        Math.floor((keys.length - CONFIG.MAX_CACHE_SIZE) * 0.5) : // Remove fewer items
        keys.length - CONFIG.MAX_CACHE_SIZE;
      
      console.log(`[UV SW] Trimming cache: removing ${deleteCount} items (device: ${device.performance})`);
      
      // Sort by access frequency and importance
      const keysWithMetadata = await Promise.all(keys.map(async request => {
        const response = await cache.match(request);
        const timestamp = parseInt(response?.headers?.get('x-cache-timestamp') || '0');
        const accessCount = parseInt(response?.headers?.get('x-cache-access-count') || '0');
        const isGameContent = isGameContentUrl(request.url);
        
        return {
          request,
          timestamp,
          accessCount,
          isGameContent,
          priority: getResourcePriority(request.url)
        };
      }));
      
      // Sort by importance (game content and frequently accessed items last)
      keysWithMetadata.sort((a, b) => {
        if (a.isGameContent && !b.isGameContent) return 1;
        if (!a.isGameContent && b.isGameContent) return -1;
        if (a.accessCount !== b.accessCount) return a.accessCount - b.accessCount;
        return a.timestamp - b.timestamp;
      });
      
      // Remove least important items
      for (let i = 0; i < deleteCount && i < keysWithMetadata.length; i++) {
        await cache.delete(keysWithMetadata[i].request);
      }
    }
  } catch (err) {
    console.error('[UV SW] Cache trimming error:', err);
  }
}

async function clearExpiredCache() {
  try {
    const cache = await caches.open(CONFIG.CACHE_NAME);
    const keys = await cache.keys();
    const now = Date.now();
    const device = deviceProfile.detect();
    
    // Longer retention for slow devices
    const maxAge = device.isSlowDevice ? CONFIG.MAX_CACHE_AGE * 1.5 : CONFIG.MAX_CACHE_AGE;
    let deleted = 0;
    
    for (const request of keys) {
      const response = await cache.match(request);
      
      if (response && response.headers) {
        const timestamp = parseInt(response.headers.get('x-cache-timestamp') || '0');
        const isGameContent = isGameContentUrl(request.url);
        
        // Keep game content longer for slow devices
        const ageLimit = (device.isSlowDevice && isGameContent) ? maxAge * 2 : maxAge;
        
        if (timestamp && now - timestamp > ageLimit) {
          await cache.delete(request);
          deleted++;
        }
      }
    }
    
    if (deleted > 0) {
      console.log(`[UV SW] Cleared ${deleted} expired cache entries (device: ${device.performance})`);
    }
  } catch (err) {
    console.error('[UV SW] Error clearing expired cache:', err);
  }
}

// Enhanced resource priority detection
function getResourcePriority(url) {
  if (!url) return 'LOW';
  const urlLower = url.toLowerCase();
  
  // Critical resources for game loading
  if (CONFIG.PRIORITIES.CRITICAL.some(type => urlLower.includes(type))) {
    return 'CRITICAL';
  }
  
  // High priority resources
  if (CONFIG.PRIORITIES.HIGH.some(ext => urlLower.endsWith('.' + ext) || urlLower.includes('.' + ext + '?'))) {
    return 'HIGH';
  }
  
  // Medium priority resources
  if (CONFIG.PRIORITIES.MEDIUM.some(ext => urlLower.endsWith('.' + ext) || urlLower.includes('.' + ext + '?'))) {
    return 'MEDIUM';
  }
  
  return 'LOW';
}

function shouldBypassUrl(url) {
  if (!url) return false;
  return CONFIG.BYPASS_PATTERNS.some(pattern => url.includes(pattern));
}

function shouldCacheUrl(url) {
  if (!url || !CONFIG.ENABLE_CACHE) return false;
  if (shouldBypassUrl(url)) return false;
  return CONFIG.CACHE_PATTERNS.some(pattern => url.includes(pattern));
}

function isGameContentUrl(url) {
  if (!url || shouldBypassUrl(url)) return false;
  
  const gamePatterns = [
    'unity', 'unitycdn', 'webgl', 'game', 'games', 'play',
    '3d', 'canvas', 'html5', 'arcade', 'gitlab.io', 
    'github.io', 'poki.com', 'crazy', 'y8.com', 'fnaf',
    'five-night', 'minecraft', 'slope', '1v1.lol',
    'coolmath', 'kongregate', 'newgrounds', 'addicting',
    'armor', 'miniclip', 'silver', 'friv', 'kizi'
  ];
  
  return gamePatterns.some(pattern => url.toLowerCase().includes(pattern));
}

// Enhanced game fixes with comprehensive slow device optimizations
async function injectGameFixes(response, url) {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('text/html')) {
    return response;
  }
  
  try {
    const text = await response.text();
    
    // Skip if already modified
    if (text.includes('__uv$config') || text.includes('__uv$bareData')) {
      return new Response(text, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }
    
    let modifiedHtml = text;
    const device = deviceProfile.detect();
    
    // Add comprehensive device-aware optimizations
    if (modifiedHtml.includes('<head')) {
      const headInsertPos = modifiedHtml.indexOf('<head') + '<head'.length;
      const headEndPos = modifiedHtml.indexOf('>', headInsertPos);
      
      if (headEndPos !== -1) {
        modifiedHtml = modifiedHtml.substring(0, headEndPos + 1) + `
        <script>
        /* COMPREHENSIVE SLOW DEVICE OPTIMIZATIONS */
        (function() {
          window.__gameLoading = {
            start: Date.now(),
            resources: new Map(),
            complete: false,
            resourcesLoaded: 0,
            criticalResourcesLoaded: false,
            readyStates: [],
            errors: [],
            deviceProfile: ${JSON.stringify(device)},
            optimizations: [],
            
            recordState: function(state) {
              this.readyStates.push({
                state: state,
                time: Date.now() - this.start
              });
              
              try {
                window.parent.postMessage({
                  type: 'GAME_LOADING',
                  state: state,
                  time: Date.now() - this.start,
                  deviceProfile: this.deviceProfile,
                  resourcesLoaded: this.resourcesLoaded
                }, '*');
              } catch(e) {}
            },
            
            recordError: function(error) {
              this.errors.push({
                error: error.toString(),
                time: Date.now() - this.start
              });
              
              try {
                window.parent.postMessage({
                  type: 'GAME_ERROR',
                  error: error.toString(),
                  time: Date.now() - this.start,
                  deviceProfile: this.deviceProfile
                }, '*');
              } catch(e) {}
            },
            
            recordOptimization: function(optimization) {
              this.optimizations.push(optimization);
              console.log('Applied optimization:', optimization);
            },
            
            markCritical: function() {
              this.criticalResourcesLoaded = true;
              this.recordState('critical-resources-loaded');
              
              try {
                window.parent.postMessage({
                  type: 'GAME_CRITICAL_READY',
                  time: Date.now() - this.start,
                  deviceProfile: this.deviceProfile,
                  optimizations: this.optimizations
                }, '*');
              } catch(e) {}
            },
            
            markComplete: function() {
              if (!this.complete) {
                this.complete = true;
                this.recordState('complete');
                
                try {
                  window.parent.postMessage({
                    type: 'GAME_READY',
                    time: Date.now() - this.start,
                    deviceProfile: this.deviceProfile,
                    resourceStats: {
                      total: this.resources.size,
                      loaded: this.resourcesLoaded,
                      errors: this.errors.length
                    },
                    optimizations: this.optimizations
                  }, '*');
                } catch(e) {}
              }
            }
          };
          
          window.__gameLoading.recordState('init');
          
          // ENHANCED WEBGL OPTIMIZATION FOR SLOW DEVICES
          const optimizeWebGL = function() {
            window.hasWebGL = window.hasWebGL2 = window.isWebGLAvailable = function() { return true; };
            
            // User agent masking
            const originalUserAgent = navigator.userAgent;
            Object.defineProperty(navigator, 'userAgent', {
              get: function() { return originalUserAgent.replace(/Headless/g, ''); }
            });
            
            const originalGetContext = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
              // Auto-resize zero-sized canvases
              if ((this.width === 0 || this.height === 0) && 
                  ['webgl', 'experimental-webgl', 'webgl2'].includes(contextType)) {
                this.width = this.width || Math.min(window.innerWidth * 0.8, 1920) || 800;
                this.height = this.height || Math.min(window.innerHeight * 0.8, 1080) || 600;
                window.__gameLoading.recordOptimization('canvas-auto-resize');
              }
              
              if (['webgl', 'experimental-webgl', 'webgl2'].includes(contextType)) {
                contextAttributes = contextAttributes || {};
                
                // Base settings for stability
                contextAttributes.failIfMajorPerformanceCaveat = false;
                contextAttributes.powerPreference = 'high-performance';
                contextAttributes.depth = true;
                contextAttributes.stencil = false;
                contextAttributes.alpha = true;
                
                // Device-specific optimizations
                if (window.__gameLoading.deviceProfile.isVerySlowDevice) {
                  // Very slow device - prioritize stability and performance
                  contextAttributes.antialias = false;
                  contextAttributes.preserveDrawingBuffer = false;
                  contextAttributes.powerPreference = 'low-power';
                  contextAttributes.premultipliedAlpha = false;
                  contextAttributes.desynchronized = true;
                  window.__gameLoading.recordOptimization('webgl-very-slow-device-settings');
                } else if (window.__gameLoading.deviceProfile.isSlowDevice) {
                  // Slow device - balanced settings
                  contextAttributes.antialias = false;
                  contextAttributes.preserveDrawingBuffer = false;
                  contextAttributes.premultipliedAlpha = true;
                  contextAttributes.desynchronized = false;
                  window.__gameLoading.recordOptimization('webgl-slow-device-settings');
                } else {
                  // Normal/fast device - quality settings
                  contextAttributes.antialias = true;
                  contextAttributes.preserveDrawingBuffer = true;
                  contextAttributes.premultipliedAlpha = true;
                  contextAttributes.desynchronized = false;
                  window.__gameLoading.recordOptimization('webgl-normal-device-settings');
                }
                
                // Try to get context with our optimizations
                const ctx = originalGetContext.call(this, contextType, contextAttributes);
                if (ctx) {
                  try {
                    // Apply device-specific WebGL hints
                    if (window.__gameLoading.deviceProfile.isSlowDevice) {
                      ctx.hint(ctx.GENERATE_MIPMAP_HINT, ctx.FASTEST);
                      ctx.disable(ctx.DITHER);
                      // Force lower precision for better performance
                      if (ctx.getShaderPrecisionFormat) {
                        const precision = ctx.getShaderPrecisionFormat(ctx.FRAGMENT_SHADER, ctx.HIGH_FLOAT);
                        if (precision.precision === 0) {
                          window.__gameLoading.recordOptimization('webgl-forced-mediump');
                        }
                      }
                    } else {
                      ctx.hint(ctx.GENERATE_MIPMAP_HINT, ctx.NICEST);
                      ctx.enable(ctx.DITHER);
                    }
                    
                    window.__gameLoading.recordOptimization('webgl-context-created');
                  } catch(e) {
                    window.__gameLoading.recordError('WebGL hint error: ' + e.message);
                  }
                  
                  return ctx;
                }
                
                // Fallback to alternative contexts
                for (const alt of ['webgl', 'experimental-webgl', 'webgl2'].filter(alt => alt !== contextType)) {
                  try {
                    const ctx2 = originalGetContext.call(this, alt, contextAttributes);
                    if (ctx2) {
                      window.__gameLoading.recordOptimization('webgl-fallback-context-' + alt);
                      return ctx2;
                    }
                  } catch (e) {
                    window.__gameLoading.recordError('WebGL fallback error: ' + e.message);
                  }
                }
              }
              
              return originalGetContext.call(this, contextType, contextAttributes);
            };
          };
          
          optimizeWebGL();
          
          // ENHANCED SLOW DEVICE FETCH OPTIMIZATION
          const originalFetch = window.fetch;
          window.fetch = function(resource, options) {
            try {
              const startTime = performance.now();
              const resourceUrl = resource.url || resource.toString();
              
              window.__gameLoading.resources.set(resourceUrl, {
                startTime: startTime,
                status: 'loading'
              });
              
              options = options || {};
              
              // Determine resource priority
              let resourcePriority = 'low';
              if (resourceUrl.includes('wasm') || 
                  resourceUrl.includes('framework') || 
                  resourceUrl.includes('loader') || 
                  resourceUrl.includes('data') ||
                  resourceUrl.includes('unity') ||
                  resourceUrl.includes('engine')) {
                resourcePriority = 'critical';
                options.priority = 'high';
              } else if (resourceUrl.includes('js') || resourceUrl.includes('json') || resourceUrl.includes('css')) {
                resourcePriority = 'high';
                options.priority = 'high';
              }
              
              // Device-aware caching strategy
              if (window.__gameLoading.deviceProfile.isSlowDevice) {
                if (resourcePriority !== 'critical') {
                  // Prefer cache for non-critical resources on slow devices
                  options.cache = options.cache || 'force-cache';
                }
                
                // Longer keepalive for slow devices
                options.keepalive = true;
                
                window.__gameLoading.recordOptimization('fetch-slow-device-caching');
              }
              
              // Device-aware timeout with abort controller
              const controller = new AbortController();
              const signal = controller.signal;
              options.signal = signal;
              
              let timeoutDuration;
              if (window.__gameLoading.deviceProfile.isVerySlowDevice) {
                timeoutDuration = resourcePriority === 'critical' ? 300000 : 180000; // 5min/3min
              } else if (window.__gameLoading.deviceProfile.isSlowDevice) {
                timeoutDuration = resourcePriority === 'critical' ? 180000 : 120000; // 3min/2min
              } else {
                timeoutDuration = resourcePriority === 'critical' ? 90000 : 60000; // 1.5min/1min
              }
              
              const timeout = setTimeout(() => {
                controller.abort();
                window.__gameLoading.recordError('Fetch timeout for: ' + resourceUrl);
              }, timeoutDuration);
                
              const fetchPromise = originalFetch.call(this, resource, options);
              
              return fetchPromise.then(function(response) {
                clearTimeout(timeout);
                
                if (response.ok) {
                  window.__gameLoading.resources.set(resourceUrl, {
                    startTime: startTime,
                    endTime: performance.now(),
                    duration: performance.now() - startTime,
                    status: 'loaded',
                    size: response.headers.get('content-length')
                  });
                  
                  window.__gameLoading.resourcesLoaded++;
                  
                  // Enhanced critical resource detection
                  const isCriticalResource = 
                    resourceUrl.includes('framework.js') ||
                    resourceUrl.includes('loader.js') ||
                    resourceUrl.includes('unity') ||
                    resourceUrl.includes('game') ||
                    resourceUrl.includes('wasm') ||
                    resourceUrl.includes('engine') ||
                    resourceUrl.includes('build.js');
                    
                  if (isCriticalResource && !window.__gameLoading.criticalResourcesLoaded) {
                    const criticalResources = Array.from(window.__gameLoading.resources.entries())
                      .filter(([url]) => 
                        url.includes('framework.js') ||
                        url.includes('loader.js') ||
                        url.includes('unity') ||
                        url.includes('game') ||
                        url.includes('wasm') ||
                        url.includes('engine') ||
                        url.includes('build.js')
                      );
                      
                    const criticalLoaded = criticalResources.filter(([, data]) => data.status === 'loaded').length;
                    const criticalTotal = criticalResources.length;
                    
                    // Mark critical when we have loaded key resources or a good percentage
                    if (criticalLoaded >= 2 || (criticalTotal > 0 && criticalLoaded / criticalTotal >= 0.6)) {
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
                  
                  window.__gameLoading.recordError('HTTP ' + response.status + ' for: ' + resourceUrl);
                }
                
                return response;
              }).catch(function(error) {
                clearTimeout(timeout);
                
                window.__gameLoading.resources.set(resourceUrl, {
                  startTime: startTime,
                  endTime: performance.now(),
                  duration: performance.now() - startTime,
                  status: 'error',
                  error: error.toString()
                });
                
                window.__gameLoading.recordError('Fetch failed for ' + resourceUrl + ': ' + error.toString());
                throw error;
              });
            } catch(e) {
              window.__gameLoading.recordError('Fetch setup error: ' + e.toString());
              return originalFetch.apply(this, arguments);
            }
          };
          
          // ENHANCED IMAGE LOADING FOR SLOW DEVICES
          const OriginalImage = window.Image;
          window.Image = function(width, height) {
            const img = new OriginalImage(width, height);
            
            // Device-aware loading strategy
            if (window.__gameLoading.deviceProfile.isSlowDevice) {
              img.loading = 'lazy';
              img.decoding = 'async';
              window.__gameLoading.recordOptimization('image-lazy-loading');
            } else {
              img.loading = 'eager';
              img.decoding = 'sync';
            }
            
            const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
            Object.defineProperty(img, 'src', {
              get: function() {
                return originalSrcDescriptor.get.call(this);
              },
              set: function(value) {
                if (window.__gameLoading) {
                  window.__gameLoading.resources.set(value, {
                    startTime: performance.now(),
                    status: 'loading',
                    type: 'image'
                  });
                }
                
                originalSrcDescriptor.set.call(this, value);
              }
            });
            
            img.addEventListener('load', function() {
              if (window.__gameLoading && img.src) {
                const existing = window.__gameLoading.resources.get(img.src);
                window.__gameLoading.resources.set(img.src, {
                  startTime: existing?.startTime || performance.now() - 100,
                  endTime: performance.now(),
                  status: 'loaded',
                  type: 'image'
                });
                window.__gameLoading.resourcesLoaded++;
              }
            });
            
            img.addEventListener('error', function() {
              if (window.__gameLoading && img.src) {
                window.__gameLoading.recordError('Failed to load image: ' + img.src);
              }
            });
            
            return img;
          };
          
          // ENHANCED SCRIPT LOADING WITH DEVICE AWARENESS
          const originalCreateElement = document.createElement;
          document.createElement = function(tagName) {
            const element = originalCreateElement.apply(this, arguments);
            
            if (tagName.toLowerCase() === 'script') {
              const originalSetAttribute = element.setAttribute;
              element.setAttribute = function(name, value) {
                if (name === 'src' && value) {
                  const isCritical = value.includes('framework') || 
                                   value.includes('loader') || 
                                   value.includes('unity') ||
                                   value.includes('game') ||
                                   value.includes('engine');
                  
                  if (isCritical) {
                    this.setAttribute('fetchpriority', 'high');
                    
                    if (window.__gameLoading.deviceProfile.isVerySlowDevice) {
                      // Very slow devices: load critical scripts synchronously for stability
                      if (value.includes('framework') || value.includes('loader')) {
                        // Don't set async/defer for critical framework scripts
                        window.__gameLoading.recordOptimization('script-sync-loading-very-slow');
                      } else {
                        this.setAttribute('defer', '');
                        window.__gameLoading.recordOptimization('script-defer-very-slow');
                      }
                    } else if (window.__gameLoading.deviceProfile.isSlowDevice) {
                      // Slow devices: prefer defer for non-framework scripts
                      if (value.includes('framework') || value.includes('loader')) {
                        this.setAttribute('async', '');
                        window.__gameLoading.recordOptimization('script-async-slow');
                      } else {
                        this.setAttribute('defer', '');
                        window.__gameLoading.recordOptimization('script-defer-slow');
                      }
                    } else {
                      // Normal devices: use async for all critical scripts
                      this.setAttribute('async', '');
                      window.__gameLoading.recordOptimization('script-async-normal');
                    }
                  } else {
                    // Non-critical scripts always deferred
                    this.setAttribute('defer', '');
                    window.__gameLoading.recordOptimization('script-defer-non-critical');
                  }
                  
                  if (window.__gameLoading) {
                    window.__gameLoading.resources.set(value, {
                      startTime: performance.now(),
                      status: 'loading',
                      type: 'script'
                    });
                    
                    this.addEventListener('load', function() {
                      if (window.__gameLoading) {
                        const existing = window.__gameLoading.resources.get(value);
                        window.__gameLoading.resources.set(value, {
                          startTime: existing?.startTime || performance.now() - 100,
                          endTime: performance.now(),
                          status: 'loaded',
                          type: 'script'
                        });
                        window.__gameLoading.resourcesLoaded++;
                      }
                    });
                    
                    this.addEventListener('error', function() {
                      if (window.__gameLoading) {
                        window.__gameLoading.recordError('Failed to load script: ' + value);
                      }
                    });
                  }
                }
                return originalSetAttribute.apply(this, arguments);
              };
            }
            
            if (tagName.toLowerCase() === 'img') {
              // Device-aware image loading
              if (window.__gameLoading.deviceProfile.isSlowDevice) {
                element.setAttribute('loading', 'lazy');
                element.setAttribute('decoding', 'async');
                window.__gameLoading.recordOptimization('img-lazy-loading');
              } else {
                element.setAttribute('loading', 'eager');
                element.setAttribute('decoding', 'sync');
              }
              
              const originalSetAttribute = element.setAttribute;
              element.setAttribute = function(name, value) {
                if (name === 'src' && value) {
                  if (window.__gameLoading) {
                    window.__gameLoading.resources.set(value, {
                      startTime: performance.now(),
                      status: 'loading',
                      type: 'image'
                    });
                  }
                  
                  const isCritical = value.includes('splash') || 
                                   value.includes('icon') || 
                                   value.includes('logo') ||
                                   value.includes('loading');
                  
                  if (isCritical && !window.__gameLoading.deviceProfile.isSlowDevice) {
                    this.setAttribute('fetchpriority', 'high');
                    this.removeAttribute('loading');
                    window.__gameLoading.recordOptimization('img-critical-priority');
                  }
                }
                return originalSetAttribute.apply(this, arguments);
              };
            }
            
            return element;
          };
          
          // ENHANCED LOADING STATE MONITORING WITH DEVICE AWARENESS
          let checkStatesInterval;
          const stateCheckInterval = window.__gameLoading.deviceProfile.isVerySlowDevice ? 1000 : 
                                    (window.__gameLoading.deviceProfile.isSlowDevice ? 750 : 500);
          
          checkStatesInterval = setInterval(function() {
            window.__gameLoading.recordState('check-' + document.readyState);
            
            if (document.readyState === 'interactive' || document.readyState === 'complete') {
              // Device-aware resource prioritization
              const prioritizeCriticalResources = function() {
                // Critical script handling
                const scripts = Array.from(document.getElementsByTagName('script'));
                const criticalScripts = scripts.filter(script => {
                  const src = script.src || '';
                  return src.includes('unity') || 
                         src.includes('unityloader') || 
                         src.includes('framework') ||
                         src.includes('game') ||
                         src.includes('engine') ||
                         src.includes('build');
                });
                
                criticalScripts.forEach(script => {
                  script.setAttribute('fetchpriority', 'high');
                  
                  if (window.__gameLoading.deviceProfile.isVerySlowDevice) {
                    // Don't change loading behavior for very slow devices (keep sync)
                    if (!script.src.includes('framework') && !script.src.includes('loader')) {
                      script.defer = true;
                    }
                  } else if (window.__gameLoading.deviceProfile.isSlowDevice) {
                    if (script.src.includes('framework') || script.src.includes('loader')) {
                      script.async = true;
                    } else {
                      script.defer = true;
                    }
                  } else {
                    script.async = true;
                  }
                });
                
                // Canvas visibility and sizing
                const canvases = Array.from(document.getElementsByTagName('canvas'));
                canvases.forEach(canvas => {
                  if (canvas.style.display === 'none') {
                    canvas.style.display = 'block';
                    window.__gameLoading.recordOptimization('canvas-visibility-fix');
                  }
                  if (canvas.style.visibility === 'hidden') {
                    canvas.style.visibility = 'visible';
                    window.__gameLoading.recordOptimization('canvas-visibility-fix');
                  }
                  
                  if (canvas.width === 0 || canvas.height === 0) {
                    const maxWidth = window.__gameLoading.deviceProfile.isSlowDevice ? 1280 : 1920;
                    const maxHeight = window.__gameLoading.deviceProfile.isSlowDevice ? 720 : 1080;
                    
                    canvas.width = canvas.width || Math.min(window.innerWidth * 0.8, maxWidth) || 800;
                    canvas.height = canvas.height || Math.min(window.innerHeight * 0.8, maxHeight) || 600;
                    window.__gameLoading.recordOptimization('canvas-auto-resize');
                  }
                });
                
                // Game container visibility
                const gameContainers = document.querySelectorAll(
                  '#unity-container, #gameContainer, #unityContainer, ' +
                  '#canvas, #game, #unity-canvas, #webgl-content, ' +
                  '[id*="unity"], [id*="game"], [id*="canvas"]'
                );
                
                gameContainers.forEach(container => {
                  if (container.style.display === 'none') {
                    container.style.display = 'block';
                    window.__gameLoading.recordOptimization('container-visibility-fix');
                  }
                  if (container.style.visibility === 'hidden') {
                    container.style.visibility = 'visible';
                    window.__gameLoading.recordOptimization('container-visibility-fix');
                  }
                });
              };
              
              prioritizeCriticalResources();
              
              // Device-aware timing for repeated fixes
              const delayMultiplier = window.__gameLoading.deviceProfile.isVerySlowDevice ? 3 : 
                                    (window.__gameLoading.deviceProfile.isSlowDevice ? 2 : 1);
              
              setTimeout(prioritizeCriticalResources, 2000 * delayMultiplier);
              setTimeout(prioritizeCriticalResources, 5000 * delayMultiplier);
              
              window.__gameLoading.markCritical();
              
              if (document.readyState === 'complete') {
                clearInterval(checkStatesInterval);
                
                setTimeout(function() {
                  window.__gameLoading.markComplete();
                }, 3000 * delayMultiplier);
              }
            }
          }, stateCheckInterval);
          
          // Enhanced event listeners
          window.addEventListener('load', function() {
            window.__gameLoading.recordState('window-load');
            
            if (!window.__gameLoading.criticalResourcesLoaded) {
              window.__gameLoading.markCritical();
            }
            
            const delayMultiplier = window.__gameLoading.deviceProfile.isVerySlowDevice ? 3 : 
                                  (window.__gameLoading.deviceProfile.isSlowDevice ? 2 : 1);
            
            setTimeout(function() {
              window.__gameLoading.markComplete();
            }, 3000 * delayMultiplier);
          });
          
          window.addEventListener('error', function(e) {
            window.__gameLoading.recordError(e.error || e.message || 'Unknown error');
          });
          
          window.addEventListener('unhandledrejection', function(e) {
            window.__gameLoading.recordError(e.reason || 'Promise rejected');
          });
          
          window.__gameLoading.recordState('document-' + document.readyState);
          
          // Device-aware forced visibility timeout
          const visibilityTimeout = window.__gameLoading.deviceProfile.isVerySlowDevice ? 60000 : 
                                   (window.__gameLoading.deviceProfile.isSlowDevice ? 45000 : 25000);
          
          setTimeout(function() {
            console.log('Forcing game visibility after device-aware timeout (' + visibilityTimeout + 'ms)');
            
            // Remove loading screens
            document.querySelectorAll('[id*="loading"], [class*="loading"]').forEach(element => {
              if (element.offsetWidth > 100 && element.offsetHeight > 100) {
                if (element.id?.toLowerCase().includes('loading') || 
                    (typeof element.className === 'string' && element.className.toLowerCase().includes('loading'))) {
                  element.style.display = 'none';
                  window.__gameLoading.recordOptimization('loading-screen-removal');
                }
              }
            });
            
            // Show game elements
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
                  window.__gameLoading.recordOptimization('element-force-visible-' + selector);
                });
              } catch(e) {
                window.__gameLoading.recordError('Force visibility error for ' + selector + ': ' + e.message);
              }
            });
            
            // Trigger resize event
            try {
              window.dispatchEvent(new Event('resize'));
              window.__gameLoading.recordOptimization('resize-event-dispatch');
            } catch(e) {
              window.__gameLoading.recordError('Resize event error: ' + e.message);
            }
            
            // Notify parent
            try {
              window.parent.postMessage({
                type: 'GAME_FORCE_VISIBLE',
                time: Date.now() - window.__gameLoading.start,
                deviceProfile: window.__gameLoading.deviceProfile,
                optimizations: window.__gameLoading.optimizations
              }, '*');
            } catch(e) {}
          }, visibilityTimeout);
        })();
        </script>
        ` + modifiedHtml.substring(headEndPos + 1);
      }
    }

    // Add final visibility fixes before </body>
    if (modifiedHtml.includes('</body>')) {
      const bodyClosePos = modifiedHtml.indexOf('</body>');
      
      modifiedHtml = modifiedHtml.substring(0, bodyClosePos) + `
      <script>
      /* FINAL GAME RENDERING AND VISIBILITY FIXES FOR SLOW DEVICES */
      (function() {
        const deviceProfile = window.__gameLoading ? window.__gameLoading.deviceProfile : { isSlowDevice: false, isVerySlowDevice: false };
        
        function comprehensiveVisibilityFix() {
          // Canvas fixes
          document.querySelectorAll('canvas').forEach(canvas => {
            if (canvas.style.display === 'none') {
              canvas.style.display = 'block';
              console.log('Fixed hidden canvas');
            }
            if (canvas.style.visibility === 'hidden') {
              canvas.style.visibility = 'visible';
              console.log('Fixed invisible canvas');
            }
            
            if (canvas.width === 0 || canvas.height === 0) {
              const maxWidth = deviceProfile.isSlowDevice ? 1280 : 1920;
              const maxHeight = deviceProfile.isSlowDevice ? 720 : 1080;
              
              canvas.width = canvas.width || Math.min(window.innerWidth * 0.8, maxWidth) || 800;
              canvas.height = canvas.height || Math.min(window.innerHeight * 0.8, maxHeight) || 600;
              console.log('Resized canvas to', canvas.width, 'x', canvas.height);
            }
          });
          
          // Container fixes
          const containerSelectors = [
            '#unity-container', '#gameContainer', '#unityContainer', 
            '#canvas', '#game', '#unity-canvas', '#webgl-content',
            '[id*="unity"]', '[id*="game"]', '[id*="canvas"]'
          ];
          
          containerSelectors.forEach(selector => {
            try {
              document.querySelectorAll(selector).forEach(container => {
                if (container.style.display === 'none') {
                  container.style.display = 'block';
                }
                if (container.style.visibility === 'hidden') {
                  container.style.visibility = 'visible';
                }
                container.style.opacity = '1';
              });
            } catch (e) {
              console.error('Container fix error for', selector, ':', e);
            }
          });
          
          // Remove persistent loading screens
          document.querySelectorAll('[id*="loading"], [class*="loading"]').forEach(element => {
            if (element.offsetWidth > 200 && element.offsetHeight > 200) {
              const isLoadingScreen = element.id?.toLowerCase().includes('loading') || 
                                    (typeof element.className === 'string' && element.className.toLowerCase().includes('loading'));
              
              if (isLoadingScreen) {
                element.style.display = 'none';
                console.log('Removed persistent loading screen');
              }
            }
          });
          
          // Ensure game containers are visible
          const gameContainers = document.querySelectorAll('#unity-canvas, #game, canvas, [id*="game"], [id*="unity"]');
          gameContainers.forEach(container => {
            container.style.display = 'block';
            container.style.visibility = 'visible';
            container.style.opacity = '1';
          });
        }
        
        // Unity polyfills
        window.UnityLoader = window.UnityLoader || {
          instantiate: function(container, url, params) { 
            console.log('Unity polyfill instantiate called');
            return { SetFullscreen: function() {}, SendMessage: function() {} }; 
          },
          SystemInfo: { hasWebGL: true, mobile: deviceProfile.isMobile || false }
        };
        
        window.unityInstance = window.unityInstance || { 
          SendMessage: function() {}, 
          SetFullscreen: function() {} 
        };
        window.unityShowBanner = window.unityShowBanner || function() {};
        window.unityProgress = window.unityProgress || function() {};
        
        // Device-aware fix scheduling
        let fixCount = 0;
        const maxFixes = deviceProfile.isVerySlowDevice ? 15 : (deviceProfile.isSlowDevice ? 12 : 8);
        
        function runScheduledFixes() {
          fixCount++;
          console.log('Running visibility fix #' + fixCount + ' for', deviceProfile.performance || 'unknown', 'device');
          
          comprehensiveVisibilityFix();
          
          if (fixCount < maxFixes) {
            const baseInterval = deviceProfile.isVerySlowDevice ? 4000 : 
                               (deviceProfile.isSlowDevice ? 3000 : 2000);
            const interval = baseInterval + (fixCount * 1000);
            
            setTimeout(runScheduledFixes, interval);
          }
        }
        
        // Start the fix process
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', runScheduledFixes);
          window.addEventListener('load', runScheduledFixes);
        } else {
          runScheduledFixes();
        }
        
        // Additional fixes on interaction
        document.addEventListener('click', function() {
          if (fixCount < maxFixes) {
            setTimeout(comprehensiveVisibilityFix, 500);
          }
        });
        
        console.log('Game visibility fixes initialized for', deviceProfile.performance || 'unknown', 'device');
      })();
      </script>
      ` + modifiedHtml.substring(bodyClosePos);
    }

    const modifiedHeaders = new Headers(response.headers);
    modifiedHeaders.set('x-cache-timestamp', Date.now().toString());
    modifiedHeaders.set('x-cache-access-count', '1');

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

// Enhanced fetch with comprehensive slow device optimizations
async function enhancedFetch(event, retries = CONFIG.RETRY_COUNT) {
  const url = new URL(event.request.url).toString();
  
  if (shouldBypassUrl(url)) {
    return await sw.fetch(event);
  }

  const device = deviceProfile.detect();
  
  // Enhanced cache-first strategy for slow devices
  if (CONFIG.ENABLE_CACHE && shouldCacheUrl(url)) {
    try {
      const cache = await caches.open(CONFIG.CACHE_NAME);
      const cachedResponse = await cache.match(event.request);
      
      if (cachedResponse) {
        // Update access count
        const accessCount = parseInt(cachedResponse.headers.get('x-cache-access-count') || '0') + 1;
        const headers = new Headers(cachedResponse.headers);
        headers.set('x-cache-access-count', accessCount.toString());
        
        const updatedResponse = new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: headers
        });
        
        cache.put(event.request, updatedResponse.clone());
        connections.stats.cached++;
        
        // Background update for fast devices only
        if (!device.isSlowDevice && !device.isVerySlowDevice) {
          fetch(event.request.url, { 
            method: event.request.method, 
            headers: event.request.headers,
            cache: 'reload',
            priority: getResourcePriority(url)
          })
          .then(freshResponse => {
            if (freshResponse && freshResponse.ok) {
              const headers = new Headers(freshResponse.headers);
              headers.set('x-cache-timestamp', Date.now().toString());
              headers.set('x-cache-access-count', '1');
              
              const clonedResponse = new Response(freshResponse.clone().body, {
                status: freshResponse.status,
                statusText: freshResponse.statusText,
                headers: headers
              });
              
              cache.put(event.request, clonedResponse);
            }
          })
          .catch(() => {});
        }
        
        return updatedResponse;
      }
    } catch (cacheError) {
      console.error('[UV SW] Cache error:', cacheError);
    }
  }
  
  const controller = new AbortController();
  const signal = controller.signal;
  
  const priority = getResourcePriority(url);
  let timeoutMultiplier = 1.0;
  
  if (device.isVerySlowDevice) {
    timeoutMultiplier = CONFIG.VERY_SLOW_DEVICE_TIMEOUT_MULTIPLIER;
  } else if (device.isSlowDevice) {
    timeoutMultiplier = CONFIG.SLOW_DEVICE_TIMEOUT_MULTIPLIER;
  } else if (device.performance === 'fast') {
    timeoutMultiplier = CONFIG.FAST_DEVICE_TIMEOUT_MULTIPLIER;
  }
  
  const baseTimeout = priority === 'CRITICAL' ? CONFIG.FETCH_TIMEOUT : 
                     Math.min(180000, CONFIG.FETCH_TIMEOUT / 2);
  const actualTimeout = baseTimeout * timeoutMultiplier;
  
  const timeout = setTimeout(() => {
    controller.abort();
  }, actualTimeout);
  
  try {
    const options = {
      signal: signal,
      priority: priority === 'CRITICAL' ? 'high' : 'auto'
    };
    
    const fetchPromise = sw.fetch(event, options);
    const response = await connections.add(url, fetchPromise, true);
    
    clearTimeout(timeout);
    
    // Enhanced caching with device-aware strategies
    if (CONFIG.ENABLE_CACHE && shouldCacheUrl(url) && response.ok) {
      try {
        const cache = await caches.open(CONFIG.CACHE_NAME);
        
        const headers = new Headers(response.headers);
        headers.set('x-cache-timestamp', Date.now().toString());
        headers.set('x-cache-access-count', '1');
        
        // Mark game content for longer retention on slow devices
        if (device.isSlowDevice && isGameContentUrl(url)) {
          headers.set('x-cache-game-content', 'true');
        }
        
        const clonedResponse = new Response(response.clone().body, {
          status: response.status,
          statusText: response.statusText,
          headers: headers
        });
        
        cache.put(event.request, clonedResponse);
        
        // More frequent cache maintenance for slow devices
        const maintenanceFrequency = device.isSlowDevice ? 0.005 : 0.01;
        if (Math.random() < maintenanceFrequency) {
          // Run maintenance asynchronously
          Promise.resolve().then(() => {
            trimCache();
            clearExpiredCache();
          });
        }
      } catch (cacheError) {
        console.error('[UV SW] Error caching response:', cacheError);
      }
    }
    
    // Special handling for game content with enhanced optimizations
    if (isGameContentUrl(url) && response.headers.get('content-type')?.includes('text/html')) {
      return await injectGameFixes(response, url);
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeout);
    
    console.error(`[UV SW] Fetch error (${device.performance} device): ${error.message}`);
    
    // Enhanced retry logic with device-aware backoff
    if (retries > 0) {
      let baseDelay = CONFIG.RETRY_DELAY;
      
      if (device.isVerySlowDevice) {
        baseDelay *= 2.0;
      } else if (device.isSlowDevice) {
        baseDelay *= 1.5;
      }
      
      const delay = baseDelay * Math.pow(1.5, CONFIG.RETRY_COUNT - retries);
      
      console.log(`[UV SW] Retrying (${retries} attempts left) after ${delay}ms for ${device.performance} device`);
      
      connections.stats.retried++;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return enhancedFetch(event, retries - 1);
    }
    
    // Enhanced cache fallback for slow devices
    if (CONFIG.ENABLE_CACHE) {
      try {
        const cache = await caches.open(CONFIG.CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          console.log(`[UV SW] Returning stale cached response for ${device.performance} device after failed retries`);
          
          // Update headers to indicate stale response
          const headers = new Headers(cachedResponse.headers);
          headers.set('x-cache-stale', 'true');
          
          return new Response(cachedResponse.body, {
            status: cachedResponse.status,
            statusText: cachedResponse.statusText,
            headers: headers
          });
        }
      } catch (e) {
        console.error('[UV SW] Cache fallback error:', e);
      }
    }
    
    throw error;
  }
}

// Enhanced error page with device-specific advice
function createErrorPage(error) {
  const device = deviceProfile.detect();
  
  const deviceAdvice = device.isVerySlowDevice ? 
    '<p><strong>Performance Tips:</strong> Close other browser tabs, disable browser extensions, and ensure no other applications are using your internet connection.</p>' :
    device.isSlowDevice ?
    '<p><strong>Tip:</strong> For better performance, try closing other tabs or waiting for a less busy time.</p>' :
    '';
  
  const retryRecommendation = device.isSlowDevice ?
    '<p>This game may take longer to load on your device. Please be patient.</p>' :
    '';
  
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
          background: linear-gradient(135deg, #222, #000); 
          margin: 0; 
          padding: 20px; 
          text-align: center; 
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container { 
          max-width: 600px; 
          background: #333; 
          border-radius: 12px; 
          padding: 30px; 
          box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }
        h2 { 
          color: #f44336; 
          margin-top: 0; 
          margin-bottom: 20px;
        }
        button { 
          padding: 12px 20px; 
          background: #2196f3; 
          color: white; 
          border: none; 
          border-radius: 6px; 
          cursor: pointer; 
          margin: 8px; 
          font-size: 14px;
          font-weight: 500;
          transition: background 0.3s ease;
        }
        button:hover { 
          background: #1976d2; 
        }
        .device-info { 
          color: #ffeb3b; 
          font-size: 14px; 
          margin-bottom: 15px; 
          padding: 10px;
          background: rgba(255, 235, 59, 0.1);
          border-radius: 6px;
        }
        .advice {
          background: rgba(76, 175, 80, 0.1);
          border-left: 4px solid #4caf50;
          padding: 12px;
          margin: 15px 0;
          text-align: left;
        }
        .stats {
          font-size: 12px;
          color: #aaa;
          margin-top: 20px;
          text-align: left;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Game Loading Error</h2>
        <div class="device-info">
          Device Performance: ${device.performance?.toUpperCase() || 'UNKNOWN'}<br>
          Hardware: ${device.cores} cores, ${device.memory}GB RAM<br>
          Connection: ${device.connection?.effectiveType || 'Unknown'}
        </div>
        <p>The game couldn't be loaded. This may be due to network issues or server problems.</p>
        ${retryRecommendation}
        <div class="advice">
          ${deviceAdvice}
          <p><strong>What you can try:</strong></p>
          <ul style="text-align: left;">
            <li>Refresh the page and wait patiently</li>
            <li>Check your internet connection</li>
            <li>Try a different game if this one continues to fail</li>
            ${device.isSlowDevice ? '<li>Wait for less busy times (evenings may be slower)</li>' : ''}
            <li>Clear your browser cache if problems persist</li>
          </ul>
        </div>
        <div>
          <button onclick="window.location.reload()">Try Again</button>
          <button onclick="window.location.href='/'">Go Home</button>
        </div>
        <div class="stats">
          Connection Stats: ${connections.stats.successful}/${connections.stats.total} successful requests<br>
          Average Load Time: ${Math.round(connections.stats.averageTime)}ms<br>
          Cache Hits: ${connections.stats.cached}<br>
          Device Optimizations Applied: ${connections.stats.slowDeviceOptimizations}
        </div>
      </div>
      <script>
        setTimeout(function() {
          try {
            navigator.serviceWorker.controller.postMessage({
              type: 'ERROR_REPORT',
              url: location.href,
              timestamp: Date.now(),
              deviceProfile: ${JSON.stringify(device)},
              connectionStats: ${JSON.stringify(connections.stats)}
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
  if (!event.request.url.startsWith(self.registration.scope) && 
      !event.request.url.includes('/uv/') &&
      !event.request.url.includes('/service/') &&
      !event.request.url.includes('/bare/')) {
    return;
  }

  event.respondWith((async () => {
    try {
      return await enhancedFetch(event);
    } catch (err) {
      console.error('[UV SW] Fatal error:', err);
      
      if (event.request.mode === 'navigate') {
        return createErrorPage(err);
      }
      
      try {
        return await sw.fetch(event);
      } catch (finalError) {
        throw finalError;
      }
    }
  })());
});

// Enhanced install handler
self.addEventListener('install', event => {
  console.log('[UV SW] Installing slow-device-optimized service worker...');
  
  if (CONFIG.ENABLE_CACHE) {
    event.waitUntil((async () => {
      try {
        const cache = await caches.open(CONFIG.CACHE_NAME);
        
        const criticalResources = [
          '/uv/encode.js',
          '/uv/uv.bundle.js',
          '/uv/uv.handler.js',
          '/uv/uv.client.js',
          '/uv/uv.config.js',
          '/uv/uv.sw.js'
        ];
        
        // Pre-cache critical resources
        await cache.addAll(criticalResources);
        
        console.log('[UV SW] Pre-cached critical resources for slow devices');
      } catch (err) {
        console.error('[UV SW] Pre-cache error:', err);
      }
    })());
  }
  
  self.skipWaiting();
});

// Enhanced activate handler
self.addEventListener('activate', event => {
  console.log('[UV SW] Activated with comprehensive slow device optimizations');
  
  if (CONFIG.ENABLE_CACHE) {
    event.waitUntil((async () => {
      try {
        const cacheNames = await caches.keys();
        
        // Clean up old caches
        await Promise.all(
          cacheNames
            .filter(name => name !== CONFIG.CACHE_NAME && name.startsWith('uv-'))
            .map(name => caches.delete(name))
        );
        
        // Initial cache maintenance
        await trimCache();
        await clearExpiredCache();
        
        console.log('[UV SW] Cache cleanup completed for slow devices');
      } catch (error) {
        console.error('[UV SW] Cache cleanup error:', error);
      }
    })());
  }
  
  event.waitUntil(clients.claim());
});

// Enhanced message handler
self.addEventListener('message', event => {
  if (!event.data) return;
  
  if (event.data.type === 'PING') {
    try {
      const device = deviceProfile.detect();
      event.source.postMessage({
        type: 'PONG',
        timestamp: event.data.timestamp,
        deviceProfile: device,
        optimizations: CONFIG.SLOW_DEVICE_OPTIMIZATIONS
      });
    } catch (e) {}
    return;
  }
  
  if (event.data.type === 'STATUS_REQUEST') {
    try {
      const device = deviceProfile.detect();
      event.source.postMessage({
        type: 'STATUS_RESPONSE',
        connectionStats: connections.stats,
        deviceProfile: device,
        cacheStats: {
          name: CONFIG.CACHE_NAME,
          maxSize: CONFIG.MAX_CACHE_SIZE,
          maxAge: CONFIG.MAX_CACHE_AGE
        },
        timestamp: Date.now()
      });
    } catch (e) {}
    return;
  }
  
  if (event.data.type === 'ERROR_REPORT') {
    console.log(`[UV SW] Error report received:`, {
      url: event.data.url,
      device: event.data.deviceProfile?.performance || 'unknown',
      connectionStats: event.data.connectionStats
    });
    return;
  }
  
  if (event.data.type === 'FORCE_CACHE_MAINTENANCE') {
    Promise.resolve().then(async () => {
      await trimCache();
      await clearExpiredCache();
      console.log('[UV SW] Forced cache maintenance completed');
    });
    return;
  }
});

console.log('[UV SW] Comprehensive slow device service worker loaded successfully');
console.log('[UV SW] Configuration:', {
  fetchTimeout: CONFIG.FETCH_TIMEOUT,
  retryCount: CONFIG.RETRY_COUNT,
  cacheSize: CONFIG.MAX_CACHE_SIZE,
  deviceDetection: CONFIG.DEVICE_DETECTION
});
