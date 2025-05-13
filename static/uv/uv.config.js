/*global Ultraviolet*/
self.__uv$config = {
    prefix: '/uv/service/',
    bare: '/bare/',
    
    // Use more efficient URL encoding
    encodeUrl: function(url) {
        if (!url) return url;
        try {
            // URL-safe base64 encoding
            return btoa(url)
                .replace(/\+/g, '-') // URL safe character replacement
                .replace(/\//g, '_')
                .replace(/=+$/, ''); // Remove padding for shorter URLs
        } catch (err) {
            console.error('UV encoding error:', err);
            // Fallback to standard Base64 if something goes wrong
            return Ultraviolet.codec.base64.encode(url);
        }
    },
    
    // Matching decoder for our custom encoder
    decodeUrl: function(encodedUrl) {
        if (!encodedUrl) return encodedUrl;
        try {
            // Restore padding if needed for proper decoding
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
    
    // Performance settings - OPTIMIZED FOR HIGH TRAFFIC
    timeout: 240000,        // 4 minute timeout for slow connections (increased)
    strict: false,          // Disable strict mode for better compatibility
    rewriteUrl: false,      // Don't rewrite URLs (preserves original paths)
    cookies: true,          // Enable cookies for better persistence
    safeMethod: false,      // Allow all HTTP methods
    chunked: true,          // Enable chunked transfers for better performance
    abuseLevel: 0,          // Minimal abuse protection for speed
    corsPlugin: true,       // Ensure CORS is properly bypassed
    
    // Connection optimizations - INCREASED
    webSocket: true,        // Explicitly enable WebSocket support
    fastStream: true,       // Enable faster streaming
    webSocketDirectConnect: true, // Direct WebSocket connection when possible
    wsClientDirectConnect: true,  // Client direct connection for WebSocket
    wsClientMaxPayload: 15728640,  // Increased to 15MB for larger payloads
    
    // Critical MIME type handling fix
    mimeType: {
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
        '.png.gz': 'image/png'
    },
    
    // Handle game domains specially - EXPANDED
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
        'gamedistribution.com'
    ],
    
    // Disable blockCORS for special domains - EXPANDED
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
        'gamedistribution.com'
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
    
    // New high traffic optimizations
    highTraffic: {
        enabled: false,                // Will be auto-detected by service worker
        adaptiveTimeouts: true,        // Adjust timeouts based on traffic
        prioritizeGameContent: true,   // Prioritize game content over assets
        skipPrefetching: true,         // Skip prefetching when under high load
        useSimpleLoaders: true,        // Use simpler loading screens
        aggressiveCaching: true,       // More aggressive caching
        connectionLimit: 350,          // Higher connection limit
        chunkSize: 131072              // Larger chunk size (128KB)
    }
};
