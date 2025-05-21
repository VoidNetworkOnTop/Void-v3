// Fixed Scramjet Service Worker Registration
(async function() {
    'use strict';
    
    // Wait for DOM to be ready
    if (document.readyState !== 'loading') {
        await registerScramjetServiceWorker();
    } else {
        document.addEventListener('DOMContentLoaded', registerScramjetServiceWorker);
    }
    
    async function registerScramjetServiceWorker() {
        // Check if service workers are supported
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Workers are not supported in this browser');
            return false;
        }
        
        try {
            console.log('Registering Scramjet service worker...');
            
            // Unregister any existing Scramjet service worker first
            const existingRegistrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of existingRegistrations) {
                if (registration.scope.includes('/scramjet/') || 
                    (registration.active && registration.active.scriptURL.includes('scramjet'))) {
                    console.log('Unregistering existing Scramjet service worker');
                    await registration.unregister();
                }
            }
            
            // Register the new service worker
            const registration = await navigator.serviceWorker.register('/scramjet/scramjet-sw.js', {
                scope: '/scramjet/',
                updateViaCache: 'none'
            });
            
            console.log('Scramjet service worker registered successfully:', registration.scope);
            
            // Wait for service worker to be active
            if (registration.installing) {
                console.log('Scramjet service worker installing...');
                await new Promise((resolve) => {
                    registration.installing.addEventListener('statechange', function() {
                        if (this.state === 'activated') {
                            console.log('Scramjet service worker activated');
                            resolve();
                        }
                    });
                });
            } else if (registration.active) {
                console.log('Scramjet service worker already active');
            }
            
            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;
            console.log('Scramjet service worker is ready');
            
            // Set global flag
            window.__scramjet$serviceWorkerReady = true;
            
            return true;
            
        } catch (error) {
            console.error('Failed to register Scramjet service worker:', error);
            return false;
        }
    }
    
    // Helper function to check if Scramjet is ready
    window.isScramjetReady = function() {
        return !!(window.__scramjet$config && window.__scramjet$serviceWorkerReady);
    };
    
    // Helper function to encode URL with Scramjet
    window.encodeScramjetUrl = function(url) {
        if (!window.__scramjet$config) {
            console.error('Scramjet config not loaded');
            return null;
        }
        
        try {
            const encodedPath = window.__scramjet$config.encodeUrl(url);
            return window.__scramjet$config.prefix + encodedPath;
        } catch (error) {
            console.error('Error encoding Scramjet URL:', error);
            return null;
        }
    };
    
})();
