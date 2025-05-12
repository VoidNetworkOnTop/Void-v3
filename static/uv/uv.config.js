/*global Ultraviolet*/
self.__uv$config = {
    prefix: '/uv/service/',
    bare: '/bare/',
    
    // Use more efficient URL encoding that produces shorter URLs
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
    
    // Performance and reliability settings
    timeout: 120000,        // Increased timeout for Firebase long connections
    strict: false,          // Disable strict mode for better compatibility
    rewriteUrl: false,      // Don't rewrite URLs (preserves original paths)
    cookies: true,          // Enable cookies for better persistence
    safeMethod: false,      // Allow all HTTP methods
    chunked: true,          // Enable chunked transfers for better performance
    abuseLevel: 0,          // Minimal abuse protection for speed
    corsPlugin: true,       // Ensure CORS is properly bypassed
    
    // Connection optimizations
    fastStream: true,       // Enable faster streaming
    webSocketCompression: false, // Disable WebSocket compression for lower latency
    
    // Firebase-specific optimizations
    webSocket: true,        // Explicitly enable WebSocket support
    
    // Allow Firebase domains without rewriting
    hostnames: [
        'firebaseio.com',
        'firebase.google.com',
        'firebase.googleapis.com',
        'firebasestorage.googleapis.com',
        'identitytoolkit.googleapis.com'
    ],
    
    // Prioritize WebSocket connections
    wsClientMaxPayload: 1048576, // 1MB for Firebase data
    
    // Request priorities for games and firebase
    headers: {
        request: {
            "DNT": "1",  // Do Not Track
            "Upgrade-Insecure-Requests": "1",
            "Priority": "u=1, i"  // High priority
        },
        response: {
            "X-Content-Type-Options": "nosniff"
        }
    }
};
