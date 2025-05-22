// Enhanced Scramjet Service Worker - Better Proxying
console.log('🚀 Enhanced Scramjet SW Loading');

// Import existing Scramjet config if available
try {
    importScripts('/scramjet/scramjet.config.js');
    console.log('✅ Loaded scramjet.config.js');
} catch (error) {
    console.warn('⚠️ Could not load scramjet.config.js:', error);
}

// Import existing Scramjet bundle if available
try {
    importScripts('/scramjet/scramjet.bundle.js');
    console.log('✅ Loaded scramjet.bundle.js');
} catch (error) {
    console.warn('⚠️ Could not load scramjet.bundle.js:', error);
}

// Fallback config if imports failed
if (!self.__scramjet$config) {
    self.__scramjet$config = {
        prefix: '/scramjet/',
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
    console.log('✅ Using fallback config');
}

// Check if Scramjet bundle has functionality we can use
let scramjetInstance = null;
try {
    if (typeof ScramjetServiceWorker !== 'undefined') {
        scramjetInstance = new ScramjetServiceWorker({
            prefix: '/scramjet/',
            codec: 'plain'
        });
        console.log('✅ Created Scramjet instance');
    }
} catch (error) {
    console.warn('⚠️ Could not create Scramjet instance:', error);
}

// Install event
self.addEventListener('install', (event) => {
    console.log('✅ SW Installing');
    event.waitUntil(self.skipWaiting());
});

// Activate event  
self.addEventListener('activate', (event) => {
    console.log('✅ SW Activating');
    event.waitUntil(clients.claim());
});

// MAIN FETCH HANDLER - with Scramjet integration
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    console.log('🔍 SW Fetch:', url.pathname);
    
    // Only handle /scramjet/ paths
    if (!url.pathname.startsWith('/scramjet/')) {
        return; // Let browser handle
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
        return; // Let browser handle static files
    }
    
    console.log('🎯 SW Handling scramjet request:', url.pathname);
    
    // Test endpoint - always handle this ourselves with highest priority
    if (url.pathname === '/scramjet/test') {
        console.log('🧪 SW Test endpoint hit - responding immediately');
        event.respondWith(
            new Response('✅ SW Test Success! (Enhanced)', {
                status: 200,
                headers: { 
                    'content-type': 'text/plain',
                    'access-control-allow-origin': '*'
                }
            })
        );
        return;
    }
    
    // Try to use existing Scramjet instance first
    if (scramjetInstance && typeof scramjetInstance.route === 'function' && scramjetInstance.route(event)) {
        console.log('🎯 Using Scramjet instance');
        event.respondWith(scramjetInstance.fetch(event));
        return;
    }
    
    // Fallback to our enhanced custom handler
    console.log('🔄 Using enhanced custom proxy handler');
    event.respondWith(handleEnhancedProxy(event.request));
});

