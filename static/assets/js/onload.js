// Ultra simple about:blank cloaking - no navigation interception
(function() {
    'use strict';
    
    // Only run if not already in iframe and cloaking is enabled
    if (window.self === window.top && localStorage.getItem('cloaking') === 'true') {
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
            window.close();
        }
    }
})();
