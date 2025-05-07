// Create this as a new file: uv-fix.js
// Then add it to your HTML pages where games are embedded

(function() {
  console.log('UV Fix Helper initializing...');
  
  // List of known problematic domains
  const PROBLEM_DOMAINS = [
    'crazygames.com',
    'coolmathgames.com',
    'y8.com',
    'gamepix',
    'poki.com',
    'agame',
    'gamedistribution'
  ];
  
  // Create diagnostic overlay (hidden by default)
  function createDiagnosticTools() {
    // Create container
    const diagContainer = document.createElement('div');
    diagContainer.id = 'uv-diagnostics';
    diagContainer.style.position = 'fixed';
    diagContainer.style.bottom = '0';
    diagContainer.style.left = '0';
    diagContainer.style.width = '100%';
    diagContainer.style.background = 'rgba(0,0,0,0.8)';
    diagContainer.style.color = 'white';
    diagContainer.style.padding = '10px';
    diagContainer.style.fontFamily = 'monospace';
    diagContainer.style.fontSize = '12px';
    diagContainer.style.zIndex = '99999';
    diagContainer.style.display = 'none';
    
    // Add content
    diagContainer.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong>UV Diagnostics</strong>
        <button id="uv-diag-close" style="background:none;border:none;color:white;cursor:pointer;">✕</button>
      </div>
      <div id="uv-diag-content" style="margin-top:10px;max-height:200px;overflow-y:auto;">
        <div>Collecting information...</div>
      </div>
      <div style="margin-top:10px;">
        <button id="uv-diag-reload" style="background:#4a6ed3;color:white;border:none;padding:5px 10px;cursor:pointer;margin-right:10px;">Reload</button>
        <button id="uv-diag-fix" style="background:#4caf50;color:white;border:none;padding:5px 10px;cursor:pointer;">Apply Fix</button>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(diagContainer);
    
    // Add event listeners
    document.getElementById('uv-diag-close').addEventListener('click', function() {
      diagContainer.style.display = 'none';
    });
    
    document.getElementById('uv-diag-reload').addEventListener('click', function() {
      window.location.reload();
    });
    
    document.getElementById('uv-diag-fix').addEventListener('click', function() {
      applyEmergencyFix();
    });
    
    // Add keyboard shortcut to show: Ctrl+Shift+U
    document.addEventListener('keydown', function(event) {
      if (event.ctrlKey && event.shiftKey && event.key === 'U') {
        toggleDiagnostics();
      }
    });
    
    return diagContainer;
  }
  
  // Toggle diagnostic panel
  function toggleDiagnostics() {
    const diagPanel = document.getElementById('uv-diagnostics') || createDiagnosticTools();
    
    if (diagPanel.style.display === 'none') {
      updateDiagnostics();
      diagPanel.style.display = 'block';
    } else {
      diagPanel.style.display = 'none';
    }
  }
  
  // Update diagnostic information
  function updateDiagnostics() {
    const contentDiv = document.getElementById('uv-diag-content');
    if (!contentDiv) return;
    
    // Get current URL information
    const currentUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    const gameParam = urlParams.get('game');
    
    // Get service worker status
    let swStatus = navigator.serviceWorker.controller ? 'Active' : 'Not active';
    
    // Get information from UV if available
    let uvInfo = '';
    if (window.__uv) {
      uvInfo = `
        <div><strong>UV Config:</strong> ${window.__uv.config ? 'Loaded' : 'Not loaded'}</div>
        <div><strong>UV Prefix:</strong> ${window.__uv.prefix || 'N/A'}</div>
      `;
    } else {
      uvInfo = '<div><strong>UV:</strong> Not detected on page</div>';
    }
    
    // Check for problematic domains
    let isProblematicDomain = false;
    let matchedDomain = '';
    
    if (gameParam) {
      try {
        // Try to decode the game parameter
        let decodedGame = '';
        try {
          if (window.atob) {
            decodedGame = atob(gameParam);
          }
        } catch (e) {
          decodedGame = 'Error decoding: ' + e.message;
        }
        
        // Check if this matches a problematic domain
        isProblematicDomain = PROBLEM_DOMAINS.some(domain => {
          if (decodedGame.includes(domain)) {
            matchedDomain = domain;
            return true;
          }
          return false;
        });
      } catch (e) {
        console.error('Error checking game URL:', e);
      }
    }
    
    // Build diagnostic HTML
    const diagHtml = `
      <div><strong>Current URL:</strong> ${currentUrl}</div>
      <div><strong>Game Parameter:</strong> ${gameParam || 'None'}</div>
      <div><strong>Service Worker:</strong> ${swStatus}</div>
      ${uvInfo}
      <div><strong>Problematic Domain:</strong> ${isProblematicDomain ? `Yes (${matchedDomain})` : 'No'}</div>
      <div><strong>Page Status:</strong> ${document.readyState}</div>
      <div><strong>Canvas Elements:</strong> ${document.querySelectorAll('canvas').length}</div>
      <div><strong>Body Content:</strong> ${document.body ? document.body.innerHTML.length + ' bytes' : 'No body'}</div>
    `;
    
    contentDiv.innerHTML = diagHtml;
  }
  
  // Apply emergency fix for problematic sites
  function applyEmergencyFix() {
    console.log('Applying emergency UV fix...');
    
    // Create loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.style.position = 'fixed';
    loadingDiv.style.top = '50%';
    loadingDiv.style.left = '50%';
    loadingDiv.style.transform = 'translate(-50%, -50%)';
    loadingDiv.style.background = 'rgba(0, 0, 0, 0.8)';
    loadingDiv.style.color = 'white';
    loadingDiv.style.padding = '20px';
    loadingDiv.style.borderRadius = '10px';
    loadingDiv.style.zIndex = '99999';
    loadingDiv.style.textAlign = 'center';
    loadingDiv.style.fontFamily = 'Arial, sans-serif';
    
    loadingDiv.innerHTML = `
      <div style="width:40px;height:40px;border:4px solid rgba(255,255,255,0.3);border-top:4px solid white;border-radius:50%;margin:0 auto 15px;animation:uvSpin 1s linear infinite;"></div>
      <div>Applying emergency fix...</div>
      <style>@keyframes uvSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
    `;
    
    document.body.appendChild(loadingDiv);
    
    // Fix 1: Force iframe reload with clean slate
    try {
      // Clear all possible storage
      sessionStorage.clear();
      
      // Get the current game URL
      const urlParams = new URLSearchParams(window.location.search);
      const gameParam = urlParams.get('game');
      
      if (gameParam) {
        // Wait a moment then reload
        setTimeout(function() {
          window.location.reload();
        }, 1500);
      } else {
        loadingDiv.innerHTML += '<div style="margin-top:10px;">No game parameter found</div>';
        setTimeout(() => {
          if (document.body.contains(loadingDiv)) {
            document.body.removeChild(loadingDiv);
          }
        }, 3000);
      }
    } catch (e) {
      console.error('Error applying fix:', e);
      loadingDiv.innerHTML += `<div style="margin-top:10px;color:red;">Error: ${e.message}</div>`;
      
      // Remove after delay
      setTimeout(() => {
        if (document.body.contains(loadingDiv)) {
          document.body.removeChild(loadingDiv);
        }
      }, 3000);
    }
  }
  
  // Fix problematic sites automatically
  function detectAndFixProblematicSites() {
    // Wait for page to load
    window.addEventListener('load', function() {
      setTimeout(function() {
        // Check if the page is blank
        const isBlank = !document.body || 
                        document.body.innerHTML.trim().length < 100 ||
                        document.body.innerText.trim().length < 20;
        
        // Check if this is a problematic domain
        let isProblematicDomain = false;
        const currentUrl = window.location.href;
        
        PROBLEM_DOMAINS.forEach(domain => {
          if (currentUrl.includes(domain)) {
            isProblematicDomain = true;
          }
        });
        
        // If blank and problematic domain, show diagnostics
        if (isBlank && isProblematicDomain) {
          console.log('Problematic site detected with blank content. Showing diagnostics.');
          if (!document.getElementById('uv-diagnostics')) {
            createDiagnosticTools();
          }
          setTimeout(toggleDiagnostics, 500);
        }
        
        // Add keyboard shortcut: Ctrl+Shift+F to force retry
        document.addEventListener('keydown', function(event) {
          if (event.ctrlKey && event.shiftKey && event.key === 'F') {
            applyEmergencyFix();
          }
        });
      }, 5000); // Wait 5 seconds after load to check
    });
  }
  
  // Initialize blank screen detection and recovery
  function initBlankScreenRecovery() {
    window.addEventListener('load', function() {
      // Check after a delay to see if content loaded
      setTimeout(function() {
        if (document.body) {
          // Check for content
          const hasContent = document.body.innerText.trim().length > 20 ||
                            document.querySelectorAll('canvas').length > 0 ||
                            document.querySelectorAll('img').length > 0;
          
          if (!hasContent) {
            console.log('[UV Fix] Blank screen detected, adding recovery UI');
            
            // Create recovery UI
            const recoveryDiv = document.createElement('div');
            recoveryDiv.style.position = 'fixed';
            recoveryDiv.style.top = '0';
            recoveryDiv.style.left = '0';
            recoveryDiv.style.width = '100%';
            recoveryDiv.style.height = '100%';
            recoveryDiv.style.display = 'flex';
            recoveryDiv.style.flexDirection = 'column';
            recoveryDiv.style.alignItems = 'center';
            recoveryDiv.style.justifyContent = 'center';
            recoveryDiv.style.background = '#000';
            recoveryDiv.style.color = '#fff';
            recoveryDiv.style.fontFamily = 'Arial, sans-serif';
            recoveryDiv.style.zIndex = '9999';
            
            // Add content
            recoveryDiv.innerHTML = `
              <h2>Game Loading</h2>
              <div style="width:60px;height:60px;border:5px solid rgba(255,255,255,0.3);border-top:5px solid white;border-radius:50%;margin:20px;animation:uvSpin 1s linear infinite;"></div>
              <p>The game is taking longer than expected to load.</p>
              <div style="display:flex;margin-top:20px;">
                <button id="uv-reload-btn" style="padding:10px 20px;background:#4a6ed3;color:white;border:none;margin:0 10px;border-radius:4px;cursor:pointer;">Reload Game</button>
                <button id="uv-diag-btn" style="padding:10px 20px;background:#555;color:white;border:none;margin:0 10px;border-radius:4px;cursor:pointer;">Show Diagnostics</button>
              </div>
              <style>@keyframes uvSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
            `;
            
            document.body.appendChild(recoveryDiv);
            
            // Add event listeners
            document.getElementById('uv-reload-btn').addEventListener('click', function() {
              window.location.reload();
            });
            
            document.getElementById('uv-diag-btn').addEventListener('click', function() {
              toggleDiagnostics();
            });
            
            // Show helpful message for problematic sites
            const currentUrl = window.location.href;
            let isProblemSite = false;
            
            PROBLEM_DOMAINS.forEach(domain => {
              if (currentUrl.includes(domain)) {
                isProblemSite = true;
              }
            });
            
            if (isProblemSite) {
              const helpText = document.createElement('p');
              helpText.style.marginTop = '15px';
              helpText.style.color = '#ff9800';
              helpText.style.maxWidth = '400px';
              helpText.style.textAlign = 'center';
              helpText.innerHTML = 'This site may be slow to load or have compatibility issues. Try reloading or choosing a different game.';
              recoveryDiv.appendChild(helpText);
            }
            
            // Add auto-retry for non-problematic sites
            if (!isProblemSite) {
              const countdownText = document.createElement('p');
              countdownText.style.marginTop = '15px';
              countdownText.style.fontSize = '14px';
              countdownText.style.color = '#aaa';
              recoveryDiv.appendChild(countdownText);
              
              let countdown = 10;
              const countdownInterval = setInterval(function() {
                countdown--;
                countdownText.textContent = `Auto-reloading in ${countdown} seconds...`;
                
                if (countdown <= 0) {
                  clearInterval(countdownInterval);
                  window.location.reload();
                }
              }, 1000);
            }
          }
        }
      }, 8000); // Increased from 5s to 8s
    });
  }
  
  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      detectAndFixProblematicSites();
      initBlankScreenRecovery();
    });
  } else {
    detectAndFixProblematicSites();
    initBlankScreenRecovery();
  }
  
  // Expose utility functions globally
  window.uvFix = {
    toggleDiagnostics: toggleDiagnostics,
    applyEmergencyFix: applyEmergencyFix
  };
  
  // Add CSS for page-specific fixes
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
  
  console.log('UV Fix Helper initialized');
})();
