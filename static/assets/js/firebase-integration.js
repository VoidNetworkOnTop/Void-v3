/**
 * firebase-integration.js
 * 
 * This file handles the integration between the Void Network website
 * and the Firebase-based game statistics system. It replaces the client-side
 * GlobalGameStats with server-side FirebaseGameStats.
 */

// Import Firebase module
import FirebaseGameStats from './firebase-game-stats.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Firebase Integration: Initializing...');
  
  // Preserve the original GlobalGameStats as a fallback
  window.OriginalGlobalGameStats = window.GlobalGameStats;
  
  try {
    // Create a compatibility layer for synchronous code using the async Firebase methods
    window.GlobalGameStats = createCompatibilityLayer();
    
    // Watch for games data to initialize Firebase
    await initializeWithGamesData();
    
    // Set up listeners for UI updates
    setupUIListeners();
    
    console.log('Firebase Integration: Complete');
  } catch (error) {
    console.error('Firebase Integration: Failed', error);
    // Fall back to the original implementation
    window.GlobalGameStats = window.OriginalGlobalGameStats;
  }
});

/**
 * Create a compatibility layer for synchronous code
 * This helps maintain API compatibility with existing code
 */
function createCompatibilityLayer() {
  return {
    // Storage keys - maintained for compatibility
    USER_PLAYS_KEY: 'user_game_plays',
    LAST_UPDATE_KEY: 'global_stats_last_update',
    
    // Data caches
    popularityFactors: {},
    baseCounts: {},
    
    // Cache for play counts
    playCountCache: {},
    trendCache: {},
    
    /**
     * Initialize the game statistics system
     * @param {Array} gameList - List of game objects with id properties
     * @returns {Object} This object for chaining
     */
    initialize: function(gameList) {
      // Store games for later Firebase initialization
      if (!window._pendingGameList) {
        window._pendingGameList = gameList;
      }
      
      // Trigger event when games are available
      if (gameList && gameList.length > 0) {
        document.dispatchEvent(new CustomEvent('gamesDataAvailable', { detail: { gameList } }));
      }
      
      // Start async initialization if not already started
      if (!window._firebaseInitStarted) {
        window._firebaseInitStarted = true;
        this.initializeFirebaseAsync(gameList);
      }
      
      return this;
    },
    
    /**
     * Asynchronously initialize Firebase in the background
     * @param {Array} gameList - List of game objects with id properties
     */
    initializeFirebaseAsync: async function(gameList) {
      try {
        await FirebaseGameStats.initialize(gameList);
        console.log('Firebase async initialization complete');
        
        // Prefetch top games to warm the cache
        await FirebaseGameStats.getTopGames(10);
        
        // Signal that Firebase is initialized
        window._firebaseInitialized = true;
        document.dispatchEvent(new CustomEvent('firebaseInitialized'));
      } catch (error) {
        console.error('Firebase async initialization failed:', error);
      }
    },
    
    /**
     * Create a simple ID from a game title
     * @param {string} title Game title
     * @returns {string} Simple ID
     */
    createIdFromTitle: function(title) {
      return FirebaseGameStats.createIdFromTitle(title);
    },
    
    /**
     * Get the user's personal play counts
     * @returns {Object} Object with game IDs as keys and play counts as values
     */
    getUserPlays: function() {
      // This is only used for compatibility
      // The new implementation fetches play counts per game as needed
      const stored = localStorage.getItem(this.USER_PLAYS_KEY);
      return stored ? JSON.parse(stored) : {};
    },
    
    /**
     * Save the user's personal play counts
     * @param {Object} plays Object with game IDs as keys and play counts as values
     */
    saveUserPlays: function(plays) {
      // For compatibility only - not actively used
      localStorage.setItem(this.USER_PLAYS_KEY, JSON.stringify(plays));
    },
    
    /**
     * Record a play by the current user
     * @param {string} gameId ID of the game that was played
     * @returns {number} New user play count for this game
     */
    recordUserPlay: function(gameId) {
      if (!gameId) return 0;
      
      // Start async recording
      this.recordUserPlayAsync(gameId);
      
      // For immediate UI feedback, update cache
      if (this.playCountCache[gameId] !== undefined) {
        this.playCountCache[gameId]++;
      } else {
        this.playCountCache[gameId] = 1;
      }
      
      // Return estimated count
      return this.playCountCache[gameId];
    },
    
    /**
     * Asynchronously record a play
     * @param {string} gameId ID of the game
     */
    recordUserPlayAsync: async function(gameId) {
      try {
        const newCount = await FirebaseGameStats.recordUserPlay(gameId);
        
        // Update the cache with actual value
        this.playCountCache[gameId] = newCount;
        
        // Refresh UI elements showing this game
        this.triggerGameUIUpdate(gameId);
      } catch (error) {
        console.error(`Error in async recordUserPlay for ${gameId}:`, error);
      }
    },
    
    /**
     * Get global play count for a specific game
     * @param {string} gameId ID of the game
     * @returns {number} Simulated or actual global play count
     */
    getGlobalPlayCount: function(gameId) {
      if (!gameId) return 0;
      
      // Start async fetch
      this.getGlobalPlayCountAsync(gameId);
      
      // Return cached value or estimate
      if (this.playCountCache[gameId] !== undefined) {
        return this.playCountCache[gameId];
      }
      
      // Use base counts for initial estimate
      const baseCount = this.baseCounts[gameId] || 1000;
      return baseCount;
    },
    
    /**
     * Asynchronously get global play count
     * @param {string} gameId ID of the game
     */
    getGlobalPlayCountAsync: async function(gameId) {
      try {
        const count = await FirebaseGameStats.getGlobalPlayCount(gameId);
        
        // Only update cache if value changed
        if (this.playCountCache[gameId] !== count) {
          this.playCountCache[gameId] = count;
          
          // Refresh UI elements showing this game
          this.triggerGameUIUpdate(gameId);
        }
      } catch (error) {
        console.error(`Error in async getGlobalPlayCount for ${gameId}:`, error);
      }
    },
    
    /**
     * Get simulated count - compatibility method
     * @param {string} gameId ID of the game
     * @returns {number} Estimated or cached count
     */
    getSimulatedCount: function(gameId) {
      // This is only for compatibility
      return this.getGlobalPlayCount(gameId);
    },
    
    /**
     * Get all global play counts for all games
     * @returns {Object} Object with game IDs as keys and global play counts as values
     */
    getAllGlobalCounts: function() {
      // This is used by getTopGames in the original implementation
      return this.playCountCache;
    },
    
    /**
     * Get the top N most played games
     * @param {number} limit Maximum number of games to return
     * @returns {Array} Array of [gameId, count] pairs sorted by count
     */
    getTopGames: function(limit = 5) {
      // Start async fetch
      this.getTopGamesAsync(limit);
      
      // Return cached top games or fallback
      if (window._cachedTopGames && window._cachedTopGames.length > 0) {
        return window._cachedTopGames.slice(0, limit);
      }
      
      // Fallback: convert cache to array and sort
      const countArray = Object.entries(this.playCountCache);
      countArray.sort((a, b) => b[1] - a[1]);
      return countArray.slice(0, limit);
    },
    
    /**
     * Asynchronously get top games
     * @param {number} limit Maximum number of games to return
     */
    getTopGamesAsync: async function(limit) {
      try {
        const topGames = await FirebaseGameStats.getTopGames(limit);
        
        // Update cache
        window._cachedTopGames = topGames;
        
        // Trigger update for UI
        document.dispatchEvent(new CustomEvent('topGamesUpdated', {
          detail: { topGames }
        }));
      } catch (error) {
        console.error(`Error in async getTopGames(${limit}):`, error);
      }
    },
    
    /**
     * Get popularity trend for a game
     * @param {string} gameId ID of the game
     * @returns {string} Trend: 'rising', 'steady', or 'falling'
     */
    getGameTrend: function(gameId) {
      if (!gameId) return 'steady';
      
      // Start async fetch
      this.getGameTrendAsync(gameId);
      
      // Return cached trend or estimate
      if (this.trendCache[gameId]) {
        return this.trendCache[gameId];
      }
      
      // Estimate based on popularity factor
      const popularityFactor = this.popularityFactors[gameId] || 1.0;
      
      if (popularityFactor >= 5.0) return 'rising';
      if (popularityFactor <= 2.0) return 'falling';
      return 'steady';
    },
    
    /**
     * Asynchronously get game trend
     * @param {string} gameId ID of the game
     */
    getGameTrendAsync: async function(gameId) {
      try {
        const trend = await FirebaseGameStats.getGameTrend(gameId);
        
        // Only update cache and UI if value changed
        if (this.trendCache[gameId] !== trend) {
          this.trendCache[gameId] = trend;
          
          // Refresh UI elements showing this game
          this.triggerGameUIUpdate(gameId);
        }
      } catch (error) {
        console.error(`Error in async getGameTrend for ${gameId}:`, error);
      }
    },
    
    /**
     * Update game's popularity factor
     * @param {string} gameId ID of the game
     * @param {number} playDelta Change in plays (positive or negative)
     */
    updatePopularityFactor: function(gameId, playDelta) {
      if (!gameId) return;
      
      // Update local cache for immediate feedback
      const currentFactor = this.popularityFactors[gameId] || 1.0;
      const newFactor = Math.max(0.5, Math.min(12.0, currentFactor + (playDelta * 0.01)));
      this.popularityFactors[gameId] = newFactor;
      
      // Start async update
      this.updatePopularityFactorAsync(gameId, playDelta);
    },
    
    /**
     * Asynchronously update popularity factor
     * @param {string} gameId ID of the game
     * @param {number} playDelta Change in plays (positive or negative)
     */
    updatePopularityFactorAsync: async function(gameId, playDelta) {
      try {
        await FirebaseGameStats.updatePopularityFactor(gameId, playDelta);
      } catch (error) {
        console.error(`Error in async updatePopularityFactor for ${gameId}:`, error);
      }
    },
    
    /**
     * Trigger update for UI elements showing a specific game
     * @param {string} gameId ID of the game
     */
    triggerGameUIUpdate: function(gameId) {
      document.dispatchEvent(new CustomEvent('gameDataUpdated', {
        detail: { 
          gameId: gameId,
          playCount: this.playCountCache[gameId],
          trend: this.trendCache[gameId]
        }
      }));
    }
  };
}

