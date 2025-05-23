/**
 * Adaptive Game Preloader - Device-aware game loading optimization
 * This file should be included in the main index.html
 */

class AdaptiveGamePreloader {
  constructor() {
    this.deviceProfile = null;
    this.preloadedGames = new Map();
    this.loadingQueue = [];
    this.isPreloading = false;
    
    this.init();
  }
  
  init() {
    this.analyzeDevice();
    this.setupPreloading();
    this.bindEvents();
  }
  
  analyzeDevice() {
    this.deviceProfile = {
      cores: navigator.hardwareConcurrency || 2,
      memory: navigator.deviceMemory || 2,
      connection: this.getConnectionInfo(),
      mobile: this.isMobileDevice(),
      performance: 'medium'
    };
    
    // Determine performance tier
    const score = this.calculatePerformanceScore();
    
    if (score >= 75) {
      this.deviceProfile.performance = 'high';
    } else if (score >= 45) {
      this.deviceProfile.performance = 'medium';
    } else {
      this.deviceProfile.performance = 'low';
    }
    
    console.log('[Adaptive Preloader] Device profile:', this.deviceProfile);
  }
  
  calculatePerformanceScore() {
    let score = 0;
    
    // CPU score
    if (this.deviceProfile.cores >= 8) score += 30;
    else if (this.deviceProfile.cores >= 4) score += 20;
    else if (this.deviceProfile.cores >= 2) score += 10;
    
    // Memory score
    if (this.deviceProfile.memory >= 8) score += 25;
    else if (this.deviceProfile.memory >= 4) score += 15;
    else if (this.deviceProfile.memory >= 2) score += 8;
    
    // Connection score
    const conn = this.deviceProfile.connection;
    if (conn.type === '4g' && conn.downlink >= 10) score += 25;
    else if (conn.type === '4g' && conn.downlink >= 5) score += 15;
    else if (conn.type === '3g') score += 10;
    else score += 5;
    
    // Mobile penalty
    if (this.deviceProfile.mobile) score -= 10;
    
    // Network penalty
    if (conn.saveData) score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }
  
