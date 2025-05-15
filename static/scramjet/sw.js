// Scramjet Service Worker
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
    
    // Get original request details
    const origRequest = event.request;
    
    // Create a new request to the target URL with no-cors mode to bypass CORS
    const request = new Request(originalUrl, {
      method: origRequest.method,
      headers: origRequest.headers,
      body: origRequest.body,
      mode: 'no-cors', // This is critical for CORS bypass
      credentials: 'omit',
      redirect: 'follow',
    });
    
    // Fetch the target URL
    const response = await fetch(request);
    
    // Return the opaque response
    return response;
  } catch (error) {
    console.error('Scramjet error:', error);
    // Return a better error message
    return new Response(`Scramjet proxy error: ${error.message}. This may be due to CORS restrictions or network issues.`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
}

// Explicitly handle WebSocket upgrade attempts
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Check if it's a WebSocket upgrade request
  if (event.request.headers.get('Upgrade') === 'websocket') {
    // Let the browser handle WebSocket connections directly
    return;
  }
});
