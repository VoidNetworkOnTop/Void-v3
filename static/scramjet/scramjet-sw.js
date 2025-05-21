// Import Scramjet worker
importScripts('/scramjet/scramjet.worker.js');

// Create a Scramjet service worker
try {
  const scramjet = new ScramjetServiceWorker();

  // Handle fetch events
  self.addEventListener('fetch', (event) => {
    if (scramjet.route(event)) {
      event.respondWith(scramjet.fetch(event));
    }
  });
} catch (error) {
  console.error('Failed to initialize Scramjet service worker:', error);
}

// Handle activate events
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle install events
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});