/**
 * Wait for games data and initialize Firebase
 * @returns {Promise} Promise that resolves when initialization is complete
 */
async function initializeWithGamesData() {
  // If games data already available, use it
  if (window._pendingGameList) {
    await FirebaseGameStats.initialize(window._pendingGameList);
    return;
  }
  
  // Otherwise wait for the gamesDataAvailable event
  return new Promise((resolve) => {
    // Set up one-time event listener
    document.addEventListener('gamesDataAvailable', async (event) => {
      const { gameList } = event.detail;
      await FirebaseGameStats.initialize(gameList);
      resolve();
    }, { once: true });
    
    // Set a timeout in case games data never comes
    setTimeout(() => {
      console.warn('Timeout waiting for games data, initializing Firebase without games');
      FirebaseGameStats.initialize([]).then(resolve);
    }, 5000);
  });
}

/**
 * Set up listeners for UI updates
 */
function setupUIListeners() {
  // Listen for topGamesUpdated event from Firebase
  document.addEventListener('topGamesUpdated', (event) => {
    const { topGames } = event.detail;
    
    // Cache for synchronous API compatibility
    window._cachedTopGames = topGames;
    
    // Update UI if the popular games container exists
    updatePopularGamesUI(topGames);
  });
  
  // Listen for individual game updates
  document.addEventListener('gameUpdated', (event) => {
    const { gameId, gameData } = event.detail;
    
    // Update caches for synchronous API compatibility
    if (window.GlobalGameStats.playCountCache) {
      window.GlobalGameStats.playCountCache[gameId] = gameData.totalPlays || 0;
    }
    
    if (window.GlobalGameStats.trendCache) {
      window.GlobalGameStats.trendCache[gameId] = gameData.trend || 'steady';
    }
    
    // Update UI elements for this game
    updateGameElementsUI(gameId, gameData);
  });
  
  // Listen for gameDataUpdated from compatibility layer
  document.addEventListener('gameDataUpdated', (event) => {
    const { gameId, playCount, trend } = event.detail;
    
    // Update any UI elements showing this game
    updateGameUI(gameId, playCount, trend);
  });
}

