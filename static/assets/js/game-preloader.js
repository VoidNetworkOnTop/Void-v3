// Intelligent Game Preloader
// This script will preload game URLs in small batches using browser idle time
// without causing lag on the main interface

// Configuration
const PRELOADER_CONFIG = {
  ENABLE_PRELOADING: true,         // Master switch
  BATCH_SIZE: 3,                   // How many games to preload in each batch
  BATCH_DELAY: 800,                // Delay between batches (ms)
  MAX_CONCURRENT: 2,               // Maximum concurrent preloads
  MAX_PRELOADED: 20,               // Maximum games to preload in total
  PRELOAD_VISIBLE_FIRST: true,     // Prioritize visible games first
  NETWORK_SENSITIVE: true,         // Adapt to network conditions
  RESPECT_DATA_SAVER: true,        // Respect data-saver mode if enabled
  PRELOAD_AFTER_IDLE: 2000,        // Wait for page to be idle (ms)
  USE_SERVICE_WORKER: true,        // Use service worker cache when available
  HIGH_TRAFFIC_MODE_LIMIT: 5       // Reduced preload limit during high traffic
};

// Track preloading state
const preloadState = {
  started: false,
  completed: 0,
  inProgress: 0,
  queue: [],
  highTrafficMode: false,
  visibleGames: new Set(),
  preloadedGames: new Set()
};

// Initialize the preloader after page is fully loaded and idle
function initGamePreloader() {
  if (!PRELOADER_CONFIG.ENABLE_PRELOADING) return;
  
  console.log('Game preloader initialized');
  
  // Detect if user has Data Saver enabled
  if (PRELOADER_CONFIG.RESPECT_DATA_SAVER && navigator.connection && navigator.connection.saveData) {
    console.log('Data Saver mode detected, disabling preloading');
    return; // Respect user's data saving preference
  }
  
  // Detect network conditions
  if (PRELOADER_CONFIG.NETWORK_SENSITIVE && navigator.connection) {
    const connection = navigator.connection;
    
    // Disable preloading on slow connections
    if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
      console.log('Slow connection detected, disabling preloading');
      return;
    }
    
    // Reduce batch size on 3g connections
    if (connection.effectiveType === '3g') {
      PRELOADER_CONFIG.BATCH_SIZE = 2;
      PRELOADER_CONFIG.MAX_PRELOADED = 10;
      PRELOADER_CONFIG.BATCH_DELAY = 1500;
    }
  }
  
  // Check if high traffic mode is active (via service worker message)
  checkHighTrafficMode();
  
  // Listen for high traffic mode updates from service worker
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'HIGH_TRAFFIC_MODE') {
        preloadState.highTrafficMode = event.data.enabled;
        console.log('High traffic mode update received:', preloadState.highTrafficMode);
      }
    });
  }
  
  // Set up intersection observer to track visible games
  if (PRELOADER_CONFIG.PRELOAD_VISIBLE_FIRST) {
    setupVisibilityTracking();
  }
  
  // Wait for page to be fully loaded and idle before starting preloads
  if (document.readyState === 'complete') {
    schedulePreloading();
  } else {
    window.addEventListener('load', schedulePreloading);
  }
}

// Check if high traffic mode is active
function checkHighTrafficMode() {
  // Method 1: Check via window variable if available (set by service worker)
  if (window.__highTrafficMode) {
    preloadState.highTrafficMode = true;
  }
  
  // Method 2: Ask the service worker
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'STATUS_REQUEST'
    });
  }
}

// Set up tracking for which games are visible in viewport
function setupVisibilityTracking() {
  if (!('IntersectionObserver' in window)) return;
  
  const gameItems = document.querySelectorAll('.game-item');
  if (!gameItems.length) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const gameElement = entry.target;
      const gameLinkElement = gameElement.querySelector('a') || gameElement;
      const gameUrl = gameLinkElement.href || gameLinkElement.getAttribute('data-href');
      
      if (entry.isIntersecting) {
        preloadState.visibleGames.add(gameUrl);
      } else {
        preloadState.visibleGames.delete(gameUrl);
      }
    });
  }, {
    root: null, // Use viewport
    rootMargin: '100px', // Add 100px margin around viewport
    threshold: 0.1 // Consider visible when 10% is in view
  });
  
  gameItems.forEach(item => observer.observe(item));
}

// Schedule preloading after the page is idle
function schedulePreloading() {
  if (preloadState.started) return;
  
  // Use requestIdleCallback if available, otherwise setTimeout
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      setTimeout(startPreloading, PRELOADER_CONFIG.PRELOAD_AFTER_IDLE);
    });
  } else {
    setTimeout(startPreloading, PRELOADER_CONFIG.PRELOAD_AFTER_IDLE + 1000); // Add extra delay as fallback
  }
}

