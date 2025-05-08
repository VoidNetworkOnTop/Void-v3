// Updated encode.js - using more efficient Base64 encoding
const xor = {
    encode(str) {
      if (!str) return str;
      // Simple and fast encoding
      return btoa(encodeURIComponent(str));
    },
    decode(str) {
      if (!str) return str;
      try {
        // Handle URL fragments properly
        const [input, ...search] = str.split("?");
        const decoded = decodeURIComponent(atob(input));
        return decoded + (search.length ? "?" + search.join("?") : "");
      } catch (e) {
        console.error("Decode error:", e);
        return str;
      }
    },
};

// For older compatibility
self.__uv$config = self.__uv$config || {};
self.__uv$config.encodeUrl = self.__uv$config.encodeUrl || xor.encode;
self.__uv$config.decodeUrl = self.__uv$config.decodeUrl || xor.decode;
