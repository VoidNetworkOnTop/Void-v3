// Helper functions for working with Scramjet
window.Scramjet = {
    // Encode a URL for use with Scramjet
    encode: function (url) {
        if (!window.__scramjet$config) {
            console.error('Scramjet config not loaded');
            return url;
        }
        return window.__scramjet$config.prefix + window.__scramjet$config.encodeUrl(url);
    },

    // Get the original URL from a Scramjet URL
    decode: function (url) {
        if (!window.__scramjet$config) {
            console.error('Scramjet config not loaded');
            return url;
        }

        if (url.startsWith(window.__scramjet$config.prefix)) {
            const encoded = url.slice(window.__scramjet$config.prefix.length);
            return window.__scramjet$config.decodeUrl(encoded);
        }

        return url;
    },

    // Check if a URL is a Scramjet URL
    isScramjetUrl: function (url) {
        return url.startsWith(window.__scramjet$config.prefix);
    }
};