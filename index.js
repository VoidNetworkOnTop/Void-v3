import { createBareServer } from '@tomphttp/bare-server-node';
import express from 'express';
import http from 'node:http';
import path from "node:path";
import compression from 'compression';
import { promisify } from 'util';
import fs from 'fs';

const app = express();
const PORT = 8080;
const __dirname = process.cwd();

// Create Bare server with improved error handling
const bare = createBareServer("/bare/");

// Auto-healing configuration
const HEALING_CONFIG = {
  ENABLED: true,
  MEMORY_CHECK_INTERVAL: 60000,        // 1 minute
  MEMORY_THRESHOLD: 800,               // MB
  ERROR_THRESHOLD: 50,                 // consecutive errors before restart
  AUTO_RESTART_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
  lastRestartTime: Date.now(),
  errorCount: 0
};

// Auto-healing middleware - track and reset error counters
app.use((req, res, next) => {
  // Create error tracking middleware
  const originalEnd = res.end;
  const originalSend = res.send;
  
  // Override end method to track errors
  res.end = function(chunk, encoding, callback) {
    if (res.statusCode >= 500) {
      HEALING_CONFIG.errorCount++;
      console.log(`Error counter: ${HEALING_CONFIG.errorCount}/${HEALING_CONFIG.ERROR_THRESHOLD}`);
      
      // If too many errors, restart
      if (HEALING_CONFIG.ENABLED && HEALING_CONFIG.errorCount >= HEALING_CONFIG.ERROR_THRESHOLD) {
        console.log('Too many errors, triggering auto-restart...');
        process.exit(1); // PM2 will restart
      }
    } else {
      // Reset error counter on successful requests (with decay)
      HEALING_CONFIG.errorCount = Math.max(0, HEALING_CONFIG.errorCount - 0.1);
    }
    
    // Call original method
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  // Override send method to add auto-healing scripts to HTML
  res.send = function(body) {
    // If this is HTML content, add auto-healing script
    if (typeof body === 'string' && body.includes('<!DOCTYPE html>') && 
        !body.includes('uv-auto-healing-client')) {
      
      // Add auto-healing client script before closing body tag
      body = body.replace('</body>', `
      <script data-id="uv-auto-healing-client">
        // Auto-healing client script
        (function() {
          // Check if service worker is registered
          async function checkServiceWorker() {
            if (!('serviceWorker' in navigator)) return;
            
            try {
              // Check if UV service worker exists
              const registrations = await navigator.serviceWorker.getRegistrations();
              const uvWorker = registrations.find(r => 
                r.scope.includes('/uv/') || 
                (r.active && r.active.scriptURL.includes('sw.js'))
              );
              
              if (!uvWorker) {
                console.log('UV service worker missing, auto-registering...');
                
                // If UV config exists, register with correct scope
                if (window.__uv$config) {
                  try {
                    // Register with proper scope
                    const registration = await navigator.serviceWorker.register('/uv/sw.js', {
                      scope: window.__uv$config.prefix,
                      updateViaCache: 'none'
                    });
                    console.log('Auto-healing: Registered UV service worker');
                  } catch (err) {
                    console.error('Auto-healing: Failed to register service worker:', err);
                  }
                }
              }
            } catch (err) {
              console.error('Service worker check failed:', err);
            }
          }
          
          // Run service worker check
          checkServiceWorker();
          
          // Periodically check service worker health
          setInterval(checkServiceWorker, 60000);
          
          // Add blank screen detection
          setTimeout(function() {
            // If page has minimal content after loading, reload
            const contentLength = document.body.innerText.trim().length;
            const elementCount = document.querySelectorAll('*').length;
            
            if (contentLength < 10 && elementCount < 5) {
              console.log('Auto-healing: Detected blank page, auto-reloading');
              
              // Only reload if we haven't reloaded too many times
              const reloadCount = parseInt(sessionStorage.getItem('auto-reload-count') || '0');
              if (reloadCount < 3) {
                sessionStorage.setItem('auto-reload-count', (reloadCount + 1).toString());
                window.location.reload();
              }
            } else {
              // Reset reload count on successful load
              sessionStorage.removeItem('auto-reload-count');
            }
          }, 5000);
        })();
      </script>
      </body>`);
    }
    
    // Call original method
    return originalSend.call(this, body);
  };
  
  next();
});

// Enhanced Bare server with better error handling and auto-healing
const originalRouteRequest = bare.routeRequest;
bare.routeRequest = async function(req, res) {
  // Set longer timeout for slow connections
  const BARE_TIMEOUT = 60000; // 60 seconds
  req.setTimeout(BARE_TIMEOUT);
  res.setTimeout(BARE_TIMEOUT);
  
  try {
    // Call the original handler
    await originalRouteRequest.call(this, req, res);
  } catch (error) {
    console.error('Bare server error:', error);
    HEALING_CONFIG.errorCount++; // Track errors
    
    // If headers not sent yet, send friendly error response
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: true,
        message: 'Proxy server error',
        code: error.code || 'UNKNOWN_ERROR',
        url: req.url,
        autoHealing: true
      }));
    }
  }
};

