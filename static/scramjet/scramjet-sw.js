// Simplified Working Scramjet Service Worker
console.log('=== Simplified Working Scramjet SW Loading ===');

// URL encode/decode functions
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

self.__scramjet$config = scramjetConfig;

// Install and activate events
self.addEventListener('install', (event) => {
    console.log('SW: Installing');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('SW: Activating');
    event.waitUntil(clients.claim());
});

// Main fetch handler
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    if (!url.pathname.startsWith('/scramjet/')) {
        return;
    }
    
    console.log('SW: Handling scramjet request:', url.pathname);
    
    if (url.pathname === '/scramjet/test') {
        event.respondWith(
            new Response('Service Worker Test Success!', {
                status: 200,
                headers: { 'content-type': 'text/plain' }
            })
        );
        return;
    }
    
    event.respondWith(handleProxy(event.request));
});

// Simplified proxy handler
async function handleProxy(request) {
    try {
        const url = new URL(request.url);
        let pathSegment = url.pathname.replace('/scramjet/', '');
        
        console.log('SW: Processing path segment:', pathSegment);
        
        if (!pathSegment) {
            return new Response('No URL provided', { status: 400 });
        }
        
        let targetUrl;
        
        if (pathSegment.startsWith('http://') || pathSegment.startsWith('https://')) {
            targetUrl = pathSegment;
        } else {
            targetUrl = scramjetConfig.decodeUrl(pathSegment);
            if (!targetUrl) {
                targetUrl = pathSegment.startsWith('http') ? pathSegment : 'https://' + pathSegment;
            }
        }
        
        console.log('SW: Target URL:', targetUrl);
        
        if (!scramjetConfig.isValidUrl(targetUrl)) {
            return new Response('Invalid target URL: ' + targetUrl, { status: 400 });
        }
        
        // Use backend proxy with explicit request for uncompressed content
        const proxyUrl = `/scram?url=${encodeURIComponent(targetUrl)}`;
        console.log('SW: Proxying through backend:', proxyUrl);
        
        const proxyRequest = new Request(proxyUrl, {
            method: request.method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'identity', // Request uncompressed content
                'Cache-Control': 'no-cache'
            },
            body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
            mode: 'same-origin',
            credentials: 'same-origin'
        });
        
        const response = await fetch(proxyRequest);
        
        if (!response.ok) {
            throw new Error(`Backend proxy failed: ${response.status} ${response.statusText}`);
        }
        
        return await processResponse(response, targetUrl, request);
        
    } catch (error) {
        console.error('SW: Proxy error:', error);
        return createErrorResponse('Proxy error', request.url, error);
    }
}

// Process response
async function processResponse(response, targetUrl, originalRequest) {
    const baseUrl = new URL(targetUrl);
    const contentType = response.headers.get('content-type') || '';
    
    console.log('SW: Processing response, content-type:', contentType);
    
    // Create response headers
    const responseHeaders = new Headers();
    
    // Skip problematic headers
    const skipHeaders = [
        'content-security-policy', 'content-security-policy-report-only',
        'x-frame-options', 'x-content-type-options', 'strict-transport-security',
        'referrer-policy', 'permissions-policy', 'cross-origin-embedder-policy',
        'cross-origin-opener-policy', 'cross-origin-resource-policy',
        'content-encoding', 'transfer-encoding'
    ];
    
    for (const [key, value] of response.headers.entries()) {
        if (!skipHeaders.includes(key.toLowerCase())) {
            responseHeaders.set(key, value);
        }
    }
    
    // Add permissive headers
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', '*');
    responseHeaders.set('Access-Control-Allow-Headers', '*');
    responseHeaders.set('X-Frame-Options', 'ALLOWALL');
    
    let processedContent;
    
    try {
        if (contentType.includes('text/html') || 
            contentType.includes('application/xhtml') ||
            (!contentType && originalRequest.headers.get('Accept')?.includes('text/html'))) {
            
            console.log('SW: Processing as HTML');
            const htmlText = await response.text();
            processedContent = rewriteHtml(htmlText, baseUrl);
            responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
            
        } else if (contentType.includes('text/css')) {
            console.log('SW: Processing as CSS');
            const cssText = await response.text();
            processedContent = rewriteCss(cssText, baseUrl);
            
        } else if (contentType.includes('javascript')) {
            console.log('SW: Processing as JavaScript');
            const jsText = await response.text();
            processedContent = jsText; // Basic passthrough for now
            
        } else {
            console.log('SW: Passing through as binary content');
            processedContent = await response.arrayBuffer();
        }
        
    } catch (contentError) {
        console.warn('SW: Content processing failed:', contentError);
        processedContent = await response.arrayBuffer();
    }
    
    return new Response(processedContent, {
        status: response.status || 200,
        statusText: response.statusText || 'OK',
        headers: responseHeaders
    });
}

