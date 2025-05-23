// Scramjet Service Worker - UV Style Implementation
console.log('=== Scramjet SW - UV Style Loading ===');

// URL encode/decode functions (same as UV)
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

// Main fetch handler - UV style
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Handle /scramjet/service/ requests (like UV does with /uv/service/)
    if (url.pathname.startsWith('/scramjet/service/')) {
        console.log('SW: Handling scramjet service request:', url.pathname);
        event.respondWith(handleScramjetService(event.request));
        return;
    }
    
    // Handle test endpoint
    if (url.pathname === '/scramjet/test') {
        event.respondWith(
            new Response('Scramjet Service Worker Test Success!', {
                status: 200,
                headers: { 'content-type': 'text/plain' }
            })
        );
        return;
    }
    
    // Let other requests pass through normally
});

// Main service handler - UV style
async function handleScramjetService(request) {
    try {
        const url = new URL(request.url);
        // Extract encoded URL from path: /scramjet/service/ENCODED_URL
        const encodedUrl = url.pathname.replace('/scramjet/service/', '');
        
        console.log('SW: Processing encoded URL:', encodedUrl);
        
        if (!encodedUrl) {
            return new Response('No URL provided', { status: 400 });
        }
        
        // Decode the target URL
        const targetUrl = scramjetConfig.decodeUrl(encodedUrl);
        
        if (!targetUrl || !scramjetConfig.isValidUrl(targetUrl)) {
            return new Response('Invalid target URL', { status: 400 });
        }
        
        console.log('SW: Target URL:', targetUrl);
        
        // Make the actual request (like UV does)
        const response = await fetch(targetUrl, {
            method: request.method,
            headers: createProxyHeaders(request),
            body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
            redirect: 'follow'
        });
        
        console.log('SW: Response status:', response.status, 'Content-Type:', response.headers.get('content-type'));
        
        // Process the response
        return await processResponse(response, targetUrl, request);
        
    } catch (error) {
        console.error('SW: Service error:', error);
        return createErrorResponse('Service error', request.url, error);
    }
}

// Create proxy headers (like UV)
function createProxyHeaders(request) {
    const headers = {};
    
    // Copy safe headers from original request
    const safeHeaders = [
        'accept', 'accept-language', 'accept-encoding', 'cache-control',
        'content-type', 'authorization', 'range', 'if-modified-since', 'if-none-match'
    ];
    
    safeHeaders.forEach(header => {
        if (request.headers.has(header)) {
            headers[header] = request.headers.get(header);
        }
    });
    
    // Set essential headers
    headers['User-Agent'] = request.headers.get('User-Agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    if (!headers['accept']) {
        headers['accept'] = '*/*';
    }
    if (!headers['accept-language']) {
        headers['accept-language'] = 'en-US,en;q=0.9';
    }
    
    return headers;
}

