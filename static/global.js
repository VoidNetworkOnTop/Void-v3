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
            // Re-enable cursor when terminal is closed
            if (window.customCursor) {
                window.customCursor.classList.remove('hidden');
            }
            return;
        }
        if (document.getElementById("terminal") == null) {
            renderFile("/terminal.html", "50%", "50%", "terminal")
            // Hide cursor when terminal is open
            if (window.customCursor) {
                window.customCursor.classList.add('hidden');
            }
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
    
    // Hide cursor when iframe is rendered
    if (window.customCursor) {
        window.customCursor.classList.add('hidden');
    }
}

// Delete Item Function
function deleteItem(id) {
    const element = document.getElementById(id);
    if (element && element.tagName === 'IFRAME') {
        element.remove();
        // Re-check if cursor should be visible after iframe removal
        if (window.customCursor) {
            setTimeout(() => {
                const iframes = document.querySelectorAll('iframe');
                if (iframes.length === 0) {
                    window.customCursor.classList.remove('hidden');
                }
            }, 100);
        }
    } else if (element) {
        element.remove();
    }
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
        
        // Save cursor reference globally
        window.customCursor = cursor;

        // Cursor position tracking
        let mouseX = 0;
        let mouseY = 0;
        let cursorX = 0;
        let cursorY = 0;
        let isPointerLocked = false;
        let lastMouseMove = Date.now();
        let lastCursorPosition = { x: 0, y: 0 };
        let movementDetected = false;
        let isOverIframe = false;

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

        // Check if cursor is stuck
        function checkCursorStuck() {
            const currentTime = Date.now();
            const timeSinceLastMove = currentTime - lastMouseMove;
            
            // Check if cursor position has changed
            const positionChanged = Math.abs(cursorX - lastCursorPosition.x) > 1 || 
                                  Math.abs(cursorY - lastCursorPosition.y) > 1;
            
            if (positionChanged) {
                lastCursorPosition = { x: cursorX, y: cursorY };
            }
            
            // If we detected movement but cursor hasn't moved in 500ms, it's probably stuck
            if (movementDetected && !positionChanged && timeSinceLastMove > 500) {
                cursor.classList.add('hidden');
                movementDetected = false;
            }
            
            // Hide cursor if over iframe
            if (isOverIframe) {
                cursor.classList.add('hidden');
            }
        }
        
        // Check cursor status periodically
        setInterval(checkCursorStuck, 100);

        // Detect when mouse is over iframe
        function detectIframe(e) {
            const element = document.elementFromPoint(e.clientX, e.clientY);
            isOverIframe = element && element.tagName === 'IFRAME';
            
            // Also check if we're over any element that might capture the mouse
            const problematicElements = ['IFRAME', 'EMBED', 'OBJECT', 'VIDEO', 'CANVAS'];
            if (element && problematicElements.includes(element.tagName)) {
                cursor.classList.add('hidden');
                return true;
            }
            return false;
        }

        // Mouse movement handler
        document.addEventListener('mousemove', function(e) {
            lastMouseMove = Date.now();
            movementDetected = true;
            
            // Check if over iframe or problematic element
            if (detectIframe(e)) {
                return;
            }
            
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
            
            // Save mouse position globally
            window.mouseX = mouseX;
            window.mouseY = mouseY;
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
            if (!isOverIframe) {
                cursor.classList.remove('hidden');
            }
        });
        
        // Detect iframe hover events
        document.addEventListener('mouseover', function(e) {
            if (e.target.tagName === 'IFRAME') {
                cursor.classList.add('hidden');
                isOverIframe = true;
            }
        });
        
        // Re-show cursor when leaving iframe (if it bubbles up)
        document.addEventListener('mouseout', function(e) {
            if (e.target.tagName === 'IFRAME') {
                // Small delay to ensure we're actually out of the iframe
                setTimeout(() => {
                    const currentElement = document.elementFromPoint(mouseX, mouseY);
                    if (!currentElement || currentElement.tagName !== 'IFRAME') {
                        isOverIframe = false;
                        cursor.classList.remove('hidden');
                    }
                }, 10);
            }
        });

        // Handle pointer lock changes
        document.addEventListener('pointerlockchange', function() {
            isPointerLocked = document.pointerLockElement !== null;
            if (!isPointerLocked) {
                // Reset cursor position when pointer lock is lost
                cursor.classList.add('hidden');
                setTimeout(() => {
                    if (!isOverIframe) {
                        cursor.classList.remove('hidden');
                    }
                }, 100);
            }
        });
        
        // Handle visibility changes
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                cursor.classList.add('hidden');
            } else {
                setTimeout(() => {
                    if (!isOverIframe) {
                        cursor.classList.remove('hidden');
                    }
                }, 100);
            }
        });
        
        // Handle window blur/focus
        window.addEventListener('blur', function() {
            cursor.classList.add('hidden');
        });
        
        window.addEventListener('focus', function() {
            setTimeout(() => {
                if (!isOverIframe) {
                    cursor.classList.remove('hidden');
                }
            }, 100);
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
