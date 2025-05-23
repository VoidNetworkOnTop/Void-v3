/*global UVServiceWorker,__uv$config*/
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts('encode.js'); // Load enhanced encoder
importScripts(__uv$config.sw || 'uv.sw.js');

const sw = new UVServiceWorker();

// Enhanced configuration for all device types
const CONFIG = {
  FETCH_TIMEOUT: 300000,      // 5 minutes for slow devices
  RETRY_COUNT: 8,             // More retries
  RETRY_DELAY: 600,           // Faster initial retry
  ENABLE_CACHE: true,
  CACHE_NAME: 'uv-adaptive-cache',
  MAX_CACHE_SIZE: 1000,       // Larger cache
  MAX_CACHE_AGE: 3600000 * 96, // 4 days
  PREFETCH_DEPENDENCIES: true,
  AGGRESSIVE_CACHING: true,
  
  // Device-aware settings
  DEVICE_DETECTION: true,
  SLOW_DEVICE_TIMEOUT_MULTIPLIER: 2.5,
  FAST_DEVICE_TIMEOUT_MULTIPLIER: 0.7,
  
  CACHE_PATTERNS: [
    '.js', '.css', '.woff', '.woff2', '.ttf', '.png', '.jpg', '.jpeg', '.gif', '.svg',
    'unity', 'webgl', 'game', '/assets/', '/static/', '.data', '.wasm', '.mem', 
    'jsdelivr', 'cloudfront', 'akamai', 'cdn', '.unityweb', '.unity3d'
  ],
  
  BYPASS_PATTERNS: [
    '/bare/',
    '/uv/service/',
    '/service/'
  ],
  
  PRIORITY_DOMAINS: [
    'unity.com', 'unitycdn', 'unity3d', 'jsdelivr.net', 
    'cloudfront.net', 'amazonaws.com', 'googleusercontent.com',
    'poki.com', 'y8.com', 'crazygames.com'
  ],
  
  MAX_CONCURRENT_CONNECTIONS: 300,
  CONNECTION_TIMEOUT: 60000,
  
  PRIORITIES: {
    CRITICAL: ['wasm', 'unity', 'data', 'framework', 'loader', 'bundle', 'unityweb'],
    HIGH: ['js', 'json', 'css'],
    MEDIUM: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'woff'],
    LOW: ['wav', 'mp3', 'ogg']
  }
};

// Device detection
const deviceProfile = {
  performance: 'medium',
  isSlowDevice: false,
  detected: false
};

// Enhanced connection tracking
const connections = {
  active: new Map(),
  pending: new Set(),
  completed: new Set(),
  stats: {
    total: 0,
    successful: 0,
    failed: 0,
    retried: 0,
    averageTime: 0,
    deviceAdjustedTimeouts: 0
  },
  
  add(url, promise, deviceAware = true) {
    this.pending.add(url);
    const startTime = Date.now();
    this.stats.total++;
    
    // Apply device-aware timeout adjustments
    if (deviceAware && deviceProfile.detected) {
      const timeoutMultiplier = deviceProfile.isSlowDevice ? 
        CONFIG.SLOW_DEVICE_TIMEOUT_MULTIPLIER : 
        CONFIG.FAST_DEVICE_TIMEOUT_MULTIPLIER;
      
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
      
      setTimeout(() => {
        this.completed.delete(url);
      }, 15000);
    });
    
    this.active.set(url, {
      timestamp: startTime,
      promise,
      deviceAware
    });
    
    this.cleanup();
    return promise;
  },
  
  cleanup() {
    const now = Date.now();
    const timeout = deviceProfile.isSlowDevice ? 
      CONFIG.CONNECTION_TIMEOUT * 1.5 : 
      CONFIG.CONNECTION_TIMEOUT;
    
    for (const [url, data] of this.active.entries()) {
      if (now - data.timestamp > timeout) {
        this.active.delete(url);
      }
    }
    
    if (this.active.size > CONFIG.MAX_CONCURRENT_CONNECTIONS) {
      const connections = Array.from(this.active.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .filter(([url]) => {
          return !CONFIG.PRIORITIES.CRITICAL.some(type => url.includes(type)) && 
                 !this.pending.has(url);
        });
      
      const removeCount = this.active.size - CONFIG.MAX_CONCURRENT_CONNECTIONS;
      const toRemove = connections.slice(0, removeCount);
      
      for (const [url] of toRemove) {
        this.active.delete(url);
      }
    }
  }
};

