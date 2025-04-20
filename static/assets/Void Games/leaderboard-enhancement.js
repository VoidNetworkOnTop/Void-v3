/**
 * leaderboard-enhancement.js - Enhanced real-time leaderboard functionality
 * Improves leaderboard accuracy and integrates with anti-cheat system
 */

// Wait for all systems to be loaded
document.addEventListener('DOMContentLoaded', function() {
    // Will hold reference to the enhanced VoidLeaderboard when ready
    let enhancedLeaderboard = null;
    
    // Wait for the original leaderboard system to be initialized
    document.addEventListener('games-ready', function() {
        if (window.voidLeaderboard) {
            enhanceLeaderboard();
            console.log("Leaderboard system enhanced with better real-time updates");
        }
    });
    
    function enhanceLeaderboard() {
        const originalLeaderboard = window.voidLeaderboard;
        enhancedLeaderboard = originalLeaderboard;
        
        // Enhance updateUserBalance function for more immediate updates
        const originalUpdateUserBalance = originalLeaderboard.updateUserBalance;
        
        originalLeaderboard.updateUserBalance = function(userId, newBalance) {
            // First run the original implementation
            originalUpdateUserBalance.call(this, userId, newBalance);
            
            try {
                // Check if the balance is suspicious using the anti-cheat system
                if (window.voidAntiCheat && window.voidAntiCheat.isBalanceSuspicious(newBalance)) {
                    console.warn(`Suspicious balance update detected: ${userId} -> ${newBalance}`);
                    
                    // Don't display suspicious values on the leaderboard UI
                    // Instead, queue a proper verification
                    window.queueOperation(async () => {
                        try {
                            // Get the user data from the users collection for verification
                            const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
                            const userRef = doc(window.db, 'users', userId);
                            const userDoc = await getDoc(userRef);
                            
                            if (userDoc.exists()) {
                                const userData = userDoc.data();
                                const verifiedBalance = userData.accountBalance || 0;
                                
                                // Use the verified balance instead
                                if (verifiedBalance !== newBalance) {
                                    console.log(`Correcting suspicious balance: ${newBalance} -> ${verifiedBalance}`);
                                    
                                    // Update UI with the verified balance
                                    originalUpdateUserBalance.call(this, userId, verifiedBalance);
                                }
                            }
                        } catch (error) {
                            console.error("Error verifying user balance:", error);
                        }
                    });
                    
                    return; // Skip the suspicious update
                }
                
                // Find the user in the cached data
                const userIndex = this.leaderboardData.findIndex(user => user.id === userId);
                
                if (userIndex >= 0) {
                    // Update the balance and add highlight animation
                    const oldBalance = this.leaderboardData[userIndex].accountBalance;
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
                    
                    // Re-sort the leaderboard if the balance changed significantly
                    if (Math.abs(newBalance - oldBalance) > 10000) {
                        this.leaderboardData.sort((a, b) => b.accountBalance - a.accountBalance);
                        this.renderCachedLeaderboard();
                    }
                } else {
                    // User not in current display, check if they should be based on balance
                    if (this.leaderboardData.length > 0) {
                        // Get the lowest balance currently displayed
                        const lowestDisplayed = this.leaderboardData[this.leaderboardData.length - 1].accountBalance;
                        
                        // If new balance is higher, refresh the whole leaderboard
                        if (newBalance > lowestDisplayed) {
                            this.forceRefreshLeaderboard();
                        }
                    }
                }
            } catch (error) {
                console.error("Error in enhanced updateUserBalance:", error);
            }
        };
        
        // Enhance the syncLeaderboardBalances function for better accuracy
        const originalSyncLeaderboardBalances = originalLeaderboard.syncLeaderboardBalances;
        
        originalLeaderboard.syncLeaderboardBalances = async function(querySnapshot) {
            try {
                // Import needed Firebase functions
                const { doc, getDoc, updateDoc, writeBatch } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
                
                console.log("Syncing leaderboard balances with improved accuracy");
                
                // Use a batch for better consistency
                const batch = writeBatch(window.db);
                let updateCount = 0;
                const updates = [];
                
                // For each leaderboard entry, check if the user balance needs updating
                const processPromises = [];
                
                querySnapshot.forEach((docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const leaderboardData = docSnapshot.data();
                        const userId = docSnapshot.id;
                        
                        // Skip banned or suspicious users
                        if (leaderboardData.banned === true || 
                            leaderboardData.isBanned === true || 
                            leaderboardData.status === 'banned' ||
                            leaderboardData.suspiciousActivity === true ||
                            this.bannedUserCache.has(userId)) {
                            return;
                        }
                        
                        // Create a promise for processing this user
                        const processPromise = (async () => {
                            try {
                                const userRef = doc(window.db, 'users', userId);
                                const userDoc = await getDoc(userRef);
                                
                                if (userDoc.exists()) {
                                    const userData = userDoc.data();
                                    const userBalance = userData.accountBalance || 0;
                                    
                                    // Check for suspicious balances with anti-cheat system
                                    let balanceToUse = userBalance;
                                    if (window.voidAntiCheat && window.voidAntiCheat.isBalanceSuspicious(userBalance)) {
                                        console.warn(`Suspicious user balance detected during sync: ${userId} -> ${userBalance}`);
                                        
                                        // Report the suspicious balance through anti-cheat
                                        if (window.voidAntiCheat) {
                                            const user = await window.voidAntiCheat.getUserInfo(userId);
                                            await window.voidAntiCheat.reportSuspiciousActivity(
                                                user.email,
                                                `Suspicious balance detected during leaderboard sync: ${userBalance}`,
                                                {userId, suspiciousBalance: userBalance}
                                            );
                                            
                                            // Flag the account
                                            await window.voidAntiCheat.flagSuspiciousAccount(userId, 'suspicious_balance_sync');
                                        }
                                        
                                        // Don't update the leaderboard with suspicious values
                                        return;
                                    }
                                    
                                    // If leaderboard balance differs from user balance
                                    if (Math.abs(balanceToUse - (leaderboardData.accountBalance || 0)) > 1) {
                                        console.log(`Updating leaderboard balance: ${leaderboardData.username || 'Unknown'}: ${leaderboardData.accountBalance} -> ${balanceToUse}`);
                                        
                                        // Add update to batch
                                        batch.update(doc(window.db, 'leaderboard', userId), {
                                            accountBalance: balanceToUse,
                                            lastSynced: new Date()
                                        });
                                        
                                        updateCount++;
                                        
                                        // Track the updates for UI refresh
                                        updates.push({
                                            id: userId,
                                            username: leaderboardData.username || 'Unknown',
                                            oldBalance: leaderboardData.accountBalance || 0,
                                            newBalance: balanceToUse,
                                            avatar: leaderboardData.equippedAvatar ? 
                                                window.itemManager?.items[leaderboardData.equippedAvatar]?.url : null
                                        });
                                    }
                                }
                            } catch (error) {
                                console.error(`Error syncing balance for user ${userId}:`, error);
                            }
                        })();
                        
                        processPromises.push(processPromise);
                    }
                });
                
                // Wait for all user balances to be checked
                await Promise.all(processPromises);
                
                // Commit the batch if there are updates
                if (updateCount > 0) {
                    await batch.commit();
                    console.log(`Synchronized ${updateCount} leaderboard entries`);
                    
                    // Apply updates to local leaderboard data for immediate UI refresh
                    if (updates.length > 0) {
                        updates.forEach(update => {
                            this.updateUserBalance(update.id, update.newBalance);
                        });
                    }
                }
                
                // Set last update time
                this.lastUpdateTime = Date.now();
            } catch (error) {
                console.error("Error in enhanced syncLeaderboardBalances:", error);
                // Fall back to original implementation if our enhancement fails
                await originalSyncLeaderboardBalances.call(this, querySnapshot);
            }
        };
        
        // Enhance the updateLeaderboardUI function for better filtering of suspicious entries
        const originalUpdateLeaderboardUI = originalLeaderboard.updateLeaderboardUI;
        
        originalLeaderboard.updateLeaderboardUI = async function(querySnapshot) {
            try {
                // Always clear the leaderboard completely first
                if (this.leaderboardElement) {
                    this.leaderboardElement.innerHTML = '';
                }
                
                if (querySnapshot.empty) {
                    if (this.leaderboardElement) {
                        this.leaderboardElement.innerHTML = '<div class="leaderboard-loading">No players yet</div>';
                    }
                    return;
                }
                
                // Refresh banned users cache periodically
                if (this.bannedUserCache.size === 0 || Date.now() - this.lastCacheRefresh > 3600000) {
                    await this.refreshBannedUsersCache();
                }
                
                // Create array of valid users to display - filter out banned and suspicious users
                const validUsers = [];
                let bannedCount = 0;
                let suspiciousCount = 0;
                const checkPromises = [];
                
                // Read data from leaderboard entries with avatars
                querySnapshot.forEach((docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const userData = docSnapshot.data();
                        const userId = docSnapshot.id;
                        
                        // Skip entries with suspiciously high balances immediately
                        const balance = userData.accountBalance || 0;
                        if (window.voidAntiCheat && window.voidAntiCheat.isBalanceSuspicious(balance)) {
                            console.warn(`Skipping suspicious balance in leaderboard UI: ${userId} -> ${balance}`);
                            suspiciousCount++;
                            return;
                        }
                        
                        // Create a promise for ban check
                        const checkPromise = this.isUserBanned(userId, userData).then(isBanned => {
                            if (isBanned) {
                                console.log(`Skipping banned user from leaderboard: ${userData.username || 'Unknown'}`);
                                bannedCount++;
                                
                                // Update the leaderboard document to mark as banned if not already
                                if (!userData.banned) {
                                    window.queueOperation(async () => {
                                        try {
                                            const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
                                            await updateDoc(doc(this.db, 'leaderboard', userId), {
                                                banned: true,
                                                banSyncedAt: new Date()
                                            });
                                        } catch (error) {
                                            console.error(`Error updating banned status for ${userId}:`, error);
                                        }
                                    });
                                }
                            } else if (userData.suspiciousActivity === true) {
                                console.log(`Skipping suspicious user from leaderboard: ${userData.username || 'Unknown'}`);
                                suspiciousCount++;
                            } else {
                                // Only add non-banned, non-suspicious users
                                validUsers.push({
                                    id: userId,
                                    username: userData.username || 'Unknown',
                                    accountBalance: userData.accountBalance || 0,
                                    avatar: userData.equippedAvatar ? window.itemManager?.items[userData.equippedAvatar]?.url : null
                                });
                            }
                        }).catch(error => {
                            console.error(`Error checking ban status for ${userId}:`, error);
                            // If there's an error, skip the user for safety
                            suspiciousCount++;
                        });
                        
                        checkPromises.push(checkPromise);
                    }
                });
                
                // Wait for all ban checks to complete
                await Promise.all(checkPromises);
                
                // Log counts for monitoring
                if (bannedCount > 0 || suspiciousCount > 0) {
                    console.log(`Filtered from leaderboard: ${bannedCount} banned, ${suspiciousCount} suspicious users`);
                }
                
                // If no valid users (all might be banned), show empty message
                if (validUsers.length === 0) {
                    if (this.leaderboardElement) {
                        this.leaderboardElement.innerHTML = '<div class="leaderboard-loading">No players available</div>';
                    }
                    return;
                }
                
                // Sort by account balance again (just to be sure)
                validUsers.sort((a, b) => b.accountBalance - a.accountBalance);
                
                // STORE CURRENT LEADERBOARD DATA FOR COMPARISONS
                const prevLeaderboardData = [...this.leaderboardData];
                this.leaderboardData = validUsers.slice(0, 20);
                
                // Update the UI
                this.renderCachedLeaderboard();
                
                // Highlight any changes in the leaderboard
                this.highlightLeaderboardChanges(prevLeaderboardData);
            } catch (error) {
                console.error("Error in enhanced updateLeaderboardUI:", error);
                // Fall back to original implementation if our enhancement fails
                await originalUpdateLeaderboardUI.call(this, querySnapshot);
            }
        };
        
        // New function to highlight changes between leaderboard updates
        originalLeaderboard.highlightLeaderboardChanges = function(prevData) {
            if (!prevData || prevData.length === 0 || !this.leaderboardData) return;
            
            this.leaderboardData.forEach((userData, index) => {
                // Find previous position
                const prevIndex = prevData.findIndex(user => user.id === userData.id);
                
                // Get the UI element
                const leaderboardItem = document.getElementById(`leaderboard-item-${userData.id}`);
                if (!leaderboardItem) return;
                
                // Check if position changed
                if (prevIndex !== -1 && prevIndex !== index) {
                    // Add appropriate class based on movement
                    if (prevIndex > index) {
                        // Moved up
                        leaderboardItem.classList.add('leaderboard-moved-up');
                        setTimeout(() => {
                            leaderboardItem.classList.remove('leaderboard-moved-up');
                        }, 3000);
                    } else {
                        // Moved down
                        leaderboardItem.classList.add('leaderboard-moved-down');
                        setTimeout(() => {
                            leaderboardItem.classList.remove('leaderboard-moved-down');
                        }, 3000);
                    }
                }
                
                // Check if balance changed
                if (prevIndex !== -1) {
                    const prevBalance = prevData[prevIndex].accountBalance;
                    if (userData.accountBalance !== prevBalance) {
                        // Add balance changed class
                        leaderboardItem.classList.add('leaderboard-updated');
                        setTimeout(() => {
                            leaderboardItem.classList.remove('leaderboard-updated');
                        }, 2000);
                    }
                }
            });
        };
        
        // Increase the refresh rate for more real-time updates
        if (window.leaderboardRefreshInterval) {
            clearInterval(window.leaderboardRefreshInterval);
        }
        
        // Create a new, more frequent refresh cycle
        window.leaderboardRefreshInterval = setInterval(() => {
            if (window.voidLeaderboard && !window.voidLeaderboard.isUpdating) {
                window.voidLeaderboard.syncLeaderboardBalances();
            }
        }, 30000); // Every 30 seconds
        
        console.log("Leaderboard refresh rate increased for more real-time updates");
    }
});

