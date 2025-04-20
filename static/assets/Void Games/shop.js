/**
 * shop.js - Shop system for Void Network
 * Contains shop management, item purchasing, theme and avatar functionality, and roll system
 */

// Theme and Avatar manager to handle application with security improvements
window.itemManager = {
    // Track the currently equipped items
    currentTheme: null,
    currentAvatar: null,
    
    // Items data with URLs
    items: {
        // Themes
        'forest_theme': {
            url: 'https://lh7-us.googleusercontent.com/v_s_bK2lQgL2sAvLaZfdZJoy1A9V6x_feCZubeL1von2XD-QQhD5l9A8GmGcdJKGzSOcGkJTrTJB34rY3V-xzRr_4x5qgZB5a8L3Pg5YMeNwZnSuM740jUjvuupmAD4-D4ARNIlfVqwiECIG1fWnDadh0tri-Q',
            name: 'Forest Theme',
            type: 'theme'
        },
        'city_theme': {
            url: 'https://lh7-us.googleusercontent.com/OlgmXm_auGwC6ga8ZVXSx_eqeCfm2bYpMKd3ylW4eLqMZ45CicWeMwJBoUhnYgEdwdEK3bzaMUHt5fIDFk_eaHKFy6cUSjbeEWBIB1TiIxk1trjPXNvFTgEAuaaEx-rO1q0UZ2k6GgZyiyrzWoK-xLQcpUdKWA',
            name: 'City Theme',
            type: 'theme'
        },
        'desert_theme': {
            url: 'https://lh7-us.googleusercontent.com/kPKB3cpqgwfvkFv_TOM1YsJyG0J46BVOOx7nLtS94V1QYWMgJD_BHQnqj_xSG5oIy0oVLo1zi2Com1sJopFqupa-KOuCMOONyVMhoWw0Tlu_GQR5ImRpoaKk3Qp7RRZGvCSqjjopA1YGz4Pko-IBFD_XBl1mLg',
            name: 'Desert Theme',
            type: 'theme'
        },
        'ocean_theme': {
            url: 'https://lh7-us.googleusercontent.com/MuXH0obscoC0WCNtdSARDM6vyBAIJVdT9llkWccrKb2uRe9vyMv6pUkdQEp6-c_HPlhVIHg9_E-CMxuA2qIPdU-licIfOe6FS11T54BKlQnj67Jdk2ZR-K6jvQMLhi5g2AirY9lw43q14bg2Ayu7jXBiw1wFuw',
            name: 'Ocean Theme',
            type: 'theme'
        },
        'placeholder_2': {
            url: '/api/placeholder/400/320',
            name: 'Space Theme',
            type: 'theme'
        },
        // Regular Avatars
        'duck_avatar': {
            url: 'https://lh7-us.googleusercontent.com/V05Ky_kXjTgEWudFslnIr1mGSHMXGnGBIn2mgOjc8-TuLzwKqOuExnW7GOQf8uAKCWcDkRAgOdQzGI6zC8Farp6-6toWbqWg6fnSg1fGlKTKc-Qe4MRIH4Q8YileAoqtR5XvgTVJXMOsej_w0t4Cu2Sy0Nr6sA',
            name: 'Duck Avatar',
            type: 'avatar',
            rarity: 'common'
        },
        'bear_avatar': {
            url: 'https://lh7-us.googleusercontent.com/6S_usPQDjmJvISyYbkU9osyenEjNebCz8kDE_Zx3uwNuU2DF9coxtDVpqgmF3wBdqFLmp3iDCUSDrHDdxSOzXAVkDRGXlYkJLh7F3QLNcJ26f3kjP5fZWRbia53K0gRydW2cs2m0BPfGR_hkCftkVZjEFpG1Ew',
            name: 'Bear Avatar',
            type: 'avatar',
            rarity: 'common'
        },
        'wolf_avatar': {
            url: 'https://lh7-us.googleusercontent.com/w9g3tzaaRuGaQ2SqUxiiVwp-rjcvMpgDn9jVNsRTxpzqOacFItpMeBOwk4Pq_Yk_2y9JcA8OXVG8iCWv7xSaUtT6DsDsCYDWEiko6cp_EHw6E2qi1GRFDbyXc8qVam9paSKH-B32lIwpwDtCMuR0Z2ck8fYi3w',
            name: 'Wolf Avatar',
            type: 'avatar',
            rarity: 'common'
        },
        'frog_avatar': {
            url: 'https://lh7-us.googleusercontent.com/eGaOENDSn4jTuW9op6n4ohX9juRwOrV40kQxUXnXV_BnHZBr2LyQw0qSzWmvBUWDGvJEy4DZZUf9l5xFR1fR35nGolHA6Km5oXieYExnzTUHNsLFRgUq4o07t3cKvIIRh79Oagzm9n4oC62nGfUaXEcaw7vleQ',
            name: 'Frog Avatar',
            type: 'avatar',
            rarity: 'common'
        },
        'pig_avatar': {
            url: 'https://lh7-us.googleusercontent.com/7XYuYX5wENim-PK9I-DFVONWm8wi05fFFvux8wotI_dPqQiKrXcESS7S03pHrK4XYKAwVlKKHPvVr7f3P1dgj5QleYsInYlIOP448s4SNw4bCkxFKHpEiU8qe9fa4alIE3SyERL-eCbWOeWtWXt4qGgMlhbmmw',
            name: 'Pig Avatar',
            type: 'avatar',
            rarity: 'common'
        },
        // Epic Avatars
        'mouse_avatar': {
            url: 'https://lh7-us.googleusercontent.com/l77cY3amoop7ZnhU8RyXBDpcZeDRuOidnlL8JOp4uh_sNB4RrFqzMIL3gTyXRyowdA5j2VxdIA7e3ehrrbROT_b7U2TPeE3Ku9nVBcMGI2uTIp4X0UMH8xXsC3LzTsBleekbA79vPKhmPl-Iy9ZI_fSCT30zbw',
            name: 'Mouse Avatar',
            type: 'avatar',
            rarity: 'epic'
        },
        'queso_avatar': {
            url: 'https://lh7-us.googleusercontent.com/obXrTaTsq1xc87VcMTKUu9FLT3PQlc9oNZFMRD8kzPEwmdhfZx-I_EoQuMlZBBt0p2Ta-BGlyb5PSvFB-tETgA8mVB_q2KMEL7TPyDhHIdcjD4Lc4RcUcfcoyQ8-pNal3nF7eDsVTkYcgZKiAi1CPZqfjgENdg',
            name: '🧀Queso🧀 Avatar',
            type: 'avatar',
            rarity: 'epic'
        },
        'monkey_avatar': {
            url: 'https://lh7-us.googleusercontent.com/Z1SAiYbNGevHZhUGDPoUcDlnVtm84hTkZxb9u8IOX65t3nXfzhKX8aCdwOOzl5BnqNfccb6WAw4nUPxiuLkJEXF6SoiufDvjJNRWR94NWbtstNPA7n4cSwWNfZlNnxXGnltdRwQVfyTU1b8iu8N_Ne28-jA1Uw',
            name: 'Monkey Avatar',
            type: 'avatar',
            rarity: 'epic'
        },
        'cat_avatar': {
            url: 'https://lh7-us.googleusercontent.com/tyaiBHWmO5PaP21jauHFO8FVjt43j9QqMKAtGB7SEvSIn47bi-1_3ZNtFE2LdSN2zJEEeXQZyA6CMAH6NrM4LSMLo5YX3Ol_ofbadqN2lnoKT956LpyYh-mGz7LWZrMTN-cImBh2apmPiFRoA5V8GNtpzS9BRQ',
            name: 'Cat Avatar',
            type: 'avatar',
            rarity: 'epic'
        },
        'robot_avatar': {
            url: 'https://lh7-us.googleusercontent.com/wzKtZhluCxlNQV0Fa1FwI0BpyL4MGpuzG7V6tA0ql_Jj-H3edrbzELvypqmBXmPBTkbxR-Da5OQtUCMF7ojiPqVlhcOYuUmIgxCv_yKhStTUYw0TwxXywk5oaaAJbaRFYjQ5Lq2ZPOYAim9-_MnqmfL8G0rc1w',
            name: 'Robot Avatar',
            type: 'avatar',
            rarity: 'epic'
        },
        // Legendary Avatars
        'rock_avatar': {
            url: 'https://lh7-us.googleusercontent.com/esoUiZg6LM-H9lPrhoyadWqvBnQteBbOFpPNTpiX6W-5TZ81teFalNCwOA6W0WsD2PUMPN_LTdcZ320laaPLV4mlluJdBDJ08XF41GHk9pf1rGKePsWoKBww4jtWxsEOdwt_nxPZkNoB_Gmbs5tPBZcmk4ByIw',
            name: 'Da Rock Avatar',
            type: 'avatar',
            rarity: 'legendary'
        },
        'electro_avatar': {
            url: 'https://lh7-us.googleusercontent.com/4oxa8N4__ki8xAP3XiGuuHEgOoXkTXj7Ha0T7bKdCDlZ-Wy1G_wPdmaX8gkAGmAh3Z5Gisyk7SYcySU-Axzy-IzVWYus31ldCLtOBGiALCkKwxkE_hKmtbA5H70KHip5eszZYJ9ehfp5A3svH72tPoXlAxu-ag',
            name: 'Electro Avatar',
            type: 'avatar',
            rarity: 'legendary'
        },
        'alien_avatar': {
            url: 'https://lh7-us.googleusercontent.com/Psh0syCV7o1c7rgmedBjYZVminiEz6MmRioH1Q_-MEd5xKXwStyWvl2qL0B58FoNRehYDMGlQCDjfwt3Yh38S8Q3fvZwdjqM4YCwUcL-DFgUXmS0qcwXwmPImHKNtO2SVV1makQX90O1sgu7Wstkf15U23AZZg',
            name: 'Alien Avatar',
            type: 'avatar',
            rarity: 'legendary'
        },
        'skull_avatar': {
            url: 'https://lh7-us.googleusercontent.com/OEGL63jMJgtdg4s8Lu7XSKi0dSIjBcU_z1s31GMIkkGO5bt1PMU0i91wkuX3SXQrTq6ecGrikBdNxXq54pMrnYqrK9y2Wqim-qJOfxA_Cn2RPOkA8P0HnP0ygVosOambs-EwUbz9KZBnY7BZflOYFqIgD2LM6g',
            name: 'Skull Avatar',
            type: 'avatar',
            rarity: 'legendary'
        },
        'mummy_avatar': {
            url: 'https://lh7-us.googleusercontent.com/BU7N3u63y8CsYnsuOVEtgI8SYIMxCrjt6-jyJncRJ4QR5fN48d3dVc8u2VGeJH9MFunkxVAf68LYi5aVqDWatEgeoGJNaQbdvRDIgna9TwONrQ97TH9-v3qvm5vSqJOdfLlGb2ZxPGKeM0EP_mn5602KgdsT0w',
            name: 'Mummy Avatar',
            type: 'avatar',
            rarity: 'legendary'
        },
        'galactic_void_avatar': {
            url: 'https://lh7-us.googleusercontent.com/5z9ZDquXDRawn8KaR_c2pGNprewTSRyExLBk6gy4a3281jZDIstFcJSdxqFdRGRr1V15_oRnJM7LiwbsmfwyIvM3q3l0OQ1zF-MNaYRUZ_h9cPOhDfnQHqWRA1_KRtHB5Y30Q9v7iUZ6z9UcE7l9J5C5d83KDg',
            name: 'Galactic Void Avatar',
            type: 'avatar',
            rarity: 'legendary'
        },
        // Dev Only Avatars
        'void_bot_avatar': {
            url: 'https://lh7-us.googleusercontent.com/mevPAzUzsGnUs9znx6FU7X-xQjjc9qkjUa9JWfKLizWf2B8MtcmphxDjYe1Fq80LDNBMld0B9l_zhL1Xqq2SXrgOaZVoQB8B06E1SUzJ73xyX7PBMbKuyk1drgL6G-B_aHfxrddeI1ZLDTulfbEJIXdVNcC8hQ',
            name: 'Void Bot Avatar',
            type: 'avatar',
            rarity: 'dev'
        },
        'design_master_avatar': {
            url: 'https://lh7-us.googleusercontent.com/pYFqazpZszh0XVrhL692zyJoQ7Vi1VWfTNHuMYsqrC1ByUCDTQkpPesBi2P6rR28yWb0ZiPkxwU9c7EaZU_iO3p0l0tP2uo72RAqdX8gQXXjd6e1CpmtBMe-qxIy2VmxEaR0L1AKPucoZ6h5GuX-A8tOJLzFiA',
            name: 'Design Master Avatar',
            type: 'avatar',
            rarity: 'dev'
        }
    },

    // Load a user's theme and avatar preferences with better error handling and caching
    async loadUserPreferences(userId) {
        try {
            console.log("Loading user preferences");
            
            // Import needed Firebase functions
            const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
            
            // If offline, use cached preferences if available
            if (!window.isOnline) {
                console.log("Device is offline, using cached preferences");
                return {
                    theme: this.currentTheme,
                    avatar: this.currentAvatar
                };
            }
            
            // Check if user has any equipped items in user settings
            const userSettingsRef = doc(window.db, 'user_settings', userId);
            
            try {
                const userSettingsDoc = await getDoc(userSettingsRef);
                
                if (userSettingsDoc.exists()) {
                    const settings = userSettingsDoc.data();
                    
                    // Load theme if equipped
                    if (settings.equippedTheme && this.items[settings.equippedTheme]) {
                        console.log("Found equipped theme:", settings.equippedTheme);
                        this.equipTheme(settings.equippedTheme);
                        this.currentTheme = settings.equippedTheme;
                        
                        // Update theme UI
                        this.updateShopItemUI(settings.equippedTheme, 'theme', 'equip');
                    }
                    
                    // Load avatar if equipped
                    if (settings.equippedAvatar && this.items[settings.equippedAvatar]) {
                        console.log("Found equipped avatar:", settings.equippedAvatar);
                        this.currentAvatar = settings.equippedAvatar;
                        
                        // Update avatar UI
                        this.updateShopItemUI(settings.equippedAvatar, 'avatar', 'equip');
                    }
                    
                    return {
                        theme: settings.equippedTheme,
                        avatar: settings.equippedAvatar
                    };
                }
            } catch (error) {
                console.error("Error loading user settings:", error);
                
                // If there was an error but we have cached preferences, use those
                if (this.currentTheme || this.currentAvatar) {
                    console.log("Using cached preferences after error");
                    return {
                        theme: this.currentTheme,
                        avatar: this.currentAvatar
                    };
                }
            }
            
            return {
                theme: null,
                avatar: null
            };
        } catch (error) {
            console.error("Error loading user preferences:", error);
            window.showNotification("Couldn't load your preferences. Please try again.", "error");
            return {
                theme: null,
                avatar: null
            };
        }
    },

    // Update the shop UI for a specific item
    updateShopItemUI(itemId, itemType, action) {
        if (!itemId) return;
        
        // Find all items of this type
        const items = document.querySelectorAll(`.shop-item[data-type="${itemType}"]`);
        
        // Reset all items of this type
        items.forEach(item => {
            const itemDataId = item.dataset.itemId;
            if (!itemDataId) return; // Skip items without data-item-id
            
            if (action === 'equip' && itemDataId === itemId) {
                // Equip this specific item
                item.classList.add('equipped');
                item.classList.remove('owned');
                
                const button = item.querySelector('.buy-button');
                if (button) {
                    button.textContent = "Unequip";
                    button.classList.add('unequip');
                    button.classList.remove('equip');
                    button.classList.remove('loading');
                    button.disabled = false;
                }
            } else if (item.classList.contains('equipped') && itemDataId !== itemId) {
                // Unequip other equipped items
                item.classList.remove('equipped');
                item.classList.add('owned');
                
                const button = item.querySelector('.buy-button');
                if (button) {
                    button.textContent = "Equip";
                    button.classList.add('equip');
                    button.classList.remove('unequip');
                    button.classList.remove('loading');
                    button.disabled = false;
                }
            }
        });
    },

    // Check which items a user has purchased - with improved caching and batch operations
    async checkPurchasedItems(userId) {
        try {
            // Return cached items if still valid
            if (window.userDataCache.isPurchasedItemsCacheValid()) {
                console.log("Using cached purchased items", Object.keys(window.userDataCache.purchasedItems).length);
                return window.userDataCache.purchasedItems;
            }
            
            console.log("Checking user purchased items from database");
            
            // Import needed Firebase functions
            const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
            
            if (!window.isOnline) {
                console.log("Device is offline, using cached items if available");
                if (Object.keys(window.userDataCache.purchasedItems).length > 0) {
                    return window.userDataCache.purchasedItems;
                }
                // If no cached items and offline, return empty object
                return {};
            }
            
            // Get user purchases collection
            const purchasedItems = {};
            
            try {
                const purchasesRef = collection(window.db, 'user_purchases', userId, 'items');
                const purchasesSnapshot = await getDocs(purchasesRef);
                
                purchasesSnapshot.forEach(doc => {
                    const data = doc.data();
                    purchasedItems[data.itemId] = true;
                });
                
                // Cache the purchased items
                window.userDataCache.purchasedItems = purchasedItems;
                window.userDataCache.lastPurchaseCheck = Date.now();
                
                console.log(`User purchased items: ${Object.keys(purchasedItems).length}`);
                
                // Update UI for purchased items
                this.updatePurchasedItemsUI(purchasedItems);
            } catch (error) {
                console.error("Error fetching purchased items:", error);
                // If we have cached items and got an error, use the cache
                if (Object.keys(window.userDataCache.purchasedItems).length > 0) {
                    console.log("Using cached items after error");
                    return window.userDataCache.purchasedItems;
                }
            }
            
            return purchasedItems;
        } catch (error) {
            console.error("Error checking purchased items:", error);
            window.showNotification("Failed to load your inventory", "error");
            
            // Return cached items if available, otherwise empty object
            return Object.keys(window.userDataCache.purchasedItems).length > 0 
                ? window.userDataCache.purchasedItems 
                : {};
        }
    },

    // Update UI for purchased items with better error handling for missing elements
    updatePurchasedItemsUI(purchasedItems) {
        if (!purchasedItems || Object.keys(purchasedItems).length === 0) {
            console.log("No purchased items to update UI for");
            return;
        }
        
        Object.keys(purchasedItems).forEach(itemId => {
            const item = this.items[itemId];
            if (!item) return;
            
            const button = document.querySelector(`.buy-button[data-item-id="${itemId}"]`);
            if (button) {
                const itemType = item.type;
                
                // Change to "Equip" if not already equipped
                if ((itemType === 'theme' && itemId !== this.currentTheme) ||
                    (itemType === 'avatar' && itemId !== this.currentAvatar)) {
                    button.textContent = "Equip";
                    button.classList.add('equip');
                    button.classList.remove('loading');
                    button.disabled = false;
                    
                    // Add owned class to the shop item
                    const shopItem = button.closest('.shop-item');
                    if (shopItem) {
                        shopItem.classList.add('owned');
                    }
                }
            }
        });
    },

    // Equip a theme with error handling
    equipTheme(themeId) {
        if (!themeId || !this.items[themeId] || this.items[themeId].type !== 'theme') {
            console.error("Theme not found:", themeId);
            return false;
        }
        
        try {
            const themeBackground = document.getElementById('theme-background');
            if (!themeBackground) {
                console.error("Theme background element not found");
                return false;
            }
            
            // Set the theme image
            themeBackground.src = this.items[themeId].url;
            themeBackground.alt = this.items[themeId].name;
            
            // Show the theme with animation
            themeBackground.style.display = 'block';
            setTimeout(() => {
                themeBackground.classList.add('active');
            }, 50);
            
            this.currentTheme = themeId;
            
            console.log(`Equipped theme: ${themeId}`);
            return true;
        } catch (error) {
            console.error("Error equipping theme:", error);
            return false;
        }
    },

    // Unequip the current theme
    unequipTheme() {
        try {
            const themeBackground = document.getElementById('theme-background');
            if (!themeBackground) {
                console.error("Theme background element not found");
                return false;
            }
            
            // Hide the theme with animation
            themeBackground.classList.remove('active');
            
            // Clear src after animation is complete
            setTimeout(() => {
                themeBackground.style.display = 'none';
                themeBackground.src = '';
                themeBackground.alt = '';
            }, 1000);
            
            this.currentTheme = null;
            
            console.log("Theme unequipped");
            return true;
        } catch (error) {
            console.error("Error unequipping theme:", error);
            return false;
        }
    },

    // Save user preferences to user settings with retry mechanism
    async saveUserPreferences(userId, preferences) {
        try {
            console.log(`Saving user preferences for user: ${userId}`, preferences);
            
            // Import needed Firebase functions
            const { doc, setDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
            
            // Only the user can modify their own settings
            if (userId !== window.auth.currentUser?.uid) {
                throw new Error("Unauthorized access");
            }
            
            if (!window.isOnline) {
                // If offline, queue the operation
                window.addPendingOperation(this.saveUserPreferences.bind(this), userId, preferences);
                window.showNotification("You're offline. Changes will be saved when you reconnect.", "error");
                return false;
            }
            
            const userSettingsRef = doc(window.db, 'user_settings', userId);
            
            try {
                // Add to operation queue instead of direct operation
                await window.queueOperation(async () => {
                    return await setDoc(userSettingsRef, {
                        equippedTheme: preferences.theme,
                        equippedAvatar: preferences.avatar,
                        lastUpdated: serverTimestamp()
                    }, { merge: true });
                });
                
                console.log("User preferences saved successfully");
                return true;
            } catch (error) {
                console.error("Error saving preferences:", error);
                window.showNotification("Failed to save preferences. Please try again.", "error");
                return false;
            }
        } catch (error) {
            console.error("Error preparing to save user preferences:", error);
            window.showNotification("Failed to save your preferences", "error");
            return false;
        }
    },

    // Get all avatars of a specific rarity
    getAvatarsByRarity(rarity) {
        return Object.entries(this.items)
            .filter(([id, item]) => item.type === 'avatar' && item.rarity === rarity && !id.includes('placeholder'))
            .map(([id, item]) => ({
                id,
                ...item
            }));
    },

    // Check if a user is a developer - now with caching
    devEmailsCache: null,
    async isUserDeveloper(email) {
        if (!email) return false;
        
        // Hardcoded dev emails for immediate response
        const devEmails = ['void.client@yandex.com', 'queso@colourcoder.com'];
        
        // Check if email is in the hardcoded list
        return devEmails.includes(email.toLowerCase());
    },

    // Verify developer access to dev items with better caching
    async verifyDevAccess() {
        try {
            if (!window.auth.currentUser) return false;
            
            const userEmail = window.auth.currentUser.email;
            if (!userEmail) return false;
            
            const isDev = await this.isUserDeveloper(userEmail);
            
            // If not a dev but has a dev tab, hide it
            const devTab = document.querySelector('.shop-tab[data-tab="dev"]');
            if (devTab) {
                if (isDev) {
                    devTab.style.display = 'block';
                } else {
                    devTab.style.display = 'none';
                }
            }
            
            // Import needed Firebase functions
            const { doc, getDoc, updateDoc } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
            
            // If user has a dev avatar but is not a developer, unequip it
            if (!isDev && this.currentAvatar && this.items[this.currentAvatar]?.rarity === 'dev') {
                console.log("Non-dev user has dev avatar - removing");
                this.currentAvatar = null;
                
                // Save preferences without the dev avatar
                await this.saveUserPreferences(window.auth.currentUser.uid, {
                    theme: this.currentTheme,
                    avatar: null
                });
                
                try {
                    // Update leaderboard without the avatar via queue
                    const leaderboardRef = doc(window.db, 'leaderboard', window.auth.currentUser.uid);
                    
                    await window.queueOperation(async () => {
                        const leaderboardDoc = await getDoc(leaderboardRef);
                        
                        if (leaderboardDoc.exists()) {
                            await updateDoc(leaderboardRef, {
                                equippedAvatar: null
                            });
                        }
                    });
                    
                    // Refresh leaderboard
                    if (window.refreshLeaderboard) {
                        window.refreshLeaderboard();
                    }
                } catch (error) {
                    console.error("Error updating leaderboard for non-dev:", error);
                }
            }
            
            return isDev;
        } catch (error) {
            console.error("Error verifying dev access:", error);
            return false;
        }
    }
};

/**
 * Avatar Roll System - Handles avatar gambling system
 */
window.avatarRollSystem = {
    // Config
    minBet: 50000,
    maxBet: 1000000,
    maxRollsPerDay: 2,
    cooldownHours: 24,

    // Current state
    currentBet: 100000,
    rollsRemaining: 2,
    lastRollTimestamp: null,
    isRolling: false,

    // DOM elements
    rollButton: null,
    rollSlider: null,
    rollAmountDisplay: null,
    rollsRemainingDisplay: null,
    legendaryChanceDisplay: null,
    epicChanceDisplay: null,
    rareChanceDisplay: null,
    commonChanceDisplay: null,
    rollAnimationContainer: null,
    rollAnimationTrack: null,
    rollResultContainer: null,
    rollResultImage: null,
    rollResultImg: null,
    rollResultName: null,
    closeResultButton: null,

    // Initialize the roll system
    init() {
        // Get DOM elements
        this.rollButton = document.getElementById('rollButton');
        this.rollSlider = document.getElementById('rollAmountSlider');
        this.rollAmountDisplay = document.getElementById('rollAmount');
        this.rollsRemainingDisplay = document.getElementById('rollsRemaining');
        this.legendaryChanceDisplay = document.getElementById('legendaryChance');
        this.epicChanceDisplay = document.getElementById('epicChance');
        this.rareChanceDisplay = document.getElementById('rareChance');
        this.commonChanceDisplay = document.getElementById('commonChance');
        this.rollAnimationContainer = document.getElementById('rollAnimationContainer');
        this.rollAnimationTrack = document.getElementById('rollAnimationTrack');
        this.rollResultContainer = document.getElementById('rollResultContainer');
        this.rollResultImage = document.getElementById('rollResultImage');
        this.rollResultImg = document.getElementById('rollResultImg');
        this.rollResultName = document.getElementById('rollResultName');
        this.closeResultButton = document.getElementById('closeResultButton');
        
        if (!this.rollButton || !this.rollSlider) {
            console.log("Roll system elements not found, will initialize later");
            return;
        }
        
        // Set up slider event
        this.rollSlider.addEventListener('input', () => this.updateBetAmount());
        
        // Set up roll button
        this.rollButton.addEventListener('click', () => this.startRoll());
        
        // Set up close result button
        this.closeResultButton.addEventListener('click', () => this.hideResult());
        
        // Initial update
        this.updateBetAmount();
        
        console.log("Avatar Roll System initialized");
    },

    // Update the displayed bet amount and chances
    updateBetAmount() {
        if (!this.rollSlider || !this.rollAmountDisplay) return;
        
        this.currentBet = parseInt(this.rollSlider.value);
        this.rollAmountDisplay.textContent = this.currentBet.toLocaleString();
        
        // Calculate chances based on bet amount
        const ratio = (this.currentBet - this.minBet) / (this.maxBet - this.minBet);
        
        // Legendary chance increases with bet amount (1% to 4%)
        const legendaryChance = 1 + (ratio * 3);
        // Epic chance increases with bet amount (3% to 10%)
        const epicChance = 3 + (ratio * 7);
        // Rare chance increases slightly (10% to 20%)
        const rareChance = 10 + (ratio * 10);
        // Common chance is fixed at about 25%
        const commonChance = 25;
        // The rest (53% to 61%) is "nothing" but we don't show this to the user
        
        // Update displays
        if (this.legendaryChanceDisplay) this.legendaryChanceDisplay.textContent = `${legendaryChance.toFixed(1)}%`;
        if (this.epicChanceDisplay) this.epicChanceDisplay.textContent = `${epicChance.toFixed(1)}%`;
        if (this.rareChanceDisplay) this.rareChanceDisplay.textContent = `${rareChance.toFixed(1)}%`;
        if (this.commonChanceDisplay) this.commonChanceDisplay.textContent = `${commonChance.toFixed(1)}%`;
    },

    // Check user's roll eligibility and available rolls
    async checkRollEligibility() {
        try {
            if (!window.auth.currentUser) {
                window.showNotification('Please log in to use Avatar Roll', 'error');
                return false;
            }
            
            if (!window.isOnline) {
                window.showNotification('You need to be online to roll for avatars', 'error');
                return false;
            }
            
            // Import needed Firebase functions
            const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
            
            // Get user account details - uses cache when possible
            const userDetails = await window.voidAccounting.getUserAccountDetails(window.auth.currentUser.uid);
            
            if (userDetails.accountBalance < this.currentBet) {
                window.showNotification(`Not enough coins for this roll. You need ${this.currentBet.toLocaleString()} coins.`, 'error');
                return false;
            }
            
            // Check roll history for today
            const userId = window.auth.currentUser.uid;
            
            let rollsToday = 0;
            
            try {
                const rollHistoryRef = collection(window.db, 'avatar_rolls', userId, 'history');
                
                // Get today's date (start of day)
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                // Query rolls from today
                const q = query(
                    rollHistoryRef,
                    where('timestamp', '>=', today)
                );
                
                const rollsSnapshot = await getDocs(q);
                rollsToday = rollsSnapshot.size;
            } catch (error) {
                console.error("Error checking roll history:", error);
                window.showNotification("Error checking roll history", "error");
                return false;
            }
            
            this.rollsRemaining = Math.max(0, this.maxRollsPerDay - rollsToday);
            
            // Update display
            if (this.rollsRemainingDisplay) {
                this.rollsRemainingDisplay.textContent = this.rollsRemaining;
            }
            
            if (this.rollsRemaining <= 0) {
                window.showNotification(`You've used all your avatar rolls for today. Come back tomorrow!`, 'error');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error("Error checking roll eligibility:", error);
            window.showNotification('Error checking roll eligibility', 'error');
            return false;
        }
    },

    // Perform the roll with better error handling
    async startRoll() {
        if (this.isRolling) return;
        
        // Reinitialize elements if needed
        if (!this.rollButton) {
            this.init();
            if (!this.rollButton) {
                console.error("Roll button not found");
                return;
            }
        }
        
        try {
            this.isRolling = true;
            this.rollButton.disabled = true;
            
            // Check eligibility
            const canRoll = await this.checkRollEligibility();
            if (!canRoll) {
                this.rollButton.disabled = false;
                this.isRolling = false;
                return;
            }
            
            // Show animation
            await this.showRollAnimation();
            
            // Process the roll - may return null for "nothing" outcome
            const result = await this.processRoll();
            
            // Show result - handles "nothing" outcome
            this.showResult(result);
            
            // Update roll counts
            this.rollsRemaining--;
            if (this.rollsRemainingDisplay) {
                this.rollsRemainingDisplay.textContent = this.rollsRemaining;
            }
            
            // Enable button if rolls remain
            if (this.rollsRemaining > 0) {
                this.rollButton.disabled = false;
            }
            
            this.isRolling = false;
        } catch (error) {
            console.error("Error during roll:", error);
            window.showNotification('Error processing roll', 'error');
            this.rollButton.disabled = false;
            this.isRolling = false;
        }
    },

    // Process the actual roll logic and database updates
    async processRoll() {
        try {
            // Import needed Firebase functions
            const { doc, getDoc, collection, writeBatch, addDoc } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
            
            // Calculate probabilities based on bet amount
            const ratio = (this.currentBet - this.minBet) / (this.maxBet - this.minBet);
            
            const legendaryChance = 1 + (ratio * 3);  // 1% to 4%
            const epicChance = 3 + (ratio * 7);       // 3% to 10%
            const rareChance = 10 + (ratio * 10);     // 10% to 20%
            const commonChance = 25;                  // Fixed 25%
            // That leaves 53%-61% chance for "nothing"
            
            // Roll for rarity first
            const rarityRoll = Math.random() * 100;
            let rarity;
            
            if (rarityRoll < legendaryChance) {
                rarity = 'legendary';
            } else if (rarityRoll < (legendaryChance + epicChance)) {
                rarity = 'epic';
            } else if (rarityRoll < (legendaryChance + epicChance + rareChance)) {
                rarity = 'rare';
            } else if (rarityRoll < (legendaryChance + epicChance + rareChance + commonChance)) {
                rarity = 'common';
            } else {
                // "Nothing" outcome - return null after taking coins
                // Process deduction of coins but don't add any purchase
                await this.processBetDeduction();
                
                // Return null to indicate nothing was won
                return null;
            }
            
            // Get available avatars of that rarity
            let availableAvatars = window.itemManager.getAvatarsByRarity(rarity);
            
            // If no avatars of that rarity, fall back to common
            if (availableAvatars.length === 0) {
                rarity = 'common';
                availableAvatars = window.itemManager.getAvatarsByRarity('common');
            }
            
            // Get purchased items
            const purchasedItems = await window.itemManager.checkPurchasedItems(window.auth.currentUser.uid);
            
            // Randomly select from available avatars
            const selectedAvatar = availableAvatars[Math.floor(Math.random() * availableAvatars.length)];
            
            // Check if the user already owns this avatar
            const isAlreadyOwned = purchasedItems[selectedAvatar.id];
            
            // Use a batch for better transaction consistency
            const batch = writeBatch(window.db);
            const userId = window.auth.currentUser.uid;
            let userData;
            let newBalance;
            
            try {
                const userRef = doc(window.db, 'users', userId);
                const userDoc = await getDoc(userRef);
                
                if (!userDoc.exists()) {
                    throw new Error("User not found");
                }
                
                userData = userDoc.data();
                
                // Calculate new balance
                newBalance = userData.accountBalance - this.currentBet;
                
                // Update user account balance
                batch.update(userRef, {
                    accountBalance: newBalance
                });
                
                // Update or create leaderboard entry
                const leaderboardRef = doc(window.db, 'leaderboard', userId);
                const leaderboardDoc = await getDoc(leaderboardRef);
                
                if (leaderboardDoc.exists()) {
                    batch.update(leaderboardRef, {
                        accountBalance: newBalance
                    });
                } else {
                    batch.set(leaderboardRef, {
                        username: userData.username || 'Unknown',
                        accountBalance: newBalance,
                        joinDate: new Date()
                    });
                }
                
                // Add to user purchases only if not already owned
                if (!isAlreadyOwned) {
                    const purchaseRef = doc(collection(window.db, 'user_purchases', userId, 'items'));
                    batch.set(purchaseRef, {
                        itemId: selectedAvatar.id,
                        itemType: 'avatar',
                        price: 0, // Free from roll
                        purchaseDate: new Date(),
                        itemName: selectedAvatar.name,
                        acquisition: 'roll'
                    });
                }
                
                // Commit the batch
                await batch.commit();
                
                // Record the roll in history and transaction (not in batch to avoid overload)
                window.queueOperation(async () => {
                    await addDoc(collection(window.db, 'avatar_rolls', userId, 'history'), {
                        betAmount: this.currentBet,
                        timestamp: new Date(),
                        result: selectedAvatar.id,
                        rarity: rarity,
                        prevBalance: userData.accountBalance,
                        newBalance: newBalance,
                        isDuplicate: isAlreadyOwned
                    });
                });
                
                window.queueOperation(async () => {
                    await addDoc(collection(window.db, 'transactions'), {
                        userId: userId,
                        transactionType: 'avatar_roll',
                        amount: this.currentBet,
                        timestamp: new Date(),
                        prevBalance: userData.accountBalance,
                        newBalance: newBalance,
                        metadata: {
                            avatarId: selectedAvatar.id,
                            rarity: rarity,
                            isDuplicate: isAlreadyOwned
                        }
                    });
                });
                
            } catch (error) {
                console.error("Error processing roll in batch:", error);
                throw error;
            }
            
            // Update cache with the newly acquired item (only if not already owned)
            if (!isAlreadyOwned) {
                window.userDataCache.purchasedItems[selectedAvatar.id] = true;
            }
            
            // Update user data cache
            window.userDataCache.userData = {
                ...userData,
                accountBalance: newBalance
            };
            window.userDataCache.lastUpdated = Date.now();
            
            // Update balance displays
            const shopBalanceDisplay = document.getElementById('shop-balance-display');
            const balanceDisplay = document.getElementById('balance-display');
            
            if (shopBalanceDisplay) shopBalanceDisplay.textContent = newBalance.toLocaleString();
            if (balanceDisplay) balanceDisplay.textContent = newBalance.toLocaleString();
            
            // Return the result including whether it's a duplicate
            return {
                avatar: selectedAvatar,
                rarity: rarity,
                isDuplicate: isAlreadyOwned
            };
        } catch (error) {
            console.error("Error processing roll:", error);
            window.showNotification("Failed to process your roll. Please try again.", "error");
            throw error;
        }
    },
    
    // Separate function to just deduct bet amount for "nothing" outcome
    async processBetDeduction() {
        try {
            // Import needed Firebase functions
            const { doc, getDoc, collection, writeBatch, addDoc } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
            
            // Use a batch for better transaction consistency
            const batch = writeBatch(window.db);
            const userId = window.auth.currentUser.uid;
            let userData;
            let newBalance;
            
            const userRef = doc(window.db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                throw new Error("User not found");
            }
            
            userData = userDoc.data();
            
            // Calculate new balance
            newBalance = userData.accountBalance - this.currentBet;
            
            // Update user account balance
            batch.update(userRef, {
                accountBalance: newBalance
            });
            
            // Update or create leaderboard entry
            const leaderboardRef = doc(window.db, 'leaderboard', userId);
            const leaderboardDoc = await getDoc(leaderboardRef);
            
            if (leaderboardDoc.exists()) {
                batch.update(leaderboardRef, {
                    accountBalance: newBalance
                });
            } else {
                batch.set(leaderboardRef, {
                    username: userData.username || 'Unknown',
                    accountBalance: newBalance,
                    joinDate: new Date()
                });
            }
            
            // Commit the batch
            await batch.commit();
            
            // Record the roll in history and transaction (not in batch to avoid overload)
            window.queueOperation(async () => {
                await addDoc(collection(window.db, 'avatar_rolls', userId, 'history'), {
                    betAmount: this.currentBet,
                    timestamp: new Date(),
                    result: 'nothing',
                    rarity: 'nothing',
                    prevBalance: userData.accountBalance,
                    newBalance: newBalance
                });
            });
            
            window.queueOperation(async () => {
                await addDoc(collection(window.db, 'transactions'), {
                    userId: userId,
                    transactionType: 'avatar_roll',
                    amount: this.currentBet,
                    timestamp: new Date(),
                    prevBalance: userData.accountBalance,
                    newBalance: newBalance,
                    metadata: {
                        result: 'nothing'
                    }
                });
            });
            
            // Update user data cache
            window.userDataCache.userData = {
                ...userData,
                accountBalance: newBalance
            };
            window.userDataCache.lastUpdated = Date.now();
            
            // Update balance displays
            const shopBalanceDisplay = document.getElementById('shop-balance-display');
            const balanceDisplay = document.getElementById('balance-display');
            
            if (shopBalanceDisplay) shopBalanceDisplay.textContent = newBalance.toLocaleString();
            if (balanceDisplay) balanceDisplay.textContent = newBalance.toLocaleString();
            
            return { success: true, newBalance: newBalance };
        } catch (error) {
            console.error("Error processing bet deduction:", error);
            throw error;
        }
    },

    // Show animation for rolling - with legendary avatars in animation
    async showRollAnimation() {
        if (!this.rollAnimationContainer || !this.rollAnimationTrack) return;
        
        try {
            // Clear previous items
            this.rollAnimationTrack.innerHTML = '';
            
            // Create animation items
            const commonAvatars = window.itemManager.getAvatarsByRarity('common');
            const rareAvatars = window.itemManager.getAvatarsByRarity('rare');
            const epicAvatars = window.itemManager.getAvatarsByRarity('epic');
            const legendaryAvatars = window.itemManager.getAvatarsByRarity('legendary');
            
            // If rare is empty, use common
            const rareItems = rareAvatars.length > 0 ? rareAvatars : commonAvatars;
            
            // All avatars to use in animation
            const allAvatars = [
                ...commonAvatars,
                ...rareItems,
                ...epicAvatars,
                ...legendaryAvatars,
                ...commonAvatars,
                ...rareItems
            ];
            
            // Add some "nothing" placeholders - grey boxes for animation
            const nothingItems = [...Array(10)].map(() => ({
                id: 'nothing',
                url: '/api/placeholder/400/320',
                name: 'Nothing',
                type: 'avatar',
                rarity: 'nothing'
            }));
            
            // Shuffle the array
            const shuffled = [...allAvatars, ...nothingItems].sort(() => Math.random() - 0.5);
            
            // Add at least 30 items to the animation
            const animationItems = [];
            while (animationItems.length < 30) {
                animationItems.push(...shuffled);
            }
            
            // Create HTML elements for each item
            animationItems.slice(0, 30).forEach(avatar => {
                const item = document.createElement('div');
                item.className = `roll-animation-item ${avatar.rarity}`;
                
                const img = document.createElement('img');
                img.src = avatar.url;
                img.alt = avatar.name;
                
                item.appendChild(img);
                this.rollAnimationTrack.appendChild(item);
            });
            
            // Show the animation container
            this.rollAnimationContainer.style.display = 'block';
            
            // Reset track position
            this.rollAnimationTrack.style.transition = 'none';
            this.rollAnimationTrack.style.transform = 'translateX(0)';
            
            // Force reflow
            void this.rollAnimationTrack.offsetWidth;
            
            // Start animation after a short delay
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Run animation
            this.rollAnimationTrack.style.transition = 'transform 5s cubic-bezier(0.1, 0.8, 0.2, 1)';
            
            // Calculate ending position
            const trackWidth = this.rollAnimationTrack.scrollWidth;
            const containerWidth = this.rollAnimationContainer.clientWidth;
            
            // Randomize ending position somewhat
            const baseEndPosition = -(trackWidth - containerWidth) * 0.7;
            const randomOffset = Math.random() * 300 - 150;
            const endPosition = baseEndPosition + randomOffset;
            
            this.rollAnimationTrack.style.transform = `translateX(${endPosition}px)`;
            
            // Wait for animation to complete
            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
            console.error("Error in roll animation:", error);
        }
    },

    // Show the result of the roll - Added handling for "nothing" outcome and duplicates
    showResult(result) {
        if (!this.rollResultContainer) return;
        
        try {
            // Hide animation container
            if (this.rollAnimationContainer) {
                this.rollAnimationContainer.style.display = 'none';
            }
            
            // Check if result is null (nothing outcome)
            if (!result) {
                // Show "Nothing" result
                if (this.rollResultImg) {
                    this.rollResultImg.src = '/api/placeholder/400/320';
                    this.rollResultImg.alt = 'Nothing';
                }
                
                if (this.rollResultName) {
                    this.rollResultName.textContent = 'Nothing';
                    this.rollResultName.className = 'roll-result-name nothing';
                }
                
                if (this.rollResultImage) {
                    this.rollResultImage.className = 'roll-result-image nothing';
                }
                
                // Change title to show it's a loss
                const titleElement = this.rollResultContainer.querySelector('.roll-result-title');
                if (titleElement) {
                    titleElement.textContent = 'Better luck next time!';
                }
                
                // Show result container
                this.rollResultContainer.style.display = 'block';
                
                // Show outcome notification
                window.showNotification(`You rolled and got nothing. Try again!`, 'error');
                return;
            }
            
            // Normal avatar result
            if (this.rollResultImg) {
                this.rollResultImg.src = result.avatar.url;
                this.rollResultImg.alt = result.avatar.name;
            }
            
            if (this.rollResultName) {
                this.rollResultName.textContent = result.avatar.name;
                this.rollResultName.className = `roll-result-name ${result.rarity}`;
            }
            
            if (this.rollResultImage) {
                this.rollResultImage.className = `roll-result-image ${result.rarity}`;
            }
            
            // Update title based on whether it's a duplicate
            const titleElement = this.rollResultContainer.querySelector('.roll-result-title');
            if (titleElement) {
                if (result.isDuplicate) {
                    titleElement.textContent = 'You already own this avatar:';
                } else {
                    titleElement.textContent = 'Congratulations! You got:';
                }
            }
            
            // Show result container
            this.rollResultContainer.style.display = 'block';
            
            // Only update shop UI if this is a new item (not a duplicate)
            if (!result.isDuplicate) {
                // Update shop UI to show item as owned
                const shopItem = document.querySelector(`.shop-item[data-item-id="${result.avatar.id}"]`);
                if (shopItem) {
                    shopItem.classList.add('owned');
                    
                    const button = shopItem.querySelector('.buy-button');
                    if (button) {
                        button.textContent = "Equip";
                        button.classList.add('equip');
                        button.classList.remove('unequip');
                        button.classList.remove('loading');
                        button.disabled = false;
                    }
                }
            }
            
            // Show success notification
            if (result.isDuplicate) {
                window.showNotification(`You already own the ${result.rarity} ${result.avatar.name}!`, 'error');
            } else {
                window.showNotification(`Congratulations! You won the ${result.rarity} ${result.avatar.name}!`, 'success');
            }
        } catch (error) {
            console.error("Error showing roll result:", error);
        }
    },

    // Hide result and reset UI
    hideResult() {
        if (this.rollResultContainer) {
            this.rollResultContainer.style.display = 'none';
        }
    }
};

/**
 * Coin Purchase Functions
 */

// Function to show coin purchase popup
window.showCoinPurchasePopup = function(itemId, coinAmount, price, stripeUrl) {
    if (!window.auth.currentUser) {
        window.showNotification('Please log in to purchase coins', 'error');
        return;
    }
    
    const coinPurchasePopup = document.getElementById('coin-purchase-popup');
    
    // Update popup content for the selected package
    coinPurchasePopup.innerHTML = `
        <h2>Buy Void Coins</h2>
        <div class="coin-amount">${coinAmount.toLocaleString()} Coins</div>
        <p>Complete your purchase securely through our payment provider. Click the button below to continue to checkout. If the payment menu is blocked when you press continue to checkout just press the button saying "Continue to checkout using PRX" and this should allow you to view the payment menu.</p>
        <button id="buy-coins-button" data-item-id="${itemId}" data-url="${stripeUrl}">Continue to Checkout</button>
        <button id="buy-coins-prx-button" data-item-id="${itemId}" data-url="${stripeUrl}">Continue to checkout using PRX</button>
        <button id="close-coin-popup">Cancel</button>
    `;
    
    // Show the popup
    coinPurchasePopup.style.display = 'block';
    
    // Add visible class after a short delay for animation
    setTimeout(() => {
        coinPurchasePopup.classList.add('visible');
        
        // Set up the Stripe checkout button
        const buyCoinsButton = document.getElementById('buy-coins-button');
        if (buyCoinsButton) {
            buyCoinsButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Store the amount in localStorage for completion handling
                localStorage.setItem('coinPurchaseAmount', coinAmount.toString());
                
                // Open the Stripe URL
                const url = this.getAttribute('data-url');
                window.open(url, '_blank');
            });
        }
        
        // Set up the PRX checkout button
        const buyCoinsProxyButton = document.getElementById('buy-coins-prx-button');
        if (buyCoinsProxyButton) {
            buyCoinsProxyButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Close current popup
                window.closeCoinPopup();
                
                // Show PRX info popup
                window.showPrxInfoPopup(itemId, coinAmount, stripeUrl);
            });
        }
        
        // Set up the close button
        const closeBtn = document.getElementById('close-coin-popup');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                window.closeCoinPopup();
            });
        }
    }, 10);
};

