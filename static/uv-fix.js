// Create this as uv-fix.js
// Version that auto-hides loading messages and detects interaction

(function() {
  // Configuration
  const CONFIG = {
    INITIAL_WAIT: 20000,         // Initial wait before checking
    AUTO_DISMISS_TIMER: 40000,   // Auto-dismiss loading message after this time
    FINAL_ERROR_TIMEOUT: 90000,  // Show error message after this time
    DEBUG: false                 // Enable debug logging
  };
  
  // Track state
  let state = {
    loadStartTime: Date.now(),
    noticeShown: false,
    contentDetected: false,
    userInteracted: false,
    timerIds: []
  };
  
  // Debug logging
  function debug(...args) {
    if (CONFIG.DEBUG) {
      console.log('[UV Fix]', ...args);
    }
  }

  // Improved content detection
  function hasGameContent() {
    if (!document.body) return false;
    
    // Check for canvas with reasonable size
    const hasCanvas = Array.from(document.querySelectorAll('canvas')).some(canvas => {
      const rect = canvas.getBoundingClientRect();
      return rect.width > 50 && rect.height > 50;
    });
    
    // Check for game containers
    const hasGameContainer = document.querySelectorAll(
      '[id*="game"], [id*="unity"], [class*="game"], [class*="unity"], #gameContainer, .game-container'
    ).length > 0;
    
    // Check for substantial content
    const bodyContent = document.body.innerHTML;
    const hasSubstantialContent = bodyContent.length > 10000;
    
    // Fast check - if we have obvious game elements, return true immediately
    if (hasCanvas || hasGameContainer) {
      return true;
    }
    
    // More thorough check
    const contentIndicators = [
      document.querySelectorAll('iframe').length > 0,
      document.querySelectorAll('img[src]').length > 3,
      document.querySelectorAll('svg').length > 0,
      document.querySelectorAll('video').length > 0,
      document.querySelectorAll('button, a[href], input').length > 5,
      document.body.innerText.trim().length > 200,
      hasSubstantialContent
    ].filter(Boolean).length;
    
    return contentIndicators >= 2;
  }
  
  // Create loading notice
  function createLoadingNotice() {
    // Don't create duplicate notices
    if (document.getElementById('uv-notice') || state.noticeShown) {
      return;
    }
    
    state.noticeShown = true;
    
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
    notice.style.transition = 'opacity 0.5s ease';
    
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
      hideNotice();
    });
    
    document.getElementById('uv-keep-waiting').addEventListener('click', function() {
      hideNotice();
    });
    
    document.getElementById('uv-reload').addEventListener('click', function() {
      window.location.reload();
    });
    
    // Set auto-dismiss timer
    const autoDismissTimer = setTimeout(function() {
      hideNotice();
    }, CONFIG.AUTO_DISMISS_TIMER);
    
    state.timerIds.push(autoDismissTimer);
  }
  
  // Update notice to error message
  function updateToErrorNotice() {
    const notice = document.getElementById('uv-notice');
    if (!notice) {
      return;
    }
    
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
      hideNotice();
    });
    
    document.getElementById('uv-try-again').addEventListener('click', function() {
      window.location.reload();
    });
    
    document.getElementById('uv-go-home').addEventListener('click', function() {
      window.location.href = '/';
    });
    
    // Make sure notice is visible
    notice.style.opacity = '1';
  }
  
  // Hide the notice
  function hideNotice() {
    const notice = document.getElementById('uv-notice');
    if (notice) {
      notice.style.opacity = '0';
      setTimeout(function() {
        if (notice.parentNode) {
          notice.parentNode.removeChild(notice);
        }
      }, 500);
    }
  }
  
  // Add the necessary CSS fixes
  function addFixStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Make canvas visible */
      canvas {
        display: block !important;
        visibility: visible !important;
      }
      
      /* Fix game containers */
      [id*="game"], [id*="unity"], [class*="game"], [class*="unity"] {
        display: block !important;
        visibility: visible !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Setup user interaction detection
  function detectUserInteraction() {
    // These events suggest the user is interacting with the game
    const interactionEvents = ['click', 'touchstart', 'keydown', 'mousemove'];
    
    // After enough interactions, consider the game loaded
    let interactionCount = 0;
    const interactionThreshold = 3;
    
    function onUserInteraction() {
      interactionCount++;
      debug('User interaction detected:', interactionCount);
      
      if (interactionCount >= interactionThreshold) {
        debug('Sufficient interactions detected - assuming game is loaded');
        state.userInteracted = true;
        
        // Hide notice if it exists
        hideNotice();
        
        // Clean up event listeners
        interactionEvents.forEach(event => {
          document.removeEventListener(event, onUserInteraction);
        });
      }
    }
    
    // Add listeners for each interaction type
    interactionEvents.forEach(event => {
      document.addEventListener(event, onUserInteraction);
    });
  }
  
  // Initialize the system
  function initialize() {
    debug('Initializing UV Fix Helper...');
    
    // Add CSS fixes immediately
    addFixStyles();
    
    // Setup interaction detection
    detectUserInteraction();
    
    // Wait a bit before first check
    const initialCheckTimer = setTimeout(function() {
      // Check if content is loaded
      state.contentDetected = hasGameContent();
      debug('Initial content check:', state.contentDetected ? 'Content found' : 'No content yet');
      
      // If no content detected, show notice
      if (!state.contentDetected && !state.userInteracted) {
        debug('No content detected, showing loading notice');
        createLoadingNotice();
        
        // Setup for error message after final timeout
        const errorTimer = setTimeout(function() {
          if (!state.contentDetected && !state.userInteracted) {
            debug('Final timeout reached, showing error notice');
            updateToErrorNotice();
          }
        }, CONFIG.FINAL_ERROR_TIMEOUT - CONFIG.INITIAL_WAIT);
        
        state.timerIds.push(errorTimer);
        
        // Start content check interval
        const checkInterval = setInterval(function() {
          // Check if content is now loaded
          state.contentDetected = hasGameContent();
          
          if (state.contentDetected || state.userInteracted) {
            debug('Content now detected, clearing interval');
            hideNotice();
            clearInterval(checkInterval);
          }
        }, 5000);
        
        state.timerIds.push(checkInterval);
      }
    }, CONFIG.INITIAL_WAIT);
    
    state.timerIds.push(initialCheckTimer);
    
    // Final backup - auto-hide the message after load event
    window.addEventListener('load', function() {
      setTimeout(function() {
        debug('Window load event complete');
        
        // Check if user has interacted or content is loaded
        if (state.userInteracted || hasGameContent()) {
          hideNotice();
        }
        
        // Always hide after a longer timeout from load
        setTimeout(hideNotice, 10000);
      }, 2000);
    });
  }
  
  // Initialize based on document state
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
