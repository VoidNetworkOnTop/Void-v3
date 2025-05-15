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
    
    // We need to use a server-side proxy for this request
    // Since we don't have that, let's use the Bare server that UV uses
    const bareUrl = self.location.origin + '/bare/';
    
    // Create a URL object for easier manipulation
    const targetUrl = new URL(originalUrl);
    
    // Create headers for the Bare server request
    const headers = new Headers();
    headers.set('x-bare-url', originalUrl);
    headers.set('x-bare-host', targetUrl.hostname);
    headers.set('x-bare-protocol', targetUrl.protocol);
    headers.set('x-bare-path', targetUrl.pathname + targetUrl.search);
    headers.set('x-bare-port', targetUrl.port || (targetUrl.protocol === 'https:' ? '443' : '80'));
    headers.set('x-bare-forward-headers', JSON.stringify(['accept', 'accept-encoding', 'accept-language']));
    
    // Copy over original headers that might be useful
    const originalHeaders = event.request.headers;
    for (const [name, value] of originalHeaders.entries()) {
      if (!['host', 'origin', 'referer'].includes(name.toLowerCase())) {
        headers.set(name, value);
      }
    }
    
    // Create the request to the Bare server
    const bareRequest = new Request(bareUrl, {
      method: event.request.method,
      headers: headers,
      body: event.request.body,
      mode: 'cors',
      credentials: 'omit',
      redirect: 'follow'
    });
    
    // Send the request to the Bare server
    const response = await fetch(bareRequest);
    
    // Create a new response with appropriate headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
    
    return newResponse;
  } catch (error) {
    console.error('Scramjet error:', error);
    return new Response(`Scramjet proxy error: ${error.message}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
