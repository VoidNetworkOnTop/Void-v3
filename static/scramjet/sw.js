// Scramjet Service Worker - Simplified Version
importScripts('/scramjet/scramjet.config.js');
importScripts('/scramjet/scramjet.bundle.js');

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
    
    // Instead of trying to use your server as a proxy, we'll try using a public CORS proxy
    // This is a simple solution that might work for basic browsing
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`;
    
    // Make the request through the public CORS proxy
    const response = await fetch(proxyUrl);
    
    // If successful, return the response
    if (response.ok) {
      // Create a new response with appropriate headers
      const newHeaders = new Headers();
      
      // Copy safe headers
      for (const [key, value] of response.headers.entries()) {
        if (!['content-security-policy', 'content-encoding', 'content-length'].includes(key.toLowerCase())) {
          newHeaders.set(key, value);
        }
      }
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    } else {
      throw new Error(`Proxy returned error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Scramjet error:', error);
    
    // Create a better error message page
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
              <p>There was an error connecting to the site. This could be due to a CORS restriction or connectivity issue.</p>
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
