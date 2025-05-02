/global UVServiceWorker,__uv$config/
/*
 * Enhanced service worker script for Ultraviolet proxy
 * With improved game compatibility
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Configuration
const CONFIG = {
  FETCH_TIMEOUT: 180000,        // 3 minute timeout for slow sites
  MAX_RETRIES: 3,               // Number of retry attempts
  RETRY_DELAY: 800,             // Delay between retries in ms
  GAME_DOMAINS: [               // Game-specific domains that need special handling
    'unity',
    'unitycdn',
    'roblox',
    'game',
    'games',
    'play',
    'yujian',
    'yujiandemo',
    'cdn.jsdelivr.net',
    'jsdelivr',
    'cloudfront.net',
    '3d',
    'webgl'
  ]
};

// Log initialization
console.log('[UV Service Worker] Initializing with game compatibility improvements');

// Check if a URL is for a game resource
const isGameResource = (url) => {
  if (!url) return false;
  
  // Skip content modifications for these file types (common game resources)
  const skipExtensions = ['.js', '.json', '.wasm', '.data', '.unity3d', '.mem', '.bin', '.svg', '.mp3', '.ogg', '.assets'];
  for (const ext of skipExtensions) {
    if (url.endsWith(ext)) return true;
  }
  
  // Check against game domains
  for (const domain of CONFIG.GAME_DOMAINS) {
    if (url.includes(domain)) return true;
  }
  
  // Check common game paths
  return url.includes('/game') || 
         url.includes('/games') || 
         url.includes('/play') || 
         url.includes('/assets/') ||
         url.includes('unity');
};

// Enhanced fetch with timeout and retries
const enhancedFetch = async (event, retries = CONFIG.MAX_RETRIES) => {
  try {
    // Get the URL for special case handling
    const url = new URL(event.request.url).toString();
    
    // Special handling for game resources - skip timeouts
    const isGame = isGameResource(url);
    if (isGame) {
      // Log game resources but less verbosely to avoid spamming the console
      const shortUrl = url.length > 80 ? url.substring(0, 80) + '...' : url;
      console.log(`[UV Service Worker] Game resource: ${shortUrl}`);
      
      // Fetch without timeout for game resources
      return await sw.fetch(event);
    }
    
    // Use timeout for non-game resources
    return await Promise.race([
      sw.fetch(event),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), CONFIG.FETCH_TIMEOUT)
      )
    ]);
  } catch (error) {
    console.error('[UV Service Worker] Fetch error:', error.message);
    
    // Retry logic with exponential backoff
    if (retries > 0 && !error.message.includes('Cannot read properties')) {
      const backoffDelay = CONFIG.RETRY_DELAY * Math.pow(1.5, CONFIG.MAX_RETRIES - retries);
      console.log(`[UV Service Worker] Retrying fetch in ${backoffDelay}ms (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      return enhancedFetch(event, retries - 1);
    }
    throw error;
  }
};

// Fix HTML content issues - but only for non-game content
const cleanHtml = async (response, url) => {
  // CRITICAL FIX - Skip content modifications for game resources
  if (isGameResource(url)) {
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
    let modified = false;

    // Fix common HTML syntax issues
    if (text.includes('class="">')) {
      text = text.replace(/class=["']>/g, 'class="">');
      modified = true;
    }
    
    // Remove stray closing tags at the beginning
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
    
    // Add our compatibility scripts with proper HTML syntax
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
                    // Fix HTML rendering issues but avoid breaking games
                    document.addEventListener('DOMContentLoaded', function() {
                      try {
                        // Remove any stray ">" characters
                        const walker = document.createTreeWalker(
                          document.body, 
                          NodeFilter.SHOW_TEXT
                        );
                        
                        let node;
                        const nodesToFix = [];
                        while((node = walker.nextNode())) {
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
                      } catch(e) {
                        // Silent fail to avoid breaking anything
                      }
                    });
                    
                    // Handle special cases for interactive websites
                    if (window.location.hostname.includes('chatgpt.com') || window.location.hostname.includes('chat.openai.com')) {
                      // Fix for ChatGPT input handling
                      window.addEventListener('load', function() {
                        setTimeout(function() {
                          const textareas = document.querySelectorAll('textarea');
                          textareas.forEach(textarea => {
                            if (!textarea.dataset.fixed) {
                              textarea.dataset.fixed = 'true';
                              
                              // Fix Enter key handling
                              textarea.addEventListener('keydown', function(e) {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  // Look for and click send button
                                  const buttons = Array.from(document.querySelectorAll('button'));
                                  const sendButton = buttons.find(b => 
                                    b.textContent.includes('Send') || 
                                    b.getAttribute('aria-label')?.includes('Send')
                                  );
                                  
                                  if (sendButton) {
                                    sendButton.click();
                                    e.preventDefault();
                                  }
                                }
                              });
                            }
                          });
                        }, 1500);
                      });
                    }
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
      // Get the URL for special case handling
      const url = new URL(event.request.url).toString();
      
      // Get response with enhanced fetch
      const response = await enhancedFetch(event);
      
      // Skip HTML processing for game content
      if (isGameResource(url)) {
        // Return unmodified response for game resources
        return response;
      }
      
      // Clean HTML for non-game content
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
          
          <!-- Auto-reload for specific errors -->
          <script>
            if ("${err.message}".includes("undefined") || "${err.message}".includes("null")) {
              setTimeout(() => window.location.reload(), 3000);
            }
          </script>
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
