/*global Ultraviolet*/
self.__uv$config = {
    prefix: '/uv/service/',
    bare: '/bare/',
    
    // Replace the standard base64 with a more efficient custom encoder
    encodeUrl: function(url) {
        // Simple and efficient custom encoding
        // This reduces URL length while maintaining compatibility
        if (!url) return url;
        try {
            // Use a faster implementation of base64 with optimizations for URLs
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
    
    handler: '/uv/uv.handler.js',
    client: '/uv/uv.client.js',
    bundle: '/uv/uv.bundle.js',
    config: '/uv/uv.config.js',
    sw: '/uv/uv.sw.js',
    
    // Optimized settings for game loading
    timeout: 30000,       // Reduced to 30 seconds for better UX but still enough for most games
    strict: false,        // Keeps strict mode disabled for better compatibility
    rewriteUrl: false,    // Keeps URLs passing through naturally
    cookies: true,        // Cookies remain enabled for game state persistence
    safeMethod: false,    // Allow all HTTP methods
    chunked: true,        // Keep chunked transfers for large assets
    abuseLevel: 0,        // Low abuse protection for better performance
    worker: true,         // Worker mode for better performance
    
    // New optimized settings
    fastChunkSize: 65536, // Larger chunk size for faster streaming of game assets
    corsBypass: true,     // Aggressive CORS bypass for game resources
    webSocketCompression: false, // Disable WebSocket compression for lower latency
    logLevel: 'error'     // Only log errors to reduce console noise
};
