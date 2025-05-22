// Simple Scramjet Service Worker
console.log('=== Scramjet Service Worker starting ===');

// Basic config fallback
if (!self.__scramjet$config) {
    self.__scramjet$config = {
        prefix: '/scramjet/',
        encodeUrl: function(url) {
            return btoa(unescape(encodeURIComponent(url)))
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=/g, "");
        },
        decodeUrl: function(encodedUrl) {
            let paddedUrl = encodedUrl.replace(/-/g, "+").replace(/_/g, "/");
            while (paddedUrl.length % 4) paddedUrl += '=';
            return decodeURIComponent(escape(atob(paddedUrl)));
        }
    };
    console.log('Using fallback config');
}

// Try to load config
try {
    importScripts('/scramjet/scramjet.config.js');
    console.log('Loaded scramjet.config.js');
} catch (error) {
    console.warn('Could not load scramjet.config.js, using fallback:', error);
}

// Handle fetch events - this is the critical part
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    console.log('SW: Fetch event for:', url.pathname);
    
    // IMPORTANT: Only handle /scramjet/ paths
    if (!url.pathname.startsWith('/scramjet/')) {
        console.log('SW: Not a scramjet path, ignoring');
        return; // Let browser handle normally
    }
    
    // Skip static files
    if (url.pathname.includes('.js') || 
        url.pathname.includes('.css') ||
        url.pathname.includes('.ico') ||
        url.pathname.includes('.png') ||
        url.pathname.includes('.jpg') ||
        url.pathname.includes('.gif') ||
        url.pathname === '/scramjet/' ||
        url.pathname === '/scramjet') {
        console.log('SW: Static file, ignoring');
        return; // Let browser handle normally
    }
    
    console.log('SW: Intercepting request:', event.request.url);
    
    // Handle test endpoint
    if (url.pathname === '/scramjet/test') {
        console.log('SW: Handling test endpoint');
        event.respondWith(new Response('Service Worker Active - Test Successful!', {
            status: 200,
            headers: { 
                'content-type': 'text/plain',
                'access-control-allow-origin': '*'
            }
        }));
        return;
    }
    
    // Handle proxy requests
    console.log('SW: Handling proxy request');
    event.respondWith(handleProxyRequest(event.request));
});

