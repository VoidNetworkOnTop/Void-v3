/**
 * core.js - Core functionality for Void Network
 * Contains authentication, utility functions, and base operation handling
 */

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const CACHE_LIFETIME = 300000; // 5 minutes for cache lifetime
const REQUEST_COOLDOWN = 500; // 500ms cooldown between firebase requests

// Operation queue and rate limiting
let isProcessingQueue = false;
let lastOperationTime = 0;
const operationQueue = [];

// User data cache to avoid excessive DB reads
window.userDataCache = {
    userData: null,
    lastUpdated: 0,
    purchasedItems: {},
    lastPurchaseCheck: 0,
    cacheLifetime: CACHE_LIFETIME,
    
    // Clear the cache data
    clearCache() {
        this.userData = null;
        this.lastUpdated = 0;
        this.purchasedItems = {};
        this.lastPurchaseCheck = 0;
        console.log("User data cache cleared");
    },
    
    // Check if cache is still valid
    isCacheValid() {
        return this.userData && (Date.now() - this.lastUpdated < this.cacheLifetime);
    },
    
    // Check if purchased items cache is still valid
    isPurchasedItemsCacheValid() {
        return Object.keys(this.purchasedItems).length > 0 && 
               (Date.now() - this.lastPurchaseCheck < this.cacheLifetime);
    }
};

// Connection monitoring
let isOnline = navigator.onLine;
const pendingOperations = [];

// Monitor online/offline status
window.addEventListener('online', handleOnlineStatusChange);
window.addEventListener('offline', handleOnlineStatusChange);

function handleOnlineStatusChange() {
    const wasOffline = !isOnline;
    isOnline = navigator.onLine;
    
    const statusElement = document.getElementById('connection-status');
    const statusText = document.getElementById('connection-text');
    
    if (isOnline) {
        statusElement.classList.remove('offline');
        statusElement.classList.add('online');
        statusText.textContent = 'Online';
        
        // Hide after 3 seconds
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 3000);
        
        // Process pending operations if we're back online
        if (wasOffline && pendingOperations.length > 0) {
            processPendingOperations();
        }
    } else {
        statusElement.classList.remove('online');
        statusElement.classList.add('offline');
        statusText.textContent = 'Offline - Changes will be saved when you reconnect';
        statusElement.style.display = 'block';
    }
}

// Process any pending operations when back online
async function processPendingOperations() {
    console.log(`Processing ${pendingOperations.length} pending operations`);
    
    while (pendingOperations.length > 0) {
        const operation = pendingOperations.shift();
        try {
            await operation.fn(...operation.args);
        } catch (error) {
            console.error("Error processing pending operation:", error);
            showNotification("Error completing your action. Please try again.", "error");
        }
    }
}

// Add an operation to the pending queue when offline
function addPendingOperation(fn, ...args) {
    pendingOperations.push({
        fn: fn,
        args: args,
        timestamp: Date.now()
    });
    console.log(`Added operation to pending queue. Total: ${pendingOperations.length}`);
}

// Operation queue processor with rate limiting
async function processOperationQueue() {
    if (isProcessingQueue || operationQueue.length === 0) return;
    
    isProcessingQueue = true;
    
    try {
        while (operationQueue.length > 0) {
            // Ensure we don't make requests too frequently
            const timeSinceLastOperation = Date.now() - lastOperationTime;
            if (timeSinceLastOperation < REQUEST_COOLDOWN) {
                await new Promise(resolve => setTimeout(resolve, REQUEST_COOLDOWN - timeSinceLastOperation));
            }
            
            // Get the next operation
            const operation = operationQueue.shift();
            
            try {
                // Execute the operation
                await operation.fn(...operation.args);
            } catch (error) {
                console.error("Error executing operation:", error);
                // Don't fail the entire queue for one error
            }
            
            // Update last operation time
            lastOperationTime = Date.now();
        }
    } finally {
        isProcessingQueue = false;
    }
}

// Add operation to queue
window.queueOperation = function(fn, ...args) {
    operationQueue.push({
        fn: fn,
        args: args
    });
    
    // Start processing queue if not already started
    if (!isProcessingQueue) {
        processOperationQueue();
    }
};

