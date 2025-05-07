// Create this as uv-fix.js
// More patient version that reduces false positives

(function() {
  console.log('UV Fix Helper initializing...');
  
  // Configuration - adjust these values
  const CONFIG = {
    INITIAL_WAIT: 15000,         // Wait 15 seconds before first check (increased from 8s)
    EXTENDED_WAIT: 30000,        // Wait 30 seconds for slow-loading games before recovery UI
    AUTO_RELOAD_TIMEOUT: 60000,  // 1 minute before auto-reload
    LOAD_PATIENCE: 3,            // Number of loading checks before showing recovery UI
    DEBUG: false                 // Set to true for detailed console logging
  };
  
  // List of known slow-loading domains (these get more time)
  const SLOW_DOMAINS = [
    'crazygames.com',
    'coolmathgames.com',
    'y8.com',
    'gamepix',
    'poki.com',
    'agame',
    'gamedistribution',
    'html5games.com',
    'unity'
  ];
  
  // Track loading state
  let gameLoadingData = {
    loadStartTime: Date.now(),
    loadingComplete: false,
    loadingChecks: 0,
    recoveryUIShown: false,
    userDismissedWarning: false
  };
  
  // Debug logging
  function debug(...args) {
    if (CONFIG.DEBUG) {
      console.log('[UV Fix]', ...args);
    }
  }
  
  // Check if the current site matches a slow domain
  function isSlowLoadingDomain() {
    const url = window.location.href;
    return SLOW_DOMAINS.some(domain => url.includes(domain));
  }
  
  // Get more time for slow domains
  function getAppropriateWaitTime() {
    return isSlowLoadingDomain() ? 
      CONFIG.EXTENDED_WAIT : CONFIG.INITIAL_WAIT;
  }
  
  // Better content detection - checks more indicators
  function hasGameContent() {
    if (!document.body) return false;
    
    // Look for specific signs of game content
    const hasCanvas = document.querySelectorAll('canvas').length > 0;
    const hasSizeableCanvas = Array.from(document.querySelectorAll('canvas')).some(canvas => {
      const rect = canvas.getBoundingClientRect();
      return rect.width > 50 && rect.height > 50; // Canvas must be a reasonable size
    });
    
    const hasIframe = document.querySelectorAll('iframe').length > 0;
    const hasGameContainer = document.querySelectorAll(
      '[id*="game"], [id*="unity"], [class*="game"], [class*="unity"], #gameContainer, .game-container'
    ).length > 0;
    
    const hasActiveAnimations = document.querySelectorAll(
      'canvas[style*="animation"], div[style*="animation"]'
    ).length > 0;
    
    const hasInteractiveElements = document.querySelectorAll(
      'button, a[href], input, select, textarea'
    ).length > 3; // Should have at least a few interactive elements
    
    const hasVisibleImages = document.querySelectorAll('img[src]').length > 1;
    
    // If we have a canvas with size or game container, that's a good sign
    if (hasSizeableCanvas || hasGameContainer) {
      debug('Game content detected: Canvas or game container');
      return true;
    }
    
    // Multiple indicators together suggest content is loaded
    const contentIndicators = [
      hasCanvas, hasIframe, hasGameContainer, hasActiveAnimations, 
      hasInteractiveElements, hasVisibleImages
    ].filter(Boolean).length;
    
    // More thorough text content check
    const textContent = document.body.innerText.trim();
    const hasMeaningfulText = textContent.length > 50 || 
                             textContent.split(/\s+/).length > 10;
    
    debug('Content indicators:', contentIndicators, 'Meaningful text:', hasMeaningfulText);
    
    // Either several indicators or meaningful text suggest content is loaded
    return contentIndicators >= 2 || hasMeaningfulText;
  }
  
  // Create a dismissible notice (instead of blocking UI)
  function createDismissibleNotice() {
    // Don't create multiple notices
    if (document.getElementById('uv-notice')) {
      return;
    }
    
    const notice = document.createElement('div');
    notice.id = 'uv-notice';
    notice.style.position = 'fixed';
    notice.style.bottom = '10px';
    notice.style.left = '50%';
    notice.style.transform = 'translateX(-50%)';
    notice.style.background = 'rgba(0,0,0,0.8)';
    notice.style.color = 'white';
    notice.style.padding = '10px 15px';
    notice.style.borderRadius = '8px';
    notice.style.fontFamily = 'Arial, sans-serif';
    notice.style.fontSize = '14px';
    notice.style.zIndex = '9999';
    notice.style.textAlign = 'center';
    notice.style.maxWidth = '90%';
    notice.style.width = '400px';
    
    notice.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;">
        <span style="color:#ffc107;font-weight:bold;">Game still loading...</span>
        <button id="uv-dismiss" style="background:none;border:none;color:white;font-size:16px;cursor:pointer;">✕</button>
      </div>
      <div style="margin:5px 0;font-size:13px;">
        This game is taking longer than usual to load. You can:
      </div>
      <div style="display:flex;justify-content:center;gap:10px;margin-top:8px;">
        <button id="uv-keep-waiting" style="background:#4caf50;border:none;color:white;padding:5px 10px;border-radius:4px;cursor:pointer;">
          Keep Waiting
        </button>
        <button id="uv-reload" style="background:#2196f3;border:none;color:white;padding:5px 10px;border-radius:4px;cursor:pointer;">
          Reload
        </button>
      </div>
    `;
    
    document.body.appendChild(notice);
    
    // Add event listeners
    document.getElementById('uv-dismiss').addEventListener('click', function() {
      notice.style.display = 'none';
      gameLoadingData.userDismissedWarning = true;
    });
    
    document.getElementById('uv-keep-waiting').addEventListener('click', function() {
      notice.style.display = 'none';
      gameLoadingData.userDismissedWarning = true;
    });
    
    document.getElementById('uv-reload').addEventListener('click', function() {
      window.location.reload();
    });
    
    gameLoadingData.recoveryUIShown = true;
  }
  
  // Create full recovery UI for actual blank screens
  function createRecoveryUI() {
    // Don't create if user has dismissed warning
    if (gameLoadingData.userDismissedWarning) {
      return;
    }
    
    // Don't create multiple recovery UIs
    if (document.getElementById('uv-recovery')) {
      return;
    }
    
    const recoveryDiv = document.createElement('div');
    recoveryDiv.id = 'uv-recovery';
    recoveryDiv.style.position = 'fixed';
    recoveryDiv.style.top = '0';
    recoveryDiv.style.left = '0';
    recoveryDiv.style.width = '100%';
    recoveryDiv.style.height = '100%';
    recoveryDiv.style.display = 'flex';
    recoveryDiv.style.flexDirection = 'column';
    recoveryDiv.style.alignItems = 'center';
    recoveryDiv.style.justifyContent = 'center';
    recoveryDiv.style.background = 'rgba(0,0,0,0.9)';
    recoveryDiv.style.color = '#fff';
    recoveryDiv.style.fontFamily = 'Arial, sans-serif';
    recoveryDiv.style.zIndex = '9999';
    
    // Check if this is a slow-loading domain
    const isSlowDomain = isSlowLoadingDomain();
    
    // Different messaging based on domain type
    const messageHtml = isSlowDomain ?
      `<p>This game is known to take longer to load.<br>It may still be initializing in the background.</p>` :
      `<p>The game is taking longer than expected to load.</p>`;
    
    // Add content
    recoveryDiv.innerHTML = `
      <h2>Game Loading</h2>
      <div style="width:60px;height:60px;border:5px solid rgba(255,255,255,0.3);border-top:5px solid white;border-radius:50%;margin:20px;animation:uvSpin 1s linear infinite;"></div>
      ${messageHtml}
      <div style="display:flex;margin-top:20px;">
        <button id="uv-wait-btn" style="padding:10px 20px;background:#4caf50;color:white;border:none;margin:0 10px;border-radius:4px;cursor:pointer;">
          Continue Waiting
        </button>
        <button id="uv-reload-btn" style="padding:10px 20px;background:#2196f3;color:white;border:none;margin:0 10px;border-radius:4px;cursor:pointer;">
          Reload Game
        </button>
      </div>
      <div id="uv-auto-reload-text" style="margin-top:15px;font-size:14px;color:#aaa;"></div>
      <style>@keyframes uvSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
    `;
    
    document.body.appendChild(recoveryDiv);
    
    // Add event listeners
    document.getElementById('uv-wait-btn').addEventListener('click', function() {
      // Just hide the recovery UI
      recoveryDiv.style.display = 'none';
      gameLoadingData.userDismissedWarning = true;
      
      // Create a small indicator that can bring back the UI
      const indicator = document.createElement('div');
      indicator.id = 'uv-mini-indicator';
      indicator.style.position = 'fixed';
      indicator.style.bottom = '10px';
      indicator.style.right = '10px';
      indicator.style.background = 'rgba(0,0,0,0.7)';
      indicator.style.color = 'white';
      indicator.style.padding = '8px 12px';
      indicator.style.borderRadius = '4px';
      indicator.style.fontFamily = 'Arial, sans-serif';
      indicator.style.fontSize = '12px';
      indicator.style.cursor = 'pointer';
      indicator.style.zIndex = '9998';
      indicator.textContent = 'Show Loading Help';
      
      indicator.addEventListener('click', function() {
        recoveryDiv.style.display = 'flex';
        indicator.remove();
      });
      
      document.body.appendChild(indicator);
    });
    
    document.getElementById('uv-reload-btn').addEventListener('click', function() {
      window.location.reload();
    });
    
    // Maybe add auto-reload countdown for non-slow domains
    if (!isSlowDomain) {
      const countdownText = document.getElementById('uv-auto-reload-text');
      
      let countdown = 60; // 1 minute countdown
      countdownText.textContent = `Auto-reloading in ${countdown} seconds...`;
      
      const countdownInterval = setInterval(function() {
        countdown--;
        countdownText.textContent = `Auto-reloading in ${countdown} seconds...`;
        
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          window.location.reload();
        }
      }, 1000);
      
      // Store for cleanup
      gameLoadingData.countdownInterval = countdownInterval;
    }
    
    gameLoadingData.recoveryUIShown = true;
  }
  
  // Initialize blank screen detection and recovery
  function initBlankScreenChecks() {
    // Initial wait based on site
    const initialWait = getAppropriateWaitTime();
    debug(`Initial wait time: ${initialWait}ms, Slow domain: ${isSlowLoadingDomain()}`);
    
    // First check - just show notice if game is still loading
    setTimeout(function() {
      debug('Performing initial content check');
      
      // Exit if loading completed during wait
      if (gameLoadingData.loadingComplete) {
        debug('Loading completed during initial wait, exiting checks');
        return;
      }
      
      // Skip if there's content
      if (hasGameContent()) {
        debug('Initial check: Content detected');
        gameLoadingData.loadingComplete = true;
        return;
      }
      
      debug('Initial check: No content detected yet');
      
      // Show a non-intrusive notice first
      createDismissibleNotice();
      
      // Start more thorough checks for blank screen
      const checkInterval = setInterval(function() {
        gameLoadingData.loadingChecks++;
        debug(`Check #${gameLoadingData.loadingChecks} for content`);
        
        // If content detected, clean up
        if (hasGameContent()) {
          debug('Content detected, clearing checks');
          clearInterval(checkInterval);
          gameLoadingData.loadingComplete = true;
          
          // Hide notice if it exists
          const notice = document.getElementById('uv-notice');
          if (notice) {
            notice.style.display = 'none';
          }
          
          // Hide recovery UI if it exists
          const recovery = document.getElementById('uv-recovery');
          if (recovery) {
            recovery.style.display = 'none';
          }
          
          return;
        }
        
        // After several checks with no content, show full recovery UI
        if (gameLoadingData.loadingChecks >= CONFIG.LOAD_PATIENCE && !gameLoadingData.recoveryUIShown) {
          debug('Multiple empty checks, showing recovery UI');
          createRecoveryUI();
          clearInterval(checkInterval);
        }
      }, 5000); // Check every 5 seconds
      
      // Store for cleanup
      gameLoadingData.checkInterval = checkInterval;
      
    }, initialWait);
    
    // Mark loading as complete when we have real evidence
    window.addEventListener('load', function() {
      // Wait a bit after load event to check for content
      setTimeout(function() {
        if (hasGameContent()) {
          debug('Content detected after load event');
          gameLoadingData.loadingComplete = true;
          
          // Clean up any checks and UI
          if (gameLoadingData.checkInterval) {
            clearInterval(gameLoadingData.checkInterval);
          }
          
          if (gameLoadingData.countdownInterval) {
            clearInterval(gameLoadingData.countdownInterval);
          }
          
          // Hide notice if it exists
          const notice = document.getElementById('uv-notice');
          if (notice) {
            notice.style.display = 'none';
          }
          
          // Hide recovery UI if it exists
          const recovery = document.getElementById('uv-recovery');
          if (recovery) {
            recovery.style.display = 'none';
          }
        }
      }, 2000);
    });
  }
  
  // Add CSS for page-specific fixes
  function addFixStyles() {
    const fixStyles = document.createElement('style');
    fixStyles.textContent = `
      /* Make canvas elements visible */
      canvas {
        display: block !important;
        visibility: visible !important;
      }
      
      /* Fix broken game containers */
      [id*="game"], [id*="unity"], [class*="game"], [class*="unity"] {
        display: block !important;
        visibility: visible !important;
      }
    `;
    document.head.appendChild(fixStyles);
  }
  
  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      addFixStyles();
      initBlankScreenChecks();
    });
  } else {
    addFixStyles();
    initBlankScreenChecks();
  }
  
  console.log('UV Fix Helper initialized');
})();
