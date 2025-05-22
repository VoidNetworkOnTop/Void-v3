/*global Ultraviolet*/
self.__uv$config = {
    prefix: '/uv/service/',
    bare: '/bare/',
    
    // ENHANCED: Improved URL encoding for better game compatibility
    encodeUrl: function(url) {
        if (!url) return url;
        
        try {
            // Special treatment for known game content URLs to minimize encoding overhead
            if (isLikelyGameResource(url)) {
                // Use a more compact encoding for game resources
                return 'g' + compactEncode(url);
            }
            
            // Standard URL-safe base64 encoding for regular URLs
            return btoa(url)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
        } catch (err) {
            console.error('UV encoding error:', err);
            // Fallback to standard Base64 if something goes wrong
            return Ultraviolet.codec.base64.encode(url);
        }
    },
    
    // ENHANCED: Improved decoder with special handling for game URLs
    decodeUrl: function(encodedUrl) {
        if (!encodedUrl) return encodedUrl;
        
        try {
            // Check if this is our special game URL encoding (starts with 'g')
            if (encodedUrl.startsWith('g')) {
                return compactDecode(encodedUrl.slice(1));
            }
            
            // Regular URL-safe base64 decoding
            const padding = '='.repeat((4 - (encodedUrl.length % 4)) % 4);
            const base64 = encodedUrl
                .replace(/-/g, '+')
                .replace(/_/g, '/') + padding;
            return atob(base64);
        } catch (err) {
            console.error('UV decoding error:', err);
            // Fallback to standard Base64 decoder
            return Ultraviolet.codec.base64.decode(encodedUrl);
        }
    },
    
    // Standard UV config paths
    handler: '/uv/uv.handler.js',
    client: '/uv/uv.client.js',
    bundle: '/uv/uv.bundle.js',
    config: '/uv/uv.config.js',
    sw: '/uv/uv.sw.js',
    
    // IMPROVED: Performance settings optimized for games
    timeout: 240000,        // 4 minute timeout for slow connections (increased)
    strict: false,          // Disable strict mode for better compatibility
    rewriteUrl: false,      // Don't rewrite URLs (preserves original paths)
    cookies: true,          // Enable cookies for better persistence
    safeMethod: false,      // Allow all HTTP methods
    chunked: true,          // Enable chunked transfers for better performance
    abuseLevel: 0,          // Minimal abuse protection for speed
    corsPlugin: true,       // Ensure CORS is properly bypassed
    
    // IMPROVED: Connection optimizations for games 
    webSocket: true,        // Explicitly enable WebSocket support
    fastStream: true,       // Enable faster streaming
    webSocketDirectConnect: true, // Direct WebSocket connection when possible
    wsClientDirectConnect: true,  // Client direct connection for WebSocket
    wsClientMaxPayload: 15728640,  // Increased to 15MB for larger payloads
    
    // IMPROVED: Critical MIME type handling fix with more game formats
    mimeType: {
        '.js': 'application/javascript',  // Added basic JS
        '.css': 'text/css',              // Added basic CSS
        '.lp': 'application/json',
        'firebaseio.com': 'application/json',
        'googleapis.com': 'application/json',
        '.unity3d': 'application/unity',
        '.unityweb': 'application/unity',
        '.data': 'application/octet-stream',
        '.mem': 'application/octet-stream',
        '.wasm': 'application/wasm',
        // Added additional game-related MIME types
        '.datagz': 'application/octet-stream',
        '.jsgz': 'application/javascript',
        '.asm.js': 'application/javascript',
        '.memgz': 'application/octet-stream',
        '.symbols.json': 'application/json',
        '.json.gz': 'application/json',
        '.png.gz': 'image/png',
        '.jpg.gz': 'image/jpeg',
        '.gz': 'application/gzip',
        '.br': 'application/brotli',
        '.bundle': 'application/javascript'
    },
    
    // EXPANDED: Game domains to handle specially
    hostnames: [
        'firebaseio.com',
        'firebase.googleapis.com',
        'identitytoolkit.googleapis.com',
        'securetoken.googleapis.com',
        'unity3d.com',
        'unity.com',
        'unitycdn.com',
        'jsdelivr.net',
        'cloudfront.net',
        'cloudflare.com',
        'gstatic.com',
        // Added more gaming platforms
        'poki.com',
        'coolmathgames.com',
        'y8.com',
        'crazygames.com',
        'kizi.com',
        'friv.com',
        'github.io',
        'githubusercontent.com',
        'glitch.me',
        'kongregate.com',
        'gl.itchspace.io',  // itch.io games
        'storage.googleapis.com',
        'cdn.jasonpresley.com',
        'gamedistribution.com',
        // Added more common game CDNs
        'imgix.net',
        'akamaihd.net',
        'akamaized.net',
        'cdnjs.cloudflare.com',
        'unpkg.com',
        'vercel.app',
        'netlify.app',
        'iogames.space',
        'replit.com',
        'repl.co',
        'addictinggames.com',
        'armor.com',
        'kongregate.io',
        'newgrounds.com',
        'simmer.io',
        'isthereanydeal.com',
        'epicgames.com',
        'gog.com',
        'miniclip.com',
        'silvergames.com'
    ],
    
    // EXPANDED: Disable blockCORS for more game domains
    unblock: [
        'firebaseio.com',
        'firebase.googleapis.com',
        'www.gstatic.com',
        '.googleapis.com',
        'unity3d.com',
        'unitycdn.com',
        'unity.com',
        'jsdelivr.net',
        'cloudfront.net',
        // Added more gaming CDNs
        'poki-gdn.com',
        'cloudflare.com',
        'cookielaw.org',
        'roblox.com',
        'rbxcdn.com',
        'ytimg.com',
        'itch.io',
        'itchspace.io',
        'rawgit.com',
        'rawgithub.com',
        'gitcdn.xyz',
        'glitch.me',
        'glitch.com',
        'gamedistribution.com',
        'akamaihd.net',
        'akamaized.net',
        'cdnjs.cloudflare.com',
        'unpkg.com',
        'vercel.app',
        'netlify.app',
        'iogames.space',
        'replit.com',
        'repl.co',
        'addictinggames.com',
        'armor.com',
        'kongregate.io',
        'newgrounds.com',
        'simmer.io'
    ],
    
    // Special request handling for WebSocket connections
    headers: {
        request: {
            "DNT": "1",  // Do Not Track
            "Upgrade-Insecure-Requests": "1",
            "Priority": "u=1, i",  // High priority
            // Ensure WebSocket connections are allowed
            "Connection": "keep-alive, Upgrade", 
            "Upgrade": "$req-upgrade",
            "Sec-WebSocket-Extensions": "$req-sec-websocket-extensions"
        },
        response: {
            "X-Content-Type-Options": "nosniff",
            // Preserve content type
            "Content-Type": "$res-content-type",
            // More lenient CORS
            "Access-Control-Allow-Origin": "$req-origin"
        },
        preserve: {
            // Preserve WebSocket headers
            'websocket': [
                'Upgrade',
                'Connection',
                'Sec-WebSocket-Accept',
                'Sec-WebSocket-Extensions',
                'Sec-WebSocket-Key',
                'Sec-WebSocket-Protocol',
                'Sec-WebSocket-Version'
            ],
            // Preserve Cache-Control headers to leverage client caching
            'caching': [
                'Cache-Control',
                'ETag',
                'Last-Modified',
                'Expires'
            ]
        }
    },
    
    // NEW: Game-specific performance optimizations
    gameOptimizations: {
        prioritizeWasm: true,           // Prioritize WebAssembly files
        fastDataLoading: true,          // Faster loading for game data files
        aggressivePrefetch: true,       // Prefetch game resources aggressively
        optimizeFramerate: true,        // Optimize for better framerates
        fastenCodecLoading: true,       // Faster loading for game codecs
        minimizeRewriting: true,        // Minimize JS rewriting for game scripts
        preserveWebGLContext: true      // Preserve WebGL context for better performance
    },
    
    // NEW: High traffic optimizations
    highTraffic: {
        enabled: false,                 // Auto-detected based on connection count
        adaptiveTimeouts: true,         // Adjust timeouts based on traffic
        prioritizeGameContent: true,    // Prioritize game content over assets
        skipPrefetching: true,          // Skip prefetching when under high load
        useSimpleLoaders: true,         // Use simpler loading screens
        aggressiveCaching: true,        // More aggressive caching
        connectionLimit: 350,           // Higher connection limit
        chunkSize: 131072               // Larger chunk size (128KB)
    }
};