// Start the preloading process
function startPreloading() {
  if (preloadState.started) return;
  preloadState.started = true;
  
  console.log('Starting game preloading...');
  
  // Get all game URLs to preload
  buildPreloadQueue();
  
  // Start the preload process
  processNextBatch();
}

// Build the queue of games to preload
function buildPreloadQueue() {
  preloadState.queue = [];
  
  // Combine both game arrays
  const allGames = [];
  
  // Check if game data arrays are available
  if (typeof gamesData !== 'undefined') {
    allGames.push(...gamesData);
  }
  
  if (typeof games2Data !== 'undefined') {
    allGames.push(...games2Data);
  }
  
  // If no games found, try to get them from DOM
  if (allGames.length === 0) {
    const gameItems = document.querySelectorAll('.game-item');
    
    gameItems.forEach(item => {
      const link = item.querySelector('a') || item;
      const href = link.href || link.getAttribute('data-href');
      if (href) {
        allGames.push({ link: href });
      }
    });
  }
  
  // Sort games - prioritize visible ones first
  if (PRELOADER_CONFIG.PRELOAD_VISIBLE_FIRST && preloadState.visibleGames.size > 0) {
    allGames.sort((a, b) => {
      const aIsVisible = preloadState.visibleGames.has(a.link);
      const bIsVisible = preloadState.visibleGames.has(b.link);
      
      if (aIsVisible && !bIsVisible) return -1;
      if (!aIsVisible && bIsVisible) return 1;
      return 0;
    });
  }
  
  // Add to queue (respect max limit)
  const maxToPreload = preloadState.highTrafficMode ? 
    PRELOADER_CONFIG.HIGH_TRAFFIC_MODE_LIMIT : 
    PRELOADER_CONFIG.MAX_PRELOADED;
  
  preloadState.queue = allGames.slice(0, maxToPreload);
  
  console.log(`Preload queue built with ${preloadState.queue.length} games`);
}

// Process the next batch of games
function processNextBatch() {
  // Stop if we've reached our limits
  if (preloadState.completed >= PRELOADER_CONFIG.MAX_PRELOADED || 
      preloadState.queue.length === 0) {
    console.log(`Preloading completed: ${preloadState.completed} games preloaded`);
    return;
  }
  
  // Check if we're at capacity for concurrent preloads
  if (preloadState.inProgress >= PRELOADER_CONFIG.MAX_CONCURRENT) {
    setTimeout(processNextBatch, PRELOADER_CONFIG.BATCH_DELAY);
    return;
  }
  
  // Get the next batch
  const currentBatchSize = Math.min(
    PRELOADER_CONFIG.BATCH_SIZE,
    PRELOADER_CONFIG.MAX_CONCURRENT - preloadState.inProgress,
    preloadState.queue.length
  );
  
  const batch = preloadState.queue.splice(0, currentBatchSize);
  
  // Preload this batch
  batch.forEach(game => {
    preloadGame(game.link);
  });
  
  // Schedule the next batch
  setTimeout(processNextBatch, PRELOADER_CONFIG.BATCH_DELAY);
}

// Preload an individual game
function preloadGame(gameUrl) {
  // Skip if already preloaded
  if (preloadState.preloadedGames.has(gameUrl)) return;
  
  preloadState.preloadedGames.add(gameUrl);
  preloadState.inProgress++;
  
  console.log(`Preloading game: ${gameUrl}`);
  
  // Choose the appropriate preloading method
  if (PRELOADER_CONFIG.USE_SERVICE_WORKER && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    // Method 1: Use service worker to cache the URL
    serviceWorkerPreload(gameUrl);
  } else {
    // Method 2: Use link prefetch as fallback
    linkPrefetch(gameUrl);
  }
}

// Preload using service worker
function serviceWorkerPreload(url) {
  // Tell the service worker to cache this URL
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PRELOAD_GAME',
      url: url
    });
    
    // We don't get callbacks from service worker easily, so use a timeout
    setTimeout(() => {
      preloadState.inProgress--;
      preloadState.completed++;
    }, 3000);
  } else {
    // Fallback if service worker isn't ready
    linkPrefetch(url);
  }
}

// Preload using link prefetch
function linkPrefetch(url) {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = 'document';
  
  link.onload = () => {
    console.log(`Preloaded: ${url}`);
    preloadState.inProgress--;
    preloadState.completed++;
  };
  
  link.onerror = () => {
    console.warn(`Failed to preload: ${url}`);
    preloadState.inProgress--;
    preloadState.preloadedGames.delete(url);
  };
  
  document.head.appendChild(link);
}

// Add event listener for high traffic mode
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'HIGH_TRAFFIC_MODE') {
    preloadState.highTrafficMode = event.data.enabled;
    console.log('Preloader detected high traffic mode:', preloadState.highTrafficMode);
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGamePreloader);
} else {
  initGamePreloader();
}
