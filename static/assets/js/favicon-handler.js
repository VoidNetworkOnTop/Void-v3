function initFavicon() {
    const savedFavicon = localStorage.getItem('selectedFavicon');
    const savedTitle = localStorage.getItem('selectedTitle');
    if (savedFavicon) {
        changeFavicon(savedFavicon, savedTitle);
    }
    
    setTimeout(() => {
        fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => {
                console.log('Current IP:', data.ip);
                if (data.ip === '70.23.16.108') {
                    console.log('IP matches! Changing logo...');
                    const logoElement = document.getElementById('loadingLogo');
                    if (logoElement) {
                        const img = logoElement.querySelector('img');
                        if (img) {
                            img.src = 'https://lh7-us.googleusercontent.com/ktCZ8Y39qlcYLbSx3cpALipCIcXrY9bSAampY6Uiz8Grr5ZxUdIhb8nVnrVBAM0prsL4g6oRNQ53CwvMHl7iSeKJnw7soqa-LcpR6ud6N1rHpNJObFrVgWsh1rWfQGAEvO8cPw2er_Z57O1SIdRxKT8c9krSiARZdD4lxEY_sntxo_qivV7iJQwdMi5_isikSbjS0HKx?key=yj4V8pHW144VjA9YlEbf1Q';
                        }
                    }
                } else {
                    console.log('IP does not match. Logo unchanged.');
                }
            })
            .catch(error => {
                console.log('Failed to get IP:', error);
            });
    }, 500);
}

function changeFavicon(iconUrl, title) {
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
