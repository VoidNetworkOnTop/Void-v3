// Create this as uv-fix.js
// Final version with support message for actual errors

(function() {
  console.log('UV Fix Helper initializing...');
  
  // Configuration - adjust these values
  const CONFIG = {
    INITIAL_WAIT: 20000,         // Wait 20 seconds before first check (increased)
    EXTENDED_WAIT: 35000,        // Wait 35 seconds for slow-loading games
    FINAL_ERROR_TIMEOUT: 90000,  // 1.5 minutes before showing final error
    LOAD_PATIENCE: 4,            // Number of loading checks before showing recovery UI
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
    userDismissedWarning: false,
    finalErrorShown: false
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
  
  // Create a dismissible loading notice (not an error yet)
  function createLoadingNotice() {
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
    notice.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    
    // We start with a "still loading" message
    notice.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;">
        <span style="color:#ffc107;font-weight:bold;">Game still loading...</span>
        <button id="uv-dismiss" style="background:none;border:none;color:white;font-size:16px;cursor:pointer;padding:0 5px;">✕</button>
      </div>
      <div style="margin:5px 0;font-size:13px;">
        This game is taking longer than usual to load. You can:
      </div>
      <div style="display:flex;justify-content:center;gap:10px;margin-top:8px;">
        <button id="uv-keep-waiting" style="background:#4caf50;border:none;color:white;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:13px;">
          Keep Waiting
        </button>
        <button id="uv-reload" style="background:#2196f3;border:none;color:white;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:13px;">
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
  }
  
  // Update to error notice after timeout
  function updateToErrorNotice() {
    const notice = document.getElementById('uv-notice');
    if (!notice || gameLoadingData.finalErrorShown) return;
    
    // Mark as final error shown
    gameLoadingData.finalErrorShown = true;
    
    // Enhanced error message with support information
    notice.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <span style="color:#f44336;font-weight:bold;">We're having trouble loading this game</span>
        <button id="uv-dismiss-error" style="background:none;border:none;color:white;font-size:16px;cursor:pointer;padding:0 5px;">✕</button>
      </div>
      <div style="margin:5px 0;font-size:13px;line-height:1.4;">
        Sorry! This game isn't loading properly. If the issue continues, please visit our support team by going to the home page and clicking the phone icon at the bottom.
      </div>
      <div style="display:flex;justify-content:center;gap:10px;margin-top:10px;">
        <button id="uv-try-again" style="background:#2196f3;border:none;color:white;padding:5px 12px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:13px;">
          Try Again
        </button>
        <button id="uv-go-home" style="background:#757575;border:none;color:white;padding:5px 12px;border-radius:4px;cursor:pointer;font-size:13px;">
          Go Home
        </button>
      </div>
    `;
    
    // Update the event listeners for the new buttons
    document.getElementById('uv-dismiss-error').addEventListener('click', function() {
      notice.style.display = 'none';
    });
    
    document.getElementById('uv-try-again').addEventListener('click', function() {
      window.location.reload();
    });
    
    document.getElementById('uv-go-home').addEventListener('click', function() {
      window.location.href = '/';
    });
    
    // Make sure the notice is visible
    notice.style.display = 'block';
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
      <div id="uv-timer-text" style="margin-top:15px;font-size:14px;color:#aaa;"></div>
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
    
    // Show a timer that counts up instead of counting down
    const timerText = document.getElementById('uv-timer-text');
    let seconds = 0;
    
    const timerInterval = setInterval(function() {
      seconds++;
      timerText.textContent = `Waiting: ${seconds} seconds`;
      
      // After enough time (90 seconds by default), show the final error message
      if (seconds >= CONFIG.FINAL_ERROR_TIMEOUT / 1000) {
        clearInterval(timerInterval);
        
        // Update recovery UI to show final error message
        const messageContainer = recoveryDiv.querySelector('p');
        if (messageContainer) {
          messageContainer.innerHTML = `
            <div style="color:#f44336;font-weight:bold;margin-bottom:10px;">We're having trouble loading this game</div>
            <div style="font-size:14px;line-height:1.5;max-width:550px;margin:0 auto 15px auto;">
              Sorry! This game isn't loading properly. If the issue continues, please visit our support team by going to the home page and clicking the phone icon at the bottom.
            </div>
          `;
        }
        
        // Update buttons
        const buttonContainer = document.querySelector('#uv-recovery div:nth-child(4)');
        if (buttonContainer) {
          buttonContainer.innerHTML = `
            <button id="uv-try-again-btn" style="padding:10px 20px;background:#2196f3;color:white;border:none;margin:0 10px;border-radius:4px;cursor:pointer;font-weight:bold;">
              Try Again
            </button>
            <button id="uv-home-btn" style="padding:10px 20px;background:#757575;color:white;border:none;margin:0 10px;border-radius:4px;cursor:pointer;">
              Go Home
            </button>
          `;
          
          // Add new event listeners
          document.getElementById('uv-try-again-btn').addEventListener('click', function() {
            window.location.reload();
          });
          
          document.getElementById('uv-home-btn').addEventListener('click', function() {
            window.location.href = '/';
          });
        }
        
        // Hide the timer
        timerText.style.display = 'none';
      }
    }, 1000);
    
    // Store for cleanup
    gameLoadingData.timerInterval = timerInterval;
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
      createLoadingNotice();
      
      // Setup for final error message after timeout
      setTimeout(function() {
        if (!gameLoadingData.loadingComplete && !gameLoadingData.userDismissedWarning) {
          debug('Final timeout reached, showing error message');
          updateToErrorNotice();
        }
      }, CONFIG.FINAL_ERROR_TIMEOUT - initialWait);
      
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
          
          if (gameLoadingData.timerInterval) {
            clearInterval(gameLoadingData.timerInterval);
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
