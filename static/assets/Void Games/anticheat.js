/**
 * anticheat.js - Anti-cheat system for Void Network
 * Monitors for suspicious coin activity and reports to webhook
 */

// Constants for anti-cheat system
const SUSPICIOUS_BALANCE_THRESHOLD = 100000000000; // 100 billion coins
const SUSPICIOUS_GAIN_THRESHOLD = 10000000; // 10 million coins in short time
const SUSPICIOUS_GAIN_TIMEFRAME = 60000; // 1 minute (in milliseconds)

// Obfuscated webhook URL to make it harder to find
function getWebhookURL() {
    // Add new function to reset user balance
    async resetUserBalance(userId, newBalance = 1000) {
        try {
            console.log(`Resetting balance for user ${userId} to ${newBalance} coins`);
            
            // Import needed Firebase functions
            const { doc, updateDoc, writeBatch, getDoc } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
            
            // Use a batch for consistency
            const batch = writeBatch(this.db);
            
            // Update user's balance in the users collection
            const userRef = doc(this.db, 'users', userId);
            
            // Get current user data to log the change
            const userDoc = await getDoc(userRef);
            let prevBalance = 0;
            let username = "Unknown";
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                prevBalance = userData.accountBalance || 0;
                username = userData.username || "Unknown";
            }
            
            // Set the new balance
            batch.update(userRef, {
                accountBalance: newBalance,
                balanceResetBySystem: true,
                balanceResetAt: new Date(),
                prevBalance: prevBalance
            });
            
            // Update the leaderboard entry as well
            const leaderboardRef = doc(this.db, 'leaderboard', userId);
            const leaderboardDoc = await getDoc(leaderboardRef);
            
            if (leaderboardDoc.exists()) {
                batch.update(leaderboardRef, {
                    accountBalance: newBalance,
                    balanceResetBySystem: true,
                    balanceResetAt: new Date()
                });
            }
            
            // Add reset transaction to transactions collection
            const transactionRef = doc(this.db, 'transactions', `reset_${Date.now()}_${userId}`);
            batch.set(transactionRef, {
                userId: userId,
                username: username,
                transactionType: 'system_reset',
                amount: prevBalance - newBalance,
                timestamp: new Date(),
                prevBalance: prevBalance,
                newBalance: newBalance,
                reason: 'anti_cheat_system'
            });
            
            // Commit all changes
            await batch.commit();
            
            // Update any user cache
            if (window.userDataCache && window.userDataCache.userData) {
                window.userDataCache.userData.accountBalance = newBalance;
                window.userDataCache.lastUpdated = Date.now();
            }
            
            console.log(`Successfully reset balance for user ${userId} from ${prevBalance} to ${newBalance}`);
            
            // Update UI if this is the current user
            if (window.auth.currentUser && window.auth.currentUser.uid === userId) {
                const balanceDisplay = document.getElementById('balance-display');
                const shopBalanceDisplay = document.getElementById('shop-balance-display');
                
                if (balanceDisplay) balanceDisplay.textContent = newBalance.toLocaleString();
                if (shopBalanceDisplay) shopBalanceDisplay.textContent = newBalance.toLocaleString();
                
                // Show notification to user
                window.showNotification("Your account has been flagged for suspicious activity. Your balance has been reset.", "error");
            }
            
            // Update leaderboard display
            if (window.voidLeaderboard && typeof window.voidLeaderboard.updateUserBalance === 'function') {
                window.voidLeaderboard.updateUserBalance(userId, newBalance);
            }
            
            return true;
        } catch (error) {
            console.error("Error resetting user balance:", error);
            return false;
        }
    },Split the webhook into parts to prevent simple string searches
    const parts = [
        "\x68\x74\x74\x70\x73\x3a\x2f\x2f", // "https://" in hex
        "\x64\x69\x73\x63\x6f\x72\x64\x2e\x63\x6f\x6d\x2f\x61\x70\x69\x2f", // "discord.com/api/" in hex
        "\x77\x65\x62\x68\x6f\x6f\x6b\x73\x2f", // "webhooks/" in hex
        [49, 51, 54, 51, 53, 48, 49, 48, 54, 49, 56, 54, 55, 57, 54, 54, 54, 48, 53].map(c => String.fromCharCode(c)).join(''), // ID
        "/",
        (function() { 
            const encoded = "UG5NNkVEWGZ2Rm42Nl9wWFcxSXlKT2ZJeGZfSHozZk9iN2x2aU5HdTdLR0hGM09ZemoyTklpTHZGVVhJMC1lV0ZZclE=";
            return atob(encoded); // Base64 decode
        })()
    ];
    
    // Apply some simple obfuscation to make it harder to extract
    return parts.join('')
        .split('')
        .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (i % 3)))
        .join('')
        .split('')
        .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (i % 3)))
        .join('');
}

