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
            // Fallback to standard Base64 if something goes wrong
            try {
                return Ultraviolet.codec.base64.encode(url);
            } catch (fallbackErr) {
                return btoa(encodeURIComponent(url));
            }
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
                try {
                    return decodeURIComponent(atob(encodedUrl));
                } catch (finalErr) {
                    return encodedUrl; // Return original if all decoding fails
                }
            }
        }
    },
    
    // Standard UV config paths
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
        priorityQueuing: true,        // Priority-based request queuing
        fastErrorRecovery: true,      // Quick error recovery
        reduceRewriteOverhead: true,  // Minimize rewriting overhead
        optimizeHeaders: true,        // Optimize header processing
        streamlineDecoding: true      // Streamline URL decoding
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
        connectionPooling: true,      // Pool connections for efficiency
        batchRequests: true,          // Batch similar requests
        optimizeRedirects: true,      // Optimize redirect handling
        smartCaching: true,           // Intelligent caching strategies
        preemptiveLoading: true       // Load resources before needed
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
            prioritizeCanvas: true,
            fixRenderingIssues: true,
            optimizeForLinux: true,
            enhancedCompatibility: true
        },
        slowDevices: {
            enabled: true,
            simplerAnimations: true,
            reducedEffects: true,
            fasterNetworking: true,
            prioritizeCore: true,
            limitConcurrency: true,
            aggressiveGC: false,       // Don't force GC on slow devices
            reduceMemoryUsage: true,
            optimizeForLowEnd: true,
            simplifyProcessing: true
        },
        mobile: {
            enabled: true,
            touchOptimized: true,
            reducedQuality: false,
            batteryAware: true,
            networkAdaptive: true,
            optimizeForTouch: true,
            responsiveLoading: true,
            mobileSpecificFixes: true
        },
        desktop: {
            enabled: true,
            fullPerformanceMode: true,
            advancedCaching: true,
            parallelProcessing: true,
            enhancedWebGL: true,
            optimizeForSpeed: true
        }
    },
    
    // Enhanced timeout settings for ultra performance
    timeout: 300000,        // 5 minute timeout for ultra performance
    strict: false,          // Disable strict mode for better game compatibility
    rewriteUrl: false,      // Preserve original paths for speed
    cookies: true,          // Enable cookies for better persistence
    safeMethod: false,      // Allow all HTTP methods for compatibility
    chunked: true,          // Enable chunked transfers for better performance
    abuseLevel: 0,          // Minimal abuse protection for maximum speed
    corsPlugin: true,       // Enhanced CORS bypassing
    
    // ULTRA-ENHANCED CONNECTION SETTINGS
    webSocket: true,        // Enable WebSocket support
    fastStream: true,       // Enable faster streaming
    webSocketDirectConnect: true, // Direct WebSocket connections when possible
    wsClientDirectConnect: true,  // Client direct WebSocket connection
    wsClientMaxPayload: 20971520, // 20MB payload limit (increased from 15MB)
    webSocketBuffer: 1048576,     // 1MB WebSocket buffer
    streamChunkSize: 65536,       // 64KB stream chunk size
    maxConcurrentStreams: 10,     // Maximum concurrent streams
    
    // ULTRA-ENHANCED MIME TYPE HANDLING with comprehensive game support
    mimeType: {
        // Basic web files
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.htm': 'text/html',
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.txt': 'text/plain',
        
        // Game engine files
        '.unity3d': 'application/unity',
        '.unityweb': 'application/unity',
        '.data': 'application/octet-stream',
        '.mem': 'application/octet-stream',
        '.wasm': 'application/wasm',
        '.symbols.json': 'application/json',
        '.metadata': 'application/json',
        
        // Compressed game files
        '.datagz': 'application/octet-stream',
        '.jsgz': 'application/javascript',
        '.asm.js': 'application/javascript',
        '.memgz': 'application/octet-stream',
        '.json.gz': 'application/json',
        '.gz': 'application/gzip',
        '.br': 'application/brotli',
        '.zip': 'application/zip',
        
        // Framework and bundle files
        '.bundle': 'application/javascript',
        '.bundle.js': 'application/javascript',
        '.framework.js': 'application/javascript',
        '.loader.js': 'application/javascript',
        '.bootstrap.js': 'application/javascript',
        '.runtime.js': 'application/javascript',
        '.vendor.js': 'application/javascript',
        '.main.js': 'application/javascript',
        '.app.js': 'application/javascript',
        '.game.js': 'application/javascript',
        
        // 3D model and texture files
        '.gltf': 'model/gltf+json',
        '.glb': 'model/gltf-binary',
        '.fbx': 'application/octet-stream',
        '.obj': 'application/octet-stream',
        '.mtl': 'text/plain',
        '.dae': 'model/vnd.collada+xml',
        
        // Image files
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
        '.tiff': 'image/tiff',
        '.ico': 'image/x-icon',
        '.avif': 'image/avif',
        
        // Audio files
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4',
        '.aac': 'audio/aac',
        '.flac': 'audio/flac',
        '.opus': 'audio/opus',
        '.webm': 'audio/webm',
        
        // Video files
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogv': 'video/ogg',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.mkv': 'video/x-matroska',
        
        // Font files
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.otf': 'font/otf',
        '.eot': 'application/vnd.ms-fontobject',
        
        // Special API responses and domains
        'firebaseio.com': 'application/json',
        'googleapis.com': 'application/json',
        'api.': 'application/json',
        'rest/': 'application/json',
        'graphql': 'application/json',
        
        // Game-specific file types
        '.pak': 'application/octet-stream',
        '.asset': 'application/octet-stream',
        '.prefab': 'application/octet-stream',
        '.scene': 'application/octet-stream',
        '.unity': 'application/octet-stream',
        '.manifest': 'text/plain',
        '.cache': 'application/octet-stream',
        '.save': 'application/octet-stream'
    },
    
    // ULTRA-EXPANDED GAMING DOMAINS AND HOSTNAMES
    hostnames: [
        // Core gaming infrastructure
        'firebaseio.com',
        'firebase.googleapis.com',
        'identitytoolkit.googleapis.com',
        'securetoken.googleapis.com',
        'firebaseapp.com',
        'firebasestorage.googleapis.com',
        
        // Unity and game engines
        'unity3d.com',
        'unity.com',
        'unitycdn.com',
        'unitycloud.com',
        'unity3dusercontent.com',
        'unityhub.unity3d.com',
        
        // CDNs and hosting services
        'jsdelivr.net',
        'unpkg.com',
        'cdnjs.cloudflare.com',
        'cloudfront.net',
        'cloudflare.com',
        'fastly.com',
        'maxcdn.com',
        'bootstrapcdn.com',
        'gstatic.com',
        'googleapis.com',
        'googleusercontent.com',
        
        // GitHub and development platforms
        'github.io',
        'githubusercontent.com',
        'gitcdn.xyz',
        'rawgit.com',
        'rawgithub.com',
        'raw.github.com',
        'gist.github.com',
        'gitiles.com',
        
        // Modern hosting platforms
        'glitch.me',
        'glitch.com',
        'replit.com',
        'repl.co',
        'vercel.app',
        'netlify.app',
        'netlify.com',
        'heroku.com',
        'herokuapp.com',
        'surge.sh',
        'firebase.app',
        'web.app',
        'page.dev',
        
        // Major gaming platforms
        'poki.com',
        'poki-gdn.com',
        'coolmathgames.com',
        'coolmath-games.com',
        'y8.com',
        'crazygames.com',
        'kizi.com',
        'friv.com',
        'friv5.com',
        'kongregate.com',
        'kongregate.io',
        'newgrounds.com',
        'armor.com',
        'armorgames.com',
        'addictinggames.com',
        'miniclip.com',
        'silvergames.com',
        'agame.com',
        'mousebreaker.com',
        'nitrome.com',
        'notdoppler.com',
        
        // Game distribution and indie platforms
        'gamedistribution.com',
        'simmer.io',
        'itch.io',
        'itchspace.io',
        'gamejolt.com',
        'kartridge.com',
        'gamepix.com',
        'crazygames.com',
        'lagged.com',
        'unblocked-games.s3.amazonaws.com',
        
        // Educational and math games
        'mathplayground.com',
        'hoddaminecraft.com',
        'scratch.mit.edu',
        'code.org',
        'tynker.com',
        'codecombat.com',
        
        // Specialized gaming platforms
        'iogames.space',
        'krunker.io',
        'shell-shockers.com',
        'skribbl.io',
        'diep.io',
        'agar.io',
        'slither.io',
        'zombsroyale.io',
        'surviv.io',
        
        // Major game companies
        'roblox.com',
        'rbxcdn.com',
        'epicgames.com',
        'steampowered.com',
        'steamcommunity.com',
        'gog.com',
        'origin.com',
        'ubisoft.com',
        'activision.com',
        'ea.com',
        'blizzard.com',
        'battle.net',
        
        // Mobile gaming
        'supercell.com',
        'king.com',
        'rovio.com',
        'angrybirds.com',
        'pokemongo.com',
        'nianticlabs.com',
        
        // CDN and optimization services
        'imgix.net',
        'akamaihd.net',
        'akamaized.net',
        'edgecastcdn.net',
        'stackpathdns.com',
        'keycdn.com',
        'bunnycdn.com',
        'amazoncognito.com',
        'auth0.com',
        
        // Cloud storage and APIs
        'amazonaws.com',
        's3.amazonaws.com',
        'storage.googleapis.com',
        'azureedge.net',
        'digitaloceanspaces.com',
        'backblazeb2.com',
        
        // Analytics and tracking (for games)
        'google-analytics.com',
        'googletagmanager.com',
        'facebook.com',
        'connect.facebook.net',
        'doubleclick.net',
        'googlesyndication.com',
        'adsystem.com',
        'amazon-adsystem.com',
        
        // Game development tools
        'construct.net',
        'construct3.io',
        'gamemaker.io',
        'yoyogames.com',
        'defold.com',
        'godotengine.org',
        'unrealengine.com',
        'playcanvas.com',
        'babylonjs.com',
        'threejs.org',
        'pixijs.com',
        'phaser.io',
        'createjs.com',
        
        // Streaming and video
        'twitch.tv',
        'youtube.com',
        'ytimg.com',
        'vimeo.com',
        'dailymotion.com',
        'wistia.com',
        'brightcove.com',
        
        // Social and community
        'discord.com',
        'discordapp.com',
        'reddit.com',
        'imgur.com',
        'giphy.com',
        'tenor.com'
    ],
    
    // ULTRA-EXPANDED UNBLOCK LIST - includes all hostnames plus patterns
    unblock: [
        // Copy all hostnames
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
        'coolmath-games.com',
        'crazygames.com',
        'y8.com',
        'friv.com',
        'friv5.com',
        'kizi.com',
        'kongregate.com',
        'kongregate.io',
        'newgrounds.com',
        'armor.com',
        'armorgames.com',
        'addictinggames.com',
        'miniclip.com',
        'silvergames.com',
        'nitrome.com',
        'mousebreaker.com',
        'notdoppler.com',
        
        // Development and hosting
        'rawgit.com',
        'rawgithub.com',
        'gitcdn.xyz',
        'heroku.com',
        'herokuapp.com',
        'surge.sh',
        'firebase.app',
        'web.app',
        
        // Game engines and frameworks
        'gamedistribution.com',
        'simmer.io',
        'itch.io',
        'itchspace.io',
        'gamejolt.com',
        'roblox.com',
        'rbxcdn.com',
        'scratch.mit.edu',
        
        // IO games
        'krunker.io',
        'shell-shockers.com',
        'skribbl.io',
        'diep.io',
        'agar.io',
        'slither.io',
        'zombsroyale.io',
        'surviv.io',
        
        // CDNs and services
        'akamaihd.net',
        'akamaized.net',
        'cdnjs.cloudflare.com',
        'unpkg.com',
        'fastly.com',
        'maxcdn.com',
        'imgix.net',
        'edgecastcdn.net',
        'stackpathdns.com',
        'keycdn.com',
        'bunnycdn.com',
        
        // Cloud storage
        'amazonaws.com',
        's3.amazonaws.com',
        'storage.googleapis.com',
        'azureedge.net',
        'digitaloceanspaces.com',
        
        // Additional wildcard patterns
        '.github.io',
        '.netlify.app',
        '.vercel.app',
        '.glitch.me',
        '.repl.co',
        '.herokuapp.com',
        '.surge.sh',
        '.firebase.app',
        '.web.app',
        '.page.dev',
        '.githubusercontent.com',
        '.gitcdn.xyz',
        '.rawgit.com',
        '.s3.amazonaws.com',
        '.cloudfront.net',
        '.fastly.com',
        '.akamaized.net',
        '.cdnjs.cloudflare.com'
    ],
    
    // ULTRA-ENHANCED HEADERS CONFIGURATION
    headers: {
        request: {
            // Core headers
            "DNT": "1",
            "Upgrade-Insecure-Requests": "1",
            "Priority": "u=1, i", 
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            
            // Connection and caching
            "Connection": "keep-alive, Upgrade", 
            "Cache-Control": "public, max-age=31536000",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            
            // WebSocket headers
            "Upgrade": "$req-upgrade",
            "Sec-WebSocket-Extensions": "$req-sec-websocket-extensions",
            "Sec-WebSocket-Key": "$req-sec-websocket-key",
            "Sec-WebSocket-Protocol": "$req-sec-websocket-protocol",
            "Sec-WebSocket-Version": "$req-sec-websocket-version",
            
            // User agent (will be replaced by actual)
            "User-Agent": "$req-user-agent"
        },
        response: {
            // Core response headers
            "X-Content-Type-Options": "nosniff",
            "Content-Type": "$res-content-type",
            
            // Enhanced CORS for maximum compatibility
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Expose-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
            
            // Enhanced caching headers
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400, stale-if-error=604800",
            "Vary": "Accept-Encoding, User-Agent",
            
            // Performance and security headers
            "X-UV-Ultra-Fast": "true",
            "X-UV-Optimized": "true",
            "Referrer-Policy": "no-referrer-when-downgrade",
            
            // Compression support indication
            "Content-Encoding": "$res-content-encoding"
        },
        preserve: {
            // WebSocket headers - critical for real-time games
            'websocket': [
                'Upgrade',
                'Connection',
                'Sec-WebSocket-Accept',
                'Sec-WebSocket-Extensions',
                'Sec-WebSocket-Key',
                'Sec-WebSocket-Protocol',
                'Sec-WebSocket-Version',
                'Sec-WebSocket-Origin'
            ],
            
            // Caching headers - important for performance
            'caching': [
                'Cache-Control',
                'ETag',
                'Last-Modified',
                'Expires',
                'Age',
                'Vary',
                'If-Modified-Since',
                'If-None-Match'
            ],
            
            // Compression headers - essential for bandwidth
            'compression': [
                'Content-Encoding',
                'Content-Length',
                'Transfer-Encoding',
                'Accept-Encoding'
            ],
            
            // Security headers (preserve for compatibility)
            'security': [
                'Content-Security-Policy',
                'Content-Security-Policy-Report-Only',
                'X-Frame-Options',
                'X-Content-Type-Options',
                'X-XSS-Protection',
                'Strict-Transport-Security',
                'Referrer-Policy'
            ],
            
            // Game-specific headers
            'gaming': [
                'X-Unity-Version',
                'X-Game-Build',
                'X-Game-Version',
                'X-Platform',
                'X-Device-Type'
            ],
            
            // API and authentication headers
            'api': [
                'Authorization',
                'WWW-Authenticate',
                'X-API-Key',
                'X-Auth-Token',
                'X-Session-Token'
            ]
        }
    },
    
    // ULTRA-ENHANCED GAME OPTIMIZATIONS
    gameOptimizations: {
        // Core optimizations
        prioritizeWasm: true,           // Prioritize WebAssembly files
        fastDataLoading: true,          // Faster loading for game data files
        aggressivePrefetch: true,       // Prefetch game resources aggressively
        optimizeFramerate: true,        // Optimize for better framerates
        fastenCodecLoading: true,       // Faster loading for game codecs
        minimizeRewriting: true,        // Minimize JS rewriting for game scripts
        preserveWebGLContext: true,     // Preserve WebGL context
        
        // Advanced optimizations
        enhanceCanvasPerformance: true, // Optimize canvas operations
        prioritizeAudioContext: true,   // Prioritize audio context creation
        streamLargeAssets: true,        // Stream large game assets
        parallelAssetLoading: true,     // Load assets in parallel
        optimizeMemoryLayout: true,     // Optimize memory layout for games
        reduceLagTime: true,           // Minimize input lag
        enhanceNetworkStack: true,     // Optimize network stack for games
        
        // Game engine specific
        unityOptimizations: true,       // Unity-specific optimizations
        unrealOptimizations: true,      // Unreal Engine optimizations
        godotOptimizations: true,       // Godot Engine optimizations
        constructOptimizations: true,   // Construct 3 optimizations
        phaserOptimizations: true,      // Phaser.js optimizations
        pixiOptimizations: true,        // PixiJS optimizations
        threeJsOptimizations: true,     // Three.js optimizations
        babylonOptimizations: true,     // Babylon.js optimizations
        
        // Performance enhancements
        gpuAcceleration: true,          // Enable GPU acceleration when possible
        webWorkerOptimization: true,    // Optimize web worker usage
        serviceWorkerCaching: true,     // Enhanced service worker caching
        compressionOptimization: true,  // Optimize compression for games
        networkOptimization: true,      // Network-specific optimizations
        memoryOptimization: true,       // Memory usage optimizations
        cpuOptimization: true,          // CPU usage optimizations
        batteryOptimization: false      // Battery optimization (disabled for performance)
    },
    
    // ULTRA-ENHANCED HIGH TRAFFIC OPTIMIZATIONS
    highTraffic: {
        enabled: false,                 // Auto-detected based on load
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
        smartRetries: true,             // Intelligent retry logic
        
        // Advanced high traffic settings
        dynamicResourcePrioritization: true, // Dynamic priority adjustment
        intelligentCaching: true,       // Smart caching decisions
        connectionPooling: true,        // Pool connections efficiently
        requestCoalescing: true,        // Combine similar requests
        responseStreaming: true,        // Stream responses for large files
        compressionNegotiation: true,   // Negotiate best compression
        bandwidthAdaptation: true,      // Adapt to available bandwidth
        latencyOptimization: true,      // Optimize for low latency
        throughputOptimization: true    // Optimize for high throughput
    },
    
    // ADVANCED NETWORK OPTIMIZATION SETTINGS
    networkOptimizations: {
        // Protocol optimizations
        enableHttp2: true,              // Use HTTP/2 when available
        enableHttp3: true,              // Use HTTP/3 when available
        enableQuic: true,               // Enable QUIC protocol
        connectionReuse: true,          // Reuse connections
        pipelining: true,               // Enable request pipelining
        multiplexing: true,             // Enable request multiplexing
        
        // Compression settings
        compressionPreference: ['br', 'gzip', 'deflate'], // Compression priority
        adaptiveCompression: true,      // Adjust compression based on content
        compressionThreshold: 1024,     // Minimum size for compression
        
        // Connection management
        maxRedirects: 10,               // Maximum redirects to follow
        connectionTimeout: 30000,       // Connection timeout (30s)
        requestTimeout: 300000,         // Request timeout (5 minutes)
        keepAliveTimeout: 60000,        // Keep-alive timeout (1 minute)
        
        // DNS and connection hints
        dnsPrefetch: true,              // Enable DNS prefetching
        preconnect: true,               // Enable preconnect hints
        resourceHints: true,            // Enable resource hints
        http2Push: true,                // Enable HTTP/2 server push
        
        // Advanced features
        tcpOptimization: true,          // TCP-level optimizations
        bandwidthDetection: true,       // Detect available bandwidth
        networkTypeDetection: true,     // Detect network type (WiFi, cellular, etc.)
        adaptiveStreaming: true,        // Adaptive streaming based on network
        intelligentRetries: true,       // Smart retry logic
        circuitBreaker: true,           // Circuit breaker pattern for failing services
        loadBalancing: true,            // Load balance across multiple endpoints
        failover: true                  // Automatic failover to backup servers
    },
    
    // ENHANCED ERROR HANDLING AND RECOVERY
    errorHandling: {
        maxRetries: 3,                  // Maximum retry attempts
        retryDelay: 1000,               // Base retry delay (1 second)
        exponentialBackoff: true,       // Use exponential backoff
        jitterEnabled: true,            // Add jitter to retry delays
        
        // Recovery strategies
        gracefulDegradation: true,      // Gracefully degrade on errors
        fallbackStrategies: true,      // Use fallback strategies
        errorReporting: true,           // Report errors for monitoring
        userNotification: true,         // Notify users of errors when appropriate
        
        // Specific error handling
        networkErrorHandling: true,     // Handle network errors
        timeoutErrorHandling: true,     // Handle timeout errors
        corsErrorHandling: true,        // Handle CORS errors
        certificateErrorHandling: true, // Handle certificate errors
        dnsErrorHandling: true,         // Handle DNS errors
        serverErrorHandling: true       // Handle server errors (5xx)
    },
    
    // MONITORING AND ANALYTICS
    monitoring: {
        enabled: true,                  // Enable monitoring
        performanceMetrics: true,       // Collect performance metrics
        errorTracking: true,            // Track errors
        networkMetrics: true,           // Monitor network performance
        userExperienceMetrics: true,    // Track user experience metrics
        
        // Metrics collection
        responseTimeTracking: true,     // Track response times
        throughputTracking: true,       // Track data throughput
        errorRateTracking: true,        // Track error rates
        cacheHitRateTracking: true,     // Track cache hit rates
        
        // Reporting
        metricsReporting: false,        // Report metrics (disabled for privacy)
        anonymousReporting: false,      // Anonymous reporting (disabled)
        localMetricsStorage: true       // Store metrics locally for debugging
    }
};

