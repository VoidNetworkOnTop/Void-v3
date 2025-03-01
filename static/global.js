document.addEventListener("keydown", function(e) {
    if ((e.altKey && e.key == "t")) {
        if (document.getElementById("terminal") != null) {
            document.getElementById("terminal").remove()
            return;
        }
        if (document.getElementById("terminal") == null) {
            renderFile("/terminal.html", "50%", "50%", "terminal")
            return
        }
    }
    
    // Add Panic Button functionality
    if ((e.altKey && e.key == "p")) {
        // Trigger panic mode - clear everything and close tab
        triggerPanicMode();
    }
    
    // Add Fullscreen toggle
    if ((e.altKey && e.key == "f")) {
        toggleFullscreen();
    }
})

function renderFile(url, width, height, id) { // Renders URL in a centered iframe w/ w&h set
    let fr = document.createElement("iframe")
    fr.src = url 
    fr.width = width 
    fr.height = height
    fr.id = id
    fr.style.transform = "translate(-50%, -50%)"
    fr.style.position = "absolute"
    fr.style.top = "50%"
    fr.style.left = "50%"
    fr.style.opacity = 0.9
    document.body.appendChild(fr)
}

function deleteItem(id) {
    document.getElementById(id).remove()
}

function loadHTML(url, elementId) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response threw an error  ' + response.statusText);
            }
            return response.text();
        })
        .then(data => {
            document.getElementById(elementId).innerHTML = data;
        })
        .catch(error => console.error('Error loading HTML:', error));
}

// Panic mode function
function triggerPanicMode() {
    try {
        // Clear localStorage if auto-clear is enabled
        if (localStorage.getItem('autoclear') === 'true') {
            localStorage.clear();
        }
        
        // Redirect to a safe site
        window.location.href = "https://classroom.google.com";
    } catch (error) {
        console.error("Error in panic mode:", error);
        window.close();
    }
}

// Fullscreen toggle
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Settings Sync - Apply all stored settings to the current page
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing Void Network Settings");
    
    // Initialize theme
    initializeTheme();
    
    // Apply favicon/title changes
    applyFaviconAndTitle();
    
    // Apply search engine preference
    const searchBackend = localStorage.getItem('searchBackend') || 'UV';
    window.currentSearchEngine = searchBackend;
    
    // Check and apply Anti-close protection
    if (localStorage.getItem('anticlose') === 'true') {
        applyAntiClose();
    }
    
    // Initialize auto-clear if enabled
    if (localStorage.getItem('autoclear') === 'true') {
        // Add event listener for tab close
        window.addEventListener('beforeunload', clearDataOnExit);
    }
    
    // Check and apply About:blank cloaking (must run last)
    // Only apply on page load if auto-apply is enabled
    if (localStorage.getItem('autoapplycloaking') === 'true') {
        applyCloakingMethod();
    }
    
    console.log("Void Network Settings Applied");
});

// Initialize theme
function initializeTheme() {
    const primary = localStorage.getItem('theme_primary') || '#000000';
    const secondary = localStorage.getItem('theme_secondary') || '#1a1a1a';
    const accent = localStorage.getItem('theme_accent') || '#ffffff';
    
    document.documentElement.style.setProperty('--primary-color', primary);
    document.documentElement.style.setProperty('--secondary-color', secondary);
    document.documentElement.style.setProperty('--accent-color', accent);
    document.documentElement.style.setProperty('--highlight-color', 'rgba(255, 255, 255, 0.1)');
    document.documentElement.style.setProperty('--text-color', accent);
    document.documentElement.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.6)');
    
    console.log("Theme initialized with:", {primary, secondary, accent});
}

// Apply favicon and title settings
function applyFaviconAndTitle() {
    const savedIcon = localStorage.getItem('favicon');
    const savedTitle = localStorage.getItem('tabTitle');
    
    if (savedIcon) {
        const faviconElement = document.querySelector("link[rel='icon']") || document.createElement('link');
        faviconElement.rel = 'icon';
        faviconElement.href = savedIcon;
        document.head.appendChild(faviconElement);
        console.log("Applied favicon:", savedIcon);
    }
    
    if (savedTitle) {
        document.title = savedTitle;
        console.log("Applied title:", savedTitle);
    }
}

// Apply anti-close protection
function applyAntiClose() {
    window.addEventListener('beforeunload', function(e) {
        // Only activate if not navigating through our own site
        if (!e.target.location.href.includes("redirect")) {
            e.preventDefault();
            e.returnValue = 'Leave site? Changes you made may not be saved.';
            return e.returnValue;
        }
    });
    console.log("Anti-close protection enabled");
}

