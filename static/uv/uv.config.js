const xor = {
    encode(str) {
      if (!str) return str;
      let result = "";
      for (let i = 0; i < str.length; i++) {
        result += i % 4 ? String.fromCharCode(str.charCodeAt(i) ^ 2) : str[i];
      }
      return encodeURIComponent(result);
    },
    decode(str) {
      if (!str) return str;
      const [input, ...search] = str.split("?");
      let result = "";
      const decoded = decodeURIComponent(input);
      for (let i = 0; i < decoded.length; i++) {
        result +=
          i % 4 ? String.fromCharCode(decoded.charCodeAt(i) ^ 2) : decoded[i];
      }
      return result + (search.length ? "?" + search.join("?") : "");
    },
};
/*global Ultraviolet*/
self.__uv$config = {
    prefix: '/uv/service/',
    bare: '/bare/',
    encodeUrl: Ultraviolet.codec.base64.encode,
    decodeUrl: Ultraviolet.codec.base64.decode,
    handler: '/uv/uv.handler.js',
    client: '/uv/uv.client.js',
    bundle: '/uv/uv.bundle.js',
    config: '/uv/uv.config.js',
    sw: '/uv/uv.sw.js',
    
    // Added optimizations for game loading
    timeout: 60000,       // Increased timeout to 60 seconds for slow-loading games
    strict: false,        // Disabled strict mode for better compatibility
    rewriteUrl: false,    // Let URLs pass through more naturally
    cookies: true,        // Enable cookies for better game state persistence
    safeMethod: false,    // Allow all HTTP methods for better game API compatibility
    chunked: true,        // Enable chunked transfers for large game assets
    abuseLevel: 0,        // Lowest abuse protection level for better performance
    worker: true          // Use worker mode when possible for better performance
};
