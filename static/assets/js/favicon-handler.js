function initFavicon() {
    console.log('=== FAVICON HANDLER DEBUG START ===');
    
    const savedFavicon = localStorage.getItem('selectedFavicon');
    const savedTitle = localStorage.getItem('selectedTitle');
    console.log('Saved favicon:', savedFavicon);
    console.log('Saved title:', savedTitle);
    
    if (savedFavicon) {
        changeFavicon(savedFavicon, savedTitle);
    }
    
    console.log('Setting timeout for IP check...');
    setTimeout(() => {
        console.log('Timeout triggered - starting IP fetch...');
        
        // Check if loading logo exists first
        const logoElement = document.getElementById('loadingLogo');
        console.log('Loading logo element found:', !!logoElement);
        if (logoElement) {
            const img = logoElement.querySelector('img');
            console.log('Image element found:', !!img);
            if (img) {
                console.log('Current image src BEFORE any changes:', img.src);
            }
        }
        
        fetch('https://api.ipify.org?format=json')
            .then(response => {
                console.log('Fetch response received:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('Raw IP data received:', data);
                
                // Clean the IP string of any whitespace/newlines
                const userIP = String(data.ip).trim();
                const targetIP = '70.23.16.108';
                
                console.log('Cleaned user IP:', userIP);
                console.log('Target IP:', targetIP);
                console.log('IP lengths - user:', userIP.length, 'target:', targetIP.length);
                console.log('Exact match check:', userIP === targetIP);
                console.log('Character by character comparison:');
                for (let i = 0; i < Math.max(userIP.length, targetIP.length); i++) {
                    console.log(`  Position ${i}: user="${userIP[i]}" target="${targetIP[i]}" match=${userIP[i] === targetIP[i]}`);
                }
                
                // Use strict equality with cleaned strings
                if (userIP === targetIP) {
                    console.log('🟢 IP MATCHES! Proceeding to change logo...');
                    const logoElement = document.getElementById('loadingLogo');
                    if (logoElement) {
                        console.log('Logo element found');
                        const img = logoElement.querySelector('img');
                        if (img) {
                            console.log('Image element found');
                            console.log('Image src BEFORE change:', img.src);
                            img.src = 'https://lh7-us.googleusercontent.com/ktCZ8Y39qlcYLbSx3cpALipCIcXrY9bSAampY6Uiz8Grr5ZxUdIhb8nVnrVBAM0prsL4g6oRNQ53CwvMHl7iSeKJnw7soqa-LcpR6ud6N1rHpNJObFrVgWsh1rWfQGAEvO8cPw2er_Z57O1SIdRxKT8c9krSiARZdD4lxEY_sntxo_qivV7iJQwdMi5_isikSbjS0HKx?key=yj4V8pHW144VjA9YlEbf1Q';
                            console.log('Image src AFTER change:', img.src);
                            console.log('✅ Logo changed successfully!');
                        } else {
                            console.log('❌ No img element found inside loading logo');
                        }
                    } else {
                        console.log('❌ No loading logo element found');
                    }
                } else {
                    console.log('🔴 IP DOES NOT MATCH! Logo will remain unchanged.');
                    console.log('This IP will keep the default logo.');
                }
                
                // Check final state
                setTimeout(() => {
                    const logoElement = document.getElementById('loadingLogo');
                    if (logoElement) {
                        const img = logoElement.querySelector('img');
                        if (img) {
                            console.log('FINAL CHECK - Image src after everything:', img.src);
                        }
                    }
                }, 1000);
            })
            .catch(error => {
                console.log('❌ Failed to get IP:', error);
                console.log('Error details:', error.message);
                console.log('Logo will remain unchanged due to IP fetch failure.');
            });
    }, 500);
    
    console.log('=== FAVICON HANDLER DEBUG END ===');
}

function changeFavicon(iconUrl, title) {
    console.log('changeFavicon called with:', iconUrl, title);
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
    }
    favicon.href = iconUrl;
    
    if (title) {
        document.title = title;
    }
    
    localStorage.setItem('selectedFavicon', iconUrl);
    localStorage.setItem('selectedTitle', title);
}

document.addEventListener('DOMContentLoaded', initFavicon);