// Function to show PRX info popup
window.showPrxInfoPopup = function(itemId, coinAmount, stripeUrl) {
    const prxInfoPopup = document.getElementById('prx-info-popup');
    
    // Update popup content
    prxInfoPopup.innerHTML = `
        <h2>PRX Payment Method</h2>
        <p>You selected PRX please note you may see a different currency to pay with once you're in the panel. To ensure your payment goes through please make sure you select the USD currency. Unless there is no option to do so.</p>
        <button id="prx-continue-button" data-item-id="${itemId}" data-url="${stripeUrl}">Continue to Checkout</button>
        <button id="close-prx-popup">Cancel</button>
    `;
    
    // Show the popup
    prxInfoPopup.style.display = 'block';
    
    // Add visible class after a short delay for animation
    setTimeout(() => {
        prxInfoPopup.classList.add('visible');
        
        // Set up the continue button
        const prxContinueButton = document.getElementById('prx-continue-button');
        if (prxContinueButton) {
            prxContinueButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Store the amount in localStorage for completion handling
                localStorage.setItem('coinPurchaseAmount', coinAmount.toString());
                
                // Get the URL to proxy
                const url = this.getAttribute('data-url');
                
                try {
                    // Direct access to UV config using the format from your example
                    // Note: Using the standard __uv$config format, not **uv$config
                    const encodedUrl = __uv$config.prefix + __uv$config.encodeUrl(url);
                    
                    // Redirect through the same pattern as your search function
                    location.href = "/Classes.html?game=" + encodeURIComponent(encodedUrl);
                } catch (error) {
                    console.error("Error with UV proxy:", error);
                    // Fallback if UV isn't working
                    window.open(url, '_blank');
                    window.showNotification("PRX service unavailable. Opened direct link instead.", "error");
                }
                
                // Close the popup
                window.closePrxPopup();
            });
        }
        
        // Set up the close button
        const closeBtn = document.getElementById('close-prx-popup');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                window.closePrxPopup();
            });
        }
    }, 10);
};

