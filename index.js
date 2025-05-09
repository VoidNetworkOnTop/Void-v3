import { createBareServer } from '@tomphttp/bare-server-node';
import express from 'express';
import http from 'node:http';
import path from "node:path";
import fs from "node:fs";

const app = express();
const server = http.createServer();
const dirname = process.cwd();
const PORT = 8080;

// Generate a cache buster value each time the server starts
// This ensures all clients get fresh content after a server restart
const CACHE_BUSTER = Date.now();
console.log(`Server started with cache buster: ${CACHE_BUSTER}`);

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
  console.log("Using default configuration (local-config.js not found)");
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

// ==== GLOBAL CACHE-BUSTING MIDDLEWARE ====
// This middleware sets aggressive no-cache headers for all responses
app.use((req, res, next) => {
  // Skip cache-busting for bare server requests and certain static assets
  if (
    req.path.startsWith('/bare/') ||
    req.path.includes('.woff') ||
    req.path.includes('.woff2') ||
    req.path.includes('.ttf') ||
    req.path.includes('.eot')
  ) {
    return next();
  }
  
  // Set aggressive no-cache headers for everything else
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Generate a unique ETag for each request to prevent 304 responses
  res.setHeader('ETag', `W/"${CACHE_BUSTER}-${Math.random().toString(36).substring(2)}"`);
  
  // Set Last-Modified to current time to prevent If-Modified-Since caching
  res.setHeader('Last-Modified', new Date().toUTCString());
  
  next();
});

// ==== HTML CONTENT TRANSFORMER ====
// This middleware modifies HTML responses to add cache-busting parameters to all resources
app.use((req, res, next) => {
  // Skip for non-HTML requests and bare server requests
  if (
    req.path.startsWith('/bare/') ||
    req.path.endsWith('.js') ||
    req.path.endsWith('.css') ||
    req.path.endsWith('.png') ||
    req.path.endsWith('.jpg') ||
    req.path.endsWith('.jpeg') ||
    req.path.endsWith('.gif') ||
    req.path.endsWith('.svg') ||
    req.path.endsWith('.ico') ||
    req.path.endsWith('.woff') ||
    req.path.endsWith('.woff2') ||
    req.path.endsWith('.ttf')
  ) {
    return next();
  }
  
  // Override the res.sendFile method to intercept HTML files
  const originalSendFile = res.sendFile;
  res.sendFile = function(filePath, options, callback) {
    // Only process HTML files
    if (!filePath.endsWith('.html') && !filePath.endsWith('/404.html')) {
      return originalSendFile.call(this, filePath, options, callback);
    }
    
    // Read the file manually so we can modify its content
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        return next(err);
      }
      
      try {
        // Add cache-busting parameter to all resource URLs in the HTML
        const modifiedContent = content
          // Add to script src attributes
          .replace(/(<script[^>]+src=["'])([^"']+)(["'])/gi, (match, prefix, url, suffix) => {
            const separator = url.includes('?') ? '&' : '?';
            return `${prefix}${url}${separator}v=${CACHE_BUSTER}${suffix}`;
          })
          // Add to link href attributes (CSS)
          .replace(/(<link[^>]+href=["'])([^"']+)(["'])/gi, (match, prefix, url, suffix) => {
            // Only add to CSS files, not to icons or other link types
            if (url.endsWith('.css') || match.includes('stylesheet')) {
              const separator = url.includes('?') ? '&' : '?';
              return `${prefix}${url}${separator}v=${CACHE_BUSTER}${suffix}`;
            }
            return match;
          })
          // Add to img src attributes
          .replace(/(<img[^>]+src=["'])([^"']+)(["'])/gi, (match, prefix, url, suffix) => {
            const separator = url.includes('?') ? '&' : '?';
            return `${prefix}${url}${separator}v=${CACHE_BUSTER}${suffix}`;
          })
          // Add no-cache meta tags to head
          .replace(/<head>/i, '<head>\n<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\n<meta http-equiv="Pragma" content="no-cache">\n<meta http-equiv="Expires" content="0">');
        
        // Send the modified content
        res.setHeader('Content-Type', 'text/html');
        res.send(modifiedContent);
      } catch (error) {
        console.error('Error modifying HTML content:', error);
        // Fallback to sending the original file
        originalSendFile.call(res, filePath, options, callback);
      }
    });
  };
  
  next();
});

// ==== UV FILE HANDLER ====
// Optimized handler for UV files with caching disabled
app.use((req, res, next) => {
  // Only process UV files
  if (!req.path.startsWith('/uv/') || req.method !== 'GET') {
    return next();
  }
  
  const filePath = path.join(dirname, "static", req.path);
  
  try {
    // Read file directly
    const content = fs.readFileSync(filePath);
    const ext = path.extname(req.path).toLowerCase();
    
    // Set appropriate content type
    let contentType = 'application/javascript';
    if (ext === '.css') contentType = 'text/css';
    if (ext === '.html') contentType = 'text/html';
    if (ext === '.json') contentType = 'application/json';
    
    // Set headers and send response
    res.setHeader('Content-Type', contentType);
    // Add cache buster to content itself (for JavaScript files)
    if (ext === '.js') {
      let jsContent = content.toString('utf8');
      // Add a unique cache-busting comment at the top of the file
      jsContent = `/* Cache buster: ${CACHE_BUSTER} */\n${jsContent}`;
      res.send(jsContent);
    } else {
      res.send(content);
    }
    
  } catch (error) {
    // File not found, continue to next middleware
    return next();
  }
});

// ==== STATIC FILE MIDDLEWARE ====
// Configure static middleware with cache busting

// Images get priority 
app.use(express.static("img", {
  etag: false,          // Disable ETag generation
  lastModified: false,  // Disable Last-Modified header
  setHeaders: (res, path) => {
    // Set no-cache headers for all image files
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// ==== HTML ROUTES WITH CACHE BUSTING ====
// All routes that serve HTML files

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

// Main index page route - special handling for the homepage
app.get("/", function(req, res) {
  res.sendFile(path.join(dirname, "static/index.html"));
});

// ==== STATIC FILES WITH CACHE BUSTING ====
// Serve all static files with cache busting
app.use(express.static(path.join(dirname, "static"), {
  etag: false,          // Disable ETag generation
  lastModified: false,  // Disable Last-Modified header
  setHeaders: (res, path) => {
    // Don't set no-cache headers for fonts
    if (path.endsWith('.woff') || path.endsWith('.woff2') || path.endsWith('.ttf') || path.endsWith('.eot')) {
      return;
    }
    
    // Set no-cache headers for all other static files
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// ==== 404 HANDLER ====
app.get('*', function(req, res) {
  res.status(404);
  res.sendFile(path.join(dirname, "static/404.html"));
});

// ==== SERVER SETUP ====
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
  console.log(`Server listening on port ${PORT} (IPv4 and IPv6) - Cache Buster: ${CACHE_BUSTER}`);
});