// Clear data on exit
function clearDataOnExit() {
    try {
        // Clear all localStorage items except for settings
        const keysToKeep = [
            'theme_primary', 'theme_secondary', 'theme_accent', 'theme_name',
            'favicon', 'tabTitle', 'cloakingMethod', 'searchBackend',
            'anticlose', 'autoclear', 'autoapplycloaking',
        ];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        }
        
        console.log("Data cleared on exit");
    } catch (error) {
        console.error("Error clearing data:", error);
    }
}

// Function to apply the selected cloaking method
function applyCloakingMethod() {
    // Don't run if we're in an iframe
    if (window.self !== window.top) {
        console.log("Skipping cloaking in iframe");
        return;
    }
    
    const cloakingMethod = localStorage.getItem('cloakingMethod') || 'disabled';
    console.log("Applying cloaking method:", cloakingMethod);
    
    // Skip if cloaking is disabled or we're already in a cloaked page
    if (cloakingMethod === 'disabled' || 
        (cloakingMethod === 'about:blank' && window.location.href === 'about:blank') ||
        (cloakingMethod === 'data URL' && window.location.href.startsWith('data:'))) {
        console.log("Skipping cloaking: already applied or disabled");
        return;
    }
    
    try {
        switch (cloakingMethod) {
            case 'about:blank':
                // Simplified about:blank approach
                const tab = window.open('about:blank', '_blank');
                if (tab) {
                    console.log("About:blank window opened");
                    
                    // Get all HTML content
                    const html = document.documentElement.outerHTML;
                    
                    // Write to the new tab
                    tab.document.write(html);
                    tab.document.close();
                    
                    // Apply scripts manually to ensure they run
                    const scripts = document.querySelectorAll('script');
                    scripts.forEach(oldScript => {
                        if (oldScript.src) {
                            const newScript = tab.document.createElement('script');
                            newScript.src = oldScript.src;
                            tab.document.head.appendChild(newScript);
                        }
                    });
                    
                    // Close current tab after a short delay
                    setTimeout(() => {
                        window.location.href = 'about:blank';
                    }, 300);
                } else {
                    console.error("Failed to open about:blank window - check popup blocker");
                    alert("Cloaking failed: Popup blocked. Please allow popups for this site.");
                }
                break;
                
            case 'data URL':
                console.log("Applying data URL cloaking");
                // Get document type if available
                const doctype = document.doctype ? 
                    new XMLSerializer().serializeToString(document.doctype) : '';
                
                // Get HTML content
                const htmlContent = doctype + document.documentElement.outerHTML;
                
                // Create data URL and navigate to it
                const dataUrl = 'data:text/html;charset=utf-8,' + 
                    encodeURIComponent(htmlContent);
                window.location.href = dataUrl;
                break;
                
            case 'embedded':
                console.log("Applying embedded iframe cloaking");
                
                // More reliable embedded method
                if (!window.frameElement) {
                    // Save the original content
                    const originalContent = document.documentElement.outerHTML;
                    
                    // Clear the page and create a Google Classroom-like facade
                    document.head.innerHTML = `
                        <title>Google Classroom</title>
                        <link rel="icon" href="https://ssl.gstatic.com/classroom/favicon.png">
                        <style>
                            body { 
                                font-family: 'Google Sans', Arial, sans-serif; 
                                background-color: #f5f5f5; 
                                margin: 0; 
                                padding: 0; 
                                color: #3c4043;
                            }
                            .header {
                                background-color: #1a73e8;
                                height: 64px;
                                display: flex;
                                align-items: center;
                                padding: 0 24px;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                            }
                            .header img {
                                margin-right: 16px;
                            }
                            .header h1 {
                                color: white;
                                font-weight: 400;
                                font-size: 22px;
                                margin: 0;
                            }
                            .content {
                                max-width: 1000px;
                                margin: 40px auto;
                                padding: 0 24px;
                                text-align: center;
                            }
                            .loader {
                                width: 100%;
                                max-width: 600px;
                                margin: 40px auto;
                                background-color: #e0e0e0;
                                height: 4px;
                                border-radius: 4px;
                                overflow: hidden;
                                position: relative;
                            }
                            .loader-bar {
                                height: 100%;
                                width: 0%;
                                background-color: #1a73e8;
                                position: absolute;
                                animation: loading 2s infinite ease-in-out;
                            }
                            @keyframes loading {
                                0% { width: 0%; left: 0; }
                                50% { width: 50%; left: 25%; }
                                100% { width: 0%; left: 100%; }
                            }
                            #content-frame {
                                display: none;
                                position: fixed;
                                top: 0;
                                left: 0;
                                width: 100%;
                                height: 100%;
                                border: none;
                                z-index: 9999;
                            }
                        </style>
                    `;
                    
                    document.body.innerHTML = `
                        <div class="header">
                            <img src="https://ssl.gstatic.com/classroom/logo_square_48.svg" alt="Google Classroom">
                            <h1>Classroom</h1>
                        </div>
                        <div class="content">
                            <h2>Loading your classes...</h2>
                            <p>Please wait while we retrieve your Classroom data.</p>
                            <div class="loader">
                                <div class="loader-bar" id="fake-progress-bar"></div>
                            </div>
                        </div>
                        <iframe id="content-frame"></iframe>
                    `;
                    
                    // Show the actual content after a short delay
                    setTimeout(() => {
                        const iframe = document.getElementById('content-frame');
                        if (iframe) {
                            iframe.style.display = 'block';
                            const iframeDoc = iframe.contentWindow.document;
                            iframeDoc.open();
                            iframeDoc.write(originalContent);
                            iframeDoc.close();
                            
                            // Hide the facade
                            document.querySelector('.header').style.display = 'none';
                            document.querySelector('.content').style.display = 'none';
                        }
                    }, 2500);
                }
                break;
        }
    } catch (error) {
        console.error('Error applying cloaking method:', error);
        alert('Cloaking failed: ' + error.message + '\n\nTry a different method in Settings.');
    }
}

