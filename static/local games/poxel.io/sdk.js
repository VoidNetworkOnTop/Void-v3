// -- v2.4 (LGP Preview 2/24/2025) -- //
const ENABLE_ADS = true;
const DEBUG_MODE = false;

// Mobile detection
const IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Ad refresh configuration
const MIN_REFRESH_INTERVAL = 30000; // 30 seconds minimum between refreshes
const BANNER_DEBOUNCE_TIME = 100;   // 100ms debounce for banner operations (except hiding)
const MAX_AIPTAG_WAIT_TIME = 2000;  // Maximum time to wait for AdinPlay to load

// Map bannerType to an ad tag and dimensions.
const bannerMapping = {
    0: 'poxel-io_300x250',
    1: 'poxel-io_728x90',
    2: 'poxel-io_300x600'
};

const bannerDimensions = {
    // 300×250 banner
    0: {
        width: '300px', height: '250px',
        scale: 1.3,
        enableForMobile: true,
        // ratio → boost stops
        ratioBoostStops: [
            { ratio: 1.0,  boost: 1.8 },   // square
            { ratio: 1.62, boost: 1.2 },   // mid‑rect
            { ratio: 1.78, boost: 1.1 }    // 16:9
        ]
    },
    // 728×90 banner
    1: {
        width: '728px', height: '90px',
        scale: 1.3,
        enableForMobile: false,
        ratioBoostStops: [
            { ratio: 0,    boost: 1.0 },   // always 1×
            { ratio: Infinity, boost: 1.0 }
        ]
    },
    // 300×600 banner
    2: {
        width: '300px', height: '600px',
        scale: 1.08,
        enableForMobile: false,
        ratioBoostStops: [
            { ratio: 1.0,  boost: 1.9 },
            { ratio: 1.62, boost: 1.15 },
            { ratio: 1.78, boost: 1.05 }
        ]
    }
};

// Sort ratioBoostStops once at initialization
Object.keys(bannerDimensions).forEach(key => {
    bannerDimensions[key].ratioBoostStops.sort((a, b) => a.ratio - b.ratio);
});

// Create a promise for AdinPlay availability
const aipDisplayTagReadyPromise = new Promise((resolve) => {
    // Check if already loaded
    if (typeof aipDisplayTag !== "undefined") {
        resolve(true);
        return;
    }

    // Set a timeout in case AdinPlay never loads
    const timeoutId = setTimeout(() => {
        console.warn("[sdk.js] AdinPlay failed to load within timeout period");
        resolve(false);
    }, MAX_AIPTAG_WAIT_TIME);

    // Check for AdinPlay availability periodically
    const checkInterval = setInterval(() => {
        if (typeof aipDisplayTag !== "undefined") {
            clearInterval(checkInterval);
            clearTimeout(timeoutId);
            resolve(true);
        }
    }, 100);
});

// Helper function for debouncing
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// CPMSTAR-INIT-START
(function (zonefile) {
    var y = "cpmstarx";
    var drutObj = window[y] = window[y] || {};
    function failCpmstarAPI() {
        var failFn = function (o) { o && typeof (o) === "object" && o.fail && o.fail(); };
        drutObj && Array.isArray(drutObj.cmd) && drutObj.cmd.forEach(failFn) && (drutObj.cmd.length = 0);
        window.cpmstarAPI = window["_" + zonefile] = failFn;
    }
    var rnd = Math.round(Math.random() * 999999);
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.onerror = failCpmstarAPI;
    s.onload = initCpmstarAPI; // Initialize CPMStar API when script is loaded
    var proto = document.location.protocol;
    var host = (proto == "https:" || proto == "file:") ? "https://server" : "//cdn";
    if (window.location.hash == "#cpmstarDev") host = "//dev.server";
    if (window.location.hash == "#cpmstarStaging") host = "//staging.server";
    s.src = host + ".cpmstar.com/cached/zonefiles/" + zonefile + ".js?rnd=" + rnd;
    var s2 = document.getElementsByTagName('script')[0];
    s2.parentNode.insertBefore(s, s2);
    window.cpmstarAPI = function (o) { (drutObj.cmd = drutObj.cmd || []).push(o); }
}('1137_54105_gameapi'));
// CPMSTAR-INIT-END

