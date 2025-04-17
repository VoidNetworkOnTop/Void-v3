/**
 * Void Network Shop System
 * This module handles loading and rendering shop items from external JSON files
 */

// Configuration
const SHOP_CONFIG = {
    ITEMS_FILE: '/config/shop-items.json',
    PRICING_FILE: '/config/shop-pricing.json'
};

// Shop data storage
let shopItems = {};
let shopPricing = {
    themes: [],
    avatars: [],
    devItems: [],
    coinPackages: []
};

/**
 * Load shop items and pricing from external JSON files
 * @returns {Promise<boolean>} - True if loading was successful
 */
async function loadShopData() {
    try {
        // Load the shop items (avatars, themes, etc.)
        const itemsResponse = await fetch(SHOP_CONFIG.ITEMS_FILE);
        if (!itemsResponse.ok) {
            throw new Error(`Failed to load shop items: ${itemsResponse.status}`);
        }
        shopItems = await itemsResponse.json();
        
        // Load the shop pricing data
        const pricingResponse = await fetch(SHOP_CONFIG.PRICING_FILE);
        if (!pricingResponse.ok) {
            throw new Error(`Failed to load shop pricing: ${pricingResponse.status}`);
        }
        shopPricing = await pricingResponse.json();
        
        console.log("Shop data loaded successfully:", {
            items: Object.keys(shopItems).length,
            themes: shopPricing.themes.length,
            avatars: shopPricing.avatars.length,
            coinPackages: shopPricing.coinPackages.length
        });
        
        // Update the itemManager with the loaded data
        itemManager.items = shopItems;
        
        return true;
    } catch (error) {
        console.error("Error loading shop data:", error);
        showNotification("Error loading shop items. Some items may not be available.", "error");
        return false;
    }
}

/**
 * Render themes section in the shop
 */
function renderThemesSection() {
    const themesSection = document.querySelector('.section-themes .shop-items');
    if (!themesSection) return;
    
    // Clear any existing content
    themesSection.innerHTML = '';
    
    // Group themes by category
    const categories = {};
    shopPricing.themes.forEach(theme => {
        const category = theme.category || 'Themes';
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(theme);
    });
    
    // Render each category
    Object.entries(categories).forEach(([category, themes]) => {
        // Add category header
        if (themesSection.innerHTML !== '') {
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'shop-category';
            categoryHeader.textContent = category;
            themesSection.appendChild(categoryHeader);
        }
        
        // Render themes in this category
        themes.forEach(theme => {
            const themeId = theme.id;
            const themeData = shopItems[themeId];
            
            if (!themeData) {
                console.warn(`Theme data not found for ${themeId}`);
                return;
            }
            
            const themeItem = document.createElement('div');
            themeItem.className = 'shop-item';
            themeItem.setAttribute('data-item-id', themeId);
            themeItem.setAttribute('data-price', theme.price);
            themeItem.setAttribute('data-type', 'theme');
            
            themeItem.innerHTML = `
                <div class="shop-item-image">
                    <img src="${themeData.url}" alt="${themeData.name}">
                </div>
                <div class="shop-item-details">
                    <h3 class="shop-item-title">${themeData.name}</h3>
                    <p class="shop-item-description">${themeData.description || 'Transform your Void Network experience with this theme.'}</p>
                    <div class="shop-item-price">
                        <span class="price-amount">${theme.price.toLocaleString()} coins</span>
                        <button class="buy-button" data-item-id="${themeId}" data-type="theme">${theme.comingSoon ? 'Coming Soon' : 'Buy'}</button>
                    </div>
                </div>
            `;
            
            // If it's a "coming soon" item, disable the button
            if (theme.comingSoon) {
                const button = themeItem.querySelector('.buy-button');
                if (button) button.disabled = true;
            }
            
            themesSection.appendChild(themeItem);
        });
    });
}

/**
 * Render avatars section in the shop
 */
function renderAvatarsSection() {
    const avatarsSection = document.querySelector('.section-avatars');
    if (!avatarsSection) return;
    
    // Clear any existing content
    avatarsSection.innerHTML = '';
    
    // Group avatars by category (rarity)
    const categories = {};
    shopPricing.avatars.forEach(avatar => {
        const category = avatar.category || 'Common';
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(avatar);
    });
    
    // Define category colors
    const categoryColors = {
        'Common': '#2ecc71',
        'Epic': '#9b59b6',
        'Legendary': '#e74c3c'
    };
    
    // Render each category
    Object.entries(categories).forEach(([category, avatars]) => {
        // Add category header
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'shop-category';
        categoryHeader.textContent = category;
        categoryHeader.style.color = categoryColors[category] || '#fff';
        categoryHeader.style.marginLeft = '40px';
        categoryHeader.style.fontSize = '1.1rem';
        categoryHeader.style.borderBottomColor = `rgba(${
            category === 'Common' ? '46, 204, 113, 0.3' :
            category === 'Epic' ? '155, 89, 182, 0.3' :
            category === 'Legendary' ? '231, 76, 60, 0.3' : '255, 255, 255, 0.1'
        })`;
        avatarsSection.appendChild(categoryHeader);
        
        // Create items container
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'shop-items';
        avatarsSection.appendChild(itemsContainer);
        
        // Render avatars in this category
        avatars.forEach(avatar => {
            const avatarId = avatar.id;
            const avatarData = shopItems[avatarId];
            
            if (!avatarData) {
                console.warn(`Avatar data not found for ${avatarId}`);
                return;
            }
            
            const avatarItem = document.createElement('div');
            avatarItem.className = 'shop-item';
            avatarItem.setAttribute('data-item-id', avatarId);
            avatarItem.setAttribute('data-price', avatar.price);
            avatarItem.setAttribute('data-type', 'avatar');
            
            // Add legendary badge if applicable
            const legendaryBadge = category === 'Legendary' ? 
                '<div class="legendary-badge">LEGENDARY</div>' : '';
            
            avatarItem.innerHTML = `
                ${legendaryBadge}
                <div class="shop-item-image">
                    <img src="${avatarData.url}" alt="${avatarData.name}">
                </div>
                <div class="shop-item-details">
                    <h3 class="shop-item-title">${avatarData.name}</h3>
                    <p class="shop-item-description">${avatarData.description || `A ${category.toLowerCase()} avatar for the Void Network.`}</p>
                    <div class="shop-item-price">
                        <span class="price-amount">${avatar.price.toLocaleString()} coins</span>
                        <button class="buy-button" data-item-id="${avatarId}" data-type="avatar">Buy</button>
                    </div>
                </div>
            `;
            
            itemsContainer.appendChild(avatarItem);
        });
    });
}