// Store recent transactions to detect rapid gains
const recentTransactions = new Map(); // userId -> array of {amount, timestamp}

/**
 * VoidNetworkAntiCheat Class - Handles cheat detection and reporting
 */
class VoidNetworkAntiCheat {
    constructor() {
        this.db = window.db;
        this.auth = window.auth;
        console.log("VoidNetworkAntiCheat initialized");
        
        // Start monitoring leaderboard for impossible values
        this.startLeaderboardMonitoring();
    }

    // Check if a balance is suspiciously high (impossible value)
    isBalanceSuspicious(balance) {
        if (balance === Infinity || balance === -Infinity || isNaN(balance)) {
            return true;
        }
        
        return balance > SUSPICIOUS_BALANCE_THRESHOLD;
    }

    // Monitor a transaction for suspicious activity
    async monitorTransaction(userId, transactionType, amount, prevBalance, newBalance) {
        try {
            console.log(`Monitoring transaction: ${transactionType} for ${amount} coins`);
            
            // Check for impossible balance
            if (this.isBalanceSuspicious(newBalance)) {
                const user = await this.getUserInfo(userId);
                await this.reportSuspiciousActivity(
                    user.email,
                    `Impossible balance detected: ${newBalance} coins`,
                    {userId, username: user.username, transactionType, amount, prevBalance, newBalance}
                );
                
                // Flag account in database and reset balance to 1000
                await this.flagSuspiciousAccount(userId, 'impossible_balance');
                await this.resetUserBalance(userId, 1000);
                return true;
            }
            
            // Check for rapid coin acquisition
            if (amount > 0 && transactionType !== 'coin_purchase') {
                // Store transaction details for rapid gain detection
                if (!recentTransactions.has(userId)) {
                    recentTransactions.set(userId, []);
                }
                
                const userTransactions = recentTransactions.get(userId);
                const currentTime = Date.now();
                
                // Add current transaction
                userTransactions.push({
                    amount,
                    timestamp: currentTime
                });
                
                // Remove old transactions
                const recentTimeframe = currentTime - SUSPICIOUS_GAIN_TIMEFRAME;
                const recentTxs = userTransactions.filter(tx => tx.timestamp >= recentTimeframe);
                recentTransactions.set(userId, recentTxs);
                
                // Calculate sum of recent gains
                const recentGainSum = recentTxs.reduce((sum, tx) => sum + tx.amount, 0);
                
                // Check if sum exceeds threshold
                if (recentGainSum > SUSPICIOUS_GAIN_THRESHOLD) {
                    const user = await this.getUserInfo(userId);
                    await this.reportSuspiciousActivity(
                        user.email,
                        `Gained ${recentGainSum} coins in ${SUSPICIOUS_GAIN_TIMEFRAME/1000} seconds`,
                        {userId, username: user.username, recentGainSum, transactionType}
                    );
                    
                    // Flag account in database and reset balance to 1000
                    await this.flagSuspiciousAccount(userId, 'rapid_coin_gain');
                    await this.resetUserBalance(userId, 1000);
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error("Error monitoring transaction:", error);
            return false;
        }
    }

    // Start monitoring the leaderboard for suspicious balances
    async startLeaderboardMonitoring() {
        try {
            console.log("Starting leaderboard anti-cheat monitoring");
            
            // Import needed Firebase functions
            const { collection, query, onSnapshot, orderBy, limit } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
            
            // Monitor top players and detect impossible values
            const leaderboardRef = collection(this.db, 'leaderboard');
            const q = query(leaderboardRef, orderBy('accountBalance', 'desc'), limit(100));
            
            onSnapshot(q, async (snapshot) => {
                snapshot.forEach(async (doc) => {
                    const data = doc.data();
                    const userId = doc.id;
                    const balance = data.accountBalance;
                    
                    if (this.isBalanceSuspicious(balance)) {
                        const user = await this.getUserInfo(userId);
                        await this.reportSuspiciousActivity(
                            user.email,
                            `Suspicious balance on leaderboard: ${balance} coins`,
                            {userId, balance}
                        );
                        
                        // Flag account in database
                        await this.flagSuspiciousAccount(userId, 'impossible_leaderboard_balance');
                    }
                });
            }, error => {
                console.error("Error monitoring leaderboard:", error);
            });
            
        } catch (error) {
            console.error("Error setting up leaderboard monitoring:", error);
        }
    }

    // Get user's email and other info by userId
    async getUserInfo(userId) {
        try {
            // Import needed Firebase function
            const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
            
            // Get user data
            const userRef = doc(this.db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                return { email: "Unknown Email", username: "Unknown User" };
            }
            
            const userData = userDoc.data();
            
            // Try to get email from auth if available
            let email = "Unknown Email";
            try {
                // This requires admin rights, might not work in all contexts
                // Fallback to userData if possible
                if (userData.email) {
                    email = userData.email;
                }
            } catch (error) {
                console.error("Error getting user email:", error);
            }
            
            return {
                email: email,
                username: userData.username || "Unknown Username"
            };
        } catch (error) {
            console.error("Error getting user info:", error);
            return { email: "Error retrieving email", username: "Error retrieving username" };
        }
    }

    // Report suspicious activity to Discord webhook
    async reportSuspiciousActivity(userEmail, reason, data) {
        try {
            const timestamp = new Date().toISOString();
            
            const webhookBody = {
                content: `⚠️ **ANTICHEAT ALERT** ⚠️`,
                embeds: [{
                    title: "Suspicious Activity Detected",
                    color: 16711680, // Red color
                    description: `Warning: User **${userEmail}** has ${reason}!`,
                    fields: [
                        {
                            name: "Timestamp",
                            value: timestamp
                        },
                        {
                            name: "User Email",
                            value: userEmail
                        },
                        {
                            name: "User ID",
                            value: data.userId || "Unknown"
                        },
                        {
                            name: "Username",
                            value: data.username || "Unknown"
                        },
                        {
                            name: "Reason",
                            value: reason
                        },
                        {
                            name: "Details",
                            value: "```json\n" + JSON.stringify(data, null, 2) + "\n```"
                        },
                        {
                            name: "Action Taken",
                            value: "User balance has been reset to 1,000 coins"
                        }
                    ],
                    footer: {
                        text: "Void Network Anti-Cheat System"
                    }
                }]
            };
            
            // Get the actual webhook URL and decrypt it
            const webhookURL = getWebhookURL()
                .split('')
                .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (i % 3)))
                .join('')
                .split('')
                .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ (i % 3)))
                .join('');
            