// ULTRA-ENHANCED HELPER FUNCTIONS

// Enhanced compact encoding for ultra performance
function compactEncode(url) {
    try {
        // Fast path for common URLs
        if (url.length < 100 && !url.includes('%')) {
            return encodeURIComponent(url);
        }
        
        // Use URLSearchParams for better encoding of complex URLs
        const encoded = encodeURIComponent(url);
        
        // Apply compression mapping for common patterns to reduce size
        return encoded
            .replace(/%3A/g, ':')      // :
            .replace(/%2F/g, '/')      // /
            .replace(/%3F/g, '?')      // ?
            .replace(/%3D/g, '=')      // =
            .replace(/%26/g, '&')      // &
            .replace(/%23/g, '#')      // #
            .replace(/%2B/g, '+')      // +
            .replace(/%20/g, '+')      // space as +
            .replace(/%25/g, '%');     // %
    } catch (e) {
        // Fallback to basic encoding
        try {
            return encodeURIComponent(url);
        } catch (e2) {
            return url;
        }
    }
}

// Enhanced compact decoding with multiple fallback strategies
function compactDecode(encodedUrl) {
    try {
        // Fast path for simple URLs
        if (!encodedUrl.includes('%') && !encodedUrl.includes('+')) {
            return encodedUrl;
        }
        
        // Standard decoding
        return decodeURIComponent(encodedUrl.replace(/\+/g, ' '));
    } catch (e) {
        // Fallback strategies
        try {
            return decodeURIComponent(encodedUrl);
        } catch (e2) {
            try {
                return unescape(encodedUrl);
            } catch (e3) {
                // Last resort - return original
                console.warn('Failed to decode URL:', encodedUrl);
                return encodedUrl;
            }
        }
    }
}

