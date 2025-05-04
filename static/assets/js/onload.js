// Version display
try {
    document.getElementById("voidVer").innerText = siteConfig.version;
} catch (e) {
    console.error('Error getting/setting void version:', e);
}

// About:blank cloaking handler for root page
window.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('cloaking') === 'true' && window.location.pathname === '/') {
        initiateCloaking();
    }
});

function initiateCloaking() {
    // Don't cloak if we're already in a popup or iframe
    if (window.opener || window !== window.top) {
        return;
    }
    
    // Try to create about:blank popup
    const popup = open("about:blank", "_blank");
    
    if (!popup || popup.closed) {
        // Popups are blocked - show permission request
        showPopupPermissionRequest();
    } else {
        // Popups are allowed - setup minimal about:blank with iframe
        const doc = popup.document;
        doc.open();
        doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Classes</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        html, body {
            height: 100%;
            width: 100%;
            overflow: hidden;
        }
        .fullscreen-iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
    </style>
</head>
<body>
    <iframe class="fullscreen-iframe" src="${window.location.origin}/"></iframe>
    
    <script>
        // Intercept all navigation to keep it within about:blank
        const iframe = document.querySelector('.fullscreen-iframe');
        
        iframe.onload = function() {
            try {
                const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
                
                // Intercept all clicks on links
                iframeDocument.addEventListener('click', function(e) {
                    const link = e.target.closest('a');
                    if (link && link.href) {
                        // Check if it's a relative link or same origin
                        const url = new URL(link.href);
                        const currentOrigin = new URL(iframe.src).origin;
                        
                        if (url.origin === currentOrigin || link.href.startsWith('/')) {
                            e.preventDefault();
                            iframe.src = link.href;
                        }
                        // External links will open normally in about:blank
                    }
                });
                
                // Intercept form submissions
                iframeDocument.addEventListener('submit', function(e) {
                    const form = e.target;
                    if (form.tagName === 'FORM') {
                        const url = new URL(form.action || iframe.src);
                        const currentOrigin = new URL(iframe.src).origin;
                        
                        if (url.origin === currentOrigin) {
                            e.preventDefault();
                            if (form.method.toLowerCase() === 'get') {
                                const formData = new FormData(form);
                                const params = new URLSearchParams(formData);
                                iframe.src = form.action + '?' + params.toString();
                            } else {
                                form.target = iframe.name;
                                form.submit();
                            }
                        }
                    }
                });
            } catch (e) {
                // Cross-origin restrictions may prevent access
                console.log('Cross-origin access blocked');
            }
        };
        
        // Keep navigation within iframe
        window.addEventListener('popstate', function() {
            // Prevent back/forward navigation from leaving about:blank
            history.pushState(null, '', window.location.href);
        });
    </script>
</body>
</html>`);
        doc.close();
        
        // Redirect original tab to Google Classroom
        setTimeout(() => {
            window.location.replace("https://classroom.google.com");
        }, 500); // Slightly longer delay to ensure iframe loads
    }
}

function showPopupPermissionRequest() {
    // Create fullscreen overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease-in-out;
    `;
    
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
        background: #000;
        border: 2px solid #fff;
        border-radius: 15px;
        padding: 40px;
        text-align: center;
        color: #fff;
        max-width: 600px;
        width: 90%;
        box-shadow: 0 0 50px rgba(255, 255, 255, 0.2);
    `;
    
    messageBox.innerHTML = `
        <h2 style="margin-bottom: 20px; font-size: 2rem; font-weight: bold;">
            🔒 Enable Popup Access
        </h2>
        <p style="margin-bottom: 30px; line-height: 1.8; font-size: 1.2rem;">
            This site needs permission to open popups for about:blank cloaking.
        </p>
        <div style="margin-bottom: 30px; text-align: left; background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px;">
            <p style="font-size: 1.1rem; margin-bottom: 10px;">
                <strong>How to allow popups:</strong>
            </p>
            <ol style="padding-left: 20px; line-height: 1.6;">
                <li>Look for a popup blocked icon 🚫 in your browser's address bar</li>
                <li>Click on it and select "Always allow popups from this site"</li>
                <li>Click the button below to continue</li>
            </ol>
        </div>
        <button id="tryAgainBtn" style="
            background: #fff;
            color: #000;
            border: none;
            padding: 15px 50px;
            border-radius: 50px;
            cursor: pointer;
            font-size: 1.2rem;
            font-weight: bold;
            transition: all 0.3s ease;
            margin-right: 20px;
        ">Try Again</button>
        <button id="disableCloak" style="
            background: transparent;
            color: #fff;
            border: 2px solid #fff;
            padding: 15px 50px;
            border-radius: 50px;
            cursor: pointer;
            font-size: 1.2rem;
            transition: all 0.3s ease;
        ">Disable Cloaking</button>
    `;
    
    overlay.appendChild(messageBox);
    document.body.appendChild(overlay);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        #tryAgainBtn:hover {
            background: #f5f5f5;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        #disableCloak:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(style);
    
    // Event listeners
    document.getElementById('tryAgainBtn').addEventListener('click', () => {
        overlay.remove();
        initiateCloaking();
    });
    
    document.getElementById('disableCloak').addEventListener('click', () => {
        localStorage.setItem('cloaking', 'false');
        window.location.reload();
    });
}
