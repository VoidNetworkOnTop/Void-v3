/**
 * leaderboard.js - OPTIMIZED PERFORMANCE Leaderboard
 * Fixed to only fetch top users and reduce database load
 */

/**
 * Leaderboard Class - Performance Optimized
 */
class VoidLeaderboard {
    constructor(db) {
        this.db = db;
        this.unsubscribe = null;
        this.leaderboardElement = document.getElementById('leaderboardList');
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryTimeout = null;
        this.isMinimized = false;
        this.lastUpdateTime = 0;
        this.bannedUserCache = new Map();
        this.lastCacheRefresh = 0;
        this.throttleTimer = null;
        this.throttleDelay = 2000; // Increased throttle delay
        this.leaderboardData = [];
        this.isUpdating = false;
        this.topUsers = []; // Only store top users
        this.maxUsers = 50; // Limit to top 50 users instead of ALL users
        this.displayUsers = 20; // Only display top 20
        this.lastRefreshTime = 0;
        this.minRefreshInterval = 10000; // Minimum 10 seconds between refreshes
        
        console.log("VoidLeaderboard initialized - PERFORMANCE OPTIMIZED VERSION");
        
        // Set up minimize/maximize toggle
        const toggleBtn = document.getElementById('leaderboardToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleLeaderboard());
        }
        
        // Set up refresh button with throttling
        const refreshBtn = document.getElementById('leaderboardRefresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.throttledRefresh());
        }
        
        // Initial load of banned users (only once)
        this.refreshBannedUsersCache();
    }
    
    // Throttled refresh to prevent spam clicking
    throttledRefresh() {
        const now = Date.now();
        if (now - this.lastRefreshTime < this.minRefreshInterval) {
            const remaining = Math.ceil((this.minRefreshInterval - (now - this.lastRefreshTime)) / 1000);
            window.showNotification(`Please wait ${remaining} seconds before refreshing again`, "error");
            return;
        }
        
        this.forceRefreshLeaderboard();
    }
    
    // OPTIMIZED: Force refresh with proper limits and error handling
    async forceRefreshLeaderboard() {
        if (this.isUpdating) {
            console.log("Leaderboard update already in progress, skipping force refresh");
            return;
        }
        
        console.log("Forcing OPTIMIZED leaderboard refresh - TOP 50 USERS ONLY");
        this.lastRefreshTime = Date.now();
        this.isUpdating = true;
        
        try {
            // Show loading spinner
            if (this.leaderboardElement) {
                this.leaderboardElement.innerHTML = '<div class="leaderboard-loading">Loading top players...</div>';
            }
            
            // Stop current subscription
            if (this.unsubscribe) {
                this.unsubscribe();
                this.unsubscribe = null;
            }
            
            // Get only top users - MUCH more efficient
            await this.getTopUsers();
            
            // Update the leaderboard with our limited data
            this.renderLeaderboard();
            
            window.showNotification("Leaderboard refreshed successfully", "success");
        } catch (error) {
            console.error("Error during forced leaderboard refresh:", error);
            window.showNotification("Error refreshing leaderboard: " + error.message, "error");
            
            // Show error state
            this.showErrorState("Error loading leaderboard: " + error.message);
        } finally {
            this.isUpdating = false;
        }
    }
    