// Function to close the coin popup
window.closeCoinPopup = function() {
    const coinPurchasePopup = document.getElementById('coin-purchase-popup');
    coinPurchasePopup.classList.remove('visible');
    setTimeout(() => {
        coinPurchasePopup.style.display = 'none';
    }, 300);
};

// Function to close the PRX info popup
window.closePrxPopup = function() {
    const prxInfoPopup = document.getElementById('prx-info-popup');
    prxInfoPopup.classList.remove('visible');
    setTimeout(() => {
        prxInfoPopup.style.display = 'none';
    }, 300);
};

// Direct purchase complete function to handle purchase completion
window.completeCoinPurchase = async function(userId, coinAmount) {
    if (!window.auth.currentUser || window.auth.currentUser.uid !== userId) {
        window.showNotification('Unauthorized access', 'error');
        return { success: false, error: 'Unauthorized' };
    }
    
    if (!window.isOnline) {
        window.showNotification('You need to be online to complete purchases', 'error');
        return { success: false, error: 'Offline' };
    }
    
    try {
        // Import needed Firebase functions
        const { doc, getDoc, collection, writeBatch } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
        
        // Get current user data
        const userRef = doc(window.db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }
        
        const userData = userDoc.data();
        const currentBalance = userData.accountBalance || 0;
        const newBalance = currentBalance + coinAmount;
        
        // Use a batch for atomic updates
        const batch = writeBatch(window.db);
        
        // Update user account
        batch.update(userRef, {
            accountBalance: newBalance
        });
        
        // Update leaderboard
        const leaderboardRef = doc(window.db, 'leaderboard', userId);
        const leaderboardDoc = await getDoc(leaderboardRef);
        
        if (leaderboardDoc.exists()) {
            batch.update(leaderboardRef, {
                accountBalance: newBalance
            });
        } else {
            batch.set(leaderboardRef, {
                username: userData.username || 'Unknown',
                accountBalance: newBalance,
                joinDate: new Date()
            });
        }
        
        // Record transaction
        const transactionRef = doc(collection(window.db, 'transactions'));
        batch.set(transactionRef, {
            userId: userId,
            transactionType: 'coin_purchase',
            amount: coinAmount,
            timestamp: new Date(),
            prevBalance: currentBalance,
            newBalance: newBalance
        });
        
        // Commit all updates
        await batch.commit();
        
        // Update cache
        if (window.userDataCache.userData) {
            window.userDataCache.userData = {
                ...window.userDataCache.userData,
                accountBalance: newBalance
            };
            window.userDataCache.lastUpdated = Date.now();
        }
        
        // Update UI
        const shopBalanceDisplay = document.getElementById('shop-balance-display');
        const balanceDisplay = document.getElementById('balance-display');
        
        if (shopBalanceDisplay) shopBalanceDisplay.textContent = newBalance.toLocaleString();
        if (balanceDisplay) balanceDisplay.textContent = newBalance.toLocaleString();
        
        // Update leaderboard immediately
        if (window.voidLeaderboard) {
            window.voidLeaderboard.updateUserBalance(userId, newBalance);
        }
        
        // Show success notification
        window.showNotification(`Purchase complete! Added ${coinAmount.toLocaleString()} coins to your account.`, 'success');
        
        return { 
            success: true, 
            prevBalance: currentBalance, 
            newBalance: newBalance
        };
    } catch (error) {
        console.error('Error completing coin purchase:', error);
        window.showNotification('Failed to complete purchase. Please contact support.', 'error');
        return { success: false, error: error.message };
    }
};