/**
 * Update the popular games UI section
 * @param {Array} topGames Array of [gameId, count] pairs
 */
function updatePopularGamesUI(topGames) {
  if (!topGames || !topGames.length) return;
  
  const popularGamesList = document.getElementById('popularGamesList');
  if (!popularGamesList) return;
  
  // Remove loading indicator if present
  const loadingElement = document.getElementById('popularGamesLoading');
  if (loadingElement) {
    loadingElement.remove();
  }
  
  // Check if we need to fully refresh the container
  let shouldRefresh = true;
  
  // Only refresh if the order or content has changed significantly
  if (popularGamesList.children.length === topGames.length) {
    shouldRefresh = false;
    
    // Check if any game ID or order has changed
    for (let i = 0; i < topGames.length; i++) {
      const gameElement = popularGamesList.children[i];
      const gameId = gameElement.getAttribute('data-game-id');
      
      if (gameId !== topGames[i][0]) {
        shouldRefresh = true;
        break;
      }
    }
  }
  
  // If refresh needed, rebuild the entire popular games list
  if (shouldRefresh) {
    console.log('Refreshing popular games UI');
    // Call the original function if available, otherwise rebuild the UI here
    if (typeof updatePopularGames === 'function') {
      updatePopularGames();
    } else {
      refreshPopularGamesUI(topGames, popularGamesList);
    }
  } else {
    // Otherwise just update play counts and trends
    for (let i = 0; i < topGames.length; i++) {
      const [gameId, playCount] = topGames[i];
      const gameElement = popularGamesList.children[i];
      
      // Update play count
      const playCountElement = gameElement.querySelector('.play-count');
      if (playCountElement) {
        playCountElement.innerHTML = `
          <svg class="play-count-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 4a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z"/>
          </svg>
          ${playCount.toLocaleString()}
        `;
      }
      
      // Update trend indicator
      updateGameTrendUI(gameElement, gameId);
    }
  }
}

