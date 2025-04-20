/**
 * avatars.js - Avatar and theme data for Void Network
 * This file centralizes all item data for easier management and updates
 */

// Central repository for all items (themes and avatars)
const voidItems = {
    // Themes
    'forest_theme': {
        url: 'https://lh7-us.googleusercontent.com/v_s_bK2lQgL2sAvLaZfdZJoy1A9V6x_feCZubeL1von2XD-QQhD5l9A8GmGcdJKGzSOcGkJTrTJB34rY3V-xzRr_4x5qgZB5a8L3Pg5YMeNwZnSuM740jUjvuupmAD4-D4ARNIlfVqwiECIG1fWnDadh0tri-Q',
        name: 'Forest Theme',
        type: 'theme',
        price: 1000000,
        description: 'Transform your Void Network experience with lush forest visuals and ambient nature sounds.'
    },
    'city_theme': {
        url: 'https://lh7-us.googleusercontent.com/OlgmXm_auGwC6ga8ZVXSx_eqeCfm2bYpMKd3ylW4eLqMZ45CicWeMwJBoUhnYgEdwdEK3bzaMUHt5fIDFk_eaHKFy6cUSjbeEWBIB1TiIxk1trjPXNvFTgEAuaaEx-rO1q0UZ2k6GgZyiyrzWoK-xLQcpUdKWA',
        name: 'City Theme',
        type: 'theme',
        price: 2500000,
        description: 'Experience the urban landscape with this sleek city theme. Feel the pulse of city life as you play.'
    },
    'desert_theme': {
        url: 'https://lh7-us.googleusercontent.com/kPKB3cpqgwfvkFv_TOM1YsJyG0J46BVOOx7nLtS94V1QYWMgJD_BHQnqj_xSG5oIy0oVLo1zi2Com1sJopFqupa-KOuCMOONyVMhoWw0Tlu_GQR5ImRpoaKk3Qp7RRZGvCSqjjopA1YGz4Pko-IBFD_XBl1mLg',
        name: 'Desert Theme',
        type: 'theme',
        price: 300000000,
        description: 'Immerse yourself in the vast tranquility of the desert. Experience the serene beauty of golden sands.'
    },
    'ocean_theme': {
        url: 'https://lh7-us.googleusercontent.com/MuXH0obscoC0WCNtdSARDM6vyBAIJVdT9llkWccrKb2uRe9vyMv6pUkdQEp6-c_HPlhVIHg9_E-CMxuA2qIPdU-licIfOe6FS11T54BKlQnj67Jdk2ZR-K6jvQMLhi5g2AirY9lw43q14bg2Ayu7jXBiw1wFuw',
        name: 'Ocean Theme',
        type: 'theme',
        price: 100000,
        description: 'Dive into an underwater adventure with this stunning ocean theme. Experience the beauty and tranquility of the sea.'
    },
    'placeholder_2': {
        url: '/api/placeholder/400/320',
        name: 'Space Theme',
        type: 'theme',
        price: 75000000,
        description: 'Coming soon! Take your games to the stars with cosmic visuals.',
        comingSoon: true
    },
    
    // Common Avatars
    'duck_avatar': {
        url: 'https://lh7-us.googleusercontent.com/V05Ky_kXjTgEWudFslnIr1mGSHMXGnGBIn2mgOjc8-TuLzwKqOuExnW7GOQf8uAKCWcDkRAgOdQzGI6zC8Farp6-6toWbqWg6fnSg1fGlKTKc-Qe4MRIH4Q8YileAoqtR5XvgTVJXMOsej_w0t4Cu2Sy0Nr6sA',
        name: 'Duck Avatar',
        shortName: 'Duck',
        type: 'avatar',
        price: 1000000,
        description: 'A friendly duck avatar to represent you in the Void Network.',
        rarity: 'common'
    },
    'bear_avatar': {
        url: 'https://lh7-us.googleusercontent.com/6S_usPQDjmJvISyYbkU9osyenEjNebCz8kDE_Zx3uwNuU2DF9coxtDVpqgmF3wBdqFLmp3iDCUSDrHDdxSOzXAVkDRGXlYkJLh7F3QLNcJ26f3kjP5fZWRbia53K0gRydW2cs2m0BPfGR_hkCftkVZjEFpG1Ew',
        name: 'Bear Avatar',
        shortName: 'Bear',
        type: 'avatar',
        price: 1500000,
        description: 'A powerful bear avatar to show your strength in the Void Network.',
        rarity: 'common'
    },
    'wolf_avatar': {
        url: 'https://lh7-us.googleusercontent.com/w9g3tzaaRuGaQ2SqUxiiVwp-rjcvMpgDn9jVNsRTxpzqOacFItpMeBOwk4Pq_Yk_2y9JcA8OXVG8iCWv7xSaUtT6DsDsCYDWEiko6cp_EHw6E2qi1GRFDbyXc8qVam9paSKH-B32lIwpwDtCMuR0Z2ck8fYi3w',
        name: 'Wolf Avatar',
        shortName: 'Polar Bear',
        type: 'avatar',
        price: 1500000,
        description: 'A fierce wolf avatar to represent your cunning in the Void Network.',
        rarity: 'common'
    },
    'frog_avatar': {
        url: 'https://lh7-us.googleusercontent.com/eGaOENDSn4jTuW9op6n4ohX9juRwOrV40kQxUXnXV_BnHZBr2LyQw0qSzWmvBUWDGvJEy4DZZUf9l5xFR1fR35nGolHA6Km5oXieYExnzTUHNsLFRgUq4o07t3cKvIIRh79Oagzm9n4oC62nGfUaXEcaw7vleQ',
        name: 'Frog Avatar',
        shortName: 'Frog',
        type: 'avatar',
        price: 1500000,
        description: 'A cute frog avatar that brings good luck in the Void Network.',
        rarity: 'common'
    },
    'pig_avatar': {
        url: 'https://lh7-us.googleusercontent.com/7XYuYX5wENim-PK9I-DFVONWm8wi05fFFvux8wotI_dPqQiKrXcESS7S03pHrK4XYKAwVlKKHPvVr7f3P1dgj5QleYsInYlIOP448s4SNw4bCkxFKHpEiU8qe9fa4alIE3SyERL-eCbWOeWtWXt4qGgMlhbmmw',
        name: 'Pig Avatar',
        shortName: 'Pig',
        type: 'avatar',
        price: 1500000,
        description: 'An adorable pig avatar for a friendly presence in the Void Network.',
        rarity: 'common'
    },
    
    // Epic Avatars
    'mouse_avatar': {
        url: 'https://lh7-us.googleusercontent.com/l77cY3amoop7ZnhU8RyXBDpcZeDRuOidnlL8JOp4uh_sNB4RrFqzMIL3gTyXRyowdA5j2VxdIA7e3ehrrbROT_b7U2TPeE3Ku9nVBcMGI2uTIp4X0UMH8xXsC3LzTsBleekbA79vPKhmPl-Iy9ZI_fSCT30zbw',
        name: 'Mouse Avatar',
        shortName: 'Mouse',
        type: 'avatar',
        price: 2500000,
        description: 'A clever and quick mouse avatar for those who prefer stealth and speed in the Void Network.',
        rarity: 'epic'
    },
    'queso_avatar': {
        url: 'https://lh7-us.googleusercontent.com/obXrTaTsq1xc87VcMTKUu9FLT3PQlc9oNZFMRD8kzPEwmdhfZx-I_EoQuMlZBBt0p2Ta-BGlyb5PSvFB-tETgA8mVB_q2KMEL7TPyDhHIdcjD4Lc4RcUcfcoyQ8-pNal3nF7eDsVTkYcgZKiAi1CPZqfjgENdg',
        name: '🧀Queso🧀 Avatar',
        shortName: '🧀Queso🧀',
        type: 'avatar',
        price: 2500000,
        description: 'A deliciously epic cheese avatar that stands out in the Void Network. Cheesy and proud!',
        rarity: 'epic'
    },
    'monkey_avatar': {
        url: 'https://lh7-us.googleusercontent.com/Z1SAiYbNGevHZhUGDPoUcDlnVtm84hTkZxb9u8IOX65t3nXfzhKX8aCdwOOzl5BnqNfccb6WAw4nUPxiuLkJEXF6SoiufDvjJNRWR94NWbtstNPA7n4cSwWNfZlNnxXGnltdRwQVfyTU1b8iu8N_Ne28-jA1Uw',
        name: 'Monkey Avatar',
        shortName: 'Monkey',
        type: 'avatar',
        price: 2500000,
        description: 'A playful and intelligent monkey avatar to showcase your wit and adaptability in the Void Network.',
        rarity: 'epic'
    },
    'cat_avatar': {
        url: 'https://lh7-us.googleusercontent.com/tyaiBHWmO5PaP21jauHFO8FVjt43j9QqMKAtGB7SEvSIn47bi-1_3ZNtFE2LdSN2zJEEeXQZyA6CMAH6NrM4LSMLo5YX3Ol_ofbadqN2lnoKT956LpyYh-mGz7LWZrMTN-cImBh2apmPiFRoA5V8GNtpzS9BRQ',
        name: 'Cat Avatar',
        shortName: 'Cat',
        type: 'avatar',
        price: 2500000,
        description: 'A graceful and mysterious cat avatar for those who rule the Void Network with feline elegance.',
        rarity: 'epic'
    },
    'robot_avatar': {
        url: 'https://lh7-us.googleusercontent.com/wzKtZhluCxlNQV0Fa1FwI0BpyL4MGpuzG7V6tA0ql_Jj-H3edrbzELvypqmBXmPBTkbxR-Da5OQtUCMF7ojiPqVlhcOYuUmIgxCv_yKhStTUYw0TwxXywk5oaaAJbaRFYjQ5Lq2ZPOYAim9-_MnqmfL8G0rc1w',
        name: 'Robot Avatar',
        shortName: 'Robot',
        type: 'avatar',
        price: 3000000,
        description: 'A high-tech robot avatar for the future-minded players of the Void Network. Precision and power.',
        rarity: 'epic'
    },
    
    // Legendary Avatars
    'rock_avatar': {
        url: 'https://lh7-us.googleusercontent.com/esoUiZg6LM-H9lPrhoyadWqvBnQteBbOFpPNTpiX6W-5TZ81teFalNCwOA6W0WsD2PUMPN_LTdcZ320laaPLV4mlluJdBDJ08XF41GHk9pf1rGKePsWoKBww4jtWxsEOdwt_nxPZkNoB_Gmbs5tPBZcmk4ByIw',
        name: 'Da Rock Avatar',
        shortName: 'Da Rock',
        type: 'avatar',
        price: 3500000,
        description: 'An unbreakable avatar with unmatched strength and charisma. Command respect in the Void Network with this legendary presence.',
        rarity: 'legendary'
    },
    'electro_avatar': {
        url: 'https://lh7-us.googleusercontent.com/4oxa8N4__ki8xAP3XiGuuHEgOoXkTXj7Ha0T7bKdCDlZ-Wy1G_wPdmaX8gkAGmAh3Z5Gisyk7SYcySU-Axzy-IzVWYus31ldCLtOBGiALCkKwxkE_hKmtbA5H70KHip5eszZYJ9ehfp5A3svH72tPoXlAxu-ag',
        name: 'Electro Avatar',
        shortName: 'Electro',
        type: 'avatar',
        price: 3500000,
        description: 'A charged legendary avatar coursing with electric energy. Shock and awe other players with your electrifying presence in the Void Network.',
        rarity: 'legendary'
    },
    'alien_avatar': {
        url: 'https://lh7-us.googleusercontent.com/Psh0syCV7o1c7rgmedBjYZVminiEz6MmRioH1Q_-MEd5xKXwStyWvl2qL0B58FoNRehYDMGlQCDjfwt3Yh38S8Q3fvZwdjqM4YCwUcL-DFgUXmS0qcwXwmPImHKNtO2SVV1makQX90O1sgu7Wstkf15U23AZZg',
        name: 'Alien Avatar',
        shortName: 'Alien',
        type: 'avatar',
        price: 3500000,
        description: 'An otherworldly legendary avatar with cosmic powers. Your extraterrestrial presence will leave other Void Network players in awe.',
        rarity: 'legendary'
    },
    'skull_avatar': {
        url: 'https://lh7-us.googleusercontent.com/OEGL63jMJgtdg4s8Lu7XSKi0dSIjBcU_z1s31GMIkkGO5bt1PMU0i91wkuX3SXQrTq6ecGrikBdNxXq54pMrnYqrK9y2Wqim-qJOfxA_Cn2RPOkA8P0HnP0ygVosOambs-EwUbz9KZBnY7BZflOYFqIgD2LM6g',
        name: 'Skull Avatar',
        shortName: 'Skull',
        type: 'avatar',
        price: 3500000,
        description: 'A haunting legendary avatar that brings fear to your opponents. Strike terror in the hearts of other Void Network players with this ominous presence.',
        rarity: 'legendary'
    },
    'mummy_avatar': {
        url: 'https://lh7-us.googleusercontent.com/BU7N3u63y8CsYnsuOVEtgI8SYIMxCrjt6-jyJncRJ4QR5fN48d3dVc8u2VGeJH9MFunkxVAf68LYi5aVqDWatEgeoGJNaQbdvRDIgna9TwONrQ97TH9-v3qvm5vSqJOdfLlGb2ZxPGKeM0EP_mn5602KgdsT0w',
        name: 'Mummy Avatar',
        shortName: 'Mummy',
        type: 'avatar',
        price: 3500000,
        description: 'An ancient legendary avatar wrapped in mystical bandages. Bring the curse of the pharaohs to the Void Network with this timeless presence.',
        rarity: 'legendary'
    },
    'galactic_void_avatar': {
        url: 'https://lh7-us.googleusercontent.com/5z9ZDquXDRawn8KaR_c2pGNprewTSRyExLBk6gy4a3281jZDIstFcJSdxqFdRGRr1V15_oRnJM7LiwbsmfwyIvM3q3l0OQ1zF-MNaYRUZ_h9cPOhDfnQHqWRA1_KRtHB5Y30Q9v7iUZ6z9UcE7l9J5C5d83KDg',
        name: 'Galactic Void Avatar',
        shortName: 'Galactic Void',
        type: 'avatar',
        price: 4000000,
        description: 'The ultimate legendary avatar containing the power of the cosmos itself. Become one with the Void Network in its purest form with this supreme presence.',
        rarity: 'legendary'
    },
    
    // Dev Only Avatars
    'void_bot_avatar': {
        url: 'https://lh7-us.googleusercontent.com/mevPAzUzsGnUs9znx6FU7X-xQjjc9qkjUa9JWfKLizWf2B8MtcmphxDjYe1Fq80LDNBMld0B9l_zhL1Xqq2SXrgOaZVoQB8B06E1SUzJ73xyX7PBMbKuyk1drgL6G-B_aHfxrddeI1ZLDTulfbEJIXdVNcC8hQ',
        name: 'Void Bot Avatar',
        shortName: 'Void Bot',
        type: 'avatar',
        price: 0,
        description: 'Official Void Network developer avatar. Only available to the development team.',
        rarity: 'dev'
    },
    'design_master_avatar': {
        url: 'https://lh7-us.googleusercontent.com/pYFqazpZszh0XVrhL692zyJoQ7Vi1VWfTNHuMYsqrC1ByUCDTQkpPesBi2P6rR28yWb0ZiPkxwU9c7EaZU_iO3p0l0tP2uo72RAqdX8gQXXjd6e1CpmtBMe-qxIy2VmxEaR0L1AKPucoZ6h5GuX-A8tOJLzFiA',
        name: 'Design Master Avatar',
        shortName: 'Design Master',
        type: 'avatar',
        price: 0,
        description: 'Official Void Network design team avatar. Exclusive to designers of the system.',
        rarity: 'dev'
    }
};