// Device detection function
function detectDevice() {
  if (deviceProfile.detected) return deviceProfile;
  
  try {
    const cores = navigator.hardwareConcurrency || 2;
    const memory = navigator.deviceMemory || 2;
    const connection = navigator.connection;
    
    const isSlowConnection = connection && 
      (connection.effectiveType === 'slow-2g' || 
       connection.effectiveType === '2g' || 
       connection.downlink < 2);
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Performance benchmark
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      Math.random();
    }
    const duration = performance.now() - start;
    const isSlowProcessor = duration > 8;
    
    deviceProfile.isSlowDevice = cores < 3 || memory < 3 || isSlowConnection || (isMobile && isSlowProcessor);
    deviceProfile.performance = deviceProfile.isSlowDevice ? 'low' : (cores >= 6 && memory >= 8 ? 'high' : 'medium');
    deviceProfile.detected = true;
    
    console.log('[UV SW] Device detected:', deviceProfile);
  } catch (e) {
    deviceProfile.isSlowDevice = false;
    deviceProfile.performance = 'medium';
    deviceProfile.detected = true;
  }
  
  return deviceProfile;
}

// Enhanced cache management
async function trimCache() {
  try {
    const cache = await caches.open(CONFIG.CACHE_NAME);
    const keys = await cache.keys();
    
    if (keys.length > CONFIG.MAX_CACHE_SIZE) {
      const deleteCount = keys.length - CONFIG.MAX_CACHE_SIZE;
      console.log(`[UV SW] Trimming cache: removing ${deleteCount} items`);
      
      for (let i = 0; i < deleteCount; i++) {
        await cache.delete(keys[i]);
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
    let deleted = 0;
    
    for (const request of keys) {
      const response = await cache.match(request);
      
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

// Get resource priority with device awareness
function getResourcePriority(url) {
 if (!url) return 'LOW';
 const urlLower = url.toLowerCase();
 
 if (CONFIG.PRIORITIES.CRITICAL.some(type => urlLower.includes(type))) {
   return 'CRITICAL';
 }
 
 if (CONFIG.PRIORITIES.HIGH.some(ext => urlLower.endsWith('.' + ext))) {
   return 'HIGH';
 }
 
 if (CONFIG.PRIORITIES.MEDIUM.some(ext => urlLower.endsWith('.' + ext))) {
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

function isGameContent(url) {
 if (!url || shouldBypassUrl(url)) return false;
 
 const gamePatterns = [
   'unity', 'unitycdn', 'webgl', 'game', 'games', 'play',
   '3d', 'canvas', 'html5', 'arcade', 'gitlab.io', 
   'github.io', 'poki.com', 'crazy', 'y8.com', 'fnaf',
   'five-night', 'minecraft', 'slope', '1v1.lol'
 ];
 
 return gamePatterns.some(pattern => url.toLowerCase().includes(pattern));
}

// Enhanced game fixes with device awareness
async function injectGameFixes(response, url) {
 const contentType = response.headers.get('content-type');
 if (!contentType || !contentType.includes('text/html')) {
   return response;
 }
 
 try {
   const text = await response.text();
   
   if (text.includes('__uv$config') || text.includes('__uv$bareData')) {
     return new Response(text, {
       status: response.status,
       statusText: response.statusText,
       headers: response.headers
     });
   }
   
   let modifiedHtml = text;
   const device = detectDevice();
   
   // Add device-aware optimizations
   if (modifiedHtml.includes('<head')) {
     const headInsertPos = modifiedHtml.indexOf('<head') + '<head'.length;
     const headEndPos = modifiedHtml.indexOf('>', headInsertPos);
     
     if (headEndPos !== -1) {
       modifiedHtml = modifiedHtml.substring(0, headEndPos + 1) + `
       <script>
       /* Device-Aware Game Loading Optimizations */
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
                 deviceProfile: this.deviceProfile
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
           
           markCritical: function() {
             this.criticalResourcesLoaded = true;
             this.recordState('critical-resources-loaded');
             
             try {
               window.parent.postMessage({
                 type: 'GAME_CRITICAL_READY',
                 time: Date.now() - this.start,
                 deviceProfile: this.deviceProfile
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
                   }
                 }, '*');
               } catch(e) {}
             }
           }
         };
         
         window.__gameLoading.recordState('init');

         // Device-aware WebGL optimization
         const optimizeWebGL = function() {
           window.hasWebGL = window.hasWebGL2 = window.isWebGLAvailable = function() { return true; };
           
           const originalUserAgent = navigator.userAgent;
           Object.defineProperty(navigator, 'userAgent', {
             get: function() { return originalUserAgent.replace(/Headless/g, ''); }
           });
           
           const originalGetContext = HTMLCanvasElement.prototype.getContext;
           HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
             if ((this.width === 0 || this.height === 0) && 
                 ['webgl', 'experimental-webgl', 'webgl2'].includes(contextType)) {
               this.width = this.width || window.innerWidth * 0.8 || 800;
               this.height = this.height || window.innerHeight * 0.8 || 600;
             }
             
             if (['webgl', 'experimental-webgl', 'webgl2'].includes(contextType)) {
               contextAttributes = contextAttributes || {};
               contextAttributes.failIfMajorPerformanceCaveat = false;
               contextAttributes.powerPreference = 'high-performance';
               
               // Device-specific settings
               if (window.__gameLoading.deviceProfile.isSlowDevice) {
                 contextAttributes.antialias = false;
                 contextAttributes.preserveDrawingBuffer = false;
                 contextAttributes.precision = 'mediump';
               } else {
                 contextAttributes.antialias = true;
                 contextAttributes.preserveDrawingBuffer = true;
                 contextAttributes.precision = 'highp';
               }
               
               contextAttributes.depth = true;
               contextAttributes.stencil = false;
               contextAttributes.alpha = true;
               
               const ctx = originalGetContext.call(this, contextType, contextAttributes);
               if (ctx) {
                 try {
                   if (window.__gameLoading.deviceProfile.isSlowDevice) {
                     ctx.hint(ctx.GENERATE_MIPMAP_HINT, ctx.FASTEST);
                     ctx.disable(ctx.DITHER);
                   } else {
                     ctx.hint(ctx.GENERATE_MIPMAP_HINT, ctx.NICEST);
                     ctx.enable(ctx.DITHER);
                   }
                 } catch(e) {}
                 
                 return ctx;
               }
               
               for (const alt of ['webgl', 'experimental-webgl', 'webgl2'].filter(alt => alt !== contextType)) {
                 try {
                   const ctx2 = originalGetContext.call(this, alt, contextAttributes);
                   if (ctx2) return ctx2;
                 } catch (e) {}
               }
             }
             
             return originalGetContext.call(this, contextType, contextAttributes);
           };
         };
         
         optimizeWebGL();
         
         // Device-aware fetch optimization
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
             
             let resourcePriority = 'low';
             if (resourceUrl.includes('wasm') || 
                 resourceUrl.includes('framework') || 
                 resourceUrl.includes('loader') || 
                 resourceUrl.includes('data') ||
                 resourceUrl.includes('unity')) {
               resourcePriority = 'high';
               options.priority = 'high';
             }
             
             if (resourcePriority !== 'high') {
               options.cache = options.cache || 'force-cache';
             }
             
             // Device-aware timeout
             const controller = new AbortController();
             const signal = controller.signal;
             options.signal = signal;
             
             const timeoutDuration = window.__gameLoading.deviceProfile.isSlowDevice ? 
               (resourcePriority === 'high' ? 120000 : 60000) :
               (resourcePriority === 'high' ? 60000 : 30000);
             
             const timeout = setTimeout(() => {
               controller.abort();
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
                 
                 const isCriticalResource = 
                   resourceUrl.includes('framework.js') ||
                   resourceUrl.includes('loader.js') ||
                   resourceUrl.includes('unity') ||
                   resourceUrl.includes('game') ||
                   resourceUrl.includes('wasm');
                   
                 if (isCriticalResource && !window.__gameLoading.criticalResourcesLoaded) {
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
                   
                   if (criticalLoaded >= 2 || (criticalTotal > 0 && criticalLoaded / criticalTotal >= 0.7)) {
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
             return originalFetch.apply(this, arguments);
           }
         };
         
         // Device-aware image loading
         const OriginalImage = window.Image;
         window.Image = function(width, height) {
           const img = new OriginalImage(width, height);
           
           img.loading = window.__gameLoading.deviceProfile.isSlowDevice ? 'lazy' : 'eager';
           
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
         
         // Device-aware script loading
         const originalCreateElement = document.createElement;
         document.createElement = function(tagName) {
           const element = originalCreateElement.apply(this, arguments);
           
           if (tagName.toLowerCase() === 'script') {
             const originalSetAttribute = element.setAttribute;
             element.setAttribute = function(name, value) {
               if (name === 'src' && value) {
                 if (value.includes('framework') || 
                     value.includes('loader') || 
                     value.includes('unity') ||
                     value.includes('game')) {
                   this.setAttribute('fetchpriority', 'high');
                   
                   if (window.__gameLoading.deviceProfile.isSlowDevice) {
                     if (!value.includes('framework') && !value.includes('loader')) {
                       this.setAttribute('defer', '');
                     } else {
                       this.setAttribute('async', '');
                     }
                   } else {
                     this.setAttribute('async', '');
                   }
                   
                   if (window.__gameLoading) {
                     window.__gameLoading.resources.set(value, {
                       startTime: performance.now(),
                       status: 'loading',
                       type: 'script'
                     });
                     
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
                   this.setAttribute('defer', '');
                 }
               }
               return originalSetAttribute.apply(this, arguments);
             };
           }
           
           if (tagName.toLowerCase() === 'img') {
             element.setAttribute('loading', window.__gameLoading.deviceProfile.isSlowDevice ? 'lazy' : 'eager');
             
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
                                   value.includes('logo');
                 
                 if (isCritical && !window.__gameLoading.deviceProfile.isSlowDevice) {
                   this.setAttribute('fetchpriority', 'high');
                   this.removeAttribute('loading');
                 }
               }
               return originalSetAttribute.apply(this, arguments);
             };
           }
           
           return element;
         };
         
         // Monitor loading states with device-aware intervals
         const stateCheckInterval = window.__gameLoading.deviceProfile.isSlowDevice ? 500 : 200;
         let checkStatesInterval = setInterval(function() {
           window.__gameLoading.recordState('check-' + document.readyState);
           
           if (document.readyState === 'interactive' || document.readyState === 'complete') {
             // Priority handling based on device
             const prioritizeCriticalResources = function() {
               const scripts = Array.from(document.getElementsByTagName('script'));
               const criticalScripts = scripts.filter(script => {
                 const src = script.src || '';
                 return src.includes('unity') || 
                        src.includes('unityloader') || 
                        src.includes('framework') ||
                        src.includes('game') ||
                        src.includes('engine');
               });
               
               criticalScripts.forEach(script => {
                 script.setAttribute('fetchpriority', 'high');
                 if (window.__gameLoading.deviceProfile.isSlowDevice) {
                   if (script.src.includes('framework') || script.src.includes('loader')) {
                     script.async = true;
                   } else {
                     script.defer = true;
                   }
                 } else {
                   script.async = true;
                 }
               });
               
               const canvases = Array.from(document.getElementsByTagName('canvas'));
               canvases.forEach(canvas => {
                 if (canvas.style.display === 'none') canvas.style.display = 'block';
                 if (canvas.style.visibility === 'hidden') canvas.style.visibility = 'visible';
                 
                 if (canvas.width === 0 || canvas.height === 0) {
                   canvas.width = canvas.width || window.innerWidth * 0.8 || 800;
                   canvas.height = canvas.height || window.innerHeight * 0.8 || 600;
                 }
               });
               
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
             
             prioritizeCriticalResources();
             
             const delayMultiplier = window.__gameLoading.deviceProfile.isSlowDevice ? 2 : 1;
             setTimeout(prioritizeCriticalResources, 1000 * delayMultiplier);
             setTimeout(prioritizeCriticalResources, 3000 * delayMultiplier);
             
             window.__gameLoading.markCritical();
             
             if (document.readyState === 'complete') {
               clearInterval(checkStatesInterval);
               
               setTimeout(function() {
                 window.__gameLoading.markComplete();
               }, 2000 * delayMultiplier);
             }
           }
         }, stateCheckInterval);
         
         window.addEventListener('load', function() {
           window.__gameLoading.recordState('window-load');
           
           if (!window.__gameLoading.criticalResourcesLoaded) {
             window.__gameLoading.markCritical();
           }
           
           const delayMultiplier = window.__gameLoading.deviceProfile.isSlowDevice ? 2 : 1;
           setTimeout(function() {
             window.__gameLoading.markComplete();
           }, 2000 * delayMultiplier);
         });
         
         window.addEventListener('error', function(e) {
           window.__gameLoading.recordError(e.error || e.message);
         });
         
         window.addEventListener('unhandledrejection', function(e) {
           window.__gameLoading.recordError(e.reason || 'Promise rejected');
         });
         
         window.__gameLoading.recordState('document-' + document.readyState);
         
         // Device-aware timeout for forcing visibility
         const visibilityTimeout = window.__gameLoading.deviceProfile.isSlowDevice ? 30000 : 15000;
         setTimeout(function() {
           console.log('Forcing game visibility after device-aware timeout');
           
           document.querySelectorAll('[id*="loading"], [class*="loading"]').forEach(element => {
             if (element.offsetWidth > 100 && element.offsetHeight > 100) {
               if (element.id?.toLowerCase().includes('loading') || 
                   (typeof element.className === 'string' && element.className.toLowerCase().includes('loading'))) {
                 element.style.display = 'none';
               }
             }
           });
           
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
           
           try {
             window.dispatchEvent(new Event('resize'));
           } catch(e) {}
           
           try {
             window.parent.postMessage({
               type: 'GAME_FORCE_VISIBLE',
               time: performance.now(),
               deviceProfile: window.__gameLoading.deviceProfile
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
     /* Device-Aware Game Rendering and Visibility Fixes */
     (function() {
       function fixVisibility() {
         document.querySelectorAll('canvas').forEach(canvas => {
           if (canvas.style.display === 'none') canvas.style.display = 'block';
           if (canvas.style.visibility === 'hidden') canvas.style.visibility = 'visible';
           
           if (canvas.width === 0 || canvas.height === 0) {
             canvas.width = canvas.width || window.innerWidth * 0.8 || 800;
             canvas.height = canvas.height || window.innerHeight * 0.8 || 600;
           }
         });
         
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
         
         document.querySelectorAll('[id*="loading"], [class*="loading"]').forEach(element => {
           if (element.offsetWidth > 200 && element.offsetHeight > 200) {
             if (element.id?.toLowerCase().includes('loading') || 
                 (typeof element.className === 'string' && element.className.toLowerCase().includes('loading'))) {
               element.style.display = 'none';
             }
           }
         });
         
         const gameContainers = document.querySelectorAll('#unity-canvas, #game, canvas, [id*="game"], [id*="unity"]');
         gameContainers.forEach(container => {
           container.style.display = 'block';
           container.style.visibility = 'visible';
           container.style.opacity = '1';
         });
       }
       
       window.UnityLoader = window.UnityLoader || {
         instantiate: function(container, url, params) { return { SetFullscreen: function() {} }; },
         SystemInfo: { hasWebGL: true, mobile: false }
       };
       
       window.unityInstance = window.unityInstance || { SendMessage: function() {}, SetFullscreen: function() {} };
       window.unityShowBanner = window.unityShowBanner || function() {};
       window.unityProgress = window.unityProgress || function() {};
       
       const deviceProfile = window.__gameLoading ? window.__gameLoading.deviceProfile : { isSlowDevice: false };
       
       let fixCount = 0;
       const maxFixes = deviceProfile.isSlowDevice ? 10 : 6;
       
       function runFixes() {
         fixCount++;
         fixVisibility();
         
         if (fixCount < maxFixes) {
           const interval = deviceProfile.isSlowDevice ? 
             fixCount * 2000 : 
             fixCount * 1200;
           
           setTimeout(runFixes, interval);
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

// Enhanced fetch with device-aware optimizations
async function enhancedFetch(event, retries = CONFIG.RETRY_COUNT) {
 const url = new URL(event.request.url).toString();
 
 if (shouldBypassUrl(url)) {
   return await sw.fetch(event);
 }

 // Detect device if not already done
 const device = detectDevice();
 
 // Check cache first
 if (CONFIG.ENABLE_CACHE && shouldCacheUrl(url)) {
   try {
     const cache = await caches.open(CONFIG.CACHE_NAME);
     const cachedResponse = await cache.match(event.request);
     
     if (cachedResponse) {
       // Background update for non-slow devices
       if (!device.isSlowDevice) {
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
       
       return cachedResponse;
     }
   } catch (cacheError) {
     console.error('[UV SW] Cache error:', cacheError);
   }
 }
 
 const controller = new AbortController();
 const signal = controller.signal;
 
 const priority = getResourcePriority(url);
 const timeoutMultiplier = device.isSlowDevice ? 2.5 : 1.0;
 
 const timeout = setTimeout(() => {
   controller.abort();
 }, priority === 'CRITICAL' ? 
    CONFIG.FETCH_TIMEOUT * timeoutMultiplier : 
    Math.min(120000, CONFIG.FETCH_TIMEOUT / 2) * timeoutMultiplier);
 
 try {
   const options = {
     signal: signal,
     priority: priority === 'CRITICAL' ? 'high' : 'auto'
   };
   
   const fetchPromise = sw.fetch(event, options);
   const response = await connections.add(url, fetchPromise, true);
   
   clearTimeout(timeout);
   
   // Cache successful responses
   if (CONFIG.ENABLE_CACHE && shouldCacheUrl(url) && response.ok) {
     try {
       const cache = await caches.open(CONFIG.CACHE_NAME);
       
       const headers = new Headers(response.headers);
       headers.set('x-cache-timestamp', Date.now().toString());
       
       const clonedResponse = new Response(response.clone().body, {
         status: response.status,
         statusText: response.statusText,
         headers: headers
       });
       
       cache.put(event.request, clonedResponse);
       
       // Periodic cache maintenance (less frequent for slow devices)
       if (Math.random() < (device.isSlowDevice ? 0.002 : 0.01)) {
         trimCache();
         clearExpiredCache();
       }
     } catch (cacheError) {
       console.error('[UV SW] Error caching response:', cacheError);
     }
   }
   
   // Special handling for game content
   if (isGameContent(url) && response.headers.get('content-type')?.includes('text/html')) {
     return await injectGameFixes(response, url);
   }
   
   return response;
 } catch (error) {
   clearTimeout(timeout);
   
   console.error(`[UV SW] Fetch error: ${error.message}`);
   
// Device-aware retry logic
   if (retries > 0) {
     const baseDelay = device.isSlowDevice ? CONFIG.RETRY_DELAY * 1.5 : CONFIG.RETRY_DELAY;
     const delay = baseDelay * Math.pow(2, CONFIG.RETRY_COUNT - retries);
     
     console.log(`[UV SW] Retrying (${retries} attempts left) after ${delay}ms for ${device.performance} device`);
     
     connections.stats.retried++;
     
     await new Promise(resolve => setTimeout(resolve, delay));
     return enhancedFetch(event, retries - 1);
   }
   
   // Final cache fallback
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

// Create device-aware error page
function createErrorPage(error) {
 const device = detectDevice();
 
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
         text-align: center; 
       }
       .container { 
         max-width: 600px; 
         margin: 40px auto; 
         background: #333; 
         border-radius: 8px; 
         padding: 20px; 
       }
       h2 { color: #f44336; margin-top: 0; }
       button { 
         padding: 10px 16px; 
         background: #2196f3; 
         color: white; 
         border: none; 
         border-radius: 4px; 
         cursor: pointer; 
         margin: 5px; 
       }
       .device-info { 
         color: #ffeb3b; 
         font-size: 14px; 
         margin-bottom: 10px; 
       }
     </style>
   </head>
   <body>
     <div class="container">
       <h2>Game Loading Error</h2>
       <div class="device-info">Device Performance: ${device.performance.toUpperCase()}</div>
       <p>The game couldn't be loaded. This may be due to network issues${device.isSlowDevice ? ' or device limitations' : ''}.</p>
       <div>
         <button onclick="window.location.reload()">Try Again</button>
         <button onclick="window.location.href='/'">Go Home</button>
       </div>
       ${device.isSlowDevice ? '<p>For better performance, try closing other tabs or applications.</p>' : ''}
     </div>
     <script>
       setTimeout(function() {
         try {
           navigator.serviceWorker.controller.postMessage({
             type: 'ERROR_REPORT',
             url: location.href,
             timestamp: Date.now(),
             deviceProfile: ${JSON.stringify(device)}
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
 console.log('[UV SW] Installing device-aware service worker...');
 
 if (CONFIG.ENABLE_CACHE) {
   event.waitUntil((async () => {
     try {
       const cache = await caches.open(CONFIG.CACHE_NAME);
       
       await cache.addAll([
         '/uv/encode.js',
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

// Enhanced activate handler
self.addEventListener('activate', event => {
 console.log('[UV SW] Activated with device awareness');
 
 if (CONFIG.ENABLE_CACHE) {
   event.waitUntil((async () => {
     try {
       const cacheNames = await caches.keys();
       await Promise.all(
         cacheNames
           .filter(name => name !== CONFIG.CACHE_NAME && name.startsWith('uv-'))
           .map(name => caches.delete(name))
       );
       
       await trimCache();
       await clearExpiredCache();
       
       console.log('[UV SW] Cache cleanup completed');
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
     event.source.postMessage({
       type: 'PONG',
       timestamp: event.data.timestamp,
       deviceProfile: detectDevice()
     });
   } catch (e) {}
   return;
 }
 
 if (event.data.type === 'STATUS_REQUEST') {
   try {
     event.source.postMessage({
       type: 'STATUS_RESPONSE',
       connectionStats: connections.stats,
       deviceProfile: detectDevice(),
       timestamp: Date.now()
     });
   } catch (e) {}
   return;
 }
 
 if (event.data.type === 'ERROR_REPORT') {
   console.log(`[UV SW] Error report received for ${event.data.url} from ${event.data.deviceProfile?.performance || 'unknown'} device`);
   return;
 }
});

console.log('[UV SW] Device-aware service worker loaded successfully');