// Function to set up shop button handlers
window.setupShopButtonHandlers = function() {
    // Add event listeners to buy buttons
    document.querySelectorAll('.buy-button').forEach(button => {
        // Remove existing listeners first to prevent duplicates
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling up
            
            if (!window.auth.currentUser) {
                window.showNotification('Please log in to purchase items', 'error');
                return;
            }
            
            const itemId = this.getAttribute('data-item-id');
            const itemType = this.getAttribute('data-type');
            
            if (!itemId || !itemType) {
                console.error("Missing item attributes");
                return;
            }
            
            // Import needed Firebase functions
            const { doc, getDoc, collection, writeBatch, updateDoc, addDoc } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
            
            // Check if this is a buy, equip, or unequip action
            if (this.classList.contains('equip')) {
                // This is an equip action
                console.log(`Equipping item: ${itemId}`);
                
                // Disable button while processing
                this.disabled = true;
                this.classList.add('loading');
                const originalText = this.textContent;
                this.textContent = "Processing...";
                
                try {
                    if (itemType === 'theme') {
                        // Equip theme
                        window.itemManager.equipTheme(itemId);
                        
                        // Update button to unequip
                        this.textContent = "Unequip";
                        this.classList.remove('equip');
                        this.classList.add('unequip');
                        
                        // Mark as equipped in UI
                        const shopItem = this.closest('.shop-item');
                        if (shopItem) {
                            shopItem.classList.remove('owned');
                            shopItem.classList.add('equipped');
                        }
                        
                        // Update other buttons
                        document.querySelectorAll(`.buy-button[data-type="${itemType}"]`).forEach(otherButton => {
                            if (otherButton !== this && otherButton.classList.contains('unequip')) {
                                otherButton.textContent = "Equip";
                                otherButton.classList.remove('unequip');
                                otherButton.classList.add('equip');
                                
                                const otherItem = otherButton.closest('.shop-item');
                                if (otherItem) {
                                    otherItem.classList.remove('equipped');
                                    otherItem.classList.add('owned');
                                }
                            }
                        });
                        
                        // Save preferences
                        await window.itemManager.saveUserPreferences(window.auth.currentUser.uid, {
                            theme: itemId,
                            avatar: window.itemManager.currentAvatar
                        });
                    } else if (itemType === 'avatar') {
                        // Equip avatar
                        window.itemManager.currentAvatar = itemId;
                        
                        // Update button to unequip
                        this.textContent = "Unequip";
                        this.classList.remove('equip');
                        this.classList.add('unequip');
                        
                        // Mark as equipped in UI
                        const shopItem = this.closest('.shop-item');
                        if (shopItem) {
                            shopItem.classList.remove('owned');
                            shopItem.classList.add('equipped');
                        }
                        
                        // Update other buttons
                        document.querySelectorAll(`.buy-button[data-type="${itemType}"]`).forEach(otherButton => {
                            if (otherButton !== this && otherButton.classList.contains('unequip')) {
                                otherButton.textContent = "Equip";
                                otherButton.classList.remove('unequip');
                                otherButton.classList.add('equip');
                                
                                const otherItem = otherButton.closest('.shop-item');
                                if (otherItem) {
                                    otherItem.classList.remove('equipped');
                                    otherItem.classList.add('owned');
                                }
                            }
                        });
                        
                        // Save preferences and update leaderboard
                        await window.itemManager.saveUserPreferences(window.auth.currentUser.uid, {
                            theme: window.itemManager.currentTheme,
                            avatar: itemId
                        });
                        
                        // Update leaderboard entry with equipped avatar
                        try {
                            const leaderboardRef = doc(window.db, 'leaderboard', window.auth.currentUser.uid);
                            await updateDoc(leaderboardRef, {
                                equippedAvatar: itemId
                            });
                            
                            // Refresh leaderboard
                            if (window.refreshLeaderboard) {
                                window.refreshLeaderboard();
                            }
                        } catch (error) {
                            console.error("Error updating leaderboard:", error);
                        }
                    }
                    
                    window.showNotification(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} equipped successfully!`, 'success');
                } catch (error) {
                    console.error("Error equipping item:", error);
                    window.showNotification("Error equipping item. Please try again.", "error");
                    this.textContent = originalText;
                } finally {
                    this.disabled = false;
                    this.classList.remove('loading');
                }
            } else if (this.classList.contains('unequip')) {
                // This is an unequip action
                console.log(`Unequipping item: ${itemId}`);
                
                // Disable button while processing
                this.disabled = true;
                this.classList.add('loading');
                const originalText = this.textContent;
                this.textContent = "Processing...";
                
                try {
                    if (itemType === 'theme') {
                        // Unequip theme
                        window.itemManager.unequipTheme();
                        
                        // Update button to equip
                        this.textContent = "Equip";
                        this.classList.remove('unequip');
                        this.classList.add('equip');
                        
                        // Mark as owned in UI
                        const shopItem = this.closest('.shop-item');
                        if (shopItem) {
                            shopItem.classList.remove('equipped');
                            shopItem.classList.add('owned');
                        }
                        
                        // Save preferences
                        await window.itemManager.saveUserPreferences(window.auth.currentUser.uid, {
                            theme: null,
                            avatar: window.itemManager.currentAvatar
                        });
                    } else if (itemType === 'avatar') {
                        // Unequip avatar
                        window.itemManager.currentAvatar = null;
                        
                        // Update button to equip
                        this.textContent = "Equip";
                        this.classList.remove('unequip');
                        this.classList.add('equip');
                        
                        // Mark as owned in UI
                        const shopItem = this.closest('.shop-item');
                        if (shopItem) {
                            shopItem.classList.remove('equipped');
                            shopItem.classList.add('owned');
                        }
                        
                        // Save preferences and update leaderboard
                        await window.itemManager.saveUserPreferences(window.auth.currentUser.uid, {
                            theme: window.itemManager.currentTheme,
                            avatar: null
                        });
                        
                        // Update leaderboard entry with equipped avatar
                        try {
                            const leaderboardRef = doc(window.db, 'leaderboard', window.auth.currentUser.uid);
                            await updateDoc(leaderboardRef, {
                                equippedAvatar: null
                            });
                            
                            // Refresh leaderboard
                            if (window.refreshLeaderboard) {
                                window.refreshLeaderboard();
                            }
                        } catch (error) {
                            console.error("Error updating leaderboard:", error);
                        }
                    }
                    
                    window.showNotification(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} unequipped successfully!`, 'success');
                } catch (error) {
                    console.error("Error unequipping item:", error);
                    window.showNotification("Error unequipping item. Please try again.", "error");
                    this.textContent = originalText;
                } finally {
                    this.disabled = false;
                    this.classList.remove('loading');
                }
            } else {
                // This is a buy action
                console.log(`Buying item: ${itemId}`);
                
                // Get the item price
                const shopItem = this.closest('.shop-item');
                const itemPrice = parseInt(shopItem.getAttribute('data-price'), 10);
                
                if (isNaN(itemPrice)) {
                    console.error("Invalid item price");
                    return;
                }
                
                // Disable button while processing
                this.disabled = true;
                this.classList.add('loading');
                const originalText = this.textContent;
                this.textContent = "Processing...";
                
                try {
                    // Check if user has enough coins
                    const userDetails = await window.voidAccounting.getUserAccountDetails(window.auth.currentUser.uid);
                    if (userDetails.accountBalance < itemPrice) {
                        window.showNotification(`Not enough coins. You need ${itemPrice.toLocaleString()} coins.`, 'error');
                        this.textContent = originalText;
                        this.disabled = false;
                        this.classList.remove('loading');
                        return;
                    }
                    
                    // Proceed with purchase using a batch operation
                    const batch = writeBatch(window.db);
                    let newBalance;
                    
                    try {
                        // Update user account balance
                        const userRef = doc(window.db, 'users', window.auth.currentUser.uid);
                        const userDoc = await getDoc(userRef);
                        
                        if (!userDoc.exists()) {
                            throw new Error("User not found");
                        }
                        
                        const userData = userDoc.data();
                        const currentBalance = userData.accountBalance;
                        newBalance = currentBalance - itemPrice;
                        
                        // Update user document
                        batch.update(userRef, {
                            accountBalance: newBalance
                        });
                        
                        // Update leaderboard entry
                        const leaderboardRef = doc(window.db, 'leaderboard', window.auth.currentUser.uid);
                        const leaderboardDoc = await getDoc(leaderboardRef);
                        
                        if (leaderboardDoc.exists()) {
                            batch.update(leaderboardRef, {
                                accountBalance: newBalance
                            });
                        } else {
                            batch.set(leaderboardRef, {
                                username: userData.username || 'Unknown',
                                accountBalance: newBalance,
                                joinDate: new Date()
                            });
                        }
                        
                        // Add to user purchases
                        const purchaseRef = doc(collection(window.db, 'user_purchases', window.auth.currentUser.uid, 'items'));
                        batch.set(purchaseRef, {
                            itemId: itemId,
                            itemType: itemType,
                            price: itemPrice,
                            purchaseDate: new Date(),
                            itemName: window.itemManager.items[itemId]?.name || itemId
                        });
                        
                        // Record transaction
                        const transactionRef = doc(collection(window.db, 'transactions'));
                        batch.set(transactionRef, {
                            userId: window.auth.currentUser.uid,
                            transactionType: 'item_purchase',
                            amount: itemPrice,
                            timestamp: new Date(),
                            prevBalance: currentBalance,
                            newBalance: newBalance,
                            metadata: {
                                itemId: itemId,
                                itemType: itemType
                            }
                        });
                        
                        // Commit the batch
                        await batch.commit();
                        
                        // Update cache
                        window.userDataCache.userData = {
                            ...window.userDataCache.userData,
                            accountBalance: newBalance
                        };
                        window.userDataCache.lastUpdated = Date.now();
                        window.userDataCache.purchasedItems[itemId] = true;
                        
                        // Update UI
                        const shopBalanceDisplay = document.getElementById('shop-balance-display');
                        const balanceDisplay = document.getElementById('balance-display');
                        
                        if (shopBalanceDisplay) shopBalanceDisplay.textContent = newBalance.toLocaleString();
                        if (balanceDisplay) balanceDisplay.textContent = newBalance.toLocaleString();
                        
                        // Update button to equip
                        this.textContent = "Equip";
                        this.classList.add('equip');
                        
                        // Mark as owned in UI
                        shopItem.classList.add('owned');
                        
                        window.showNotification(`${window.itemManager.items[itemId]?.name || 'Item'} purchased successfully!`, 'success');
                        
                        // Update leaderboard immediately
                        if (window.voidLeaderboard) {
                            window.voidLeaderboard.updateUserBalance(window.auth.currentUser.uid, newBalance);
                        }
                    } catch (error) {
                        console.error("Error processing purchase:", error);
                        throw error;
                    }
                } catch (error) {
                    console.error("Error buying item:", error);
                    window.showNotification("Error purchasing item. Please try again.", "error");
                } finally {
                    this.disabled = false;
                    this.classList.remove('loading');
                }
            }
        });
    });
};

