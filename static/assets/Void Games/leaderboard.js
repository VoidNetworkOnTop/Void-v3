/**
 * leaderboard.js - Simplified Leaderboard functionality for Void Network
 * ONLY filters out users marked as banned - includes all other users
 */

/**
 * Leaderboard Class
 * Handles fetching and displaying the leaderboard
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
        this.bannedUserCache = new Map(); // Cache for banned users to avoid repeated queries
        this.lastCacheRefresh = 0;
        this.throttleTimer = null;
        this.throttleDelay = 1000; // Reduced for more responsive updates
        this.leaderboardData = []; // Cache leaderboard data
        this.isUpdating = false; // Flag to prevent multiple concurrent updates
        
        console.log("VoidLeaderboard initialized - simplified version");
        
        // Set up minimize/maximize toggle
        const toggleBtn = document.getElementById('leaderboardToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleLeaderboard());
        }
        
        // Set up refresh button
        const refreshBtn = document.getElementById('leaderboardRefresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.forceRefreshLeaderboard());
        }
        
        // Initial load of banned users
        this.refreshBannedUsersCache();
    }
    
    // Force refresh the leaderboard when button is clicked
    async forceRefreshLeaderboard() {
        if (this.isUpdating) {
            console.log("Leaderboard update already in progress, skipping force refresh");
            return;
        }
        
        console.log("Forcing leaderboard refresh");
        this.isUpdating = true;
        
        try {
            // Show loading spinner
            if (this.leaderboardElement) {
                this.leaderboardElement.innerHTML = '<div class="leaderboard-loading">Refreshing leaderboard...</div>';
            }
            
            // Stop current subscription
            if (this.unsubscribe) {
                this.unsubscribe();
                this.unsubscribe = null;
            }
            
            // Fetch users directly from users collection first
            await this.updateUsersFromSource();
            
            // Restart leaderboard listener
            this.startLeaderboardUpdates();
            
            window.showNotification("Leaderboard refreshed successfully", "success");
        } catch (error) {
            console.error("Error during forced leaderboard refresh:", error);
            window.showNotification("Error refreshing leaderboard. Please try again.", "error");
            
            // Restart leaderboard as fallback
            this.startLeaderboardUpdates();
        } finally {
            this.isUpdating = false;
        }
    }
    
    // SIMPLIFIED: Update users directly from users collection
    async updateUsersFromSource() {
        console.log("Querying all users by balance (SIMPLIFIED VERSION)");
        
        if (!window.isOnline) {
            console.log("Device is offline, skipping user update");
            return;
        }
        
        try {
            // Refresh banned cache
            await this.refreshBannedUsersCache();
            
            // Query ALL top users by account balance
            const usersRef = firebase.firestore().collection('users');
            const userQuery = usersRef.orderBy('accountBalance', 'desc').limit(200); // Increased limit significantly
            const userSnapshot = await userQuery.get();
            
            if (userSnapshot.empty) {
                console.log("No users found");
                return;
            }
            
            console.log(`Found ${userSnapshot.size} users in total`);
            
            // Create batch for updates
            let batch = firebase.firestore().batch();
            let updateCount = 0;
            let processedCount = 0;
            let bannedCount = 0;
            
            // For each user by balance, ensure they have a leaderboard entry
            for (const docSnapshot of userSnapshot.docs) {
                if (!docSnapshot.exists) continue;
                
                const userId = docSnapshot.id;
                const userData = docSnapshot.data();
                processedCount++;
                
                // ONLY exclude explicitly banned users
                const isBanned = 
                    userData.banned === true || 
                    userData.isBanned === true || 
                    userData.status === 'banned' || 
                    this.bannedUserCache.has(userId);
                
                if (isBanned) {
                    console.log(`Skipping banned user: ${userData.username || 'Unknown'} - Balance: ${userData.accountBalance || 0}`);
                    bannedCount++;
                    continue;
                }
                
                try {
                    // Get or create leaderboard entry
                    const leaderboardRef = firebase.firestore().collection('leaderboard').doc(userId);
                    const leaderboardDoc = await leaderboardRef.get();
                    
                    const userBalance = userData.accountBalance || 0;
                    
                    if (leaderboardDoc.exists) {
                        const leaderboardData = leaderboardDoc.data();
                        
                        // Always update balance to match user balance
                        batch.update(leaderboardRef, {
                            accountBalance: userBalance,
                            username: userData.username || 'Unknown', // Ensure username is correct
                            lastSynced: new Date(),
                            banned: false // Explicitly mark as not banned
                        });
                    } else {
                        // Create new leaderboard entry
                        console.log(`Creating new leaderboard entry for ${userData.username || 'Unknown'} with balance ${userBalance}`);
                        
                        batch.set(leaderboardRef, {
                            username: userData.username || 'Unknown',
                            accountBalance: userBalance,
                            joinDate: new Date(),
                            lastSynced: new Date(),
                            banned: false // Explicitly mark as not banned
                        });
                    }
                    
                    updateCount++;
                    
                    // Commit batch in chunks to avoid limits
                    if (updateCount >= 20) {
                        await batch.commit();
                        console.log(`Committed batch of ${updateCount} updates`);
                        batch = firebase.firestore().batch();
                        updateCount = 0;
                    }
                } catch (error) {
                    console.error(`Error updating leaderboard for user ${userId}:`, error);
                    // Continue with next user
                }
            }
            
            // Commit any remaining updates
            if (updateCount > 0) {
                await batch.commit();
                console.log(`Committed final batch of ${updateCount} updates`);
            }
            
            console.log(`Processed ${processedCount} users, banned: ${bannedCount}`);
            this.lastUpdateTime = Date.now();
            
        } catch (error) {
            console.error("Error updating users from source:", error);
            throw error;
        }
    }
    
    // Load banned users into cache - SIMPLIFIED to only use banned_users collection
    async refreshBannedUsersCache() {
        try {
            console.log("Refreshing banned users cache");
            this.bannedUserCache.clear();
            
            if (!window.isOnline) {
                console.log("Device is offline, skipping banned users refresh");
                return;
            }
            
            // Get all banned users from the banned_users collection
            const bannedUsersSnapshot = await firebase.firestore().collection('banned_users').get();
            
            bannedUsersSnapshot.forEach(doc => {
                this.bannedUserCache.set(doc.id, true);
            });
            
            this.lastCacheRefresh = Date.now();
            console.log(`Loaded ${this.bannedUserCache.size} banned users into cache`);
        } catch (error) {
            console.error("Error refreshing banned users cache:", error);
        }
    }
    
    // SIMPLIFIED: Only check banned_users collection and explicit banned flags
    async isUserBanned(userId, userData) {
        if (!userId) return false;
        
        // Check explicit banned flags
        if (userData.banned === true || userData.isBanned === true || userData.status === 'banned') {
            return true;
        }
        
        // Check banned_users collection cache
        return this.bannedUserCache.has(userId);
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
    
    // Start real-time leaderboard updates - SIMPLIFIED to use larger limit
    async startLeaderboardUpdates() {
        try {
            if (this.unsubscribe) {
                // If already subscribed, unsubscribe first
                this.unsubscribe();
                this.unsubscribe = null;
            }
            
            // Show loading state
            if (this.leaderboardElement) {
                this.leaderboardElement.innerHTML = '<div class="leaderboard-loading">Loading top players...</div>';
            }
            
            console.log("Starting leaderboard updates");
            
            // Set up query with much larger limit to ensure we get all relevant users
            const leaderboardRef = firebase.firestore().collection('leaderboard');
            let q;
            
            try {
                // Use a much larger limit
                q = leaderboardRef.orderBy('accountBalance', 'desc').limit(200);
            } catch (error) {
                console.error("Error creating leaderboard query:", error);
                this.showErrorState("Error loading leaderboard");
                return;
            }
            
            // Set up real-time listener
            try {
                this.unsubscribe = q.onSnapshot(
                    {
                        includeMetadataChanges: true
                    },
                    async (querySnapshot) => {
                        // Reset retry count on successful data
                        this.retryCount = 0;
                        
                        // Process updates immediately
                        await this.updateLeaderboardUI(querySnapshot);
                    }, 
                    (error) => {
                        console.error("Leaderboard listener error:", error);
                        
                        this.showErrorState("Connection error. Retrying...");
                        
                        // Retry after a short delay
                        if (this.retryCount < this.maxRetries) {
                            this.retryCount++;
                            console.log(`Retrying leaderboard connection (${this.retryCount}/${this.maxRetries})...`);
                            clearTimeout(this.retryTimeout);
                            this.retryTimeout = setTimeout(() => this.startLeaderboardUpdates(), 5000);
                        } else {
                            this.showErrorState("Connection failed. Please reload the page.");
                        }
                    }
                );
            } catch (error) {
                console.error("Error setting up leaderboard listener:", error);
                this.showErrorState("Error loading leaderboard");
            }
        } catch (error) {
            console.error("Error setting up leaderboard:", error);
            // Retry immediately if there's an error
            this.showErrorState("Loading error. Retrying...");
            setTimeout(() => this.startLeaderboardUpdates(), 5000);
        }
    }
    
    // Show error state in leaderboard
    showErrorState(message) {
        if (this.leaderboardElement) {
            // Clear existing content
            this.leaderboardElement.innerHTML = '';
            
            // Create error div
            const errorDiv = document.createElement('div');
            errorDiv.className = 'leaderboard-error';
            errorDiv.innerText = message;
            this.leaderboardElement.appendChild(errorDiv);
            
            // Create retry container
            const retryDiv = document.createElement('div');
            retryDiv.className = 'leaderboard-retry';
            
            // Create retry button
            const retryButton = document.createElement('button');
            retryButton.id = 'leaderboard-retry-button';
            retryButton.innerText = 'Retry';
            retryButton.addEventListener('click', () => {
                this.startLeaderboardUpdates();
            });
            
            retryDiv.appendChild(retryButton);
            this.leaderboardElement.appendChild(retryDiv);
        }
    }
    
    // SIMPLIFIED: Update leaderboard UI with snapshot data - only filter banned users
    async updateLeaderboardUI(querySnapshot) {
        if (!this.leaderboardElement) {
            console.error("Leaderboard element not found");
            return;
        }
        
        // Clear the leaderboard
        this.leaderboardElement.innerHTML = '';
        
        if (querySnapshot.empty) {
            this.leaderboardElement.innerHTML = '<div class="leaderboard-loading">No players yet</div>';
            return;
        }
        
        console.log(`Received ${querySnapshot.size} leaderboard entries - filtering banned users`);
        
        // Create array of valid users (not banned)
        const validUsers = [];
        let bannedCount = 0;
        
        // Process leaderboard entries
        querySnapshot.forEach((docSnapshot) => {
            if (docSnapshot.exists) {
                const userData = docSnapshot.data();
                const userId = docSnapshot.id;
                
                // ONLY skip users explicitly marked as banned
                if (userData.banned === true || this.bannedUserCache.has(userId)) {
                    bannedCount++;
                    return;
                }
                
                // Include all other users
                validUsers.push({
                    id: userId,
                    username: userData.username || 'Unknown',
                    accountBalance: userData.accountBalance || 0,
                    avatar: userData.equippedAvatar ? window.itemManager?.items[userData.equippedAvatar]?.url : null
                });
            }
        });
        
        console.log(`Filtered leaderboard entries: ${validUsers.length} valid, ${bannedCount} banned`);
        
        // If no valid users, show message
        if (validUsers.length === 0) {
            this.leaderboardElement.innerHTML = '<div class="leaderboard-loading">No players available</div>';
            return;
        }
        
        // Sort by account balance
        validUsers.sort((a, b) => b.accountBalance - a.accountBalance);
        
        // Store in cached data
        this.leaderboardData = validUsers.slice(0, 20);
        
        // Display exactly 20 users, or as many as available
        const displayCount = Math.min(validUsers.length, 20);
        
        for (let i = 0; i < displayCount; i++) {
            const userData = validUsers[i];
            const leaderboardItem = document.createElement('div');
            leaderboardItem.className = 'leaderboard-item';
            leaderboardItem.id = `leaderboard-item-${userData.id}`;
            
            // Create rank element
            const rankSpan = document.createElement('span');
            rankSpan.className = 'leaderboard-rank';
            rankSpan.innerText = `#${i + 1}`;
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
                
                avatarDiv.appendChild(avatarImg);
                usernameContainer.appendChild(avatarDiv);
            }
            
            // Create and add username
            const usernameSpan = document.createElement('span');
            usernameSpan.className = 'leaderboard-username';
            usernameSpan.innerText = userData.username;
            usernameContainer.appendChild(usernameSpan);
            
            // Add username container to item
            leaderboardItem.appendChild(usernameContainer);
            
            // Create and add balance
            const balanceSpan = document.createElement('span');
            balanceSpan.className = 'leaderboard-balance';
            balanceSpan.innerText = userData.accountBalance.toLocaleString();
            leaderboardItem.appendChild(balanceSpan);
            
            this.leaderboardElement.appendChild(leaderboardItem);
        }
        
        // Add placeholders if needed
        if (displayCount < 20) {
            for (let i = displayCount; i < 20; i++) {
                const placeholderItem = document.createElement('div');
                placeholderItem.className = 'leaderboard-item';
                
                const placeholderRank = document.createElement('span');
                placeholderRank.className = 'leaderboard-rank';
                placeholderRank.innerText = `#${i + 1}`;
                placeholderItem.appendChild(placeholderRank);
                
                const placeholderUsernameContainer = document.createElement('div');
                placeholderUsernameContainer.className = 'leaderboard-username-container';
                
                const placeholderUsername = document.createElement('span');
                placeholderUsername.className = 'leaderboard-username';
                placeholderUsername.innerText = '...';
                placeholderUsernameContainer.appendChild(placeholderUsername);
                placeholderItem.appendChild(placeholderUsernameContainer);
                
                const placeholderBalance = document.createElement('span');
                placeholderBalance.className = 'leaderboard-balance';
                placeholderBalance.innerText = '--';
                placeholderItem.appendChild(placeholderBalance);
                
                this.leaderboardElement.appendChild(placeholderItem);
            }
        }
        
        // Highlight special users
        this.highlightSpecialUsers();
    }
    
    // Specifically highlight special usernames
    highlightSpecialUsers() {
        const usernameElements = this.leaderboardElement.querySelectorAll('.leaderboard-username');
        
        usernameElements.forEach(el => {
            // Get username text safely
            const username = el.innerText;
            
            // Explicitly check for "VoidNetworkOnTop" username
            if (username === 'VoidNetworkOnTop') {
                // Apply blue styling
                el.style.color = '#1DA1F2';
                el.style.textShadow = '0 0 5px rgba(29, 161, 242, 0.3)';
                el.style.fontWeight = 'bold';
                
                // Add verification badge if it doesn't exist
                if (!el.querySelector('.verified-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'verified-badge';
                    badge.innerText = '✓'; // Use innerText for badge text
                    badge.style.marginLeft = '4px';
                    badge.style.color = '#1DA1F2';
                    el.appendChild(badge);
                }
            }
            
            // Handle developer accounts
            if (username === 'void_client' || username === 'queso') {
                // Apply special styling
                el.style.color = '#FF5722';
                el.style.textShadow = '0 0 5px rgba(255, 87, 34, 0.3)';
                el.style.fontWeight = 'bold';
                
                // Add dev badge if it doesn't exist
                if (!el.querySelector('.dev-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'dev-badge';
                    badge.innerText = 'DEV'; // Use innerText for badge text
                    badge.style.marginLeft = '4px';
                    badge.style.color = '#FF5722';
                    badge.style.fontSize = '0.7em';
                    el.appendChild(badge);
                }
            }
        });
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

// Leaderboard refresh functionality
let leaderboardRefreshInterval;

window.refreshLeaderboard = function() {
    console.log("Manual leaderboard refresh requested");
    
    // Don't attempt refresh if offline
    if (!window.isOnline) {
        console.log("Device is offline, skipping leaderboard refresh");
        return;
    }
    
    // Stop current listener and restart to force refresh
    if (window.voidLeaderboard) {
        window.voidLeaderboard.stopLeaderboardUpdates();
        
        // Force a complete refresh by querying users directly
        window.voidLeaderboard.updateUsersFromSource().then(() => {
            // Then restart the leaderboard updates
            window.voidLeaderboard.startLeaderboardUpdates();
        }).catch(error => {
            console.error("Error refreshing leaderboard:", error);
            window.voidLeaderboard.startLeaderboardUpdates();
        });
    }
};

function startLeaderboardRefreshInterval() {
    // Clear any existing interval
    if (leaderboardRefreshInterval) {
        clearInterval(leaderboardRefreshInterval);
    }
    
    // Set up new interval - refresh every minute
    leaderboardRefreshInterval = setInterval(window.refreshLeaderboard, 60000); // Refresh every 60 seconds
    window.leaderboardRefreshInterval = leaderboardRefreshInterval;
}

// Initialize Leaderboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Leaderboard
    window.voidLeaderboard = new VoidLeaderboard(window.db);
    
    // Query users first for initial population
    window.voidLeaderboard.updateUsersFromSource().then(() => {
        // Then start real-time updates
        window.voidLeaderboard.startLeaderboardUpdates();
        
        // Start periodic leaderboard refresh
        startLeaderboardRefreshInterval();
    }).catch(error => {
        console.error("Error during initial leaderboard setup:", error);
        // Try starting leaderboard anyway
        window.voidLeaderboard.startLeaderboardUpdates();
        startLeaderboardRefreshInterval();
    });
    
    console.log("Leaderboard system initialized");
});

// Core ready event
document.addEventListener('core-ready', function() {
    // Make sure leaderboard is initialized
    if (!window.voidLeaderboard) {
        window.voidLeaderboard = new VoidLeaderboard(window.db);
        window.voidLeaderboard.updateUsersFromSource().then(() => {
            window.voidLeaderboard.startLeaderboardUpdates();
        });
    }
    
    // Force a refresh
    setTimeout(() => {
        window.refreshLeaderboard();
    }, 2000);
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

console.log('Simplified Leaderboard system loaded');
