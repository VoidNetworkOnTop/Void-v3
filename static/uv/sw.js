/global UVServiceWorker,__uv$config/
/*
 * Enhanced service worker script for Ultraviolet proxy
 * With special handling for complex interactive sites
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker with default configuration
const sw = new UVServiceWorker();

// Enhanced configuration
const CONFIG = {
  FETCH_TIMEOUT: 120000,        // Increased timeout for slower sites
  MAX_RETRIES: 3,               // More retry attempts for reliability
  RETRY_DELAY: 800,             // Slightly faster retry delay
  // Special domains that need custom handling
  SPECIAL_DOMAINS: [
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
console.log('[UV Service Worker] Initializing enhanced service worker');

// Check if a URL is for a special site needing custom handling
const isSpecialSite = (url) => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return CONFIG.SPECIAL_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
};

// Enhanced fetch with timeout and retries
const enhancedFetch = async (event, retries = CONFIG.MAX_RETRIES) => {
  const url = event.request.url;
  const isSpecial = isSpecialSite(url);
  
  // Adjust timeout for special sites
  const timeout = isSpecial ? CONFIG.FETCH_TIMEOUT * 1.5 : CONFIG.FETCH_TIMEOUT;
  
  try {
    // Try to fetch with timeout
    return await Promise.race([
      sw.fetch(event),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ]);
  } catch (error) {
    console.error(`[UV Service Worker] Fetch error (${isSpecial ? 'special site' : 'standard'}):`, error.message);
    
    // Only retry for non-fatal errors
    if (retries > 0 && !error.message.includes('Cannot read properties')) {
      console.log(`[UV Service Worker] Retrying fetch (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      return enhancedFetch(event, retries - 1);
    }
    throw error;
  }
};

// Fix HTML content issues and add site-specific compatibility
const processHtmlResponse = async (response, url) => {
  const isSpecial = isSpecialSite(url);
  const clone = response.clone();
  let text = await clone.text();
  let modified = false;

  // Fix any unclosed HTML tags or artifacts
  if (text.includes('class="">')) {
    text = text.replace(/class=["']>/, 'class="">');
    modified = true;
  }

  // Add specific fixes for ChatGPT
  if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) {
    // Special handling for ChatGPT
    if (!text.includes('chatgpt-compatibility-fix')) {
      text = text.replace(/<head/, `<head>
        <script data-id="chatgpt-compatibility-fix">
        (function() {
          // Fix for ChatGPT input and button issues
          document.addEventListener('DOMContentLoaded', function() {
            // Give the page time to fully initialize
            setTimeout(function() {
              // Fix for textarea input handling
              const fixTextareas = function() {
                const textareas = document.querySelectorAll('textarea');
                textareas.forEach(textarea => {
                  if (!textarea.dataset.fixed) {
                    // Clone and replace to rebuild event listeners
                    const clone = textarea.cloneNode(true);
                    textarea.parentNode.replaceChild(clone, textarea);
                    
                    // Ensure events propagate correctly
                    clone.dataset.fixed = 'true';
                    
                    // Add special handling for key events
                    clone.addEventListener('keydown', function(e) {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.stopPropagation();
                        
                        // Find and click the send button
                        const buttons = Array.from(document.querySelectorAll('button'));
                        const sendButton = buttons.find(b => {
                          return b.textContent.includes('Send') || 
                                 b.getAttribute('aria-label')?.includes('Send') ||
                                 b.getAttribute('data-testid')?.includes('send');
                        });
                        
                        if (sendButton) {
                          setTimeout(() => sendButton.click(), 10);
                        }
                        
                        if (!e.ctrlKey) e.preventDefault();
                      }
                    });
                  }
                });
              };
              
              // Run initially and set up mutation observer to catch dynamic elements
              fixTextareas();
              
              const observer = new MutationObserver(function(mutations) {
                fixTextareas();
              });
              
              observer.observe(document.body, {
                childList: true,
                subtree: true
              });
            }, 1000);
          });
        })();
        </script>`);
      modified = true;
    }
  } 
  
  // Add TikTok compatibility fixes
  else if (url.includes('tiktok.com')) {
    if (!text.includes('tiktok-compatibility-fix')) {
      text = text.replace(/<head/, `<head>
        <script data-id="tiktok-compatibility-fix">
        (function() {
          // Fix for TikTok video playback and interaction
          window.addEventListener('load', function() {
            // Ensure video controls work properly
            setTimeout(function() {
              // Make sure videos play
              document.querySelectorAll('video').forEach(video => {
                video.play().catch(() => {});
                
                // Ensure play buttons work
                const playButtons = document.querySelectorAll('[data-e2e="play-icon"]');
                playButtons.forEach(button => {
                  button.addEventListener('click', function(e) {
                    const videoEl = this.closest('[data-e2e="feed-item"]')?.querySelector('video');
                    if (videoEl) {
                      if (videoEl.paused) videoEl.play().catch(() => {});
                      else videoEl.pause();
                    }
                  });
                });
              });
            }, 2000);
          });
        })();
        </script>`);
      modified = true;
    }
  }

  // Add YouTube compatibility fixes
  else if (url.includes('youtube.com') || url.includes('youtu.be')) {
    if (!text.includes('youtube-compatibility-fix')) {
      text = text.replace(/<head/, `<head>
        <script data-id="youtube-compatibility-fix">
        (function() {
          // Fix for YouTube video playback issues
          window.addEventListener('load', function() {
            // Force HTML5 player
            localStorage.setItem('yt-player-web-player-version', 'html5');
            
            // Ensure proper event propagation
            setTimeout(function() {
              const videoElement = document.querySelector('video');
              if (videoElement) {
                // Create proper play/pause controls
                videoElement.addEventListener('canplay', function() {
                  videoElement.play().catch(() => {});
                });
              }
            }, 2000);
          });
        })();
        </script>`);
      modified = true;
    }
  }

  // Generic compatibility fixes for all sites
  if (!text.includes('uv-global-fixes')) {
    text = text.replace(/<head/, `<head>
      <script data-id="uv-global-fixes">
      (function() {
        // Fix for broken event handlers and UI rendering
        window.addEventListener('DOMContentLoaded', function() {
          // Fix any misrendered HTML class attributes
          document.querySelectorAll('[class=""]').forEach(el => {
            if (el.getAttribute('class') === '') {
              el.removeAttribute('class');
            }
          });
          
          // Fix broken buttons
          setTimeout(function() {
            document.querySelectorAll('button').forEach(button => {
              if (!button.onclick && !button.getAttribute('data-fixed')) {
                button.setAttribute('data-fixed', 'true');
                button.addEventListener('click', function(e) {
                  // Let the event propagate normally
                });
              }
            });
          }, 1000);
        });
      })();
      </script>`);
    modified = true;
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
  // Check if the request is within our scope
  if (!event.request.url.startsWith(self.registration.scope) && 
      !event.request.url.includes('/uv/')) {
    return;
  }

  // Handle the fetch event
  event.respondWith((async () => {
    try {
      const url = event.request.url;
      
      // Get response with enhanced fetch
      const response = await enhancedFetch(event);
      
      // Process HTML responses
      if (response && response.headers.get('content-type')?.includes('text/html')) {
        return processHtmlResponse(response, url);
      }
      
      // Return regular response for non-HTML
      return response;
    } catch (err) {
      console.error('[UV Service Worker] Error handling request:', err);
      
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
              max-height: 100px;
              overflow-y: auto;
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
          <script>
            // Auto-reload once after 3 seconds on specific errors
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

// Standard event handlers
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
  // Handle skip waiting
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
