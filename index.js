import { createBareServer } from '@tomphttp/bare-server-node';
import express from 'express';
import http from 'node:http';
import path from "node:path";
import fs from "node:fs";

const app = express();
const server = http.createServer();
const dirname = process.cwd();
const PORT = 8080;

// Global cache-busting middleware - ADD THIS FOR INSTANT UPDATES
app.use((req, res, next) => {
  const path = req.path.toLowerCase();
  
  // No caching for HTML, JS, and JSON files (content that changes frequently)
  if (
    path.endsWith('.html') || 
    path.endsWith('.js') || 
    path.endsWith('.json') ||
    path === '/' ||
    !path.includes('.')  // Routes without file extensions (likely dynamic content)
  ) {
    // Prevent caching for these types
    res.setHeader('Cache-Control', 'no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else {
    // Allow caching for other static assets (images, CSS, fonts, etc.)
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
  }
  
  next();
});

// Try to load local config if it exists
let bareServerOptions = {};
let serverSettings = {};
let enableUvCaching = false;

try {
  // Load local optimized settings if available (ES modules version)
  const localConfig = await import('./local-config.js');
  bareServerOptions = localConfig.bareServerOptions || {};
  serverSettings = localConfig.serverTimeouts || {};
  enableUvCaching = localConfig.enableUvCaching || false;
  console.log("Loaded optimized configuration from local-config.js");
} catch (e) {
  // No local config, use defaults
  console.log("Using default configuration (local-config.js not found): ", e.message);
}

// Create bare server with optimized settings if available
const bare = createBareServer("/bare/", bareServerOptions);

// Apply server timeouts if configured
if (serverSettings.keepAliveTimeout) {
  server.keepAliveTimeout = serverSettings.keepAliveTimeout;
}
if (serverSettings.headersTimeout) {
  server.headersTimeout = serverSettings.headersTimeout;
}

// Set up UV file caching if enabled
if (enableUvCaching) {
  const uvCache = new Map();
  app.use((req, res, next) => {
    // Only process UV files
    if (req.path.startsWith('/uv/') && req.method === 'GET') {
      const filePath = path.join(dirname, "static", req.path);
      
      // Check if we have it cached
      if (uvCache.has(filePath)) {
        const { content, contentType } = uvCache.get(filePath);
        res.setHeader('Content-Type', contentType);
        return res.send(content);
      }
      
      // Not cached, try to read file
      try {
        const content = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        let contentType = 'application/javascript';
        
        if (ext === '.css') contentType = 'text/css';
        if (ext === '.html') contentType = 'text/html';
        if (ext === '.json') contentType = 'application/json';
        
        // Cache it
        uvCache.set(filePath, { content, contentType });
        
        // Send response
        res.setHeader('Content-Type', contentType);
        return res.send(content);
      } catch (error) {
        // If file not found, continue to next middleware
        return next();
      }
    }
    next();
  });
}

// Images get priority 
app.use(express.static("img")) // IMGS GET PRIORITY BI

// Set up routes with optimized cache headers
app.get("/ga", function (req, res) {
  res.sendFile(path.join(dirname, "static/games.html"));
});

app.get("/rga", function(req, res) {
  res.sendFile(path.join(dirname, "static/rga.html"));
});

app.get("/learn", function (req, res) {
  res.sendFile(path.join(dirname, "static/proxy.html"));
});

app.get("/app", function (req, res) {
  res.sendFile(path.join(dirname, "static/apps.html"));
});

app.get("/credits", function (req, res) {
  res.sendFile(path.join(dirname, "static/credits.html"));
});

app.get("/voidurls", function (req, res) {
  res.sendFile(path.join(dirname, "static/voidurls.html"));
});

app.get("/settings", function (req, res) {
  res.sendFile(path.join(dirname, "static/settings.html"));
});

app.get("/chat", function (req, res) {
  res.sendFile(path.join(dirname, "static/chat.html"));
});

app.get("/voidgpt", function (req, res) {
  res.sendFile(path.join(dirname, "static/voidgpt.html"));
});

// Static files
app.use(express.static(path.join(dirname, "static")));

// 404 handler
app.get('*', function(req, res) {
  res.sendFile(path.join(dirname, "static/404.html"));
});

// Handle WebSocket upgrade requests
server.on('upgrade', (req, socket, head) => {
  if (bare.shouldRoute(req)) {
    bare.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

// The main request handler
server.on("request", (req, res) => {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

// Start server
server.listen({port: PORT, host: '0.0.0.0'}, () => {
  console.log("Listening on port " + PORT + " (IPv4 and IPv6)");
});
