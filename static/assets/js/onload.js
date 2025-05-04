// Ultra simple about:blank cloaking - prevents nested windows
(function() {
    'use strict';
    
    // Check if we need to apply cloaking
    function shouldApplyCloaking() {
        // Don't apply if:
        // 1. Already in an iframe
        // 2. URL starts with about:blank (already cloaked)
        // 3. Cloaking is not enabled
        if (window.self !== window.top || 
            window.location.href.startsWith('about:blank') || 
            localStorage.getItem('cloaking') !== 'true') {
            return false;
        }
        return true;
    }
    
    // Apply cloaking if needed
    if (shouldApplyCloaking()) {
        const currentUrl = window.location.href;
        const aboutBlankWindow = window.open('about:blank', '_blank');
        
        if (aboutBlankWindow) {
            aboutBlankWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <title>New Tab</title>
    <style>
        * { margin: 0; padding: 0; }
        body, html { width: 100%; height: 100%; overflow: hidden; }
        iframe { position: fixed; top: 0; left: 0; width: 100%; height: 100%; border: none; }
    </style>
</head>
<body>
    <iframe src="${currentUrl}"></iframe>
</body>
</html>`);
            aboutBlankWindow.document.close();
            
            // Small delay to ensure the window is ready before closing this one
            setTimeout(() => {
                window.close();
            }, 100);
        }
    }
})();
