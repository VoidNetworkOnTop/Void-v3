// Version display
try {
    document.getElementById("voidVer").innerText = siteConfig.version;
} catch (e) {
    console.error('Error getting/setting void version:', e);
}

// Enhanced cloaking with improved popup handling and complete resource cloning
if (localStorage.getItem('cloaking') === 'true' && location === parent.location) {
    // First check if popups are allowed
    function checkPopupPermission() {
        const testPopup = window.open('', '_blank', 'width=1,height=1');
        if (!testPopup || testPopup.closed) {
            testPopup?.close();
            return false;
        }
        testPopup.close();
        return true;
    }

    if (!checkPopupPermission()) {
        // Show popup permission request
        showPopupPermissionRequest();
    } else {
        // Popups are allowed, initiate cloaking
        initiateCloaking();
    }
}

function showPopupPermissionRequest() {
    // Create styled overlay for popup request
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease-in;
    `;
    
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
        background: #000;
        border: 2px solid #fff;
        border-radius: 10px;
        padding: 40px;
        text-align: center;
        color: #fff;
        max-width: 500px;
        box-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
    `;
    
    messageBox.innerHTML = `
        <h2 style="margin-bottom: 20px; font-size: 1.8rem;">Enable Popup Access</h2>
        <p style="margin-bottom: 30px; line-height: 1.8; font-size: 1.1rem;">
            To use about:blank cloaking, please allow popups for this site.
            <br><br>
            <strong>How to enable popups:</strong><br>
            1. Click the popup block icon in your browser's address bar<br>
            2. Select "Always allow popups from this site"<br>
            3. Refresh the page
        </p>
        <button id="gotItBtn" style="
            background: #fff;
            color: #000;
            border: none;
            padding: 12px 40px;
            border-radius: 30px;
            cursor: pointer;
            font-size: 1.1rem;
            font-weight: bold;
            transition: all 0.3s;
            margin-right: 15px;
        ">Got it</button>
        <button id="disableCloak" style="
            background: transparent;
            color: #fff;
            border: 1px solid #fff;
            padding: 12px 40px;
            border-radius: 30px;
            cursor: pointer;
            font-size: 1.1rem;
            transition: all 0.3s;
        ">Disable Cloaking</button>
    `;
    
    overlay.appendChild(messageBox);
    document.body.appendChild(overlay);
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        #gotItBtn:hover {
            background: #f0f0f0;
            transform: translateY(-2px);
        }
        #disableCloak:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(style);
    
    // Button event listeners
    document.getElementById('gotItBtn').addEventListener('click', () => {
        overlay.remove();
        // Attempt cloaking again
        setTimeout(() => {
            if (checkPopupPermission()) {
                initiateCloaking();
            } else {
                // Still blocked, redirect to settings
                window.location.href = '/settings.html';
            }
        }, 100);
    });
    
    document.getElementById('disableCloak').addEventListener('click', () => {
        localStorage.setItem('cloaking', 'false');
        window.location.reload();
    });
}

function initiateCloaking() {
    // Create about:blank popup
    const popup = open("about:blank", "_blank");
    
    if (!popup || popup.closed) {
        // Fallback if somehow popup still fails
        showPopupPermissionRequest();
        return;
    }
    
    const doc = popup.document;
    
    // Set initial page structure
    doc.documentElement.innerHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Classes</title>
            <link rel="icon" type="image/png" href="https://ssl.gstatic.com/classroom/favicon.png">
            <style>
                body, html { margin: 0; padding: 0; width: 100%; height: 100%; }
                iframe { 
                    position: fixed; 
                    top: 0; 
                    left: 0; 
                    width: 100%; 
                    height: 100%; 
                    border: none; 
                    outline: none; 
                }
            </style>
        </head>
        <body></body>
        </html>
    `;
    
    // Wait for DOM to be ready
    setTimeout(() => {
        // Clone all scripts to the popup
        const scripts = document.getElementsByTagName('script');
        const loadedScripts = [];
        let scriptsLoading = 0;
        
        function checkAllScriptsLoaded() {
            if (scriptsLoading === 0 && loadedScripts.length === scripts.length) {
                // All scripts loaded, create iframe
                createMainIframe(popup);
            }
        }
        
        Array.from(scripts).forEach((script, index) => {
            const newScript = doc.createElement('script');
            scriptsLoading++;
            
            // Copy attributes
            Array.from(script.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            
            if (script.src) {
                // External script - load via src
                newScript.onload = () => {
                    scriptsLoading--;
                    loadedScripts[index] = true;
                    checkAllScriptsLoaded();
                };
                newScript.onerror = () => {
                    scriptsLoading--;
                    loadedScripts[index] = true;
                    checkAllScriptsLoaded();
                };
                newScript.src = script.src;
            } else {
                // Inline script - copy content
                newScript.textContent = script.textContent;
                scriptsLoading--;
                loadedScripts[index] = true;
            }
            
            doc.head.appendChild(newScript);
        });
        
        // Clone stylesheets
        const styles = document.getElementsByTagName('link');
        Array.from(styles).forEach(style => {
            if (style.rel === 'stylesheet') {
                const newStyle = doc.createElement('link');
                Array.from(style.attributes).forEach(attr => {
                    newStyle.setAttribute(attr.name, attr.value);
                });
                doc.head.appendChild(newStyle);
            }
        });
        
        // Clone meta tags
        const metas = document.getElementsByTagName('meta');
        Array.from(metas).forEach(meta => {
            const newMeta = doc.createElement('meta');
            Array.from(meta.attributes).forEach(attr => {
                newMeta.setAttribute(attr.name, attr.value);
            });
            doc.head.appendChild(newMeta);
        });
        
        // If no scripts to load, create iframe immediately
        if (scriptsLoading === 0) {
            createMainIframe(popup);
        }
    }, 100);
}

function createMainIframe(popup) {
    const doc = popup.document;
    const iframe = doc.createElement('iframe');
    const style = iframe.style;
    
    iframe.src = location.href + '?cloaked=true';
    style.position = "fixed";
    style.top = style.bottom = style.left = style.right = 0;
    style.border = style.outline = "none";
    style.width = style.height = "100%";
    
    // Ensure iframe loads properly
    iframe.onload = () => {
        // Pass necessary data to iframe
        try {
            iframe.contentWindow.localStorage.setItem('cloaking', 'active');
            iframe.contentWindow.localStorage.setItem('anticlose', localStorage.getItem('anticlose') || 'false');
            iframe.contentWindow.localStorage.setItem('searchBackend', localStorage.getItem('searchBackend') || 'UV');
            iframe.contentWindow.localStorage.setItem('favicon', localStorage.getItem('favicon') || '');
            iframe.contentWindow.localStorage.setItem('tabTitle', localStorage.getItem('tabTitle') || '');
        } catch (e) {
            console.log('Cross-origin localStorage access blocked');
        }
    };
    
    doc.body.appendChild(iframe);
    
    // Replace current window with classroom.google.com
    setTimeout(() => {
        location.replace("https://classroom.google.com");
    }, 1000);
}

// Add URL parameter check to prevent recursive cloaking
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('cloaked') === 'true') {
    // We're already in the iframe, don't attempt to cloak again
    localStorage.setItem('cloaking', 'active');
}
