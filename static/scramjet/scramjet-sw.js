// Complete Working Scramjet Service Worker for Full Game Compatibility
console.log('=== Complete Working Scramjet SW Loading ===');

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

// Main fetch handler - intercepts ALL requests
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Only handle scramjet paths
    if (!url.pathname.startsWith('/scramjet/')) {
        return;
    }
    
    console.log('SW: Intercepting request:', url.pathname);
    
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
    
    event.respondWith(handleProxy(event.request));
});

// Comprehensive proxy handler
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
        
        // Use backend proxy
        const proxyUrl = `/scram?url=${encodeURIComponent(targetUrl)}`;
        console.log('SW: Proxying through backend:', proxyUrl);
        
        // Forward all original request properties
        const proxyHeaders = new Headers();
        
        // Copy all headers from original request
        for (const [key, value] of request.headers.entries()) {
            // Skip problematic headers
            if (!['host', 'origin', 'referer'].includes(key.toLowerCase())) {
                proxyHeaders.set(key, value);
            }
        }
        
        // Set essential headers
        proxyHeaders.set('User-Agent', request.headers.get('User-Agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        proxyHeaders.set('Accept', request.headers.get('Accept') || '*/*');
        proxyHeaders.set('Accept-Language', request.headers.get('Accept-Language') || 'en-US,en;q=0.9');
        
        const proxyRequest = new Request(proxyUrl, {
            method: request.method,
            headers: proxyHeaders,
            body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
            mode: 'same-origin',
            credentials: 'same-origin',
            redirect: 'follow'
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

// Comprehensive response processing
async function processResponse(response, targetUrl, originalRequest) {
    const baseUrl = new URL(targetUrl);
    const contentType = response.headers.get('content-type') || '';
    
    console.log('SW: Processing response, content-type:', contentType);
    
    // Create response headers
    const responseHeaders = new Headers();
    
    // Copy all response headers except problematic ones
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
    
    // Add permissive headers
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
            
        } else if (contentType.includes('application/json')) {
            console.log('SW: Processing as JSON');
            const jsonText = await response.text();
            processedContent = jsonText; // Don't modify JSON
            
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

// Comprehensive HTML rewriting with extensive game support
function rewriteHtml(html, baseUrl) {
    try {
        console.log('SW: Rewriting HTML content for games');
        
        // Remove security restrictions
        html = html.replace(/<meta[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/gi, '');
        html = html.replace(/<meta[^>]*name=["']?referrer["']?[^>]*>/gi, '');
        
        // Comprehensive URL rewriting for ALL possible attributes
        const urlAttributes = [
            'href', 'src', 'action', 'formaction', 'data-src', 'data-href', 
            'data-url', 'poster', 'background', 'cite', 'longdesc', 'manifest',
            'data', 'codebase', 'archive', 'classid', 'usemap'
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
        
        // Comprehensive game-compatible proxy script
        const proxyScript = `
        <script>
        (function() {
            console.log('Game-compatible Scramjet proxy loaded for:', '${baseUrl.origin}');
            
            // Enhanced URL encoding for games
            function encodeProxyUrl(url) {
                if (!url || typeof url !== 'string') return url;
                
                // Skip if already proxied
                if (url.startsWith('/scramjet/')) return url;
                
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
                        // Relative URL - crucial for games
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
            
            // Override ALL network methods for games
            
            // 1. Window.open
            const originalOpen = window.open;
            window.open = function(url, ...args) {
                console.log('Proxying window.open:', url);
                return originalOpen.call(this, encodeProxyUrl(url), ...args);
            };
            
            // 2. Fetch API
            const originalFetch = window.fetch;
            window.fetch = function(input, init) {
                if (typeof input === 'string') {
                    const proxyUrl = encodeProxyUrl(input);
                    console.log('Proxying fetch:', input, '->', proxyUrl);
                    return originalFetch.call(this, proxyUrl, init);
                } else if (input instanceof Request) {
                    const proxyUrl = encodeProxyUrl(input.url);
                    console.log('Proxying fetch request:', input.url, '->', proxyUrl);
                    const newRequest = new Request(proxyUrl, {
                        method: input.method,
                        headers: input.headers,
                        body: input.body,
                        mode: 'same-origin',
                        credentials: input.credentials,
                        cache: input.cache,
                        redirect: input.redirect,
                        referrer: input.referrer,
                        integrity: input.integrity
                    });
                    return originalFetch.call(this, newRequest, init);
                }
                return originalFetch.apply(this, arguments);
            };
            
            // 3. XMLHttpRequest
            const originalXHR = window.XMLHttpRequest;
            window.XMLHttpRequest = function() {
                const xhr = new originalXHR();
                const originalOpen = xhr.open;
                const originalSend = xhr.send;
                
                xhr.open = function(method, url, ...args) {
                    const proxyUrl = encodeProxyUrl(url);
                    console.log('Proxying XHR:', url, '->', proxyUrl);
                    return originalOpen.call(this, method, proxyUrl, ...args);
                };
                
                return xhr;
            };
            
            // 4. Image loading
            const originalImage = window.Image;
            window.Image = function(width, height) {
                const img = new originalImage(width, height);
                const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
                
                Object.defineProperty(img, 'src', {
                    get: originalSrcDescriptor.get,
                    set: function(value) {
                        const proxyUrl = encodeProxyUrl(value);
                        console.log('Proxying Image src:', value, '->', proxyUrl);
                        originalSrcDescriptor.set.call(this, proxyUrl);
                    },
                    configurable: true,
                    enumerable: true
                });
                
                return img;
            };
            
            // 5. Audio loading
            if (window.Audio) {
                const originalAudio = window.Audio;
                window.Audio = function(src) {
                    const audio = new originalAudio();
                    if (src) {
                        const proxyUrl = encodeProxyUrl(src);
                        console.log('Proxying Audio src:', src, '->', proxyUrl);
                        audio.src = proxyUrl;
                    }
                    return audio;
                };
            }
            
            // 6. Video loading
            const originalCreateElement = document.createElement;
            document.createElement = function(tagName) {
                const element = originalCreateElement.call(this, tagName);
                
                if (tagName.toLowerCase() === 'img' || tagName.toLowerCase() === 'image') {
                    const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
                    Object.defineProperty(element, 'src', {
                        get: originalSrcDescriptor.get,
                        set: function(value) {
                            const proxyUrl = encodeProxyUrl(value);
                            console.log('Proxying created image src:', value, '->', proxyUrl);
                            originalSrcDescriptor.set.call(this, proxyUrl);
                        },
                        configurable: true,
                        enumerable: true
                    });
                } else if (tagName.toLowerCase() === 'script') {
                    const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
                    Object.defineProperty(element, 'src', {
                        get: originalSrcDescriptor.get,
                        set: function(value) {
                            const proxyUrl = encodeProxyUrl(value);
                            console.log('Proxying script src:', value, '->', proxyUrl);
                            originalSrcDescriptor.set.call(this, proxyUrl);
                        },
                        configurable: true,
                        enumerable: true
                    });
                }
                
                return element;
            };
            
            // 7. Location overrides
            const originalLocation = window.location;
            
            // Store original methods
            const originalAssign = originalLocation.assign;
            const originalReplace = originalLocation.replace;
            
            // Override location methods
            if (originalAssign) {
                originalLocation.assign = function(url) {
                    const proxyUrl = encodeProxyUrl(url);
                    console.log('Proxying location.assign:', url, '->', proxyUrl);
                    return originalAssign.call(this, proxyUrl);
                };
            }
            
            if (originalReplace) {
                originalLocation.replace = function(url) {
                    const proxyUrl = encodeProxyUrl(url);
                    console.log('Proxying location.replace:', url, '->', proxyUrl);
                    return originalReplace.call(this, proxyUrl);
                };
            }
            
            // Handle direct location.href assignments
            try {
                let locationHrefDescriptor = Object.getOwnPropertyDescriptor(originalLocation, 'href');
                if (!locationHrefDescriptor) {
                    locationHrefDescriptor = Object.getOwnPropertyDescriptor(Location.prototype, 'href');
                }
                
                if (locationHrefDescriptor && locationHrefDescriptor.set) {
                    Object.defineProperty(originalLocation, 'href', {
                        get: locationHrefDescriptor.get,
                        set: function(url) {
                            const proxyUrl = encodeProxyUrl(url);
                            console.log('Proxying location.href =', url, '->', proxyUrl);
                            return locationHrefDescriptor.set.call(this, proxyUrl);
                        },
                        configurable: true,
                        enumerable: true
                    });
                }
            } catch (e) {
                console.warn('Could not override location.href setter:', e);
            }
            
            // 8. Form submissions
            document.addEventListener('submit', function(e) {
                const form = e.target;
                if (form.action && !form.action.startsWith('/scramjet/')) {
                    const proxyAction = encodeProxyUrl(form.action);
                    console.log('Proxying form action:', form.action, '->', proxyAction);
                    form.action = proxyAction;
                }
            }, true);
            
            // 9. All link clicks
            document.addEventListener('click', function(e) {
                const anchor = e.target.closest('a');
                if (anchor && anchor.href && !anchor.href.startsWith('/scramjet/')) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const proxyHref = encodeProxyUrl(anchor.href);
                    console.log('Proxying link click:', anchor.href, '->', proxyHref);
                    
                    if (anchor.target === '_blank' || e.ctrlKey || e.metaKey) {
                        window.open(proxyHref, anchor.target || '_blank');
                    } else {
                        window.location.href = proxyHref;
                    }
                    return false;
                }
            }, true);
            
            // 10. History API
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            
            history.pushState = function(state, title, url) {
                if (url) {
                    url = encodeProxyUrl(url);
                    console.log('Proxying history.pushState:', arguments[2], '->', url);
                }
                return originalPushState.call(this, state, title, url);
            };
            
            history.replaceState = function(state, title, url) {
                if (url) {
                    url = encodeProxyUrl(url);
                    console.log('Proxying history.replaceState:', arguments[2], '->', url);
                }
                return originalReplaceState.call(this, state, title, url);
            };
            
            // 11. Monitor and rewrite dynamic content
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Rewrite URLs in newly added elements
                            const elements = node.querySelectorAll ? 
                                [node, ...node.querySelectorAll('[href], [src], [action], [poster], [data], [background]')] : [node];
                            
                            elements.forEach(function(el) {
                                ['href', 'src', 'action', 'poster', 'data', 'background'].forEach(function(attr) {
                                    if (el[attr] && !el[attr].startsWith('/scramjet/') && !el[attr].startsWith('data:')) {
                                        const original = el[attr];
                                        const proxied = encodeProxyUrl(original);
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
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['src', 'href', 'action', 'poster', 'data', 'background']
                });
            }
            
            // 12. Provide correct location information for games
            window.__scramjet_location = {
                href: '${baseUrl.href}',
                origin: '${baseUrl.origin}',
                host: '${baseUrl.host}',
                hostname: '${baseUrl.hostname}',
                pathname: '${baseUrl.pathname}',
                search: '${baseUrl.search}',
                hash: '${baseUrl.hash}',
                protocol: '${baseUrl.protocol}',
                port: '${baseUrl.port}'
            };
            
            console.log('Game-compatible Scramjet proxy fully initialized');
            
        })();
        </script>`;
        
        // Inject the script
        if (html.includes('</head>')) {
            html = html.replace('</head>', proxyScript + '</head>');
        } else if (html.includes('<head>')) {
            html = html.replace('<head>', '<head>' + proxyScript);
        } else if (html.includes('</body>')) {
            html = html.replace('</body>', proxyScript + '</body>');
        } else {
            html = proxyScript + html;
        }
        
        // Add base tag for relative URLs
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

// Enhanced CSS rewriting
function rewriteCss(css, baseUrl) {
    try {
        // Rewrite url() in CSS
        css = css.replace(/url\(\s*['"]?([^'")\s]+)['"]?\s*\)/gi, (match, url) => {
            if (!url.startsWith('data:')) {
                const rewrittenUrl = rewriteUrl(url, baseUrl);
                return `url("${rewrittenUrl}")`;
            }
            return match;
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

// Basic JavaScript rewriting for games
function rewriteJavaScript(js, baseUrl) {
    try {
        // Don't heavily modify JS as it can break games
        // Just return as-is for maximum compatibility
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
            if (url.includes('.') && !url.endsWith('x') && !url.endsWith('w') && !url.startsWith('data:')) {
                return rewriteUrl(url, baseUrl);
            }
            return url;
        });
    } catch (error) {
        console.error('SW: Srcset rewriting failed:', error);
        return srcset;
    }
}

// Enhanced URL rewriting
function rewriteUrl(url, baseUrl) {
    try {
        // Skip if already a proxy URL
        if (url.startsWith('/scramjet/')) {
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
            // Relative URL - critical for games
            absoluteUrl = new URL(url, baseUrl).href;
        }
        
        // Encode for proxy
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
        <head>
            <title>Proxy Error</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
                .error { background: #ffebee; padding: 20px; border-radius: 8px; border-left: 4px solid #f44336; max-width: 800px; }
                .details { margin-top: 15px; padding: 10px; background: #fff; border-radius: 4px; font-family: monospace; font-size: 12px; }
                button { margin-top: 15px; padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; }
            </style>
        </head>
        <body>
            <div class="error">
                <h2>🚫 ${title}</h2>
                <p><strong>Failed to load:</strong> ${url}</p>
                <div class="details">
                    ${errors.map(err => `<div>• ${err.message || err}</div>`).join('')}
                </div>
                <p>This may be due to network issues or the target server being unavailable.</p>
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
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('=== Complete Working Scramjet SW Ready ===');