function initCpmstarAPI() {
    if (typeof cpmstarAPI !== 'undefined') {
        // Initialize and preload the interstitial ad
        cpmstarAPI({
            kind: "game.createInterstitial",
            onAdOpened: function () {
                // Pause the game or audio if needed
                console.log("[sdk.js] CPMStar ad opened");
            },
            onAdClosed: function () {
                // Resume the game or audio if needed
                console.log("[sdk.js] CPMStar ad closed");
            },
            fail: function () {
                console.log("[sdk.js] CPMStar API failed to load! Are you using an AdBlocker?");
                window.adblocked = true;
            }
        });
    } else {
        console.log("[sdk.js] CPMStar API is not defined.");
    }
}

// ADINPLAY-INIT-START

window.aiptag = window.aiptag || { cmd: [] };
aiptag.cmd.display = aiptag.cmd.display || [];
aiptag.cmd.player = aiptag.cmd.player || [];
aiptag.cmp = {
    show: true,
    position: "bottom",
    button: false,
    buttonText: "Privacy settings",
    buttonPosition: "bottom-left"
};

// aiptag.pageProtect = true;

aiptag.cmd.player.push(function () {
    aiptag.adplayer = new aipPlayer({
        AD_WIDTH: 960,
        AD_HEIGHT: 540,
        AD_DISPLAY: 'fullscreen', // or 'center'
        LOADING_TEXT: 'Loading advertisement',
        PREROLL_ELEM: function () { return document.getElementById('videoad') },
        AIP_COMPLETE: function (state) {
            console.log(`[sdk.js] AdinPlay Video Ad Completed: ${state}`);
            
            // Check for failure conditions
            const lowerCaseState = state.toLowerCase();
            if (lowerCaseState.includes("adblock") ||
                lowerCaseState.includes("failed") ||
                lowerCaseState.includes("empty") ||
                lowerCaseState.includes("error")) 
            {
                console.log("[sdk.js] AdinPlay ad failed.");
                // Send failure back to Unity
                if (typeof unityInstance !== 'undefined') {
                    unityInstance.SendMessage("SDKManager", "OnVideoAdEnded", "false"); // Failure
                }
            } else {
                // All good
                if (typeof unityInstance !== 'undefined') {
                    unityInstance.SendMessage("SDKManager", "OnVideoAdEnded", "true"); // Success
                }
            }
        }
    });
});

// Load the AdinPlay script
const adinplayScript = document.createElement('script');
adinplayScript.type = "text/javascript";
adinplayScript.src = '//api.adinplay.com/libs/aiptag/pub/LGP/poxel.io/tag.min.js';
adinplayScript.async = true;
document.head.appendChild(adinplayScript);

// ADINPLAY-INIT-END

var loadingStartSent = false;

