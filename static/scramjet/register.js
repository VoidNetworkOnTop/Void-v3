// Fixed Scramjet Service Worker Registration
(async function() {
    'use strict';
    
    console.log('Scramjet registration script loading...');
    
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
        
        // Check if we're on a secure context
        if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(location.hostname)) {
            console.warn('Service Workers require a secure context (HTTPS) except on localhost');
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
            
            // Wait for the service worker to be installed and activated
            if (registration.installing) {
                console.log('Scramjet service worker installing...');
                
                await new Promise((resolve) => {
                    registration.installing.addEventListener('statechange', function() {
                        console.log('Scramjet service worker state changed to:', this.state);
                        if (this.state === 'activated') {
                            console.log('Scramjet service worker activated');
                            resolve();
                        }
                    });
                });
            } else if (registration.active) {
                console.log('Scramjet service worker already active');
            } else if (registration.waiting) {
                console.log('Scramjet service worker waiting, activating...');
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                
                await new Promise((resolve) => {
                    const checkActivation = () => {
                        if (registration.active) {
                            resolve();
                        } else {
                            setTimeout(checkActivation, 100);
                        }
                    };
                    checkActivation();
                });
            }
            
            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;
            console.log('Scramjet service worker is ready');
            
            // Set global flags
            window.__scramjet$serviceWorkerReady = true;
            window.__scramjet$registration = registration;
            
            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('scramjet-ready', {
                detail: { registration }
            }));
            
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
            const fullUrl = window.__scramjet$config.prefix + encodedPath;
            console.log('Encoded Scramjet URL:', url, '->', fullUrl);
            return fullUrl;
        } catch (error) {
            console.error('Error encoding Scramjet URL:', error);
            return null;
        }
    };
    
    // Helper function to wait for Scramjet to be ready
    window.waitForScramjet = function(timeout = 10000) {
        return new Promise((resolve, reject) => {
            if (window.isScramjetReady()) {
                resolve(true);
                return;
            }
            
            const timeoutId = setTimeout(() => {
                window.removeEventListener('scramjet-ready', onReady);
                reject(new Error('Scramjet ready timeout'));
            }, timeout);
            
            const onReady = () => {
                clearTimeout(timeoutId);
                resolve(true);
            };
            
            window.addEventListener('scramjet-ready', onReady, { once: true });
        });
    };
    
    console.log('Scramjet registration script loaded');
    
})();