// Add custom favicon handler if not already defined
if (typeof changeFavicon !== 'function') {
    window.changeFavicon = function(iconURL, pageTitle) {
        console.log("Changing favicon to:", iconURL);
        
        // Change favicon
        const faviconElement = document.querySelector("link[rel='icon']") || document.createElement('link');
        faviconElement.rel = 'icon';
        faviconElement.href = iconURL;
        document.head.appendChild(faviconElement);
        
        // Change title
        if (pageTitle) {
            document.title = pageTitle;
            console.log("Changed title to:", pageTitle);
        }
        
        // Save preferences
        localStorage.setItem('favicon', iconURL);
        localStorage.setItem('tabTitle', pageTitle || document.title);
    }
}

// Toggle cloaking function for use in settings
function toggleCloaking() {
    // This function is called by the checkbox in settings
    const checkbox = document.getElementById("cbox_cloaking");
    
    if (checkbox && checkbox.checked) {
        // If checked and cloaking method is not set, default to about:blank
        if (!localStorage.getItem('cloakingMethod') || localStorage.getItem('cloakingMethod') === 'disabled') {
            localStorage.setItem('cloakingMethod', 'about:blank');
        }
        localStorage.setItem('cloaking', 'true');
        console.log("Cloaking enabled");
    } else {
        localStorage.setItem('cloakingMethod', 'disabled');
        localStorage.setItem('cloaking', 'false');
        console.log("Cloaking disabled");
    }
}

// Toggle auto-clear data function
function toggleAutoClear() {
    const checkbox = document.getElementById("cbox_autoclear");
    
    if (checkbox) {
        localStorage.setItem('autoclear', checkbox.checked ? 'true' : 'false');
        console.log("Auto-clear " + (checkbox.checked ? "enabled" : "disabled"));
        
        // Add or remove event listener based on checkbox state
        if (checkbox.checked) {
            window.addEventListener('beforeunload', clearDataOnExit);
        } else {
            window.removeEventListener('beforeunload', clearDataOnExit);
        }
    }
}

// Load shortcuts in the UI
function loadShortcutsMenu() {
    const shortcutsContainer = document.getElementById('shortcutsContainer');
    if (!shortcutsContainer) return;
    
    try {
        const shortcuts = JSON.parse(localStorage.getItem("shortcuts") || "[]");
        
        if (shortcuts.length === 0) {
            shortcutsContainer.innerHTML = '<p>No shortcuts available</p>';
            return;
        }
        
        shortcutsContainer.innerHTML = '';
        
        shortcuts.forEach((shortcut, index) => {
            const shortcutElement = document.createElement('a');
            shortcutElement.href = shortcut.url;
            shortcutElement.className = 'shortcut-item';
            shortcutElement.innerHTML = `
                <span>${shortcut.name}</span>
            `;
            shortcutsContainer.appendChild(shortcutElement);
        });
        
        console.log("Loaded shortcuts menu");
    } catch (error) {
        console.error("Error loading shortcuts:", error);
        shortcutsContainer.innerHTML = '<p>Error loading shortcuts</p>';
    }
}

// Register service worker for offline support if available
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
