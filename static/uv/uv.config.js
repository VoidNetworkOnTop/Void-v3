/*global Ultraviolet*/
self.__uv$config = {
    prefix: '/uv/service/',
    bare: '/bare/',
    
    // Use enhanced encoder
    encodeUrl: function(url) {
        if (!url) return url;
        
        try {
            // Use enhanced encoder if available
            if (typeof EnhancedEncoder !== 'undefined') {
                return EnhancedEncoder.encode(url);
            }
            
            // Fallback to simple encoding
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
            // Use enhanced encoder if available
            if (typeof EnhancedEncoder !== 'undefined') {
                return EnhancedEncoder.decode(encodedUrl);
            }
            
            // Fallback to simple decoding
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
    
    // Performance settings optimized for all devices
    timeout: 300000,        // 5 minute timeout for slow connections
    strict: false,
    rewriteUrl: false,
    cookies: true,
    safeMethod: false,
    chunked: true,
    abuseLevel: 0,
    corsPlugin: true,
    
    // Connection optimizations
    webSocket: true,
    fastStream: true,
    webSocketDirectConnect: true,
    wsClientDirectConnect: true,
    wsClientMaxPayload: 15728640,
    
    // Enhanced MIME type handling
    mimeType: {
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.lp': 'application/json',
        'firebaseio.com': 'application/json',
        'googleapis.com': 'application/json',
        '.unity3d': 'application/unity',
        '.unityweb': 'application/unity',
        '.data': 'application/octet-stream',
        '.mem': 'application/octet-stream',
        '.wasm': 'application/wasm',
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
    
    // Expanded hostnames for better compatibility
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
        'gl.itchspace.io',
        'storage.googleapis.com',
        'cdn.jasonpresley.com',
        'gamedistribution.com',
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
    
    headers: {
        request: {
            "DNT": "1",
            "Upgrade-Insecure-Requests": "1",
            "Priority": "u=1, i",
            "Connection": "keep-alive, Upgrade", 
            "Upgrade": "$req-upgrade",
            "Sec-WebSocket-Extensions": "$req-sec-websocket-extensions"
        },
        response: {
            "X-Content-Type-Options": "nosniff",
            "Content-Type": "$res-content-type",
            "Access-Control-Allow-Origin": "$req-origin"
        },
        preserve: {
            'websocket': [
                'Upgrade',
                'Connection',
                'Sec-WebSocket-Accept',
                'Sec-WebSocket-Extensions',
                'Sec-WebSocket-Key',
                'Sec-WebSocket-Protocol',
                'Sec-WebSocket-Version'
            ],
            'caching': [
                'Cache-Control',
                'ETag',
                'Last-Modified',
                'Expires'
            ]
        }
    },
    
    // Device-aware optimizations
    gameOptimizations: {
        prioritizeWasm: true,
        fastDataLoading: true,
        aggressivePrefetch: true,
        optimizeFramerate: true,
        fastenCodecLoading: true,
        minimizeRewriting: true,
        preserveWebGLContext: true,
        adaptiveTimeouts: true,
        deviceAwareLoading: true
    },
    
    // High traffic and slow device optimizations
    adaptiveConfig: {
        enabled: true,
        slowDeviceThreshold: 2,  // Cores
        highTrafficThreshold: 100,
        timeoutMultiplier: {
            fast: 0.8,
            medium: 1.0,
            slow: 2.0
        },
        chunkSizes: {
            low: 32768,    // 32KB
            medium: 65536, // 64KB
            high: 131072   // 128KB
        }
    }
};
