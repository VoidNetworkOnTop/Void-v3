/**
 * leaderboard.js - Fixed Connectivity Leaderboard
 * Retrieves ALL users without limits and ignores offline checks
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
        this.allUsers = []; // Store all users for easy access
        
        console.log("VoidLeaderboard initialized - FIXED CONNECTIVITY VERSION");
        
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
        
        console.log("Forcing COMPLETE leaderboard refresh");
        this.isUpdating = true;
        
        try {
            // Show loading spinner
            if (this.leaderboardElement) {
                this.leaderboardElement.innerHTML = '<div class="leaderboard-loading">Refreshing leaderboard (getting ALL users)...</div>';
            }
            
            // Stop current subscription
            if (this.unsubscribe) {
                this.unsubscribe();
                this.unsubscribe = null;
            }
            
            // Check if Firebase Functions is available
            if (typeof firebase.functions === 'function') {
                // Use Cloud Function if available
                try {
                    console.log("Using Cloud Function for leaderboard update");
                    
                    // Check if user is logged in
                    if (!firebase.auth().currentUser) {
                        console.log("User must be logged in to refresh leaderboard");
                        window.showNotification("Please log in to refresh the leaderboard", "error");
                        this.showErrorState("You must be logged in to refresh the leaderboard");
                        this.isUpdating = false;
                        return;
                    }
                    
                    // Get the Firebase Functions instance
                    const functions = firebase.functions();
                    const triggerLeaderboardUpdate = functions.httpsCallable('triggerLeaderboardUpdate');
                    
                    // Call the cloud function to update the leaderboard
                    const result = await triggerLeaderboardUpdate();
                    console.log("Leaderboard update succeeded via Cloud Function:", result.data);
                    window.showNotification(`Leaderboard updated via Cloud Function! Updated ${result.data.count} users.`, "success");
                } catch (functionError) {
                    console.error("Error with Cloud Function, falling back to direct method:", functionError);
                    // Fall back to direct method
                }
            } else {
                console.log("Firebase Functions not available, using direct method");
            }
            
            // Get ALL users first - IGNORING OFFLINE CHECK
            await this.getAllUsers();
            
            // Update the leaderboard with our comprehensive data
            this.renderLeaderboard();
            
            window.showNotification("Leaderboard refreshed successfully with ALL users", "success");
        } catch (error) {
            console.error("Error during forced leaderboard refresh:", error);
            window.showNotification("Error refreshing leaderboard: " + error.message, "error");
            
            // Show error state
            this.showErrorState("Error getting all users: " + error.message);
        } finally {
            this.isUpdating = false;
        }
    }
    
    // NEW METHOD: Get ALL users from the database without any limits
    async getAllUsers() {
        console.log("Getting ALL users from database without limits");
        
        // REMOVED OFFLINE CHECK - assume we're always online
        
        try {
            console.log("Checking Firestore connection status...");
            
            // Check if Firebase is initialized
            if (!firebase || !firebase.firestore) {
                throw new Error("Firebase not initialized properly");
            }
            
            console.log("Firebase initialized correctly - continuing");
            
            // First refresh banned cache
            await this.refreshBannedUsersCache();
            
            // Get ALL users from users collection - NO LIMIT
            const usersRef = firebase.firestore().collection('users');
            
            console.log("Fetching ALL users from database...");
            
            // We need to get a snapshot of all users without a limit
            const allUsersSnapshot = await usersRef.get();
            
            console.log(`Retrieved ${allUsersSnapshot.size} total users`);
            
            // Process all users
            const allUsersData = [];
            let bannedCount = 0;
            
            allUsersSnapshot.forEach(doc => {
                if (!doc.exists) return;
                
                const userId = doc.id;
                const userData = doc.data();
                
                // ONLY check for banned status
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
                allUsersData.push({
                    id: userId,
                    username: userData.username || 'Unknown',
                    accountBalance: userData.accountBalance || 0,
                    avatar: null // We'll get this from leaderboard if available
                });
            });
            
            console.log(`Processed ${allUsersData.length} valid users (${bannedCount} banned)`);
            
            // Log top 10 users by balance for debugging
            const top10 = [...allUsersData].sort((a, b) => b.accountBalance - a.accountBalance).slice(0, 10);
            console.log("Top 10 users by balance:");
            top10.forEach((user, index) => {
                console.log(`${index + 1}. ${user.username}: ${user.accountBalance.toLocaleString()}`);
            });
            
            // Save all user data
            this.allUsers = allUsersData;
            
            // Sort by balance
            this.allUsers.sort((a, b) => b.accountBalance - a.accountBalance);
            
            // Check if we have Firebase Functions to avoid direct update
            if (typeof firebase.functions !== 'function') {
                // Only update leaderboard directly if Functions isn't available
                try {
                    // Now update all leaderboard entries to match our user data
                    // This ensures the leaderboard is in sync with user data
                    let batch = firebase.firestore().batch();
                    let updateCount = 0;
                    
                    // Update each in a batch - focus on top 100 to avoid too many writes
                    const topUsersToUpdate = Math.min(100, this.allUsers.length);
                    console.log(`Updating top ${topUsersToUpdate} users in leaderboard collection`);
                    
                    for (let i = 0; i < topUsersToUpdate; i++) {
                        const user = this.allUsers[i];
                        const leaderboardRef = firebase.firestore().collection('leaderboard').doc(user.id);
                        
                        // Always set the entry, overwriting if needed
                        batch.set(leaderboardRef, {
                            username: user.username,
                            accountBalance: user.accountBalance,
                            joinDate: new Date(), // Default in case it doesn't exist
                            lastSynced: new Date(),
                            banned: false // Explicitly mark as not banned
                        }, { merge: true }); // Use merge to keep other fields
                        
                        updateCount++;
                        
                        // Commit in batches to avoid limits
                        if (updateCount >= 20) {
                            await batch.commit();
                            console.log(`Committed batch of ${updateCount} leaderboard updates`);
                            batch = firebase.firestore().batch();
                            updateCount = 0;
                        }
                    }
                    
                    // Commit any remaining updates
                    if (updateCount > 0) {
                        await batch.commit();
                        console.log(`Committed final batch of ${updateCount} leaderboard updates`);
                    }
                } catch (updateError) {
                    console.error("Error updating leaderboard entries:", updateError);
                    // Continue without updates if there's an error
                }
            }
            
            // Get avatar data from leaderboard - this part is optional
            try {
                // Get leaderboard data to get avatars
                const leaderboardRef = firebase.firestore().collection('leaderboard');
                const leaderboardSnapshot = await leaderboardRef.get();
                
                // Create a map of userId -> avatar
                const avatarMap = new Map();
                
                leaderboardSnapshot.forEach(doc => {
                    if (!doc.exists) return;
                    
                    const leaderboardData = doc.data();
                    if (leaderboardData.equippedAvatar) {
                        avatarMap.set(doc.id, leaderboardData.equippedAvatar);
                    }
                });
                
                // Update avatars in our all users array
                this.allUsers.forEach(user => {
                    if (avatarMap.has(user.id)) {
                        const avatarId = avatarMap.get(user.id);
                        user.avatar = window.itemManager?.items[avatarId]?.url || null;
                    }
                });
                
                console.log(`Updated avatar data for users`);
            } catch (error) {
                console.error("Error getting avatar data:", error);
                // Continue without avatars if there's an error
            }
            
            return this.allUsers;
        } catch (error) {
            console.error("Error getting all users:", error);
            throw error;
        }
    }
    
    // Render leaderboard with our all users data
    renderLeaderboard() {
        if (!this.leaderboardElement) {
            console.error("Leaderboard element not found");
            return;
        }
        
        if (this.allUsers.length === 0) {
            this.leaderboardElement.innerHTML = '<div class="leaderboard-loading">No players available</div>';
            return;
        }
        
        // Clear the leaderboard
        this.leaderboardElement.innerHTML = '';
        
        console.log(`Rendering leaderboard with ${this.allUsers.length} total users`);
        
        // Save top users to leaderboard data
        this.leaderboardData = this.allUsers.slice(0, 20);
        
        // Display exactly 20 users, or as many as available
        const displayCount = Math.min(this.allUsers.length, 20);
        
        for (let i = 0; i < displayCount; i++) {
            const userData = this.allUsers[i];
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
    
    // Simplified banned users cache refresh - NO OFFLINE CHECK
    async refreshBannedUsersCache() {
        try {
            console.log("Refreshing banned users cache");
            this.bannedUserCache.clear();
            
            // Get all banned users from the banned_users collection
            const bannedUsersSnapshot = await firebase.firestore().collection('banned_users').get();
            
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
                this.forceRefreshLeaderboard();
            });
            
            retryDiv.appendChild(retryButton);
            this.leaderboardElement.appendChild(retryDiv);
        }
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
    
    // Skip offline check completely
    
    // If leaderboard exists, force a complete refresh
    if (window.voidLeaderboard) {
        window.voidLeaderboard.forceRefreshLeaderboard();
    }
};

function startLeaderboardRefreshInterval() {
    // Clear any existing interval
    if (leaderboardRefreshInterval) {
        clearInterval(leaderboardRefreshInterval);
    }
    
    // Set up new interval - refresh every 30 seconds
    leaderboardRefreshInterval = setInterval(window.refreshLeaderboard, 30000);
    window.leaderboardRefreshInterval = leaderboardRefreshInterval;
}

// Initialize Leaderboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Leaderboard
    window.voidLeaderboard = new VoidLeaderboard(window.db);
    
    console.log("Fixed Connectivity Leaderboard initialized");
    
    // Immediately get all users and render the leaderboard
    setTimeout(() => {
        window.voidLeaderboard.getAllUsers().then(() => {
            window.voidLeaderboard.renderLeaderboard();
            
            // Start periodic leaderboard refresh
            startLeaderboardRefreshInterval();
        }).catch(error => {
            console.error("Error during initial leaderboard setup:", error);
            // Show error state
            window.voidLeaderboard.showErrorState("Error loading leaderboard: " + error.message);
        });
    }, 1000); // Short delay to ensure Firebase is fully initialized
});

// Core ready event
document.addEventListener('core-ready', function() {
    console.log("Core ready event received - will refresh leaderboard");
    
    // Make sure leaderboard is initialized
    if (!window.voidLeaderboard) {
        window.voidLeaderboard = new VoidLeaderboard(window.db);
    }
    
    // Force a refresh after a short delay
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

console.log('Fixed Connectivity Leaderboard system loaded');
