/**
 * games.js - Games list and leaderboard functionality for Void Network
 * Contains game listing, search functionality, and leaderboard system
 */

// Game data
const defaultApps = [
    {
        title: "Ball Dropper",
        imgSrc: "https://lh7-us.googleusercontent.com/CUj18dKaBkXv0WI59qpP2-Ub1J0KHyKXwgnhPBdmzDzwhQNvIkwPsrVLJCiSsS0iNOaF8-nAamakuiFLoRzYIGyOr-LOFJg9hD5IA9cIvjh5ZIHmBhT-hel39crAOTgz88P8jX2WApcC5PDnLbabDK_QC1vyFw",
        link: "/local games/Plinko/plinko.html"
    },
    {
        title: "MineFeild",
        imgSrc: "https://lh7-us.googleusercontent.com/WAjTfpxFqdXwMOlzyChcCi40sg6-ukZN5u24gdmWyi9_Yca5-V8vBR6zrgOoADGwKKJM7e7cKEkq9i_chkYesJvN_VVnvKAfUOPIllTxR2mbOK-HiR0vlIgH_2_bY2Oqzh2ndVieVycQoGDMXuZC-8gpE85Ypg",
        link: "/local games/CrossyRoad/crossy.html"
    },
    {
        title: "Memory Squares",
        imgSrc: "https://lh7-us.googleusercontent.com/USI3iEwtHyyyN6fdMllkREQg8h8N7xsXxw94Wb0umSNOzvXTgMtBtxMBXwgyVOHirbrZCVGU1JDeyVaW94xuTS-4vEvT1iZzriw3We_RIYDPW63aWxDEj8xZ_d7Nc3vi6LfrEr20QOOMvnWL8JD5XgbbC-PjKA",
        link: "/local games/memory-square/mem.html"
    },
    {
        title: "VoidSnake",
        imgSrc: "https://lh7-us.googleusercontent.com/zPbDytQWYmY90BK7jPcdb8QQ8QNz4LWyhwUq1zNWiD64NNGC_8L21T_QDOl9z8R9QRvJtkFRvM9f83ODmjJJYgG6sZwi71SPiTUwASMOaofbb7wIOKEQJ-Wq1VSGVlCg3RmSdC7B4d-SGOfs_hRdmKjtxHbGOQ",
        link: "/local games/Void Snake/Voidsnake.html"
    },
    {
        title: "Heads Or Tails?",
        imgSrc: "https://lh7-us.googleusercontent.com/jpunH9P0O_of8oU2ZilkliydM46qFTQxD__XgzIKv3OU7zZi77arrF9F2hGe-wgyzO5-57VJvN1zocVFN8549jIDkN2rKc9xEjcywhhJCldCaJkZnMgyEHtwJPuUsZZSu4DsK-L2b2eQGepfKwhgn4p7tgzrqA",
        link: "/local games/CoinFlip/coinflip.html"
    },
    {
        title: "Chicken Run",
        imgSrc: "https://lh7-us.googleusercontent.com/JugrfbksXzV3Mwwp32MOX-DHGD1EQJmZIaB_RYn9VBvoihT7-bClXPzyfYJC4mGXsYsdTMWJh-Xxe8L9wpHrGntuc0Shzu9tqKCTSug-jM2SiW1BIBcok9Fxlz0JvZEqaKVMbSWK1dlWmw8caafDFRErSox7YA",
        link: "/local games/ChickenRun/chickenrun.html"
    },
    {
        title: "Black Jack",
        imgSrc: "https://lh7-us.googleusercontent.com/OZqPInsN8s8qb43B5XLKVNm6uHmFM_GBSMVdBcr4Y8fYr-dX_jSqsu7keD7RoMafKFhUprNXkYYwpvmTwsNNkvmzR23M3XL1ykIp-8EpICFqttainlnXyRuobeBcEp4YE8fxhdDdBxgufc8EhjzItiMSAI821w",
        link: "/local games/BlackJack/BlackJack.html"
    },
    {
        title: "Tic Tac Toe",
        imgSrc: "https://lh7-us.googleusercontent.com/9kSWLTVDFONfAKr5ypIjt5LvF36mUlapDOEMJdwX0jkF-wvLUAPvd6Pg42ws-2Fdq2dRvOtO3WRMOtkJiS7atfoqugRCHgAsxqni6PVbRlIoM-uqCAOWjVp-wCnFWxuHDWAPEGuwjNkiBYSXhTljpVMf4A_h2Q",
        link: "/local games/TicTacToe/TicTacToe.html"
    },
    {
        title: "Water Roulette",
        imgSrc: "https://lh7-us.googleusercontent.com/55Ss_gX74t5Qy9Zr2OevrdodZtTs3lQ4KEAXiOhyMoRctF1EDDcaepxmc2Fou29Jl0AUWsl5NGx8xiDW89aOwgXnTtkrFa5B7TXOczHrtCbdyT8WFcrCcisyTUmd9h8XfGTmvbUZ2uXNZ8gZk7UoVMxuTh2tQw",
        link: "/local games/RussianRoulette/RussianRoulette.html"
    },
    {
        title: "Click Race Multiplayer",
        imgSrc: "https://lh7-us.googleusercontent.com/0uIu5df5JmX-mNMQCWXZU39v4N0h3tYQntJyUgd74z_OBw5neJum7hYw7YroKxDZI4lqaEZi66aTB3PuKtJ2-DdaPqf9ZhyzVrMkBaHuFTlITvL3dBLWVqpFBRKWr9lapTsOrbZMhjlf6MyKa3mcou5hO3zl5g",
        link: "/local games/ClickRace/ClickRace.html"
    },
];

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
        this.throttleDelay = 1000; // Reduced from 5000ms to 1000ms for more responsive updates
        this.leaderboardData = []; // Cache leaderboard data
        this.isUpdating = false; // Flag to prevent multiple concurrent updates
        
        console.log("VoidLeaderboard initialized with enhanced real-time updates");
        
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
            
            // Fetch balances directly from users collection for all leaderboard users
            await this.updateUserBalancesFromSource();
            
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
    
    // Update user balances from source (users collection) and sync to leaderboard
    async updateUserBalancesFromSource() {
        console.log("Updating all user balances from source");
        
        if (!window.isOnline) {
            console.log("Device is offline, skipping balance update");
            return;
        }
        
        try {
            // Get top users from leaderboard first
            const leaderboardRef = firebase.firestore().collection('leaderboard');
            const leaderboardQuery = leaderboardRef.orderBy('accountBalance', 'desc').limit(50);
            const leaderboardSnapshot = await leaderboardQuery.get();
            
            if (leaderboardSnapshot.empty) {
                console.log("No users in leaderboard to update");
                return;
            }
            
            // Create batch for updates
            const batch = firebase.firestore().batch();
            let updateCount = 0;
            const updates = [];
            
            // For each leaderboard entry, get the actual user data and update
            for (const docSnapshot of leaderboardSnapshot.docs) {
                if (!docSnapshot.exists) continue;
                
                const userId = docSnapshot.id;
                const leaderboardData = docSnapshot.data();
                
                // Skip banned users
                if (leaderboardData.banned === true || 
                    leaderboardData.isBanned === true || 
                    leaderboardData.status === 'banned' ||
                    this.bannedUserCache.has(userId)) {
                    continue;
                }
                
                try {
                    // Get user data from users collection
                    const userRef = firebase.firestore().collection('users').doc(userId);
                    const userDoc = await userRef.get();
                    
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        const userBalance = userData.accountBalance || 0;
                        
                        // If balance differs, add to batch update
                        if (Math.abs(userBalance - (leaderboardData.accountBalance || 0)) > 1) {
                            console.log(`Updating balance for ${leaderboardData.username || 'Unknown'}: ${leaderboardData.accountBalance} -> ${userBalance}`);
                            
                            batch.update(firebase.firestore().collection('leaderboard').doc(userId), {
                                accountBalance: userBalance,
                                lastSynced: new Date()
                            });
                            
                            updateCount++;
                            
                            // Track the updates for UI refresh
                            updates.push({
                                id: userId,
                                username: leaderboardData.username || 'Unknown',
                                oldBalance: leaderboardData.accountBalance || 0,
                                newBalance: userBalance,
                                avatar: leaderboardData.equippedAvatar ? 
                                       window.itemManager.items[leaderboardData.equippedAvatar]?.url : null
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Error updating balance for user ${userId}:`, error);
                    // Continue with other users
                }
                
                // Commit in batches of 20 updates to avoid hitting limits
                if (updateCount >= 20) {
                    await batch.commit();
                    console.log(`Committed batch of ${updateCount} updates`);
                    updateCount = 0;
                }
            }
            
            // Commit any remaining updates
            if (updateCount > 0) {
                await batch.commit();
                console.log(`Committed final batch of ${updateCount} updates`);
            }
            
            // Apply updates to local leaderboard data
            if (updates.length > 0) {
                // Update the cached data
                updates.forEach(update => {
                    const userIndex = this.leaderboardData.findIndex(user => user.id === update.id);
                    if (userIndex >= 0) {
                        this.leaderboardData[userIndex].accountBalance = update.newBalance;
                    }
                });
                
                // Re-sort the leaderboard
                this.leaderboardData.sort((a, b) => b.accountBalance - a.accountBalance);
                
                // Render the updated leaderboard
                this.renderCachedLeaderboard();
            }
            
            console.log(`Completed balance update for ${updates.length} users`);
            this.lastUpdateTime = Date.now();
            
        } catch (error) {
            console.error("Error during balance update:", error);
            throw error;
        }
    }
    
    // Load banned users into cache
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
    
    // Check if a user is banned using both direct flags and banned_users collection
    async isUserBanned(userId, userData) {
        if (!userId) return false;
        
        // First check direct flags in user data
        if (userData.banned === true || userData.isBanned === true || userData.status === 'banned') {
            return true;
        }
        
        // Then check our banned users cache
        if (this.bannedUserCache.has(userId)) {
            return true;
        }
        
        if (!window.isOnline) {
            return false; // If offline, assume not banned if not in cache
        }
        
        // If not in cache, check directly from the banned_users collection
        // This is a fallback in case the cache hasn't been updated
        try {
            const bannedDoc = await firebase.firestore().collection('banned_users').doc(userId).get();
            if (bannedDoc.exists) {
                // Update our cache
                this.bannedUserCache.set(userId, true);
                return true;
            }
        } catch (error) {
            console.error(`Error checking ban status for ${userId}:`, error);
        }
        
        return false;
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
    
    // Start real-time leaderboard updates with enhanced account balance sync and throttling
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
            
            console.log("Starting leaderboard updates with improved real-time handling");
            
            // Get more users to ensure we have enough non-banned users
            const leaderboardRef = firebase.firestore().collection('leaderboard');
            let q;
            
            try {
                // Increase limit to 40 to ensure we have enough non-banned users
                q = leaderboardRef.orderBy('accountBalance', 'desc').limit(40);
            } catch (error) {
                console.error("Error creating leaderboard query:", error);
                this.showErrorState("Error loading leaderboard");
                return;
            }
            
            // Set up real-time listener with improved error handling
            try {
                this.unsubscribe = q.onSnapshot(
                    {
                        includeMetadataChanges: true
                    },
                    async (querySnapshot) => {
                        // Reset retry count on successful data
                        this.retryCount = 0;
                        
                        // Process updates more quickly by reducing throttle
                        clearTimeout(this.throttleTimer);
                        this.throttleTimer = setTimeout(async () => {
                            // Update UI with the snapshot data
                            await this.updateLeaderboardUI(querySnapshot);
                            
                            // Only sync balances occasionally to reduce load
                            if (Date.now() - this.lastUpdateTime > 30000) { // 30 seconds
                                this.lastUpdateTime = Date.now();
                                await this.syncLeaderboardBalances(querySnapshot);
                            }
                        }, this.throttleDelay);
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
    
    // ENHANCED: Sync leaderboard balances with user accounts - improved with batching
    async syncLeaderboardBalances(querySnapshot) {
        // Only sync if more than 30 seconds have passed since last sync (to avoid excessive operations)
        if (Date.now() - this.lastUpdateTime < 30000 || !window.isOnline) return;
        
        try {
            console.log("Syncing leaderboard balances");
            const updatePromises = [];
            const updateBatch = firebase.firestore().batch();
            let updateCount = 0;
            
            // For each leaderboard entry, check if the user balance needs updating
            querySnapshot.forEach(async (docSnapshot) => {
                if (docSnapshot.exists) {
                    const leaderboardData = docSnapshot.data();
                    const userId = docSnapshot.id;
                    
                    // Skip banned users - don't even update their entries
                    if (leaderboardData.banned === true || 
                        leaderboardData.isBanned === true || 
                        leaderboardData.status === 'banned' ||
                        this.bannedUserCache.has(userId)) {
                        return;
                    }
                    
                    // Process all users for better real-time updates
                    const userPromise = firebase.firestore().collection('users').doc(userId).get()
                        .then(userDoc => {
                            if (userDoc.exists) {
                                const userData = userDoc.data();
                                const userBalance = userData.accountBalance || 0;
                                
                                // If leaderboard balance differs from user balance
                                if (Math.abs(userBalance - (leaderboardData.accountBalance || 0)) > 1) {
                                    console.log(`Updating leaderboard balance for ${leaderboardData.username || 'Unknown'}: ${leaderboardData.accountBalance} -> ${userBalance}`);
                                    
                                    // Add update to batch instead of individual update
                                    updateBatch.update(firebase.firestore().collection('leaderboard').doc(userId), {
                                        accountBalance: userBalance,
                                        lastSynced: new Date()
                                    });
                                    
                                    updateCount++;
                                    
                                    // Update local data too for immediate UI refresh
                                    this.updateUserBalance(userId, userBalance);
                                }
                            }
                        })
                        .catch(error => {
                            console.error(`Error syncing balance for user ${userId}:`, error);
                        });
                    
                    updatePromises.push(userPromise);
                }
            });
            
            // Wait for all user checks to complete
            await Promise.all(updatePromises);
            
            // Commit batch if there are updates
            if (updateCount > 0) {
                await updateBatch.commit();
                console.log(`Synchronized ${updateCount} leaderboard entries`);
            }
            
            this.lastUpdateTime = Date.now();
        } catch (error) {
            console.error("Error syncing leaderboard balances:", error);
        }
    }
    
    // Improved leaderboard UI update with immediate balance updates
    async updateLeaderboardUI(querySnapshot) {
        if (!this.leaderboardElement) {
            console.error("Leaderboard element not found");
            return;
        }
        
        // Always clear the leaderboard completely first
        this.leaderboardElement.innerHTML = '';
        
        if (querySnapshot.empty) {
            this.leaderboardElement.innerHTML = '<div class="leaderboard-loading">No players yet</div>';
            return;
        }
        
        // Refresh banned users cache periodically
        if (this.bannedUserCache.size === 0 || Date.now() - this.lastCacheRefresh > 3600000) {
            await this.refreshBannedUsersCache();
        }
        
        // Create array of valid users to display - filter out banned users
        const validUsers = [];
        let bannedCount = 0;
        const checkPromises = [];
        
        // Read data from leaderboard entries with avatars
        querySnapshot.forEach((docSnapshot) => {
            if (docSnapshot.exists) {
                const userData = docSnapshot.data();
                const userId = docSnapshot.id;
                
                // Create a promise for the ban check
                const checkPromise = this.isUserBanned(userId, userData).then(isBanned => {
                    if (isBanned) {
                        console.log(`Skipping banned user from leaderboard: ${userData.username || 'Unknown'}`);
                        bannedCount++;
                        
                        // Update the leaderboard document to mark as banned if not already
                        if (!userData.banned) {
                            window.queueOperation(async () => {
                                try {
                                    await firebase.firestore().collection('leaderboard').doc(userId).update({
                                        banned: true,
                                        banSyncedAt: new Date()
                                    });
                                } catch (error) {
                                    console.error(`Error updating banned status for ${userId}:`, error);
                                }
                            });
                        }
                    } else {
                        // Only add non-banned users
                        validUsers.push({
                            id: userId,
                            username: userData.username || 'Unknown',
                            accountBalance: userData.accountBalance || 0,
                            avatar: userData.equippedAvatar ? window.itemManager.items[userData.equippedAvatar]?.url : null
                        });
                    }
                }).catch(error => {
                    console.error(`Error checking ban status for ${userId}:`, error);
                    // If there's an error, default to including the user
                    validUsers.push({
                        id: userId,
                        username: userData.username || 'Unknown',
                        accountBalance: userData.accountBalance || 0,
                        avatar: userData.equippedAvatar ? window.itemManager.items[userData.equippedAvatar]?.url : null
                    });
                });
                
                checkPromises.push(checkPromise);
            }
        });
        
        // Wait for all ban checks to complete
        await Promise.all(checkPromises);
        
        // If no valid users (all might be banned), show empty message
        if (validUsers.length === 0) {
            this.leaderboardElement.innerHTML = '<div class="leaderboard-loading">No players available</div>';
            return;
        }
        
        // Sort by account balance again (just to be sure)
        validUsers.sort((a, b) => b.accountBalance - a.accountBalance);
        
        // STORE CURRENT LEADERBOARD DATA FOR COMPARISONS
        const prevLeaderboardData = [...this.leaderboardData];
        this.leaderboardData = validUsers.slice(0, 20);
        
        // Display exactly 20 users, or as many as available
        const displayCount = Math.min(validUsers.length, 20);
        
        for (let i = 0; i < displayCount; i++) {
            const userData = validUsers[i];
            const leaderboardItem = document.createElement('div');
            leaderboardItem.className = 'leaderboard-item';
            leaderboardItem.id = `leaderboard-item-${userData.id}`;
            
            // Check if this user's balance has changed since last update
            const prevUserData = prevLeaderboardData.find(user => user.id === userData.id);
            if (prevUserData && prevUserData.accountBalance !== userData.accountBalance) {
                // Add animation class for updated items
                leaderboardItem.classList.add('leaderboard-updated');
            }
            
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
            usernameSpan.innerText = userData.username; // Using innerText to prevent XSS
            usernameContainer.appendChild(usernameSpan);
            
            // Add username container to item
            leaderboardItem.appendChild(usernameContainer);
            
            // Create and add balance
            const balanceSpan = document.createElement('span');
            balanceSpan.className = 'leaderboard-balance';
            balanceSpan.innerText = userData.accountBalance.toLocaleString();
            leaderboardItem.appendChild(balanceSpan);
            
            this.leaderboardElement.appendChild(leaderboardItem);
            
            // Remove animation class after animation is complete
            setTimeout(() => {
                if (leaderboardItem.classList.contains('leaderboard-updated')) {
                    leaderboardItem.classList.remove('leaderboard-updated');
                }
            }, 1000);
        }
        
        // Add placeholders if we couldn't get a full 20 valid users
        if (displayCount < 20) {
            for (let i = displayCount; i < 20; i++) {
                const placeholderItem = document.createElement('div');
                placeholderItem.className = 'leaderboard-item';
                
                // Create rank element
                const placeholderRank = document.createElement('span');
                placeholderRank.className = 'leaderboard-rank';
                placeholderRank.innerText = `#${i + 1}`;
                placeholderItem.appendChild(placeholderRank);
                
                // Create username container
                const placeholderUsernameContainer = document.createElement('div');
                placeholderUsernameContainer.className = 'leaderboard-username-container';
                
                // Create username element
                const placeholderUsername = document.createElement('span');
                placeholderUsername.className = 'leaderboard-username';
                placeholderUsername.innerText = '...';
                placeholderUsernameContainer.appendChild(placeholderUsername);
                placeholderItem.appendChild(placeholderUsernameContainer);
                
                // Create balance element
                const placeholderBalance = document.createElement('span');
                placeholderBalance.className = 'leaderboard-balance';
                placeholderBalance.innerText = '--';
                placeholderItem.appendChild(placeholderBalance);
                
                this.leaderboardElement.appendChild(placeholderItem);
            }
        }
        
        // Find and highlight special users
        this.highlightSpecialUsers();
    }
    
    // Update a single user's balance in the leaderboard UI without full refresh
    updateUserBalance(userId, newBalance) {
        if (!this.leaderboardElement) return;
        
        // Find the user in our cached data
        const userIndex = this.leaderboardData.findIndex(user => user.id === userId);
        if (userIndex >= 0) {
            // Update the cached data
            this.leaderboardData[userIndex].accountBalance = newBalance;
            
            // Get the user's element
            const userElement = document.getElementById(`leaderboard-item-${userId}`);
            if (userElement) {
                // Update balance display
                const balanceElement = userElement.querySelector('.leaderboard-balance');
                if (balanceElement) {
                    balanceElement.textContent = newBalance.toLocaleString();
                    
                    // Add animation to highlight the change
                    userElement.classList.add('leaderboard-updated');
                    setTimeout(() => {
                        userElement.classList.remove('leaderboard-updated');
                    }, 1000);
                }
            }
            
            // Re-sort the leaderboard if needed
            this.leaderboardData.sort((a, b) => b.accountBalance - a.accountBalance);
            
            // If the order changed significantly, do a full refresh
            const newUserIndex = this.leaderboardData.findIndex(user => user.id === userId);
            if (Math.abs(newUserIndex - userIndex) > 2) {
                // Position changed by more than 2 spots, refresh the whole list
                this.renderCachedLeaderboard();
            }
        }
    }
    
    // Render the cached leaderboard data without waiting for a server update
    renderCachedLeaderboard() {
        if (!this.leaderboardElement || this.leaderboardData.length === 0) return;
        
        // Clear the current list
        this.leaderboardElement.innerHTML = '';
        
        // Display up to 20 users
        const displayCount = Math.min(this.leaderboardData.length, 20);
        
        for (let i = 0; i < displayCount; i++) {
            const userData = this.leaderboardData[i];
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
            usernameSpan.innerText = userData.username; // Using innerText to prevent XSS
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
                
                // Create rank element
                const placeholderRank = document.createElement('span');
                placeholderRank.className = 'leaderboard-rank';
                placeholderRank.innerText = `#${i + 1}`;
                placeholderItem.appendChild(placeholderRank);
                
                // Create username container
                const placeholderUsernameContainer = document.createElement('div');
                placeholderUsernameContainer.className = 'leaderboard-username-container';
                
                // Create username element
                const placeholderUsername = document.createElement('span');
                placeholderUsername.className = 'leaderboard-username';
                placeholderUsername.innerText = '...';
                placeholderUsernameContainer.appendChild(placeholderUsername);
                placeholderItem.appendChild(placeholderUsernameContainer);
                
                // Create balance element
                const placeholderBalance = document.createElement('span');
                placeholderBalance.className = 'leaderboard-balance';
                placeholderBalance.innerText = '--';
                placeholderItem.appendChild(placeholderBalance);
                
                this.leaderboardElement.appendChild(placeholderItem);
            }
        }
        
        // Find and highlight special users
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

/**
 * Game functions
 */

// Render the games list
function renderAppsList() {
    const gamesList = document.getElementById("gamesList");
    
    if (!gamesList) {
        console.error("Games list element not found");
        return;
    }
    
    gamesList.innerHTML = '';
    console.log("Rendering games list");
    
    defaultApps.forEach(app => {
        const appElement = document.createElement("div");
        appElement.className = "game-item";
        
        appElement.innerHTML = `
            <div class="game-icon">
                <img src="${app.imgSrc}" alt="${app.title} icon">
            </div>
            <h3 class="game-title">${app.title}</h3>
        `;

        appElement.onclick = () => {
            // Check if user is logged in before navigating to game
            const currentUser = window.voidAccounting.getCurrentUser();
            if (currentUser) {
                console.log("Navigating to game:", app.title);
                
                // Record the game play attempt
                window.voidAccounting.recordGameTransaction(
                    app.title.toLowerCase().replace(/\s+/g, '_'), 
                    currentUser.uid,
                    'game_play',
                    0 // Just tracking the visit, not charging coins here
                ).then(() => {
                    // Navigate to the game after transaction is recorded
                    window.location.href = app.link;
                }).catch(error => {
                    console.error("Error recording game visit:", error);
                    // Still navigate even if tracking fails
                    window.location.href = app.link;
                });
            } else {
                window.showNotification('Please login to play games', 'error');
                
                const authContainer = document.getElementById('auth-container');
                if (authContainer) {
                    authContainer.style.display = 'block';
                    setTimeout(() => {
                        authContainer.classList.add('visible');
                    }, 10);
                }
            }
        };

        gamesList.appendChild(appElement);
    });
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
        
        // Force a new connection attempt
        window.voidLeaderboard.startLeaderboardUpdates();
        
        // After a short delay, manually highlight special users
        setTimeout(() => {
            if (window.voidLeaderboard.highlightSpecialUsers) {
                window.voidLeaderboard.highlightSpecialUsers();
            }
        }, 1000);
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

// Debug leaderboard system
function debugLeaderboard() {
    console.log("Debug: Testing leaderboard update mechanism");
    
    // Force a complete leaderboard refresh
    if (window.voidLeaderboard) {
        window.voidLeaderboard.stopLeaderboardUpdates();
        window.voidLeaderboard.startLeaderboardUpdates();
        console.log("Debug: Restarted leaderboard updates");
    }
    
    // Reduce the refresh interval to 15 seconds for more frequent updates
    clearInterval(leaderboardRefreshInterval);
    leaderboardRefreshInterval = setInterval(window.refreshLeaderboard, 15000); // 15 seconds instead of 60
    window.leaderboardRefreshInterval = leaderboardRefreshInterval;
    console.log("Debug: Leaderboard refresh interval reduced to 15 seconds");
}

// Search functionality for games
document.addEventListener('DOMContentLoaded', function() {
    const searchApps = document.getElementById("searchApps");
    if (searchApps) {
        searchApps.addEventListener("keyup", function() {
            const gamesList = document.getElementById("gamesList");
            const searchTerm = this.value.toLowerCase();
            
            if (!gamesList) return;
            
            gamesList.innerHTML = '';
            
            // Filter and render matching games
            defaultApps.forEach(app => {
                if (app.title.toLowerCase().includes(searchTerm)) {
                    const appElement = document.createElement("div");
                    appElement.className = "game-item";
                    
                    appElement.innerHTML = `
                        <div class="game-icon">
                            <img src="${app.imgSrc}" alt="${app.title} icon">
                        </div>
                        <h3 class="game-title">${app.title}</h3>
                    `;

                    appElement.onclick = () => {
                        // Check if user is logged in before navigating to game
                        const currentUser = window.voidAccounting.getCurrentUser();
                        if (currentUser) {
                            // Record the game play attempt
                            window.voidAccounting.recordGameTransaction(
                                app.title.toLowerCase().replace(/\s+/g, '_'), 
                                currentUser.uid,
                                'game_play',
                                0 // Just tracking the visit, not charging coins here
                            ).then(() => {
                                // Navigate to the game after transaction is recorded
                                window.location.href = app.link;
                            }).catch(error => {
                                console.error("Error recording game visit:", error);
                                // Still navigate even if tracking fails
                                window.location.href = app.link;
                            });
                        } else {
                            window.showNotification('Please login to play games', 'error');
                            const authContainer = document.getElementById('auth-container');
                            if (authContainer) {
                                authContainer.style.display = 'block';
                                setTimeout(() => {
                                    authContainer.classList.add('visible');
                                }, 10);
                            }
                        }
                    };

                    gamesList.appendChild(appElement);
                }
            });
        });
    }
});

// Initialize everything on page load
document.addEventListener('DOMContentLoaded', function() {
    // Render game list
    renderAppsList();
    
    // Initialize Leaderboard
    window.voidLeaderboard = new VoidLeaderboard(window.db);
    
    // Start leaderboard updates
    window.voidLeaderboard.startLeaderboardUpdates();
    
    // Start periodic leaderboard refresh
    startLeaderboardRefreshInterval();
    
    // Dispatch event that games system is ready
    document.dispatchEvent(new CustomEvent('games-ready'));
    
    console.log("Games system initialized");
});

// Added event listener for when the core is ready
document.addEventListener('core-ready', function() {
    // Call any functions that depend on core being ready
    if (!window.voidLeaderboard) {
        window.voidLeaderboard = new VoidLeaderboard(window.db);
        window.voidLeaderboard.startLeaderboardUpdates();
    }
    
    // Call the debug function after a short delay to let everything initialize
    setTimeout(debugLeaderboard, 2000);
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

console.log('Games and leaderboard system loaded');
