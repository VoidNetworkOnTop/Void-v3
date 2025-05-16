// Intelligent Game Preloader for UV Proxy System
// This script will preload game URLs through the UV proxy in small batches
// without causing lag on the main interface

// Configuration
const PRELOADER_CONFIG = {
  ENABLE_PRELOADING: true,         // Master switch
  BATCH_SIZE: 3,                   // How many games to preload in each batch
  BATCH_DELAY: 800,                // Delay between batches (ms)
  MAX_CONCURRENT: 2,               // Maximum concurrent preloads
  MAX_PRELOADED: 15,               // Maximum games to preload in total
  PRELOAD_VISIBLE_FIRST: true,     // Prioritize visible games first
  NETWORK_SENSITIVE: true,         // Adapt to network conditions
  RESPECT_DATA_SAVER: true,        // Respect data-saver mode if enabled
  PRELOAD_AFTER_IDLE: 2000,        // Wait for page to be idle (ms)
  USE_SERVICE_WORKER: true,        // Use service worker cache when available
  HIGH_TRAFFIC_MODE_LIMIT: 5,      // Reduced preload limit during high traffic
  UV_PRELOAD_MODE: 'fetch',        // Method to use: 'fetch', 'iframe', or 'link'
  DEBUG_MODE: false                // Show detailed logs
};

// Track preloading state
const preloadState = {
  started: false,
  completed: 0,
  inProgress: 0,
  queue: [],
  highTrafficMode: false,
  visibleGames: new Set(),
  preloadedGames: new Set(),
  uvConfigLoaded: false,
  hiddenFrames: []
};

// Check if UV is available
function checkUVAvailability() {
  if (typeof __uv$config !== 'undefined' && __uv$config.prefix && __uv$config.encodeUrl) {
    preloadState.uvConfigLoaded = true;
    if (PRELOADER_CONFIG.DEBUG_MODE) {
      console.log('UV configuration detected and ready for preloading');
    }
    return true;
  }
  
  // Wait for UV to load if not ready
  if (!preloadState.uvConfigLoaded) {
    if (PRELOADER_CONFIG.DEBUG_MODE) {
      console.log('Waiting for UV configuration to load...');
    }
    
    // Try again in a moment
    setTimeout(checkUVAvailability, 300);
    return false;
  }
  
  return false;
}