/**
 * Refresh the popular games UI completely
 * Used when updatePopularGames function is not available
 * @param {Array} topGames Array of [gameId, count] pairs
 * @param {Element} container Container element
 */
function refreshPopularGamesUI(topGames, container) {
  // Clear container
  container.innerHTML = '';
  
  // Find game info for each top game
  topGames.forEach(([gameId, playCount], index) => {
    // Try to find game info from global data
    let gameInfo = null;
    
    // Check if we have a games list available
    if (window._pendingGameList) {
      gameInfo = window._pendingGameList.find(g => g.id === gameId || 
                                            FirebaseGameStats.createIdFromTitle(g.title) === gameId);
    }
    
    // If game info not found, create minimal info
    if (!gameInfo) {
      gameInfo = {
        id: gameId,
        title: gameId.charAt(0).toUpperCase() + gameId.slice(1), // Capitalized ID as title
        imgSrc: "/gameimg/default.png", // Default image
        link: "#" // Placeholder link
      };
    }
    
    const gameElement = document.createElement("div");
    gameElement.className = "popular-game-item";
    gameElement.setAttribute("data-game-id", gameId);
    
    // Add trophy for top 3
    let trophyHTML = '';
    if (index < 3) {
      trophyHTML = `
        <div class="trophy-icon trophy-${index + 1}">
          <span class="trophy-badge">${index + 1}</span>
        </div>
      `;
    }
    
    // Get trend for this game
    const trend = window.GlobalGameStats.getGameTrend(gameId);
    let trendHTML = '';
    
    if (trend === 'rising') {
      trendHTML = `
        <div class="trend-indicator trend-rising">
          <svg width="10" height="10" viewBox="0 0 24 24">
            <path fill="currentColor" d="M7 14l5-5 5 5z"/>
          </svg>
        </div>
      `;
    } else if (trend === 'falling') {
      trendHTML = `
        <div class="trend-indicator trend-falling">
          <svg width="10" height="10" viewBox="0 0 24 24">
            <path fill="currentColor" d="M7 10l5 5 5-5z"/>
          </svg>
        </div>
      `;
    }
    
    gameElement.innerHTML = `
      ${trophyHTML}
      ${trendHTML}
      <div class="popular-game-icon">
        <img src="${gameInfo.imgSrc}" alt="${gameInfo.title} icon">
      </div>
      <h3 class="popular-game-title">${gameInfo.title}</h3>
      <div class="play-count">
        <svg class="play-count-icon" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 4a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z"/>
        </svg>
        ${playCount.toLocaleString()}
      </div>
    `;
    
    // Add click handler
    gameElement.onclick = () => {
      // Record play and update popularity
      window.GlobalGameStats.recordUserPlay(gameId);
      window.GlobalGameStats.updatePopularityFactor(gameId, 0.5);
      
      // Navigate to the game if we have a valid link
      if (gameInfo.link && gameInfo.link !== '#') {
        window.location.href = `/Classes.html?game=${encodeURIComponent(gameInfo.link)}`;
      }
    };
    
    container.appendChild(gameElement);
  });
}

