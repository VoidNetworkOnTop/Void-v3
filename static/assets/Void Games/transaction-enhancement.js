/**
 * transaction-enhancement.js - Enhanced transaction processing for Void Network
 * Adds additional validation and security checks to transactions
 */

// Wait for all systems to be loaded
document.addEventListener('DOMContentLoaded', function() {
    // After core system is loaded, enhance transaction processing
    document.addEventListener('core-ready', function() {
        enhanceTransactionProcessing();
        console.log("Transaction processing enhanced with additional validation");
    });
    
    function enhanceTransactionProcessing() {
        // Create a transaction history cache for rapid detection of suspiciously frequent transactions
        const transactionCache = {
            userTransactions: new Map(), // userId -> array of transactions
            maxCacheSize: 50, // Max transactions to store per user
            timeWindow: 60000, // 1 minute in milliseconds
            
            // Add a transaction to the cache
            addTransaction(userId, transactionType, amount, timestamp = Date.now()) {
                if (!this.userTransactions.has(userId)) {
                    this.userTransactions.set(userId, []);
                }
                
                const userTxs = this.userTransactions.get(userId);
                
                // Add new transaction
                userTxs.push({
                    type: transactionType,
                    amount: amount,
                    timestamp: timestamp
                });
                
                // Limit cache size
                if (userTxs.length > this.maxCacheSize) {
                    userTxs.shift(); // Remove oldest
                }
            },
            
            // Get transactions in the recent time window
            getRecentTransactions(userId, timeWindow = this.timeWindow) {
                if (!this.userTransactions.has(userId)) {
                    return [];
                }
                
                const now = Date.now();
                const cutoff = now - timeWindow;
                
                return this.userTransactions.get(userId)
                    .filter(tx => tx.timestamp >= cutoff);
            },
            
            // Check for suspiciously frequent transactions
            hasFrequentTransactions(userId, threshold = 5, timeWindow = this.timeWindow) {
                const recentTxs = this.getRecentTransactions(userId, timeWindow);
                return recentTxs.length > threshold;
            },
            
            // Calculate total amount gained in recent transactions
            calculateRecentGains(userId, timeWindow = this.timeWindow) {
                const recentTxs = this.getRecentTransactions(userId, timeWindow);
                
                let totalGain = 0;
                let totalLoss = 0;
                
                recentTxs.forEach(tx => {
                    if (tx.type === 'win' || tx.type === 'coin_purchase') {
                        totalGain += tx.amount;
                    } else if (tx.type === 'loss' || tx.type === 'item_purchase') {
                        totalLoss += tx.amount;
                    }
                });
                
                return { totalGain, totalLoss, netChange: totalGain - totalLoss };
            }
        };
        
        // Enhanced validation function for transactions
        function validateTransaction(userId, transactionType, amount, gameId = null) {
            try {
                // Basic validation
                if (!userId || !transactionType) {
                    console.error("Missing userId or transactionType");
                    return { valid: false, reason: "Missing required fields" };
                }
                
                if (isNaN(amount) || amount === Infinity || amount === -Infinity) {
                    console.error(`Invalid amount: ${amount}`);
                    return { valid: false, reason: "Invalid amount" };
                }
                
                // Validate amount based on transaction type
                if (transactionType === 'win' || transactionType === 'coin_purchase') {
                    // Wins and purchases should be positive
                    if (amount <= 0) {
                        console.error(`Invalid amount for ${transactionType}: ${amount}`);
                        return { valid: false, reason: "Amount must be positive" };
                    }
                    
                    // Check for suspiciously large amounts
                    if (transactionType === 'win' && amount > 10000000) {
                        console.warn(`Suspiciously large win amount: ${amount}`);
                        return { 
                            valid: false, 
                            reason: "Suspiciously large win amount",
                            suspicious: true 
                        };
                    }
                } else if (transactionType === 'loss') {
                    // Losses should be positive (they're subtracted later)
                    if (amount <= 0) {
                        console.error(`Invalid amount for loss: ${amount}`);
                        return { valid: false, reason: "Loss amount must be positive" };
                    }
                }
                
                // Check for suspicious frequency
                if (transactionCache.hasFrequentTransactions(userId, 10, 30000)) { // 10 txs in 30 seconds
                    console.warn(`Suspiciously frequent transactions for user ${userId}`);
                    
                    // Calculate recent net change
                    const { totalGain, totalLoss, netChange } = transactionCache.calculateRecentGains(userId);
                    
                    // If there's a significant net gain, flag as suspicious
                    if (netChange > 5000000) { // 5 million net gain in 1 minute
                        console.warn(`Suspicious net gain of ${netChange} in short period for user ${userId}`);
                        return { 
                            valid: false, 
                            reason: "Suspiciously frequent large gains",
                            suspicious: true,
                            netChange: netChange
                        };
                    }
                    
                    // Limited rate but still allow some transactions (throttling)
                    const recentTxs = transactionCache.getRecentTransactions(userId, 5000); // Last 5 seconds
                    if (recentTxs.length > 3) { // More than 3 transactions in 5 seconds
                        console.warn(`Rate limiting transactions for user ${userId}`);
                        return { 
                            valid: false, 
                            reason: "Too many transactions in a short period",
                            temporary: true // Temporary rejection due to rate limiting
                        };
                    }
                }
                
                // Record valid transaction in cache
                transactionCache.addTransaction(userId, transactionType, amount);
                
                return { valid: true };
            } catch (error) {
                console.error("Error in transaction validation:", error);
                return { valid: true }; // Default to valid in case of errors
            }
        }
        
        // Replace original recordGameTransaction with enhanced version
        const originalRecordGameTransaction = window.voidAccounting.recordGameTransaction;
        
        window.voidAccounting.recordGameTransaction = async function(gameId, userId, transactionType, amount) {
            try {
                // Validate the transaction
                const validationResult = validateTransaction(userId, transactionType, amount, gameId);
                
                if (!validationResult.valid) {
                    // If it's just a temporary rate limit, show a toast and return
                    if (validationResult.temporary) {
                        window.showNotification("Please slow down your actions", "error");
                        return { success: false, rateLimit: true };
                    }
                    
                    // If suspicious, report to anti-cheat system
                    if (validationResult.suspicious && window.voidAntiCheat) {
                        const user = await window.voidAntiCheat.getUserInfo(userId);
                        await window.voidAntiCheat.reportSuspiciousActivity(
                            user.email,
                            `Suspicious transaction detected: ${validationResult.reason}`,
                            {
                                userId, 
                                transactionType, 
                                amount, 
                                gameId,
                                netChange: validationResult.netChange
                            }
                        );
                        
                        // Flag the account
                        await window.voidAntiCheat.flagSuspiciousAccount(userId, 'suspicious_transaction');
                    }
                    
                    window.showNotification("Invalid transaction detected", "error");
                    return { success: false, error: validationResult.reason };
                }
                
                // Proceed with original function for valid transactions
                return await originalRecordGameTransaction.call(this, gameId, userId, transactionType, amount);
            } catch (error) {
                console.error("Error in enhanced recordGameTransaction:", error);
                // Return failure but don't break the app
                window.showNotification("Error processing transaction", "error");
                return { success: false, error: "Processing error" };
            }
        };
    }
});