// Apply compression middleware to reduce bandwidth usage and improve speed
app.use(compression());

// Add headers to help with UV proxy functionality
app.use((req, res, next) => {
  // For UV files, add permissive headers
  if (req.url.startsWith('/uv/') || req.url.startsWith('/bare/')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    // Add longer cache times for static UV files to improve performance
    if (req.url.endsWith('.js') || req.url.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
    }
    
    // Set permissive CSP for UV content
    if (req.url.includes('/service/')) {
      res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
      res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
      res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }
  next();
});

// Auto-fixing route that silently ensures service worker is registered properly
app.get('/uv/ensure-sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    // Auto-fix service worker registration
    (async function() {
      if (!('serviceWorker' in navigator)) return;
      
      try {
        // Check if service worker is registered
        const registrations = await navigator.serviceWorker.getRegistrations();
        const uvWorker = registrations.find(r => 
          r.scope.includes('/uv/') || 
          (r.active && r.active.scriptURL.includes('sw.js'))
        );
        
        if (!uvWorker) {
          console.log('Auto-fixing service worker...');
          // Register service worker with correct scope
          const registration = await navigator.serviceWorker.register('/uv/sw.js', {
            scope: '/uv/',
            updateViaCache: 'none'
          });
          console.log('Service worker registered automatically');
        } else {
          // Force update if it's been more than a day
          const now = Date.now();
          const lastUpdate = parseInt(localStorage.getItem('uv-sw-last-update') || '0');
          if (now - lastUpdate > 86400000) { // 1 day
            console.log('Updating service worker...');
            await uvWorker.update();
            localStorage.setItem('uv-sw-last-update', now.toString());
          }
        }
      } catch (err) {
        console.error('Auto-fix failed:', err);
      }
    })();
  `);
});

// Add auto-healing script to all HTML pages
app.use((req, res, next) => {
  // Skip for non-HTML routes
  if (req.path.endsWith('.js') || req.path.endsWith('.css') || 
      req.path.endsWith('.png') || req.path.endsWith('.jpg') ||
      req.path.endsWith('.svg') || req.path.endsWith('.ico')) {
    return next();
  }
  
  // For HTML routes, add the auto-fixing script
  const originalSend = res.send;
  res.send = function(body) {
    // Only process HTML content
    if (typeof body === 'string' && body.includes('<!DOCTYPE html>')) {
      // Add auto-fixing script to head
      body = body.replace('<head', `<head>
        <script src="/uv/ensure-sw.js"></script>`);
    }
    return originalSend.call(this, body);
  };
  
  next();
});

// Static files and routes
app.use(express.static("img")); // IMGS GET PRIORITY

app.get("/ga", function (req, res) {
  res.sendFile(path.join(__dirname, "static/games.html"));
});

app.get("/rga", function(req, res) {
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

// Auto-fix route that silently fixes service worker issues
app.get('/auto-fix', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="refresh" content="3;url=/">
      <title>Auto-Fixing System</title>
      <style>
        body { font-family: sans-serif; background: #222; color: white; padding: 20px; text-align: center; }
        .container { max-width: 600px; margin: 40px auto; background: #333; border-radius: 8px; padding: 20px; }
        .progress { width: 100%; height: 10px; background: #555; margin: 20px 0; border-radius: 5px; overflow: hidden; }
        .progress-bar { height: 100%; width: 0%; background: linear-gradient(90deg, #4a6ed3, #5a7ee5); 
                        animation: progress 3s forwards; border-radius: 5px; }
        @keyframes progress { to { width: 100%; } }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Automatic System Repair</h2>
        <p>Your system is being automatically repaired. You'll be redirected in a few seconds.</p>
        <div class="progress"><div class="progress-bar"></div></div>
      </div>
      
      <script src="/uv/uv.bundle.js"></script>
      <script src="/uv/uv.config.js"></script>
      <script>
        // Comprehensive auto-fixing
        (async function() {
          try {
            // First, unregister any existing service workers
            if ('serviceWorker' in navigator) {
              const registrations = await navigator.serviceWorker.getRegistrations();
              for (const registration of registrations) {
                await registration.unregister();
                console.log('Unregistered service worker');
              }
              
              // Register the UV service worker with correct scope
              let scope = '/uv/';
              
              // Use UV config if available
              if (window.__uv$config) {
                scope = window.__uv$config.prefix;
              }
              
              // Register with proper scope
              const registration = await navigator.serviceWorker.register('/uv/sw.js', {
                scope: scope,
                updateViaCache: 'none'
              });
              
              console.log('Service worker registered with scope:', registration.scope);
              
              // Clear service worker cache
              const cacheNames = await caches.keys();
              for (const cacheName of cacheNames) {
                if (cacheName.includes('uv-') || cacheName.includes('uv_')) {
                  await caches.delete(cacheName);
                  console.log('Deleted cache:', cacheName);
                }
              }
              
              // Clear session storage
              sessionStorage.clear();
              
              // Reset reload counters
              localStorage.removeItem('auto-reload-count');
              localStorage.removeItem('game-reload-count');
              localStorage.removeItem('uv-reload-count');
              
              console.log('Automatic system repair complete');
            }
          } catch (err) {
            console.error('Auto-fix failed:', err);
          }
        })();
      </script>
    </body>
    </html>
  `);
});