// Retry mechanism for Firebase operations with improved error handling
window.retryOperation = async function(operation, maxRetries = MAX_RETRIES, delay = RETRY_DELAY) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Check if we're online before attempting
            if (!isOnline) {
                throw new Error("Device is offline");
            }
            
            return await operation();
        } catch (error) {
            console.error(`Attempt ${attempt}/${maxRetries} failed:`, error);
            lastError = error;
            
            // Check if we went offline during the attempt
            if (!isOnline) {
                throw new Error("Device went offline during operation");
            }
            
            // Special handling for resource exhaustion
            if (error.code === 'resource-exhausted') {
                // Use exponential backoff with jitter for resource exhaustion
                const backoffTime = delay * Math.pow(2, attempt - 1) * (0.8 + Math.random() * 0.4);
                console.log(`Resource exhausted, backing off for ${backoffTime}ms`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
            } else if (attempt < maxRetries) {
                // Normal retry delay for other errors
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(1.5, attempt - 1)));
            }
        }
    }
    
    throw lastError; // All attempts failed
};

// Show notification function
window.showNotification = function(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.zIndex = '10000'; // Ensure it's above theme background
    document.body.appendChild(notification);
    
    // Remove notification after animation completes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
};

/**
 * VoidNetworkAccounting Class - Manages user accounts and transactions
 */
class VoidNetworkAccounting {
    constructor() {
        this.auth = window.auth;
        this.db = window.db;
        console.log("VoidNetworkAccounting initialized with improved handling");
    }

