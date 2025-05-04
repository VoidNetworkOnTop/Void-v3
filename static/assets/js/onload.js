// Auto-apply about:blank cloaking on page load
(function() {
    'use strict';
    
    // Check if we need to auto-enable cloaking on page load
    function checkAndApplyCloaking() {
        // Only auto-activate cloaking if:
        // 1. Not already inside an iframe
        // 2. Cloaking is enabled in localStorage
        if (window.self === window.top && localStorage.getItem('cloaking') === 'true') {
            // Check if toggleCloaking function exists
            if (typeof toggleCloaking === 'function') {
                // Don't show message for automatic activation
                toggleCloaking(true);
            } else {
                // If toggleCloaking isn't available yet, retry after a short delay
                setTimeout(checkAndApplyCloaking, 100);
            }
        }
    }
    
    // Execute when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndApplyCloaking);
    } else {
        // DOM is already ready
        checkAndApplyCloaking();
    }
    
    // Also execute on window load as a fallback
    window.addEventListener('load', function() {
        // Only if not already executed
        if (window.self === window.top && localStorage.getItem('cloaking') === 'true') {
            checkAndApplyCloaking();
        }
    });
})();
