// Fixed Scramjet Service Worker
console.log('Scramjet Service Worker loading...');

// Import configuration and bundle
importScripts('/scramjet/scramjet.config.js');
importScripts('/scramjet/scramjet.bundle.js');

// Try to import the dist worker file, fallback to bundle
try {
    importScripts('/scramjet/dist/scramjet.worker.js');
    console.log('Scramjet dist worker imported successfully');
} catch (error) {
    console.warn('Failed to import dist worker, using bundle:', error);
}

let scramjetInstance = null;

// Initialize Scramjet using the bundle
try {
    if (typeof ScramjetServiceWorker !== 'undefined') {
        scramjetInstance = new ScramjetServiceWorker({
            prefix: '/scramjet/',
            codec: 'plain'
        });
        console.log('Scramjet service worker initialized');
    } else if (self.__scramjet$bundle) {
        // Use bundle functionality
        console.log('Using Scramjet bundle functionality');
    } else {
        console.error('No Scramjet implementation found');
    }
} catch (error) {
    console.error('Failed to initialize Scramjet service worker:', error);
}

// Handle fetch events
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Skip non-proxy requests
    if (!url.pathname.startsWith('/scramjet/') || 
        url.pathname.includes('.js') || 
        url.pathname.includes('.css') ||
        url.pathname === '/scramjet/' ||
        url.pathname === '/scramjet') {
        return;
    }
    
    console.log('Scramjet fetch intercepted:', event.request.url);
    
    if (scramjetInstance && scramjetInstance.route && scramjetInstance.route(event)) {
        console.log('Routing through Scramjet instance');
        event.respondWith(scramjetInstance.fetch(event));
    } else {
        // Fallback handling using bundle
        console.log('Fallback Scramjet handling');
        event.respondWith(handleScramjetRequest(event.request));
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
        
        // Decode the URL using the config
        let decodedUrl;
        if (self.__scramjet$config && self.__scramjet$config.decodeUrl) {
            decodedUrl = self.__scramjet$config.decodeUrl(encodedUrl);
        } else {
            // Fallback decoding
            try {
                let paddedUrl = encodedUrl.replace(/-/g, "+").replace(/_/g, "/");
                while (paddedUrl.length % 4) {
                    paddedUrl += '=';
                }
                decodedUrl = decodeURIComponent(escape(atob(paddedUrl)));
            } catch (e) {
                console.error('Fallback decode failed:', e);
                return new Response('Invalid encoded URL', { status: 400 });
            }
        }
        
        if (!decodedUrl) {
            return new Response('Invalid encoded URL', { status: 400 });
        }
        
        console.log('Decoded URL:', decodedUrl);
        
        // Validate the URL
        try {
            new URL(decodedUrl);
        } catch (e) {
            return new Response('Invalid target URL', { status: 400 });
        }
        
        // Fetch the actual content
        const response = await fetch(decodedUrl, {
            method: request.method,
            headers: cleanHeaders(request.headers),
            body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
            mode: 'cors',
            credentials: 'omit'
        });
        
        // Process the response
        let responseBody;
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('text/html')) {
            // Rewrite HTML content
            let html = await response.text();
            if (self.__scramjet$bundle && self.__scramjet$bundle.rewriters.rewriteHtml) {
                html = self.__scramjet$bundle.rewriters.rewriteHtml(html, new URL(decodedUrl));
            }
            responseBody = html;
        } else {
            responseBody = await response.arrayBuffer();
        }
        
        // Set up response headers
        const modifiedHeaders = new Headers();
        
        // Copy safe headers
        for (const [key, value] of response.headers.entries()) {
            if (!isBlockedHeader(key)) {
                modifiedHeaders.set(key, value);
            }
        }
        
        // Set security headers
        modifiedHeaders.set('access-control-allow-origin', '*');
        modifiedHeaders.set('access-control-allow-methods', '*');
        modifiedHeaders.set('access-control-allow-headers', '*');
        modifiedHeaders.delete('x-frame-options');
        modifiedHeaders.delete('content-security-policy');
        modifiedHeaders.delete('content-security-policy-report-only');
        modifiedHeaders.delete('strict-transport-security');
        
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

// Helper function to clean request headers
function cleanHeaders(headers) {
    const cleanedHeaders = new Headers();
    
    for (const [key, value] of headers.entries()) {
        // Skip problematic headers
        if (!key.toLowerCase().startsWith('sec-') && 
            key.toLowerCase() !== 'origin' &&
            key.toLowerCase() !== 'referer') {
            cleanedHeaders.set(key, value);
        }
    }
    
    return cleanedHeaders;
}

// Helper function to check if header should be blocked
function isBlockedHeader(headerName) {
    const blocked = [
        'x-frame-options',
        'content-security-policy',
        'content-security-policy-report-only',
        'strict-transport-security',
        'cross-origin-embedder-policy',
        'cross-origin-opener-policy',
        'cross-origin-resource-policy'
    ];
    
    return blocked.includes(headerName.toLowerCase());
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