    // OPTIMIZED: Get only top users with proper limits and indexing
    async getTopUsers() {
        console.log(`Getting top ${this.maxUsers} users from database with optimized query`);
        
        try {
            // Check if Firebase is initialized
            if (!firebase || !firebase.firestore) {
                throw new Error("Firebase not initialized properly");
            }
            
            console.log("Firebase initialized correctly - fetching top users only");
            
            // First refresh banned cache (only if needed)
            const cacheAge = Date.now() - this.lastCacheRefresh;
            if (cacheAge > 300000) { // 5 minutes
                await this.refreshBannedUsersCache();
            }
            
            // OPTIMIZED QUERY: Get only top users by balance with LIMIT
            // This is much more efficient than getting ALL users
            const usersRef = firebase.firestore().collection('users');
            
            console.log(`Fetching top ${this.maxUsers} users by balance...`);
            
            // Query top users by accountBalance in descending order with LIMIT
            // This uses an index and is much faster than loading all users
            const topUsersQuery = usersRef
                .orderBy('accountBalance', 'desc')
                .limit(this.maxUsers);
            
            const topUsersSnapshot = await topUsersQuery.get();
            
            console.log(`Retrieved ${topUsersSnapshot.size} top users (limited query)`);
            
            // Process only the top users (much smaller dataset)
            const topUsersData = [];
            let bannedCount = 0;
            
            topUsersSnapshot.forEach(doc => {
                if (!doc.exists) return;
                
                const userId = doc.id;
                const userData = doc.data();
                
                // Check for banned status
                const isBanned = 
                    userData.banned === true || 
                    userData.isBanned === true || 
                    userData.status === 'banned' || 
                    this.bannedUserCache.has(userId);
                
                if (isBanned) {
                    bannedCount++;
                    return;
                }
                
                // Add valid user to our data array
                topUsersData.push({
                    id: userId,
                    username: userData.username || 'Unknown',
                    accountBalance: userData.accountBalance || 0,
                    avatar: null // We'll get this from leaderboard if available
                });
            });
            
            console.log(`Processed ${topUsersData.length} valid top users (${bannedCount} banned)`);
            
            // Already sorted by query, but ensure it's correct
            topUsersData.sort((a, b) => b.accountBalance - a.accountBalance);
            
            // Store only top users (not all users)
            this.topUsers = topUsersData;
            
            // OPTIMIZED: Get avatar data only for top users we're displaying
            try {
                const userIds = this.topUsers.slice(0, this.displayUsers).map(user => user.id);
                
                if (userIds.length > 0) {
                    // Get leaderboard data only for users we're displaying
                    const leaderboardRefs = userIds.map(id => 
                        firebase.firestore().collection('leaderboard').doc(id)
                    );
                    
                    // Use Promise.allSettled to handle individual failures gracefully
                    const leaderboardDocs = await Promise.allSettled(
                        leaderboardRefs.map(ref => ref.get())
                    );
                    
                    // Process avatar data
                    leaderboardDocs.forEach((result, index) => {
                        if (result.status === 'fulfilled' && result.value.exists) {
                            const leaderboardData = result.value.data();
                            if (leaderboardData.equippedAvatar && this.topUsers[index]) {
                                const avatarId = leaderboardData.equippedAvatar;
                                this.topUsers[index].avatar = window.itemManager?.items[avatarId]?.url || null;
                            }
                        }
                    });
                }
                
                console.log(`Updated avatar data for top ${userIds.length} users`);
            } catch (error) {
                console.error("Error getting avatar data:", error);
                // Continue without avatars if there's an error
            }
            
            return this.topUsers;
        } catch (error) {
            console.error("Error getting top users:", error);
            throw error;
        }
    }
    
    // OPTIMIZED: Render only what we need with better DOM handling
    renderLeaderboard() {
        if (!this.leaderboardElement) {
            console.error("Leaderboard element not found");
            return;
        }
        
        if (this.topUsers.length === 0) {
            this.leaderboardElement.innerHTML = '<div class="leaderboard-loading">No players available</div>';
            return;
        }
        
        console.log(`Rendering leaderboard with ${this.topUsers.length} top users`);
        
        // Use DocumentFragment for efficient DOM manipulation
        const fragment = document.createDocumentFragment();
        
        // Display exactly 20 users, or as many as available
        const displayCount = Math.min(this.topUsers.length, this.displayUsers);
        
        for (let i = 0; i < displayCount; i++) {
            const userData = this.topUsers[i];
            const leaderboardItem = this.createLeaderboardItem(userData, i + 1);
            fragment.appendChild(leaderboardItem);
        }
        
        // Add placeholders if needed (only if we have fewer than 20)
        if (displayCount < this.displayUsers) {
            for (let i = displayCount; i < this.displayUsers; i++) {
                const placeholderItem = this.createPlaceholderItem(i + 1);
                fragment.appendChild(placeholderItem);
            }
        }
        
        // Replace all content at once (much more efficient)
        this.leaderboardElement.innerHTML = '';
        this.leaderboardElement.appendChild(fragment);
        
        // Save leaderboard data (only top users)
        this.leaderboardData = this.topUsers.slice(0, this.displayUsers);
        
        // Highlight special users
        this.highlightSpecialUsers();
    }
    
