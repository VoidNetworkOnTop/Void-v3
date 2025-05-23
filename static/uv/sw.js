/*global Ultraviolet*/
self.__uv$config = {
    prefix: '/uv/service/',
    bare: '/bare/',
    
    // Simple, fast encoding
    encodeUrl: function(url) {
        if (!url) return url;
        
        try {
            return btoa(url)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
        } catch (err) {
            console.error('UV encoding error:', err);
            return Ultraviolet.codec.base64.encode(url);
        }
    },
    
    decodeUrl: function(encodedUrl) {
        if (!encodedUrl) return encodedUrl;
        
        try {
            const padding = '='.repeat((4 - (encodedUrl.length % 4)) % 4);
            const base64 = encodedUrl
                .replace(/-/g, '+')
                .replace(/_/g, '/') + padding;
            return atob(base64);
        } catch (err) {
            console.error('UV decoding error:', err);
            return Ultraviolet.codec.base64.decode(encodedUrl);
        }
    },
    
    handler: '/uv/uv.handler.js',
    client: '/uv/uv.client.js',
    bundle: '/uv/uv.bundle.js',
    config: '/uv/uv.config.js',
    sw: '/uv/uv.sw.js',
    
    // Conservative timeouts that work for most connections
    timeout: 60000,             // 1 minute
    strict: false,
    rewriteUrl: false,
    cookies: true,
    safeMethod: false,
    chunked: true,
    abuseLevel: 0,
    corsPlugin: true,
    
    // Basic connection settings
    webSocket: true,
    fastStream: true,
    webSocketDirectConnect: true,
    wsClientDirectConnect: true,
    wsClientMaxPayload: 15728640,
    
    // Essential MIME types only
    mimeType: {
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.unity3d': 'application/unity',
        '.unityweb': 'application/unity',
        '.data': 'application/octet-stream',
        '.mem': 'application/octet-stream',
        '.wasm': 'application/wasm'
    },
    
    // Essential hostnames only
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
        'gamedistribution.com'
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
        'gamedistribution.com'
    ],
    
    headers: {
        request: {
            "DNT": "1",
            "Upgrade-Insecure-Requests": "1"
        },
        response: {
            "X-Content-Type-Options": "nosniff"
        }
    }
};