window.SDK = {
    gameplayStart() {
        console.log("[sdk.js] Gameplay started");
    },
    loadingStart() {
        if (loadingStartSent)
            return;
        loadingStartSent = true;
        console.log("[sdk.js] Loading started");
    },
    loadingEnd() {
        console.log("[sdk.js] Loading finished");
    },
    gameplayEnd() {
        console.log("[sdk.js] Gameplay ended");
    },
    showMidroll() {
        console.log("[sdk.js] Attempting to show midroll ad...");
        if (ENABLE_ADS) {
            showAd('midroll');
        } else {
            console.log("[sdk.js] Ads are disabled; simulating success callback.");
            if (typeof unityInstance !== 'undefined') {
                unityInstance.SendMessage("SDKManager", "OnVideoAdEnded", "true"); // Simulated success
            }
        }
    },
    showRewarded() {
        console.log("[sdk.js] Attempting to show rewarded ad...");
        if (ENABLE_ADS) {
            showAd('rewarded');
        } else {
            console.log("[sdk.js] Ads are disabled; simulating success callback.");
            if (typeof unityInstance !== 'undefined') {
                unityInstance.SendMessage("SDKManager", "OnVideoAdEnded", "true"); // Simulated success
            }
        }
    },

    // Internal dictionaries: one to track banners by ad tag and one for occupied positions.
    _bannerAds: {},
    _occupiedPositions: {},
    _lastRefreshed: {}, // Track when each banner was last refreshed
    _pendingBannerOps: {}, // Track pending banner operations

    /**
     * Sets (or moves) a banner ad.
     * There can only be one instance per ad tag. So if the same BannerType is used again,
     * its container is moved to the new position.
     *
     * @param {number} bannerType
     * @param {number} bannerPosition - (0: Hidden, 1: TopCenter, 2: TopRight, 3: TopLeft,
     *                                  4: BottomCenter, 5: BottomRight, 6: BottomLeft,
     *                                  7: MiddleCenter, 8: MiddleLeft, 9: MiddleRight)
     */
    async _originalSetBanner(bannerType, bannerPosition) {
        const adTag = bannerMapping[bannerType];
        const dims = bannerDimensions[bannerType];
        const now = Date.now();
        
        if (!adTag || !dims) {
            console.error("[sdk.js] Unknown banner type: " + bannerType);
            return;
        }
        
        // Check if banner is enabled for the current device
        if (IS_MOBILE && !dims.enableForMobile) {
            console.log(`[sdk.js] Banner type ${bannerType} is disabled for mobile devices`);
            return;
        }

        // Store this operation as the latest for this banner type
        this._pendingBannerOps[bannerType] = {
            bannerType: bannerType,
            bannerPosition: bannerPosition,
            timestamp: now
        };

        // Check if an instance for this ad tag already exists
        let existingInstance = this._bannerAds[adTag];

        // Handling position 0 (hidden) - use CSS-only hide
        if (bannerPosition === 0) {
            if (existingInstance && existingInstance.container) {
                // Hide with CSS only, don't remove from DOM
                existingInstance.container.style.display = "none";
                
                // Update position tracking
                let oldPosKey = existingInstance.position.toString();
                if (this._occupiedPositions[oldPosKey] === adTag) {
                    delete this._occupiedPositions[oldPosKey];
                }
                
                existingInstance.position = 0;
            }
            return;
        }

        if (existingInstance) {
            // If the banner is already at the requested position, do nothing
            if (existingInstance.position === bannerPosition) {
                return;
            } else {
                // Remove the old position mapping
                let oldPosKey = existingInstance.position.toString();
                if (this._occupiedPositions[oldPosKey] === adTag) {
                    delete this._occupiedPositions[oldPosKey];
                }
                
                // Check if the new position is occupied by a different ad
                let newPosKey = bannerPosition.toString();
                if (this._occupiedPositions[newPosKey] && this._occupiedPositions[newPosKey] !== adTag) {
                    let conflictAdTag = this._occupiedPositions[newPosKey];
                    let conflictInstance = this._bannerAds[conflictAdTag];
                    if (conflictInstance && conflictInstance.container) {
                        conflictInstance.container.style.display = "none";
                    }
                    delete this._occupiedPositions[newPosKey];
                }
                
                // Update the existing container's CSS to the new position
                existingInstance.container.style.display = "block";
                updateContainerPosition(existingInstance.container, bannerPosition);
                existingInstance.position = bannerPosition;
                this._occupiedPositions[newPosKey] = adTag;
                
                // Only refresh if enough time has passed
                const shouldRefresh = !this._lastRefreshed[adTag] || 
                                       (now - this._lastRefreshed[adTag] >= MIN_REFRESH_INTERVAL);
                
                if (shouldRefresh) {
                    // Wait for AdinPlay to be ready
                    const isAipReady = await aipDisplayTagReadyPromise;
                    
                    // Check if a newer operation has been requested for this banner
                    if (this._pendingBannerOps[bannerType]?.timestamp > now) {
                        return; // Skip this operation as a newer one is pending
                    }
                    
                    if (isAipReady && typeof aiptag !== "undefined" && typeof aipDisplayTag !== "undefined") {
                        aiptag.cmd.display.push(function() {
                            aipDisplayTag.display(adTag);
                        });
                        this._lastRefreshed[adTag] = now;
                    } else {
                        console.log("[sdk.js] Waiting for AipDisplayTag failed. Banner displayed without ad refresh.");
                    }
                }
            }
        } else {
            // No instance exists yet for this ad tag
            let posKey = bannerPosition.toString();
            
            // If another ad is already occupying the requested position, hide it
            if (this._occupiedPositions[posKey]) {
                let conflictAdTag = this._occupiedPositions[posKey];
                let conflictInstance = this._bannerAds[conflictAdTag];
                if (conflictInstance && conflictInstance.container) {
                    conflictInstance.container.style.display = "none";
                }
                delete this._occupiedPositions[posKey];
            }

            // Create a new container for the banner
            const container = document.createElement('div');
            container.className = 'banner-container';
            container.id = 'banner_' + adTag;
            container.style.position = 'absolute';
            container.style.zIndex = 1000;
            container.style.userSelect = 'none';
            container.style.pointerEvents = 'all';
            container.style.width = dims.width;
            container.style.height = dims.height;

            if (DEBUG_MODE) {
                container.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                container.style.border = '2px solid red';
            }
            else {
                container.style.backgroundColor = 'rgba(0, 0, 0, 0.00)';
            }

            // Create the inner banner div
            const bannerDiv = document.createElement('div');
            bannerDiv.id = adTag;
            bannerDiv.style.width = dims.width;
            bannerDiv.style.height = dims.height;
            container.appendChild(bannerDiv);

            // Set container positioning
            updateContainerPosition(container, bannerPosition);

            // Append the container to the document
            document.body.appendChild(container);

            // Save the new banner instance
            this._bannerAds[adTag] = {
                bannerType: bannerType,
                adTag: adTag,
                container: container,
                position: bannerPosition
            };
            this._occupiedPositions[posKey] = adTag;

            // Wait for AdinPlay to be ready
            const isAipReady = await aipDisplayTagReadyPromise;
            
            // Check if a newer operation has been requested for this banner
            if (this._pendingBannerOps[bannerType]?.timestamp > now) {
                return; // Skip this operation as a newer one is pending
            }
            
            // Display the ad if possible
            if (isAipReady && typeof aiptag !== "undefined" && typeof aipDisplayTag !== "undefined") {
                aiptag.cmd.display.push(function() {
                    aipDisplayTag.display(adTag);
                });
                this._lastRefreshed[adTag] = now;
            } else {
                console.log("[sdk.js] Banner container created, but AipDisplayTag is not yet available. Will try to display later.");
            }
        }

        onWindowResize();
    }
};