    // User Registration - with enhanced security
    async registerUser(email, password, username) {
        try {
            // Validate inputs
            if (!email || !password || !username) {
                throw new Error('Email, password, and username are required');
            }
            
            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }
            
            if (!isOnline) {
                throw new Error('You need to be online to register');
            }
            
            // Import needed Firebase functions
            const { createUserWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js");
            const { collection, query, where, getDocs, doc, writeBatch } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
            
            // Check if username already exists
            const usersRef = collection(this.db, 'users');
            const q = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                throw new Error('Username already exists. Please choose a different username.');
            }
            
            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;

            // Create user profile with batch operation
            const batch = writeBatch(this.db);
            
            // User document
            batch.set(doc(this.db, 'users', user.uid), {
                username: username,
                createdAt: new Date(),
                accountBalance: 1000, // Starting balance
                totalGamesPlayed: 0
            });
            
            // Leaderboard entry
            batch.set(doc(this.db, 'leaderboard', user.uid), {
                username: username,
                accountBalance: 1000, // Starting balance
                joinDate: new Date()
            });
            
            // Commit the batch
            await batch.commit();
            
            // Clear cache on new registration
            userDataCache.clearCache();

            console.log("User registered successfully:", user.uid);
            return user;
        } catch (error) {
            console.error("Registration Error:", error);
            throw error;
        }
    }

    // User Login with improved error handling
    async loginUser(email, password) {
        try {
            if (!isOnline) {
                throw new Error('You need to be online to log in');
            }
            
            console.log("Logging in user:", email);
            
            // Import needed Firebase function
            const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js");
            
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            
            // Clear cache on login - force fresh data
            userDataCache.clearCache();
            
            console.log("User logged in successfully:", userCredential.user.uid);
            return userCredential.user;
        } catch (error) {
            console.error("Login Error:", error);
            throw error;
        }
    }

    // Logout with cleanup
    async logout() {
        try {
            console.log("Logging out user");
            
            // Clear cache on logout
            userDataCache.clearCache();
            
            // Unsubscribe from leaderboard if active
            if (window.voidLeaderboard && typeof window.voidLeaderboard.stopLeaderboardUpdates === 'function') {
                window.voidLeaderboard.stopLeaderboardUpdates();
            }
            
            await this.auth.signOut();
            console.log("User logged out successfully");
        } catch (error) {
            console.error("Logout Error:", error);
            throw error;
        }
    }

    // Get Current User
    getCurrentUser() {
        return this.auth.currentUser;
    }

    // Get User Account Details - Secured version with caching
    async getUserAccountDetails(userId) {
        try {
            // Check if we're offline
            if (!isOnline) {
                // Return cached data if available
                if (userDataCache.userData) {
                    console.log("Using cached user data while offline");
                    return userDataCache.userData;
                }
                
                // Otherwise, throw error
                throw new Error('Offline and no cached data available');
            }
            
            // Return cached data if it's still valid
            if (userDataCache.isCacheValid()) {
                console.log("Using cached user data");
                return userDataCache.userData;
            }
            
            console.log("Getting account details for user:", userId);
            
            // Import needed Firebase function
            const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
            
            // Security check: Only allow user to get their own details
            if (this.auth.currentUser && userId !== this.auth.currentUser.uid) {
                console.warn("User trying to access another user's details - denied");
                throw new Error('Unauthorized access');
            }
            
            // Get user data with retries
            try {
                const userRef = doc(this.db, 'users', userId);
                const userDoc = await getDoc(userRef);
                
                if (!userDoc.exists()) {
                    throw new Error('User not found');
                }
                
                const userData = userDoc.data();
                
                // Cache the user data
                userDataCache.userData = userData;
                userDataCache.lastUpdated = Date.now();
                
                console.log("Retrieved user data for:", userData.username);
                return userData;
            } catch (error) {
                console.error("Error getting user data:", error);
                
                // If we have cached data and got an error, use the cache
                if (userDataCache.userData) {
                    console.log("Using cached data after error");
                    return userDataCache.userData;
                }
                
                throw error;
            }
        } catch (error) {
            console.error("Account Details Error:", error);
            
            // If we have cached data and got an error, use the cache as fallback
            if (userDataCache.userData) {
                console.log("Using cached data as fallback");
                return userDataCache.userData;
            }
            
            throw error;
        }
    }

    // Improved and more secure game transaction recording with batching
    async recordGameTransaction(gameId, userId, transactionType, amount) {
        try {
            console.log(`Recording game transaction: ${transactionType} for ${amount} coins in ${gameId}`);
            
            // Check if we're offline
            if (!isOnline) {
                addPendingOperation(this.recordGameTransaction.bind(this), gameId, userId, transactionType, amount);
                showNotification('You\'re offline. Game progress will be saved when you reconnect.', 'error');
                return {
                    success: false,
                    offline: true
                };
            }
            
            // Import needed Firebase functions
            const { doc, getDoc, collection, writeBatch } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
            
            // Security check: Only allow user to create transactions for themselves
            if (this.auth.currentUser && userId !== this.auth.currentUser.uid) {
                console.warn("User trying to create transaction for another user - denied");
                throw new Error('Unauthorized access');
            }
            
            // Get the user's current data
            let userData, currentBalance, newBalance;
            
            // Use a batch for better consistency
            const batch = writeBatch(this.db);
            
            try {
                const userRef = doc(this.db, 'users', userId);
                const userDoc = await getDoc(userRef);
                
                if (!userDoc.exists()) {
                    throw new Error('User document not found');
                }
                
                userData = userDoc.data();
                currentBalance = userData.accountBalance || 0;
                
                // Only update balance for certain transaction types
                if (transactionType === 'win' || transactionType === 'loss') {
                    // Calculate new balance
                    newBalance = transactionType === 'win' 
                        ? currentBalance + amount
                        : Math.max(0, currentBalance - amount); // Prevent negative balance
                    
                    // Update user account in Firestore
                    batch.update(userRef, {
                        accountBalance: newBalance,
                        totalGamesPlayed: (userData.totalGamesPlayed || 0) + 1
                    });
                    
                    // Update leaderboard entry (for display purposes)
                    const leaderboardRef = doc(this.db, 'leaderboard', userId);
                    const leaderboardDoc = await getDoc(leaderboardRef);
                    
                    if (leaderboardDoc.exists()) {
                        // Check if user is banned before updating
                        const leaderboardData = leaderboardDoc.data();
                        if (leaderboardData.banned !== true) {
                            batch.update(leaderboardRef, {
                                accountBalance: newBalance
                            });
                        }
                    } else {
                        // Create leaderboard entry if it doesn't exist
                        batch.set(leaderboardRef, {
                            username: userData.username || 'Unknown',
                            accountBalance: newBalance,
                            joinDate: new Date()
                        });
                    }
                    
                    // Add transaction record to batch
                    const transactionRef = doc(collection(this.db, 'transactions'));
                    batch.set(transactionRef, {
                        userId: userId,
                        gameId: gameId,
                        transactionType: transactionType,
                        amount: amount,
                        timestamp: new Date(),
                        prevBalance: currentBalance,
                        newBalance: newBalance
                    });
                } else {
                    // Just record the game play without changing balance
                    const transactionRef = doc(collection(this.db, 'transactions'));
                    batch.set(transactionRef, {
                        userId: userId,
                        gameId: gameId,
                        transactionType: transactionType,
                        timestamp: new Date()
                    });
                }
                
                // Commit the batch
                await batch.commit();
                
                // Update cache
                if (transactionType === 'win' || transactionType === 'loss') {
                    if (userDataCache.userData) {
                        userDataCache.userData = {
                            ...userDataCache.userData,
                            accountBalance: newBalance,
                            totalGamesPlayed: (userData.totalGamesPlayed || 0) + 1
                        };
                        userDataCache.lastUpdated = Date.now();
                    }
                    
                    // Update leaderboard immediately with better error handling
                    try {
                        if (window.voidLeaderboard && typeof window.voidLeaderboard.updateUserBalance === 'function') {
                            console.log(`Immediately updating leaderboard for user ${userId} to ${newBalance}`);
                            window.voidLeaderboard.updateUserBalance(userId, newBalance);
                            
                            // As a backup, also refresh the whole leaderboard after a short delay
                            setTimeout(() => {
                                if (typeof window.refreshLeaderboard === 'function') {
                                    window.refreshLeaderboard();
                                }
                            }, 2000);
                        } else {
                            console.warn("Leaderboard object or updateUserBalance method not available");
                            // Fallback to refresh
                            if (typeof window.refreshLeaderboard === 'function') {
                                window.refreshLeaderboard();
                            }
                        }
                    } catch (error) {
                        console.error("Error updating leaderboard immediately:", error);
                    }
                    
                    // Update balance displays in UI
                    const shopBalanceDisplay = document.getElementById('shop-balance-display');
                    const balanceDisplay = document.getElementById('balance-display');
                    
                    if (shopBalanceDisplay) shopBalanceDisplay.textContent = newBalance.toLocaleString();
                    if (balanceDisplay) balanceDisplay.textContent = newBalance.toLocaleString();
                }
            } catch (error) {
                console.error("Error processing transaction:", error);
                throw error;
            }
            
            if (transactionType === 'win' || transactionType === 'loss') {
                return {
                    success: true,
                    prevBalance: currentBalance,
                    newBalance: newBalance
                };
            } else {
                return {
                    success: true,
                    currentBalance: currentBalance
                };
            }
        } catch (error) {
            console.error("Transaction Error:", error);
            showNotification("Error recording game progress. Please try again.", "error");
            throw error;
        }
    }
}