    // Helper method to create a leaderboard item
    createLeaderboardItem(userData, rank) {
        const leaderboardItem = document.createElement('div');
        leaderboardItem.className = 'leaderboard-item';
        leaderboardItem.id = `leaderboard-item-${userData.id}`;
        
        // Create rank element
        const rankSpan = document.createElement('span');
        rankSpan.className = 'leaderboard-rank';
        rankSpan.textContent = `#${rank}`;
        leaderboardItem.appendChild(rankSpan);
        
        // Create username container
        const usernameContainer = document.createElement('div');
        usernameContainer.className = 'leaderboard-username-container';
        
        // Add avatar if present
        if (userData.avatar) {
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'leaderboard-avatar';
            
            const avatarImg = document.createElement('img');
            avatarImg.src = userData.avatar;
            avatarImg.alt = 'User avatar';
            avatarImg.loading = 'lazy'; // Lazy load avatars for better performance
            
            avatarDiv.appendChild(avatarImg);
            usernameContainer.appendChild(avatarDiv);
        }
        
        // Create and add username
        const usernameSpan = document.createElement('span');
        usernameSpan.className = 'leaderboard-username';
        usernameSpan.textContent = userData.username;
        usernameContainer.appendChild(usernameSpan);
        
        leaderboardItem.appendChild(usernameContainer);
        
        // Create and add balance
        const balanceSpan = document.createElement('span');
        balanceSpan.className = 'leaderboard-balance';
        balanceSpan.textContent = userData.accountBalance.toLocaleString();
        leaderboardItem.appendChild(balanceSpan);
        
        return leaderboardItem;
    }
    
    // Helper method to create placeholder items
    createPlaceholderItem(rank) {
        const placeholderItem = document.createElement('div');
        placeholderItem.className = 'leaderboard-item';
        
        const placeholderRank = document.createElement('span');
        placeholderRank.className = 'leaderboard-rank';
        placeholderRank.textContent = `#${rank}`;
        placeholderItem.appendChild(placeholderRank);
        
        const placeholderUsernameContainer = document.createElement('div');
        placeholderUsernameContainer.className = 'leaderboard-username-container';
        
        const placeholderUsername = document.createElement('span');
        placeholderUsername.className = 'leaderboard-username';
        placeholderUsername.textContent = '...';
        placeholderUsernameContainer.appendChild(placeholderUsername);
        placeholderItem.appendChild(placeholderUsernameContainer);
        
        const placeholderBalance = document.createElement('span');
        placeholderBalance.className = 'leaderboard-balance';
        placeholderBalance.textContent = '--';
        placeholderItem.appendChild(placeholderBalance);
        
        return placeholderItem;
    }
    
