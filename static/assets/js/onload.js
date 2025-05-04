// Version display
try {
    document.getElementById("voidVer").innerText = siteConfig.version;
} catch (e) {
    console.error('Error getting/setting void version:', e);
}

// Simple about:blank cloaking with iframe
if (localStorage.getItem('cloaking') === 'true' && location === parent.location) {
    // Don't cloak if we're already in an iframe
    if (window.location !== window.parent.location) {
        return;
    }
    
    // Try to open popup
    const popup = open("about:blank", "_blank");
    
    if (!popup || popup.closed) {
        // Show popup permission request
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
            <h2 style="margin-bottom: 20px; font-size: 1.8rem;">Allow Popups to Continue</h2>
            <p style="margin-bottom: 30px; line-height: 1.8; font-size: 1.1rem;">
                This site needs popup permission for about:blank cloaking.
                <br><br>
                <strong>To enable popups:</strong><br>
                1. Click the popup icon in your address bar<br>
                2. Allow popups for this site<br>
                3. Click "Continue" below
            </p>
            <button id="continueBtn" style="
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
            ">Continue</button>
            <button id="cancelBtn" style="
                background: transparent;
                color: #fff;
                border: 1px solid #fff;
                padding: 12px 40px;
                border-radius: 30px;
                cursor: pointer;
                font-size: 1.1rem;
                transition: all 0.3s;
            ">Cancel</button>
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
            #continueBtn:hover {
                background: #f0f0f0;
                transform: translateY(-2px);
            }
            #cancelBtn:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(style);
        
        // Continue button - reload page to try again
        document.getElementById('continueBtn').addEventListener('click', () => {
            window.location.reload();
        });
        
        // Cancel button - disable cloaking
        document.getElementById('cancelBtn').addEventListener('click', () => {
            localStorage.setItem('cloaking', 'false');
            window.location.reload();
        });
    } else {
        // Popup successful - create iframe with current URL
        const doc = popup.document;
        
        // Set title and favicon
        doc.title = "Classes";
        
        // Add favicon
        const favicon = doc.createElement("link");
        favicon.rel = "icon";
        favicon.type = "image/png";
        favicon.href = "https://ssl.gstatic.com/classroom/favicon.png";
        doc.head.appendChild(favicon);
        
        // Create fullscreen iframe with current URL
        const iframe = doc.createElement("iframe");
        iframe.src = window.location.href;
        iframe.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
            outline: none;
        `;
        
        doc.body.appendChild(iframe);
        
        // Redirect original tab to Google Classroom
        setTimeout(() => {
            window.location.replace("https://classroom.google.com");
        }, 100);
    }
}