// Initialize Accounting System
window.voidAccounting = new VoidNetworkAccounting();

// Update UI based on authentication state with improved caching
async function updateUIForLoggedInUser(user) {
    const userProfile = document.getElementById('user-profile');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (!userProfile || !loginForm || !registerForm) {
        console.error("Auth UI elements not found");
        return;
    }
    
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    userProfile.style.display = 'block';
    
    try {
        // Fetch fresh user details with caching
        const userDetails = await window.voidAccounting.getUserAccountDetails(user.uid);
        const usernameDisplay = document.getElementById('username-display');
        const balanceDisplay = document.getElementById('balance-display');
        
        if (usernameDisplay) usernameDisplay.textContent = userDetails.username;
        if (balanceDisplay) balanceDisplay.textContent = userDetails.accountBalance.toLocaleString();
        
        console.log("Updated UI with username:", userDetails.username);
        
        // Load user's theme and avatar if they have them equipped
        if (window.itemManager && window.itemManager.loadUserPreferences) {
            await window.itemManager.loadUserPreferences(user.uid);
        
            // Check if user is a developer and show dev tab if they are
            const isDev = await window.itemManager.verifyDevAccess();
            const devTab = document.querySelector('.shop-tab[data-tab="dev"]');
            
            if (devTab) {
                devTab.style.display = isDev ? 'block' : 'none';
            }
        }
        
        // Refresh leaderboard
        if (window.refreshLeaderboard) {
            window.refreshLeaderboard();
        }
        
        // Check for dev avatars and verify every minute for security
        setInterval(async () => {
            if (window.itemManager && window.itemManager.verifyDevAccess) {
                await window.itemManager.verifyDevAccess();
            }
        }, 60000); // Check every 1 minute
        
        // Dispatch event that user is logged in
        document.dispatchEvent(new CustomEvent('user-logged-in', { 
            detail: { userId: user.uid }
        }));
    } catch (error) {
        console.error("Error updating UI:", error);
        showNotification('Could not load user details. Please try again.', 'error');
    }
}

