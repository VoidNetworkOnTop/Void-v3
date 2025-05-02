/global UVServiceWorker,__uv$config/
/*
 * Enhanced service worker script for Ultraviolet proxy
 * With improved HTML parsing and rendering fixes
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Configuration
const CONFIG = {
  FETCH_TIMEOUT: 120000,        // 2 minute timeout for slow sites
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
  ]
};

// Log initialization
console.log('[UV Service Worker] Initializing with HTML fixes');

// Enhanced fetch with timeout and retries
const enhancedFetch = async (event, retries = CONFIG.MAX_RETRIES) => {
  try {
    // Try to fetch with timeout
    return await Promise.race([
      sw.fetch(event),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), CONFIG.FETCH_TIMEOUT)
      )
    ]);
  } catch (error) {
    console.error('[UV Service Worker] Fetch error:', error.message);
    
    // Retry logic
    if (retries > 0 && !error.message.includes('Cannot read properties')) {
      console.log(`[UV Service Worker] Retrying fetch (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      return enhancedFetch(event, retries - 1);
    }
    throw error;
  }
};

// Fix HTML content issues
const cleanHtml = async (response, url) => {
  const clone = response.clone();
  let text = await clone.text();
  let modified = false;

  // Check if this is HTML content
  if (!response.headers.get('content-type')?.includes('text/html')) {
    return response;
  }

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
                      if (node.textContent.includes('>') && node.parentNode.nodeName !== 'SCRIPT' && node.parentNode.nodeName !== 'STYLE') {
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
      // Get response with enhanced fetch
      const response = await enhancedFetch(event);
      
      // Clean HTML for rendering issues
      return await cleanHtml(response, event.request.url);
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
});
