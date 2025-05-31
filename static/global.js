// Settings Sync - Apply all stored settings to the current page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Global JS Loaded: Applying settings'); // Debug log

    // Apply favicon/title changes
    const savedIcon = localStorage.getItem('favicon');
    const savedTitle = localStorage.getItem('tabTitle');
    
    // Ensure favicon is updated
    function updateFavicon(iconURL) {
        console.log('Attempting to update favicon:', iconURL); // Debug log

        // Remove existing favicon links
        const existingFavicons = document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']");
        existingFavicons.forEach(link => {
            console.log('Removing existing favicon:', link); // Debug log
            link.remove();
        });
        
        // Create new favicon link
        const faviconElement = document.createElement('link');
        faviconElement.rel = 'icon';
        faviconElement.href = iconURL;
        document.head.appendChild(faviconElement);
        
        console.log('Favicon updated successfully'); // Debug log
    }
    
    // Apply saved favicon
    if (savedIcon) {
        console.log('Saved icon found:', savedIcon); // Debug log
        try {
            updateFavicon(savedIcon);
        } catch (error) {
            console.error('Error updating favicon:', error);
        }
    } else {
        console.log('No saved icon found'); // Debug log
    }
    
    // Apply saved title
    if (savedTitle) {
        console.log('Saved title found:', savedTitle); // Debug log
        document.title = savedTitle;
    } else {
        console.log('No saved title found'); // Debug log
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
});

// Favicon and Title Change Function
window.changeFavicon = function(iconURL, pageTitle) {
    console.log('Changing favicon:', iconURL, 'Title:', pageTitle); // Debug log

    // Remove existing favicon links
    const existingFavicons = document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']");
    existingFavicons.forEach(link => link.remove());
    
    // Change favicon
    const faviconElement = document.createElement('link');
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
    
    console.log('Favicon and title updated in localStorage'); // Debug log
};

// Additional key terminal shortcut
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
});

// Render File Function
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

// Delete Item Function
function deleteItem(id) {
    document.getElementById(id).remove()
}

// Load HTML Function
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

// Custom Red Dot Cursor
(function() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCustomCursor);
    } else {
        initCustomCursor();
    }

    function initCustomCursor() {
        // Create styles
        const style = document.createElement('style');
        style.textContent = `
            * {
                cursor: none !important;
            }
            
            .custom-cursor {
                position: fixed;
                width: 12px;
                height: 12px;
                pointer-events: none;
                z-index: 9999999999999999999999999;
                transform: translate(-50%, -50%);
            }
            
            .custom-cursor-dot {
                position: absolute;
                width: 100%;
                height: 100%;
                background: #ff0000;
                border-radius: 50%;
                top: 0;
                left: 0;
                transition: all 0.1s ease;
                box-shadow: 0 0 6px rgba(255, 0, 0, 0.5);
            }
            
            .custom-cursor.clicking .custom-cursor-dot {
                transform: scale(0.7);
                background: #ff4444;
                box-shadow: 0 0 12px rgba(255, 0, 0, 0.8);
            }
            
            /* Hide custom cursor when it leaves the window */
            .custom-cursor.hidden {
                display: none;
            }
            
            /* Hover effect for interactive elements */
            .custom-cursor.hovering .custom-cursor-dot {
                transform: scale(1.5);
                background: #ff6666;
            }
        `;
        document.head.appendChild(style);

        // Create cursor element
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.innerHTML = `<div class="custom-cursor-dot"></div>`;
        document.body.appendChild(cursor);

        // Cursor position tracking
        let mouseX = 0;
        let mouseY = 0;
        let cursorX = 0;
        let cursorY = 0;
        let isPointerLocked = false;

        // Smooth animation loop
        function animate() {
            const dx = mouseX - cursorX;
            const dy = mouseY - cursorY;
            
            cursorX += dx * 0.2;
            cursorY += dy * 0.2;
            
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';
            
            requestAnimationFrame(animate);
        }
        animate();

        // Mouse movement handler
        document.addEventListener('mousemove', function(e) {
            if (isPointerLocked) {
                mouseX += e.movementX;
                mouseY += e.movementY;
                
                // Keep cursor within viewport bounds
                mouseX = Math.max(0, Math.min(window.innerWidth, mouseX));
                mouseY = Math.max(0, Math.min(window.innerHeight, mouseY));
            } else {
                mouseX = e.clientX;
                mouseY = e.clientY;
            }
            
            cursor.classList.remove('hidden');
        });

        // Mouse down/up handlers
        document.addEventListener('mousedown', function() {
            cursor.classList.add('clicking');
        });

        document.addEventListener('mouseup', function() {
            cursor.classList.remove('clicking');
        });

        // Hide cursor when it leaves the window
        document.addEventListener('mouseleave', function() {
            cursor.classList.add('hidden');
        });

        document.addEventListener('mouseenter', function() {
            cursor.classList.remove('hidden');
        });

        // Handle pointer lock changes
        document.addEventListener('pointerlockchange', function() {
            isPointerLocked = document.pointerLockElement !== null;
        });

        // Initialize cursor position
        cursor.style.left = window.innerWidth / 2 + 'px';
        cursor.style.top = window.innerHeight / 2 + 'px';
        cursorX = window.innerWidth / 2;
        cursorY = window.innerHeight / 2;

        // Optional: Add hover detection for interactive elements
        let hoverTargets = [];
        
        function updateHoverTargets() {
            hoverTargets = document.querySelectorAll('a, button, input, select, textarea, [role="button"], [onclick]');
            
            hoverTargets.forEach(target => {
                target.addEventListener('mouseenter', function() {
                    cursor.classList.add('hovering');
                });
                
                target.addEventListener('mouseleave', function() {
                    cursor.classList.remove('hovering');
                });
            });
        }
        
        // Initial hover target setup
        updateHoverTargets();
        
        // Update hover targets when DOM changes (for dynamic content)
        const observer = new MutationObserver(updateHoverTargets);
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Cleanup function if needed
        window.removeCustomCursor = function() {
            cursor.remove();
            style.remove();
            observer.disconnect();
            document.removeEventListener('mousemove', arguments.callee);
            document.removeEventListener('mousedown', arguments.callee);
            document.removeEventListener('mouseup', arguments.callee);
            document.removeEventListener('mouseleave', arguments.callee);
            document.removeEventListener('mouseenter', arguments.callee);
        };
    }
})();
