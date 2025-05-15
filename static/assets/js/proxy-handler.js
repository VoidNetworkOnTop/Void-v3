// proxy-handler.js - Place this in your static/assets/js/ directory

// Define proxy types
const PROXY_TYPES = {
  UV: 'uv',
  AERO: 'aero'
};

// Default proxy (fallback if not specified)
let defaultProxy = PROXY_TYPES.UV;

// Check if Aero is available on this server
const aeroAvailable = window.AERO_AVAILABLE === true;

// ProxyHandler class to manage proxy operations
class ProxyHandler {
  constructor() {
    this.proxyStatus = {
      [PROXY_TYPES.UV]: true, // UV is always available
      [PROXY_TYPES.AERO]: aeroAvailable
    };
    
    // Load saved preferred proxy if any
    this.getSavedPreferredProxy();
    
    // Log proxy availability
    console.log(`Proxy status: UV=${this.proxyStatus.uv}, Aero=${this.proxyStatus.aero}`);
    console.log(`Default proxy: ${defaultProxy}`);
    
    // Add badges to game items in the list
    this.addProxyBadgesToGamesList();
  }
  
  // Format URL for the appropriate proxy
  formatUrl(url, proxyType) {
    // Default to UV if no proxy specified or if requested proxy is not available
    const actualProxyType = (proxyType && this.proxyStatus[proxyType]) 
      ? proxyType 
      : defaultProxy;
      
    console.log(`Formatting URL with ${actualProxyType} proxy:`, url);
    
    if (actualProxyType === PROXY_TYPES.AERO) {
      // For Aero, we use the /aero/ endpoint
      if (url.includes('__uv$config.prefix') || url.includes('__uv$config.encodeUrl')) {
        // Extract the actual URL from UV format if needed
        url = url.replace(/__uv\$config\.prefix\s*\+\s*__uv\$config\.encodeUrl\("(.+?)"\)/, '$1');
      }
      
      return `/aero/${encodeURIComponent(url)}`;
    } else {
      // Default to UV proxy
      if (url.includes('__uv$config.prefix')) {
        // Already in UV format
        return url;
      } else {
        // Format for UV
        return `__uv$config.prefix + __uv$config.encodeUrl("${url}")`;
      }
    }
  }
  
  // Load a game with the appropriate proxy
  loadGame(gameData) {
    try {
      // Get the iframe element
      const iframe = document.getElementById('gframe');
      if (!iframe) {
        console.error('Game iframe not found');
        return;
      }
      
      // Show loading indicator if available
      const loadingScreen = document.getElementById('loadingScreen');
      if (loadingScreen) {
        // Clear existing proxy-specific loading classes
        loadingScreen.classList.remove('uv-loading', 'aero-loading');
        
        // Add proxy-specific loading class
        if (gameData.proxy === PROXY_TYPES.AERO && this.proxyStatus[PROXY_TYPES.AERO]) {
          loadingScreen.classList.add('aero-loading');
        } else {
          loadingScreen.classList.add('uv-loading');
        }
        
        loadingScreen.style.display = 'flex';
      }
      
      // Update loading text if available
      const loadingText = document.getElementById('loadingText');
      if (loadingText) {
        const proxyName = (gameData.proxy === PROXY_TYPES.AERO && this.proxyStatus[PROXY_TYPES.AERO]) 
          ? 'Aero' 
          : 'UV';
        loadingText.textContent = `Loading game via ${proxyName} proxy...`;
      }
      
      // Format the URL for the appropriate proxy
      let gameUrl = this.formatUrl(gameData.link, gameData.proxy);
      
      // If it's a UV URL and it's in string format (with eval), evaluate it
      if (typeof gameUrl === 'string' && gameUrl.includes('__uv$config.prefix')) {
        try {
          gameUrl = eval(gameUrl);
        } catch (error) {
          console.error('Error evaluating UV URL:', error);
          gameUrl = gameData.link; // Fallback to original URL
        }
      }
      
      // Set the iframe source to load the game
      iframe.src = gameUrl;
      console.log('Game loaded with URL:', gameUrl);
      
      // Return the proxy type that was actually used
      return (gameData.proxy === PROXY_TYPES.AERO && this.proxyStatus[PROXY_TYPES.AERO]) 
        ? PROXY_TYPES.AERO 
        : PROXY_TYPES.UV;
    } catch (error) {
      console.error('Error loading game:', error);
      alert('Failed to load game. Please try again.');
      return null;
    }
  }
  
  // Add proxy badges to games in the list
  addProxyBadgesToGamesList() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._addBadges());
    } else {
      this._addBadges();
    }
  }
  
  // Set preferred proxy for all games
  setPreferredProxy(proxyType) {
    if (this.proxyStatus[proxyType]) {
      defaultProxy = proxyType;
      
      // Save preference to localStorage
      try {
        localStorage.setItem('preferredProxy', proxyType);
      } catch (e) {
        console.error('Error saving proxy preference:', e);
      }
      
      return true;
    }
    return false;
  }
  
  // Get saved preferred proxy if any
  getSavedPreferredProxy() {
    try {
      const saved = localStorage.getItem('preferredProxy');
      if (saved && this.proxyStatus[saved]) {
        defaultProxy = saved;
      }
    } catch (e) {
      console.error('Error getting saved proxy preference:', e);
    }
    return defaultProxy;
  }
  
  // Internal method to add badges to game items
  _addBadges() {
    try {
      // Get all game items
      const gameItems = document.querySelectorAll('.game-item');
      
      gameItems.forEach(item => {
        // Find the game data for this item
        const gameTitle = item.querySelector('.game-title')?.textContent;
        if (!gameTitle) return;
        
        // Find game in games data
        let gameData = null;
        
        // Check in gamesData
        if (window.gamesData) {
          gameData = window.gamesData.find(g => g.title === gameTitle);
        }
        
        // If not found, check in games2Data
        if (!gameData && window.games2Data) {
          gameData = window.games2Data.find(g => g.title === gameTitle);
        }
        
        // If game data found and it specifies aero
        if (gameData && gameData.proxy === PROXY_TYPES.AERO && this.proxyStatus[PROXY_TYPES.AERO]) {
          // Add aero class to the game item
          item.classList.add('aero-proxy');
          
          // Add badge if it doesn't exist
          if (!item.querySelector('.proxy-badge')) {
            const badge = document.createElement('div');
            badge.className = 'proxy-badge aero-badge';
            badge.textContent = 'AERO';
            item.appendChild(badge);
          }
        }
      });
    } catch (error) {
      console.error('Error adding proxy badges:', error);
    }
  }
}

// Create a global instance of the ProxyHandler
window.proxyHandler = new ProxyHandler();

// Export the ProxyHandler class
export default ProxyHandler;