// Serve static files
app.use(express.static(path.join(__dirname, "static")));

// 404 handler
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, "static/404.html"));
});

// Create HTTP server
const server = http.createServer();

// Route requests
server.on("request", (req, res) => {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

// Memory monitoring with auto-healing
setInterval(() => {
  try {
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    console.log(`Memory usage: ${memoryUsageMB}MB`);
    
    // Auto-restart if memory usage is too high
    if (HEALING_CONFIG.ENABLED && memoryUsageMB > HEALING_CONFIG.MEMORY_THRESHOLD) {
      console.log('Memory usage too high, triggering auto-restart...');
      process.exit(1); // PM2 will restart
    }
    
    // Scheduled auto-restart to prevent memory leaks and keep system fresh
    const now = Date.now();
    if (HEALING_CONFIG.ENABLED && 
        now - HEALING_CONFIG.lastRestartTime > HEALING_CONFIG.AUTO_RESTART_INTERVAL) {
      console.log('Scheduled auto-restart triggered');
      HEALING_CONFIG.lastRestartTime = now;
      
      // Exit after a small delay to allow current requests to complete
      setTimeout(() => {
        process.exit(0); // Clean exit for PM2
      }, 5000);
    }
  } catch (err) {
    console.error('Error in memory monitoring:', err);
  }
}, HEALING_CONFIG.MEMORY_CHECK_INTERVAL);

// Start the server
server.listen({ port: PORT }, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Bare server running at /bare/`);
  console.log(`Auto-healing system enabled: ${HEALING_CONFIG.ENABLED}`);
  console.log(`Auto-fix URL: /auto-fix`);
});

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  
  // Increment error counter
  HEALING_CONFIG.errorCount++;
  
  // If too many errors, restart
  if (HEALING_CONFIG.ENABLED && HEALING_CONFIG.errorCount >= HEALING_CONFIG.ERROR_THRESHOLD) {
    console.log('Too many errors, triggering auto-restart...');
    
    // Exit after a small delay to allow logging
    setTimeout(() => {
      process.exit(1); // Error exit for PM2
    }, 1000);
  }
});