// Create debounced version of SetBanner (but position 0 is handled immediately)
window.SDK.SetBanner = function(bannerType, bannerPosition) {
    // If hiding (position 0), do it immediately
    if (bannerPosition === 0) {
        window.SDK._originalSetBanner.call(window.SDK, bannerType, bannerPosition);
    } else {
        // For all other positions, use per-bannerType debounced version
        if (!window.SDK._debouncedSetBannerPerType) {
            window.SDK._debouncedSetBannerPerType = {};
        }
        
        if (!window.SDK._debouncedSetBannerPerType[bannerType]) {
            window.SDK._debouncedSetBannerPerType[bannerType] = debounce(
                (bannerType, bannerPosition) => {
                    // Call the async function but don't wait for it
                    window.SDK._originalSetBanner.call(window.SDK, bannerType, bannerPosition);
                },
                BANNER_DEBOUNCE_TIME
            );
        }
        
        window.SDK._debouncedSetBannerPerType[bannerType](bannerType, bannerPosition);
    }
};

/**
 * Helper function to update the CSS positioning of a banner container based on bannerPosition.
 *
 * @param {HTMLElement} container - The container element to update.
 * @param {number} bannerPosition - Position code as defined in SDKManager (0-9).
 */
function updateContainerPosition(container, bannerPosition) {
    // Reset positioning styles.
    container.style.top = "";
    container.style.right = "";
    container.style.bottom = "";
    container.style.left = "";
    container.style.transformOrigin = "";
    
    switch (parseInt(bannerPosition)) {
        case 0: // Hidden
            container.style.display = "none";
            break;
        case 1: // TopCenter: pivot top center
            container.style.display = "block";
            container.style.top = "1%";

            // Center a div
            container.style.left = "0";
            container.style.right = "0";
            container.style.marginLeft = "auto";
            container.style.marginRight = "auto";

            container.style.transformOrigin = "top center";
            break;
        case 2: // TopRight: pivot top right
            container.style.display = "block";
            container.style.top = "1%";
            container.style.right = "1%";
            container.style.transformOrigin = "top right";
            break;
        case 3: // TopLeft: pivot top left
            container.style.display = "block";
            container.style.top = "1%";
            container.style.left = "1%";
            container.style.transformOrigin = "top left";
            break;
        case 4: // BottomCenter: pivot bottom center
            container.style.display = "block";
            container.style.bottom = "0.5%";
            
            // Center a div
            container.style.left = "0";
            container.style.right = "0";
            container.style.marginLeft = "auto";
            container.style.marginRight = "auto";

            container.style.transformOrigin = "bottom center";
            break;
        case 5: // BottomRight: pivot bottom right
            container.style.display = "block";
            container.style.bottom = "1%";
            container.style.right = "1%";
            container.style.transformOrigin = "bottom right";
            break;
        case 6: // BottomLeft: pivot bottom left
            container.style.display = "block";
            container.style.bottom = "1%";
            container.style.left = "1%";
            container.style.transformOrigin = "bottom left";
            break;
        case 7: // MiddleCenter: pivot center
            container.style.display = "block";
            container.style.position = "absolute";  // Ensure positioning can be adjusted
            container.style.top = "0";  // Align to the top
            container.style.bottom = "0";  // Align to the bottom
            container.style.left = "0";  // Align to the left
            container.style.right = "0";  // Align to the right
            container.style.margin = "auto";  // Automatically adjust margins to center
            break;
        case 8: // MiddleLeft: pivot middle left
            container.style.display = "block";
            container.style.left = "1%";
            
            // Center a div vertically
            container.style.top = "0";
            container.style.bottom = "0";
            container.style.margin = "auto";

            container.style.transformOrigin = "center left";
            break;
        case 9: // MiddleRight: pivot middle right
            container.style.display = "block";
            container.style.right = "1%";
            
            // Center a div vertically
            container.style.top = "0";
            container.style.bottom = "0";
            container.style.margin = "auto";

            container.style.transformOrigin = "center right";
            break;
        case 10: // below top left
            container.style.display = "block";
            container.style.position = "absolute";
            container.style.left = "1%";
            container.style.top = "10%";
            container.style.transformOrigin = "top left";
            break;
        case 11: // below top right
            container.style.display = "block";
            container.style.position = "absolute";
            container.style.top = "10%";
            container.style.right = "1%";
            container.style.transformOrigin = "top right";
            break;
        default:
            console.error("[sdk.js] Unknown banner position: " + bannerPosition);
            break;
    }
}