// Enhanced game resource detection with comprehensive patterns
function isLikelyGameResource(url) {
    // Quick check for obvious non-game resources
    if (!url || url.length < 4) return false;
    
    const urlLower = url.toLowerCase();
    
    // Game file extensions and patterns
    const gameFilePatterns = [
        // Unity files
        '.unity3d', '.unityweb', '.data', '.wasm', '.mem', 
        '.framework.js', '.loader.js', '.bundle.js', '.config.js',
        'unityloader.js', 'unity.framework.js', 'unity.loader.js',
        
        // Compressed game files
        '.datagz', '.jsgz', '.asm.js', '.memgz', '.symbols.json',
        '.json.gz', '.gz', '.br', '.zip',
        
        // Game directories and files
        'build/', 'templatedata/', 'webgl/', 'streamingassets/', 'resources/',
        'assets/', 'sprites/', 'textures/', 'sounds/', 'music/',
        'gamedata/', 'levels/', 'maps/', 'scenes/',
        
        // 3D model and asset files
        '.gltf', '.glb', '.fbx', '.obj', '.dae', '.blend',
        '.pak', '.asset', '.prefab', '.scene', '.unity',
        
        // Game patterns in URLs
        'stream_channel', 'games/', 'game/', 'play/', 'gaming/',
        'webglbuild', 'html5game', 'flashgame', 'unitywebgl',
        
        // Engine-specific patterns
        'phaser', 'threejs', 'three.js', 'babylonjs', 'babylon.js',
        'pixijs', 'pixi.js', 'construct', 'gamemaker', 'defold', 
        'godot', 'unreal', 'cryengine', 'frostbite',
        
        // Framework and library patterns
        'jquery.min.js', 'bootstrap.min.js', 'angular.min.js',
        'react.min.js', 'vue.min.js', 'lodash.min.js',
        
        // Game-specific file types
        '.save', '.cache', '.manifest', '.metadata',
        '.database', '.sqlite', '.db'
    ];
    
    // Gaming domains and platforms
    const gameDomains = [
        // Unity and engines
        'unity3d.com', 'unitycdn', 'unity.com', 'unitycloud.com',
        
        // Major gaming platforms
        'poki.com', 'y8.com', 'crazygames.com', 'coolmathgames.com',
        'friv.com', 'kizi.com', 'kongregate.com', 'newgrounds.com',
        'armor.com', 'miniclip.com', 'addictinggames.com',
        'silvergames.com', 'nitrome.com', 'mousebreaker.com',
        
        // Development platforms
        'github.io', 'githubusercontent.com', 'glitch.me', 'replit.com',
        'vercel.app', 'netlify.app', 'heroku.com', 'surge.sh',
        
        // Game distribution
        'gamedistribution.com', 'simmer.io', 'itch.io', 'gamejolt.com',
        'kartridge.com', 'gamepix.com', 'lagged.com',
        
        // IO games
        'krunker.io', 'diep.io', 'agar.io', 'slither.io', 'surviv.io',
        'zombsroyale.io', 'shell-shockers.com', 'skribbl.io',
        
        // Educational games
        'scratch.mit.edu', 'code.org', 'tynker.com', 'codecombat.com',
        'mathplayground.com', 'hoddaminecraft.com',
        
        // Major game companies
        'roblox.com', 'minecraft.net', 'mojang.com', 'epicgames.com',
        'steampowered.com', 'ea.com', 'ubisoft.com', 'activision.com',
        
        // CDNs often used for games
        'cloudfront.net', 'jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com',
        'amazonaws.com', 'storage.googleapis.com'
    ];
    
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
    
    // Additional heuristics
    // Check for common game-related terms in the URL path
    const gameTerms = [
        'game', 'play', 'unity', 'webgl', 'html5', 'flash', 'arcade',
        'puzzle', 'action', 'adventure', 'strategy', 'simulation',
        'racing', 'sports', 'shooter', 'rpg', 'mmo', 'multiplayer'
    ];
    
    const pathParts = urlLower.split('/');
    for (const part of pathParts) {
        if (gameTerms.some(term => part.includes(term))) {
            return true;
        }
    }
    
    return false;
}