// Fix the coins section in the shop
function updateCoinShopItems() {
    // Get the coins section
    const coinsSection = document.querySelector('.section-coins .shop-items');
    if (!coinsSection) return;
    
    // Clear existing content
    coinsSection.innerHTML = '';
    
    // Add the 1 million coins option
    const oneMillionItem = document.createElement('div');
    oneMillionItem.className = 'shop-item';
    oneMillionItem.setAttribute('data-item-id', 'coins_1million_purchase');
    oneMillionItem.setAttribute('data-price', '150');
    oneMillionItem.innerHTML = `
        <div class="shop-item-image">
            <div class="coin-icon">💰</div>
        </div>
        <div class="shop-item-details">
            <h3 class="shop-item-title">1,000,000 Void Coins</h3>
            <p class="shop-item-description">Get a massive boost with 1 million Void Coins - perfect for buying premium items and themes!</p>
            <div class="shop-item-price">
                <span class="price-amount">$1.50 USD</span>
                <button class="buy-coins-btn" data-amount="1000000" data-price="1.50" data-url="https://buy.stripe.com/cN27uebFV8rTbte4gh">Buy Now</button>
            </div>
        </div>
    `;
    coinsSection.appendChild(oneMillionItem);
    
    // Add the 5 million coins option
    const fiveMillionItem = document.createElement('div');
    fiveMillionItem.className = 'shop-item';
    fiveMillionItem.setAttribute('data-item-id', 'coins_5million_purchase');
    fiveMillionItem.setAttribute('data-price', '550');
    fiveMillionItem.innerHTML = `
        <div class="shop-item-image">
            <div class="coin-icon" style="background: linear-gradient(45deg, #FFD700, #FF8C00);">💰💰</div>
        </div>
        <div class="shop-item-details">
            <h3 class="shop-item-title">5,000,000 Void Coins</h3>
            <p class="shop-item-description">Get a MASSIVE boost with 5 million Void Coins - the ultimate package for serious players!</p>
            <div class="shop-item-price">
                <span class="price-amount">$5.50 USD</span>
                <button class="buy-coins-btn" data-amount="5000000" data-price="5.50" data-url="https://buy.stripe.com/dR615QfWb5fHeFq7su">Buy Now</button>
            </div>
        </div>
    `;
    coinsSection.appendChild(fiveMillionItem);

    // Add the 10 million coins option
    const tenMillionItem = document.createElement('div');
    tenMillionItem.className = 'shop-item';
    tenMillionItem.setAttribute('data-item-id', 'coins_10million_purchase');
    tenMillionItem.setAttribute('data-price', '1050');
    tenMillionItem.innerHTML = `
        <div class="shop-item-image">
            <div class="coin-icon" style="background: linear-gradient(45deg, #FFD700, #FF8C00);">💰💰</div>
        </div>
        <div class="shop-item-details">
            <h3 class="shop-item-title">10,000,000 Void Coins</h3>
            <p class="shop-item-description">Get a MASSIVE boost with 10 million Void Coins - the ultimate package for serious players!</p>
            <div class="shop-item-price">
                <span class="price-amount">$10.50 USD</span>
                <button class="buy-coins-btn" data-amount="10000000" data-price="10.50" data-url="https://buy.stripe.com/fZe01MeS7aA168U8wz">Buy Now</button>
            </div>
        </div>
    `;
    coinsSection.appendChild(tenMillionItem);

    // Add the 100 million coins option
    const hunMillionItem = document.createElement('div');
    hunMillionItem.className = 'shop-item';
    hunMillionItem.setAttribute('data-item-id', 'coins_100million_purchase');
    hunMillionItem.setAttribute('data-price', '10050');
    hunMillionItem.innerHTML = `
        <div class="shop-item-image">
            <div class="coin-icon" style="background: linear-gradient(45deg, #FFD700, #FF8C00);">💰💰💰</div>
        </div>
        <div class="shop-item-details">
            <h3 class="shop-item-title">100,000,000 Void Coins</h3>
            <p class="shop-item-description">Get a INSANELY MASSIVE boost with 100 million Void Coins - boost you onto the leaderboard!</p>
            <div class="shop-item-price">
                <span class="price-amount">$100.50 USD</span>
                <button class="buy-coins-btn" data-amount="100000000" data-price="100.50" data-url="https://buy.stripe.com/3cseWG39p23vbteaEJ">Buy Now</button>
            </div>
        </div>
    `;
    coinsSection.appendChild(hunMillionItem);
    
    // Add event listeners to buy buttons
    document.querySelectorAll('.buy-coins-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling up
            
            const amount = parseInt(this.getAttribute('data-amount'), 10);
            const price = this.getAttribute('data-price');
            const url = this.getAttribute('data-url');
            const itemId = this.closest('.shop-item').getAttribute('data-item-id');
            
            window.showCoinPurchasePopup(itemId, amount, price, url);
        });
    });
}