// Helper functions
const voidItemHelpers = {
    // Get all items of a specific type
    getItemsByType: function(type) {
        return Object.entries(voidItems)
            .filter(([_, item]) => item.type === type)
            .map(([id, item]) => ({ id, ...item }));
    },
    
    // Get all avatars of a specific rarity
    getAvatarsByRarity: function(rarity) {
        return Object.entries(voidItems)
            .filter(([id, item]) => item.type === 'avatar' && item.rarity === rarity && !id.includes('placeholder'))
            .map(([id, item]) => ({ id, ...item }));
    },
    
    // Get all items (themes or avatars) with prices in a specified range
    getItemsByPriceRange: function(minPrice, maxPrice, type = null) {
        return Object.entries(voidItems)
            .filter(([_, item]) => {
                const matchesType = type ? item.type === type : true;
                const matchesPrice = item.price >= minPrice && item.price <= maxPrice;
                return matchesType && matchesPrice;
            })
            .map(([id, item]) => ({ id, ...item }));
    },
    
    // Get a specific item by ID
    getItemById: function(itemId) {
        if (voidItems[itemId]) {
            return { id: itemId, ...voidItems[itemId] };
        }
        return null;
    },
    
    // Check if an item is available (not coming soon)
    isItemAvailable: function(itemId) {
        return voidItems[itemId] && !voidItems[itemId].comingSoon;
    }
};

