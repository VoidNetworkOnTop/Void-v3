// Ultra simple about:blank cloaking - opens root URL only
(function() {
    'use strict';
    
    // Only run if we should apply cloaking
    function shouldApplyCloaking() {
        // Don't apply if:
        // 1. Already in an iframe
        // 2. URL starts with about:blank (already cloaked)
        // 3. Cloaking is not enabled
        // 4. Already processed (prevent multiple runs)
        if (window.self !== window.top || 
            window.location.href.startsWith('about:blank') || 
            localStorage.getItem('cloaking') !== 'true' ||
            sessionStorage.getItem('cloaking_processed') === 'true') {
            return false;
        }
        
        // Mark as processed for this session
        sessionStorage.setItem('cloaking_processed', 'true');
        return true;
    }
    
    // Apply cloaking if needed
    if (shouldApplyCloaking()) {
        // Get the root URL (protocol + domain)
        const rootUrl = window.location.origin;
        
        // Create about:blank window
        const aboutBlankWindow = window.open('about:blank', '_blank');
        
        if (aboutBlankWindow) {
            // Write simple HTML with iframe pointing to root
            aboutBlankWindow.document.write(`<html><head></head><body style="margin: 0px; height: 100vh;"><iframe src="${rootUrl}" style="border: none; width: 100%; height: 100%; margin: 0px;"></iframe></body></html>`);
            aboutBlankWindow.document.close();
            
            // Close the current window
            window.close();
        }
    }
})();
