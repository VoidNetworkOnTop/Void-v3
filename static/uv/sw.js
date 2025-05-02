/global UVServiceWorker,__uv$config/
/*
 * Enhanced service worker script for Ultraviolet proxy
 * With improved game compatibility and fixed __uv$bareData issues
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Configuration with extended timeouts
const CONFIG = {
  FETCH_TIMEOUT: 180000,        // 3 minute timeout for slow sites
  MAX_RETRIES: 3,               // Number of retry attempts
  RETRY_DELAY: 800,             // Delay between retries in ms
  LOG_LEVEL: 'debug'            // Set to 'info' to reduce logging
};

// Log initialization
console.log('[UV Service Worker] Initializing with bareData fix...');

// Enhanced fetch with timeout and retries
const enhancedFetch = async (event, retries = CONFIG.MAX_RETRIES) => {
  try {
    // Get URL information
    const url = new URL(event.request.url);
    
    // Special handling for game URLs - CRITICAL: DON'T MODIFY THESE RESPONSES
    const isGameUrl = 
      url.pathname.includes('/uv/service/') || 
      url.pathname.includes('/service/') ||
      url.search.includes('game=');
      
    if (isGameUrl) {
      console.log(`[UV Service Worker] Handling game URL: ${url.toString().substring(0, 100)}...`);
      
      // IMPORTANT: Don't apply any special handling to the game URL, just let UV handle it
      return await sw.fetch(event);
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

// Fix HTML content issues
const cleanHtml = async (response, url) => {
  // Skip processing for UV service URLs and game content
  if (url.includes('/uv/service/') || url.includes('/service/') || url.search.includes('game=')) {
    return response;
  }
  
  // Check if this is HTML content
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('text/html')) {
    return response;
  }
  
  const clone = response.clone();
  try {
    let text = await clone.text();
    
    // Check if text contains bareData (which should never be visible to user)
    if (text.includes('__uv$bareData') || text.includes('__uv$cookies')) {
      console.error('[UV Service Worker] Detected UV configuration in response body!');
      console.log('[UV Service Worker] URL with bareData issue:', url);
      
      // This indicates a processing error - we'll try to fetch directly without modifications
      return await sw.fetch(event);
    }
    
    // Normal HTML processing for non-game content
    let modified = false;

    // Fix common HTML syntax issues
    if (text.includes('class="">')) {
      text = text.replace(/class=["']>/g, 'class="">');
      modified = true;
    }
    
    // Remove stray closing tags
    if (text.match(/^\s*>/)) {
      text = text.replace(/^\s*>/, '');
      modified = true;
    }
    
    // Find and fix unclosed or mismatched tags
    const findStrayClosingTags = () => {
      // Find standalone ">" that aren't part of a tag
      let matches = text.match(/([^<]|^)>([^>]|$)/g);
      if (matches) {
        // Replace standalone ">" with nothing
        text = text.replace(/([^<]|^)>([^>]|$)/g, '$1$2');
        return true;
      }
      return false;
    };
    
    // Run the stray tag finder and fix
    if (findStrayClosingTags()) {
      modified = true;
    }
    
    // Add our compatibility scripts only to non-game content
    if (!text.includes('uv-html-fix')) {
      // Insert at the beginning of head safely
      const headPos = text.indexOf('<head');
      if (headPos !== -1) {
        // Find where the head tag ends
        const headEndPos = text.indexOf('>', headPos);
        if (headEndPos !== -1) {
          // Insert after the head opening tag
          text = text.substring(0, headEndPos + 1) + 
                 `\n<!-- UV HTML Fix -->\n<script data-id="uv-html-fix">
                  (function() {
                    // Fix HTML rendering issues
                    document.addEventListener('DOMContentLoaded', function() {
                      // Remove any stray ">" characters
                      const walker = document.createTreeWalker(
                        document.body, 
                        NodeFilter.SHOW_TEXT
                      );
                      
                      let node;
                      const nodesToFix = [];
                      while(node = walker.nextNode()) {
                        if (node.textContent.includes('>') && 
                            node.parentNode.nodeName !== 'SCRIPT' && 
                            node.parentNode.nodeName !== 'STYLE') {
                          nodesToFix.push(node);
                        }
                      }
                      
                      // Fix the nodes
                      nodesToFix.forEach(node => {
                        node.textContent = node.textContent.replace(/>/g, '');
                      });
                      
                      // Fix broken class attributes
                      document.querySelectorAll('[class=""]').forEach(el => {
                        el.removeAttribute('class');
                      });
                    });
                  })();
                 </script>\n` + 
                 text.substring(headEndPos + 1);
          modified = true;
        }
      }
    }

    // Return modified response or original if no changes
    if (modified) {
      return new Response(text, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }
  } catch (error) {
    console.error('[UV Service Worker] Error processing HTML:', error);
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
      // Get the URL
      const url = event.request.url;
      
      // Get response with enhanced fetch
      const response = await enhancedFetch(event);
      
      // Clean HTML (skips game content)
      return await cleanHtml(response, url);
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

  // Handle health check
  if (event.data && event.data.type === 'PING') {
    if (event.source) {
      event.source.postMessage({
        type: 'PONG',
        timestamp: Date.now(),
        status: 'healthy'
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
});
