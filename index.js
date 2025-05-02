import { createBareServer } from '@tomphttp/bare-server-node';
import express from 'express';
import http from 'node:http';
import path from "node:path";
import compression from 'compression';
import { promisify } from 'util';

const app = express();
const PORT = 8080;
const __dirname = process.cwd();

// Create Bare server with improved config for game support
const bare = createBareServer("/bare/", {
  // Increased timeouts for games and large assets
  connectTimeout: 30000,
  socketTimeout: 90000,
  // Headers config for better game compatibility
  headers: {
    // Remove headers that might cause issues
    blocklist: ["cookie", "origin"],
    // Set permissive values for potentially problematic headers
    "content-security-policy": "",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "*",
    "access-control-allow-headers": "*"
  }
});

// Enhanced Bare server with better error handling and game support
const originalRouteRequest = bare.routeRequest;
bare.routeRequest = async function(req, res) {
  // Set longer timeout for slow connections and games
  const BARE_TIMEOUT = 90000; // 90 seconds (increased from 60s)
  req.setTimeout(BARE_TIMEOUT);
  res.setTimeout(BARE_TIMEOUT);
  
  // Check if this is likely a game request
  const isGameRequest = 
    req.url.includes('game') || 
    req.url.includes('unity') || 
    req.url.includes('play') ||
    req.url.includes('cdn') ||
    req.url.includes('.js') ||
    req.url.includes('.wasm');
  
  // Log game-related requests for troubleshooting
  if (isGameRequest) {
    const reqUrlPreview = req.url.length > 100 ? 
      req.url.substring(0, 100) + '...' : req.url;
    console.log(`[BARE] Game request: ${reqUrlPreview}`);
  }
  
  try {
    // Call the original handler
    await originalRouteRequest.call(this, req, res);
    
    // Log successful game requests
    if (isGameRequest) {
      console.log(`[BARE] Game request completed: ${req.url.substring(0, 50)}...`);
    }
  } catch (error) {
    console.error('[BARE] Server error:', error.message, req.url.substring(0, 100));
    
    // Improved error handling based on error type
    if (!res.headersSent) {
      // Different responses for different error types
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        res.writeHead(504, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: true,
          message: 'Connection timeout or reset',
          code: error.code,
          url: req.url
        }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: true,
          message: 'Proxy server error',
          code: error.code || 'UNKNOWN_ERROR',
          url: req.url
        }));
      }
    }
  }
};

// Apply compression middleware to reduce bandwidth usage and improve speed
app.use(compression({
  level: 6, // Balanced between compression and CPU usage
  threshold: 0 // Always compress
}));

// Add CORS headers for better game compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Force HTTPS if needed
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] === 'http') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// Static files and routes
app.use(express.static("img")); // IMGS GET PRIORITY

// Add cache headers for static files
const staticOptions = {
  setHeaders: (res, path) => {
    // Set long cache for images
    if (path.endsWith('.jpg') || path.endsWith('.png') || path.endsWith('.gif') || path.endsWith('.webp')) {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    }
    // No cache for HTML
    else if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
    // Medium cache for other assets
    else {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
    }
  }
};

// Game routes with specific handling - keep your existing routes
app.get("/ga", function (req, res) {
  // Add headers specifically for games
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  res.sendFile(path.join(__dirname, "static/games.html"));
});

app.get("/rga", function(req, res) {
  // Add headers specifically for games
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  res.sendFile(path.join(__dirname, "static/rga.html"));
});

app.get("/learn", function (req, res) {
  res.sendFile(path.join(__dirname, "static/proxy.html"));
});

app.get("/app", function (req, res) {
  res.sendFile(path.join(__dirname, "static/apps.html"));
});

app.get("/credits", function (req, res) {
  res.sendFile(path.join(__dirname, "static/credits.html"));
});

app.get("/voidurls", function (req, res) {
  res.sendFile(path.join(__dirname, "static/voidurls.html"));
});

app.get("/settings", function (req, res) {
  res.sendFile(path.join(__dirname, "static/settings.html"));
});

app.get("/chat", function (req, res) {
  res.sendFile(path.join(__dirname, "static/chat.html"));
});

// Special endpoint to clear service worker cache
app.get("/clearcache", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Clear Cache</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #fff; background: #222; }
        .container { max-width: 600px; margin: 40px auto; padding: 20px; background: #333; border-radius: 8px; }
        h1 { margin-top: 0; color: #4a6ed3; }
        button { background: #4a6ed3; color: white; border: 0; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        .result { margin-top: 20px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Clear Browser Cache</h1>
        <p>If games or websites aren't loading correctly, try clearing your cache.</p>
        <button id="clearCache">Clear Cache and Reload</button>
        <div id="result" class="result"></div>
      </div>

      <script>
        document.getElementById('clearCache').addEventListener('click', async () => {
          const result = document.getElementById('result');
          result.textContent = 'Clearing cache...';
          
          try {
            // Clear caches
            if ('caches' in window) {
              const keys = await window.caches.keys();
              await Promise.all(keys.map(key => caches.delete(key)));
            }
            
            // Unregister service workers
            if ('serviceWorker' in navigator) {
              const registrations = await navigator.serviceWorker.getRegistrations();
              await Promise.all(registrations.map(r => r.unregister()));
              
              // Message service worker
              if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: 'CLEAR_CACHE'
                });
              }
            }
            
            result.textContent = 'Cache cleared! Reloading in 2 seconds...';
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          } catch (e) {
            result.textContent = 'Error: ' + e.message;
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Serve static files
app.use(express.static(path.join(__dirname, "static"), staticOptions));

// 404 handler
app.get('*', function(req, res) {
  res.status(404).sendFile(path.join(__dirname, "static/404.html"));
});

// Create HTTP server
const server = http.createServer();

// Route requests
server.on("request", (req, res) => {
  try {
    if (bare.shouldRoute(req)) {
      bare.routeRequest(req, res);
    } else {
      app(req, res);
    }
  } catch (err) {
    console.error('Fatal server error:', err);
    
    // Send a helpful error response
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server error: ' + err.message);
    }
  }
});

// Memory monitoring with improved handling
const MEMORY_CHECK_INTERVAL = 60000; // 1 minute
let restartAttempts = 0;

setInterval(() => {
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  console.log(`Memory usage: ${memoryUsageMB}MB`);
  
  // Auto-restart if memory usage is too high
  if (memoryUsageMB > 800) {
    restartAttempts++;
    
    if (restartAttempts <= 3) {
      console.log('Memory usage too high, restarting...');
      
      // Run garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('Forced garbage collection ran');
      }
      
      // Only exit if memory is still high after GC
      if (process.memoryUsage().heapUsed / 1024 / 1024 > 750) {
        process.exit(1); // PM2 will restart
      }
    } else {
      console.log('Maximum restart attempts reached, will not auto-restart');
      // Reset after 1 hour
      setTimeout(() => {
        restartAttempts = 0;
      }, 3600000);
    }
  }
}, MEMORY_CHECK_INTERVAL);

// Start the server
server.listen({ port: PORT }, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Bare server running at /bare/`);
  console.log(`Server started at: ${new Date().toISOString()}`);
});

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  
  // Force exit after 5 seconds
  setTimeout(() => {
    console.log('Forced exit after timeout');
    process.exit(1);
  }, 5000);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  
  // Only restart for non-fatal errors
  if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
    console.log('Recoverable error, continuing...');
  } else {
    console.log('Fatal error, restarting...');
    process.exit(1); // PM2 will restart
  }
});
