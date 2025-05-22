// Fixed Scramjet Service Worker
console.log('Scramjet Service Worker loading...');

// Ensure basic config exists as fallback
if (!self.__scramjet$config) {
    self.__scramjet$config = {
        prefix: '/scramjet/',
        codec: 'plain',
        encodeUrl: function(url) {
            try {
                return btoa(unescape(encodeURIComponent(url)))
                    .replace(/\+/g, "-")
                    .replace(/\//g, "_")
                    .replace(/=/g, "");
            } catch (error) {
                console.error('URL encoding failed:', error);
                return null;
            }
        },
        decodeUrl: function(encodedUrl) {
            try {
                let paddedUrl = encodedUrl.replace(/-/g, "+").replace(/_/g, "/");
                while (paddedUrl.length % 4) {
                    paddedUrl += '=';
                }
                return decodeURIComponent(escape(atob(paddedUrl)));
            } catch (error) {
                console.error('URL decoding failed:', error);
                return null;
            }
        }
    };
    console.log('Using fallback Scramjet config');
}

// Import configuration and bundle
try {
    importScripts('/scramjet/scramjet.config.js');
    console.log('Scramjet config loaded');
} catch (error) {
    console.warn('Failed to load scramjet config:', error);
}

try {
    importScripts('/scramjet/scramjet.bundle.js');
    console.log('Scramjet bundle loaded');
} catch (error) {
    console.warn('Failed to load scramjet bundle:', error);
}

// Don't try to import dist worker - it seems to be causing syntax errors
// Instead, use the bundle functionality directly

let scramjetInstance = null;

// Initialize Scramjet using available methods
try {
    if (typeof ScramjetServiceWorker !== 'undefined') {
        scramjetInstance = new ScramjetServiceWorker({
            prefix: '/scramjet/',
            codec: 'plain'
        });
        console.log('Scramjet service worker initialized');
    } else if (self.__scramjet$bundle) {
        console.log('Using Scramjet bundle functionality');
    } else {
        console.log('No Scramjet implementation found, using fallback');
    }
} catch (error) {
    console.warn('Failed to initialize Scramjet service worker, using fallback:', error);
}

// Handle fetch events
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Only handle requests to our scramjet path
    if (!url.pathname.startsWith('/scramjet/')) {
        return;
    }
    
    // Handle static files normally (let server handle them)
    if (url.pathname.includes('.js') || 
        url.pathname.includes('.css') ||
        url.pathname.includes('.ico') ||
        url.pathname.includes('.png') ||
        url.pathname.includes('.jpg') ||
        url.pathname.includes('.gif') ||
        url.pathname === '/scramjet/' ||
        url.pathname === '/scramjet') {
        return;
    }
    
    console.log('Scramjet fetch intercepted:', event.request.url);
    
    // Handle test requests
    if (url.pathname === '/scramjet/test') {
        event.respondWith(new Response('Service Worker Active', {
            status: 200,
            headers: { 'content-type': 'text/plain' }
        }));
        return;
    }
    
    // Try to use Scramjet instance first
    if (scramjetInstance && typeof scramjetInstance.route === 'function' && scramjetInstance.route(event)) {
        console.log('Routing through Scramjet instance');
        event.respondWith(scramjetInstance.fetch(event));
    } else {
        // Use improved fallback handling
        console.log('Using improved fallback Scramjet handling');
        event.respondWith(handleScramjetRequest(event.request));
    }
});