// Add transaction success/failure notifications
document.addEventListener('DOMContentLoaded', function() {
    // Create custom event listeners for transaction events
    const originalShowNotification = window.showNotification;
    
    // Replace with enhanced version that includes transaction-specific styling
    window.showNotification = function(message, type = 'success') {
        // Add special styling for transaction notifications
        if (message.includes('coins added') || message.includes('won')) {
            type = 'transaction-success';
        } else if (message.includes('spent') || message.includes('lost')) {
            type = 'transaction-warning';
        }
        
        // Call original function
        originalShowNotification(message, type);
    };
    
    // Add custom styling for transaction notifications
    const style = document.createElement('style');
    style.type = 'text/css';
    
    style.innerHTML = `
        .notification.transaction-success {
            border-left: 4px solid #4CAF50;
            background: rgba(0, 0, 0, 0.9);
            animation: transaction-success-glow 3s ease forwards;
        }
        
        .notification.transaction-warning {
            border-left: 4px solid #FF9800;
            background: rgba(0, 0, 0, 0.9);
            animation: transaction-warning-glow 3s ease forwards;
        }
        
        @keyframes transaction-success-glow {
            0% { box-shadow: 0 0 5px rgba(76, 175, 80, 0.5); }
            50% { box-shadow: 0 0 15px rgba(76, 175, 80, 0.7); }
            100% { box-shadow: 0 0 5px rgba(76, 175, 80, 0.2); opacity: 0; transform: translateY(-20px); }
        }
        
        @keyframes transaction-warning-glow {
            0% { box-shadow: 0 0 5px rgba(255, 152, 0, 0.5); }
            50% { box-shadow: 0 0 15px rgba(255, 152, 0, 0.7); }
            100% { box-shadow: 0 0 5px rgba(255, 152, 0, 0.2); opacity: 0; transform: translateY(-20px); }
        }
    `;
    
    document.head.appendChild(style);
});

console.log('Transaction enhancements loaded');