function showAd(adType) {
    console.log(`[sdk.js] showAd called with adType: ${adType}`);

    // First, attempt to show the ad via CPMStar
    if (typeof cpmstarAPI !== 'undefined') {
        console.log(`[sdk.js] Attempting to show ${adType} ad via CPMStar`);
        cpmstarAPI({
            kind: "game.displayInterstitial",
            onAdOpened: function () {
                console.log(`[sdk.js] CPMStar ${adType} ad opened`);
                // Pause game or audio if necessary
            },
            onAdClosed: function () {
                console.log(`[sdk.js] CPMStar ${adType} ad closed`);
                // Resume game or audio if necessary
                if (typeof unityInstance !== 'undefined') {
                    unityInstance.SendMessage("SDKManager", "OnVideoAdEnded", "true"); // Success
                }
            },
            fail: function () {
                console.log(`[sdk.js] Failed to show ${adType} ad via CPMStar. Trying AdinPlay...`);
                // Attempt to show ad via AdinPlay
                showAdViaAdinplay(adType);
            }
        });
    } else {
        console.log(`[sdk.js] CPMStar API is not defined for ${adType} ad. Trying AdinPlay...`);
        showAdViaAdinplay(adType);
    }
}

function showAdViaAdinplay(adType) {
    console.log(`[sdk.js] Attempting to show ${adType} ad via AdinPlay`);
    if (typeof aiptag !== 'undefined' && typeof aiptag.adplayer !== 'undefined') {
        aiptag.cmd.player.push(function () {
            console.log(`[sdk.js] Starting AdinPlay video ad`);
            // Start the ad via pre-roll
            aiptag.adplayer.startPreRoll();
        });
    } else {
        console.log(`[sdk.js] AdinPlay API is not defined or adplayer is not available.`);
        // If AdinPlay is not available, simulate failure
        if (typeof unityInstance !== 'undefined') {
            unityInstance.SendMessage("SDKManager", "OnVideoAdEnded", "false"); // Failure
        }
    }
}