// Improved Scramjet request handler with better CORS handling
async function handleScramjetRequest(request) {
    try {
        const url = new URL(request.url);
        const pathname = url.pathname;
        
        // Extract the encoded URL from the path
        const encodedUrl = pathname.replace('/scramjet/', '');
        
        if (!encodedUrl) {
            return new Response('No URL provided', { 
                status: 400,
                headers: { 'content-type': 'text/plain' }
            });
        }
        
        // Decode the URL
        const decodedUrl = decodeScramjetUrl(encodedUrl);
        
        if (!decodedUrl) {
            return new Response('Invalid encoded URL', { 
                status: 400,
                headers: { 'content-type': 'text/plain' }
            });
        }
        
        console.log('Decoded URL:', decodedUrl);
        
        // Validate the URL
        let targetUrl;
        try {
            targetUrl = new URL(decodedUrl);
        } catch (e) {
            return new Response('Invalid target URL format', { 
                status: 400,
                headers: { 'content-type': 'text/plain' }
            });
        }
        
        // Create request headers with CORS bypass
        const requestHeaders = new Headers();
        
        // Copy safe headers from original request
        for (const [key, value] of request.headers.entries()) {
            if (isSafeRequestHeader(key)) {
                requestHeaders.set(key, value);
            }
        }
        
        // Set headers to bypass CORS
        requestHeaders.set('Origin', targetUrl.origin);
        requestHeaders.set('Referer', targetUrl.href);
        requestHeaders.delete('sec-fetch-site');
        requestHeaders.delete('sec-fetch-mode');
        requestHeaders.delete('sec-fetch-dest');
        
        // Fetch the actual content with improved options
        const fetchOptions = {
            method: request.method,
            headers: requestHeaders,
            mode: 'cors',
            credentials: 'omit',
            cache: 'no-cache',
            redirect: 'follow'
        };
        
        // Add body for POST/PUT requests
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            try {
                fetchOptions.body = await request.arrayBuffer();
            } catch (e) {
                console.warn('Could not read request body:', e);
            }
        }
        
        console.log('Fetching:', decodedUrl, 'with options:', fetchOptions);
        
        let response;
        try {
            response = await fetch(decodedUrl, fetchOptions);
        } catch (fetchError) {
            console.error('Fetch failed:', fetchError);
            
            // Try without CORS mode as fallback
            try {
                const fallbackOptions = {
                    ...fetchOptions,
                    mode: 'no-cors',
                    headers: new Headers() // Minimal headers for no-cors
                };
                response = await fetch(decodedUrl, fallbackOptions);
                console.log('Fallback no-cors fetch succeeded');
            } catch (fallbackError) {
                return new Response(`Failed to fetch: ${fetchError.message}`, {
                    status: 502,
                    headers: { 'content-type': 'text/plain' }
                });
            }
        }
        
        // Process the response based on content type
        const contentType = response.headers.get('content-type') || '';
        let responseBody;
        
        try {
            if (contentType.includes('text/html')) {
                // Process HTML content
                let html = await response.text();
                html = rewriteHtml(html, targetUrl);
                responseBody = html;
            } else if (contentType.includes('text/css')) {
                // Process CSS content
                let css = await response.text();
                css = rewriteCss(css, targetUrl);
                responseBody = css;
            } else if (contentType.includes('application/javascript') || contentType.includes('text/javascript')) {
                // Process JavaScript content
                let js = await response.text();
                js = rewriteJs(js, targetUrl);
                responseBody = js;
            } else {
                // For other content types, pass through as-is
                responseBody = await response.arrayBuffer();
            }
        } catch (e) {
            console.warn('Content processing failed, using original:', e);
            responseBody = await response.arrayBuffer();
        }
        
        // Create response headers
        const responseHeaders = new Headers();
        
        // Copy safe headers from the original response
        for (const [key, value] of response.headers.entries()) {
            if (isSafeResponseHeader(key)) {
                responseHeaders.set(key, value);
            }
        }
        
        // Set CORS headers to allow embedding
        responseHeaders.set('access-control-allow-origin', '*');
        responseHeaders.set('access-control-allow-methods', '*');
        responseHeaders.set('access-control-allow-headers', '*');
        responseHeaders.set('access-control-expose-headers', '*');
        
        // Remove security headers that prevent embedding
        responseHeaders.delete('x-frame-options');
        responseHeaders.delete('content-security-policy');
        responseHeaders.delete('content-security-policy-report-only');
        responseHeaders.delete('strict-transport-security');
        responseHeaders.delete('cross-origin-embedder-policy');
        responseHeaders.delete('cross-origin-opener-policy');
        responseHeaders.delete('cross-origin-resource-policy');
        
        return new Response(responseBody, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders
        });
        
    } catch (error) {
        console.error('Error handling Scramjet request:', error);
        return new Response(`Scramjet Error: ${error.message}`, { 
            status: 500,
            headers: { 
                'content-type': 'text/plain',
                'access-control-allow-origin': '*'
            }
        });
    }
}

