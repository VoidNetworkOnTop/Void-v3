// Scramjet configuration
self.__scramjet$config = {
    prefix: "/scramjet/",
    encodeUrl: (url) => btoa(url).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ""),
    decodeUrl: (url) => atob(url.replace(/-/g, "+").replace(/_/g, "/")),
};

// Make it accessible for both browser and service worker
if (typeof window !== 'undefined') {
    window.__scramjet$config = self.__scramjet$config;
}