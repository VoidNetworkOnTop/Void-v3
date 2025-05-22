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
    },
    isValidUrl: function(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
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
        let pathSegment = url.pathname.replace('/scramjet/', '');
        
        console.log('SW: Path segment:', pathSegment);
        
        if (!pathSegment) {
            return new Response('No URL provided', { status: 400 });
        }
        
        let targetUrl;
        
        // Check if it's already a plain URL (starts with http)
        if (pathSegment.startsWith('http://') || pathSegment.startsWith('https://')) {
            console.log('SW: Plain URL detected, encoding it');
            targetUrl = pathSegment;
        } else {
            // Try to decode it as base64
            console.log('SW: Trying to decode as base64');
            targetUrl = scramjetConfig.decodeUrl(pathSegment);
            
            if (!targetUrl) {
                console.log('SW: Failed to decode, treating as plain URL');
                targetUrl = pathSegment;
            }
        }
        
        console.log('SW: Target URL:', targetUrl);
        
        // Validate URL
        if (!scramjetConfig.isValidUrl(targetUrl)) {
            return new Response('Invalid target URL: ' + targetUrl, { status: 400 });
        }
        
        console.log('SW: Fetching with CORS mode first:', targetUrl);
        
        let response;
        let fetchError;
        
        // Try CORS first
        try {
            response = await fetch(targetUrl, {
                method: request.method,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Cache-Control': 'no-cache'
                },
                mode: 'cors',
                credentials: 'omit',
                redirect: 'follow'
            });
            
            console.log('SW: CORS fetch successful, status:', response.status);
            
        } catch (corsError) {
            console.log('SW: CORS failed, trying no-cors:', corsError.message);
            fetchError = corsError;
            
            // Fallback to no-cors
            try {
                response = await fetch(targetUrl, {
                    method: 'GET',
                    mode: 'no-cors',
                    credentials: 'omit',
                    cache: 'no-cache'
                });
                
                console.log('SW: No-cors fetch successful');
                
            } catch (noCorsError) {
                console.log('SW: Both CORS and no-cors failed:', noCorsError.message);
                
                // Return a helpful error page
                const errorHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Proxy Error</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 40px; }
                            .error { background: #ffebee; padding: 20px; border-radius: 8px; }
                        </style>
                    </head>
                    <body>
                        <div class="error">
                            <h2>Proxy Error</h2>
                            <p><strong>Failed to fetch:</strong> ${targetUrl}</p>
                            <p><strong>CORS Error:</strong> ${fetchError.message}</p>
                            <p><strong>No-CORS Error:</strong> ${noCorsError.message}</p>
                            <p>This site may not be accessible through the proxy due to CORS restrictions.</p>
                            <button onclick="history.back()">Go Back</button>
                        </div>
                    </body>
                    </html>
                `;
                
                return new Response(errorHtml, {
                    status: 502,
                    headers: { 'content-type': 'text/html' }
                });
            }
        }
        
        // Process response
        let responseBody;
        const contentType = response.headers.get('content-type') || '';
        
        try {
            if (contentType.includes('text/html')) {
                const html = await response.text();
                responseBody = rewriteHtml(html, new URL(targetUrl));
            } else {
                responseBody = await response.arrayBuffer();
            }
        } catch (bodyError) {
            console.warn('SW: Failed to read response body:', bodyError);
            responseBody = 'Failed to read response content';
        }
        
        // Create response headers
        const responseHeaders = new Headers();
        
        // Copy safe headers (skip security headers)
        if (response.headers) {
            for (const [key, value] of response.headers.entries()) {
                const lowerKey = key.toLowerCase();
                if (!['x-frame-options', 'content-security-policy', 'strict-transport-security'].includes(lowerKey)) {
                    responseHeaders.set(key, value);
                }
            }
        }
        
        // Add CORS headers
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', '*');
        responseHeaders.set('Access-Control-Allow-Headers', '*');
        
        // Ensure content type
        if (!responseHeaders.has('content-type')) {
            responseHeaders.set('content-type', contentType || 'text/html');
        }
        
        const finalResponse = new Response(responseBody, {
            status: response.status || 200,
            statusText: response.statusText || 'OK',
            headers: responseHeaders
        });
        
        console.log('SW: Returning response, status:', finalResponse.status);
        return finalResponse;
        
    } catch (error) {
        console.error('SW: Proxy error:', error);
        
        const errorHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Proxy Error</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .error { background: #ffebee; padding: 20px; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="error">
                    <h2>Proxy Error</h2>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p>The proxy encountered an unexpected error.</p>
                    <button onclick="history.back()">Go Back</button>
                </div>
            </body>
            </html>
        `;
        
        return new Response(errorHtml, { 
            status: 500,
            headers: { 'content-type': 'text/html' }
        });
    }
}

// Basic HTML rewriting
function rewriteHtml(html, baseUrl) {
    try {
        // Rewrite relative URLs to absolute
        html = html.replace(/(href|src|action)=["'](?!https?:\/\/|\/\/|#|javascript:|mailto:|data:)([^"']+)["']/gi, 
            (match, attr, url) => {
                try {
                    const absoluteUrl = new URL(url, baseUrl).href;
                    const encodedUrl = scramjetConfig.encodeUrl(absoluteUrl);
                    return `${attr}="/scramjet/${encodedUrl}"`;
                } catch (e) {
                    return match;
                }
            }
        );
        
        // Add base tag
        if (!html.includes('<base')) {
            html = html.replace(/<head>/i, `<head><base href="${baseUrl.href}">`);
        }
        
        return html;
    } catch (e) {
        console.warn('SW: HTML rewriting failed:', e);
        return html;
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
