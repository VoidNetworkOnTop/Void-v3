// Register the Scramjet service worker
(async function () {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/scramjet/sw.js', {
                scope: '/scramjet/'
            });
            console.log('Scramjet service worker registered successfully:', registration.scope);
        } catch (error) {
            console.error('Scramjet service worker registration failed:', error);
        }
    } else {
        console.error('Service workers are not supported in this browser');
    }
})();