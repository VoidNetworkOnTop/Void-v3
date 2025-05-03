/*global UVServiceWorker,__uv$config*/
/*
 * Modified service worker script with scope handling.
 * This attempts to work around scope restrictions, but server headers are still recommended.
 */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

// Create the UV service worker
const sw = new UVServiceWorker();

// Log a clear message about the scope issue and how to properly fix it
console.log(
  '%c[UV Service Worker] Important: For optimal functionality, your server should send the header "Service-Worker-Allowed: /" when serving this file.',
  'background: #6200ee; color: white; padding: 4px; border-radius: 4px;'
);

// Modified fetch handler that attempts to work within scope constraints
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Check if this is a navigation request (for a document)
  const isNavigationRequest = 
    event.request.mode === 'navigate' || 
    (event.request.method === 'GET' && 
     event.request.headers.get('accept')?.includes('text/html'));
  
  try {
    // Handle all requests through UV
    event.respondWith(
      (async () => {
        try {
          // Attempt to use the UV service worker to handle the request
          return await sw.fetch(event);
        } catch (err) {
          console.error('[UV Service Worker] Error handling request:', err);
          
          // If this is a navigation request that failed, we might need to inform the user
          if (isNavigationRequest) {
            // Create a response that informs the user about the scope issue
            return new Response(
              `<!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>Service Worker Scope Issue</title>
                  <style>
                    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.5; }
                    pre { background: #f1f1f1; padding: 1rem; border-radius: 4px; overflow-x: auto; }
                    .box { border: 1px solid #ddd; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
                  </style>
                </head>
                <body>
                  <h1>Void Network Service Worker Scope Issue</h1>
                  <p>The UV service worker is unable to intercept requests outside its scope. This is a security restriction enforced by browsers.</p>
                  
                  <div class="box">
                    <h2>For website administrators:</h2>
                    <p>To fix this, add the following HTTP header when serving the service worker file:</p>
                    <pre>Service-Worker-Allowed: /</pre>
                    
                    <p>If using Express.js, add this middleware:</p>
                    <pre>app.get('/uv/sw.js', (req, res, next) => {
  res.set('Service-Worker-Allowed', '/');
  next();
});</pre>
                  </div>
                  
                  <p>Try going back to the <a href="/index.html">home page</a> and reloading.</p>
                </body>
              </html>`,
              {
                status: 200,
                headers: {
                  'Content-Type': 'text/html',
                }
              }
            );
          }
          
          // For non-navigation requests, just return a standard error
          return new Response('Service Worker Error: ' + err.message, { status: 500 });
        }
      })()
    );
  } catch (error) {
    console.error('[UV Service Worker] Critical error:', error);
  }
});

// Add additional listeners for install and activate events
self.addEventListener('install', event => {
  console.log('[UV Service Worker] Installed');
  // Skip waiting to become active immediately
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[UV Service Worker] Activated');
  // Claim clients to control pages immediately
  event.waitUntil(clients.claim());
});