// Make all items and helper functions available globally
window.voidItems = voidItems;
window.voidItemHelpers = voidItemHelpers;

// Function to render avatars in the shop
function renderAvatarsSection() {
    // Get the avatars section container
    const avatarsSection = document.querySelector('.section-avatars');
    if (!avatarsSection) {
        console.error('Avatars section not found in the DOM');
        return;
    }
    
    // Clear existing content
    avatarsSection.innerHTML = '';
    
    // Define avatar rarities and their display names
    const rarities = [
        { id: 'legendary', name: 'Legendary Avatars' },
        { id: 'epic', name: 'Epic Avatars' },
        { id: 'common', name: 'Common Avatars' }
    ];
    
    // Loop through rarities and create sections
    rarities.forEach(rarity => {
        // Get avatars of this rarity
        const avatars = voidItemHelpers.getAvatarsByRarity(rarity.id);
        
        if (avatars.length === 0) return; // Skip if no avatars of this rarity
        
        // Create category header
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'shop-category';
        categoryHeader.textContent = rarity.name;
        avatarsSection.appendChild(categoryHeader);
        
        // Create items container
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'shop-items';
        avatarsSection.appendChild(itemsContainer);
        
        // Add each avatar to the container
        avatars.forEach(avatar => {
            // Create shop item element
            const shopItem = document.createElement('div');
            shopItem.className = 'shop-item';
            shopItem.dataset.itemId = avatar.id;
            shopItem.dataset.price = avatar.price;
            shopItem.dataset.type = 'avatar';
            
            // Add legendary badge if needed
            if (rarity.id === 'legendary') {
                const legendaryBadge = document.createElement('div');
                legendaryBadge.className = 'legendary-badge';
                legendaryBadge.textContent = 'LEGENDARY';
                shopItem.appendChild(legendaryBadge);
            }
            
            // Create item image
            const imageDiv = document.createElement('div');
            imageDiv.className = 'shop-item-image';
            const img = document.createElement('img');
            img.src = avatar.url;
            img.alt = avatar.name;
            imageDiv.appendChild(img);
            shopItem.appendChild(imageDiv);
            
            // Create item details container
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'shop-item-details';
            
            // Add title
            const title = document.createElement('h3');
            title.className = 'shop-item-title';
            title.textContent = avatar.name;
            detailsDiv.appendChild(title);
            
            // Add description
            const description = document.createElement('p');
            description.className = 'shop-item-description';
            description.textContent = avatar.description;
            detailsDiv.appendChild(description);
            
            // Add price and buy button
            const priceDiv = document.createElement('div');
            priceDiv.className = 'shop-item-price';
            
            const priceAmount = document.createElement('span');
            priceAmount.className = 'price-amount';
            priceAmount.textContent = new Intl.NumberFormat().format(avatar.price) + ' coins';
            priceDiv.appendChild(priceAmount);
            
            const buyButton = document.createElement('button');
            buyButton.className = 'buy-button';
            buyButton.dataset.itemId = avatar.id;
            buyButton.dataset.type = 'avatar';
            buyButton.textContent = 'Buy';
            priceDiv.appendChild(buyButton);
            
            detailsDiv.appendChild(priceDiv);
            shopItem.appendChild(detailsDiv);
            
            // Add completed shop item to container
            itemsContainer.appendChild(shopItem);
        });
    });
}