async function handleProxyRequest(request) {
    console.log('SW: handleProxyRequest called for:', request.url);
    
    try {
        const url = new URL(request.url);
        const encodedUrl = url.pathname.replace('/scramjet/', '');
        
        console.log('SW: Extracted encoded URL:', encodedUrl);
        
        if (!encodedUrl) {
            console.log('SW: No encoded URL found');
            return new Response('No URL provided', { 
                status: 400,
                headers: { 'content-type': 'text/plain' }
            });
        }
        
        // Decode the target URL
        const targetUrl = self.__scramjet$config.decodeUrl(encodedUrl);
        console.log('SW: Decoded target URL:', targetUrl);
        
        if (!targetUrl) {
            console.log('SW: Failed to decode URL');
            return new Response('Invalid encoded URL', { 
                status: 400,
                headers: { 'content-type': 'text/plain' }
            });
        }
        
        // Validate target URL
        let parsedTargetUrl;
        try {
            parsedTargetUrl = new URL(targetUrl);
            console.log('SW: Parsed target URL:', parsedTargetUrl.href);
        } catch (e) {
            console.log('SW: Invalid target URL format:', e);
            return new Response('Invalid target URL', { 
                status: 400,
                headers: { 'content-type': 'text/plain' }
            });
        }
        
        // Prepare request headers
        const requestHeaders = new Headers();
        
        // Copy safe headers
        for (const [key, value] of request.headers.entries()) {
            if (!key.toLowerCase().startsWith('sec-') && 
                key.toLowerCase() !== 'origin' &&
                key.toLowerCase() !== 'referer') {
                requestHeaders.set(key, value);
            }
        }
        
        // Set proper origin
        requestHeaders.set('Origin', parsedTargetUrl.origin);
        requestHeaders.set('Referer', parsedTargetUrl.href);
        requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        console.log('SW: Fetching target URL with headers:', [...requestHeaders.entries()]);
        
        // Fetch the target
        let response;
        try {
            response = await fetch(targetUrl, {
                method: request.method,
                headers: requestHeaders,
                body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
                mode: 'cors',
                credentials: 'omit',
                redirect: 'follow'
            });
            console.log('SW: Fetch successful, status:', response.status);
        } catch (fetchError) {
            console.log('SW: Fetch failed with CORS, trying no-cors:', fetchError);
            
            // Try with no-cors as fallback
            try {
                response = await fetch(targetUrl, {
                    method: 'GET',
                    mode: 'no-cors',
                    credentials: 'omit'
                });
                console.log('SW: No-cors fetch successful');
            } catch (noCorsError) {
                console.log('SW: All fetch attempts failed:', noCorsError);
                return new Response(`Failed to fetch ${targetUrl}: ${fetchError.message}`, {
                    status: 502,
                    headers: { 
                        'content-type': 'text/plain',
                        'access-control-allow-origin': '*'
                    }
                });
            }
        }
        
        // Prepare response headers
        const responseHeaders = new Headers();
        
        // Copy headers if available (won't be available with no-cors)
        if (response.headers) {
            for (const [key, value] of response.headers.entries()) {
                if (!isBlockedHeader(key)) {
                    responseHeaders.set(key, value);
                }
            }
        }
        
        // Set CORS headers
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', '*');
        responseHeaders.set('Access-Control-Allow-Headers', '*');
        responseHeaders.set('Access-Control-Expose-Headers', '*');
        
        // Remove security headers that prevent embedding
        responseHeaders.delete('X-Frame-Options');
        responseHeaders.delete('Content-Security-Policy');
        responseHeaders.delete('Content-Security-Policy-Report-Only');
        responseHeaders.delete('Strict-Transport-Security');
        responseHeaders.delete('Cross-Origin-Embedder-Policy');
        responseHeaders.delete('Cross-Origin-Opener-Policy');
        responseHeaders.delete('Cross-Origin-Resource-Policy');
        
        // Get response body
        let responseBody;
        const contentType = response.headers ? response.headers.get('content-type') || '' : '';
        
        try {
            if (contentType.includes('text/html')) {
                // Basic HTML rewriting
                let html = await response.text();
                html = rewriteHtml(html, parsedTargetUrl);
                responseBody = html;
                console.log('SW: Rewrote HTML content');
            } else {
                responseBody = await response.arrayBuffer();
                console.log('SW: Got binary content, size:', responseBody.byteLength);
            }
        } catch (bodyError) {
            console.log('SW: Failed to read response body:', bodyError);
            responseBody = 'Failed to read response body';
        }
        
        const finalResponse = new Response(responseBody, {
            status: response.status || 200,
            statusText: response.statusText || 'OK',
            headers: responseHeaders
        });
        
        console.log('SW: Returning response with status:', finalResponse.status);
        return finalResponse;
        
    } catch (error) {
        console.error('SW: handleProxyRequest error:', error);
        return new Response(`Proxy Error: ${error.message}`, { 
            status: 500,
            headers: { 
                'content-type': 'text/plain',
                'access-control-allow-origin': '*'
            }
        });
    }
}

function rewriteHtml(html, baseUrl) {
    try {
        console.log('SW: Rewriting HTML for base URL:', baseUrl.href);
        
        // Basic URL rewriting for href and src attributes
        html = html.replace(/(href|src|action)=["'](?!https?:\/\/|\/\/|#|javascript:|mailto:|data:)([^"']+)["']/gi, 
            (match, attr, url) => {
                try {
                    const absoluteUrl = new URL(url, baseUrl).href;
                    const encodedUrl = self.__scramjet$config.encodeUrl(absoluteUrl);
                    const result = `${attr}="/scramjet/${encodedUrl}"`;
                    console.log('SW: Rewrote URL:', url, '→', result);
                    return result;
                } catch (e) {
                    console.log('SW: Failed to rewrite URL:', url, e);
                    return match;
                }
            }
        );
        
        // Add base tag to help with relative URLs
        if (!html.includes('<base')) {
            html = html.replace(/<head>/i, `<head><base href="${baseUrl.href}">`);
            console.log('SW: Added base tag');
        }
        
        return html;
    } catch (e) {
        console.warn('SW: HTML rewriting failed:', e);
        return html;
    }
}

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

// Service worker lifecycle events
self.addEventListener('install', (event) => {
    console.log('SW: Installing...');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('SW: Activating...');
    event.waitUntil(
        clients.claim().then(() => {
            console.log('SW: Claimed all clients');
        })
    );
});

self.addEventListener('message', (event) => {
    console.log('SW: Received message:', event.data);
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('SW: Skipping waiting...');
        self.skipWaiting();
    }
});

console.log('=== Scramjet Service Worker ready ===');// Simple Scramjet Service Worker
console.log('Scramjet Service Worker starting...');

// Basic config fallback
if (!self.__scramjet$config) {
    self.__scramjet$config = {
        prefix: '/scramjet/',
        encodeUrl: function(url) {
            return btoa(unescape(encodeURIComponent(url)))
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=/g, "");
        },
        decodeUrl: function(encodedUrl) {
            let paddedUrl = encodedUrl.replace(/-/g, "+").replace(/_/g, "/");
            while (paddedUrl.length % 4) paddedUrl += '=';
            return decodeURIComponent(escape(atob(paddedUrl)));
        }
    };
}

