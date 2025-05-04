// Auto-apply about:blank cloaking on page load
(function() {
    'use strict';
    
    // Only run if not already in iframe and cloaking is enabled
    if (window.self === window.top && localStorage.getItem('cloaking') === 'true') {
        // Get current URL
        const currentUrl = window.location.href;
        
        // Create about:blank window
        const aboutBlankWindow = window.open('about:blank', '_blank');
        
        if (aboutBlankWindow) {
            // Create HTML for about:blank window
            const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>New Tab</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html { width: 100%; height: 100%; overflow: hidden; background: #fff; }
        iframe { position: fixed; top: 0; left: 0; width: 100%; height: 100%; border: none; overflow: auto; }
    </style>
</head>
<body>
    <iframe id="siteFrame" src="${currentUrl}"></iframe>
    <script>
        // Store reference to iframe
        window.siteFrame = document.getElementById('siteFrame');
        
        // Navigation handler for links within iframe
        window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'navigate') {
                window.siteFrame.src = e.data.url;
            }
        });
        
        // Update title when iframe changes
        function updateTitle() {
            try {
                if (window.siteFrame && window.siteFrame.contentDocument) {
                    const iframeTitle = window.siteFrame.contentDocument.title;
                    if (iframeTitle) {
                        document.title = iframeTitle;
                    }
                }
            } catch (e) {
                // Cross-origin error, ignore
            }
        }
        
        // Monitor iframe changes
        setInterval(updateTitle, 1000);
        updateTitle();
    <\/script>
</body>
</html>`;
            
            // Write to about:blank window
            aboutBlankWindow.document.write(htmlContent);
            aboutBlankWindow.document.close();
            
            // Close this window after creating the about:blank window
            window.close();
        }
    }
    
    // Navigation handler when inside iframe
    if (window.self !== window.top) {
        // Override all navigation within iframe
        const originalWindowOpen = window.open;
        
        // Override window.open
        window.open = function(url, target, features) {
            if (target === '_blank' || target === '_top' || !target) {
                window.parent.postMessage({
                    type: 'navigate',
                    url: url
                }, '*');
                return null;
            }
            return originalWindowOpen.call(window, url, target, features);
        };
        
        // Override location methods
        const originalReplace = location.replace;
        const originalAssign = location.assign;
        const originalHref = location.href;
        
        location.replace = function(url) {
            window.parent.postMessage({
                type: 'navigate',
                url: url
            }, '*');
        };
        
        location.assign = function(url) {
            window.parent.postMessage({
                type: 'navigate',
                url: url
            }, '*');
        };
        
        // Override href setting
        Object.defineProperty(location, 'href', {
            get: function() {
                return originalHref;
            },
            set: function(url) {
                window.parent.postMessage({
                    type: 'navigate',
                    url: url
                }, '*');
            }
        });
        
        // Intercept all link clicks
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && link.href) {
                // Check if link should be intercepted
                if (link.target === '_blank' || link.target === '_top' || e.ctrlKey || e.metaKey || e.button === 1) {
                    e.preventDefault();
                    window.parent.postMessage({
                        type: 'navigate',
                        url: link.href
                    }, '*');
                }
            }
        }, true);
        
        // Intercept form submissions
        document.addEventListener('submit', function(e) {
            const form = e.target;
            if (form.target === '_blank' || form.target === '_top') {
                e.preventDefault();
                // Get form action URL
                let actionUrl = form.action || window.location.href;
                // Handle relative URLs
                if (!actionUrl.startsWith('http')) {
                    actionUrl = new URL(actionUrl, window.location.href).href;
                }
                window.parent.postMessage({
                    type: 'navigate',
                    url: actionUrl
                }, '*');
            }
        }, true);
    }
})();