// Initialize the preloader after page is fully loaded and idle
function initGamePreloader() {
  if (!PRELOADER_CONFIG.ENABLE_PRELOADING) return;
  
  if (PRELOADER_CONFIG.DEBUG_MODE) {
    console.log('Game preloader initializing...');
  }
  
  // First check if UV is available
  if (!checkUVAvailability()) return;
  
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
        if (PRELOADER_CONFIG.DEBUG_MODE) {
          console.log('High traffic mode update received:', preloadState.highTrafficMode);
        }
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
  
  // Check if game data arrays are available in the global scope
  if (typeof window.gamesData !== 'undefined') {
    allGames.push(...window.gamesData);
    if (PRELOADER_CONFIG.DEBUG_MODE) {
      console.log(`Found ${window.gamesData.length} games in gamesData`);
    }
  }
  
  if (typeof window.games2Data !== 'undefined') {
    allGames.push(...window.games2Data);
    if (PRELOADER_CONFIG.DEBUG_MODE) {
      console.log(`Found ${window.games2Data.length} games in games2Data`);
    }
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
    
    if (PRELOADER_CONFIG.DEBUG_MODE) {
      console.log(`Found ${allGames.length} games from DOM elements`);
    }
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
  
  if (PRELOADER_CONFIG.DEBUG_MODE) {
    console.log(`Preload queue built with ${preloadState.queue.length} games`);
  }
}

// Process the next batch of games
function processNextBatch() {
  // Stop if we've reached our limits
  if (preloadState.completed >= PRELOADER_CONFIG.MAX_PRELOADED || 
      preloadState.queue.length === 0) {
    if (PRELOADER_CONFIG.DEBUG_MODE) {
      console.log(`Preloading completed: ${preloadState.completed} games preloaded`);
    }
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
  
  if (PRELOADER_CONFIG.DEBUG_MODE) {
    console.log(`Preloading game: ${gameUrl}`);
  }
  
  // Different methods to preload the game through UV
  switch (PRELOADER_CONFIG.UV_PRELOAD_MODE) {
    case 'fetch':
      uvFetchPreload(gameUrl);
      break;
    case 'iframe':
      uvIframePreload(gameUrl);
      break;
    case 'link':
      uvLinkPrefetch(gameUrl);
      break;
    default:
      uvFetchPreload(gameUrl);
  }
}

// UV-specific preloading methods

// Method 1: Use fetch to preload
function uvFetchPreload(url) {
  // Make sure UV is available
  if (!preloadState.uvConfigLoaded) {
    preloadState.inProgress--;
    setTimeout(() => preloadGame(url), 500);
    return;
  }
  
  // We'll use fetch to preload the game URL
  fetch(url, {
    method: 'HEAD',
    mode: 'no-cors',
    cache: 'force-cache',
    credentials: 'omit',
    priority: 'low'
  })
  .then(response => {
    if (PRELOADER_CONFIG.DEBUG_MODE) {
      console.log(`Preloaded via fetch: ${url}`);
    }
    preloadState.inProgress--;
    preloadState.completed++;
  })
  .catch(error => {
    if (PRELOADER_CONFIG.DEBUG_MODE) {
      console.warn(`Failed to preload via fetch: ${url}`, error);
    }
    preloadState.inProgress--;
    preloadState.preloadedGames.delete(url);
    
    // Try service worker as fallback
    if (PRELOADER_CONFIG.USE_SERVICE_WORKER && navigator.serviceWorker && navigator.serviceWorker.controller) {
      serviceWorkerPreload(url);
    }
  });
}

// Method 2: Use hidden iframe to preload
function uvIframePreload(url) {
  // Create a hidden iframe to load the game
  const iframe = document.createElement('iframe');
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.visibility = 'hidden';
  iframe.style.opacity = '0';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('tabindex', '-1');
  
  // Set timeout to prevent hanging preloads
  const timeout = setTimeout(() => {
    if (PRELOADER_CONFIG.DEBUG_MODE) {
      console.warn(`Preload timeout for: ${url}`);
    }
    cleanupIframe();
  }, 10000);
  
  // Cleanup function
  const cleanupIframe = () => {
    clearTimeout(timeout);
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
    
    // Update preload state
    preloadState.inProgress--;
    preloadState.completed++;
    
    // Remove from hidden frames list
    const index = preloadState.hiddenFrames.indexOf(iframe);
    if (index > -1) {
      preloadState.hiddenFrames.splice(index, 1);
    }
  };
  
  // Set up event listeners
  iframe.onload = () => {
    if (PRELOADER_CONFIG.DEBUG_MODE) {
      console.log(`Preloaded via iframe: ${url}`);
    }
    // Wait a bit before cleanup to ensure resources are loaded
    setTimeout(cleanupIframe, 1000);
  };
  
  iframe.onerror = () => {
    if (PRELOADER_CONFIG.DEBUG_MODE) {
      console.warn(`Failed to preload via iframe: ${url}`);
    }
    preloadState.preloadedGames.delete(url);
    cleanupIframe();
  };
  
  // Start loading
  iframe.src = url;
  document.body.appendChild(iframe);
  
  // Add to list of hidden frames for cleanup
  preloadState.hiddenFrames.push(iframe);
}

// Method 3: Use link prefetch (more compatible, but less reliable with UV)
function uvLinkPrefetch(url) {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = 'document';
  
  link.onload = () => {
    if (PRELOADER_CONFIG.DEBUG_MODE) {
      console.log(`Preloaded via link prefetch: ${url}`);
    }
    preloadState.inProgress--;
    preloadState.completed++;
  };
  
  link.onerror = () => {
    if (PRELOADER_CONFIG.DEBUG_MODE) {
      console.warn(`Failed to preload via link prefetch: ${url}`);
    }
    preloadState.inProgress--;
    preloadState.preloadedGames.delete(url);
  };
  
  document.head.appendChild(link);
}

// Service worker preload method
function serviceWorkerPreload(url) {
  // Tell the service worker to cache this URL
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PRELOAD_GAME',
      url: url
    });
    
    if (PRELOADER_CONFIG.DEBUG_MODE) {
      console.log(`Requested service worker preload for: ${url}`);
    }
    
    // We don't get callbacks from service worker easily, so use a timeout
    setTimeout(() => {
      preloadState.inProgress--;
      preloadState.completed++;
    }, 3000);
  } else {
    // Fallback if service worker isn't ready
    uvFetchPreload(url);
  }
}

// Clean up any hidden frames when needed (e.g., page unload)
function cleanupHiddenFrames() {
  preloadState.hiddenFrames.forEach(iframe => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  });
  preloadState.hiddenFrames = [];
}

// Add event listener for high traffic mode
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'HIGH_TRAFFIC_MODE') {
    preloadState.highTrafficMode = event.data.enabled;
    if (PRELOADER_CONFIG.DEBUG_MODE) {
      console.log('Preloader detected high traffic mode:', preloadState.highTrafficMode);
    }
  }
});

// Clean up on page unload
window.addEventListener('beforeunload', cleanupHiddenFrames);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGamePreloader);
} else {
  initGamePreloader();
}
