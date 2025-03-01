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
    // Apply favicon/title changes
    const savedIcon = localStorage.getItem('favicon');
    const savedTitle = localStorage.getItem('tabTitle');
    
    if (savedIcon) {
        const faviconElement = document.querySelector("link[rel='icon']") || document.createElement('link');
        faviconElement.rel = 'icon';
        faviconElement.href = savedIcon;
        document.head.appendChild(faviconElement);
    }
    
    if (savedTitle) {
        document.title = savedTitle;
    }
    
    // Apply theme colors if set
    const primaryColor = localStorage.getItem('theme_primary');
    const secondaryColor = localStorage.getItem('theme_secondary');
    const accentColor = localStorage.getItem('theme_accent');
    
    if (primaryColor) {
        document.documentElement.style.setProperty('--primary-color', primaryColor);
    }
    
    if (secondaryColor) {
        document.documentElement.style.setProperty('--secondary-color', secondaryColor);
    }
    
    if (accentColor) {
        document.documentElement.style.setProperty('--accent-color', accentColor);
    }
    
    // Apply search engine preference
    const searchBackend = localStorage.getItem('searchBackend') || 'UV';
    window.currentSearchEngine = searchBackend;
    
    // Check and apply Anti-close protection
    if (localStorage.getItem('anticlose') === 'true') {
        window.addEventListener('beforeunload', function(e) {
            // Only activate if not navigating through our own site
            if (!e.target.location.href.includes("redirect")) {
                e.preventDefault();
                e.returnValue = 'Leave site? Changes you made may not be saved.';
                return e.returnValue;
            }
        });
    }
    
    // Check and apply About:blank cloaking (must run last)
    applyCloakingMethod();
});

// Function to apply the selected cloaking method
function applyCloakingMethod() {
    // Don't run if we're in an iframe
    if (window.self !== window.top) return;
    
    const cloakingMethod = localStorage.getItem('cloakingMethod') || 'disabled';
    
    // Skip if cloaking is disabled or we're already in a cloaked page
    if (cloakingMethod === 'disabled' || 
        (cloakingMethod === 'about:blank' && window.location.href === 'about:blank') ||
        (cloakingMethod === 'data URL' && window.location.href.startsWith('data:'))) {
        return;
    }
    
    try {
        switch (cloakingMethod) {
            case 'about:blank':
                // Open about:blank and clone the current page
                const win = window.open('about:blank', '_blank');
                if (win) {
                    // Add the script nodes first
                    const scripts = document.querySelectorAll('script');
                    scripts.forEach(script => {
                        const newScript = win.document.createElement('script');
                        if (script.src) {
                            newScript.src = script.src;
                        } else {
                            newScript.textContent = script.textContent;
                        }
                        win.document.head.appendChild(newScript);
                    });
                    
                    // Copy over stylesheets
                    const styles = document.querySelectorAll('link[rel="stylesheet"]');
                    styles.forEach(style => {
                        const newStyle = win.document.createElement('link');
                        newStyle.rel = 'stylesheet';
                        newStyle.href = style.href;
                        win.document.head.appendChild(newStyle);
                    });
                    
                    // Set title and meta tags
                    win.document.title = document.title;
                    const meta = document.querySelectorAll('meta');
                    meta.forEach(tag => {
                        const newMeta = win.document.createElement('meta');
                        Array.from(tag.attributes).forEach(attr => {
                            newMeta.setAttribute(attr.name, attr.value);
                        });
                        win.document.head.appendChild(newMeta);
                    });
                    
                    // Copy the body
                    win.document.body.innerHTML = document.body.innerHTML;
                    
                    // Close original window
                    setTimeout(() => {
                        window.location.replace('about:blank');
                    }, 100);
                }
                break;
                
            case 'data URL':
                // Create a data URL of the entire page and navigate to it
                const htmlContent = '<!DOCTYPE html>' + document.documentElement.outerHTML;
                const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
                window.location.href = dataUrl;
                break;
                
            case 'embedded':
                // Use an iframe to embed the content
                if (!window.frameElement) {
                    const iframe = document.createElement('iframe');
                    iframe.style.position = 'fixed';
                    iframe.style.top = '0';
                    iframe.style.left = '0';
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    iframe.style.border = 'none';
                    iframe.style.zIndex = '9999999';
                    iframe.sandbox = 'allow-scripts allow-same-origin allow-forms';
                    document.body.innerHTML = '';
                    
                    // Create a simple disguise page
                    const fakePage = document.createElement('div');
                    fakePage.innerHTML = `
                        <h1 style="text-align: center; font-family: Arial; margin-top: 100px;">Google Classroom</h1>
                        <p style="text-align: center; font-family: Arial;">Loading your classroom content...</p>
                    `;
                    document.body.appendChild(fakePage);
                    
                    // Load actual content in the iframe
                    iframe.srcdoc = document.documentElement.outerHTML;
                    document.body.appendChild(iframe);
                }
                break;
        }
    } catch (error) {
        console.error('Error applying cloaking method:', error);
    }
}

// Add custom favicon handler if not already defined
if (typeof changeFavicon !== 'function') {
    window.changeFavicon = function(iconURL, pageTitle) {
        // Change favicon
        const faviconElement = document.querySelector("link[rel='icon']") || document.createElement('link');
        faviconElement.rel = 'icon';
        faviconElement.href = iconURL;
        document.head.appendChild(faviconElement);
        
        // Change title
        if (pageTitle) {
            document.title = pageTitle;
        }
        
        // Save preferences
        localStorage.setItem('favicon', iconURL);
        localStorage.setItem('tabTitle', pageTitle || document.title);
        
        console.log(`Tab disguised as ${pageTitle || 'custom page'}`);
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
    } else {
        localStorage.setItem('cloakingMethod', 'disabled');
        localStorage.setItem('cloaking', 'false');
    }
}

// Toggle auto-clear data function
function toggleAutoClear() {
    const checkbox = document.getElementById("cbox_autoclear");
    
    if (checkbox) {
        localStorage.setItem('autoclear', checkbox.checked);
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
