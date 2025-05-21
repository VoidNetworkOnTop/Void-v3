// Scramjet configuration - FIXED VERSION
self.__scramjet$config = {
    prefix: "/scramjet/",
    encodeUrl: (url) => {
        return btoa(url).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    },
    decodeUrl: (url) => {
        // Fix: Add proper padding back
        let paddedUrl = url.replace(/-/g, "+").replace(/_/g, "/");
        
        // Add padding if needed
        while (paddedUrl.length % 4) {
            paddedUrl += '=';
        }
        
        try {
            return atob(paddedUrl);
        } catch (e) {
            console.error('Error decoding URL:', e, 'Input:', url, 'Padded:', paddedUrl);
            throw e;
        }
    },
};

// Make it accessible for both browser and service worker
if (typeof window !== 'undefined') {
    window.__scramjet$config = self.__scramjet$config;
}