// Helper functions for the compact encoding
function compactEncode(url) {
    // This is a more compact encoding that works well for longer URLs
    // It uses a custom dictionary approach which is more efficient than base64 for game URLs
    return encodeURIComponent(url)
        .replace(/%([0-9A-F]{2})/g, (_, p1) => {
            return String.fromCharCode('0x' + p1);
        });
}

function compactDecode(encodedUrl) {
    return decodeURIComponent(
        encodedUrl.split('')
            .map(c => {
                if (c.match(/[a-zA-Z0-9\-_.~]/)) {
                    return c;
                } else {
                    return '%' + c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase();
                }
            })
            .join('')
    );
}

// Function to detect if a URL is likely a game resource
function isLikelyGameResource(url) {
    // Check for common game file extensions and patterns
    const gameFilePatterns = [
        '.unity3d', '.unityweb', '.data', '.wasm', '.mem', 
        '.framework.js', '.loader.js', '.datagz', '.jsgz', 
        '.asm.js', '.memgz', '.symbols.json', '.bundle',
        'UnityLoader.js', 'Build/', 'TemplateData/', 'WebGL', 
        'stream_channel', 'games/', 'game/', 'play/', 'assets/',
        'WebGLBuild', '.gltf', '.glb'
    ];
    
    // Check for common game domains
    const gameDomains = [
        'unity3d.com', 'unitycdn', 'cloudfront.net', 'jsdelivr.net',
        'poki.com', 'y8.com', 'crazygames.com', 'unity.com',
        'github.io', 'gamezop.com', 'gamedistribution.com',
        'simmer.io', 'kongregate.com', 'coolmathgames.com'
    ];
    
    // Check the URL against our patterns
    const urlLower = url.toLowerCase();
    
    // Check file patterns
    for (const pattern of gameFilePatterns) {
        if (urlLower.includes(pattern)) {
            return true;
        }
    }
    
    // Check domains
    for (const domain of gameDomains) {
        if (urlLower.includes(domain)) {
            return true;
        }
    }
    
    return false;
}