  getConnectionInfo() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!conn) {
      return { type: 'unknown', downlink: 5, saveData: false };
    }
    
    return {
      type: conn.effectiveType || 'unknown',
      downlink: conn.downlink || 5,
      rtt: conn.rtt || 100,
      saveData: conn.saveData || false
    };
  }
  
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
  }
  
  setupPreloading() {
    // Only preload on high-performance devices with good connections
    if (this.deviceProfile.performance === 'low' || 
        this.deviceProfile.connection.saveData ||
        this.deviceProfile.connection.downlink < 2) {
      console.log('[Adaptive Preloader] Preloading disabled for device profile');
      return;
    }
    
    // Wait for page to be fully loaded before starting preload
    if (document.readyState === 'complete') {
      this.startIntelligentPreloading();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.startIntelligentPreloading();
        }, 2000); // Wait 2 seconds after page load
      });
    }
  }
  
  bindEvents() {
    // Listen for game clicks to prioritize preloading
    document.addEventListener('mouseover', (event) => {
      const gameItem = event.target.closest('.game-item');
      if (gameItem && this.deviceProfile.performance !== 'low') {
        const gameLink = this.extractGameLink(gameItem);
        if (gameLink) {
          this.prioritizePreload(gameLink);
        }
      }
    });
    
    // Listen for service worker messages
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PRELOAD_COMPLETE') {
          this.onPreloadComplete(event.data.url);
        }
      });
    }
  }
  
  extractGameLink(gameElement) {
    try {
      // Try to find the game URL from onclick or data attributes
      const onclick = gameElement.getAttribute('onclick');
      if (onclick && onclick.includes('game=')) {
        const match = onclick.match(/game=([^&'"]+)/);
        if (match) {
          return decodeURIComponent(match[1]);
        }
      }
      
      // Try data attributes
      const gameUrl = gameElement.dataset.gameUrl;
      if (gameUrl) {
        return gameUrl;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
  
  startIntelligentPreloading() {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    console.log('[Adaptive Preloader] Starting intelligent preloading');
    
    // Get popular/featured games to preload
    const gameItems = document.querySelectorAll('.game-item');
    const gamesToPreload = [];
    
    // Preload first few games based on device performance
    const maxPreload = {
      high: 5,
      medium: 3,
      low: 0
    }[this.deviceProfile.performance];
    
    for (let i = 0; i < Math.min(gameItems.length, maxPreload); i++) {
      const gameLink = this.extractGameLink(gameItems[i]);
      if (gameLink) {
        gamesToPreload.push(gameLink);
      }
    }
    
    // Start preloading with delays
    gamesToPreload.forEach((gameUrl, index) => {
      setTimeout(() => {
        this.preloadGame(gameUrl);
      }, index * 3000); // 3 second delays between preloads
    });
  }
  
  prioritizePreload(gameUrl) {
    if (this.preloadedGames.has(gameUrl) || this.loadingQueue.includes(gameUrl)) {
      return; // Already preloaded or queued
    }
    
    // Add to front of queue for immediate preload
    this.loadingQueue.unshift(gameUrl);
    
    // Start preloading if not already in progress
    if (!this.isCurrentlyPreloading) {
      this.processPreloadQueue();
    }
  }
  
  async preloadGame(gameUrl) {
    if (this.preloadedGames.has(gameUrl)) {
      return;
    }
    
    try {
      console.log(`[Adaptive Preloader] Preloading game: ${gameUrl}`);
      
      this.isCurrentlyPreloading = true;
      
      // Create a hidden iframe to preload the game
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.visibility = 'hidden';
      iframe.src = gameUrl;
      
      document.body.appendChild(iframe);
      
      // Wait for basic load
      await new Promise((resolve) => {
        iframe.onload = resolve;
        iframe.onerror = resolve;
        
        // Timeout for slow games
        setTimeout(resolve, 10000);
      });
      
      // Mark as preloaded
      this.preloadedGames.set(gameUrl, {
        timestamp: Date.now(),
        iframe: iframe
      });
      
      console.log(`[Adaptive Preloader] Game preloaded successfully: ${gameUrl}`);
      
      // Clean up iframe after a delay (keep it for quick access)
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 30000); // Keep for 30 seconds
      
    } catch (error) {
      console.error('[Adaptive Preloader] Preload failed:', gameUrl, error);
    } finally {
      this.isCurrentlyPreloading = false;
      this.processPreloadQueue();
    }
  }
  
  async processPreloadQueue() {
    if (this.isCurrentlyPreloading || this.loadingQueue.length === 0) {
      return;
    }
    
    const nextUrl = this.loadingQueue.shift();
    await this.preloadGame(nextUrl);
  }
  
  onPreloadComplete(url) {
    console.log(`[Adaptive Preloader] Service worker completed preload: ${url}`);
  }
  
  isGamePreloaded(gameUrl) {
    return this.preloadedGames.has(gameUrl);
  }
  
  getPreloadedGame(gameUrl) {
    return this.preloadedGames.get(gameUrl);
  }
  
  // Clean up old preloaded games to save memory
  cleanupOldPreloads() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    for (const [url, data] of this.preloadedGames.entries()) {
      if (now - data.timestamp > maxAge) {
        if (data.iframe && data.iframe.parentNode) {
          data.iframe.parentNode.removeChild(data.iframe);
        }
        this.preloadedGames.delete(url);
      }
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.adaptiveGamePreloader = new AdaptiveGamePreloader();
  });
} else {
  window.adaptiveGamePreloader = new AdaptiveGamePreloader();
}

// Clean up preloads periodically
setInterval(() => {
  if (window.adaptiveGamePreloader) {
    window.adaptiveGamePreloader.cleanupOldPreloads();
  }
}, 60000); // Every minute
