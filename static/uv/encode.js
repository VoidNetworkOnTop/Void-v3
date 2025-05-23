/**
 * Enhanced Fast URL Encoder with Compression for UV Proxy
 * Optimized for all device types and connection speeds
 */

const EnhancedEncoder = {
  /**
   * Intelligent encoding that adapts to URL type and device performance
   */
  encode(input) {
    if (!input) return input;
    
    try {
      const isSlowDevice = this.detectSlowDevice();
      const isGameURL = this.isGameURL(input);
      
      if (isSlowDevice) {
        return this.fastEncode(input);
      } else if (isGameURL) {
        return this.compactGameEncode(input);
      } else {
        return this.standardEncode(input);
      }
    } catch (e) {
      console.error('Enhanced encoding error:', e);
      return this.fallbackEncode(input);
    }
  },
  
  decode(encoded) {
    if (!encoded) return encoded;
    
    try {
      if (encoded.startsWith('f_')) {
        return this.fastDecode(encoded.slice(2));
      } else if (encoded.startsWith('g_')) {
        return this.compactGameDecode(encoded.slice(2));
      } else if (encoded.startsWith('s_')) {
        return this.standardDecode(encoded.slice(2));
      } else {
        return this.legacyDecode(encoded);
      }
    } catch (e) {
      console.error('Enhanced decoding error:', e);
      return this.fallbackDecode(encoded);
    }
  },
  
  fastEncode(input) {
    return 'f_' + input
      .replace(/:/g, '~c')
      .replace(/\//g, '~s')
      .replace(/\./g, '~d')
      .replace(/\?/g, '~q')
      .replace(/&/g, '~a')
      .replace(/=/g, '~e')
      .replace(/#/g, '~h');
  },
  
  fastDecode(encoded) {
    return encoded
      .replace(/~c/g, ':')
      .replace(/~s/g, '/')
      .replace(/~d/g, '.')
      .replace(/~q/g, '?')
      .replace(/~a/g, '&')
      .replace(/~e/g, '=')
      .replace(/~h/g, '#');
  },
  
  compactGameEncode(input) {
    let compressed = input;
    
    const gamePatterns = {
      'https://': 'H',
      'http://': 'h',
      '.unity3d': 'U3',
      '.unityweb': 'UW',
      '.wasm': 'W',
      '.data': 'D',
      '.js': 'J',
      '.json': 'JN',
      'unity': 'u',
      'game': 'g',
      'play': 'p',
      'cdn': 'c',
      'assets': 'a',
      'build': 'b',
      'webgl': 'w'
    };
    
    for (const [pattern, replacement] of Object.entries(gamePatterns)) {
      compressed = compressed.replace(new RegExp(pattern, 'gi'), `~${replacement}~`);
    }
    
    return 'g_' + btoa(compressed)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  },
  
  compactGameDecode(encoded) {
    const padding = '='.repeat((4 - (encoded.length % 4)) % 4);
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/') + padding;
    
    let decompressed = atob(base64);
    
    const gamePatterns = {
      'H': 'https://',
      'h': 'http://',
      'U3': '.unity3d',
      'UW': '.unityweb',
      'W': '.wasm',
      'D': '.data',
      'J': '.js',
      'JN': '.json',
      'u': 'unity',
      'g': 'game',
      'p': 'play',
      'c': 'cdn',
      'a': 'assets',
      'b': 'build',
      'w': 'webgl'
    };
    
    for (const [replacement, pattern] of Object.entries(gamePatterns)) {
      decompressed = decompressed.replace(new RegExp(`~${replacement}~`, 'g'), pattern);
    }
    
    return decompressed;
  },
  
  standardEncode(input) {
    return 's_' + btoa(input)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  },
  
  standardDecode(encoded) {
    const padding = '='.repeat((4 - (encoded.length % 4)) % 4);
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/') + padding;
    return atob(base64);
  },
  
  legacyDecode(encoded) {
    try {
      const padding = '='.repeat((4 - (encoded.length % 4)) % 4);
      const base64 = encoded
        .replace(/-/g, '+')
        .replace(/_/g, '/') + padding;
      return atob(base64);
    } catch (e) {
      return this.manualDecode(encoded);
    }
  },
  
  fallbackEncode(input) {
    return this.manualEncode(input);
  },
  
  fallbackDecode(encoded) {
    return this.manualDecode(encoded);
  },
  
  manualEncode(input) {
    const bytes = new TextEncoder().encode(input);
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
    
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  },
  
  manualDecode(encoded) {
    const padding = '='.repeat((4 - (encoded.length % 4)) % 4);
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/') + padding;
    
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
    
    return new TextDecoder().decode(new Uint8Array(bytes));
  },
  
  detectSlowDevice() {
    try {
      const cores = navigator.hardwareConcurrency || 2;
      const memory = navigator.deviceMemory || 2;
      const connection = navigator.connection;
      const isSlowConnection = connection && 
        (connection.effectiveType === 'slow-2g' || 
         connection.effectiveType === '2g' || 
         connection.downlink < 1.5);
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        Math.random();
      }
      const duration = performance.now() - start;
      const isSlowProcessor = duration > 5;
      
      return cores < 3 || memory < 3 || isSlowConnection || (isMobile && isSlowProcessor);
    } catch (e) {
      return false;
    }
  },
  
  isGameURL(url) {
    const gamePatterns = [
      'unity3d', 'unityweb', 'webgl', 'game', 'games', 'play',
      '.wasm', '.data', '.mem', 'poki.com', 'y8.com', 'crazy',
      'github.io', 'gitlab.io', 'simmer.io', 'kongregate',
      'coolmath', 'arcade', 'flash', 'html5', 'canvas'
    ];
    
    const urlLower = url.toLowerCase();
    return gamePatterns.some(pattern => urlLower.includes(pattern));
  }
};

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedEncoder;
} else if (typeof window !== 'undefined') {
  window.EnhancedEncoder = EnhancedEncoder;
  window.FastEncoder = EnhancedEncoder;
}
