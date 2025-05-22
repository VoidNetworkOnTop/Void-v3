// Scramjet Service Worker - Enhanced Version
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

// Install event - force immediate activation
self.addEventListener('install', (event) => {
    console.log('SW: Installing - force activation');
    event.waitUntil(self.skipWaiting());
});

// Activate event - claim all clients immediately
self.addEventListener('activate', (event) => {
    console.log('SW: Activating - claiming clients');
    event.waitUntil(
        clients.claim().then(() => {
            console.log('SW: All clients claimed');
            // Send message to all clients that SW is ready
            return clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'SW_READY' });
                });
            });
        })
    );
});

// Enhanced fetch event handler
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    console.log('SW: Fetch intercepted:', url.pathname);
    
    // Only handle scramjet paths
    if (!url.pathname.startsWith('/scramjet/')) {
        console.log('SW: Not scramjet path, allowing normal fetch');
        return; // Let browser handle normally
    }
    
    console.log('SW: Processing scramjet request:', url.pathname);
    
    // Handle test endpoint
    if (url.pathname === '/scramjet/test') {
        console.log('SW: Serving test response');
        event.respondWith(
            new Response('✅ Service Worker Active and Working!', {
                status: 200,
                headers: { 
                    'content-type': 'text/plain',
                    'access-control-allow-origin': '*'
                }
            })
        );
        return;
    }
    
    // Handle proxy requests
    console.log('SW: Handling proxy request');
    event.respondWith(handleProxyRequest(event.request));
});

// Enhanced proxy handler
async function handleProxyRequest(request) {
    try {
        const url = new URL(request.url);
        let pathSegment = url.pathname.replace('/scramjet/', '');
        
        console.log('SW: Processing path segment:', pathSegment);
        
        if (!pathSegment) {
            return createErrorResponse('No URL provided', 400);
        }
        
        let targetUrl;
        
        // Handle both encoded and plain URLs
        if (pathSegment.startsWith('http://') || pathSegment.startsWith('https://')) {
            console.log('SW: Plain URL detected');
            targetUrl = pathSegment;
        } else {
            console.log('SW: Attempting to decode base64');
            targetUrl = scramjetConfig.decodeUrl(pathSegment);
            
            if (!targetUrl) {
                console.log('SW: Decode failed, trying as plain URL');
                targetUrl = decodeURIComponent(pathSegment);
            }
        }
        
        console.log('SW: Target URL resolved to:', targetUrl);
        
        // Validate URL
        if (!scramjetConfig.isValidUrl(targetUrl)) {
            return createErrorResponse(`Invalid URL: ${targetUrl}`, 400);
        }
        
        // Try multiple fetch strategies
        return await fetchWithFallbacks(targetUrl, request);
        
    } catch (error) {
        console.error('SW: Proxy handler error:', error);
        return createErrorResponse(`Proxy error: ${error.message}`, 500);
    }
}

// Enhanced fetch with multiple fallback strategies
async function fetchWithFallbacks(targetUrl, originalRequest) {
    const strategies = [
        // Strategy 1: Direct CORS fetch
        async () => {
            console.log('SW: Trying direct CORS fetch');
            return await fetch(targetUrl, {
                method: originalRequest.method,
                headers: createProxyHeaders(targetUrl),
                mode: 'cors',
                credentials: 'omit',
                redirect: 'follow',
                cache: 'no-cache'
            });
        },
        
        // Strategy 2: No-CORS fetch
        async () => {
            console.log('SW: Trying no-cors fetch');
            return await fetch(targetUrl, {
                method: 'GET',
                mode: 'no-cors',
                credentials: 'omit',
                cache: 'no-cache'
            });
        },
        
        // Strategy 3: Fetch through a CORS proxy (if available)
        async () => {
            console.log('SW: Trying CORS proxy');
            const proxyUrl = `https://cors-anywhere.herokuapp.com/${targetUrl}`;
            return await fetch(proxyUrl, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                mode: 'cors',
                credentials: 'omit'
            });
        }
    ];
    
    let lastError;
    
    for (const [index, strategy] of strategies.entries()) {
        try {
            console.log(`SW: Attempting strategy ${index + 1}`);
            const response = await strategy();
            
            console.log(`SW: Strategy ${index + 1} succeeded, status:`, response.status);
            
            // Process the response
            return await processResponse(response, targetUrl, index);
            
        } catch (error) {
            console.log(`SW: Strategy ${index + 1} failed:`, error.message);
            lastError = error;
            continue;
        }
    }
    
    // All strategies failed
    console.error('SW: All fetch strategies failed');
    return createErrorResponse(
        `Failed to fetch ${targetUrl}. Last error: ${lastError.message}`,
        502
    );
}

