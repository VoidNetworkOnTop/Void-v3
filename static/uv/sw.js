/*global UVServiceWorker,__uv$config*/
/*
 * Enhanced service worker script for Void Network.
 * Improved site compatibility and bot detection avoidance.
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Configuration
const FETCH_TIMEOUT = 60000; // Increased to 60 seconds for very slow sites
const MIN_HTML_SIZE = 100; // Significantly reduced to avoid false positives
const COMMON_BROWSERS_UA = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
];

// Log initialization without revealing scope
console.log('[UV Service Worker] Initializing with improved compatibility');

// Add timeout to fetch operations with retry mechanism
const timeoutFetch = async (request, timeout, retries = 2) => {
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Clone the request for each attempt
      const clonedRequest = request.clone();
      
      // Modify request to look more like a real browser
      const modifiedRequest = new Request(clonedRequest, {
        headers: enhanceHeaders(clonedRequest.headers),
      });
      
      // Attempt the fetch with timeout
      return await Promise.race([
        sw.fetch(modifiedRequest),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
      ]);
    } catch (err) {
      lastError = err;
      console.warn(`[UV Service Worker] Fetch attempt ${attempt + 1}/${retries + 1} failed:`, err.message);
      
      // If not the last attempt, wait before retrying
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  // All attempts failed
  throw lastError;
};

// Enhance request headers to avoid bot detection
function enhanceHeaders(originalHeaders) {
  const headers = new Headers(originalHeaders);
  
  // Set a random common browser user-agent if not already set
  if (!headers.has('User-Agent')) {
    const randomUA = COMMON_BROWSERS_UA[Math.floor(Math.random() * COMMON_BROWSERS_UA.length)];
    headers.set('User-Agent', randomUA);
  }
  
  // Add common browser headers
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', 'en-US,en;q=0.9');
  }
  
  if (!headers.has('Accept')) {
    headers.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8');
  }
  
  if (!headers.has('Upgrade-Insecure-Requests')) {
    headers.set('Upgrade-Insecure-Requests', '1');
  }
  
  if (!headers.has('Sec-Fetch-Dest') && !headers.has('Sec-Fetch-Mode')) {
    headers.set('Sec-Fetch-Dest', 'document');
    headers.set('Sec-Fetch-Mode', 'navigate');
    headers.set('Sec-Fetch-Site', 'none');
    headers.set('Sec-Fetch-User', '?1');
  }
  
  return headers;
}

// Specialized handling for certain domains
function needsSpecialHandling(url) {
  const hostname = new URL(url).hostname;
  
  // Special handling for certain sites that need different approaches
  const specialSites = {
    'tiktok.com': {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1', // Mobile UA works better for TikTok
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': ''  // Empty cookie to initialize cookie jar
      },
      skipContentCheck: true
    },
    'm.tiktok.com': {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      skipContentCheck: true
    },
    'www.tiktok.com': {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      skipContentCheck: true
    },
    'twitter.com': {
      skipContentCheck: true
    },
    'x.com': {
      skipContentCheck: true
    },
    'instagram.com': {
      skipContentCheck: true
    },
    'facebook.com': {
      skipContentCheck: true
    },
    'youtube.com': {
      skipContentCheck: true
    }
  };
  
  // Check if domain or any parent domain is in special sites list
  const domainParts = hostname.split('.');
  while (domainParts.length > 1) {
    const domain = domainParts.join('.');
    if (specialSites[domain]) {
      return specialSites[domain];
    }
    domainParts.shift();
  }
  
  return null;
}

// More subtle script injection that's less likely to be detected
function injectCompatibilityScript(html) {
  // Don't add script if already present
  if (html.includes('void_network_compat') || !html.includes('<body')) {
    return html;
  }
  
  return html.replace(
    '<body',
    `<body><script id="void_network_compat">
      (function(){
        try {
          // Override common bot detection methods
          Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
            configurable: true
          });
          
          // Fake browser-like environment
          if (!window.chrome) {
            window.chrome = { runtime: {} };
          }
          
          // Make iframe detection harder
          try {
            if (window !== window.top) {
              Object.defineProperty(window, 'parent', {
                get: function() { return window; }
              });
              Object.defineProperty(window, 'top', {
                get: function() { return window; }
              });
            }
          } catch(e) {}

          // Create mouse movement simulation to appear human-like
          if (typeof document !== 'undefined') {
            let lastX = 100, lastY = 100;
            const randomMove = function() {
              if (Math.random() > 0.85) {
                const newX = lastX + (Math.random() * 20 - 10);
                const newY = lastY + (Math.random() * 20 - 10);
                const evt = new MouseEvent('mousemove', {
                  bubbles: true,
                  cancelable: true,
                  clientX: newX,
                  clientY: newY
                });
                document.dispatchEvent(evt);
                lastX = newX;
                lastY = newY;
              }
              setTimeout(randomMove, Math.random() * 3000 + 1000);
            };
            setTimeout(randomMove, 2000);
          }
          
          // Load event notification
          window.addEventListener('load', function() {
            setTimeout(function() {
              if (window.parent && window.parent !== window) {
                try {
                  window.parent.postMessage({ type: 'GAME_READY' }, '*');
                } catch(e) {}
              }
            }, 1500);
          });
        } catch(e) {}
        
        // Clean up script after execution
        setTimeout(function() {
          const script = document.getElementById('void_network_compat');
          if (script && script.parentNode) {
            script.parentNode.removeChild(script);
          }
        }, 2000);
      })();
    </script>`
  );
}

// Enhanced fetch handler with improved compatibility
self.addEventListener('fetch', event => {
  // Only handle requests in our scope
  if (!event.request.url.includes('/uv/service/')) {
    return;
  }

  event.respondWith((async () => {
    try {
      const url = new URL(event.request.url);
      const specialHandling = needsSpecialHandling(url.toString());
      
      // Create a modified request if special handling is needed
      let modifiedRequest = event.request;
      if (specialHandling && specialHandling.headers) {
        modifiedRequest = new Request(event.request, {
          headers: new Headers({
            ...Object.fromEntries([...event.request.headers.entries()]),
            ...specialHandling.headers
          })
        });
      }
      
      // Try with timeout and retry
      const response = await timeoutFetch(modifiedRequest, FETCH_TIMEOUT);
      
      // For successful responses, check content if needed
      if (response && response.status === 200) {
        const contentType = response.headers.get('content-type');
        
        // Skip content checks for specially handled sites or non-HTML content
        if ((specialHandling && specialHandling.skipContentCheck) || 
            !contentType || !contentType.includes('text/html')) {
          return response;
        }
        
        // For HTML responses, verify content and inject compatibility script
        if (contentType && contentType.includes('text/html')) {
          // Clone to check content
          const clone = response.clone();
          const text = await clone.text();
          
          // Only check minimal content for sites not in the special list
          if (text.length < MIN_HTML_SIZE) {
            console.log('[UV Service Worker] Minimal content detected, but serving anyway');
            // Return what we got instead of an error page
            return response;
          }
          
          // Inject compatibility script
          const modifiedText = injectCompatibilityScript(text);
          
          return new Response(modifiedText, {
            status: 200,
            headers: response.headers
          });
        }
        
        return response;
      }
      
      // For non-success responses, try to handle specific status codes
      if (response && response.status === 403) {
        console.log(`[UV Service Worker] Bypassing 403 Forbidden`);
        // Try with different user agent for 403 errors
        const bypassRequest = new Request(event.request, {
          headers: new Headers({
            ...Object.fromEntries([...event.request.headers.entries()]),
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          })
        });
        
        try {
          const bypassResponse = await timeoutFetch(bypassRequest, FETCH_TIMEOUT, 1);
          if (bypassResponse && bypassResponse.status === 200) {
            return bypassResponse;
          }
        } catch (bypassErr) {
          console.error('[UV Service Worker] Bypass attempt failed:', bypassErr);
        }
      }
      
      // For other error responses, return a more discreet error page
      console.log(`[UV Service Worker] Response status: ${response ? response.status : 'unknown'}`);
      return new Response(
        `<html><body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Connection Issue</h2>
          <p>The site couldn't be reached (${response ? response.status : 'connection error'}).</p>
          <p>This might be temporary - please try again.</p>
          <div style="margin-top: 20px;">
            <button onclick="window.location.reload()" style="padding: 8px 16px; background: #4a6ed3; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Reload</button>
            <button onclick="window.history.back()" style="padding: 8px 16px; background: #f0f0f0; color: #333; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">Go Back</button>
          </div>
        </body></html>`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    } catch (err) {
      console.error('[UV Service Worker] Error in fetch:', err);
      
      // Return a simpler, less obvious error page
      return new Response(
        `<html><body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Connection Issue</h2>
          <p>The connection to the site couldn't be established.</p>
          <p>This might be due to temporary internet issues.</p>
          <div style="margin-top: 20px;">
            <button onclick="window.location.reload()" style="padding: 8px 16px; background: #4a6ed3; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Try Again</button>
            <button onclick="window.history.back()" style="padding: 8px 16px; background: #f0f0f0; color: #333; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">Go Back</button>
          </div>
        </body></html>`,
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
  
  // Handle ping/health check
  if (event.data && event.data.type === 'PING') {
    if (event.source) {
      event.source.postMessage({
        type: 'PONG',
        timestamp: Date.now()
      });
    }
  }
});