// Enhanced critical resource detection with priority levels
function isCriticalResource(url) {
    if (!url) return false;
    
    const urlLower = url.toLowerCase();
    
    // Critical patterns that must load first
    const criticalPatterns = [
        // Core framework files
        'framework.js', 'loader.js', 'bootstrap.js', 'runtime.js',
        'main.js', 'app.js', 'game.js', 'unity.js', 'engine.js',
        'bundle.js', 'vendor.js', 'polyfills.js',
        
        // Configuration files
        'config.js', 'settings.js', 'manifest.json', 'package.json',
        
        // Critical Unity files
        'unityloader.js', 'unity.framework.js', 'unity.loader.js',
        'unity.data', 'unity.wasm',
        
        // WebAssembly files
        '.wasm', 'main.wasm', 'game.wasm', 'engine.wasm',
        
        // Critical data files
        'main.data', 'game.data', 'resources.data', 'assets.data',
        'boot.data', 'init.data',
        
        // Critical stylesheets
        'main.css', 'game.css', 'app.css', 'style.css', 'base.css',
        'bootstrap.css', 'foundation.css',
        
        // Critical HTML files
        'index.html', 'game.html', 'play.html', 'app.html',
        'main.html', 'boot.html',
        
        // Critical manifest files
        'manifest.json', 'app.manifest', 'game.manifest',
        'sw.js', 'service-worker.js', 'serviceworker.js'
    ];
    
    // Check for critical patterns
    for (const pattern of criticalPatterns) {
        if (urlLower.includes(pattern.toLowerCase()) || 
            urlLower.endsWith(pattern.toLowerCase())) {
            return true;
        }
    }
    
    // Check for critical file extensions at end of URL
    const criticalExtensions = ['.wasm', '.data', '.framework.js', '.loader.js'];
    for (const ext of criticalExtensions) {
        if (urlLower.endsWith(ext)) {
            return true;
        }
    }
    
    return false;
}

