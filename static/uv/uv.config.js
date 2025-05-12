/*global Ultraviolet*/
self.__uv$config = {
    prefix: '/uv/service/',
    bare: '/bare/',
    
    // Regular URL encoding/decoding
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    
    // Standard UV config paths
    handler: '/uv/uv.handler.js',
    client: '/uv/uv.client.js',
    bundle: '/uv/uv.bundle.js',
    config: '/uv/uv.config.js',
    sw: '/uv/uv.sw.js',
    
    // Critical settings for Firebase compatibility
    handler: {
        // Specific handlers for Firebase
        firebaseio: {
            response: (data) => {
                // Preserve content type
                if (data.headers.get('content-type')?.includes('application/json')) {
                    data.headers.set('content-type', 'application/json');
                }
                return data;
            }
        }
    },
    
    // Critical Firebase URL patterns to intercept and handle correctly
    rewriteUrls: [
        // Make sure Firebase long-polling requests work
        {
            source: /^(https?:\/\/.*?firebaseio\.com\/.*?\.lp.*?)$/,
            query: true, // preserve query strings
            rewrite: "$1",
            custom: true
        }
    ],
    
    // Specify patterns that should bypass the normal proxy for direct connection
    directPatterns: [
        /^(https?:\/\/.*?\.firebase.*?\.com.*?)$/,
        /^(https?:\/\/.*?\.google-analytics\.com.*?)$/,
        /^(https?:\/\/.*?\.googleapis\.com.*?)$/
    ],
    
    // Performance and compatibility settings
    timeout: 60000,         // 60 second timeout for slow connections
    strict: false,          // Disable strict mode for better compatibility
    rewriteUrl: false,      // Don't rewrite URLs (preserves original paths)
    cookies: true,          // Enable cookies for proper Firebase authentication
    cors: true,             // Enable CORS fixes
    cacheControl: true,     // Enable cache control
    passKeys: true,         // Pass keys for Firebase WebRTC
    
    // Skip rewriting for certain domains
    skipRewrite: [
        '.firebaseio.com',
        '.googleapis.com'
    ],
    
    // Firebase headers that need preservation
    headers: {
        // Preserve these request headers for Firebase
        request: {
            // Allow the necessary headers for Firebase long-polling
            "Connection": "keep-alive",
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "Content-Type": "$req-content-type", // Preserve content type
            "Origin": "$url-origin",
            "Referer": "$url-referer",
            "User-Agent": "$req-user-agent",
            "X-Firebase-GMPID": "$req-x-firebase-gmpid",
            "X-Firebase-AppCheck": "$req-x-firebase-appcheck",
            "X-Firebase-Auth": "$req-x-firebase-auth"
        },
        // Preserve these response headers from Firebase
        response: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "$res-content-type", // Important to preserve
            "Content-Length": "$res-content-length"
        }
    }
};