            // Send to webhook
            const response = await fetch(webhookURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(webhookBody),
            });
            
            if (!response.ok) {
                throw new Error(`Error sending to webhook: ${response.statusText}`);
            }
            
            console.log("Suspicious activity reported to webhook");
            return true;
        } catch (error) {
            console.error("Error reporting to webhook:", error);
            return false;
        }
    }

    // Flag a suspicious account in the database
    async flagSuspiciousAccount(userId, reason) {
        try {
            // Import needed Firebase functions
            const { doc, setDoc, serverTimestamp, updateDoc } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
            
            // Add to suspicious_users collection
            const suspiciousRef = doc(this.db, 'suspicious_users', userId);
            
            // Use queue system to avoid rate limiting
            await window.queueOperation(async () => {
                await setDoc(suspiciousRef, {
                    userId: userId,
                    reason: reason,
                    detectedAt: serverTimestamp(),
                    actioned: false
                }, { merge: true });
            });
            
            // Mark in leaderboard
            const leaderboardRef = doc(this.db, 'leaderboard', userId);
            
            await window.queueOperation(async () => {
                await updateDoc(leaderboardRef, {
                    suspiciousActivity: true,
                    suspiciousReason: reason,
                    suspiciousDetectedAt: serverTimestamp()
                });
            });
            
            console.log(`Flagged suspicious account: ${userId} for ${reason}`);
            return true;
        } catch (error) {
            console.error("Error flagging suspicious account:", error);
            return false;
        }
    }

    // Enhanced verification for transaction validity
    validateTransaction(prevBalance, amount, newBalance, transactionType) {
        // Check for Infinity, NaN or very high values
        if (isNaN(prevBalance) || isNaN(amount) || isNaN(newBalance)) {
            return false;
        }
        
        if (prevBalance === Infinity || amount === Infinity || newBalance === Infinity) {
            return false;
        }
        
        // For withdrawal transactions, ensure amount is not greater than previous balance
        if (transactionType === 'loss' || transactionType === 'item_purchase') {
            if (amount > prevBalance) {
                return false;
            }
        }
        
        // Verify the math is correct (allow small floating point discrepancies)
        const expectedNewBalance = 
            transactionType === 'win' || transactionType === 'coin_purchase' 
                ? prevBalance + amount 
                : prevBalance - amount;
        
        const difference = Math.abs(expectedNewBalance - newBalance);
        if (difference > 1) { // Allow for small rounding errors
            return false;
        }
        
        return true;
    }
}