// Enhanced URL analysis for comprehensive optimization
function analyzeUrl(url) {
    if (!url) {
        return {
            isGame: false,
            isCritical: false,
            fileType: 'unknown',
            compressionPotential: 'unknown',
            priority: 'low',
            cacheability: 'low',
            size: 'unknown'
        };
    }
    
    const urlLower = url.toLowerCase();
    const isGame = isLikelyGameResource(url);
    const isCritical = isCriticalResource(url);
    
    return {
        isGame: isGame,
        isCritical: isCritical,
        fileType: getFileType(url),
        compressionPotential: getCompressionPotential(url),
        priority: getPriority(url, isGame, isCritical),
        cacheability: getCacheability(url, isGame, isCritical),
        size: getExpectedSize(url),
        bandwidth: getBandwidthRequirement(url),
        latency: getLatencySensitivity(url)
    };
}

// Get file type from URL with enhanced detection
function getFileType(url) {
    if (!url) return 'unknown';
    
    // Extract extension, handling query parameters and fragments
    const cleanUrl = url.split('?')[0].split('#')[0];
    const extension = cleanUrl.split('.').pop().toLowerCase();
    
    const typeMap = {
        // Scripts
        'js': 'javascript',
        'mjs': 'javascript',
        'ts': 'typescript',
        'jsx': 'javascript',
        'tsx': 'typescript',
        
        // Styles
        'css': 'stylesheet',
        'scss': 'stylesheet',
        'sass': 'stylesheet',
        'less': 'stylesheet',
        
        // Documents
        'html': 'document',
        'htm': 'document',
        'xhtml': 'document',
        'xml': 'document',
        'json': 'json',
        'txt': 'text',
        
        // Game files
        'wasm': 'webassembly',
        'data': 'gamedata',
        'unity3d': 'unity',
        'unityweb': 'unity',
        'pak': 'gamedata',
        'asset': 'gamedata',
        
        // Images
        'png': 'image',
        'jpg': 'image',
        'jpeg': 'image',
        'gif': 'image',
        'svg': 'image',
        'webp': 'image',
        'bmp': 'image',
        'ico': 'image',
        'tiff': 'image',
        'avif': 'image',
        
        // Audio
        'mp3': 'audio',
        'wav': 'audio',
        'ogg': 'audio',
        'm4a': 'audio',
        'aac': 'audio',
        'flac': 'audio',
        'opus': 'audio',
        
        // Video
        'mp4': 'video',
        'webm': 'video',
        'ogv': 'video',
        'avi': 'video',
        'mov': 'video',
        'mkv': 'video',
        
        // Fonts
        'woff': 'font',
        'woff2': 'font',
        'ttf': 'font',
        'otf': 'font',
        'eot': 'font',
        
        // Archives
        'zip': 'archive',
        'gz': 'archive',
        'br': 'archive',
        'tar': 'archive',
        '7z': 'archive',
        
        // 3D models
        'gltf': 'model',
        'glb': 'model',
        'fbx': 'model',
        'obj': 'model',
        'dae': 'model'
    };
    
    return typeMap[extension] || 'unknown';
}

