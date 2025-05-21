// Fixed Scramjet configuration
self.__scramjet$config = {
    prefix: "/scramjet/",
    codec: "plain", // Use plain encoding by default
    files: {
        wasm: "/scramjet/scramjet.wasm.js",
        worker: "/scramjet/scramjet.worker.js", 
        client: "/scramjet/scramjet.client.js",
        codecs: "/scramjet/scramjet.codecs.js"
    },
    encodeUrl: (url) => {
        if (!url) return "";
        try {
            // Use base64 encoding with URL-safe characters
            return btoa(unescape(encodeURIComponent(url)))
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=/g, "");
        } catch (e) {
            console.error('Error encoding URL:', e);
            return "";
        }
    },
    decodeUrl: (encodedUrl) => {
        if (!encodedUrl) return "";
        try {
            // Restore base64 padding and decode
            let paddedUrl = encodedUrl.replace(/-/g, "+").replace(/_/g, "/");
            
            // Add proper padding
            while (paddedUrl.length % 4) {
                paddedUrl += '=';
            }
            
            return decodeURIComponent(escape(atob(paddedUrl)));
        } catch (e) {
            console.error('Error decoding URL:', e, 'Input:', encodedUrl);
            return "";
        }
    }
};

// Make it globally accessible
if (typeof window !== 'undefined') {
    window.__scramjet$config = self.__scramjet$config;
}

// Add bundle loading
if (typeof self !== 'undefined' && self.__scramjet$config) {
    self.__scramjet$bundle = {
        rewriters: {
            url: {
                encodeUrl: self.__scramjet$config.encodeUrl,
                decodeUrl: self.__scramjet$config.decodeUrl
            },
            rewriteHtml: (html) => html, // Placeholder
            rewriteJs: (js) => js, // Placeholder  
            rewriteCss: (css) => css, // Placeholder
            rewriteHeaders: (headers) => headers || {}, // Placeholder
            rewriteSrcset: (srcset) => srcset // Placeholder
        }
    };
}
