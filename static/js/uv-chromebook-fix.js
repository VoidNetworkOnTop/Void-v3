// UV Chromebook Fix Script - Place in /js/uv-chromebook-fix.js
// Fixes blank/black screen issues on Chromebooks and other devices

(function() {
    // Configuration
    const CONFIG = {
        DEBUG: false,                      // Set to true to enable console logging
        CHROMEBOOK_DETECTION: true,        // Automatically detect Chromebooks
        SERVICE_WORKER_RETRY: 3,           // Number of service worker registration retries
        FORCE_HARDWARE_ACCELERATION: true, // Force hardware acceleration on supported devices
        MAX_LOAD_TIME: 60000,              // Max time to wait for game in ms (60 seconds)
        CONTENT_CHECK_INTERVAL: 300,       // How often to check for content (ms)
        APPLY_CHROMEBOOK_FIXES: true       // Apply specific fixes for Chromebooks
    };
    
    // State tracking
    let state = {
        chromebookDetected: false,
        serviceWorkerRegistered: false,
        loadStartTime: 0,
        uvReady: false,
        fixesApplied: 0
    };
    
    // Logging function
    function log(message, error) {
        if (!CONFIG.DEBUG) return;
        console.log(`[UV Fix] ${message}`);
        if (error) console.error(error);
    }
    
    // Detect Chromebook
    function detectChromebook() {
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        const isChromeOS = /CrOS/.test(navigator.userAgent);
        
        // More specific detection for Chrome OS and Chromebook devices
        state.chromebookDetected = isChromeOS || 
            (isChrome && (/Android/.test(navigator.userAgent) || 
             /Mobile/.test(navigator.userAgent) || 
             !(/Windows/.test(navigator.userAgent) || 
             /Macintosh/.test(navigator.userAgent))));
        
        if (state.chromebookDetected) {
            log('Chromebook environment detected');
            document.documentElement.classList.add('chromebook-environment');
        }
        
        return state.chromebookDetected;
    }
    
    // Add browser-specific CSS fixes
    function addBrowserSpecificCSS() {
        const style = document.createElement('style');
        
        // Base CSS improvements for all browsers
        let css = `
            #gframe {
                transform: translateZ(0);
                backface-visibility: hidden;
                will-change: transform;
                z-index: 2;
            }
            
            /* Prevent white flash during loading */
            .game_container iframe {
                background: #000 !important;
                opacity: 1 !important;
            }
        `;
        
        // Chromebook-specific optimizations
        if (state.chromebookDetected) {
            css += `
                /* Chromebook-specific overrides */
                .chromebook-environment #gframe {
                    transform: translate3d(0,0,0) !important;
                    z-index: 10 !important;
                    position: relative !important;
                }
                
                /* Force hardware acceleration */
                .chromebook-environment .game_container {
                    transform: translateZ(0);
                    will-change: transform, opacity;
                }
            `;
        }
        
        style.textContent = css;
        document.head.appendChild(style);
        log('Applied browser-specific CSS');
    }
    
    // Register UV service worker with retry
    async function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            log('Service workers not supported');
            return false;
        }
        
        // Check if we're using HTTPS or localhost
        if (location.protocol !== 'https:' && 
            location.hostname !== 'localhost' && 
            location.hostname !== '127.0.0.1') {
            log('Service worker requires HTTPS (except on localhost)');
            return false;
        }
        
        // Check if UV service worker is already registered
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            const uvRegistered = registrations.some(reg => 
                (reg.scope.includes('/uv/') || 
                (reg.active && reg.active.scriptURL.includes('uv.sw.js')))
            );
            
            if (uvRegistered) {
                log('UV service worker already registered');
                state.serviceWorkerRegistered = true;
                return true;
            }
        } catch (error) {
            log('Error checking service worker registrations', error);
        }
        
        // Try to register the service worker
        for (let attempt = 1; attempt <= CONFIG.SERVICE_WORKER_RETRY; attempt++) {
            try {
                log(`Registering UV service worker (attempt ${attempt}/${CONFIG.SERVICE_WORKER_RETRY})`);
                
                const registration = await navigator.serviceWorker.register('/uv/sw.js', {
                    scope: '/uv/',
                    updateViaCache: 'none'
                });
                
                // Wait for it to activate
                if (registration.installing) {
                    await new Promise(resolve => {
                        registration.installing.addEventListener('statechange', e => {
                            if (e.target.state === 'activated') resolve();
                        });
                    });
                }
                
                log('UV service worker registered successfully');
                state.serviceWorkerRegistered = true;
                return true;
            } catch (error) {
                log(`Service worker registration failed (attempt ${attempt})`, error);
                
                if (attempt < CONFIG.SERVICE_WORKER_RETRY) {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        
        log('Failed to register service worker after all attempts');
        return false;
    }
    
    // Apply Chromebook-specific fixes
    function applyChromebookFixes() {
        if (!state.chromebookDetected || !CONFIG.APPLY_CHROMEBOOK_FIXES) return;
        
        // Find the game iframe
        const iframe = document.getElementById('gframe');
        if (!iframe) return;
        
        try {
            // Force hardware acceleration
            iframe.style.transform = 'translate3d(0,0,0)';
            iframe.style.backfaceVisibility = 'hidden';
            iframe.style.willChange = 'transform';
            
            // Sometimes setting z-index higher helps
            iframe.style.position = 'relative';
            iframe.style.zIndex = '10';
            
            // Force a repaint
            void iframe.offsetHeight;
            
            // Force iframe to take focus
            setTimeout(() => {
                try {
                    iframe.focus();
                } catch (e) {
                    log('Error focusing iframe', e);
                }
            }, 1000);
            
            state.fixesApplied++;
            log(`Applied Chromebook fixes (${state.fixesApplied})`);
        } catch (error) {
            log('Error applying Chromebook fixes', error);
        }
    }
    
    // Monitor the iframe for content and apply fixes
    function monitorIframeContent() {
        const iframe = document.getElementById('gframe');
        if (!iframe) return;
        
        let checkCount = 0;
        const maxChecks = 100; // 30 seconds at 300ms interval
        
        const checkInterval = setInterval(() => {
            checkCount++;
            
            try {
                // Skip if iframe has no source
                if (!iframe.src || iframe.src === 'about:blank') return;
                
                // Try to access content (may throw CORS error)
                let hasContent = false;
                try {
                    hasContent = iframe.contentWindow && 
                        iframe.contentWindow.document && 
                        iframe.contentWindow.document.body;
                } catch (e) {
                    // CORS error expected
                }
                
                // If we're on a Chromebook, apply fixes periodically
                if (state.chromebookDetected && checkCount % 10 === 0) {
                    applyChromebookFixes();
                }
                
                // Check if we've been running too long
                if (checkCount >= maxChecks) {
                    clearInterval(checkInterval);
                    log('Maximum content checks reached, stopping monitoring');
                }
            } catch (error) {
                log('Error checking iframe content', error);
            }
        }, CONFIG.CONTENT_CHECK_INTERVAL);
        
        // Set up a one-time listener for iframe load
        iframe.addEventListener('load', function onLoad() {
            log('Iframe loaded event fired');
            
            // Apply fixes after load
            setTimeout(() => {
                applyChromebookFixes();
                
                // Force a resize event to help trigger game rendering
                try {
                    window.dispatchEvent(new Event('resize'));
                    if (iframe.contentWindow) {
                        iframe.contentWindow.dispatchEvent(new Event('resize'));
                    }
                } catch (e) {
                    log('Error dispatching resize', e);
                }
            }, 1000);
            
            // Remove the listener after it fires once
            iframe.removeEventListener('load', onLoad);
        });
    }
    
    // Function to fix rendering that can be called from outside
    function fixGameRendering() {
        // Apply current fixes
        applyChromebookFixes();
        
        // Attempt to force visibility on game elements
        const iframe = document.getElementById('gframe');
        if (iframe && iframe.contentWindow && iframe.contentDocument) {
            try {
                // List of common game selectors
                const gameSelectors = [
                    'canvas', 
                    '#unity-container', 
                    '#gameContainer',
                    '[id*="unity"]', 
                    '[id*="game"]', 
                    '[id*="canvas"]',
                    '.unity-desktop',
                    '.webgl-content'
                ];
                
                // Try to make these elements visible
                gameSelectors.forEach(selector => {
                    try {
                        const elements = iframe.contentDocument.querySelectorAll(selector);
                        elements.forEach(el => {
                            el.style.display = 'block';
                            el.style.visibility = 'visible';
                            el.style.opacity = '1';
                        });
                    } catch (e) {
                        // Ignore CORS errors
                    }
                });
                
                // Try resize events
                try {
                    iframe.contentWindow.dispatchEvent(new Event('resize'));
                } catch (e) {
                    // Ignore CORS errors
                }
            } catch (e) {
                log('Error fixing game rendering', e);
            }
        }
    }
    
    // Initialize the fix
    async function initialize() {
        log('Initializing UV Chromebook fix');
        state.loadStartTime = Date.now();
        
        // Detect environment
        if (CONFIG.CHROMEBOOK_DETECTION) {
            detectChromebook();
        }
        
        // Add CSS fixes
        addBrowserSpecificCSS();
        
        // Register service worker
        await registerServiceWorker();
        
        // Set up monitoring
        monitorIframeContent();
        
        // Apply initial fixes
        setTimeout(() => {
            applyChromebookFixes();
        }, 1000);
        
        log('UV Chromebook fix initialized');
    }
    
    // Run on DOMContentLoaded or immediately if already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Setup game startup monitoring
    window.addEventListener('load', () => {
        // Apply fixes again after window load
        setTimeout(applyChromebookFixes, 2000);
        setTimeout(applyChromebookFixes, 5000);
    });
    
    // Expose utilities for external use
    window.uvChromebookFix = {
        applyChromebookFixes,
        fixGameRendering,
        state,
        CONFIG
    };
})();
