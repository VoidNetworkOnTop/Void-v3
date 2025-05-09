import { createBareServer } from '@tomphttp/bare-server-node';
import express from 'express';
import http from 'node:http';
import path from "node:path";
import fs from "node:fs";

const app = express();
const server = http.createServer();
const dirname = process.cwd();
const PORT = 8080;

// Generate a unique version identifier based on timestamp
// This changes every time the server starts
const VERSION = Date.now().toString();
console.log(`Server starting with version: ${VERSION}`);

// AGGRESSIVE CACHE-BUSTING MIDDLEWARE
app.use((req, res, next) => {
  // Force no caching for ALL responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  // Ensure we never get 304 Not Modified responses
  res.setHeader('Last-Modified', new Date().toUTCString());
  
  // Continue to next middleware
  next();
});

// HTML CONTENT TRANSFORMER - ADD VERSION TO SCRIPTS AND CSS
app.use((req, res, next) => {
  // Only process HTML responses
  const originalSend = res.send;
  
  res.send = function(body) {
    // Only modify HTML responses
    if (typeof body === 'string' && res.get('Content-Type')?.includes('text/html')) {
      // Add version parameter to script and CSS links
      body = body.replace(/(src|href)="([^"]+\.(js|css))"/g, `$1="$2?v=${VERSION}"`);
      
      // Add meta tags to prevent caching
      const metaTags = `
        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
        <meta http-equiv="Pragma" content="no-cache">
        <meta http-equiv="Expires" content="0">
      `;
      
      // Insert meta tags into head
      body = body.replace('</head>', `${metaTags}</head>`);
    }
    
    // Call the original send function
    return originalSend.call(this, body);
  };
  
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
      
      // Extract base path without query parameters
      const basePath = req.path.split('?')[0];
      
      // Check if we have it cached
      if (uvCache.has(filePath)) {
        const { content, contentType } = uvCache.get(filePath);
        res.setHeader('Content-Type', contentType);
        return res.send(content);
      }
      
      // Not cached, try to read file
      try {
        const content = fs.readFileSync(filePath);
        const ext = path.extname(basePath).toLowerCase();
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

// Custom middleware to add version parameter to static file URLs
app.use((req, res, next) => {
  // For HTML files, use our custom send function
  // For JS and CSS files, let them pass through with the cache headers set earlier
  next();
});

// Images get priority 
app.use(express.static("img"));

// MODIFIED: Send files using a custom function to prevent caching
function sendFileWithVersion(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.status(404).send('Not found');
      return;
    }
    
    // Set headers
    res.setHeader('Content-Type', 'text/html');
    // Send the file content
    res.send(data);
  });
}

// Routes - using custom file sender
app.get("/ga", function (req, res) {
  sendFileWithVersion(res, path.join(dirname, "static/games.html"));
});

app.get("/rga", function(req, res) {
  sendFileWithVersion(res, path.join(dirname, "static/rga.html"));
});

app.get("/learn", function (req, res) {
  sendFileWithVersion(res, path.join(dirname, "static/proxy.html"));
});

app.get("/app", function (req, res) {
  sendFileWithVersion(res, path.join(dirname, "static/apps.html"));
});

app.get("/credits", function (req, res) {
  sendFileWithVersion(res, path.join(dirname, "static/credits.html"));
});

app.get("/voidurls", function (req, res) {
  sendFileWithVersion(res, path.join(dirname, "static/voidurls.html"));
});

app.get("/settings", function (req, res) {
  sendFileWithVersion(res, path.join(dirname, "static/settings.html"));
});

app.get("/chat", function (req, res) {
  sendFileWithVersion(res, path.join(dirname, "static/chat.html"));
});

app.get("/voidgpt", function (req, res) {
  sendFileWithVersion(res, path.join(dirname, "static/voidgpt.html"));
});

// VERSIONED STATIC FILES - Add version query parameter to all static files
app.use((req, res, next) => {
  const staticHandler = express.static(path.join(dirname, "static"), {
    // Explicitly set caching to none for static files
    etag: false,
    lastModified: false,
    maxAge: 0,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  });
  
  staticHandler(req, res, next);
});

// 404 handler
app.get('*', function(req, res) {
  sendFileWithVersion(res, path.join(dirname, "static/404.html"));
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
  console.log(`Server v${VERSION} listening on port ${PORT} (IPv4 and IPv6)`);
});