// Try to load config
try {
    importScripts('/scramjet/scramjet.config.js');
} catch (error) {
    console.warn('Could not load scramjet.config.js, using fallback');
}

// Handle fetch events
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Only handle /scramjet/ requests
    if (!url.pathname.startsWith('/scramjet/')) {
        return;
    }
    
    // Skip static files
    if (url.pathname.includes('.js') || 
        url.pathname.includes('.css') ||
        url.pathname.includes('.ico') ||
        url.pathname === '/scramjet/' ||
        url.pathname === '/scramjet') {
        return;
    }
    
    console.log('Intercepting:', event.request.url);
    
    // Handle test endpoint
    if (url.pathname === '/scramjet/test') {
        event.respondWith(new Response('Service Worker Active', {
            status: 200,
            headers: { 'content-type': 'text/plain' }
        }));
        return;
    }
    
    // Handle proxy requests
    event.respondWith(handleProxyRequest(event.request));
});

async function handleProxyRequest(request) {
    try {
        const url = new URL(request.url);
        const encodedUrl = url.pathname.replace('/scramjet/', '');
        
        if (!encodedUrl) {
            return new Response('No URL provided', { status: 400 });
        }
        
        // Decode the target URL
        const targetUrl = self.__scramjet$config.decodeUrl(encodedUrl);
        if (!targetUrl) {
            return new Response('Invalid encoded URL', { status: 400 });
        }
        
        console.log('Proxying:', targetUrl);
        
        // Validate target URL
        let parsedTargetUrl;
        try {
            parsedTargetUrl = new URL(targetUrl);
        } catch (e) {
            return new Response('Invalid target URL', { status: 400 });
        }
        
        // Prepare request headers
        const requestHeaders = new Headers();
        
        // Copy safe headers
        for (const [key, value] of request.headers.entries()) {
            if (!key.toLowerCase().startsWith('sec-') && 
                key.toLowerCase() !== 'origin' &&
                key.toLowerCase() !== 'referer') {
                requestHeaders.set(key, value);
            }
        }
        
        // Set proper origin
        requestHeaders.set('Origin', parsedTargetUrl.origin);
        requestHeaders.set('Referer', parsedTargetUrl.href);
        
        // Fetch the target
        const response = await fetch(targetUrl, {
            method: request.method,
            headers: requestHeaders,
            body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
            mode: 'cors',
            credentials: 'omit'
        });
        
        // Prepare response
        const responseHeaders = new Headers();
        
        // Copy headers
        for (const [key, value] of response.headers.entries()) {
            if (!isBlockedHeader(key)) {
                responseHeaders.set(key, value);
            }
        }
        
        // Set CORS headers
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', '*');
        responseHeaders.set('Access-Control-Allow-Headers', '*');
        
        // Remove security headers
        responseHeaders.delete('X-Frame-Options');
        responseHeaders.delete('Content-Security-Policy');
        responseHeaders.delete('Content-Security-Policy-Report-Only');
        responseHeaders.delete('Strict-Transport-Security');
        
        // Get response body
        let responseBody;
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('text/html')) {
            // Basic HTML rewriting
            let html = await response.text();
            html = rewriteHtml(html, parsedTargetUrl);
            responseBody = html;
        } else {
            responseBody = await response.arrayBuffer();
        }
        
        return new Response(responseBody, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders
        });
        
    } catch (error) {
        console.error('Proxy error:', error);
        return new Response(`Proxy Error: ${error.message}`, { 
            status: 500,
            headers: { 'content-type': 'text/plain' }
        });
    }
}

function rewriteHtml(html, baseUrl) {
    try {
        // Basic URL rewriting for href and src attributes
        html = html.replace(/(href|src|action)=["'](?!https?:\/\/|\/\/|#|javascript:|mailto:|data:)([^"']+)["']/gi, 
            (match, attr, url) => {
                try {
                    const absoluteUrl = new URL(url, baseUrl).href;
                    const encodedUrl = self.__scramjet$config.encodeUrl(absoluteUrl);
                    return `${attr}="/scramjet/${encodedUrl}"`;
                } catch (e) {
                    return match;
                }
            }
        );
        
        // Add base tag
        html = html.replace(/<head>/i, `<head><base href="${baseUrl.href}">`);
        
        return html;
    } catch (e) {
        console.warn('HTML rewriting failed:', e);
        return html;
    }
}

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

// Service worker lifecycle events
self.addEventListener('install', (event) => {
    console.log('Service worker installed');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('Service worker activated');
    event.waitUntil(clients.claim());
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('Scramjet Service Worker ready');
