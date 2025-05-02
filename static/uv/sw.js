/*global UVServiceWorker,__uv$config*/
/*
 * Universal service worker script.
 * Designed to work with virtually any website.
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Configuration
const FETCH_TIMEOUT = 45000; // 45 seconds timeout (balanced for speed and reliability)
const USER_AGENTS = {
  // Modern desktop browsers (in order of popularity)
  desktop: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.58',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0'
  ],
  // Mobile browsers
  mobile: [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/112.0.5615.46 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36'
  ]
};

// Log initialization
console.log('[UV Service Worker] Initializing universal compatibility mode');

// Choose a random user agent from the specified category
function getRandomUserAgent(category = 'desktop') {
  const agents = USER_AGENTS[category] || USER_AGENTS.desktop;
  return agents[Math.floor(Math.random() * agents.length)];
}

// Check if a URL likely requires mobile user agent
function shouldUseMobileUA(url) {
  const hostname = new URL(url).hostname.toLowerCase();
  
  // Common sites that work better with mobile user agents
  const mobilePreferredPatterns = [
    'tiktok', 'm.', '.mobile.', 'mobile.', 
    'amp.', '.amp.', 'touch.'
  ];
  
  return mobilePreferredPatterns.some(pattern => hostname.includes(pattern));
}

// Enhance request with appropriate headers to look like a real browser
function enhanceRequest(request) {
  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  
  // Choose appropriate user agent based on URL
  const usesMobile = shouldUseMobileUA(url.toString());
  if (!headers.has('User-Agent') || headers.get('User-Agent').includes('Mozilla/5.0')) {
    headers.set('User-Agent', getRandomUserAgent(usesMobile ? 'mobile' : 'desktop'));
  }
  
  // Common browser headers that help avoid bot detection
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', 'en-US,en;q=0.9');
  }
  
  if (!headers.has('Accept')) {
    headers.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8');
  }
  
  if (!headers.has('Referer') && url.pathname !== '/') {
    headers.set('Referer', `${url.protocol}//${url.host}/`);
  }
  
  if (!headers.has('DNT')) {
    headers.set('DNT', '1');
  }
  
  // Create a new request with enhanced headers
  return new Request(request, { headers });
}

// Timeout fetch with optimized handling
const timeoutFetch = async (request, timeout) => {
  // First enhance the request with appropriate headers
  const enhancedRequest = enhanceRequest(request);
  
  return Promise.race([
    sw.fetch(enhancedRequest),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

// Inject scripts to help with compatibility and prevent detection
function injectCompatibilityScripts(html, url) {
  if (!html.includes('<body') || html.includes('uv_compat_script')) {
    return html;
  }
  
  return html.replace(
    '<body',
    `<body><script id="uv_compat_script">
      (function(){
        try {
          // Basic anti-bot detection
          Object.defineProperty(navigator, 'webdriver', { get: () => false });
          
          // Chrome properties that many detection scripts check for
          if (!window.chrome) {
            window.chrome = {
              runtime: {},
              loadTimes: function() {},
              csi: function() {},
              app: {}
            };
          }
          
          // Pretend we're not in a frame if we are
          if (window !== window.top) {
            try {
              Object.defineProperty(window, 'frameElement', { get: () => null });
            } catch(e) {}
          }
          
          // Override Navigator.prototype.plugins to show fake plugins
          if (navigator.plugins.length === 0) {
            Object.defineProperty(Navigator.prototype, 'plugins', {
              get: () => [
                { name: 'Chrome PDF Plugin' },
                { name: 'Chrome PDF Viewer' },
                { name: 'Native Client' }
              ]
            });
          }
          
          // Notify parent when content is loaded
          window.addEventListener('load', function() {
            setTimeout(function() {
              try {
                if (window.parent !== window) {
                  window.parent.postMessage({ type: 'GAME_READY' }, '*');
                }
              } catch(e) {}
              
              // Remove this script element after execution
              var script = document.getElementById('uv_compat_script');
              if (script && script.parentNode) {
                script.parentNode.removeChild(script);
              }
            }, 500);
          });
        } catch(e) {
          // Silent fail
        }
      })();
    </script>`
  );
}

// Adaptive content checking
function needsContentCheck(url, contentType) {
  // Skip content checking for non-HTML responses
  if (!contentType || !contentType.includes('text/html')) {
    return false;
  }
  
  // Skip for streaming media sites, they often have special loading patterns
  const hostname = new URL(url).hostname.toLowerCase();
  const streamingSites = ['youtube', 'vimeo', 'dailymotion', 'twitch', 'netflix', 'hulu', 'spotify'];
  if (streamingSites.some(site => hostname.includes(site))) {
    return false;
  }
  
  return true;
}

// Enhanced fetch handler for universal compatibility
self.addEventListener('fetch', event => {
  // Only handle requests in our scope
  if (!event.request.url.includes('/uv/service/')) {
    return;
  }

  event.respondWith((async () => {
    try {
      // Use the enhanced fetch with timeout
      const response = await timeoutFetch(event.request, FETCH_TIMEOUT);
      
      // Process successful responses
      if (response && response.status === 200) {
        const contentType = response.headers.get('content-type');
        
        // Handle HTML content that needs processing
        if (contentType && contentType.includes('text/html') && 
            needsContentCheck(event.request.url, contentType)) {
          
          // Clone and check content
          const clone = response.clone();
          const text = await clone.text();
          
          // Always inject compatibility scripts for HTML
          const modifiedText = injectCompatibilityScripts(text, event.request.url);
          
          return new Response(modifiedText, {
            status: 200,
            headers: response.headers
          });
        }
        
        // Return unmodified response for non-HTML content
        return response;
      }
      
      // For 403/403 responses, retry with alternative user agent
      if (response && (response.status === 403 || response.status === 401)) {
        console.log(`[UV Service Worker] Attempting to bypass ${response.status}`);
        
        try {
          // Create headers with opposite type of user agent (if using desktop, try mobile and vice versa)
          const currentUrl = new URL(event.request.url);
          const currentHeaders = new Headers(event.request.headers);
          const currentUA = currentHeaders.get('User-Agent') || '';
          const isMobileUA = USER_AGENTS.mobile.some(ua => currentUA.includes(ua));
          
          // Use the opposite type of user agent
          const altUA = getRandomUserAgent(isMobileUA ? 'desktop' : 'mobile');
          currentHeaders.set('User-Agent', altUA);
          
          // Try alternate request
          const altRequest = new Request(event.request, { headers: currentHeaders });
          const altResponse = await timeoutFetch(altRequest, FETCH_TIMEOUT);
          
          if (altResponse && altResponse.status === 200) {
            return altResponse;
          }
        } catch (bypassErr) {
          console.error('[UV Service Worker] Bypass attempt failed');
        }
      }
      
      // For redirect responses (3xx), just return them to let the browser handle redirection
      if (response && response.status >= 300 && response.status < 400) {
        return response;
      }
      
      // For all other responses, return a generic, non-suspicious error page
      return new Response(
        `<html><body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Connection Issue</h2>
          <p>The site could not be reached.</p>
          <p>This might be a temporary connection issue.</p>
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
      
      // Generic error page
      return new Response(
        `<html><body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Connection Issue</h2>
          <p>The connection to the site could not be established.</p>
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