// Initialize Anti-Cheat System
window.voidAntiCheat = new VoidNetworkAntiCheat();

// Patch the recordGameTransaction function to include anti-cheat monitoring
const originalRecordGameTransaction = window.voidAccounting.recordGameTransaction;

window.voidAccounting.recordGameTransaction = async function(gameId, userId, transactionType, amount) {
    try {
        // Validate amount is a reasonable number before proceeding
        if (isNaN(amount) || amount === Infinity || amount < 0) {
            console.error(`Invalid transaction amount: ${amount}`);
            window.showNotification("Invalid transaction detected", "error");
            return { success: false, error: "Invalid amount" };
        }

        // Get current balance for validation
        const userDetails = await window.voidAccounting.getUserAccountDetails(userId);
        const currentBalance = userDetails.accountBalance;
        
        // Call original function
        const result = await originalRecordGameTransaction.call(this, gameId, userId, transactionType, amount);
        
        // If transaction was successful, monitor for suspicious activity
        if (result.success && window.voidAntiCheat) {
            await window.voidAntiCheat.monitorTransaction(
                userId, 
                transactionType, 
                amount,
                result.prevBalance || currentBalance,
                result.newBalance
            );
        }
        
        return result;
    } catch (error) {
        console.error("Error in enhanced recordGameTransaction:", error);
        // Continue with original function if error occurs in monitoring
        return await originalRecordGameTransaction.call(this, gameId, userId, transactionType, amount);
    }
};

// Patch completeCoinPurchase for anti-cheat monitoring
const originalCompleteCoinPurchase = window.completeCoinPurchase;

window.completeCoinPurchase = async function(userId, coinAmount) {
    try {
        // Validate amount
        if (isNaN(coinAmount) || coinAmount === Infinity || coinAmount < 0 || coinAmount > 1000000000) {
            console.error(`Invalid coin purchase amount: ${coinAmount}`);
            window.showNotification("Invalid purchase amount detected", "error");
            return { success: false, error: "Invalid amount" };
        }
        
        // Get current balance for comparison
        const userDetails = await window.voidAccounting.getUserAccountDetails(userId);
        const prevBalance = userDetails.accountBalance;
        
        // Call original function
        const result = await originalCompleteCoinPurchase.call(this, userId, coinAmount);
        
        // If purchase was successful, monitor for suspicious activity
        if (result.success && window.voidAntiCheat) {
            await window.voidAntiCheat.monitorTransaction(
                userId, 
                'coin_purchase', 
                coinAmount,
                prevBalance,
                result.newBalance
            );
        }
        
        return result;
    } catch (error) {
        console.error("Error in enhanced completeCoinPurchase:", error);
        return await originalCompleteCoinPurchase.call(this, userId, coinAmount);
    }
};

