try {
    document.getElementById("voidVer").innerText = siteConfig.version
}
catch (e) {
    console.error('Error getting/setting void version:', e);
}

// Enhanced cloaking with popup detection
if (localStorage.getItem('cloaking') === 'true' && location === parent.location) {
    const popup = open("about:blank", "_blank");
    if (!popup || popup.closed) {
        // Create styled alert instead of browser alert
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
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
            padding: 30px;
            text-align: center;
            color: #fff;
            max-width: 400px;
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        `;
        
        messageBox.innerHTML = `
            <h2 style="margin-bottom: 20px; font-size: 1.5rem;">Popups Blocked</h2>
            <p style="margin-bottom: 20px; line-height: 1.5;">
                Please allow popups and redirects for this site to enable about:blank cloaking.
                <br><br>
                You will be redirected to settings in 5 seconds...
            </p>
            <button id="goToSettings" style="
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
                border: 1px solid #fff;
                padding: 10px 30px;
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.3s;
            ">Go to Settings</button>
        `;
        
        alertDiv.appendChild(messageBox);
        document.body.appendChild(alertDiv);
        
        // Add animation style
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Add event listener for manual redirect
        document.getElementById('goToSettings').addEventListener('click', () => {
            window.location.href = '/settings.html';
        });
        
        // Auto-redirect after 5 seconds
        setTimeout(() => {
            window.location.href = '/settings.html';
        }, 5000);
    } else {
        // Popup allowed, continue with cloaking
        const doc = popup.document;
        let icon = doc.createElement("link")
        icon.rel = "icon";
        icon.type = "image/png"
        icon.href = "https://ssl.gstatic.com/classroom/favicon.png"
        iframe = popup.document.createElement("iframe")
        const style = iframe.style 
        popup.document.title = "Classes"
        iframe.src = location.href
        style.position = "fixed";
        style.top = style.bottom = style.left = style.right = 0;
        style.border = style.outline = "none";
        style.width = style.height = "100%";
        doc.head.appendChild(icon);
        doc.body.appendChild(iframe);
        location.replace("https://classroom.google.com")
    }
}