// Ensure CPMStar API is initialized when available
if (typeof cpmstarAPI !== 'undefined') {
    initCpmstarAPI();
} else {
    var cpmstarAPICheckInterval = setInterval(function () {
        if (typeof cpmstarAPI !== 'undefined') {
            clearInterval(cpmstarAPICheckInterval);
            initCpmstarAPI();
        }
    }, 100);
}


// helper to piecewise‑interp boost
function getRatioBoost(stops, aspect) {
    // make sure sorted
    stops.sort((a,b)=>a.ratio - b.ratio);
    if (aspect <= stops[0].ratio) return stops[0].boost;
    if (aspect >= stops.at(-1).ratio) return stops.at(-1).boost;
    for (let i = 0; i < stops.length-1; i++) {
        const a = stops[i], b = stops[i+1];
        if (aspect >= a.ratio && aspect <= b.ratio) {
        const t = (aspect - a.ratio) / (b.ratio - a.ratio);
        return a.boost + (b.boost - a.boost) * t;
        }
    }
    return 1;
}

// replace your existing onWindowResize with this:
function onWindowResize() {
    const w = window.innerWidth, h = window.innerHeight;
    const aspect = w / h;
    const baseScale = Math.min(w/1920, h/960);

    Object.keys(bannerMapping).forEach(key => {
        const tag  = bannerMapping[key];
        const dims = bannerDimensions[key];
        const ctr  = document.getElementById('banner_' + tag);
        if (!ctr || (IS_MOBILE && !dims.enableForMobile)) return;

        const boost = getRatioBoost(dims.ratioBoostStops, aspect);
        const finalScale = baseScale * dims.scale * boost;
        ctr.style.transform = `scale(${finalScale})`;
    });
}

// Attach the resize listener
window.addEventListener("resize", onWindowResize);
onWindowResize();

// Add periodic refresh for long-visible banners
setInterval(async function() {
    if (!ENABLE_ADS) return;
    
    const now = Date.now();
    
    // Wait for AdinPlay to be ready, but don't wait longer than timeout
    const isAipReady = await Promise.race([
        aipDisplayTagReadyPromise,
        new Promise(resolve => setTimeout(() => resolve(false), 100)) // Short timeout for this check
    ]);
    
    if (!isAipReady) return; // Skip refresh if AdinPlay isn't ready yet
    
    // Check each active banner
    Object.keys(window.SDK._bannerAds).forEach(adTag => {
        const banner = window.SDK._bannerAds[adTag];
        
        // Only refresh visible banners that haven't been refreshed recently
        if (banner && 
            banner.position !== 0 && 
            banner.container && 
            banner.container.style.display !== 'none' &&
            (!window.SDK._lastRefreshed[adTag] || now - window.SDK._lastRefreshed[adTag] >= MIN_REFRESH_INTERVAL)) {
            
            if (typeof aiptag !== "undefined" && typeof aipDisplayTag !== "undefined") {
                aiptag.cmd.display.push(function() {
                    aipDisplayTag.display(adTag);
                });
                window.SDK._lastRefreshed[adTag] = now;
            }
        }
    });
}, MIN_REFRESH_INTERVAL);

// Refresh ads when page becomes visible again
document.addEventListener('visibilitychange', async function() {
    if (!document.hidden && ENABLE_ADS) {
        const now = Date.now();
        
        // Wait for AdinPlay to be ready, but don't wait longer than timeout
        const isAipReady = await Promise.race([
            aipDisplayTagReadyPromise,
            new Promise(resolve => setTimeout(() => resolve(false), 100)) // Short timeout for this check
        ]);
        
        if (!isAipReady) return; // Skip refresh if AdinPlay isn't ready yet
        
        Object.keys(window.SDK._bannerAds).forEach(adTag => {
            const banner = window.SDK._bannerAds[adTag];
            
            // Only refresh visible banners that haven't been refreshed recently
            if (banner && 
                banner.position !== 0 && 
                banner.container && 
                banner.container.style.display !== 'none' &&
                (!window.SDK._lastRefreshed[adTag] || now - window.SDK._lastRefreshed[adTag] >= MIN_REFRESH_INTERVAL)) {
                
                if (typeof aiptag !== "undefined" && typeof aipDisplayTag !== "undefined") {
                    aiptag.cmd.display.push(function() {
                        aipDisplayTag.display(adTag);
                    });
                    window.SDK._lastRefreshed[adTag] = now;
                }
            }
        });
    }
});

window.SDK.loadingStart();
