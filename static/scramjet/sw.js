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
    
    // Parse the original URL
    const url = new URL(originalUrl);
    
    // Determine the request method
    const method = event.request.method;
    
    // Create a Bare request to the /bare/v1/ endpoint
    const bareServer = self.location.origin + '/bare/v1/';
    
    // Need to create the Bare meta object
    const bare = {
      path: url.pathname + url.search,
      host: url.hostname,
      protocol: url.protocol,
      headers: {}
    };
    
    // Copy over original headers
    const originalHeaders = event.request.headers;
    for (const [name, value] of originalHeaders.entries()) {
      if (!['host', 'origin'].includes(name.toLowerCase())) {
        bare.headers[name.toLowerCase()] = value;
      }
    }
    
    // Set proper bare headers
    bare.headers['host'] = url.hostname;
    if (url.port) {
      bare.headers['host'] += ':' + url.port;
    }
    
    // Create the final Bare request
    const bareRequest = new Request(bareServer, {
      method: 'GET',
      headers: {
        'x-bare-url': originalUrl,
        'x-bare-headers': JSON.stringify(bare.headers),
        'x-bare-forward-headers': JSON.stringify(['accept', 'accept-encoding', 'accept-language']),
      },
      redirect: 'follow'
    });
    
    // Make the request through the Bare server
    const response = await fetch(bareRequest);
    
    if (!response.ok) {
      // If the Bare server response isn't OK, display the error
      const text = await response.text();
      throw new Error(`Bare server returned error: ${response.status} ${text}`);
    }
    
    // Extract and process the Bare response headers
    const responseHeaders = new Headers();
    const bareHeaders = JSON.parse(response.headers.get('x-bare-headers') || '{}');
    
    // Copy Bare headers to our response
    for (const header in bareHeaders) {
      if (header !== 'content-encoding' && header !== 'content-length') {
        responseHeaders.set(header, bareHeaders[header]);
      }
    }
    
    // Create the final response
    return new Response(response.body, {
      status: response.headers.get('x-bare-status'),
      statusText: response.headers.get('x-bare-status-text'),
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
