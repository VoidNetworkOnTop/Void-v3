// Simple Scramjet Service Worker - Fixed Version
console.log('=== Scramjet SW Loading ===');

// Basic URL encode/decode functions
const scramjetConfig = {
    encodeUrl: function(url) {
        try {
            return btoa(unescape(encodeURIComponent(url)))
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=/g, "");
        } catch (e) {
            console.error('Encode error:', e);
            return null;
        }
    },
    decodeUrl: function(encodedUrl) {
        try {
            let paddedUrl = encodedUrl.replace(/-/g, "+").replace(/_/g, "/");
            while (paddedUrl.length % 4) paddedUrl += '=';
            return decodeURIComponent(escape(atob(paddedUrl)));
        } catch (e) {
            console.error('Decode error:', e);
            return null;
        }
    }
};

// Set global config
self.__scramjet$config = scramjetConfig;

// Install event
self.addEventListener('install', (event) => {
    console.log('SW: Installing');
    event.waitUntil(self.skipWaiting());
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('SW: Activating');
    event.waitUntil(clients.claim());
});

// THE CRITICAL PART - Fetch event handler
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    console.log('SW: Fetch event for:', url.pathname);
    
    // Only handle scramjet paths
    if (!url.pathname.startsWith('/scramjet/')) {
        console.log('SW: Not scramjet path, skipping');
        return; // Let browser handle normally
    }
    
    console.log('SW: Handling scramjet request:', url.pathname);
    
    // Handle test endpoint
    if (url.pathname === '/scramjet/test') {
        console.log('SW: Responding to test request');
        event.respondWith(
            new Response('Service Worker Test Success!', {
                status: 200,
                headers: { 'content-type': 'text/plain' }
            })
        );
        return;
    }
    
    // Handle proxy requests
    console.log('SW: Handling proxy request for:', url.pathname);
    event.respondWith(handleProxy(event.request));
});

// Proxy handler function
async function handleProxy(request) {
    try {
        const url = new URL(request.url);
        const encodedUrl = url.pathname.replace('/scramjet/', '');
        
        console.log('SW: Encoded URL:', encodedUrl);
        
        if (!encodedUrl) {
            return new Response('No URL provided', { status: 400 });
        }
        
        // Decode target URL
        const targetUrl = scramjetConfig.decodeUrl(encodedUrl);
        console.log('SW: Target URL:', targetUrl);
        
        if (!targetUrl) {
            return new Response('Invalid URL', { status: 400 });
        }
        
        // Validate URL
        let parsedUrl;
        try {
            parsedUrl = new URL(targetUrl);
        } catch (e) {
            return new Response('Invalid target URL', { status: 400 });
        }
        
        console.log('SW: Fetching:', targetUrl);
        
        // Fetch with CORS headers
        const response = await fetch(targetUrl, {
            method: request.method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            mode: 'cors',
            credentials: 'omit'
        });
        
        console.log('SW: Response status:', response.status);
        
        // Get response body
        const responseBody = await response.arrayBuffer();
        
        // Create response headers
        const responseHeaders = new Headers();
        
        // Copy safe headers
        for (const [key, value] of response.headers.entries()) {
            if (!['x-frame-options', 'content-security-policy'].includes(key.toLowerCase())) {
                responseHeaders.set(key, value);
            }
        }
        
        // Add CORS headers
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', '*');
        responseHeaders.set('Access-Control-Allow-Headers', '*');
        
        return new Response(responseBody, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders
        });
        
    } catch (error) {
        console.error('SW: Proxy error:', error);
        return new Response(`Error: ${error.message}`, { 
            status: 500,
            headers: { 'content-type': 'text/plain' }
        });
    }
}

// Message handler
self.addEventListener('message', (event) => {
    console.log('SW: Message:', event.data);
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('=== Scramjet SW Ready ===');
