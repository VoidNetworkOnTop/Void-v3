/**
 * void-anticheat-integration.js - Main integration script for the anti-cheat system
 * Loads all enhanced components and initializes the system
 */

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load the anti-cheat system
    loadScript('/assets/Void Games/anticheat.js', function() {
        console.log('Anti-cheat system loaded successfully');
        
        // Load the enhanced leaderboard system
        loadScript('/assets/Void Games/leaderboard-enhancement.js', function() {
            console.log('Leaderboard enhancements loaded successfully');
            
            // Load the enhanced transaction processing
            loadScript('/assets/Void Games/transaction-enhancement.js', function() {
                console.log('Transaction enhancements loaded successfully');
                
                // Dispatch event that anti-cheat system is ready
                document.dispatchEvent(new CustomEvent('anticheat-ready'));
                console.log('Anti-cheat system integration complete');
            });
        });
    });
    
    // Function to dynamically load scripts
    function loadScript(url, callback) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        
        // Handle script loading
        script.onload = function() {
            callback();
        };
        
        script.onerror = function() {
            console.error(`Failed to load script: ${url}`);
        };
        
        // Append to document
        document.head.appendChild(script);
    }
});

// Listen for specific anti-cheat events
document.addEventListener('anticheat-ready', function() {
    // Check if previous suspicious activity exists
    if (window.auth.currentUser) {
        checkForPreviousSuspiciousActivity(window.auth.currentUser.uid);
    }
    
    // Listen for user login to check again
    document.addEventListener('user-logged-in', function(e) {
        const userId = e.detail.userId;
        checkForPreviousSuspiciousActivity(userId);
    });
});

// Function to check if user has previous suspicious activity
async function checkForPreviousSuspiciousActivity(userId) {
    try {
        // Import needed Firebase functions
        const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
        
        // Check suspicious_users collection
        const suspiciousRef = doc(window.db, 'suspicious_users', userId);
        const suspiciousDoc = await getDoc(suspiciousRef);
        
        if (suspiciousDoc.exists()) {
            const suspiciousData = suspiciousDoc.data();
            
            // Log for monitoring purposes
            console.warn(`User ${userId} has previous suspicious activity: ${suspiciousData.reason}`);
            
            // Update monitoring frequency for suspicious users
            if (window.voidAntiCheat) {
                // More frequent monitoring for suspicious accounts
                const monitorInterval = setInterval(async () => {
                    try {
                        // Get current balance
                        const userRef = doc(window.db, 'users', userId);
                        const userDoc = await getDoc(userRef);
                        
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            const currentBalance = userData.accountBalance || 0;
                            
                            // Check for suspicious balance
                            if (window.voidAntiCheat.isBalanceSuspicious(currentBalance)) {
                                const user = await window.voidAntiCheat.getUserInfo(userId);
                                await window.voidAntiCheat.reportSuspiciousActivity(
                                    user.email,
                                    `Previously flagged user has suspicious balance: ${currentBalance}`,
                                    {userId, currentBalance, previousReason: suspiciousData.reason}
                                );
                            }
                        }
                    } catch (error) {
                        console.error("Error monitoring suspicious user:", error);
                    }
                }, 60000); // Check every minute
                
                // Store the interval for cleanup
                window.suspiciousUserMonitorInterval = monitorInterval;
                
                // Clean up on logout
                document.addEventListener('user-logged-out', function() {
                    if (window.suspiciousUserMonitorInterval) {
                        clearInterval(window.suspiciousUserMonitorInterval);
                        window.suspiciousUserMonitorInterval = null;
                    }
                });
            }
        }
    } catch (error) {
        console.error("Error checking previous suspicious activity:", error);
    }
}

// Add fix for Infinity coins in display
document.addEventListener('DOMContentLoaded', function() {
    // Fix balance display to prevent showing Infinity or NaN
    const originalTextContent = Object.getOwnPropertyDescriptor(Element.prototype, 'textContent');
    
    Object.defineProperty(Element.prototype, 'textContent', {
        set: function(value) {
            // Check if this is a balance element
            if (
                (this.id === 'balance-display' || 
                this.id === 'shop-balance-display' || 
                this.classList.contains('leaderboard-balance')) && 
                (value === 'Infinity' || value === 'NaN' || value === '-Infinity')
            ) {
                console.warn(`Attempted to display invalid balance: ${value}`);
                // Set to a fallback value
                originalTextContent.set.call(this, '0');
                
                // Report the incident if possible
                if (window.voidAntiCheat && window.auth.currentUser) {
                    window.voidAntiCheat.reportSuspiciousActivity(
                        window.auth.currentUser.email || 'Unknown',
                        `Attempted to display invalid balance: ${value}`,
                        {elementId: this.id, value: value}
                    );
                }
            } else {
                // Normal behavior
                originalTextContent.set.call(this, value);
            }
        },
        get: originalTextContent.get,
        configurable: true
    });
});

// Global error tracking for suspicious errors
window.addEventListener('error', function(event) {
    // Check if error is related to suspicious activity
    if (
        event.error && 
        event.error.message && 
        (
            event.error.message.includes('Infinity') || 
            event.error.message.includes('NaN') ||
            event.error.message.includes('too large')
        )
    ) {
        console.warn('Suspicious error detected:', event.error.message);
        
        // Report if anti-cheat is available and user is logged in
        if (window.voidAntiCheat && window.auth.currentUser) {
            window.voidAntiCheat.reportSuspiciousActivity(
                window.auth.currentUser.email || 'Unknown',
                `Suspicious error detected: ${event.error.message}`,
                {
                    errorMessage: event.error.message,
                    errorStack: event.error.stack,
                    url: event.filename
                }
            );
        }
    }
});

console.log('Anti-cheat integration script loaded');
