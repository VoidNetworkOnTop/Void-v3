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
    
    // Check and apply About:blank cloaking (must run last)
    if (localStorage.getItem('cloaking') === 'true') {
        // Skip if we're already in an about:blank page
        if (window.location.href !== 'about:blank') {
            try {
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
            } catch (error) {
                console.error('Error applying about:blank cloaking:', error);
            }
        }
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

// Particles.js Initialization - With Particles Above Everything
document.addEventListener('DOMContentLoaded', function() {
    const config = {
        particles: {
            number: {
                value: 80,
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            color: {
                value: "#ffffff"
            },
            shape: {
                type: "circle",
                stroke: {
                    width: 0,
                    color: "#000000"
                },
                polygon: {
                    nb_sides: 5
                },
                image: {
                    src: "img/github.svg",
                    width: 100,
                    height: 100
                }
            },
            opacity: {
                value: 0.5,
                random: false,
                anim: {
                    enable: false,
                    speed: 1,
                    opacity_min: 0.1,
                    sync: false
                }
            },
            size: {
                value: 3,
                random: true,
                anim: {
                    enable: false,
                    speed: 40,
                    size_min: 0.1,
                    sync: false
                }
            },
            line_linked: {
                enable: false,
                distance: 150,
                color: "#ffffff",
                opacity: 0.4,
                width: 1
            },
            move: {
                enable: true,
                speed: 6,
                direction: "top",
                random: false,
                straight: false,
                out_mode: "out",
                bounce: false,
                attract: {
                    enable: false,
                    rotateX: 600,
                    rotateY: 1200
                }
            }
        },
        interactivity: {
            detect_on: "window",
            events: {
                onhover: {
                    enable: true,
                    mode: "repulse"
                },
                onclick: {
                    enable: true,
                    mode: "push"
                },
                resize: true
            },
            modes: {
                grab: {
                    distance: 400,
                    line_linked: {
                        opacity: 1
                    }
                },
                bubble: {
                    distance: 400,
                    size: 40,
                    duration: 2,
                    opacity: 8,
                    speed: 3
                },
                repulse: {
                    distance: 200,
                    duration: 0.4
                },
                push: {
                    particles_nb: 4
                },
                remove: {
                    particles_nb: 2
                }
            }
        },
        retina_detect: true
    };

    // Create style element with necessary CSS
    const style = document.createElement('style');
    style.textContent = `
        /* Background for particles */
        #particles-background {
            position: fixed;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            z-index: 1;
            background-color: #000;
            pointer-events: none;
        }
        
        /* Particles container */
        #particles-js {
            position: fixed;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            z-index: 999998;  /* Very high z-index to be above everything */
            pointer-events: none;
            background: transparent !important;  /* Ensure background is transparent */
        }
        
        /* Specifically target the canvas created by particles.js */
        #particles-js canvas {
            position: absolute !important;
            z-index: 999998 !important;
            pointer-events: none !important;
        }
        
        /* Keep loading overlay above particles */
        #loadingOverlay {
            z-index: 999999 !important;
        }
        
        /* Make sure content has relative positioning for proper stacking */
        .container, .games-box {
            position: relative;
            z-index: 10;
        }
    `;
    document.head.appendChild(style);

    // Create background div
    const background = document.createElement('div');
    background.id = 'particles-background';
    document.body.insertBefore(background, document.body.firstChild);

    // Create particles div
    const div = document.createElement('div');
    div.id = 'particles-js';
    document.body.insertBefore(div, document.body.firstChild);

    // Load particles.js and initialize
    const script = document.createElement('script');
    script.src = '/assets/js/particles.js?' + Date.now();
    script.onload = () => {
        particlesJS('particles-js', config);
        
        // Additional styling to ensure transparency
        const particlesDiv = document.getElementById('particles-js');
        particlesDiv.style.backgroundColor = 'transparent';
        
        // Find the canvas and ensure it has proper z-index
        setTimeout(() => {
            const canvas = particlesDiv.querySelector('canvas');
            if (canvas) {
                canvas.style.zIndex = '999998';
                canvas.style.pointerEvents = 'none';
            }
        }, 100);
    };
    document.head.appendChild(script);

    // Create particles div
    const div = document.createElement('div');
    div.id = 'particles-js';
    document.body.insertBefore(div, document.body.firstChild);

    // Load particles.js and initialize
    const script = document.createElement('script');
    script.src = '/assets/js/particles.js?' + Date.now();
    script.onload = () => particlesJS('particles-js', config);
    document.head.appendChild(script);
});