// Get compression potential with detailed analysis
function getCompressionPotential(url) {
    if (!url) return 'unknown';
    
    const fileType = getFileType(url);
    const extension = url.split('.').pop().toLowerCase();
    
    // Already compressed formats
    const alreadyCompressed = ['gz', 'br', 'zip', '7z', 'png', 'jpg', 'jpeg', 'gif', 'mp3', 'mp4', 'webm', 'ogg', 'woff', 'woff2'];
    if (alreadyCompressed.includes(extension)) {
        return 'none';
    }
    
    // High compression potential
    const highCompressionTypes = ['javascript', 'stylesheet', 'document', 'json', 'text', 'xml'];
    if (highCompressionTypes.includes(fileType)) {
        return 'high';
    }
    
    // Medium compression potential
    const mediumCompressionTypes = ['gamedata', 'svg'];
    if (mediumCompressionTypes.includes(fileType)) {
        return 'medium';
    }
    
    // Low compression potential
    const lowCompressionTypes = ['webassembly', 'image', 'audio', 'video', 'font', 'archive'];
    if (lowCompressionTypes.includes(fileType)) {
        return 'low';
    }
    
    return 'unknown';
}

// Get resource priority with enhanced logic
function getPriority(url, isGame = null, isCritical = null) {
    if (isCritical === null) isCritical = isCriticalResource(url);
    if (isGame === null) isGame = isLikelyGameResource(url);
    
    // Critical resources always get highest priority
    if (isCritical) return 'critical';
    
    // Game resources get high priority
    if (isGame) return 'high';
    
    const fileType = getFileType(url);
    const priorityMap = {
        'javascript': 'high',
        'stylesheet': 'high',
        'document': 'high',
        'webassembly': 'critical',
        'gamedata': 'high',
        'unity': 'high',
        'json': 'medium',
        'image': 'medium',
        'font': 'medium',
        'audio': 'low',
        'video': 'low',
        'archive': 'low'
    };
    
    return priorityMap[fileType] || 'low';
}

