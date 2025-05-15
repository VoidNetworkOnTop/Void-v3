// Scramjet Service Worker
importScripts('./scramjet.config.js');
importScripts('./scramjet.bundle.js');
importScripts('./scramjet.shared.js');
importScripts('./scramjet.wasm.js');

// Handle fetch events
self.addEventListener('fetch', (event) => {
  // Only handle requests with our prefix
  if (event.request.url.startsWith(self.location.origin + __scramjet$config.prefix)) {
    event.respondWith(handleScramjetRequest(event));
  }
});

async function handleScramjetRequest(event) {
  try {
    // Get the original URL from the request
    const scramjetPath = new URL(event.request.url).pathname.slice(__scramjet$config.prefix.length);
    const originalUrl = __scramjet.decodeUrl(scramjetPath);
    
    // We'll use a CORS proxy
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`;
    
    // Make the request through the proxy
    const response = await fetch(proxyUrl);
    
    // If successful, process the response
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      
      // If it's HTML, we need to rewrite the links
      if (contentType.includes('text/html')) {
        const text = await response.text();
        
        // Rewrite HTML to proxy all resources
        const baseUrl = new URL(originalUrl);
        const proxyPrefix = `${self.location.origin}${__scramjet$config.prefix}`;
        const rewritten = __scramjet$utils.rewriteHtml(
          text,
          baseUrl,
          proxyPrefix,
          __scramjet$config.encodeUrl
        );
        
        return new Response(rewritten, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            'Content-Type': 'text/html',
            'X-Scramjet-Proxied': 'true'
          }
        });
      } 
      // For CSS, rewrite urls
      else if (contentType.includes('text/css')) {
        const text = await response.text();
        const baseUrl = new URL(originalUrl);
        const proxyPrefix = `${self.location.origin}${__scramjet$config.prefix}`;
        const rewritten = __scramjet$utils.rewriteCss(
          text,
          baseUrl,
          proxyPrefix,
          __scramjet$config.encodeUrl
        );
        
        return new Response(rewritten, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            'Content-Type': 'text/css',
            'X-Scramjet-Proxied': 'true'
          }
        });
      }
      // For other resources, pass through as-is
      else {
        return response;
      }
    } else {
      throw new Error(`Proxy returned error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Scramjet error:', error);
    
    // Error message HTML
    const errorHtml = `
      <html>
        <head>
          <title>Scramjet Error</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f0f0f0; }
            .error-container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #e41e3f; margin-top: 0; }
            pre { background: #f7f7f7; padding: 15px; border-radius: 4px; overflow-x: auto; }
            .message { margin-bottom: 20px; }
            .suggestions { margin-top: 20px; }
            .suggestion { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>Scramjet Proxy Error</h1>
            <div class="message">
              <p>There was an error connecting to the site.</p>
              <pre>${error.message}</pre>
            </div>
            <div class="suggestions">
              <p><strong>Try these suggestions:</strong></p>
              <div class="suggestion">- Use the UV proxy instead for this site</div>
              <div class="suggestion">- Check your internet connection</div>
              <div class="suggestion">- Try again later</div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    return new Response(errorHtml, { 
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
