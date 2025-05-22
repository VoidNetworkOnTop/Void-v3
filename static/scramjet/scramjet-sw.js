// Simple Scramjet Service Worker
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
