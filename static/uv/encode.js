/**
 * Optimized and simplified URL encoding for UV proxy
 * This implementation is much faster and produces shorter URLs
 */

// URL-safe Base64 encoding (more efficient than base32)
const FastEncoder = {
  /**
   * Encodes a URL into a shortened URL-safe format
   * @param {string} input - The URL to encode
   * @return {string} The encoded URL
   */
  encode(input) {
    if (!input) return input;
    
    try {
      // Use native btoa for faster encoding, then make URL-safe
      return btoa(input)
        .replace(/\+/g, '-')  // Convert + to - (URL safe)
        .replace(/\//g, '_')  // Convert / to _ (URL safe)
        .replace(/=+$/, '');  // Remove padding for shorter URLs
    } catch (e) {
      console.error('Encoding error:', e);
      
      // Fallback to manual encoding if btoa fails (e.g., with Unicode)
      return this.manualEncode(input);
    }
  },
  
  /**
   * Decodes an encoded URL back to its original form
   * @param {string} encoded - The encoded URL to decode
   * @return {string} The original URL
   */
  decode(encoded) {
    if (!encoded) return encoded;
    
    try {
      // Add padding if needed
      const padding = '='.repeat((4 - (encoded.length % 4)) % 4);
      
      // Convert URL-safe characters back to Base64 standard
      const base64 = encoded
        .replace(/-/g, '+')
        .replace(/_/g, '/') + padding;
      
      // Use native atob for faster decoding
      return atob(base64);
    } catch (e) {
      console.error('Decoding error:', e);
      
      // Fallback to manual decoding
      return this.manualDecode(encoded);
    }
  },
  
  /**
   * Manual encoding fallback for Unicode support
   * @param {string} input - The input to encode
   * @return {string} The encoded string
   */
  manualEncode(input) {
    // Convert string to byte array
    const bytes = new TextEncoder().encode(input);
    
    // Encode to Base64
    let base64 = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    
    let i = 0;
    const len = bytes.length;
    
    while (i < len) {
      const b1 = bytes[i++] || 0;
      const b2 = bytes[i++] || 0;
      const b3 = bytes[i++] || 0;
      
      const triplet = (b1 << 16) | (b2 << 8) | b3;
      
      for (let j = 0; j < 4; j++) {
        if (i - 3 + j <= len) {
          base64 += chars[(triplet >> (6 * (3 - j))) & 63];
        } else {
          base64 += '=';
        }
      }
    }
    
    // Make URL-safe
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  },
  
  /**
   * Manual decoding fallback
   * @param {string} encoded - The encoded string
   * @return {string} The decoded string
   */
  manualDecode(encoded) {
    // Add padding if needed
    const padding = '='.repeat((4 - (encoded.length % 4)) % 4);
    
    // Convert URL-safe characters back to standard Base64
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/') + padding;
    
    // Decode Base64 to byte array
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const bytes = [];
    
    let i = 0;
    while (i < base64.length) {
      const c1 = chars.indexOf(base64.charAt(i++));
      const c2 = chars.indexOf(base64.charAt(i++));
      const c3 = chars.indexOf(base64.charAt(i++));
      const c4 = chars.indexOf(base64.charAt(i++));
      
      const triplet = (c1 << 18) | (c2 << 12) | ((c3 & 63) << 6) | (c4 & 63);
      
      bytes.push((triplet >> 16) & 255);
      if (c3 !== -1) bytes.push((triplet >> 8) & 255);
      if (c4 !== -1) bytes.push(triplet & 255);
    }
    
    // Convert byte array back to string
    return new TextDecoder().decode(new Uint8Array(bytes));
  }
};

// Export the encoder
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FastEncoder;
} else if (typeof window !== 'undefined') {
  window.FastEncoder = FastEncoder;
}