// Shop Icon Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    const shopIcon = document.getElementById('shop-icon');
    const shopContainer = document.getElementById('shop-container');

    if (shopIcon && shopContainer) {
        shopIcon.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from bubbling up
            
            // Close auth container if open
            const authContainer = document.getElementById('auth-container');
            const coinPurchasePopup = document.getElementById('coin-purchase-popup');
            const prxInfoPopup = document.getElementById('prx-info-popup');
            
            if (authContainer) {
                authContainer.style.display = 'none';
                authContainer.classList.remove('visible');
            }
            
            if (coinPurchasePopup) {
                coinPurchasePopup.style.display = 'none';
                coinPurchasePopup.classList.remove('visible');
            }
            
            if (prxInfoPopup) {
                prxInfoPopup.style.display = 'none';
                prxInfoPopup.classList.remove('visible');
            }
            
            // Toggle visibility of shop container with animation
            if (shopContainer.style.display === 'block') {
                shopContainer.classList.remove('visible');
                setTimeout(() => {
                    shopContainer.style.display = 'none';
                }, 300);
            } else {
                shopContainer.style.display = 'block';
                setTimeout(() => {
                    shopContainer.classList.add('visible');
                }, 10);
                
                // If user is logged in, check purchased items
                if (window.auth.currentUser) {
                    window.itemManager.checkPurchasedItems(window.auth.currentUser.uid)
                        .then(() => {
                            // Update shop balance display
                            window.voidAccounting.getUserAccountDetails(window.auth.currentUser.uid)
                                .then(userDetails => {
                                    const shopBalanceDisplay = document.getElementById('shop-balance-display');
                                    if (shopBalanceDisplay) {
                                        shopBalanceDisplay.textContent = userDetails.accountBalance.toLocaleString();
                                    }
                                })
                                .catch(error => {
                                    console.error("Error updating shop balance:", error);
                                });
                        })
                        .catch(error => {
                            console.error("Error checking purchased items:", error);
                        });
                }
                
                // Set up shop item button handlers
                window.setupShopButtonHandlers();
            }
        });

        // Close shop when clicking outside
        document.addEventListener('click', (e) => {
            if (shopContainer && shopContainer.style.display === 'block') {
                // Check if click is outside shop container and not on shop icon
                if (!shopContainer.contains(e.target) && !shopIcon.contains(e.target)) {
                    shopContainer.classList.remove('visible');
                    setTimeout(() => {
                        shopContainer.style.display = 'none';
                    }, 300);
                }
            }
        });
        
        // Close shop when shop-close button is clicked
        const shopCloseButton = document.querySelector('.shop-close');
        if (shopCloseButton) {
            shopCloseButton.addEventListener('click', () => {
                shopContainer.classList.remove('visible');
                setTimeout(() => {
                    shopContainer.style.display = 'none';
                }, 300);
            });
        }
    }
});

