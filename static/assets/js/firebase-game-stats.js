/**
 * FirebaseGameStats - A module for tracking and managing game play statistics using Firebase
 * 
 * This module provides:
 * 1. Real-time game play statistics across all users
 * 2. Server-side persistence of play counts
 * 3. Trend analysis and popularity metrics
 * 4. Caching for offline functionality
 */

// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  increment, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Initialize Firebase with the configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDSfv2iQIdN1UaP6Lac2bnRbvqdlfe0P4",
  authDomain: "void-player-count.firebaseapp.com",
  projectId: "void-player-count",
  storageBucket: "void-player-count.firebasestorage.app",
  messagingSenderId: "79902895562",
  appId: "1:79902895562:web:409213ffdb007fa81cb333"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Main FirebaseGameStats module
const FirebaseGameStats = {
  // Collection references
  GAMES_COLLECTION: "games",
  PLAYS_COLLECTION: "plays",
  TRENDS_COLLECTION: "trends",
  USERS_COLLECTION: "users",
  
  // Cache for game data to reduce reads
  cache: {
    gameData: {},
    topGames: [],
    initialized: false,
    userId: null,
    lastRefresh: 0
  },
  
  // Active listeners
  listeners: {
    topGames: null,
    gameData: {}
  },
  
  /**
   * Initialize the game statistics system
   * Sets up authentication and data structures
   * @param {Array} gameList - List of game objects with id properties
   * @returns {Promise} Promise that resolves when initialization is complete
   */
  initialize: async function(gameList) {
    if (this.cache.initialized) return this;
    
    console.log('Initializing Firebase game stats...');
    
    try {
      // Sign in anonymously to track individual user stats while maintaining privacy
      const userCredential = await signInAnonymously(auth);
      this.cache.userId = userCredential.user.uid;
      console.log('Anonymous authentication successful');
      
      // Initialize or update games in Firestore
      if (gameList && gameList.length > 0) {
        const batch = [];
        
        for (const game of gameList) {
          const id = game.id || this.createIdFromTitle(game.title);
          const gameRef = doc(db, this.GAMES_COLLECTION, id);
          
          try {
            // Check if game document exists
            const gameDoc = await getDoc(gameRef);
            
            if (!gameDoc.exists()) {
              // If game doesn't exist in Firestore, create it with initial values
              batch.push(
                setDoc(gameRef, {
                  id: id,
                  title: game.title,
                  imgSrc: game.imgSrc || '',
                  link: game.link || '',
                  totalPlays: 0,
                  popularityFactor: this.getInitialPopularityFactor(id),
                  trend: 'steady',
                  lastUpdated: serverTimestamp()
                })
              );
            }
          } catch (err) {
            console.error(`Error checking/creating game ${id}:`, err);
          }
          
          // Initialize user play data if first visit
          try {
            const userGameRef = doc(db, this.USERS_COLLECTION, this.cache.userId, this.PLAYS_COLLECTION, id);
            const userGameDoc = await getDoc(userGameRef);
            
            if (!userGameDoc.exists()) {
              batch.push(
                setDoc(userGameRef, {
                  playCount: 0,
                  lastPlayed: null
                })
              );
            }
          } catch (err) {
            console.error(`Error initializing user play data for ${id}:`, err);
          }
        }
        
        // Wait for all batch operations to complete
        await Promise.all(batch);
        console.log(`Initialized ${batch.length} games in Firestore`);
      }
      
      // Set up listeners for top games
      this.setupTopGamesListener();
      
      this.cache.initialized = true;
      console.log('Firebase game stats initialization complete');
      
      return this;
    } catch (error) {
      console.error('Firebase initialization error:', error);
      
      // Fallback - If Firebase fails, we'll use localStorage as a backup
      this.useFallbackMode();
      
      return this;
    }
  },
  
  /**
   * Set up a listener for top games
   * @param {number} topCount Number of top games to listen to
   */
  setupTopGamesListener: function(topCount = 10) {
    // Clear existing listener
    if (this.listeners.topGames) {
      this.listeners.topGames();
      this.listeners.topGames = null;
    }
    
    try {
      // Create query for top games by play count
      const topGamesQuery = query(
        collection(db, this.GAMES_COLLECTION),
        orderBy('totalPlays', 'desc'),
        limit(topCount)
      );
      
      // Set up real-time listener
      this.listeners.topGames = onSnapshot(topGamesQuery, (snapshot) => {
        const topGames = [];
        
        snapshot.forEach((doc) => {
          const gameData = doc.data();
          topGames.push([gameData.id, gameData.totalPlays]);
          
          // Update cache for this game
          this.cache.gameData[gameData.id] = gameData;
        });
        
        // Update top games cache
        this.cache.topGames = topGames;
        this.cache.lastRefresh = Date.now();
        
        // Trigger any UI updates
        this.triggerTopGamesUpdate();
      }, (error) => {
        console.error('Top games listener error:', error);
      });
      
      console.log('Top games listener established');
    } catch (error) {
      console.error('Error setting up top games listener:', error);
    }
  },
  
  /**
   * Trigger an update for UI components showing top games
   * This should be called after the top games cache is updated
   */
  triggerTopGamesUpdate: function() {
    // Dispatch a custom event for components to listen to
    const event = new CustomEvent('topGamesUpdated', {
      detail: {
        topGames: this.cache.topGames
      }
    });
    document.dispatchEvent(event);
  },
  
  /**
   * Set up a listener for a specific game's data
   * @param {string} gameId ID of the game to listen to
   */
  setupGameListener: function(gameId) {
    if (!gameId) return;
    
    // Clear existing listener for this game
    if (this.listeners.gameData[gameId]) {
      this.listeners.gameData[gameId]();
      this.listeners.gameData[gameId] = null;
    }
    
    try {
      // Create reference to game document
      const gameRef = doc(db, this.GAMES_COLLECTION, gameId);
      
      // Set up real-time listener
      this.listeners.gameData[gameId] = onSnapshot(gameRef, (doc) => {
        if (doc.exists()) {
          const gameData = doc.data();
          
          // Update cache for this game
          this.cache.gameData[gameId] = gameData;
          
          // Trigger any UI updates for this game
          this.triggerGameUpdate(gameId);
        }
      }, (error) => {
        console.error(`Game ${gameId} listener error:`, error);
      });
      
      console.log(`Game ${gameId} listener established`);
    } catch (error) {
      console.error(`Error setting up game ${gameId} listener:`, error);
    }
  },
  
  /**
   * Trigger an update for UI components showing a specific game
   * @param {string} gameId ID of the game that was updated
   */
  triggerGameUpdate: function(gameId) {
    if (!gameId) return;
    
    // Dispatch a custom event for components to listen to
    const event = new CustomEvent('gameUpdated', {
      detail: {
        gameId: gameId,
        gameData: this.cache.gameData[gameId]
      }
    });
    document.dispatchEvent(event);
  },
  
  /**
   * Create a simple ID from a game title
   * @param {string} title Game title
   * @returns {string} Simple ID
   */
  createIdFromTitle: function(title) {
    return title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '') // Remove non-alphanumeric chars
      .replace(/\s+/g, '');       // Remove spaces
  },
  
  /**
   * Get initial popularity factor for a game
   * @param {string} gameId ID of the game
   * @returns {number} Initial popularity factor
   */
  getInitialPopularityFactor: function(gameId) {
    // Default popularity factors for known games
    const defaultFactors = {
      'minecraft': 10.0,
      'slope': 8.5,
      '1v1lol': 7.8,
      'amoungus': 7.2, 
      'fnaf': 6.9,
      'retrobowl': 6.5,
      'subwaysurfers': 6.3,
      'cookieclicker': 5.8,
      'gunmayhem': 5.5,
      'tanukisunset': 5.2,
      'ducklife': 5.0,
      'drivemad': 4.7,
      'tunnel': 4.5,
      'paperio': 4.2,
      'flappybird': 4.0
    };
    
    // Return default factor if available, otherwise assign a random one
    return defaultFactors[gameId] || (1.0 + (Math.random() * 2.5));
  },
  
  /**
   * Record a play by the current user
   * @param {string} gameId ID of the game that was played
   * @returns {Promise<number>} Promise that resolves with new user play count
   */
  recordUserPlay: async function(gameId) {
    if (!gameId || !this.cache.initialized) {
      return this.fallbackRecordUserPlay(gameId);
    }
    
    try {
      // Update user's personal play count
      const userGameRef = doc(db, this.USERS_COLLECTION, this.cache.userId, this.PLAYS_COLLECTION, gameId);
      
      // Check current play count
      const userGameDoc = await getDoc(userGameRef);
      let newUserPlayCount = 1;
      
      if (userGameDoc.exists()) {
        // Increment the play count and update last played time
        await updateDoc(userGameRef, {
          playCount: increment(1),
          lastPlayed: serverTimestamp()
        });
        newUserPlayCount = userGameDoc.data().playCount + 1;
      } else {
        // Create initial play record
        await setDoc(userGameRef, {
          playCount: 1,
          lastPlayed: serverTimestamp()
        });
      }
      
      // Update global play count for the game
      const gameRef = doc(db, this.GAMES_COLLECTION, gameId);
      await updateDoc(gameRef, {
        totalPlays: increment(1),
        lastUpdated: serverTimestamp()
      });
      
      console.log(`User played ${gameId}, total user plays: ${newUserPlayCount}`);
      
      // Update trend metrics
      this.updateGameTrend(gameId);
      
      return newUserPlayCount;
    } catch (error) {
      console.error(`Error recording play for ${gameId}:`, error);
      
      // Fallback to localStorage if Firebase fails
      return this.fallbackRecordUserPlay(gameId);
    }
  },
  
  /**
   * Update trend metrics for a game
   * @param {string} gameId ID of the game
   */
  updateGameTrend: async function(gameId) {
    if (!gameId || !this.cache.initialized) return;
    
    try {
      const gameRef = doc(db, this.GAMES_COLLECTION, gameId);
      const gameDoc = await getDoc(gameRef);
      
      if (gameDoc.exists()) {
        const gameData = gameDoc.data();
        
        // Create a trend entry
        const trendRef = doc(db, this.TRENDS_COLLECTION, gameId);
        const trendDoc = await getDoc(trendRef);
        
        const now = new Date();
        const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const hourKey = String(now.getHours()).padStart(2, '0');
        
        if (trendDoc.exists()) {
          // Update existing trend data
          const trendData = trendDoc.data();
          
          // Initialize day if not present
          if (!trendData.dailyPlays || !trendData.dailyPlays[dayKey]) {
            const dailyPlays = trendData.dailyPlays || {};
            dailyPlays[dayKey] = {};
            
            // Initialize today's hourly data
            for (let h = 0; h < 24; h++) {
              const hKey = String(h).padStart(2, '0');
              dailyPlays[dayKey][hKey] = 0;
            }
            
            await updateDoc(trendRef, { dailyPlays: dailyPlays });
          }
          
          // Increment the current hour's play count
          await updateDoc(trendRef, {
            [`dailyPlays.${dayKey}.${hourKey}`]: increment(1),
            lastUpdated: serverTimestamp()
          });
          
          // Calculate trend (rising, steady, falling)
          // We'll determine based on 24-hour comparison
          const trend = await this.calculateGameTrend(gameId, trendData);
          
          // Update game with trend
          await updateDoc(gameRef, { trend: trend });
        } else {
          // Create initial trend data
          const dailyPlays = {};
          dailyPlays[dayKey] = {};
          
          // Initialize today's hourly data
          for (let h = 0; h < 24; h++) {
            const hKey = String(h).padStart(2, '0');
            dailyPlays[dayKey][hKey] = 0;
          }
          
          // Set the current hour's play count to 1
          dailyPlays[dayKey][hourKey] = 1;
          
          await setDoc(trendRef, {
            gameId: gameId,
            dailyPlays: dailyPlays,
            lastUpdated: serverTimestamp()
          });
          
          // Default new games to "steady" trend
          await updateDoc(gameRef, { trend: 'steady' });
        }
      }
    } catch (error) {
      console.error(`Error updating trend for ${gameId}:`, error);
    }
  },
  
  /**
   * Calculate trend for a game based on play pattern
   * @param {string} gameId ID of the game
   * @param {Object} trendData Trend data from Firestore
   * @returns {string} Trend: 'rising', 'steady', or 'falling'
   */
  calculateGameTrend: async function(gameId, trendData) {
    if (!trendData || !trendData.dailyPlays) return 'steady';
    
    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      // Get a date 24 hours ago
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      const yesterdayHour = String(yesterday.getHours()).padStart(2, '0');
      
      // Get current hour
      const currentHour = String(now.getHours()).padStart(2, '0');
      
      // Calculate plays in last 24 hours
      let recentPlays = 0;
      let previousPlays = 0;
      
      // Today's plays up to current hour
      if (trendData.dailyPlays[today]) {
        for (let h = 0; h <= parseInt(currentHour); h++) {
          const hourKey = String(h).padStart(2, '0');
          recentPlays += (trendData.dailyPlays[today][hourKey] || 0);
        }
      }
      
      // Yesterday's plays after current hour
      if (trendData.dailyPlays[yesterdayKey]) {
        for (let h = parseInt(currentHour) + 1; h < 24; h++) {
          const hourKey = String(h).padStart(2, '0');
          recentPlays += (trendData.dailyPlays[yesterdayKey][hourKey] || 0);
        }
        
        // Calculate plays from 24-48 hours ago for comparison
        for (let h = 0; h <= parseInt(yesterdayHour); h++) {
          const hourKey = String(h).padStart(2, '0');
          previousPlays += (trendData.dailyPlays[yesterdayKey][hourKey] || 0);
        }
      }
      
      // If we have previous data to compare with
      if (previousPlays > 0) {
        // Calculate percentage change
        const percentChange = ((recentPlays - previousPlays) / previousPlays) * 100;
        
        if (percentChange >= 15) return 'rising';
        if (percentChange <= -15) return 'falling';
      } else {
        // Not enough data for accurate trend
        // Check if this game has high popularity factor
        const gameRef = doc(db, this.GAMES_COLLECTION, gameId);
        const gameDoc = await getDoc(gameRef);
        
        if (gameDoc.exists()) {
          const popularityFactor = gameDoc.data().popularityFactor || 0;
          
          if (popularityFactor >= 7.0) return 'rising';
          if (popularityFactor <= 2.0) return 'falling';
        }
      }
      
      return 'steady';
    } catch (error) {
      console.error(`Error calculating trend for ${gameId}:`, error);
      return 'steady';
    }
  },
  
  /**
   * Get user's personal play count for a game
   * @param {string} gameId ID of the game
   * @returns {Promise<number>} Promise that resolves with user play count
   */
  getUserPlayCount: async function(gameId) {
    if (!gameId || !this.cache.initialized) {
      return this.fallbackGetUserPlays(gameId);
    }
    
    try {
      const userGameRef = doc(db, this.USERS_COLLECTION, this.cache.userId, this.PLAYS_COLLECTION, gameId);
      const userGameDoc = await getDoc(userGameRef);
      
      if (userGameDoc.exists()) {
        return userGameDoc.data().playCount || 0;
      }
      
      return 0;
    } catch (error) {
      console.error(`Error getting user play count for ${gameId}:`, error);
      
      // Fallback to localStorage if Firebase fails
      return this.fallbackGetUserPlays(gameId);
    }
  },
  
  /**
   * Get global play count for a specific game
   * @param {string} gameId ID of the game
   * @returns {Promise<number>} Promise that resolves with global play count
   */
  getGlobalPlayCount: async function(gameId) {
    if (!gameId || !this.cache.initialized) {
      return this.fallbackGetGlobalPlayCount(gameId);
    }
    
    try {
      // First check if we have a cached value
      if (this.cache.gameData[gameId] && this.cache.lastRefresh > Date.now() - 60000) {
        return this.cache.gameData[gameId].totalPlays || 0;
      }
      
      // If not in cache or cache is stale, fetch from Firestore
      const gameRef = doc(db, this.GAMES_COLLECTION, gameId);
      const gameDoc = await getDoc(gameRef);
      
      if (gameDoc.exists()) {
        const gameData = gameDoc.data();
        
        // Update cache
        this.cache.gameData[gameId] = gameData;
        
        return gameData.totalPlays || 0;
      }
      
      return 0;
    } catch (error) {
      console.error(`Error getting global play count for ${gameId}:`, error);
      
      // Fallback to localStorage if Firebase fails
      return this.fallbackGetGlobalPlayCount(gameId);
    }
  },
  
  /**
   * Get popularity trend for a game
   * @param {string} gameId ID of the game
   * @returns {Promise<string>} Promise that resolves with trend: 'rising', 'steady', or 'falling'
   */
  getGameTrend: async function(gameId) {
    if (!gameId || !this.cache.initialized) {
      return this.fallbackGetGameTrend(gameId);
    }
    
    try {
      // First check if we have a cached value
      if (this.cache.gameData[gameId] && this.cache.lastRefresh > Date.now() - 60000) {
        return this.cache.gameData[gameId].trend || 'steady';
      }
      
      // If not in cache or cache is stale, fetch from Firestore
      const gameRef = doc(db, this.GAMES_COLLECTION, gameId);
      const gameDoc = await getDoc(gameRef);
      
      if (gameDoc.exists()) {
        const gameData = gameDoc.data();
        
        // Update cache
        this.cache.gameData[gameId] = gameData;
        
        return gameData.trend || 'steady';
      }
      
      return 'steady';
    } catch (error) {
      console.error(`Error getting trend for ${gameId}:`, error);
      
      // Fallback to localStorage if Firebase fails
      return this.fallbackGetGameTrend(gameId);
    }
  },
  
  /**
   * Get the top N most played games
   * @param {number} limit Maximum number of games to return
   * @returns {Promise<Array>} Promise that resolves with array of [gameId, count] pairs
   */
  getTopGames: async function(limit = 5) {
    if (!this.cache.initialized) {
      return this.fallbackGetTopGames(limit);
    }
    
    try {
      // First check if we have a cached value
      if (this.cache.topGames.length > 0 && this.cache.lastRefresh > Date.now() - 60000) {
        return this.cache.topGames.slice(0, limit);
      }
      
      // If not in cache or cache is stale, fetch from Firestore
      const topGamesQuery = query(
        collection(db, this.GAMES_COLLECTION),
        orderBy('totalPlays', 'desc'),
        limit(limit)
      );
      
      const snapshot = await getDocs(topGamesQuery);
      const topGames = [];
      
      snapshot.forEach((doc) => {
        const gameData = doc.data();
        topGames.push([gameData.id, gameData.totalPlays]);
        
        // Update cache for this game
        this.cache.gameData[gameData.id] = gameData;
      });
      
      // Update top games cache
      this.cache.topGames = topGames;
      this.cache.lastRefresh = Date.now();
      
      return topGames;
    } catch (error) {
      console.error(`Error getting top ${limit} games:`, error);
      
      // Fallback to localStorage if Firebase fails
      return this.fallbackGetTopGames(limit);
    }
  },
  
  /**
   * Update game's popularity factor
   * @param {string} gameId ID of the game
   * @param {number} playDelta Change in popularity (positive or negative)
   * @returns {Promise<void>}
   */
  updatePopularityFactor: async function(gameId, playDelta) {
    if (!gameId || !this.cache.initialized) {
      return this.fallbackUpdatePopularityFactor(gameId, playDelta);
    }
    
    try {
      const gameRef = doc(db, this.GAMES_COLLECTION, gameId);
      const gameDoc = await getDoc(gameRef);
      
      if (gameDoc.exists()) {
        const gameData = gameDoc.data();
        const currentFactor = gameData.popularityFactor || 1.0;
        
        // Calculate new factor with limits
        const newFactor = Math.max(0.5, Math.min(12.0, currentFactor + (playDelta * 0.01)));
        
        // Update factor
        await updateDoc(gameRef, {
          popularityFactor: newFactor,
          lastUpdated: serverTimestamp()
        });
        
        // Update cache
        if (this.cache.gameData[gameId]) {
          this.cache.gameData[gameId].popularityFactor = newFactor;
        }
        
        console.log(`Updated popularity factor for ${gameId}: ${newFactor.toFixed(2)}`);
      }
    } catch (error) {
      console.error(`Error updating popularity factor for ${gameId}:`, error);
      
      // Fallback to localStorage if Firebase fails
      return this.fallbackUpdatePopularityFactor(gameId, playDelta);
    }
  },
  
  /**
   * Switch to fallback mode using localStorage
   * Called when Firebase operations fail
   */
  useFallbackMode: function() {
    console.warn('Switching to fallback localStorage mode for game stats');
    this.cache.initialized = false;
    
    // Load the existing GlobalGameStats if available
    if (window.GlobalGameStats) {
      console.log('Using existing GlobalGameStats as fallback');
    } else {
      console.warn('GlobalGameStats not found, creating basic fallback');
      // Create minimal fallback
      window.GlobalGameStats = {
        USER_PLAYS_KEY: 'user_game_plays',
        popularityFactors: {},
        baseCounts: {},
        initialize: function() { return this; },
        getUserPlays: function() {
          const stored = localStorage.getItem(this.USER_PLAYS_KEY);
          return stored ? JSON.parse(stored) : {};
        },
        saveUserPlays: function(plays) {
          localStorage.setItem(this.USER_PLAYS_KEY, JSON.stringify(plays));
        },
        recordUserPlay: function(gameId) {
          if (!gameId) return 0;
          const userPlays = this.getUserPlays();
          if (userPlays[gameId] === undefined) userPlays[gameId] = 0;
          userPlays[gameId]++;
          this.saveUserPlays(userPlays);
          return userPlays[gameId];
        },
        getGlobalPlayCount: function(gameId) {
          if (!gameId) return 0;
          const userPlays = this.getUserPlays();
          const userPlayCount = userPlays[gameId] || 0;
          const baseCount = this.baseCounts[gameId] || 1000;
          return baseCount + userPlayCount;
        },
        getGameTrend: function() { return 'steady'; },
        getTopGames: function(limit = 5) {
          const userPlays = this.getUserPlays();
          const pairs = Object.entries(userPlays);
          pairs.sort((a, b) => b[1] - a[1]);
          return pairs.slice(0, limit);
        },
        updatePopularityFactor: function() {}
      };
    }
  },
  
  // Fallback methods using localStorage
  fallbackRecordUserPlay: function(gameId) {
    if (window.GlobalGameStats) {
      return window.GlobalGameStats.recordUserPlay(gameId);
    }
    return 0;
  },
  
  fallbackGetUserPlays: function(gameId) {
    if (window.GlobalGameStats) {
      const userPlays = window.GlobalGameStats.getUserPlays();
      return userPlays[gameId] || 0;
    }
    return 0;
  },
  
  fallbackGetGlobalPlayCount: function(gameId) {
    if (window.GlobalGameStats) {
      return window.GlobalGameStats.getGlobalPlayCount(gameId);
    }
    return 0;
  },
  
  fallbackGetGameTrend: function(gameId) {
    if (window.GlobalGameStats) {
      return window.GlobalGameStats.getGameTrend(gameId);
    }
    return 'steady';
  },
  
  fallbackGetTopGames: function(limit) {
    if (window.GlobalGameStats) {
      return window.GlobalGameStats.getTopGames(limit);
    }
    return [];
  },
  
  fallbackUpdatePopularityFactor: function(gameId, playDelta) {
    if (window.GlobalGameStats) {
      return window.GlobalGameStats.updatePopularityFactor(gameId, playDelta);
    }
  }
};

// Export the module
export default FirebaseGameStats;