// Enhanced leaderboard validation function - Add to the VoidLeaderboard class
function enhanceLeaderboardSystem() {
    if (window.voidLeaderboard) {
        // Add validation function to VoidLeaderboard class
        window.voidLeaderboard.validateLeaderboardEntry = async function(userId, balance) {
            try {
                // Skip if balance is reasonable
                if (!window.voidAntiCheat || !window.voidAntiCheat.isBalanceSuspicious(balance)) {
                    return true;
                }
                
                // Import needed Firebase functions
                const { doc, getDoc, updateDoc } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
                
                // Verify against user record
                const userRef = doc(window.db, 'users', userId);
                const userDoc = await getDoc(userRef);
                
                if (!userDoc.exists()) {
                    console.error(`User record not found for leaderboard entry: ${userId}`);
                    return false;
                }
                
                const userData = userDoc.data();
                const userBalance = userData.accountBalance || 0;
                
                // If significant discrepancy, correct the leaderboard
                if (Math.abs(balance - userBalance) > 100 || window.voidAntiCheat.isBalanceSuspicious(balance)) {
                    console.log(`Correcting suspicious leaderboard balance: ${balance} -> ${userBalance} for ${userId}`);
                    
                    // Update leaderboard with correct value from user record
                    const leaderboardRef = doc(window.db, 'leaderboard', userId);
                    await updateDoc(leaderboardRef, {
                        accountBalance: userBalance,
                        correctedBySystem: true,
                        correctedAt: new Date()
                    });
                    
                    // Report suspicious activity
                    if (window.voidAntiCheat) {
                        const user = await window.voidAntiCheat.getUserInfo(userId);
                        await window.voidAntiCheat.reportSuspiciousActivity(
                            user.email,
                            `Leaderboard balance corrected: ${balance} -> ${userBalance}`,
                            {userId, oldBalance: balance, correctedBalance: userBalance}
                        );
                    }
                    
                    return false;
                }
                
                return true;
            } catch (error) {
                console.error("Error validating leaderboard entry:", error);
                return true; // Default to allowing entry if validation fails
            }
        };
        
        // Enhanced leaderboard update to validate values
        const originalUpdateLeaderboardUI = window.voidLeaderboard.updateLeaderboardUI;
        
        window.voidLeaderboard.updateLeaderboardUI = async function(querySnapshot) {
            try {
                // Create array of valid users
                const validUsers = [];
                const checkPromises = [];
                
                querySnapshot.forEach((docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const userData = docSnapshot.data();
                        const userId = docSnapshot.id;
                        const balance = userData.accountBalance;
                        
                        // Validate the balance (simple check first)
                        if (isNaN(balance) || balance === Infinity || balance < 0) {
                            console.error(`Invalid balance in leaderboard: ${balance} for ${userId}`);
                            // Skip this entry
                            return;
                        }
                        
                        // More comprehensive validation
                        const checkPromise = this.validateLeaderboardEntry(userId, balance).then(isValid => {
                            if (isValid && !userData.banned && !userData.suspiciousActivity) {
                                validUsers.push({
                                    id: userId,
                                    username: userData.username || 'Unknown',
                                    accountBalance: balance,
                                    avatar: userData.equippedAvatar ? window.itemManager.items[userData.equippedAvatar]?.url : null
                                });
                            }
                        });
                        
                        checkPromises.push(checkPromise);
                    }
                });
                
                // Wait for all validation checks
                await Promise.all(checkPromises);
                
                // Sort by account balance
                validUsers.sort((a, b) => b.accountBalance - a.accountBalance);
                this.leaderboardData = validUsers.slice(0, 20);
                
                // Render the valid users
                this.renderCachedLeaderboard();
            } catch (error) {
                console.error("Error in enhanced updateLeaderboardUI:", error);
                // Fall back to original function
                await originalUpdateLeaderboardUI.call(this, querySnapshot);
            }
        };
    }
}

// Initialize enhanced leaderboard system when ready
document.addEventListener('games-ready', function() {
    console.log("Enhancing leaderboard system with anti-cheat validation");
    enhanceLeaderboardSystem();
});

console.log('Anti-cheat system loaded and initialized');
