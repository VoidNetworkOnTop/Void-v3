/global UVServiceWorker,__uv$config/
/*
 * Core Ultraviolet service worker with simplified handling
 * for better compatibility with bare server
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker with original handling
const sw = new UVServiceWorker();

// Main fetch event handler - keep this simple for best compatibility
self.addEventListener('fetch', event => {
  if (event.request.url.startsWith(self.registration.scope)) {
    event.respondWith((async () => {
      try {
        // Use the native UV fetch with minimal modification
        return await sw.fetch(event);
      } catch (err) {
        console.error('[UV Service Worker] Error in fetch:', err);
        
        // Simple error page
        return new Response(
          `<!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Connection Error</title>
            <style>
              body { font-family: sans-serif; background: #222; color: white; padding: 20px; }
              .container { max-width: 600px; margin: 40px auto; background: #333; border-radius: 8px; padding: 20px; }
              button { padding: 10px 16px; background: #4a6ed3; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Connection Error</h2>
              <p>The service encountered an error: ${err.message}</p>
              <p>This might be due to network issues or the site blocking proxy access.</p>
              <div>
                <button onclick="window.location.reload()">Try Again</button>
                <button onclick="window.history.back()">Go Back</button>
              </div>
            </div>
            <script>
              // Auto-reload for empty responses
              if (document.body.innerText.includes("undefined") || 
                  document.body.innerText.includes("null")) {
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
  }
});

// Standard handlers - keep these simple
self.addEventListener('install', event => {
  console.log('[UV Service Worker] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[UV Service Worker] Activated');
  event.waitUntil(clients.claim());
});

// Handle messages
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
