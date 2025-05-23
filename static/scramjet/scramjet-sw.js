// Fixed Scramjet Service Worker with Backend Proxy Integration
console.log('=== Fixed Scramjet SW Loading ===');

// Enhanced URL encode/decode functions
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

// Main fetch event handler
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Only handle scramjet paths
    if (!url.pathname.startsWith('/scramjet/')) {
        return; // Let browser handle normally
    }
    
    console.log('SW: Handling scramjet request:', url.pathname);
    
    // Handle test endpoint
    if (url.pathname === '/scramjet/test') {
        event.respondWith(
            new Response('Service Worker Test Success!', {
                status: 200,
                headers: { 'content-type': 'text/plain' }
            })
        );
        return;
    }
    
    // Handle proxy requests
    event.respondWith(handleProxy(event.request));
});

// Main proxy handler - uses backend proxy endpoint
async function handleProxy(request) {
    try {
        const url = new URL(request.url);
        let pathSegment = url.pathname.replace('/scramjet/', '');
        
        console.log('SW: Processing path segment:', pathSegment);
        
        if (!pathSegment) {
            return new Response('No URL provided', { status: 400 });
        }
        
        let targetUrl;
        
        // Check if it's already a plain URL (starts with http)
        if (pathSegment.startsWith('http://') || pathSegment.startsWith('https://')) {
            targetUrl = pathSegment;
        } else {
            // Try to decode it as base64
            targetUrl = scramjetConfig.decodeUrl(pathSegment);
            
            if (!targetUrl) {
                // Fallback: treat as direct URL
                if (!pathSegment.startsWith('http')) {
                    targetUrl = 'https://' + pathSegment;
                } else {
                    targetUrl = pathSegment;
                }
            }
        }
        
        console.log('SW: Target URL:', targetUrl);
        
        // Validate URL
        if (!scramjetConfig.isValidUrl(targetUrl)) {
            return new Response('Invalid target URL: ' + targetUrl, { status: 400 });
        }
        
        // Use backend proxy endpoint instead of direct fetch
        const proxyEndpoint = '/scram';
        const proxyUrl = `${proxyEndpoint}?url=${encodeURIComponent(targetUrl)}`;
        
        console.log('SW: Proxying through backend:', proxyUrl);
        
        // Forward the request to our backend proxy
        const proxyRequest = new Request(proxyUrl, {
            method: request.method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': request.headers.get('Accept') || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'X-Proxy-Target': targetUrl,
                'X-Proxy-Origin': url.origin
            },
            body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
            mode: 'same-origin',
            credentials: 'same-origin',
            redirect: 'follow'
        });
        
        const response = await fetch(proxyRequest);
        
        if (!response.ok) {
            throw new Error(`Backend proxy failed: ${response.status} ${response.statusText}`);
        }
        
        // Process the response
        return await processResponse(response, targetUrl, request);
        
    } catch (error) {
        console.error('SW: Proxy error:', error);
        return createErrorResponse('Proxy error', request.url, error);
    }
}

// Enhanced response processing
async function processResponse(response, targetUrl, originalRequest) {
    const baseUrl = new URL(targetUrl);
    const contentType = response.headers.get('content-type') || '';
    
    console.log('SW: Processing response, content-type:', contentType);
    
    // Create response headers
    const responseHeaders = new Headers();
    
    // Copy safe headers
    const skipHeaders = [
        'content-security-policy',
        'content-security-policy-report-only',
        'x-frame-options',
        'x-content-type-options',
        'strict-transport-security',
        'referrer-policy',
        'permissions-policy',
        'cross-origin-embedder-policy',
        'cross-origin-opener-policy',
        'cross-origin-resource-policy',
        'content-encoding',
        'transfer-encoding'
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
    
    // Process content based on type
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
            responseHeaders.set('Content-Type', 'text/css');
            
        } else if (contentType.includes('application/javascript') || 
                   contentType.includes('text/javascript')) {
            console.log('SW: Processing as JavaScript');
            const jsText = await response.text();
            processedContent = rewriteJavaScript(jsText, baseUrl);
            responseHeaders.set('Content-Type', 'application/javascript');
            
        } else {
            // For other content types, pass through as-is
            console.log('SW: Passing through as binary content');
            processedContent = await response.arrayBuffer();
        }
        
    } catch (contentError) {
        console.warn('SW: Content processing failed:', contentError);
        try {
            processedContent = await response.arrayBuffer();
        } catch (fallbackError) {
            console.error('SW: Fallback content reading failed:', fallbackError);
            processedContent = 'Content could not be processed';
            responseHeaders.set('Content-Type', 'text/plain');
        }
    }
    
    return new Response(processedContent, {
        status: response.status || 200,
        statusText: response.statusText || 'OK',
        headers: responseHeaders
    });
}