    // OPTIMIZED: Banned users cache refresh with better error handling
    async refreshBannedUsersCache() {
        try {
            console.log("Refreshing banned users cache");
            this.bannedUserCache.clear();
            
            // OPTIMIZED: Limit banned users query and add timeout
            const bannedUsersRef = firebase.firestore().collection('banned_users');
            const bannedUsersQuery = bannedUsersRef.limit(1000); // Reasonable limit
            
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Banned users query timeout')), 5000)
            );
            
            const bannedUsersSnapshot = await Promise.race([
                bannedUsersQuery.get(),
                timeoutPromise
            ]);
            
            bannedUsersSnapshot.forEach(doc => {
                this.bannedUserCache.set(doc.id, true);
            });
            
            this.lastCacheRefresh = Date.now();
            console.log(`Loaded ${this.bannedUserCache.size} banned users into cache`);
        } catch (error) {
            console.error("Error refreshing banned users cache:", error);
            // Continue without banned cache rather than failing
        }
    }
    
    // Update a specific user's balance without full refresh
    updateUserBalance(userId, newBalance) {
        try {
            // Find user in current data
            const userIndex = this.topUsers.findIndex(user => user.id === userId);
            
            if (userIndex !== -1) {
                // Update the balance
                this.topUsers[userIndex].accountBalance = newBalance;
                
                // Re-sort the array
                this.topUsers.sort((a, b) => b.accountBalance - a.accountBalance);
                
                // Re-render only if the user is still in top 20
                const newUserIndex = this.topUsers.findIndex(user => user.id === userId);
                if (newUserIndex < this.displayUsers) {
                    // User is still in top 20, do a quick re-render
                    this.renderLeaderboard();
                }
            } else {
                // User not in current top users, might need a full refresh if they're now in top
                if (newBalance > (this.topUsers[this.topUsers.length - 1]?.accountBalance || 0)) {
                    // User might be in top now, schedule a refresh
                    setTimeout(() => this.throttledRefresh(), 1000);
                }
            }
        } catch (error) {
            console.error("Error updating user balance:", error);
        }
    }
    
    // Toggle leaderboard visibility
    toggleLeaderboard() {
        const container = document.querySelector('.leaderboard-container');
        const toggleBtn = document.getElementById('leaderboardToggle');
        
        if (container) {
            if (this.isMinimized) {
                // Maximize
                container.classList.remove('leaderboard-minimized');
                if (toggleBtn) toggleBtn.textContent = '−';
                this.isMinimized = false;
                
                // For mobile
                if (window.innerWidth <= 768) {
                    container.classList.add('expanded');
                }
            } else {
                // Minimize
                container.classList.add('leaderboard-minimized');
                if (toggleBtn) toggleBtn.textContent = '+';
                this.isMinimized = true;
                
                // For mobile
                if (window.innerWidth <= 768) {
                    container.classList.remove('expanded');
                }
            }
        }
    }
    
    // Show error state in leaderboard
    showErrorState(message) {
        if (this.leaderboardElement) {
            this.leaderboardElement.innerHTML = `
                <div class="leaderboard-error">${message}</div>
                <div class="leaderboard-retry">
                    <button id="leaderboard-retry-button">Retry</button>
                </div>
            `;
            
            // Add retry functionality
            const retryButton = document.getElementById('leaderboard-retry-button');
            if (retryButton) {
                retryButton.addEventListener('click', () => {
                    this.throttledRefresh();
                });
            }
        }
    }
    
    // Highlight special users with better performance
    highlightSpecialUsers() {
        // Use querySelectorAll once and cache the results
        const usernameElements = this.leaderboardElement.querySelectorAll('.leaderboard-username');
        
        // Process in batches to avoid blocking the main thread
        const batchSize = 5;
        let currentIndex = 0;
        
        const processBatch = () => {
            const endIndex = Math.min(currentIndex + batchSize, usernameElements.length);
            
            for (let i = currentIndex; i < endIndex; i++) {
                const el = usernameElements[i];
                const username = el.textContent;
                
                // Apply special styling based on username
                if (username === 'VoidNetworkOnTop') {
                    this.applySpecialStyling(el, '#1DA1F2', '✓', 'verified-badge');
                } else if (username === 'void_client' || username === 'queso') {
                    this.applySpecialStyling(el, '#FF5722', 'DEV', 'dev-badge');
                }
            }
            
            currentIndex = endIndex;
            
            // Continue processing if there are more elements
            if (currentIndex < usernameElements.length) {
                requestAnimationFrame(processBatch);
            }
        };
        
        // Start processing
        requestAnimationFrame(processBatch);
    }
    
    // Helper method to apply special styling
    applySpecialStyling(el, color, badgeText, badgeClass) {
        el.style.color = color;
        el.style.textShadow = `0 0 5px ${color}30`;
        el.style.fontWeight = 'bold';
        
        // Add badge if it doesn't exist
        if (!el.querySelector(`.${badgeClass}`)) {
            const badge = document.createElement('span');
            badge.className = badgeClass;
            badge.textContent = badgeText;
            badge.style.marginLeft = '4px';
            badge.style.color = color;
            if (badgeText === 'DEV') {
                badge.style.fontSize = '0.7em';
            }
            el.appendChild(badge);
        }
    }
    
    // Stop leaderboard updates
    stopLeaderboardUpdates() {
        if (this.unsubscribe) {
            console.log("Stopping leaderboard updates");
            this.unsubscribe();
            this.unsubscribe = null;
        }
        
        // Clear any pending timeouts
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
        }
        
        if (this.throttleTimer) {
            clearTimeout(this.throttleTimer);
        }
    }
}

