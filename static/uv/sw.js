/*global UVServiceWorker,__uv$config*/
/*
 * Web content enhancement service worker
 * Performance optimized for improved browsing experience
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Initialize core service
const sw = new UVServiceWorker();

// Configuration
const FETCH_TIMEOUT = 50000; // 50 seconds timeout for slow connections
const MIN_HTML_SIZE = 800; // Minimum size for valid HTML content

// Initialize service scope
console.log('[Web Service] Initializing content delivery service');

// Enhanced fetch with timeout protection
const timeoutFetch = async (request, timeout) => {
  return Promise.race([
    sw.fetch(request),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

// Content delivery handler with reliability enhancements
self.addEventListener('fetch', event => {
  // Only handle requests in our service scope
  if (!event.request.url.includes('/uv/service/')) {
    return;
  }

  event.respondWith((async () => {
    try {
      // Process request with timeout protection
      const response = await timeoutFetch(event, FETCH_TIMEOUT);
      
      // Verify content quality for reliable delivery
      if (response && response.status === 200) {
        const contentType = response.headers.get('content-type');
        
        // Ensure adequate content delivery for HTML resources
        if (contentType && contentType.includes('text/html')) {
          // Verify content
          const clone = response.clone();
          const text = await clone.text();
          
          // Check for incomplete content
          if (text.length < MIN_HTML_SIZE) {
            console.log('[Web Service] Insufficient content detected');
            return new Response(
              `<html><body style="font-family: sans-serif; color: white; background: #222; margin: 0; padding: 20px;">
                <h2>Content Loading Issue</h2>
                <p>The requested resource could not be properly loaded.</p>
                <p>URL: ${event.request.url}</p>
                <p>This might be because:</p>
                <ul>
                  <li>The site requires additional authentication</li>
                  <li>The content requires client-side scripts to render properly</li>
                  <li>The site has security measures preventing external access</li>
                </ul>
                <button onclick="window.location.reload()" style="padding: 10px; background: #4a6ed3; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Retry</button>
                <button onclick="window.history.back()" style="padding: 10px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">Go Back</button>
              </body></html>`,
              {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
              }
            );
          }
          
          // Add performance monitoring and analytics
          if (text.includes('<body') && !text.includes('CONTENT_LOADED')) {
            const modifiedText = text.replace(
              '<body',
              `<body><script>
                try {
                  // Standard page performance monitoring
                  window.addEventListener('load', function() {
                    // Ensure all resources are properly rendered
                    setTimeout(function() {
                      // Standard cross-origin communication
                      if (window.parent && window.parent !== window) {
                        window.parent.postMessage({ type: 'CONTENT_LOADED', timestamp: Date.now() }, '*');
                      }
                    }, 1000);
                  });
                } catch(e) {
                  // Silent error handling
                }
              </script>`
            );
            
            return new Response(modifiedText, {
              status: 200,
              headers: response.headers
            });
          }
        }
        
        return response;
      }
      
      // Handle delivery failures with user guidance
      console.log(`[Web Service] Resource delivery failed: ${response ? response.status : 'unknown'}`);
      return new Response(
        `<html><body style="font-family: sans-serif; color: white; background: #222; margin: 0; padding: 20px;">
          <h2>Connection Issue</h2>
          <p>The requested content returned status: ${response ? response.status : 'unknown'}</p>
          <p>This might be because:</p>
          <ul>
            <li>The site is temporarily unavailable</li>
            <li>Your connection is experiencing issues</li>
            <li>The content requires additional authentication</li>
          </ul>
          <div style="margin-top: 20px;">
            <button onclick="window.location.reload()" style="padding: 10px; background: #4a6ed3; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Retry</button>
            <button onclick="window.history.back()" style="padding: 10px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">Go Back</button>
          </div>
        </body></html>`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    } catch (err) {
      console.error('[Web Service] Resource delivery error:', err);
      
      // Provide helpful guidance for connection issues
      return new Response(
        `<html><body style="font-family: sans-serif; color: white; background: #222; margin: 0; padding: 20px;">
          <h2>Connection Error</h2>
          <p>The service encountered an error: ${err.message}</p>
          <p>This often happens when:</p>
          <ul>
            <li>Your internet connection is slow or unstable</li>
            <li>The website has restricted access</li>
            <li>The site is temporarily unavailable</li>
          </ul>
          <div style="margin-top: 20px;">
            <button onclick="window.location.reload()" style="padding: 10px; background: #4a6ed3; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Reload</button>
            <button onclick="window.history.back()" style="padding: 10px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">Go Back</button>
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

// Standard lifecycle handlers
self.addEventListener('install', event => {
  console.log('[Web Service] Installation complete');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[Web Service] Service activated');
  event.waitUntil(clients.claim());
});

// Client communication handlers
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle availability checks
  if (event.data && event.data.type === 'PING') {
    if (event.source) {
      event.source.postMessage({
        type: 'PONG',
        timestamp: Date.now()
      });
    }
  }
});