/**
 * Render dev items section in the shop
 */
function renderDevItemsSection() {
    const devSection = document.querySelector('.section-dev .shop-items');
    if (!devSection) return;
    
    // Clear any existing content
    devSection.innerHTML = '';
    
    // Render dev items
    shopPricing.devItems.forEach(item => {
        const itemId = item.id;
        const itemData = shopItems[itemId];
        
        if (!itemData) {
            console.warn(`Dev item data not found for ${itemId}`);
            return;
        }
        
        const devItem = document.createElement('div');
        devItem.className = 'shop-item';
        devItem.setAttribute('data-item-id', itemId);
        devItem.setAttribute('data-price', item.price);
        devItem.setAttribute('data-type', itemData.type);
        
        devItem.innerHTML = `
            <div class="dev-badge">DEV ONLY</div>
            <div class="shop-item-image">
                <img src="${itemData.url}" alt="${itemData.name}">
            </div>
            <div class="shop-item-details">
                <h3 class="shop-item-title">${itemData.name}</h3>
                <p class="shop-item-description">${itemData.description || 'Official Void Network developer item. Only available to the development team.'}</p>
                <div class="shop-item-price">
                    <span class="price-amount">DEV ACCESS</span>
                    <button class="buy-button" data-item-id="${itemId}" data-type="${itemData.type}">Equip</button>
                </div>
            </div>
        `;
        
        devSection.appendChild(devItem);
    });
}

/**
 * Render coins section in the shop
 */
function updateCoinShopItems() {
    const coinsSection = document.querySelector('.section-coins .shop-items');
    if (!coinsSection) return;
    
    // Clear any existing content
    coinsSection.innerHTML = '';
    
    // Render coin packages
    shopPricing.coinPackages.forEach(package => {
        const coinItem = document.createElement('div');
        coinItem.className = 'shop-item';
        coinItem.setAttribute('data-item-id', package.id);
        coinItem.setAttribute('data-price', package.price);
        
        // Calculate display classes based on amount
        const coinIconStyle = package.amount >= 5000000 ? 
            'style="background: linear-gradient(45deg, #FFD700, #FF8C00);"' : '';
        const coinIconContent = package.amount >= 10000000 ? '💰💰💰' : 
                               package.amount >= 5000000 ? '💰💰' : '💰';
        
        coinItem.innerHTML = `
            <div class="shop-item-image">
                <div class="coin-icon" ${coinIconStyle}>${coinIconContent}</div>
            </div>
            <div class="shop-item-details">
                <h3 class="shop-item-title">${package.amount.toLocaleString()} Void Coins</h3>
                <p class="shop-item-description">Get a ${package.amount >= 5000000 ? 'MASSIVE' : 'massive'} boost with ${package.amount.toLocaleString()} Void Coins - ${
                    package.amount >= 10000000 ? 'the ultimate package for serious players!' : 
                    'perfect for buying premium items and themes!'
                }</p>
                <div class="shop-item-price">
                    <span class="price-amount">${package.displayPrice}</span>
                    <button class="buy-coins-btn" data-amount="${package.amount}" data-price="${package.price}" data-url="${package.url}">Buy Now</button>
                </div>
            </div>
        `;
        
        coinsSection.appendChild(coinItem);
    });
    
    // Add event listeners to buy buttons
    document.querySelectorAll('.buy-coins-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling up
            
            const amount = parseInt(this.getAttribute('data-amount'), 10);
            const price = this.getAttribute('data-price');
            const url = this.getAttribute('data-url');
            const itemId = this.closest('.shop-item').getAttribute('data-item-id');
            
            showCoinPurchasePopup(itemId, amount, price, url);
        });
    });
}

/**
 * Render all shop sections
 */
function renderShopSections() {
    renderThemesSection();
    renderAvatarsSection();
    renderDevItemsSection();
    updateCoinShopItems();
    
    // Set up shop button handlers
    setupShopButtonHandlers();
}

// Export the functions to make them available
window.shopLoader = {
    loadShopData,
    renderShopSections,
    renderThemesSection,
    renderAvatarsSection,
    renderDevItemsSection,
    updateCoinShopItems
};