// Enhanced proxy handler with better strategies
async function handleEnhancedProxy(request) {
    try {
        const url = new URL(request.url);
        const pathSegment = url.pathname.replace('/scramjet/', '');
        
        console.log('🔄 Enhanced proxy processing:', pathSegment);
        
        if (!pathSegment) {
            return new Response('No URL provided', { status: 400 });
        }
        
        // Try to decode URL using Scramjet config
        let targetUrl;
        if (pathSegment.startsWith('http')) {
            targetUrl = pathSegment;
        } else {
            targetUrl = self.__scramjet$config.decodeUrl(pathSegment);
        }
        
        if (!targetUrl) {
            return new Response('Could not decode URL', { status: 400 });
        }
        
        // Validate URL
        try {
            new URL(targetUrl);
        } catch (e) {
            return new Response('Invalid target URL', { status: 400 });
        }
        
        console.log('🎯 Target URL:', targetUrl);
        
        // Strategy 1: Try direct CORS with enhanced headers
        try {
            console.log('📡 Trying enhanced CORS fetch');
            const response = await fetch(targetUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'cross-site',
                    'Upgrade-Insecure-Requests': '1'
                },
                mode: 'cors',
                credentials: 'omit',
                redirect: 'follow'
            });
            
            console.log('✅ CORS fetch success:', response.status);
            
            // Process the readable response
            const contentType = response.headers.get('content-type') || '';
            let content;
            
            if (contentType.includes('text/html')) {
                content = await response.text();
                content = rewriteHtml(content, new URL(targetUrl));
                console.log('📝 HTML content rewritten');
            } else if (contentType.includes('text/css')) {
                content = await response.text();
                content = rewriteCss(content, new URL(targetUrl));
                console.log('📝 CSS content rewritten');
            } else {
                content = await response.arrayBuffer();
                console.log('📦 Binary content retrieved');
            }
            
            // Create proper response with CORS headers
            const responseHeaders = new Headers();
            for (const [key, value] of response.headers.entries()) {
                if (!isBlockedHeader(key)) {
                    responseHeaders.set(key, value);
                }
            }
            
            // Add CORS headers
            responseHeaders.set('Access-Control-Allow-Origin', '*');
            responseHeaders.set('Access-Control-Allow-Methods', '*');
            responseHeaders.set('Access-Control-Allow-Headers', '*');
            responseHeaders.set('Access-Control-Expose-Headers', '*');
            
            return new Response(content, {
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders
            });
            
        } catch (corsError) {
            console.log('❌ CORS failed:', corsError.message);
            
            // Strategy 2: Try no-cors mode
            try {
                console.log('📡 Trying no-cors fetch');
                const noCorsResponse = await fetch(targetUrl, {
                    method: 'GET',
                    mode: 'no-cors',
                    credentials: 'omit',
                    cache: 'no-cache'
                });
                
                console.log('✅ No-cors fetch success, but response is opaque');
                
                // Since no-cors returns opaque response, create enhanced iframe wrapper
                return createEnhancedIframeWrapper(targetUrl, 'CORS restricted - no-cors mode');
                
            } catch (noCorsError) {
                console.log('❌ No-cors also failed:', noCorsError.message);
                
                // Strategy 3: Create iframe wrapper as last resort
                console.log('🖼️ Creating fallback iframe wrapper');
                return createEnhancedIframeWrapper(targetUrl, corsError.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Enhanced proxy error:', error);
        return new Response(createErrorPage(error.message), { 
            status: 500,
            headers: { 
                'content-type': 'text/html',
                'access-control-allow-origin': '*'
            }
        });
    }
}

// Enhanced HTML rewriting
function rewriteHtml(html, baseUrl) {
    try {
        console.log('📝 Rewriting HTML for:', baseUrl.href);
        
        // Rewrite relative URLs in href, src, and action attributes
        html = html.replace(/(href|src|action)=["'](?!https?:\/\/|\/\/|#|javascript:|mailto:|data:)([^"']+)["']/gi, 
            (match, attr, url) => {
                try {
                    const absoluteUrl = new URL(url, baseUrl).href;
                    const encodedUrl = self.__scramjet$config.encodeUrl(absoluteUrl);
                    return `${attr}="/scramjet/${encodedUrl}"`;
                } catch (e) {
                    console.warn('⚠️ Failed to rewrite URL:', url);
                    return match;
                }
            }
        );
        
        // Rewrite URLs in style attributes
        html = html.replace(/style=["']([^"']*url\([^)]+\)[^"']*)["']/gi, (match, style) => {
            const rewrittenStyle = style.replace(/url\(['"]?([^'"]+)['"]?\)/gi, (urlMatch, url) => {
                try {
                    if (!url.startsWith('http') && !url.startsWith('//') && !url.startsWith('data:')) {
                        const absoluteUrl = new URL(url, baseUrl).href;
                        const encodedUrl = self.__scramjet$config.encodeUrl(absoluteUrl);
                        return `url("/scramjet/${encodedUrl}")`;
                    }
                    return urlMatch;
                } catch (e) {
                    return urlMatch;
                }
            });
            return `style="${rewrittenStyle}"`;
        });
        
        // Add base tag to help with relative URLs
        if (!html.includes('<base')) {
            html = html.replace(/<head>/i, `<head><base href="${baseUrl.href}">`);
        }
        
        // Inject proxy status indicator
        const proxyIndicator = `
            <div style="position: fixed; top: 0; left: 0; right: 0; background: linear-gradient(90deg, #667eea, #764ba2); color: white; padding: 8px 16px; font-family: Arial, sans-serif; font-size: 12px; z-index: 999999; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                🌐 Proxied via Scramjet: <strong>${baseUrl.hostname}</strong>
                <a href="${baseUrl.href}" target="_blank" style="color: white; margin-left: 12px; text-decoration: none;">🔗 Direct</a>
                <span onclick="this.parentElement.style.display='none'" style="float: right; cursor: pointer; padding: 0 8px;">✕</span>
            </div>
            <div style="height: 40px;"></div>
        `;
        
        html = html.replace(/<body>/i, `<body>${proxyIndicator}`);
        
        return html;
        
    } catch (e) {
        console.warn('⚠️ HTML rewriting failed:', e);
        return html;
    }
}

// CSS rewriting for @import and url() functions
function rewriteCss(css, baseUrl) {
    try {
        console.log('📝 Rewriting CSS for:', baseUrl.href);
        
        // Rewrite url() functions in CSS
        css = css.replace(/url\(['"]?(?!https?:\/\/|\/\/|data:)([^'"]+)['"]?\)/gi, (match, url) => {
            try {
                const absoluteUrl = new URL(url, baseUrl).href;
                const encodedUrl = self.__scramjet$config.encodeUrl(absoluteUrl);
                return `url("/scramjet/${encodedUrl}")`;
            } catch (e) {
                return match;
            }
        });
        
        // Rewrite @import statements
        css = css.replace(/@import\s+['"](?!https?:\/\/|\/\/|data:)([^'"]+)['"]/gi, (match, url) => {
            try {
                const absoluteUrl = new URL(url, baseUrl).href;
                const encodedUrl = self.__scramjet$config.encodeUrl(absoluteUrl);
                return `@import "/scramjet/${encodedUrl}"`;
            } catch (e) {
                return match;
            }
        });
        
        return css;
        
    } catch (e) {
        console.warn('⚠️ CSS rewriting failed:', e);
        return css;
    }
}