/**
 * Update UI elements for a specific game
 * @param {string} gameId ID of the game
 * @param {Object} gameData Game data object
 */
function updateGameElementsUI(gameId, gameData) {
  if (!gameId || !gameData) return;
  
  // Find all elements representing this game
  const gameElements = document.querySelectorAll(`[data-game-id="${gameId}"]`);
  
  gameElements.forEach(element => {
    // Update play count
    const playCountElement = element.querySelector('.play-count, .play-count-badge');
    if (playCountElement && gameData.totalPlays !== undefined) {
      playCountElement.innerHTML = `
        <svg class="play-count-icon" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 4a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z"/>
        </svg>
        ${gameData.totalPlays.toLocaleString()}
      `;
    }
    
    // Update trend indicator
    if (gameData.trend) {
      updateGameTrendUI(element, gameId, gameData.trend);
    }
  });
}

/**
 * Update trend indicator UI for a game element
 * @param {Element} element Game element in the DOM
 * @param {string} gameId Game ID
 * @param {string} trend Trend value (optional)
 */
function updateGameTrendUI(element, gameId, trend) {
  if (!element) return;
  
  // Get trend if not provided
  if (!trend) {
    trend = window.GlobalGameStats.getGameTrend(gameId);
  }
  
  // Find existing trend indicator or create one
  let trendElement = element.querySelector('.trend-indicator');
  
  if (!trendElement) {
    // Create new trend indicator if not found
    trendElement = document.createElement('div');
    trendElement.className = `trend-indicator trend-${trend}`;
    element.appendChild(trendElement);
  } else {
    // Update existing trend indicator
    trendElement.className = `trend-indicator trend-${trend}`;
  }
  
  // Update trend indicator content
  if (trend === 'rising') {
    trendElement.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 24 24">
        <path fill="currentColor" d="M7 14l5-5 5 5z"/>
      </svg>
    `;
  } else if (trend === 'falling') {
    trendElement.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 24 24">
        <path fill="currentColor" d="M7 10l5 5 5-5z"/>
      </svg>
    `;
  } else {
    trendElement.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 24 24">
        <path fill="currentColor" d="M8 12h8v2h-8z"/>
      </svg>
    `;
  }
}

/**
 * Update UI for a game with play count and trend
 * @param {string} gameId Game ID
 * @param {number} playCount Play count
 * @param {string} trend Trend value
 */
function updateGameUI(gameId, playCount, trend) {
  if (!gameId) return;
  
  // Find all elements for this game
  const gameElements = document.querySelectorAll(`[data-game-id="${gameId}"]`);
  
  gameElements.forEach(element => {
    // Update play count if provided
    if (playCount !== undefined) {
      const playCountElement = element.querySelector('.play-count, .play-count-badge');
      if (playCountElement) {
        playCountElement.innerHTML = `
          <svg class="play-count-icon" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 4a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z"/>
          </svg>
          ${playCount.toLocaleString()}
        `;
      }
    }
    
    // Update trend if provided
    if (trend) {
      updateGameTrendUI(element, gameId, trend);
    }
  });
}

// Export core Firebase module for direct use
export { FirebaseGameStats };