// Add new styles for enhanced leaderboard animations
document.addEventListener('DOMContentLoaded', function() {
    // Create style element
    const style = document.createElement('style');
    style.type = 'text/css';
    
    // Add CSS for new animations
    style.innerHTML = `
        /* Enhanced leaderboard animations */
        .leaderboard-updated {
            animation: leaderboard-pulse 1.5s ease;
        }
        
        .leaderboard-moved-up {
            animation: leaderboard-moved-up 3s ease;
            border-left: 3px solid #4CAF50;
        }
        
        .leaderboard-moved-down {
            animation: leaderboard-moved-down 3s ease;
            border-left: 3px solid #FF5722;
        }
        
        @keyframes leaderboard-pulse {
            0% { background-color: rgba(255, 215, 0, 0.4); }
            50% { background-color: rgba(255, 215, 0, 0.2); }
            100% { background-color: rgba(255, 255, 255, 0.05); }
        }
        
        @keyframes leaderboard-moved-up {
            0% { border-left-color: rgba(76, 175, 80, 0.8); }
            100% { border-left-color: rgba(76, 175, 80, 0); }
        }
        
        @keyframes leaderboard-moved-down {
            0% { border-left-color: rgba(255, 87, 34, 0.8); }
            100% { border-left-color: rgba(255, 87, 34, 0); }
        }
    `;
    
    // Append to head
    document.head.appendChild(style);
});

console.log('Leaderboard enhancements loaded');
