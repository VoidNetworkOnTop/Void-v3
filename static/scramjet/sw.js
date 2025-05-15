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
    
    // Parse the URL
    const url = new URL(originalUrl);
    
    // Create direct request to the Bare server v1 endpoint
    const bareServerUrl = self.location.origin + '/bare/v1/';
    
    // Collect request headers (excluding those that would break proxying)
    const requestHeaders = {};
    for (const [key, value] of event.request.headers.entries()) {
      if (!['host', 'origin', 'referer', 'content-length'].includes(key.toLowerCase())) {
        requestHeaders[key.toLowerCase()] = value;
      }
    }
    
    // Add host header for the target
    requestHeaders['host'] = url.host;
    
    // Create the Bare server request headers
    const bareHeaders = new Headers();
    bareHeaders.set('x-bare-url', originalUrl);
    bareHeaders.set('x-bare-headers', JSON.stringify(requestHeaders));
    bareHeaders.set('x-bare-forward-headers', JSON.stringify(['accept', 'accept-language', 'user-agent']));
    bareHeaders.set('Content-Type', 'application/json');
    
    // Create Bare request
    const bareRequest = new Request(bareServerUrl, {
      method: 'GET',  // Using GET for initial request
      headers: bareHeaders,
      mode: 'cors',
      redirect: 'manual', // Handle redirects manually
    });
    
    // Send the request to the Bare server
    const response = await fetch(bareRequest);
    
    // Check if the Bare server responded correctly
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bare server error: ${response.status} ${errorText}`);
    }
    
    // Process the Bare server response
    const bareStatus = response.headers.get('x-bare-status');
    const bareStatusText = response.headers.get('x-bare-status-text') || '';
    const bareHeadersJson = response.headers.get('x-bare-headers');
    
    let responseHeaders = new Headers();
    
    // Add response headers from the bare server
    if (bareHeadersJson) {
      try {
        const bareResponseHeaders = JSON.parse(bareHeadersJson);
        for (const key in bareResponseHeaders) {
          // Skip problematic headers
          if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
            responseHeaders.set(key, bareResponseHeaders[key]);
          }
        }
      } catch (e) {
        console.error('Error parsing bare headers:', e);
      }
    }
    
    // Create the final response with the correct status and headers
    return new Response(response.body, {
      status: bareStatus ? parseInt(bareStatus) : response.status,
      statusText: bareStatusText,
      headers: responseHeaders
    });
    
  } catch (error) {
    console.error('Scramjet error:', error);
    return new Response(`Scramjet proxy error: ${error.message}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
