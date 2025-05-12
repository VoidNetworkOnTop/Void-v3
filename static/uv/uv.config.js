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
    
    // Performance settings
    timeout: 180000,        // 3 minute timeout for slow connections
    strict: false,          // Disable strict mode for better compatibility
    rewriteUrl: false,      // Don't rewrite URLs (preserves original paths)
    cookies: true,          // Enable cookies for better persistence
    safeMethod: false,      // Allow all HTTP methods
    chunked: true,          // Enable chunked transfers for better performance
    abuseLevel: 0,          // Minimal abuse protection for speed
    corsPlugin: true,       // Ensure CORS is properly bypassed
    
    // Connection optimizations
    webSocket: true,        // Explicitly enable WebSocket support
    fastStream: true,       // Enable faster streaming
    webSocketDirectConnect: true, // Direct WebSocket connection when possible
    wsClientDirectConnect: true,  // Client direct connection for WebSocket
    wsClientMaxPayload: 10485760,  // Increased to 10MB for larger payloads
    
    // Critical MIME type handling fix
    mimeType: {
        '.lp': 'application/json',
        'firebaseio.com': 'application/json',
        'googleapis.com': 'application/json',
        '.unity3d': 'application/unity',
        '.unityweb': 'application/unity',
        '.data': 'application/octet-stream',
        '.mem': 'application/octet-stream',
        '.wasm': 'application/wasm'
    },
    
    // Handle game domains specially
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
        'gstatic.com'
    ],
    
    // Disable blockCORS for special domains
    unblock: [
        'firebaseio.com',
        'firebase.googleapis.com',
        'www.gstatic.com',
        '.googleapis.com',
        'unity3d.com',
        'unitycdn.com',
        'unity.com',
        'jsdelivr.net',
        'cloudfront.net'
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
            "Content-Type": "$res-content-type"
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
            ]
        }
    }
};
