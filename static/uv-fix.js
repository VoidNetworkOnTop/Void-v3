// Create this as uv-fix.js
// Version with NO loading messages - only shows error when game truly fails

(function() {
  // Configuration
  const CONFIG = {
    WAIT_BEFORE_ERROR: 120000,  // 2 minutes before showing error
    DEBUG: false                // Enable debug logging
  };
  
  // Track state
  let state = {
    loadStartTime: Date.now(),
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

  // Detect if content has loaded
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
  
  // Show the error notice only after long wait with no content
  function showErrorNotice() {
    // Don't show error if user has interacted or content loaded
    if (state.userInteracted || state.contentDetected) {
      return;
    }
    
    // Check one more time before showing error
    if (hasGameContent()) {
      state.contentDetected = true;
      return;
    }
    
    const notice = document.createElement('div');
    notice.id = 'uv-error';
    notice.style.position = 'fixed';
    notice.style.top = '50%';
    notice.style.left = '50%';
    notice.style.transform = 'translate(-50%, -50%)';
    notice.style.background = 'rgba(0,0,0,0.9)';
    notice.style.color = 'white';
    notice.style.padding = '20px';
    notice.style.borderRadius = '8px';
    notice.style.fontFamily = 'Arial, sans-serif';
    notice.style.fontSize = '14px';
    notice.style.zIndex = '9999';
    notice.style.textAlign = 'center';
    notice.style.maxWidth = '90%';
    notice.style.width = '400px';
    notice.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    
    notice.innerHTML = `
      <div style="color:#f44336;font-weight:bold;font-size:16px;margin-bottom:10px;">
        We're having trouble loading this game
      </div>
      <div style="margin:10px 0;line-height:1.5;">
        Sorry! This game isn't loading properly. If the issue continues, please visit our support team by going to the home page and clicking the phone icon at the bottom.
      </div>
      <div style="display:flex;justify-content:center;gap:10px;margin-top:15px;">
        <button id="uv-try-again" style="background:#2196f3;border:none;color:white;padding:8px 16px;border-radius:4px;cursor:pointer;font-weight:bold;">
          Try Again
        </button>
        <button id="uv-go-home" style="background:#757575;border:none;color:white;padding:8px 16px;border-radius:4px;cursor:pointer;">
          Go Home
        </button>
      </div>
    `;
    
    document.body.appendChild(notice);
    
    // Add event listeners
    document.getElementById('uv-try-again').addEventListener('click', function() {
      window.location.reload();
    });
    
    document.getElementById('uv-go-home').addEventListener('click', function() {
      window.location.href = '/';
    });
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
  
  // Track user interaction
  function detectUserInteraction() {
    // These events suggest the user is interacting with the game
    const interactionEvents = ['click', 'touchstart', 'keydown', 'mousemove'];
    
    function onUserInteraction() {
      debug('User interaction detected');
      state.userInteracted = true;
      
      // Clean up event listeners
      interactionEvents.forEach(event => {
        document.removeEventListener(event, onUserInteraction);
      });
    }
    
    // Add listeners for each interaction type
    interactionEvents.forEach(event => {
      document.addEventListener(event, onUserInteraction);
    });
  }
  
  // Initialize
  function initialize() {
    debug('Initializing UV Fix Helper (no loading messages)');
    
    // Add CSS fixes immediately
    addFixStyles();
    
    // Setup interaction detection
    detectUserInteraction();
    
    // Start content checks
    const checkInterval = setInterval(function() {
      if (hasGameContent()) {
        state.contentDetected = true;
        clearInterval(checkInterval);
      }
    }, 10000);
    
    state.timerIds.push(checkInterval);
    
    // Setup the error message timer
    const errorTimer = setTimeout(function() {
      // Only show error if no content detected and no user interaction
      if (!state.contentDetected && !state.userInteracted) {
        showErrorNotice();
      }
    }, CONFIG.WAIT_BEFORE_ERROR);
    
    state.timerIds.push(errorTimer);
  }
  
  // Initialize based on document state
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
