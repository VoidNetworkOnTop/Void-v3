// Fixed Scramjet Service Worker
console.log('Scramjet Service Worker loading...');

// Import the worker functionality
importScripts('/scramjet/scramjet.worker.js');

let scramjetInstance = null;

// Initialize Scramjet
try {
    if (typeof ScramjetServiceWorker !== 'undefined') {
        scramjetInstance = new ScramjetServiceWorker({
            prefix: '/scramjet/',
            codec: 'plain'
        });
        console.log('Scramjet service worker initialized');
    } else {
        console.error('ScramjetServiceWorker class not found');
    }
} catch (error) {
    console.error('Failed to initialize Scramjet service worker:', error);
}

// Handle fetch events
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Check if this is a Scramjet request
    if (url.pathname.startsWith('/scramjet/')) {
        console.log('Scramjet fetch intercepted:', event.request.url);
        
        if (scramjetInstance && scramjetInstance.route && scramjetInstance.route(event)) {
            console.log('Routing through Scramjet instance');
            event.respondWith(scramjetInstance.fetch(event));
        } else {
            // Fallback handling if Scramjet instance failed
            console.log('Fallback Scramjet handling');
            event.respondWith(handleScramjetRequest(event.request));
        }
    }
});

// Fallback Scramjet request handler
async function handleScramjetRequest(request) {
    try {
        const url = new URL(request.url);
        const pathname = url.pathname;
        
        // Extract the encoded URL from the path
        const encodedUrl = pathname.replace('/scramjet/', '');
        
        if (!encodedUrl) {
            return new Response('No URL provided', { status: 400 });
        }
        
        // Decode the URL
        const decodedUrl = decodeScramjetUrl(encodedUrl);
        
        if (!decodedUrl) {
            return new Response('Invalid encoded URL', { status: 400 });
        }
        
        console.log('Decoded URL:', decodedUrl);
        
        // Fetch the actual content
        const response = await fetch(decodedUrl, {
            method: request.method,
            headers: request.headers,
            body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
            mode: 'cors',
            credentials: 'omit'
        });
        
        // Clone response to modify headers
        const responseBody = await response.arrayBuffer();
        const modifiedHeaders = new Headers(response.headers);
        
        // Remove problematic headers
        modifiedHeaders.delete('x-frame-options');
        modifiedHeaders.delete('content-security-policy');
        modifiedHeaders.delete('content-security-policy-report-only');
        
        // Set CORS headers
        modifiedHeaders.set('access-control-allow-origin', '*');
        modifiedHeaders.set('access-control-allow-methods', '*');
        modifiedHeaders.set('access-control-allow-headers', '*');
        
        return new Response(responseBody, {
            status: response.status,
            statusText: response.statusText,
            headers: modifiedHeaders
        });
        
    } catch (error) {
        console.error('Error handling Scramjet request:', error);
        return new Response(`Scramjet Error: ${error.message}`, { 
            status: 500,
            headers: { 'content-type': 'text/plain' }
        });
    }
}

// URL decoding function
function decodeScramjetUrl(encodedUrl) {
    try {
        // Remove any query parameters or fragments
        const cleanEncoded = encodedUrl.split('?')[0].split('#')[0];
        
        // Restore base64 padding
        let paddedUrl = cleanEncoded.replace(/-/g, "+").replace(/_/g, "/");
        
        // Add proper padding
        while (paddedUrl.length % 4) {
            paddedUrl += '=';
        }
        
        // Decode
        const decoded = atob(paddedUrl);
        return decodeURIComponent(escape(decoded));
    } catch (e) {
        console.error('Error decoding URL:', e, 'Input:', encodedUrl);
        return null;
    }
}

// Handle activate events
self.addEventListener('activate', (event) => {
    console.log('Scramjet service worker activated');
    event.waitUntil(
        clients.claim().then(() => {
            console.log('Scramjet service worker claimed clients');
        })
    );
});

// Handle install events
self.addEventListener('install', (event) => {
    console.log('Scramjet service worker installed');
    event.waitUntil(self.skipWaiting());
});

// Handle messages
self.addEventListener('message', (event) => {
    console.log('Scramjet service worker received message:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('Scramjet Service Worker loaded successfully');
