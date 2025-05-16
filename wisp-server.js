const { createWispMiddleware } = require('wisp-server-node');

// Function to create and configure the Wisp server
function setupWispServer(server) {
  console.log("Setting up Wisp server for Scramjet...");
  
  // Create a Wisp middleware handler
  const wispHandler = createWispMiddleware((req, socket, head) => {
    // This is the handler for new WebSocket connections
    console.log("New Wisp connection established");
  });
  
  // Handle WebSocket upgrade events
  server.on('upgrade', (req, socket, head) => {
    // Only handle WebSocket upgrades that are not for the bare server
    if (req.url.startsWith('/wisp') || req.headers['sec-websocket-protocol'] === 'wisp') {
      console.log("Handling Wisp WebSocket upgrade request");
      wispHandler(req, socket, head);
    }
    // Other upgrade events will be handled by the existing code
  });
  
  console.log("Wisp server setup complete");
  return wispHandler;
}

module.exports = { setupWispServer };
