// Ultra simple about:blank cloaking - opens root URL only
(function() {
    'use strict';
    
    // Only run if not already in iframe and cloaking is enabled
    if (window.self === window.top && localStorage.getItem('cloaking') === 'true') {
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
