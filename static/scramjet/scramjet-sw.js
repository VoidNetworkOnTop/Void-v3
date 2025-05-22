// Integrated Scramjet Service Worker
console.log('🚀 Scramjet SW Loading (Integrated Version)');

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
        url.pathname === '/scramjet/' ||
        url.pathname === '/scramjet') {
        return; // Let browser handle static files
    }
    
    console.log('🎯 SW Handling scramjet request:', url.pathname);
    
    // Test endpoint - always handle this ourselves with highest priority
    if (url.pathname === '/scramjet/test') {
        console.log('🧪 SW Test endpoint hit - responding immediately');
        event.respondWith(
            new Response('✅ SW Test Success! (Integrated)', {
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
    
    // Fallback to our custom handler
    console.log('🔄 Using custom proxy handler');
    event.respondWith(handleCustomProxy(event.request));
});

// Custom proxy handler as fallback
async function handleCustomProxy(request) {
    try {
        const url = new URL(request.url);
        const pathSegment = url.pathname.replace('/scramjet/', '');
        
        console.log('🔄 Custom proxy processing:', pathSegment);
        
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
        
        // Try multiple fetch strategies
        let response;
        let lastError;
        
        // Strategy 1: Direct CORS
        try {
            console.log('📡 Trying CORS fetch');
            response = await fetch(targetUrl, {
                method: request.method,
                headers: createCleanHeaders(targetUrl),
                mode: 'cors',
                credentials: 'omit',
                redirect: 'follow'
            });
            console.log('✅ CORS fetch success:', response.status);
        } catch (corsError) {
            console.log('❌ CORS failed:', corsError.message);
            lastError = corsError;
            
            // Strategy 2: No-CORS
            try {
                console.log('📡 Trying no-cors fetch');
                response = await fetch(targetUrl, {
                    method: 'GET',
                    mode: 'no-cors',
                    credentials: 'omit'
                });
                console.log('✅ No-cors fetch success');
            } catch (noCorsError) {
                console.log('❌ No-cors also failed:', noCorsError.message);
                
                // Strategy 3: Return iframe wrapper
                console.log('🖼️ Creating iframe wrapper');
                const iframeHtml = createIframeWrapper(targetUrl, lastError.message);
                return new Response(iframeHtml, {
                    status: 200,
                    headers: { 
                        'content-type': 'text/html',
                        'access-control-allow-origin': '*'
                    }
                });
            }
        }
        
        // Process successful response
        return await processResponse(response, targetUrl);
        
    } catch (error) {
        console.error('❌ Custom proxy error:', error);
        return new Response(createErrorPage(error.message), { 
            status: 500,
            headers: { 'content-type': 'text/html' }
        });
    }
}

// Create clean headers for requests
function createCleanHeaders(targetUrl) {
    const headers = new Headers();
    const parsedUrl = new URL(targetUrl);
    
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    headers.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
    headers.set('Accept-Language', 'en-US,en;q=0.5');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Pragma', 'no-cache');
    
    return headers;
}

// Process response from fetch
async function processResponse(response, targetUrl) {
    const responseHeaders = new Headers();
    
    // Copy safe headers
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
    
    // Handle opaque responses (no-cors)
    if (response.type === 'opaque') {
        console.log('📦 Opaque response, creating wrapper');
        const wrapperHtml = createIframeWrapper(targetUrl, 'CORS restricted - showing in iframe');
        return new Response(wrapperHtml, {
            status: 200,
            headers: { 'content-type': 'text/html' }
        });
    }
    
    // Handle readable responses
    let responseBody;
    try {
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('text/html')) {
            const html = await response.text();
            responseBody = rewriteHtml(html, new URL(targetUrl));
        } else {
            responseBody = await response.arrayBuffer();
        }
    } catch (bodyError) {
        console.warn('⚠️ Could not read response body:', bodyError);
        responseBody = createIframeWrapper(targetUrl, 'Could not read response content');
    }
    
    return new Response(responseBody, {
        status: response.status,
        headers: responseHeaders
    });
}

// Basic HTML rewriting
function rewriteHtml(html, baseUrl) {
    try {
        // Rewrite relative URLs
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
        
        return html;
    } catch (e) {
        console.warn('⚠️ HTML rewriting failed:', e);
        return html;
    }
}

// Create iframe wrapper for problematic sites
function createIframeWrapper(targetUrl, reason) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Proxy: ${new URL(targetUrl).hostname}</title>
            <style>
                body { 
                    margin: 0; 
                    font-family: Arial, sans-serif; 
                    background: #f5f5f5;
                }
                .header { 
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .info {
                    font-size: 14px;
                    opacity: 0.9;
                }
                iframe { 
                    width: 100%; 
                    height: calc(100vh - 60px); 
                    border: none; 
                    background: white;
                }
                .open-btn {
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    text-decoration: none;
                    font-size: 12px;
                }
                .open-btn:hover {
                    background: rgba(255,255,255,0.3);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <span>📡 Proxying: <strong>${targetUrl}</strong></span>
                <span class="info">(${reason})</span>
                <a href="${targetUrl}" target="_blank" class="open-btn">🔗 Open Direct</a>
            </div>
            <iframe src="${targetUrl}" 
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation">
            </iframe>
        </body>
        </html>
    `;
}

// Create error page
function createErrorPage(errorMessage) {
    return `
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
                <p><strong>Error:</strong> ${errorMessage}</p>
                <button onclick="history.back()">Go Back</button>
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

console.log('🎉 Scramjet SW Ready (Integrated)');
