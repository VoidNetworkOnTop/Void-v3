/*global Ultraviolet*/
self.__uv$config = {
    prefix: '/uv/service/',
    bare: '/bare/',
    
    // FIXED: Use standard, reliable base64 encoding
    encodeUrl: function(url) {
        if (!url) return url;
        
        try {
            // Use standard base64 encoding with URL-safe characters
            return btoa(url)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
        } catch (err) {
            console.error('UV encoding error:', err);
            // Fallback to Ultraviolet's built-in encoder
            return Ultraviolet.codec.base64.encode(url);
        }
    },
    
    decodeUrl: function(encodedUrl) {
        if (!encodedUrl) return encodedUrl;
        
        try {
            // Standard base64 decoding
            const padding = '='.repeat((4 - (encodedUrl.length % 4)) % 4);
            const base64 = encodedUrl
                .replace(/-/g, '+')
                .replace(/_/g, '/') + padding;
            return atob(base64);
        } catch (err) {
            console.error('UV decoding error:', err);
            // Fallback to Ultraviolet's built-in decoder
            return Ultraviolet.codec.base64.decode(encodedUrl);
        }
    },
    
    handler: '/uv/uv.handler.js',
    client: '/uv/uv.client.js',
    bundle: '/uv/uv.bundle.js',
    config: '/uv/uv.config.js',
    sw: '/uv/uv.sw.js',
    
    // Reasonable timeouts that don't cause issues
    timeout: 45000,              // 45 seconds - balanced timeout
    strict: false,
    rewriteUrl: false,
    cookies: true,
    safeMethod: false,
    chunked: true,
    abuseLevel: 0,
    corsPlugin: true,
    
    // Basic WebSocket settings
    webSocket: true,
    fastStream: true,
    webSocketDirectConnect: true,
    wsClientDirectConnect: true,
    wsClientMaxPayload: 15728640,
    
    // Essential MIME types - no weird ones that cause issues
    mimeType: {
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.unity3d': 'application/unity',
        '.unityweb': 'application/unity',
        '.data': 'application/octet-stream',
        '.mem': 'application/octet-stream',
        '.wasm': 'application/wasm',
        '.html': 'text/html',
        '.htm': 'text/html'
    },
    
    // Common gaming hostnames - removed problematic ones
    hostnames: [
        'unity3d.com',
        'unity.com',
        'unitycdn.com',
        'jsdelivr.net',
        'cloudfront.net',
        'cloudflare.com',
        'poki.com',
        'coolmathgames.com',
        'y8.com',
        'crazygames.com',
        'github.io',
        'githubusercontent.com',
        'gamedistribution.com',
        'kongregate.com',
        'newgrounds.com'
    ],
    
    unblock: [
        'unity3d.com',
        'unitycdn.com',
        'unity.com',
        'jsdelivr.net',
        'cloudfront.net',
        'poki-gdn.com',
        'cloudflare.com',
        'github.io',
        'githubusercontent.com',
        'gamedistribution.com',
        'kongregate.com',
        'newgrounds.com'
    ],
    
    // Simple, reliable headers
    headers: {
        request: {
            "DNT": "1",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        },
        response: {
            "X-Content-Type-Options": "nosniff",
            "Access-Control-Allow-Origin": "*"
        }
    }
};