// Initialize shop tabs when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to shop tabs
    document.querySelectorAll('.shop-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Get the target section
            const targetSection = tab.dataset.tab;
            
            // Remove active class from all tabs and sections
            document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.section-themes, .section-avatars, .section-roll, .section-dev, .section-coins').forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding section
            tab.classList.add('active');
            document.querySelector(`.section-${targetSection}`).classList.add('active');
            
            // If this is the coins tab, update the coins section
            if (targetSection === 'coins') {
                updateCoinShopItems();
            }
        });
    });

    // Initialize the avatar roll system
    window.avatarRollSystem.init();
    
    // Fix clicking outside the popup to prevent immediate closing
    document.addEventListener('click', (event) => {
        const coinPurchasePopup = document.getElementById('coin-purchase-popup');
        if (coinPurchasePopup && coinPurchasePopup.style.display === 'block') {
            // Only close if click is outside the popup AND not on a buy button
            if (!coinPurchasePopup.contains(event.target) && 
                !event.target.classList.contains('buy-coins-btn')) {
                window.closeCoinPopup();
            }
        }
        
        const prxInfoPopup = document.getElementById('prx-info-popup');
        if (prxInfoPopup && prxInfoPopup.style.display === 'block') {
            // Only close if click is outside the popup
            if (!prxInfoPopup.contains(event.target)) {
                window.closePrxPopup();
            }
        }
    });
});