// Process response (like UV)
async function processResponse(response, targetUrl, originalRequest) {
    const baseUrl = new URL(targetUrl);
    const contentType = response.headers.get('content-type') || '';
    
    console.log('SW: Processing response, content-type:', contentType);
    
    // Create response headers
    const responseHeaders = new Headers();
    
    // Copy response headers (skip security headers like UV does)
    const skipHeaders = [
        'content-security-policy', 'content-security-policy-report-only',
        'x-frame-options', 'x-content-type-options', 'strict-transport-security',
        'referrer-policy', 'permissions-policy', 'cross-origin-embedder-policy',
        'cross-origin-opener-policy', 'cross-origin-resource-policy'
    ];
    
    for (const [key, value] of response.headers.entries()) {
        if (!skipHeaders.includes(key.toLowerCase())) {
            responseHeaders.set(key, value);
        }
    }
    
    // Add permissive headers (like UV)
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', '*');
    responseHeaders.set('Access-Control-Allow-Headers', '*');
    responseHeaders.set('Access-Control-Expose-Headers', '*');
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
            
        } else if (contentType.includes('javascript') || contentType.includes('text/javascript')) {
            console.log('SW: Processing as JavaScript');
            const jsText = await response.text();
            processedContent = rewriteJavaScript(jsText, baseUrl);
            
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

// HTML rewriting (UV style)
function rewriteHtml(html, baseUrl) {
    try {
        console.log('SW: Rewriting HTML content');
        
        // Remove security restrictions
        html = html.replace(/<meta[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/gi, '');
        html = html.replace(/<meta[^>]*name=["']?referrer["']?[^>]*>/gi, '');
        
        // Rewrite URLs in attributes
        const urlAttributes = [
            'href', 'src', 'action', 'formaction', 'data-src', 'data-href', 
            'poster', 'background', 'cite', 'manifest', 'data'
        ];
        
        for (const attr of urlAttributes) {
            const regex = new RegExp(`(${attr})=["']([^"']+)["']`, 'gi');
            html = html.replace(regex, (match, attribute, url) => {
                if (url && !url.startsWith('data:') && !url.startsWith('javascript:') && !url.startsWith('#')) {
                    const rewrittenUrl = rewriteUrl(url, baseUrl);
                    return `${attribute}="${rewrittenUrl}"`;
                }
                return match;
            });
        }
        
        // Rewrite srcset
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
        
        // Inject proxy script (UV style)
        const proxyScript = `
        <script>
        (function() {
            console.log('Scramjet proxy script loaded for:', '${baseUrl.origin}');
            
            // URL encoding function
            function encodeScramjetUrl(url) {
                if (!url || typeof url !== 'string') return url;
                
                // Skip if already proxied
                if (url.startsWith('/scramjet/service/')) return url;
                
                // Skip special URLs
                if (url.startsWith('data:') || url.startsWith('javascript:') || 
                    url.startsWith('mailto:') || url.startsWith('#') || 
                    url.startsWith('blob:') || url.startsWith('about:') ||
                    url.startsWith('tel:') || url.startsWith('sms:')) {
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
                    
                    // Encode like UV does
                    const encoded = btoa(unescape(encodeURIComponent(fullUrl)))
                        .replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=/g, "");
                    return '/scramjet/service/' + encoded;
                } catch (e) {
                    console.warn('URL encoding failed:', url, e);
                    return url;
                }
            }
            
            // Override fetch (like UV)
            const originalFetch = window.fetch;
            window.fetch = function(input, init) {
                if (typeof input === 'string') {
                    const proxyUrl = encodeScramjetUrl(input);
                    console.log('Proxying fetch:', input, '->', proxyUrl);
                    return originalFetch.call(this, proxyUrl, init);
                } else if (input instanceof Request) {
                    const proxyUrl = encodeScramjetUrl(input.url);
                    console.log('Proxying fetch request:', input.url, '->', proxyUrl);
                    const newRequest = new Request(proxyUrl, input);
                    return originalFetch.call(this, newRequest, init);
                }
                return originalFetch.apply(this, arguments);
            };
            
            // Override XMLHttpRequest (like UV)
            const originalXHR = window.XMLHttpRequest;
            window.XMLHttpRequest = function() {
                const xhr = new originalXHR();
                const originalOpen = xhr.open;
                xhr.open = function(method, url, ...args) {
                    const proxyUrl = encodeScramjetUrl(url);
                    console.log('Proxying XHR:', url, '->', proxyUrl);
                    return originalOpen.call(this, method, proxyUrl, ...args);
                };
                return xhr;
            };
            
            // Override window.open (like UV)
            const originalOpen = window.open;
            window.open = function(url, ...args) {
                console.log('Proxying window.open:', url);
                return originalOpen.call(this, encodeScramjetUrl(url), ...args);
            };
            
            // Override location methods (like UV)
            const originalLocation = window.location;
            const originalAssign = originalLocation.assign;
            const originalReplace = originalLocation.replace;
            
            if (originalAssign) {
                originalLocation.assign = function(url) {
                    const proxyUrl = encodeScramjetUrl(url);
                    console.log('Proxying location.assign:', url, '->', proxyUrl);
                    return originalAssign.call(this, proxyUrl);
                };
            }
            
            if (originalReplace) {
                originalLocation.replace = function(url) {
                    const proxyUrl = encodeScramjetUrl(url);
                    console.log('Proxying location.replace:', url, '->', proxyUrl);
                    return originalReplace.call(this, proxyUrl);
                };
            }
            
            // Handle form submissions
            document.addEventListener('submit', function(e) {
                const form = e.target;
                if (form.action && !form.action.startsWith('/scramjet/service/')) {
                    const proxyAction = encodeScramjetUrl(form.action);
                    console.log('Proxying form action:', form.action, '->', proxyAction);
                    form.action = proxyAction;
                }
            }, true);
            
            // Handle link clicks
            document.addEventListener('click', function(e) {
                const anchor = e.target.closest('a');
                if (anchor && anchor.href && !anchor.href.startsWith('/scramjet/service/')) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const proxyHref = encodeScramjetUrl(anchor.href);
                    console.log('Proxying link click:', anchor.href, '->', proxyHref);
                    
                    if (anchor.target === '_blank' || e.ctrlKey || e.metaKey) {
                        window.open(proxyHref, anchor.target || '_blank');
                    } else {
                        window.location.href = proxyHref;
                    }
                    return false;
                }
            }, true);
            
            // Monitor dynamic content
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const elements = node.querySelectorAll ? 
                                [node, ...node.querySelectorAll('[href], [src], [action]')] : [node];
                            
                            elements.forEach(function(el) {
                                ['href', 'src', 'action'].forEach(function(attr) {
                                    if (el[attr] && !el[attr].startsWith('/scramjet/service/') && !el[attr].startsWith('data:')) {
                                        const original = el[attr];
                                        const proxied = encodeScramjetUrl(original);
                                        if (original !== proxied) {
                                            console.log('Proxying dynamic', attr + ':', original, '->', proxied);
                                            el[attr] = proxied;
                                        }
                                    }
                                });
                            });
                        }
                    });
                });
            });
            
            if (document.body) {
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
            
            console.log('Scramjet proxy script initialized');
            
        })();
        </script>`;
        
        // Inject script
        if (html.includes('</head>')) {
            html = html.replace('</head>', proxyScript + '</head>');
        } else if (html.includes('</body>')) {
            html = html.replace('</body>', proxyScript + '</body>');
        } else {
            html = proxyScript + html;
        }
        
        // Add base tag
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
        css = css.replace(/url\(\s*['"]?([^'")\s]+)['"]?\s*\)/gi, (match, url) => {
            if (!url.startsWith('data:')) {
                const rewrittenUrl = rewriteUrl(url, baseUrl);
                return `url("${rewrittenUrl}")`;
            }
            return match;
        });
        
        css = css.replace(/@import\s+['"]([^'"]+)['"]/gi, (match, url) => {
            const rewrittenUrl = rewriteUrl(url, baseUrl);
            return `@import "${rewrittenUrl}"`;
        });
        
        return css;
    } catch (error) {
        return css;
    }
}

// JavaScript rewriting (minimal for compatibility)
function rewriteJavaScript(js, baseUrl) {
    return js; // Don't modify JS to avoid breaking games
}

// Srcset rewriting
function rewriteSrcset(srcset, baseUrl) {
    try {
        return srcset.replace(/([^\s,]+)/g, (match, url) => {
            if (url.includes('.') && !url.endsWith('x') && !url.endsWith('w') && !url.startsWith('data:')) {
                return rewriteUrl(url, baseUrl);
            }
            return url;
        });
    } catch (error) {
        return srcset;
    }
}

// URL rewriting (UV style)
function rewriteUrl(url, baseUrl) {
    try {
        // Skip if already proxied
        if (url.startsWith('/scramjet/service/')) {
            return url;
        }
        
        // Skip special URLs
        if (url.startsWith('data:') || url.startsWith('javascript:') || 
            url.startsWith('mailto:') || url.startsWith('#') ||
            url.startsWith('blob:') || url.startsWith('about:') ||
            url.startsWith('tel:') || url.startsWith('sms:')) {
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
        
        // Encode like UV
        const encodedUrl = scramjetConfig.encodeUrl(absoluteUrl);
        return `/scramjet/service/${encodedUrl}`;
        
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
        <head><title>Scramjet Error</title></head>
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

console.log('=== Scramjet SW - UV Style Ready ===');