// OPTIMIZED: Leaderboard refresh functionality with better throttling
let leaderboardRefreshInterval;

window.refreshLeaderboard = function() {
    console.log("Manual leaderboard refresh requested");
    
    // If leaderboard exists, force a refresh (with throttling)
    if (window.voidLeaderboard) {
        window.voidLeaderboard.throttledRefresh();
    }
};

function startLeaderboardRefreshInterval() {
    // Clear any existing interval
    if (leaderboardRefreshInterval) {
        clearInterval(leaderboardRefreshInterval);
    }
    
    // OPTIMIZED: Longer interval to reduce server load (60 seconds instead of 30)
    leaderboardRefreshInterval = setInterval(() => {
        if (window.voidLeaderboard && !window.voidLeaderboard.isUpdating) {
            console.log("Auto-refreshing leaderboard (60s interval)");
            window.voidLeaderboard.forceRefreshLeaderboard();
        }
    }, 60000); // 60 seconds
    
    window.leaderboardRefreshInterval = leaderboardRefreshInterval;
}

// Initialize Leaderboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Leaderboard
    window.voidLeaderboard = new VoidLeaderboard(window.db);
    
    console.log("OPTIMIZED Leaderboard initialized");
    
    // Initial load with delay to ensure Firebase is ready
    setTimeout(() => {
        window.voidLeaderboard.getTopUsers().then(() => {
            window.voidLeaderboard.renderLeaderboard();
            
            // Start periodic leaderboard refresh (longer interval)
            startLeaderboardRefreshInterval();
        }).catch(error => {
            console.error("Error during initial leaderboard setup:", error);
            window.voidLeaderboard.showErrorState("Error loading leaderboard: " + error.message);
        });
    }, 2000); // Slightly longer delay for better initialization
});

// Core ready event
document.addEventListener('core-ready', function() {
    console.log("Core ready event received - will refresh leaderboard");
    
    if (!window.voidLeaderboard) {
        window.voidLeaderboard = new VoidLeaderboard(window.db);
    }
    
    // Throttled refresh after core is ready
    setTimeout(() => {
        if (window.voidLeaderboard) {
            window.voidLeaderboard.throttledRefresh();
        }
    }, 3000);
});

// Clean up when page unloads
window.addEventListener('beforeunload', () => {
    if (window.voidLeaderboard) {
        window.voidLeaderboard.stopLeaderboardUpdates();
    }
    
    if (leaderboardRefreshInterval) {
        clearInterval(leaderboardRefreshInterval);
    }
});

console.log('OPTIMIZED Performance Leaderboard system loaded');