function updateUIForLoggedOutUser() {
    const userProfile = document.getElementById('user-profile');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (!userProfile || !loginForm || !registerForm) {
        console.error("Auth UI elements not found");
        return;
    }
    
    loginForm.style.display = 'block';
    registerForm.style.display = 'block';
    userProfile.style.display = 'none';
    
    // Hide dev tab
    const devTab = document.querySelector('.shop-tab[data-tab="dev"]');
    if (devTab) {
        devTab.style.display = 'none';
    }
    
    // Dispatch event that user is logged out
    document.dispatchEvent(new CustomEvent('user-logged-out'));
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Authentication Event Listeners
    
    // Login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            
            if (!emailInput || !passwordInput) {
                showNotification("Login form elements not found", "error");
                return;
            }
            
            const email = emailInput.value;
            const password = passwordInput.value;
            
            if (!email || !password) {
                showNotification('Please enter both email and password', 'error');
                return;
            }
            
            // Check if we're online
            if (!isOnline) {
                showNotification('You need to be online to log in', 'error');
                return;
            }
            
            // Disable the button and add a loading indicator
            const originalText = loginBtn.textContent;
            loginBtn.disabled = true;
            loginBtn.innerHTML = `<span class="loader"></span> Logging in...`;
            
            try {
                const user = await window.voidAccounting.loginUser(email, password);
                console.log('Logged in user:', user);
                await updateUIForLoggedInUser(user);
                
                const authContainer = document.getElementById('auth-container');
                if (authContainer) {
                    authContainer.style.display = 'none'; // Hide auth container after login
                    authContainer.classList.remove('visible');
                }
                
                showNotification('Login successful!', 'success');
                
                // Clear form fields
                emailInput.value = '';
                passwordInput.value = '';
            } catch (error) {
                showNotification('Login failed: ' + error.message, 'error');
            } finally {
                // Restore the button
                loginBtn.disabled = false;
                loginBtn.textContent = originalText;
            }
        });
    }

    // Register button
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const usernameInput = document.getElementById('register-username');
            const emailInput = document.getElementById('register-email');
            const passwordInput = document.getElementById('register-password');
            
            if (!usernameInput || !emailInput || !passwordInput) {
                showNotification("Registration form elements not found", "error");
                return;
            }
            
            const username = usernameInput.value;
            const email = emailInput.value;
            const password = passwordInput.value;
            
            if (!username || !email || !password) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            
            // Check if we're online
            if (!isOnline) {
                showNotification('You need to be online to register', 'error');
                return;
            }
            
            // Disable the button and add a loading indicator
            const originalText = registerBtn.textContent;
            registerBtn.disabled = true;
            registerBtn.innerHTML = `<span class="loader"></span> Registering...`;
            
            try {
                const user = await window.voidAccounting.registerUser(email, password, username);
                console.log('Registered user:', user);
                await updateUIForLoggedInUser(user);
                
                const authContainer = document.getElementById('auth-container');
                if (authContainer) {
                    authContainer.style.display = 'none'; // Hide auth container after registration
                    authContainer.classList.remove('visible');
                }
                
                showNotification('Registration successful!', 'success');
                
                // Clear form fields
                usernameInput.value = '';
                emailInput.value = '';
                passwordInput.value = '';
            } catch (error) {
                showNotification('Registration failed: ' + error.message, 'error');
            } finally {
                // Restore the button
                registerBtn.disabled = false;
                registerBtn.textContent = originalText;
            }
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                // Unequip any theme before logging out
                if (window.itemManager && window.itemManager.currentTheme) {
                    window.itemManager.unequipTheme();
                }
                
                await window.voidAccounting.logout();
                updateUIForLoggedOutUser();
                
                // Close containers
                const containers = [
                    document.getElementById('shop-container'),
                    document.getElementById('auth-container'),
                    document.getElementById('coin-purchase-popup'),
                    document.getElementById('prx-info-popup')
                ];
                
                containers.forEach(container => {
                    if (container) {
                        container.style.display = 'none';
                        container.classList.remove('visible');
                    }
                });
                
                showNotification('You have been logged out', 'success');
            } catch (error) {
                showNotification('Logout failed: ' + error.message, 'error');
            }
        });
    }
    
    // Initialize connection status
    handleOnlineStatusChange();
});