// Create enhanced iframe wrapper
function createEnhancedIframeWrapper(targetUrl, reason) {
    const hostname = new URL(targetUrl).hostname;
    
    return new Response(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Proxy: ${hostname}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    background: #f8f9fa;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                .header { 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-shrink: 0;
                }
                .title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-weight: 600;
                    font-size: 14px;
                }
                .badge {
                    background: rgba(255,255,255,0.25);
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 500;
                }
                .actions {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                .btn {
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    text-decoration: none;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .btn:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-1px);
                }
                .content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                }
                .notice {
                    background: linear-gradient(90deg, #fff3cd, #ffeaa7);
                    border-bottom: 1px solid #ffc107;
                    padding: 10px 20px;
                    color: #856404;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-shrink: 0;
                }
                .notice-icon {
                    font-size: 16px;
                }
                iframe { 
                    flex: 1;
                    width: 100%; 
                    border: none; 
                    background: white;
                }
                .loading {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #6c757d;
                    font-size: 14px;
                    background: white;
                    padding: 16px 24px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #e9ecef;
                    border-top: 2px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .error {
                    padding: 40px 20px;
                    text-align: center;
                    color: #6c757d;
                    background: white;
                    margin: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                @media (max-width: 768px) {
                    .header { padding: 10px 16px; }
                    .title { font-size: 13px; }
                    .btn { padding: 5px 10px; font-size: 11px; }
                    .notice { padding: 8px 16px; font-size: 12px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">
                    <span>🌐</span>
                    <span>${hostname}</span>
                    <span class="badge">Proxied</span>
                </div>
                <div class="actions">
                    <a href="${targetUrl}" target="_blank" class="btn">
                        🔗 Direct
                    </a>
                    <button class="btn" onclick="location.reload()">
                        🔄 Reload
                    </button>
                </div>
            </div>
            
            <div class="content">
                <div class="notice">
                    <span class="notice-icon">⚠️</span>
                    <span><strong>CORS Restriction:</strong> ${reason}. Loading in secure iframe...</span>
                </div>
                
                <div class="loading" id="loading">
                    <div class="spinner"></div>
                    <span>Loading ${hostname}...</span>
                </div>
                
                <iframe id="frame" 
                        src="${targetUrl}"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-downloads"
                        onload="handleLoad()"
                        onerror="handleError()">
                </iframe>
            </div>
            
            <script>
                function handleLoad() {
                    document.getElementById('loading').style.display = 'none';
                    console.log('✅ Iframe loaded:', '${targetUrl}');
                }
                
                function handleError() {
                    const loading = document.getElementById('loading');
                    loading.innerHTML = \`
                        <div style="text-align: center;">
                            <div style="font-size: 24px; margin-bottom: 8px;">❌</div>
                            <div>Failed to load <strong>${hostname}</strong></div>
                            <div style="font-size: 12px; color: #6c757d; margin-top: 8px;">
                                This site may not allow iframe embedding
                            </div>
                        </div>
                    \`;
                    console.error('❌ Iframe failed to load:', '${targetUrl}');
                }
                
                // Hide loading after timeout
                setTimeout(() => {
                    if (document.getElementById('loading').style.display !== 'none') {
                        handleLoad();
                    }
                }, 10000);
            </script>
        </body>
        </html>
    `, {
        status: 200,
        headers: { 
            'content-type': 'text/html',
            'access-control-allow-origin': '*'
        }
    });
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
        'cross-origin-resource-policy',
        'expect-ct',
        'feature-policy',
        'permissions-policy'
    ];
    return blocked.includes(headerName.toLowerCase());
}

// Create error page
function createErrorPage(errorMessage) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Proxy Error</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0;
                    padding: 40px 20px;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .error { 
                    background: white; 
                    padding: 40px; 
                    border-radius: 12px; 
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    max-width: 500px;
                    width: 100%;
                    text-align: center;
                }
                .error h2 { 
                    color: #dc3545; 
                    margin-bottom: 16px;
                    font-size: 24px;
                }
                .error p {
                    color: #6c757d;
                    margin-bottom: 24px;
                    line-height: 1.5;
                }
                .error-code {
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 6px;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    color: #495057;
                    margin-bottom: 24px;
                    word-break: break-word;
                }
                button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: transform 0.2s ease;
                }
                button:hover {
                    transform: translateY(-1px);
                }
            </style>
        </head>
        <body>
            <div class="error">
                <h2>🚫 Proxy Error</h2>
                <p>The proxy encountered an error while processing your request.</p>
                <div class="error-code">${errorMessage}</div>
                <button onclick="history.back()">← Go Back</button>
            </div>
        </body>
        </html>
    `;
}

// Message handler
self.addEventListener('message', (event) => {
    console.log('📨 SW Message:', event.data);
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('🎉 Enhanced Scramjet SW Ready');
