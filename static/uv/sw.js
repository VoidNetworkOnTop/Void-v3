/*global Ultraviolet*/
self.__uv$config = {
    prefix: '/uv/service/',
    bare: '/bare/',
    
    // ULTRA-ENHANCED URL ENCODING with game optimization
    encodeUrl: function(url) {
        if (!url) return url;
        
        try {
            // Special ultra-fast encoding for game resources
            if (isLikelyGameResource(url)) {
                return 'g' + compactEncode(url);
            }
            
            // Enhanced critical resource detection
            if (isCriticalResource(url)) {
                return 'c' + compactEncode(url);
            }
            
            // Standard optimized encoding
            return btoa(url)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
        } catch (err) {
            console.error('UV encoding error:', err);
            return Ultraviolet.codec.base64.encode(url);
        }
    },
    
    // ULTRA-ENHANCED DECODER with error recovery
    decodeUrl: function(encodedUrl) {
        if (!encodedUrl) return encodedUrl;
        
        try {
            // Game resource decoding
            if (encodedUrl.startsWith('g')) {
                return compactDecode(encodedUrl.slice(1));
            }
            
            // Critical resource decoding
            if (encodedUrl.startsWith('c')) {
                return compactDecode(encodedUrl.slice(1));
            }
            
            // Standard decoding with enhanced error handling
            const padding = '='.repeat((4 - (encodedUrl.length % 4)) % 4);
            const base64 = encodedUrl
                .replace(/-/g, '+')
                .replace(/_/g, '/') + padding;
            return atob(base64);
        } catch (err) {
            console.error('UV decoding error:', err);
            try {
                return Ultraviolet.codec.base64.decode(encodedUrl);
            } catch (fallbackErr) {
                return encodedUrl; // Return original if all decoding fails
            }
        }
    },
    
    // Standard paths
    handler: '/uv/uv.handler.js',
    client: '/uv/uv.client.js',
    bundle: '/uv/uv.bundle.js',
    config: '/uv/uv.config.js',
    sw: '/uv/uv.sw.js',
    
    // ULTRA-FAST LOADING OPTIMIZATIONS  
    ultraFastMode: {
        enabled: true,
        parallelLoading: true,        // Load multiple resources simultaneously
        skipNonCriticalRewriting: true, // Skip rewriting for non-essential scripts
        aggressivePreloading: true,    // Preload game resources aggressively  
        fastDOMParsing: true,         // Optimize DOM parsing for games
        minimizeLatency: true,        // Reduce all possible latency
        instantWorkerClaim: true,     // Claim service worker instantly
        bypassSlowChecks: true,       // Skip slow validation checks
        streamProcessing: true,       // Stream large files for speed
        optimizeMemoryUsage: true,    // Better memory management
        enhancedCaching: true,        // More aggressive caching
        priorityQueuing: true         // Priority-based request queuing
    },
    
    // ENHANCED PERFORMANCE SETTINGS
    performance: {
        prioritizeGameContent: true,   // Always prioritize game files
        useWorkerThreads: true,       // Use web workers when available
        enableStreamProcessing: true, // Stream large files  
        optimizeMemoryUsage: true,    // Better memory management
        reduceGarbageCollection: true, // Minimize GC pauses
        fastErrorRecovery: true,      // Quick error recovery
        parallelRequestProcessing: true, // Process multiple requests in parallel
        adaptiveTimeouts: true,       // Adjust timeouts based on conditions
        compressionAwareness: true,   // Optimize for compressed content
        connectionPooling: true       // Pool connections for efficiency
    },
    
    // DEVICE-SPECIFIC OPTIMIZATIONS
    deviceOptimizations: {
        chromebook: {
            enabled: true,
            hardwareAcceleration: true,
            reducedQuality: false,     // Keep quality but optimize rendering
            fasterDecoding: true,
            optimizedMemory: true,
            enhancedWebGL: true,
            prioritizeCanvas: true
        },
        slowDevices: {
            enabled: true,
            simplerAnimations: true,
            reducedEffects: true,
            fasterNetworking: true,
            prioritizeCore: true,
            limitConcurrency: true,
            aggressiveGC: false        // Don't force GC on slow devices
        },
        mobile: {
            enabled: true,
            touchOptimized: true,
            reducedQuality: false,
            batteryAware: true,
            networkAdaptive: true
        }
    },
    
    // Enhanced timeout settings
    timeout: 300000,        // 5 minute timeout for ultra performance
    strict: false,          // Disable strict mode for speed
    rewriteUrl: false,      // Preserve original paths for speed
    cookies: true,          // Enable cookies for persistence
    safeMethod: false,      // Allow all HTTP methods for compatibility
    chunked: true,          // Enable chunked transfers
    abuseLevel: 0,          // Minimal abuse protection for speed
    corsPlugin: true,       // Enhanced CORS bypassing
    
    // ULTRA-ENHANCED CONNECTION SETTINGS
    webSocket: true,        // Enable WebSocket support
    fastStream: true,       // Enable faster streaming
    webSocketDirectConnect: true, // Direct WebSocket connections
    wsClientDirectConnect: true,  // Client direct WebSocket connection
    wsClientMaxPayload: 20971520, // 20MB payload limit (increased)
    
    // ULTRA-ENHANCED MIME TYPE HANDLING
    mimeType: {
        // Basic web files
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.htm': 'text/html',
        
        // Game engine files
        '.unity3d': 'application/unity',
        '.unityweb': 'application/unity',
        '.data': 'application/octet-stream',
        '.mem': 'application/octet-stream',
        '.wasm': 'application/wasm',
        '.symbols.json': 'application/json',
        
        // Compressed game files
        '.datagz': 'application/octet-stream',
        '.jsgz': 'application/javascript',
        '.asm.js': 'application/javascript',
        '.memgz': 'application/octet-stream',
        '.json.gz': 'application/json',
        '.gz': 'application/gzip',
        '.br': 'application/brotli',
        
        // Framework files
        '.bundle': 'application/javascript',
        '.framework.js': 'application/javascript',
        '.loader.js': 'application/javascript',
        
        // Media files
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        
        // Audio files
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4',
        
        // Video files
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogv': 'video/ogg',
        
        // Font files
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.otf': 'font/otf',
        
        // Special API responses
        'firebaseio.com': 'application/json',
        'googleapis.com': 'application/json',
        'api.': 'application/json'
    },
    
    // ULTRA-EXPANDED GAMING DOMAINS
    hostnames: [
        // Core gaming infrastructure
        'firebaseio.com',
        'firebase.googleapis.com',
        'identitytoolkit.googleapis.com',
        'securetoken.googleapis.com',
        
        // Unity and game engines
        'unity3d.com',
        'unity.com',
        'unitycdn.com',
        'unitycloud.com',
        
        // CDNs and hosting
        'jsdelivr.net',
        'cloudfront.net',
        'cloudflare.com',
        'gstatic.com',
        'googleapis.com',
        'github.io',
        'githubusercontent.com',
        'gitcdn.xyz',
        'rawgit.com',
        'rawgithub.com',
        
        // Gaming platforms
        'poki.com',
        'poki-gdn.com',
        'coolmathgames.com',
        'y8.com',
        'crazygames.com',
        'kizi.com',
        'friv.com',
        'kongregate.com',
        'kongregate.io',
        'newgrounds.com',
        'armor.com',
        'addictinggames.com',
        'miniclip.com',
        'silvergames.com',
        
        // Development platforms
        'glitch.me',
        'glitch.com',
        'replit.com',
        'repl.co',
        'vercel.app',
        'netlify.app',
        'heroku.com',
        'herokuapp.com',
        
        // Game distribution
        'gamedistribution.com',
        'simmer.io',
        'itch.io',
        'itchspace.io',
        'gamejolt.com',
        
        // Specialized gaming
        'iogames.space',
        'roblox.com',
        'rbxcdn.com',
        'epicgames.com',
        'steampowered.com',
        'gog.com',
        
        // CDN and optimization services
        'imgix.net',
        'akamaihd.net',
        'akamaized.net',
        'cdnjs.cloudflare.com',
        'unpkg.com',
        'fastly.com',
        'maxcdn.com',
        'bootstrapcdn.com'
    ],
    
    // ULTRA-EXPANDED UNBLOCK LIST
    unblock: [
        // All hostnames plus additional patterns
        'firebaseio.com',
        'firebase.googleapis.com',
        'www.gstatic.com',
        '.googleapis.com',
        'unity3d.com',
        'unitycdn.com',
        'unity.com',
        'jsdelivr.net',
        'cloudfront.net',
        'cloudflare.com',
        'github.io',
        'githubusercontent.com',
        'glitch.me',
        'replit.com',
        'vercel.app',
        'netlify.app',
        
        // Gaming platforms
        'poki.com',
        'poki-gdn.com',
        'coolmathgames.com',
        'crazygames.com',
        'y8.com',
        'friv.com',
        'kizi.com',
        'kongregate.com',
        'kongregate.io',
        'newgrounds.com',
        'armor.com',
        'addictinggames.com',
        'miniclip.com',
        'silvergames.com',
        
        // Development and hosting
        'rawgit.com',
        'rawgithub.com',
        'gitcdn.xyz',
        'heroku.com',
        'herokuapp.com',
        
        // Game engines and frameworks
        'gamedistribution.com',
        'simmer.io',
        'itch.io',
        'itchspace.io',
        'gamejolt.com',
        'roblox.com',
        'rbxcdn.com',
        
        // CDNs
        'akamaihd.net',
        'akamaized.net',
        'cdnjs.cloudflare.com',
        'unpkg.com',
        'fastly.com',
        'maxcdn.com',
        'imgix.net',
        
        // Additional patterns
        '.github.io',
        '.netlify.app',
        '.vercel.app',
        '.glitch.me',
        '.repl.co',
        '.herokuapp.com'
    ],
    
    // ULTRA-ENHANCED HEADERS CONFIGURATION
    headers: {
        request: {
            "DNT": "1",
            "Upgrade-Insecure-Requests": "1",
            "Priority": "u=1, i", 
            "Connection": "keep-alive, Upgrade", 
            "Upgrade": "$req-upgrade",
            "Sec-WebSocket-Extensions": "$req-sec-websocket-extensions",
            "Sec-WebSocket-Key": "$req-sec-websocket-key",
            "Sec-WebSocket-Protocol": "$req-sec-websocket-protocol",
            "Sec-WebSocket-Version": "$req-sec-websocket-version",
            // Ultra-fast mode headers
            "Cache-Control": "public, max-age=31536000",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept": "*/*"
        },
        response: {
            "X-Content-Type-Options": "nosniff",
            "Content-Type": "$res-content-type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Expose-Headers": "*",
            // Enhanced caching headers
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
            "X-UV-Ultra-Fast": "true"
        },
        preserve: {
            // WebSocket headers
            'websocket': [
                'Upgrade',
                'Connection',
                'Sec-WebSocket-Accept',
                'Sec-WebSocket-Extensions',
                'Sec-WebSocket-Key',
                'Sec-WebSocket-Protocol',
                'Sec-WebSocket-Version'
            ],
            // Caching headers
            'caching': [
                'Cache-Control',
                'ETag',
                'Last-Modified',
                'Expires',
                'Age',
                'Vary'
            ],
            // Compression headers
            'compression': [
                'Content-Encoding',
                'Content-Length',
                'Transfer-Encoding'
            ],
            // Security headers (preserve for compatibility)
            'security': [
                'Content-Security-Policy',
                'X-Frame-Options',
                'X-Content-Type-Options'
            ]
        }
    },
    
    // ULTRA-ENHANCED GAME OPTIMIZATIONS
    gameOptimizations: {
        prioritizeWasm: true,           // Prioritize WebAssembly files
        fastDataLoading: true,          // Faster loading for game data files
        aggressivePrefetch: true,       // Prefetch game resources aggressively
        optimizeFramerate: true,        // Optimize for better framerates
        fastenCodecLoading: true,       // Faster loading for game codecs
        minimizeRewriting: true,        // Minimize JS rewriting for game scripts
        preserveWebGLContext: true,     // Preserve WebGL context
        enhanceCanvasPerformance: true, // Optimize canvas operations
        prioritizeAudioContext: true,   // Prioritize audio context creation
        streamLargeAssets: true,        // Stream large game assets
        parallelAssetLoading: true,     // Load assets in parallel
        optimizeMemoryLayout: true,     // Optimize memory layout for games
        reduceLagTime: true,           // Minimize input lag
        enhanceNetworkStack: true      // Optimize network stack for games
    },
    
    // ULTRA-ENHANCED HIGH TRAFFIC OPTIMIZATIONS
    highTraffic: {
        enabled: false,                 // Auto-detected
        adaptiveTimeouts: true,         // Adjust timeouts based on traffic
        prioritizeGameContent: true,    // Prioritize game content over assets
        skipPrefetching: false,         // Keep prefetching even in high traffic
        useAdvancedLoaders: true,       // Use advanced loading screens
        aggressiveCaching: true,        // More aggressive caching
        connectionLimit: 500,           // Higher connection limit
        chunkSize: 262144,              // Larger chunk size (256KB)
        compressionLevel: 6,            // Balanced compression
        parallelConnections: 8,         // More parallel connections
        priorityQueueing: true,         // Queue requests by priority
        loadBalancing: true,            // Balance load across connections
        adaptiveQuality: false,         // Don't reduce quality in high traffic
        smartRetries: true              // Intelligent retry logic
    },
    
    // NETWORK OPTIMIZATION SETTINGS
    networkOptimizations: {
        enableHttp2: true,              // Use HTTP/2 when available
        enableHttp3: true,              // Use HTTP/3 when available
        connectionReuse: true,          // Reuse connections
        pipelining: true,               // Enable request pipelining
        multiplexing: true,             // Enable request multiplexing
        compressionPreference: ['br', 'gzip', 'deflate'], // Compression priority
        maxRedirects: 10,               // Maximum redirects to follow
        dnsPrefetch: true,              // Enable DNS prefetching
        preconnect: true,               // Enable preconnect hints
        resourceHints: true             // Enable resource hints
    }
};

// ULTRA-ENHANCED HELPER FUNCTIONS

// Enhanced compact encoding for ultra performance
function compactEncode(url) {
    try {
        // Use URLSearchParams for better encoding
        const encoded = encodeURIComponent(url);
        
        // Apply compression mapping for common patterns
        return encoded
            .replace(/%3A/g, ':')
            .replace(/%2F/g, '/')
            .replace(/%3F/g, '?')
            .replace(/%3D/g, '=')
            .replace(/%26/g, '&')
            .replace(/%25/g, '%');
    } catch (e) {
        // Fallback to basic encoding
        return encodeURIComponent(url);
    }
}

// Enhanced compact decoding
function compactDecode(encodedUrl) {
    try {
        return decodeURIComponent(encodedUrl);
    } catch (e) {
        // Fallback decoding
        try {
            return unescape(encodedUrl);
        } catch (e2) {
            return encodedUrl;
        }
    }
}

// Enhanced game resource detection
function isLikelyGameResource(url) {
    const gameFilePatterns = [
        // Unity files
        '.unity3d', '.unityweb', '.data', '.wasm', '.mem', 
        '.framework.js', '.loader.js', '.bundle.js',
        
        // Compressed game files
        '.datagz', '.jsgz', '.asm.js', '.memgz', '.symbols.json',
        
        // Game directories and files
        'UnityLoader.js', 'Build/', 'TemplateData/', 'WebGL/', 
        'StreamingAssets/', 'Resources/',
        
        // Game patterns
        'stream_channel', 'games/', 'game/', 'play/', 'assets/',
        'WebGLBuild', '.gltf', '.glb', 'gamedata', 'sprites/',
        
        // Engine-specific
        'phaser', 'threejs', 'babylonjs', 'playcanvas',
        'construct', 'gamemaker', 'defold', 'godot'
    ];
    
    const gameDomains = [
        'unity3d.com', 'unitycdn', 'cloudfront.net', 'jsdelivr.net',
        'poki.com', 'y8.com', 'crazygames.com', 'unity.com',
        'github.io', 'gamezop.com', 'gamedistribution.com',
        'simmer.io', 'kongregate.com', 'coolmathgames.com',
        'newgrounds.com', 'armor.com', 'miniclip.com',
        'itch.io', 'roblox.com', 'friv.com', 'kizi.com'
    ];
    
    const urlLower = url.toLowerCase();
    
    // Check file patterns
    for (const pattern of gameFilePatterns) {
        if (urlLower.includes(pattern.toLowerCase())) {
            return true;
        }
    }
    
    // Check domains
    for (const domain of gameDomains) {
        if (urlLower.includes(domain.toLowerCase())) {
            return true;
        }
    }
    
    return false;
}

// Enhanced critical resource detection
function isCriticalResource(url) {
    const criticalPatterns = [
        // Critical game files
        'framework.js', 'loader.js', 'bundle.js', 'config.js',
        'main.js', 'app.js', 'game.js', 'unity.js', 'engine.js',
        
        // Critical data files
        '.wasm', 'main.data', 'game.data', 'resources.data',
        
        // Critical Unity files
        'unityloader.js', 'unity.framework.js',
        
        // Critical stylesheets
        'main.css', 'game.css', 'app.css', 'style.css',
        
        // Critical HTML files  
        'index.html', 'game.html', 'play.html'
    ];
    
    const urlLower = url.toLowerCase();
    
    return criticalPatterns.some(pattern => 
        urlLower.includes(pattern.toLowerCase()) ||
        urlLower.endsWith(pattern.toLowerCase())
    );
}

// Enhanced URL analysis for better optimization
function analyzeUrl(url) {
    return {
        isGame: isLikelyGameResource(url),
        isCritical: isCriticalResource(url),
        fileType: getFileType(url),
        compressionPotential: getCompressionPotential(url),
        priority: getPriority(url)
    };
}

// Get file type from URL
function getFileType(url) {
    const extension = url.split('.').pop().toLowerCase();
    const typeMap = {
        'js': 'javascript',
        'css': 'stylesheet', 
        'html': 'document',
        'wasm': 'webassembly',
        'data': 'gamedata',
        'json': 'json',
        'png': 'image',
        'jpg': 'image',
        'jpeg': 'image',
        'gif': 'image',
        'svg': 'image',
        'mp3': 'audio',
        'wav': 'audio',
        'ogg': 'audio',
        'mp4': 'video',
        'webm': 'video'
    };
    
    return typeMap[extension] || 'unknown';
}

// Get compression potential
function getCompressionPotential(url) {
    const highCompressionTypes = ['js', 'css', 'html', 'json', 'svg'];
    const mediumCompressionTypes = ['data', 'txt', 'xml'];
    const lowCompressionTypes = ['wasm', 'png', 'jpg', 'mp3', 'mp4'];
    
    const extension = url.split('.').pop().toLowerCase();
    
    if (highCompressionTypes.includes(extension)) return 'high';
    if (mediumCompressionTypes.includes(extension)) return 'medium';
    if (lowCompressionTypes.includes(extension)) return 'low';
    
    return 'unknown';
}

// Get resource priority
function getPriority(url) {
    if (isCriticalResource(url)) return 'critical';
    if (isLikelyGameResource(url)) return 'high';
    
    const fileType = getFileType(url);
    const priorityMap = {
        'javascript': 'high',
        'stylesheet': 'high', 
        'document': 'high',
        'webassembly': 'critical',
        'gamedata': 'high',
        'json': 'medium',
        'image': 'medium',
        'audio': 'low',
        'video': 'low'
    };
    
    return priorityMap[fileType] || 'low';
}

console.log('[UV Config] Ultra Performance Configuration Loaded');
