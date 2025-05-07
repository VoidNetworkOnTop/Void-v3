/*global UVServiceWorker,__uv$config*/
/*
 * UV Service Worker - Minimal Edition
 * Only adds essential fixes without modifying core behavior
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Simple configuration
const CONFIG = {
  FETCH_TIMEOUT: 120000  // 2 minute timeout
};

// Simple HTML fixes for blank screens
const HTML_FIXES = `
<!-- Minimal UV Fixes -->
<script>
(function() {
  // Fix blank screens
  window.addEventListener('load', function() {
    setTimeout(function() {
      if (document.body) {
        // Check for visible content
        const hasContent = 
          document.body.innerText.trim().length > 20 ||
          document.querySelectorAll('canvas').length > 0 ||
          document.querySelectorAll('img').length > 0;
          
        if (!hasContent) {
          console.log('UV: Page appears blank, attempting recovery');
          
          // Force body to be visible
          document.body.style.background = '#000';
          document.body.style.color = '#fff';
          
          // Create message
          const msg = document.createElement('div');
          msg.style.textAlign = 'center';
          msg.style.padding = '20px';
          msg.style.fontFamily = 'Arial, sans-serif';
          msg.innerHTML = '<h2>Game is loading...</h2><p>If nothing appears, try <a href="#" onclick="window.location.reload()" style="color:#4a6ed3">reloading the page</a></p>';
          document.body.appendChild(msg);
          
          // Create loading indicator
          const loader = document.createElement('div');
          loader.style.width = '40px';
          loader.style.height = '40px';
          loader.style.margin = '20px auto';
          loader.style.border = '4px solid rgba(255,255,255,0.3)';
          loader.style.borderTop = '4px solid white';
          loader.style.borderRadius = '50%';
          
          // Add animation
          const style = document.createElement('style');
          style.textContent = '@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}';
          style.textContent += loader.style.animation = 'spin 1s linear infinite';
          document.head.appendChild(style);
          
          document.body.appendChild(loader);
          
          // Create reload button
          const btn = document.createElement('button');
          btn.textContent = 'Reload Game';
          btn.style.display = 'block';
          btn.style.margin = '20px auto';
          btn.style.padding = '10px 20px';
          btn.style.background = '#4a6ed3';
          btn.style.color = 'white';
          btn.style.border = 'none';
          btn.style.borderRadius = '4px';
          btn.style.cursor = 'pointer';
          btn.onclick = function() {
            window.location.reload();
          };
          document.body.appendChild(btn);
          
          // Force canvas to be visible if it exists
          const canvases = document.querySelectorAll('canvas');
          for (let i = 0; i < canvases.length; i++) {
            canvases[i].style.display = 'block';
            canvases[i].style.margin = '0 auto';
            canvases[i].style.visibility = 'visible';
          }
        }
      }
    }, 5000);
  });
  
  // Fix WebGL
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function() {
    // Try original first
    try {
      return originalGetContext.apply(this, arguments);
    } catch (e) {
      // If failed and this is WebGL, try with modified attributes
      if (arguments[0].includes('webgl')) {
        const contextAttributes = arguments[1] || {};
        contextAttributes.failIfMajorPerformanceCaveat = false;
        return originalGetContext.call(this, arguments[0], contextAttributes);
      }
      throw e;
    }
  };
})();
</script>
`;

// Initialize
console.log('[UV SW] Minimal edition initializing');

// Don't modify core service worker functionality at all
// Just let all requests pass through to the original UV service worker
self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.registration.scope) && 
      !event.request.url.includes('/uv/')) {
    return;
  }

  event.respondWith((async () => {
    try {
      const url = new URL(event.request.url);
      
      // Fetch with a timeout
      const result = await Promise.race([
        sw.fetch(event),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), CONFIG.FETCH_TIMEOUT))
      ]);
      
      // For HTML content, inject minimal fixes
      if (result.headers.get('content-type')?.includes('text/html')) {
        try {
          const text = await result.text();
          
          // Skip UV configuration data
          if (text.includes('__uv$config') || text.includes('__uv$bareData')) {
            return new Response(text, {
              status: result.status,
              statusText: result.statusText,
              headers: result.headers
            });
          }
          
          // Inject our fixes before </body>
          if (text.includes('</body>')) {
            const modifiedText = text.replace('</body>', HTML_FIXES + '</body>');
            return new Response(modifiedText, {
              status: result.status,
              statusText: result.statusText,
              headers: result.headers
            });
          }
        } catch (e) {
          // If modification fails, return original
          console.error('[UV SW] HTML modification failed:', e);
          return result;
        }
      }
      
      return result;
    } catch (error) {
      console.error('[UV SW] Error:', error);
      
      // Simple error page
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Loading Error</title>
          <style>
            body{font-family:Arial;color:#fff;background:#222;text-align:center;padding:40px 20px}
            div{max-width:500px;margin:0 auto;background:#333;padding:20px;border-radius:10px}
            button{background:#4a6ed3;color:#fff;border:none;padding:10px 20px;margin:10px;border-radius:4px;cursor:pointer}
          </style>
        </head>
        <body>
          <div>
            <h2>Game Loading Error</h2>
            <p>The game could not be loaded. The server might be busy.</p>
            <button onclick="window.location.reload()">Try Again</button>
            <button onclick="window.history.back()">Go Back</button>
          </div>
          <script>
            // Auto-reload after 8 seconds
            setTimeout(() => window.location.reload(), 8000);
          </script>
        </body>
        </html>
      `, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    }
  })());
});

// Simple install handler
self.addEventListener('install', event => {
  console.log('[UV SW] Installing minimal edition...');
  self.skipWaiting();
});

// Simple activation handler
self.addEventListener('activate', event => {
  console.log('[UV SW] Activated');
  event.waitUntil(clients.claim());
});