// Enhanced HTML rewriting with better proxy injection
function rewriteHtml(html, baseUrl) {
    try {
        console.log('SW: Rewriting HTML content');
        
        // Remove problematic meta tags and headers
        html = html.replace(/<meta[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/gi, '');
        html = html.replace(/<meta[^>]*name=["']?referrer["']?[^>]*>/gi, '');
        html = html.replace(/<meta[^>]*name=["']?viewport["']?[^>]*>/gi, '');
        
        // Add our own viewport meta
        const viewportMeta = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
        
        // Rewrite URLs in various attributes
        const urlAttributes = [
            'href', 'src', 'action', 'formaction', 'data-src', 'data-href', 'data-url'
        ];
        
        for (const attr of urlAttributes) {
            const regex = new RegExp(`(${attr})=["']([^"']+)["']`, 'gi');
            html = html.replace(regex, (match, attribute, url) => {
                const rewrittenUrl = rewriteUrl(url, baseUrl);
                return `${attribute}="${rewrittenUrl}"`;
            });
        }
        
        // Rewrite srcset attributes
        html = html.replace(/srcset=["']([^"']+)["']/gi, (match, srcset) => {
            const rewrittenSrcset = rewriteSrcset(srcset, baseUrl);
            return `srcset="${rewrittenSrcset}"`;
        });
        
        // Rewrite inline styles
        html = html.replace(/style=["']([^"']+)["']/gi, (match, style) => {
            const rewrittenStyle = rewriteCss(style, baseUrl);
            return `style="${rewrittenStyle}"`;
        });
        
        // Rewrite style tags
        html = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
            const rewrittenCss = rewriteCss(css, baseUrl);
            return match.replace(css, rewrittenCss);
        });
        
        // Enhanced proxy script with more comprehensive overrides
        const proxyScript = `
        <script>
        (function() {
            console.log('Scramjet proxy script loaded for:', '${baseUrl.origin}');
            
            // Helper function to encode URLs for proxy
            function encodeProxyUrl(url) {
                if (!url || typeof url !== 'string') return url;
                
                // Skip if already proxied
                if (url.startsWith('/scramjet/')) return url;
                
                // Skip special URLs
                if (url.startsWith('data:') || url.startsWith('javascript:') || 
                    url.startsWith('mailto:') || url.startsWith('#') || 
                    url.startsWith('blob:') || url.startsWith('about:')) {
                    return url;
                }
                
                try {
                    let fullUrl;
                    if (url.startsWith('//')) {
                        fullUrl = '${baseUrl.protocol}' + url;
                    } else if (url.startsWith('/')) {
                        fullUrl = '${baseUrl.origin}' + url;
                    } else if (url.startsWith('http://') || url.startsWith('https://')) {
                        fullUrl = url;
                    } else {
                        // Relative URL
                        fullUrl = new URL(url, '${baseUrl.href}').href;
                    }
                    
                    const encoded = btoa(unescape(encodeURIComponent(fullUrl)))
                        .replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=/g, "");
                    return '/scramjet/' + encoded;
                } catch (e) {
                    console.warn('Failed to encode URL:', url, e);
                    return url;
                }
            }
            
            // Override window.open
            const originalOpen = window.open;
            window.open = function(url, ...args) {
                if (url) {
                    const proxyUrl = encodeProxyUrl(url);
                    return originalOpen.call(this, proxyUrl, ...args);
                }
                return originalOpen.apply(this, arguments);
            };
            
            // Override location methods and properties
            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                get: function() {
                    return new Proxy(originalLocation, {
                        get: function(target, prop) {
                            if (prop === 'href') {
                                return '${baseUrl.href}';
                            } else if (prop === 'origin') {
                                return '${baseUrl.origin}';
                            } else if (prop === 'host') {
                                return '${baseUrl.host}';
                            } else if (prop === 'hostname') {
                                return '${baseUrl.hostname}';
                            } else if (prop === 'pathname') {
                                return '${baseUrl.pathname}';
                            } else if (prop === 'search') {
                                return '${baseUrl.search}';
                            } else if (prop === 'hash') {
                                return '${baseUrl.hash}';
                            } else if (prop === 'protocol') {
                                return '${baseUrl.protocol}';
                            } else if (prop === 'port') {
                                return '${baseUrl.port}';
                            } else if (prop === 'assign') {
                                return function(url) {
                                    window.location.href = encodeProxyUrl(url);
                                };
                            } else if (prop === 'replace') {
                                return function(url) {
                                    originalLocation.replace(encodeProxyUrl(url));
                                };
                            } else if (prop === 'reload') {
                                return function() {
                                    originalLocation.reload();
                                };
                            }
                            return target[prop];
                        },
                        set: function(target, prop, value) {
                            if (prop === 'href') {
                                originalLocation.href = encodeProxyUrl(value);
                                return true;
                            } else if (prop === 'hash') {
                                // Handle hash changes specially
                                const currentUrl = new URL('${baseUrl.href}');
                                currentUrl.hash = value;
                                originalLocation.href = encodeProxyUrl(currentUrl.href);
                                return true;
                            }
                            target[prop] = value;
                            return true;
                        }
                    });
                },
                configurable: true
            });
            
            // Override fetch
            const originalFetch = window.fetch;
            window.fetch = function(input, init) {
                if (typeof input === 'string') {
                    const proxyUrl = encodeProxyUrl(input);
                    return originalFetch.call(this, proxyUrl, init);
                } else if (input instanceof Request) {
                    const proxyUrl = encodeProxyUrl(input.url);
                    const newRequest = new Request(proxyUrl, input);
                    return originalFetch.call(this, newRequest, init);
                }
                return originalFetch.apply(this, arguments);
            };
            
            // Override XMLHttpRequest
            const originalXHR = window.XMLHttpRequest;
            window.XMLHttpRequest = function() {
                const xhr = new originalXHR();
                const originalOpen = xhr.open;
                xhr.open = function(method, url, ...args) {
                    const proxyUrl = encodeProxyUrl(url);
                    return originalOpen.call(this, method, proxyUrl, ...args);
                };
                return xhr;
            };
            
            // Override form submissions
            document.addEventListener('submit', function(e) {
                const form = e.target;
                if (form.action) {
                    const proxyAction = encodeProxyUrl(form.action);
                    form.action = proxyAction;
                }
            }, true);
            
            // Override anchor clicks
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
            
            // Override history API
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            
            history.pushState = function(state, title, url) {
                if (url) {
                    url = encodeProxyUrl(url);
                }
                return originalPushState.call(this, state, title, url);
            };
            
            history.replaceState = function(state, title, url) {
                if (url) {
                    url = encodeProxyUrl(url);
                }
                return originalReplaceState.call(this, state, title, url);
            };
            
        })();
        </script>`;
        
        // Inject the script and viewport
        if (html.includes('</head>')) {
            html = html.replace('</head>', viewportMeta + proxyScript + '</head>');
        } else if (html.includes('<head>')) {
            html = html.replace('<head>', '<head>' + viewportMeta + proxyScript);
        } else if (html.includes('</body>')) {
            html = html.replace('</body>', proxyScript + '</body>');
        } else {
            html = viewportMeta + proxyScript + html;
        }
        
        // Add or update base tag
        const baseTag = `<base href="${baseUrl.href}">`;
        if (html.includes('<base')) {
            html = html.replace(/<base[^>]*>/i, baseTag);
        } else if (html.includes('<head>')) {
            html = html.replace('<head>', '<head>' + baseTag);
        }
        
        return html;
        
    } catch (error) {
        console.error('SW: HTML rewriting failed:', error);
        return html;
    }
}

// CSS rewriting
function rewriteCss(css, baseUrl) {
    try {
        // Rewrite url() in CSS
        css = css.replace(/url\(\s*['"]?([^'")\s]+)['"]?\s*\)/gi, (match, url) => {
            const rewrittenUrl = rewriteUrl(url, baseUrl);
            return `url("${rewrittenUrl}")`;
        });
        
        // Rewrite @import statements
        css = css.replace(/@import\s+['"]([^'"]+)['"]/gi, (match, url) => {
            const rewrittenUrl = rewriteUrl(url, baseUrl);
            return `@import "${rewrittenUrl}"`;
        });
        
        return css;
    } catch (error) {
        console.error('SW: CSS rewriting failed:', error);
        return css;
    }
}

// Basic JavaScript rewriting
function rewriteJavaScript(js, baseUrl) {
    try {
        // This is a basic implementation - full JS rewriting is complex
        // For now, just return the original JS
        return js;
    } catch (error) {
        console.error('SW: JavaScript rewriting failed:', error);
        return js;
    }
}

// Srcset rewriting
function rewriteSrcset(srcset, baseUrl) {
    try {
        return srcset.replace(/([^\s,]+)/g, (match, url) => {
            // Only rewrite if it looks like a URL (not a size descriptor)
            if (url.includes('.') && !url.endsWith('x') && !url.endsWith('w')) {
                return rewriteUrl(url, baseUrl);
            }
            return url;
        });
    } catch (error) {
        console.error('SW: Srcset rewriting failed:', error);
        return srcset;
    }
}

// URL rewriting helper
function rewriteUrl(url, baseUrl) {
    try {
        // Skip if already a proxy URL
        if (url.startsWith('/scramjet/')) {
            return url;
        }
        
        // Skip data URLs, javascript URLs, etc.
        if (url.startsWith('data:') || 
            url.startsWith('javascript:') || 
            url.startsWith('mailto:') || 
            url.startsWith('#') ||
            url.startsWith('blob:')) {
            return url;
        }
        
        // Create absolute URL
        let absoluteUrl;
        if (url.startsWith('//')) {
            absoluteUrl = baseUrl.protocol + url;
        } else if (url.startsWith('/')) {
            absoluteUrl = baseUrl.origin + url;
        } else if (url.startsWith('http://') || url.startsWith('https://')) {
            absoluteUrl = url;
        } else {
            // Relative URL
            absoluteUrl = new URL(url, baseUrl).href;
        }
        
        // Encode for proxy
        const encodedUrl = scramjetConfig.encodeUrl(absoluteUrl);
        return `/scramjet/${encodedUrl}`;
        
    } catch (error) {
        console.warn('SW: URL rewriting failed for:', url, error);
        return url;
    }
}

// Error response helper
function createErrorResponse(title, url, ...errors) {
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
                    background: #ffebee; 
                    padding: 20px; 
                    border-radius: 8px; 
                    border-left: 4px solid #f44336;
                    max-width: 800px;
                }
                .details {
                    margin-top: 15px;
                    padding: 10px;
                    background: #fff;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 12px;
                }
                button {
                    margin-top: 15px;
                    padding: 10px 20px;
                    background: #1976d2;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <div class="error">
                <h2>🚫 ${title}</h2>
                <p><strong>Failed to load:</strong> ${url}</p>
                <div class="details">
                    ${errors.map(err => `<div>• ${err.message || err}</div>`).join('')}
                </div>
                <p>This may be due to CORS restrictions, network issues, or the target server being unavailable.</p>
                <button onclick="history.back()">← Go Back</button>
                <button onclick="location.reload()">🔄 Retry</button>
            </div>
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
    console.log('SW: Message received:', event.data);
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('=== Fixed Scramjet SW Ready ===');