// Get cacheability assessment
function getCacheability(url, isGame = null, isCritical = null) {
    if (!url) return 'low';
    
    if (isGame === null) isGame = isLikelyGameResource(url);
    if (isCritical === null) isCritical = isCriticalResource(url);
    
    // Critical resources should be cached aggressively
    if (isCritical) return 'high';
    
    // Game resources generally have good cacheability
    if (isGame) return 'high';
    
    const fileType = getFileType(url);
    const cacheabilityMap = {
        'javascript': 'high',
        'stylesheet': 'high',
        'image': 'high',
        'font': 'high',
        'webassembly': 'high',
        'gamedata': 'high',
        'unity': 'high',
        'audio': 'medium',
        'video': 'medium',
        'document': 'low',  // HTML might change frequently
        'json': 'medium',   // APIs might change
        'text': 'low',
        'xml': 'low'
    };
    
    return cacheabilityMap[fileType] || 'medium';
}

// Get expected file size category
function getExpectedSize(url) {
    if (!url) return 'unknown';
    
    const fileType = getFileType(url);
    const sizeMap = {
        'webassembly': 'large',     // WASM files are typically large
        'gamedata': 'large',        // Game data files are large
        'unity': 'large',           // Unity files are large
        'video': 'large',           // Video files are large
        'audio': 'medium',          // Audio files are medium
        'image': 'medium',          // Images are medium
        'javascript': 'medium',     // JS bundles can be medium to large
        'stylesheet': 'small',      // CSS is usually small
        'font': 'small',            // Fonts are relatively small
        'document': 'small',        // HTML is usually small
        'json': 'small',            // JSON APIs are usually small
        'text': 'small',            // Text files are small
        'xml': 'small'              // XML is usually small
    };
    
    return sizeMap[fileType] || 'unknown';
}

// Get bandwidth requirement
function getBandwidthRequirement(url) {
    const expectedSize = getExpectedSize(url);
    const fileType = getFileType(url);
    
    // Video and large game files need high bandwidth
    if (fileType === 'video' || expectedSize === 'large') {
        return 'high';
    }
    
    // Audio and medium files need medium bandwidth
    if (fileType === 'audio' || expectedSize === 'medium') {
        return 'medium';
    }
    
    // Everything else is low bandwidth
    return 'low';
}

// Get latency sensitivity
function getLatencySensitivity(url) {
    const isCritical = isCriticalResource(url);
    const fileType = getFileType(url);
    
    // Critical resources are very latency sensitive
    if (isCritical) return 'high';
    
    // Interactive content is latency sensitive
    if (['javascript', 'document', 'json'].includes(fileType)) {
        return 'medium';
    }
    
    // Media files are less latency sensitive
    if (['image', 'audio', 'video', 'font'].includes(fileType)) {
        return 'low';
    }
    
    return 'medium';
}

// Console log for debugging
console.log('[UV Config] Ultra Performance Configuration Loaded with Enhanced Game Support');

// Export configuration for external access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = self.__uv$config;
}
