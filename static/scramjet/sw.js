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

        // Create a new request to the target URL
        const request = new Request(originalUrl, {
            method: event.request.method,
            headers: event.request.headers,
            body: event.request.body,
            mode: 'cors',
            credentials: 'omit',
            redirect: 'follow',
        });

        // Fetch the target URL
        const response = await fetch(request);

        // Create a new response with CORS headers
        const newResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });

        return newResponse;
    } catch (error) {
        console.error('Scramjet error:', error);
        return new Response(`Scramjet proxy error: ${error.message}`, { status: 500 });
    }
}

// Handle WebSocket connections
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Check if it's a WebSocket connection attempt
    if (url.pathname.startsWith(__scramjet$config.prefix) &&
        (url.protocol === 'ws:' || url.protocol === 'wss:' ||
            event.request.headers.get('Upgrade') === 'websocket')) {

        // Let the browser handle WebSocket connections directly
        // The service worker will be bypassed for these connections
        return;
    }
});