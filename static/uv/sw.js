/global UVServiceWorker,__uv$config/
/*
 * Self-healing Ultraviolet service worker with automatic recovery
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Self-healing configuration
const SELF_HEALING = {
  ENABLED: true,
  MAX_CONSECUTIVE_ERRORS: 5,
  ERROR_RESET_INTERVAL: 60000, // 1 minute
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  consecutiveErrors: 0,
  lastErrorTime: 0,
  healthCheckTimerId: null,
  lastSuccessfulFetch: 0
};

// Start health check heartbeat
function startHealthCheck() {
  if (SELF_HEALING.healthCheckTimerId) {
    clearInterval(SELF_HEALING.healthCheckTimerId);
  }
  
  SELF_HEALING.healthCheckTimerId = setInterval(() => {
    // Check if we've had successful operations recently
    const now = Date.now();
    const timeSinceSuccess = now - SELF_HEALING.lastSuccessfulFetch;
    
    // If no successful operation in 5 minutes, force skip waiting to refresh
    if (SELF_HEALING.lastSuccessfulFetch > 0 && timeSinceSuccess > 300000) {
      console.log('[UV SW] No successful operations in 5 minutes, self-healing...');
      self.skipWaiting();
      self.clients.claim();
    }
  }, SELF_HEALING.HEALTH_CHECK_INTERVAL);
}

// Initialize health checks
startHealthCheck();

// Enhanced fetch with automatic healing
const enhancedFetch = async (event) => {
  try {
    // Record attempt time
    const startTime = Date.now();
    
    // Use native UV fetch
    const response = await sw.fetch(event);
    
    // Record successful fetch
    SELF_HEALING.lastSuccessfulFetch = Date.now();
    SELF_HEALING.consecutiveErrors = 0;
    
    // For HTML responses, inject self-healing script
    if (response.headers.get('content-type')?.includes('text/html')) {
      const clone = response.clone();
      const text = await clone.text();
      
      // Add auto-healing script to the HTML content
      if (!text.includes('uv-auto-healing')) {
        const modified = text.replace('<head', `<head>
          <script data-id="uv-auto-healing">
            (function() {
              // Auto-healing for blank pages
              if (document.addEventListener) {
                document.addEventListener('DOMContentLoaded', function() {
                  // Check if page is effectively blank
                  setTimeout(function() {
                    const bodyContent = document.body.innerText.trim();
                    const elementCount = document.querySelectorAll('*').length;
                    
                    // If page is blank or has minimal content, auto-reload
                    if ((bodyContent === '' || bodyContent.length < 20) && elementCount < 10) {
                      // Only reload if we haven't reloaded too many times
                      const reloadCount = parseInt(sessionStorage.getItem('uv-reload-count') || '0');
                      if (reloadCount < 3) {
                        sessionStorage.setItem('uv-reload-count', (reloadCount + 1).toString());
                        console.log('UV: Auto-healing - detected blank page, reloading');
                        location.reload();
                      } else {
                        console.log('UV: Too many reload attempts, sending diagnostic to parent');
                        try {
                          window.parent.postMessage({ type: 'UV_BLANK_PAGE', url: location.href }, '*');
                        } catch(e) {}
                      }
                    } else {
                      // Reset reload count on successful load
                      sessionStorage.removeItem('uv-reload-count');
                    }
                  }, 2000);
                });
              }
            })();
          </script>`);
        
        return new Response(modified, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      }
    }
    
    return response;
  } catch (err) {
    console.error('[UV SW] Fetch error:', err);
    
    // Track consecutive errors for self-healing
    const now = Date.now();
    if (now - SELF_HEALING.lastErrorTime > SELF_HEALING.ERROR_RESET_INTERVAL) {
      SELF_HEALING.consecutiveErrors = 1;
    } else {
      SELF_HEALING.consecutiveErrors++;
    }
    SELF_HEALING.lastErrorTime = now;
    
    // If too many consecutive errors, trigger self-healing
    if (SELF_HEALING.ENABLED && SELF_HEALING.consecutiveErrors >= SELF_HEALING.MAX_CONSECUTIVE_ERRORS) {
      console.log('[UV SW] Too many consecutive errors, triggering self-healing');
      SELF_HEALING.consecutiveErrors = 0;
      // Force the service worker to update
      self.skipWaiting();
      self.clients.claim();
    }
    
    // Return error page with auto-retry
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Auto-Recovering</title>
        <style>
          body { font-family: sans-serif; background: #222; color: white; padding: 20px; text-align: center; }
          .container { max-width: 600px; margin: 40px auto; background: #333; border-radius: 8px; padding: 20px; }
          .progress { width: 100%; height: 4px; background: #555; margin: 20px 0; overflow: hidden; }
          .progress-bar { height: 100%; width: 0%; background: #4a6ed3; animation: progress 3s forwards; }
          @keyframes progress { to { width: 100%; } }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Auto-Recovering Connection</h2>
          <p>The service is automatically recovering from an error: ${err.message}</p>
          <div class="progress"><div class="progress-bar"></div></div>
          <p id="message">Reconnecting automatically in 3 seconds...</p>
        </div>
        <script>
          // Auto-retry after 3 seconds
          setTimeout(() => {
            document.getElementById('message').textContent = 'Reconnecting now...';
            window.location.reload();
          }, 3000);
        </script>
      </body>
      </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
};

// Main fetch event handler
self.addEventListener('fetch', event => {
  if (event.request.url.startsWith(self.registration.scope)) {
    event.respondWith(enhancedFetch(event));
  }
});

// Install handler with auto-claim
self.addEventListener('install', event => {
  console.log('[UV SW] Installed');
  event.waitUntil(self.skipWaiting());
});

// Activate handler with auto-claim
self.addEventListener('activate', event => {
  console.log('[UV SW] Activated');
  event.waitUntil(self.clients.claim());
});

// Enhanced message handler with self-healing commands
self.addEventListener('message', event => {
  // Handle skip waiting
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle health check pings
  if (event.data && event.data.type === 'PING') {
    // Respond to confirm service worker is alive
    if (event.source) {
      event.source.postMessage({
        type: 'PONG',
        timestamp: Date.now(),
        status: 'healthy',
        errorCount: SELF_HEALING.consecutiveErrors
      });
    }
    
    // Update last successful communication time
    SELF_HEALING.lastSuccessfulFetch = Date.now();
  }
  
  // Handle force healing command
  if (event.data && event.data.type === 'FORCE_HEAL') {
    console.log('[UV SW] Forced healing requested');
    
    // Reset error tracking
    SELF_HEALING.consecutiveErrors = 0;
    SELF_HEALING.lastErrorTime = 0;
    
    // Restart health checks
    startHealthCheck();
    
    // Respond to confirm healing
    if (event.source) {
      event.source.postMessage({
        type: 'HEAL_COMPLETE',
        timestamp: Date.now()
      });
    }
  }
});