// Listen for authentication state changes
if (window.auth) {
    window.auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log("Auth state changed: User is signed in", user.uid);
            await updateUIForLoggedInUser(user);
            
            // Start leaderboard updates if not already started
            if (window.voidLeaderboard && typeof window.voidLeaderboard.startLeaderboardUpdates === 'function') {
                window.voidLeaderboard.startLeaderboardUpdates();
            }
        } else {
            console.log("Auth state changed: User is signed out");
            updateUIForLoggedOutUser();
            
            // Make sure items are unequipped when logged out
            if (window.itemManager) {
                if (window.itemManager.currentTheme) {
                    window.itemManager.unequipTheme();
                }
                window.itemManager.currentTheme = null;
                window.itemManager.currentAvatar = null;
            }
            
            // Refresh leaderboard for anonymous view
            if (window.refreshLeaderboard) {
                window.refreshLeaderboard();
            }
        }
    });
}

// Profile Icon Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    const profileIcon = document.getElementById('profile-icon');
    const authContainer = document.getElementById('auth-container');

    if (profileIcon && authContainer) {
        profileIcon.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from bubbling up
            
            // Close shop container if open
            const shopContainer = document.getElementById('shop-container');
            const coinPurchasePopup = document.getElementById('coin-purchase-popup');
            const prxInfoPopup = document.getElementById('prx-info-popup');
            
            if (shopContainer) {
                shopContainer.style.display = 'none';
                shopContainer.classList.remove('visible');
            }
            
            if (coinPurchasePopup) {
                coinPurchasePopup.style.display = 'none';
                coinPurchasePopup.classList.remove('visible');
            }
            
            if (prxInfoPopup) {
                prxInfoPopup.style.display = 'none';
                prxInfoPopup.classList.remove('visible');
            }
            
            // Toggle visibility of auth container with animation
            if (authContainer.style.display === 'block') {
                authContainer.classList.remove('visible');
                setTimeout(() => {
                    authContainer.style.display = 'none';
                }, 300);
            } else {
                authContainer.style.display = 'block';
                setTimeout(() => {
                    authContainer.classList.add('visible');
                }, 10);
                
                // If user is logged in, refresh balance display
                if (window.auth.currentUser) {
                    // Add a small delay to ensure any pending transactions are complete
                    setTimeout(() => {
                        window.voidAccounting.getUserAccountDetails(window.auth.currentUser.uid)
                            .then(userDetails => {
                                const usernameDisplay = document.getElementById('username-display');
                                const balanceDisplay = document.getElementById('balance-display');
                                
                                if (usernameDisplay) usernameDisplay.textContent = userDetails.username;
                                if (balanceDisplay) balanceDisplay.textContent = userDetails.accountBalance.toLocaleString();
                            })
                            .catch(error => {
                                console.error("Error refreshing balance:", error);
                            });
                    }, 300);
                }
            }
        });
    }
});

// Clean up event listeners and timers when user leaves
window.addEventListener('beforeunload', () => {
    if (window.voidLeaderboard && typeof window.voidLeaderboard.stopLeaderboardUpdates === 'function') {
        window.voidLeaderboard.stopLeaderboardUpdates();
    }
    
    if (window.leaderboardRefreshInterval) {
        clearInterval(window.leaderboardRefreshInterval);
    }
    
    // Clear any operation timeouts
    if (operationQueue.length > 0) {
        console.log(`${operationQueue.length} operations still in queue`);
    }
});

// Export common URL query parameter handling
window.addEventListener('load', async () => {
    try {
        console.log("Core systems initialized");
        
        // Check for URL query parameters for payment success
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('payment') && urlParams.get('payment') === 'success') {
            // Handle successful payment return
            if (window.auth.currentUser && window.completeCoinPurchase) {
                // Get the coin amount from localStorage or use default
                const coinAmount = parseInt(localStorage.getItem('coinPurchaseAmount') || '1000000', 10);
                
                // Execute the completion function
                window.completeCoinPurchase(window.auth.currentUser.uid, coinAmount)
                    .then(() => {
                        // Clear the payment param from URL to prevent duplicate processing
                        const newUrl = window.location.href.split('?')[0];
                        window.history.replaceState({}, document.title, newUrl);
                        
                        // Clear localStorage
                        localStorage.removeItem('coinPurchaseAmount');
                    });
            }
        }
        
        // Dispatch an event that core is ready
        document.dispatchEvent(new CustomEvent('core-ready'));
    } catch (err) {
        console.error('Error during core initialization:', err);
        showNotification("Error initializing application. Please refresh the page.", "error");
    }
});
