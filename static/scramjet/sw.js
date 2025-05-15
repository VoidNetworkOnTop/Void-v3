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
    
    // Get the request method
    const method = event.request.method;
    
    // Create the request to the Bare server
    // Instead of trying to recreate the complex UV/Bare protocol,
    // let's use UV directly since it's already working!
    
    // This is the key insight - we'll leverage your existing UV configuration
    // but just substitute our decoded URL
    
    // Use UV's prefix but our decoded URL
    const uvEncodedUrl = __uv$config.encodeUrl(originalUrl);
    const uvUrl = self.location.origin + __uv$config.prefix + uvEncodedUrl;
    
    // Make a standard fetch using UV's encoding
    const response = await fetch(uvUrl, {
      method: method,
      headers: event.request.headers,
      body: method !== 'GET' && method !== 'HEAD' ? await event.request.blob() : undefined,
      redirect: 'follow',
      credentials: 'omit',
      mode: 'same-origin',
      cache: 'no-store',
    });
    
    // Return the response from UV
    return response;
    
  } catch (error) {
    console.error('Scramjet error:', error);
    return new Response(`Scramjet proxy error: ${error.message}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
