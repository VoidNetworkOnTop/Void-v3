// Automatic about:blank cloaking that connects to settings
(function() {
    'use strict';
    
    // Check if we need to apply cloaking
    function checkAndApplyCloaking() {
        // Only run if not already in iframe and cloaking is enabled
        if (window.self === window.top && localStorage.getItem('cloaking') === 'true') {
            // Get the current URL
            const currentUrl = window.location.href;
            
            // Create about:blank window
            const aboutBlankWindow = window.open('about:blank', '_blank');
            
            if (aboutBlankWindow) {
                // Write simple HTML with iframe
                aboutBlankWindow.document.write(`<html><head></head><body style="margin: 0px; height: 100vh;"><iframe src="${currentUrl}" style="border: none; width: 100%; height: 100%; margin: 0px;"></iframe></body></html>`);
                aboutBlankWindow.document.close();
                
                // Close this window
                window.close();
            }
        }
    }
    
    // Check when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndApplyCloaking);
    } else {
        checkAndApplyCloaking();
    }
    
    // Also check on load event
    window.addEventListener('load', checkAndApplyCloaking);
    
    // Listen for storage changes (when settings are updated)
    window.addEventListener('storage', function(e) {
        if (e.key === 'cloaking' && e.newValue === 'true') {
            checkAndApplyCloaking();
        }
    });
})();