// Process response based on fetch strategy
async function processResponse(response, targetUrl, strategyIndex) {
    const contentType = response.headers.get('content-type') || '';
    let responseBody;
    
    try {
        // For no-cors responses (opaque), we can't read the content
        if (response.type === 'opaque') {
            console.log('SW: Opaque response detected, creating iframe wrapper');
            
            // Create an HTML wrapper that loads the site in an iframe
            const wrapperHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Proxy - ${targetUrl}</title>
                    <style>
                        body, html { 
                            margin: 0; 
                            padding: 0; 
                            height: 100%; 
                            overflow: hidden; 
                        }
                        #frame { 
                            width: 100%; 
                            height: 100vh; 
                            border: none; 
                        }
                        .error {
                            padding: 20px;
                            font-family: Arial, sans-serif;
                            background: #f0f0f0;
                            text-align: center;
                        }
                    </style>
                </head>
                <body>
                    <div class="error">
                        <h3>Loading ${targetUrl}</h3>
                        <p>If the site doesn't load below, it may have CORS restrictions.</p>
                        <a href="${targetUrl}" target="_blank">Open in new tab</a>
                    </div>
                    <iframe id="frame" src="${targetUrl}" 
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
                            onload="document.querySelector('.error').style.display='none'">
                    </iframe>
                </body>
                </html>
            `;
            
            return new Response(wrapperHtml, {
                status: 200,
                headers: {
                    'content-type': 'text/html',
                    'access-control-allow-origin': '*'
                }
            });
        }
        
        // For readable responses
        if (contentType.includes('text/html')) {
            const html = await response.text();
            responseBody = rewriteHtml(html, new URL(targetUrl));
        } else {
            responseBody = await response.arrayBuffer();
        }
        
    } catch (bodyError) {
        console.warn('SW: Failed to read response body:', bodyError);
        
        // Fallback to iframe wrapper
        const fallbackHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Proxy - ${targetUrl}</title>
                <style>
                    body { margin: 0; font-family: Arial, sans-serif; }
                    .container { padding: 20px; text-align: center; }
                    iframe { width: 100%; height: 80vh; border: 1px solid #ccc; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Proxying: ${targetUrl}</h2>
                    <p>Loading content through proxy...</p>
                </div>
                <iframe src="${targetUrl}"></iframe>
            </body>
            </html>
        `;
        
        return new Response(fallbackHtml, {
            status: 200,
            headers: { 'content-type': 'text/html' }
        });
    }
    
    // Create response headers
    const responseHeaders = new Headers();
    
    // Copy safe headers
    if (response.headers) {
        for (const [key, value] of response.headers.entries()) {
            const lowerKey = key.toLowerCase();
            if (!isBlockedHeader(lowerKey)) {
                responseHeaders.set(key, value);
            }
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
}

// Create proxy headers
function createProxyHeaders(targetUrl) {
    const headers = new Headers();
    const parsedUrl = new URL(targetUrl);
    
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    headers.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
    headers.set('Accept-Language', 'en-US,en;q=0.5');
    headers.set('Accept-Encoding', 'gzip, deflate, br');
    headers.set('DNT', '1');
    headers.set('Connection', 'keep-alive');
    headers.set('Upgrade-Insecure-Requests', '1');
    headers.set('Sec-Fetch-Dest', 'document');
    headers.set('Sec-Fetch-Mode', 'navigate');
    headers.set('Sec-Fetch-Site', 'cross-site');
    headers.set('Referer', parsedUrl.origin);
    
    return headers;
}

// Check if header should be blocked
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
    return blocked.includes(headerName);
}

// Basic HTML rewriting
function rewriteHtml(html, baseUrl) {
    try {
        // Rewrite relative URLs
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

// Create error response
function createErrorResponse(message, status = 500) {
    const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Proxy Error</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 40px; 
                    background: #f5f5f5; 
                }
                .error { 
                    background: white; 
                    padding: 30px; 
                    border-radius: 8px; 
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    max-width: 600px;
                    margin: 0 auto;
                }
                .error h2 { color: #d32f2f; }
                button {
                    background: #1976d2;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <div class="error">
                <h2>🚫 Proxy Error</h2>
                <p><strong>Error:</strong> ${message}</p>
                <p>The proxy encountered an error while trying to fetch the requested resource.</p>
                <button onclick="history.back()">Go Back</button>
                <button onclick="location.reload()">Retry</button>
            </div>
        </body>
        </html>
    `;
    
    return new Response(errorHtml, {
        status: status,
        headers: { 
            'content-type': 'text/html',
            'access-control-allow-origin': '*'
        }
    });
}

// Message handler
self.addEventListener('message', (event) => {
    console.log('SW: Received message:', event.data);
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('SW: Skipping waiting state');
        self.skipWaiting();
    }
});

console.log('=== Scramjet SW Ready ===');// Simple Scramjet Service Worker
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