// Override the shop icon click handler to ensure coin shop is updated
document.addEventListener('DOMContentLoaded', function() {
    const shopIcon = document.getElementById('shop-icon');
    if (shopIcon) {
        const originalClickHandler = shopIcon.onclick;
        
        shopIcon.onclick = function(e) {
            // First call the original handler if it exists
            if (typeof originalClickHandler === 'function') {
                originalClickHandler.call(this, e);
            }
            
            // After a short delay, check if the coins tab is active
            setTimeout(() => {
                const coinsTab = document.querySelector('.shop-tab[data-tab="coins"]');
                if (coinsTab && coinsTab.classList.contains('active')) {
                    updateCoinShopItems();
                }
            }, 300);
        };
    }
});

// Respond to core-ready event
document.addEventListener('core-ready', function() {
    console.log('Shop systems initializing');
    
    // Check if avatar roll needs initializing
    if (window.avatarRollSystem) {
        window.avatarRollSystem.init();
    }
    
    // Check if we need to set up the shop buttons
    if (window.setupShopButtonHandlers) {
        window.setupShopButtonHandlers();
    }
    
    // Dispatch event that shop system is ready
    document.dispatchEvent(new CustomEvent('shop-ready'));
});

// Handle user login/logout events
document.addEventListener('user-logged-in', async function(e) {
    const userId = e.detail.userId;
    
    // Load user preferences
    if (window.itemManager && window.itemManager.loadUserPreferences) {
        await window.itemManager.loadUserPreferences(userId);
    }
    
    // Update purchased items and shop UI
    if (window.itemManager && window.itemManager.checkPurchasedItems) {
        await window.itemManager.checkPurchasedItems(userId);
    }
    
    console.log('Shop systems updated for user login');
});

document.addEventListener('user-logged-out', function() {
    // Clear user-specific shop data
    if (window.itemManager) {
        if (window.itemManager.currentTheme) {
            window.itemManager.unequipTheme();
        }
        window.itemManager.currentTheme = null;
        window.itemManager.currentAvatar = null;
    }
    
    console.log('Shop systems reset for user logout');
});

// Shop initialization 
console.log('Shop system loaded');