// Simplified HTML rewriting
function rewriteHtml(html, baseUrl) {
    try {
        console.log('SW: Rewriting HTML content');
        
        // Remove security headers
        html = html.replace(/<meta[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/gi, '');
        html = html.replace(/<meta[^>]*name=["']?referrer["']?[^>]*>/gi, '');
        
        // Simple URL rewriting for common attributes
        const urlAttributes = ['href', 'src', 'action'];
        
        for (const attr of urlAttributes) {
            const regex = new RegExp(`(${attr})=["']([^"']+)["']`, 'gi');
            html = html.replace(regex, (match, attribute, url) => {
                const rewrittenUrl = rewriteUrl(url, baseUrl);
                return `${attribute}="${rewrittenUrl}"`;
            });
        }
        
        // Simple proxy script without location override
        const proxyScript = `
        <script>
        (function() {
            console.log('Simple Scramjet proxy loaded for:', '${baseUrl.origin}');
            
            function encodeProxyUrl(url) {
                if (!url || typeof url !== 'string') return url;
                if (url.startsWith('/scramjet/') || url.startsWith('data:') || 
                    url.startsWith('javascript:') || url.startsWith('mailto:') || 
                    url.startsWith('#') || url.startsWith('blob:')) return url;
                
                try {
                    let fullUrl;
                    if (url.startsWith('//')) {
                        fullUrl = '${baseUrl.protocol}' + url;
                    } else if (url.startsWith('/')) {
                        fullUrl = '${baseUrl.origin}' + url;
                    } else if (url.startsWith('http://') || url.startsWith('https://')) {
                        fullUrl = url;
                    } else {
                        fullUrl = new URL(url, '${baseUrl.href}').href;
                    }
                    
                    const encoded = btoa(unescape(encodeURIComponent(fullUrl)))
                        .replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=/g, "");
                    return '/scramjet/' + encoded;
                } catch (e) {
                    console.warn('URL encoding failed:', url, e);
                    return url;
                }
            }
            
            // Override window.open
            const originalOpen = window.open;
            window.open = function(url, ...args) {
                return originalOpen.call(this, encodeProxyUrl(url), ...args);
            };
            
            // Override fetch
            const originalFetch = window.fetch;
            window.fetch = function(input, init) {
                if (typeof input === 'string') {
                    return originalFetch.call(this, encodeProxyUrl(input), init);
                }
                return originalFetch.apply(this, arguments);
            };
            
            // Handle clicks on links
            document.addEventListener('click', function(e) {
                const anchor = e.target.closest('a');
                if (anchor && anchor.href && !anchor.href.startsWith('/scramjet/')) {
                    e.preventDefault();
                    const proxyHref = encodeProxyUrl(anchor.href);
                    if (anchor.target === '_blank') {
                        window.open(proxyHref);
                    } else {
                        window.location.href = proxyHref;
                    }
                }
            }, true);
            
            // Simple location info (read-only)
            window.__scramjet_info = {
                realUrl: '${baseUrl.href}',
                realOrigin: '${baseUrl.origin}',
                realHost: '${baseUrl.host}'
            };
            
        })();
        </script>`;
        
        // Inject script
        if (html.includes('</head>')) {
            html = html.replace('</head>', proxyScript + '</head>');
        } else if (html.includes('</body>')) {
            html = html.replace('</body>', proxyScript + '</body>');
        } else {
            html += proxyScript;
        }
        
        return html;
        
    } catch (error) {
        console.error('SW: HTML rewriting failed:', error);
        return html;
    }
}

// Simple CSS rewriting
function rewriteCss(css, baseUrl) {
    try {
        return css.replace(/url\(\s*['"]?([^'")\s]+)['"]?\s*\)/gi, (match, url) => {
            const rewrittenUrl = rewriteUrl(url, baseUrl);
            return `url("${rewrittenUrl}")`;
        });
    } catch (error) {
        return css;
    }
}

// URL rewriting helper
function rewriteUrl(url, baseUrl) {
    try {
        if (url.startsWith('/scramjet/') || url.startsWith('data:') || 
            url.startsWith('javascript:') || url.startsWith('mailto:') || 
            url.startsWith('#') || url.startsWith('blob:')) {
            return url;
        }
        
        let absoluteUrl;
        if (url.startsWith('//')) {
            absoluteUrl = baseUrl.protocol + url;
        } else if (url.startsWith('/')) {
            absoluteUrl = baseUrl.origin + url;
        } else if (url.startsWith('http://') || url.startsWith('https://')) {
            absoluteUrl = url;
        } else {
            absoluteUrl = new URL(url, baseUrl).href;
        }
        
        const encodedUrl = scramjetConfig.encodeUrl(absoluteUrl);
        return `/scramjet/${encodedUrl}`;
        
    } catch (error) {
        console.warn('SW: URL rewriting failed for:', url);
        return url;
    }
}

// Error response
function createErrorResponse(title, url, ...errors) {
    const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Proxy Error</title></head>
        <body>
            <h2>🚫 ${title}</h2>
            <p><strong>Failed to load:</strong> ${url}</p>
            <p>Error: ${errors.map(e => e.message || e).join(', ')}</p>
            <button onclick="history.back()">← Go Back</button>
            <button onclick="location.reload()">🔄 Retry</button>
        </body>
        </html>
    `;
    
    return new Response(errorHtml, {
        status: 502,
        headers: { 'content-type': 'text/html; charset=utf-8' }
    });
}

// Message handler
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('=== Simplified Working Scramjet SW Ready ===');