// Initialize avatars when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Render avatars in the shop
    renderAvatarsSection();
    
    // Update avatar items owned status when user data is loaded
    document.addEventListener('userDataLoaded', function(e) {
        updateAvatarOwnedStatus();
    });
    
    console.log('Avatar section rendering initialized');
});

// Function to update owned/equipped status of avatars
function updateAvatarOwnedStatus() {
    // This function would be called after user data is loaded
    // It would mark avatars as owned/equipped based on user data
    
    // Example implementation (assuming user data is available globally)
    if (window.currentUser && window.currentUser.ownedItems) {
        const avatarItems = document.querySelectorAll('.shop-item[data-type="avatar"]');
        
        avatarItems.forEach(item => {
            const itemId = item.dataset.itemId;
            
            // Check if item is owned
            if (window.currentUser.ownedItems.includes(itemId)) {
                item.classList.add('owned');
                
                // Update button text
                const buyButton = item.querySelector('.buy-button');
                if (buyButton) {
                    buyButton.textContent = 'Equip';
                    buyButton.classList.add('equip');
                }
                
                // Check if item is equipped
                if (window.currentUser.equippedItems && 
                    window.currentUser.equippedItems[item.dataset.type] === itemId) {
                    item.classList.add('equipped');
                    
                    // Update button for equipped items
                    if (buyButton) {
                        buyButton.textContent = 'Unequip';
                        buyButton.classList.remove('equip');
                        buyButton.classList.add('unequip');
                    }
                }
            }
        });
    }
}

// Notify when this module is loaded
console.log('Avatar and theme data loaded');
