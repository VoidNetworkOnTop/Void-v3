/global UVServiceWorker,__uv$config/
/*
 * Enhanced service worker script for Ultraviolet proxy
 * With improved HTML parsing and rendering fixes for game compatibility
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Configuration with extended timeouts and special domains
const CONFIG = {
  FETCH_TIMEOUT: 180000,        // 3 minute timeout for slow sites (increased)
  MAX_RETRIES: 3,               // Number of retry attempts
  RETRY_DELAY: 800,             // Delay between retries in ms
  SPECIAL_DOMAINS: [            // Sites needing special handling
    'chat.openai.com',
    'chatgpt.com',
    'openai.com',
    'tiktok.com',
    'youtube.com',
    'youtu.be',
    'snapchat.com',
    'snap.com'
  ],
  // Game-specific domains that need careful handling
  GAME_DOMAINS: [
    'unity',
    'unitycdn',
    'roblox',
    'yujiandemo',
    'yujian',
    'game',
    'play',
    'cdn.jsdelivr.net',
    'jsdelivr',
    'cloudfront.net',
    'googleusercontent'
  ]
};

// Log initialization
console.log('[UV Service Worker] Initializing with game compatibility fixes');

// Check if a URL is for a known game platform or resource
const isGameResource = (url) => {
  if (!url) return false;
  
  // Always skip content modifications for these file types
  const skipExtensions = ['.js', '.json', '.wasm', '.data', '.unity3d', '.mem', '.bin', '.svg'];
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
         url.includes('/assets/');
};

// Enhanced fetch with timeout and retries
const enhancedFetch = async (event, retries = CONFIG.MAX_RETRIES) => {
  const url = new URL(event.request.url).toString();
  const isGame = isGameResource(url);
  
  // Extend timeout for game resources
  const timeout = isGame ? CONFIG.FETCH_TIMEOUT * 1.5 : CONFIG.FETCH_TIMEOUT;
  
  try {
    // For game resources, use direct fetch without content modification
    if (isGame) {
      console.log(`[UV Service Worker] Handling game resource: ${url.slice(0, 100)}...`);
      return await sw.fetch(event);
    }
    
    // Try to fetch with timeout for non-game resources
    return await Promise.race([
      sw.fetch(event),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeout)
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

// Fix HTML content issues - only for non-game content
const cleanHtml = async (response, url) => {
  // Skip content modifications for game resources
  if (isGameResource(url)) {
    return response;
  }
  
  const clone = response.clone();
  
  // Check if this is HTML content
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('text/html')) {
    return response;
  }
  
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
    
    // Find and fix unclosed or mismatched tags - carefully preserve script content
    const findStrayClosingTags = () => {
      // Extract script tags to protect their content
      const scriptTags = [];
      const scriptMatches = text.matchAll(/<script[\s\S]*?<\/script>/g);
      for (const match of scriptMatches) {
        scriptTags.push({
          content: match[0],
          placeholder: `SCRIPT_PLACEHOLDER_${scriptTags.length}`
        });
      }
      
      // Replace scripts with placeholders
      let tempText = text;
      scriptTags.forEach(tag => {
        tempText = tempText.replace(tag.content, tag.placeholder);
      });
      
      // Find standalone ">" that aren't part of a tag
      let matches = tempText.match(/([^<]|^)>([^>]|$)/g);
      if (matches) {
        // Replace standalone ">" with nothing
        matches.forEach(match => {
          tempText = tempText.replace(match, match.replace('>', ''));
        });
        
        // Restore script tags
        scriptTags.forEach(tag => {
          tempText = tempText.replace(tag.placeholder, tag.content);
        });
        
        text = tempText;
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
                 `\n<!-- UV HTML Fix with Game Compatibility -->\n<script data-id="uv-html-fix">
                  (function() {
                    // Fix potential rendering issues without breaking games
                    document.addEventListener('DOMContentLoaded', function() {
                      // Remove any stray ">" characters - avoid scripts and iframes
                      try {
                        const walker = document.createTreeWalker(
                          document.body, 
                          NodeFilter.SHOW_TEXT
                        );
                        
                        let node;
                        const nodesToFix = [];
                        while(node = walker.nextNode()) {
                          if (node.textContent.includes('>') && 
                              node.parentNode.nodeName !== 'SCRIPT' && 
                              node.parentNode.nodeName !== 'STYLE' &&
                              node.parentNode.nodeName !== 'IFRAME') {
                            nodesToFix.push(node);
                          }
                        }
                        
                        // Fix the nodes
                        nodesToFix.forEach(node => {
                          node.textContent = node.textContent.replace(/>/g, '');
                        });
                      } catch(e) {
                        // Silent fail - don't break anything
                      }
                      
                      // Fix broken class attributes
                      document.querySelectorAll('[class=""]').forEach(el => {
                        el.removeAttribute('class');
                      });
                    });
                    
                    // Game compatibility - fix iframe/canvas focus issues
                    try {
                      // Detect if we're in a game
                      var isGame = (
                        window.location.pathname.includes('/game') ||
                        window.location.pathname.includes('/games') ||
                        window.location.pathname.includes('/play') ||
                        window.location.hostname.includes('game') ||
                        window.location.hostname.includes('play') ||
                        document.title.toLowerCase().includes('game')
                      );
                      
                      if (isGame) {
                        console.log("[UV-FIX] Game detected, applying compatibility fixes");
                        
                        // Fix canvas focus and resolution issues
                        window.addEventListener('load', function() {
                          setTimeout(function() {
                            // Look for common game elements
                            var gameCanvas = 
                              document.querySelector('canvas#unity-canvas') || 
                              document.querySelector('canvas.unity-canvas') || 
                              document.querySelector('canvas#game') || 
                              document.querySelector('canvas.emscripten') ||
                              document.querySelector('canvas:not([id])');
                              
                            if (gameCanvas) {
                              console.log('[UV-FIX] Game canvas found, fixing focus');
                              gameCanvas.tabIndex = 1;
                              
                              // Make sure canvas has proper dimensions if they're missing
                              if (!gameCanvas.style.width || gameCanvas.style.width === '0px') {
                                gameCanvas.style.width = '100%';
                              }
                              if (!gameCanvas.style.height || gameCanvas.style.height === '0px') {
                                gameCanvas.style.height = '100%';
                              }
                              
                              // Focus the canvas
                              setTimeout(function() {
                                gameCanvas.focus();
                              }, 1000);
                            }
                          }, 1500);
                        });
                        
                        // Create proxies for common game libraries
                        if (typeof UnityLoader === 'undefined') {
                          window.UnityLoader = window.UnityLoader || { Error: function(){}, SystemInfo: { mobile: false } };
                        }
                        
                        // Fix for iframe buster scripts
                        try {
                          Object.defineProperty(window, 'frameElement', {
                            get: function() { return null; }
                          });
                        } catch(e) {}
                      }
                    } catch(e) {
                      console.warn('[UV-FIX] Game compatibility error:', e);
                    }
                    
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
      
      // Special handling for game resources - log these requests
      const isGame = isGameResource(url);
      if (isGame) {
        console.log(`[UV Service Worker] Game resource detected: ${url.slice(0, 80)}...`);
      }
      
      // Get response with enhanced fetch
      const response = await enhancedFetch(event);
      
      // Clean HTML for rendering issues (skip for game content)
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
        cacheNames.map(cacheName => {
          return caches.delete(cacheName);
        })
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
