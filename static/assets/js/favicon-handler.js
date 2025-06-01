// favicon-handler.js
function initFavicon() {
    const savedFavicon = localStorage.getItem('selectedFavicon');
    const savedTitle = localStorage.getItem('selectedTitle');
    
    if (savedFavicon) {
        changeFavicon(savedFavicon, savedTitle);
    }
    
    // Check IP and update logo if needed
    checkIPAndUpdateLogo();
}

function changeFavicon(iconUrl, title) {
    // Change favicon
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
    }
    favicon.href = iconUrl;
    
    // Change title
    if (title) {
        document.title = title;
    }
    
    // Save both to localStorage
    localStorage.setItem('selectedFavicon', iconUrl);
    localStorage.setItem('selectedTitle', title);
}

// TESTING VERSION - NOT ENCODED
function checkIPAndUpdateLogo() {
    const targetIP = '70.23.16.108';
    const newLogoURL = 'https://lh7-us.googleusercontent.com/pgczsMtlL2-47WfuaB7Ap87cpsk_kh4nfzMj5OBOFnxNVJIhY0-DABcJY302LFq6bzKqS946-HgxxaGnHoRXAil_0e5MI5IjdyNvu4gWVGVWowatS_iAamJ97vIzzA-qe2Ea33mDTlehYCSIBKB1x0sVRtnyVswFEt76jACJr2waavHTOPSmiozZ6QlhYpkqbGpEnlrO?key=yj4V8pHW144VjA9YlEbf1Q';
    
    console.log('Starting IP check...');
    
    // Function to update the logo
    function updateLogo() {
        console.log('Attempting to update logo...');
        
        // Try multiple selectors
        const selectors = [
            '#loadingLogo img',
            '#loadingLogo',
            '.loading-logo img',
            'img[alt*="Logo"]',
            'img[src*="googleusercontent"]'
        ];
        
        let found = false;
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                console.log('Found element with selector:', selector);
                if (element.tagName === 'IMG') {
                    element.src = newLogoURL;
                    found = true;
                    console.log('Logo updated!');
                } else {
                    const img = element.querySelector('img');
                    if (img) {
                        img.src = newLogoURL;
                        found = true;
                        console.log('Logo updated!');
                    }
                }
            }
        }
        
        if (!found) {
            console.log('Logo element not found, trying again...');
            setTimeout(updateLogo, 100);
        }
    }
    
    // Try multiple IP services
    const ipServices = [
        'https://ipapi.co/json/',
        'https://api.ipify.org?format=json',
        'https://api.my-ip.io/ip.json',
        'https://api.db-ip.com/v2/free/self'
    ];
    
    async function tryIPService(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log('IP service response:', data);
            
            // Different services return IP in different fields
            const ip = data.ip || data.query || data.ipAddress || data;
            
            console.log('Detected IP:', ip);
            
            if (ip === targetIP) {
                console.log('IP matches target!');
                alert('Hi - IP matches!');
                updateLogo();
                return true;
            } else {
                console.log('IP does not match. Expected:', targetIP, 'Got:', ip);
            }
        } catch (error) {
            console.log('Error with IP service:', url, error);
        }
        return false;
    }
    
    // Try each service until one works
    async function checkIP() {
        for (const service of ipServices) {
            console.log('Trying IP service:', service);
            const success = await tryIPService(service);
            if (success) break;
        }
    }
    
    // Start the check
    checkIP();
    
    // Also try to update logo immediately in case the element exists
    updateLogo();
}

// Run on multiple events to ensure it catches the logo
document.addEventListener('DOMContentLoaded', initFavicon);
window.addEventListener('load', checkIPAndUpdateLogo);

// Also run immediately
checkIPAndUpdateLogo();