// Improved URL decoding function
function decodeScramjetUrl(encodedUrl) {
    try {
        // First try using Scramjet config if available
        if (self.__scramjet$config && typeof self.__scramjet$config.decodeUrl === 'function') {
            return self.__scramjet$config.decodeUrl(encodedUrl);
        }
        
        // Fallback decoding
        let paddedUrl = encodedUrl.replace(/-/g, "+").replace(/_/g, "/");
        
        // Add padding if needed
        while (paddedUrl.length % 4) {
            paddedUrl += '=';
        }
        
        const decoded = decodeURIComponent(escape(atob(paddedUrl)));
        console.log('URL decoded:', encodedUrl, '→', decoded);
        
        return decoded;
        
    } catch (e) {
        console.error('URL decoding failed:', e);
        return null;
    }
}

// Basic HTML rewriting
function rewriteHtml(html, baseUrl) {
    try {
        // Basic rewriting - replace relative URLs
        html = html.replace(/(href|src|action)=["'](?!https?:\/\/|\/\/|#|javascript:|mailto:|data:)([^"']+)["']/gi, 
            (match, attr, url) => {
                try {
                    const absoluteUrl = new URL(url, baseUrl).href;
                    const encodedUrl = encodeScramjetUrl(absoluteUrl);
                    return `${attr}="/scramjet/${encodedUrl}"`;
                } catch (e) {
                    return match; // Return original if URL processing fails
                }
            }
        );
        
        // Inject base tag to help with relative URLs
        html = html.replace(/<head>/i, `<head><base href="${baseUrl.href}">`);
        
        return html;
    } catch (e) {
        console.warn('HTML rewriting failed:', e);
        return html;
    }
}

// Basic CSS rewriting
function rewriteCss(css, baseUrl) {
    try {
        // Replace URLs in CSS
        css = css.replace(/url\(['"]?(?!https?:\/\/|\/\/|data:)([^'"]+)['"]?\)/gi, 
            (match, url) => {
                try {
                    const absoluteUrl = new URL(url, baseUrl).href;
                    const encodedUrl = encodeScramjetUrl(absoluteUrl);
                    return `url("/scramjet/${encodedUrl}")`;
                } catch (e) {
                    return match;
                }
            }
        );
        
        return css;
    } catch (e) {
        console.warn('CSS rewriting failed:', e);
        return css;
    }
}

// Basic JavaScript rewriting
function rewriteJs(js, baseUrl) {
    try {
        // This is a very basic implementation
        // In a full implementation, you'd want proper AST parsing
        return js;
    } catch (e) {
        console.warn('JS rewriting failed:', e);
        return js;
    }
}

// Encode URL for Scramjet
function encodeScramjetUrl(url) {
    try {
        if (self.__scramjet$config && typeof self.__scramjet$config.encodeUrl === 'function') {
            return self.__scramjet$config.encodeUrl(url);
        }
        
        // Fallback encoding
        return btoa(unescape(encodeURIComponent(url)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
    } catch (e) {
        console.error('URL encoding failed:', e);
        return null;
    }
}

// Helper function to check if request header is safe to forward
function isSafeRequestHeader(headerName) {
    const unsafeHeaders = [
        'sec-fetch-site',
        'sec-fetch-mode',
        'sec-fetch-dest',
        'sec-fetch-user',
        'sec-ch-ua',
        'sec-ch-ua-mobile',
        'sec-ch-ua-platform'
    ];
    
    return !unsafeHeaders.includes(headerName.toLowerCase()) &&
           !headerName.toLowerCase().startsWith('sec-');
}

// Helper function to check if response header is safe to forward
function isSafeResponseHeader(headerName) {
    const unsafeHeaders = [
        'x-frame-options',
        'content-security-policy',
        'content-security-policy-report-only',
        'strict-transport-security',
        'cross-origin-embedder-policy',
        'cross-origin-opener-policy',
        'cross-origin-resource-policy',
        'expect-ct',
        'feature-policy',
        'permissions-policy'
    ];
    
    return !unsafeHeaders.includes(headerName.toLowerCase());
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
