import { createBareServer } from '@tomphttp/bare-server-node';
import express from 'express';
import http from 'node:http';
import path from "node:path";
import fs from "node:fs";
import crypto from 'node:crypto';
import { setupWispServer } from './wisp-server.js';

const app = express();
const server = http.createServer();
const dirname = process.cwd();
const PORT = 8080;

// Generate a cache buster value each time the server starts
const CACHE_BUSTER = Date.now();
console.log(`Server started with cache buster: ${CACHE_BUSTER}`);

// Hash storage for all files
const fileHashes = {};

// Throttle control for file watching to prevent excessive CPU usage
const fileProcessQueue = new Set();
let processingQueue = false;

// Calculate hash for a single file
function calculateFileHash(filePath, relativePath) {
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const fileContent = fs.readFileSync(filePath);
      const hash = crypto.createHash('md5').update(fileContent).digest('hex');
      fileHashes[relativePath] = hash;
      return hash;
    }
  } catch (error) {
    console.error(`Error hashing file ${filePath}:`, error.message);
  }
  return null;
}

// Calculate hashes for all files in a directory
function calculateDirectoryHashes(directory, baseDirectory = null) {
  baseDirectory = baseDirectory || directory;
  
  try {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules to avoid excessive processing
        if (entry.name === 'node_modules') continue;
        
        // Recursively process subdirectories
        calculateDirectoryHashes(fullPath, baseDirectory);
      } else if (entry.isFile()) {
        // Calculate relative path for use as key
        const relativePath = '/' + path.relative(baseDirectory, fullPath).replace(/\\/g, '/');
        calculateFileHash(fullPath, relativePath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${directory}:`, error.message);
  }
}

// Process the file change queue to limit CPU usage
function processFileQueue() {
  if (processingQueue || fileProcessQueue.size === 0) return;
  
  processingQueue = true;
  const filesToProcess = [...fileProcessQueue];
  fileProcessQueue.clear();
  
  console.log(`Processing ${filesToProcess.length} changed files...`);
  
  for (const file of filesToProcess) {
    calculateFileHash(file.fullPath, file.relativePath);
  }
  
  processingQueue = false;
  
  // Process any new files that were added while we were processing
  if (fileProcessQueue.size > 0) {
    setTimeout(processFileQueue, 50);
  }
}

// Calculate initial hashes for all static files
console.log("Calculating initial file hashes...");
calculateDirectoryHashes(path.join(dirname, "static"));
console.log(`Calculated hashes for ${Object.keys(fileHashes).length} files`);

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

// Setup Wisp server for Scramjet
const wispHandler = setupWispServer(server);

// Apply server timeouts if configured
if (serverSettings.keepAliveTimeout) {
  server.keepAliveTimeout = serverSettings.keepAliveTimeout;
}
if (serverSettings.headersTimeout) {
  server.headersTimeout = serverSettings.headersTimeout;
}

// Function to get the hash for a file path, normalizing the path format
function getFileHash(filePath) {
  // Normalize path format (using forward slashes)
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // If path doesn't start with /, add it
  const hashedPath = normalizedPath.startsWith('/') ? normalizedPath : '/' + normalizedPath;
  
  return fileHashes[hashedPath] || CACHE_BUSTER;
}

// ==== GLOBAL CACHE-BUSTING MIDDLEWARE ====
// This middleware sets appropriate cache headers for all responses
app.use((req, res, next) => {
  // IMPORTANT: Skip cache-busting for service and bare paths
  if (
    req.path.startsWith('/bare/') ||
    req.path.startsWith('/wisp/') ||
    req.path.includes('/service/') ||
    req.path.includes('.woff') ||
    req.path.includes('.woff2') ||
    req.path.includes('.ttf') ||
    req.path.includes('.eot')
  ) {
    return next();
  }
  
  // For all other files, set no-cache headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Get file hash based on request path for accurate ETag
  const fileHash = getFileHash(req.path);
  
  // Set ETag based on file content hash
  res.setHeader('ETag', `"${fileHash}"`);
  
  // Check if browser sent If-None-Match header for conditional request
  const ifNoneMatch = req.headers['if-none-match'];
  if (ifNoneMatch === `"${fileHash}"`) {
    // File hasn't changed, send 304 Not Modified
    return res.status(304).end();
  }
  
  next();
});

// ==== HTML CONTENT TRANSFORMER ====
// This middleware modifies HTML responses to add cache-busting parameters to all resources
app.use((req, res, next) => {
  // Skip for non-HTML requests, bare server requests, and service paths
  if (
    req.path.startsWith('/bare/') ||
    req.path.startsWith('/wisp/') ||
    req.path.includes('/service/') ||
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
        // BUT SKIP any service paths to prevent 404 errors
        const modifiedContent = content
          // Add to script src attributes (skipping service paths)
          .replace(/(<script[^>]+src=["'])([^"']+)(["'])/gi, (match, prefix, url, suffix) => {
            // Skip service and bare paths
            if (url.includes('/service/') || url.includes('/bare/') || url.includes('/wisp/')) {
              return match;
            }
            
            // For local paths, use their file hash for perfect cache busting
            if (url.startsWith('/') && !url.startsWith('//')) {
              // Extract the url path without query string
              const urlPath = url.split('?')[0];
              const hash = getFileHash(urlPath);
              const separator = url.includes('?') ? '&' : '?';
              return `${prefix}${url}${separator}v=${hash}${suffix}`;
            }
            
            // For external resources, leave unchanged
            return match;
          })
          // Add to link href attributes (CSS)
          .replace(/(<link[^>]+href=["'])([^"']+)(["'])/gi, (match, prefix, url, suffix) => {
            // Skip service and bare paths
            if (url.includes('/service/') || url.includes('/bare/') || url.includes('/wisp/')) {
              return match;
            }
            
            // For local paths, use their file hash
            if (url.startsWith('/') && !url.startsWith('//')) {
              // Only add to CSS files, not to icons or other link types
              if (url.endsWith('.css') || match.includes('stylesheet')) {
                const urlPath = url.split('?')[0];
                const hash = getFileHash(urlPath);
                const separator = url.includes('?') ? '&' : '?';
                return `${prefix}${url}${separator}v=${hash}${suffix}`;
              }
            }
            return match;
          })
          // Add to img src attributes (skipping service paths)
          .replace(/(<img[^>]+src=["'])([^"']+)(["'])/gi, (match, prefix, url, suffix) => {
            // Skip service and bare paths
            if (url.includes('/service/') || url.includes('/bare/') || url.includes('/wisp/')) {
              return match;
            }
            
            // For local paths, use their file hash
            if (url.startsWith('/') && !url.startsWith('//')) {
              const urlPath = url.split('?')[0];
              const hash = getFileHash(urlPath);
              const separator = url.includes('?') ? '&' : '?';
              return `${prefix}${url}${separator}v=${hash}${suffix}`;
            }
            return match;
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

// ==== OPTIMIZED FILE HANDLER ====
// Custom handler for static files with content-based ETags
app.use((req, res, next) => {
  // Skip for service and bare paths
  if (
    req.path.startsWith('/bare/') ||
    req.path.startsWith('/wisp/') ||
    req.path.includes('/service/')
  ) {
    return next();
  }
  
  // Only handle GET requests for static files
  if (req.method !== 'GET' || req.path === '/') {
    return next();
  }
  
  const filePath = path.join(dirname, "static", req.path);
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return next();
    }
    
    // Read file directly
    const fileContents = fs.readFileSync(filePath);
    
    // Calculate hash if not already done
    if (!fileHashes[req.path]) {
      const hash = crypto.createHash('md5').update(fileContents).digest('hex');
      fileHashes[req.path] = hash;
    }
    
    // Get content type based on extension
    const ext = path.extname(req.path).toLowerCase();
    let contentType = 'application/octet-stream';
    
    // Set content type based on file extension
    switch(ext) {
      case '.html': contentType = 'text/html'; break;
      case '.js': contentType = 'application/javascript'; break;
      case '.css': contentType = 'text/css'; break;
      case '.json': contentType = 'application/json'; break;
      case '.png': contentType = 'image/png'; break;
      case '.jpg': 
      case '.jpeg': contentType = 'image/jpeg'; break;
      case '.gif': contentType = 'image/gif'; break;
      case '.svg': contentType = 'image/svg+xml'; break;
      case '.ico': contentType = 'image/x-icon'; break;
      case '.woff': contentType = 'font/woff'; break;
      case '.woff2': contentType = 'font/woff2'; break;
      case '.ttf': contentType = 'font/ttf'; break;
    }
    
    // Set headers
    res.setHeader('Content-Type', contentType);
    
    // For fonts, allow caching
    if (['.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    } else {
      // For other files, set no-cache
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    
    // Set ETag based on file content hash
    const etag = `"${fileHashes[req.path]}"`;
    res.setHeader('ETag', etag);
    
    // Check if browser sent If-None-Match header for conditional request
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch === etag) {
      // File hasn't changed, send 304 Not Modified
      return res.status(304).end();
    }
    
    // Send the file content
    return res.send(fileContents);
  } catch (error) {
    // File not found or error reading file, continue to next middleware
    return next();
  }
});

// ==== BARE SERVER ROUTING - HIGHEST PRIORITY ====
// Handle bare server requests directly
app.use((req, res, next) => {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else {
    next();
  }
});

// ==== SCRAMJET CONFIG ROUTE ====
// Serve the scramjet configuration
app.get("/scramjet/config.js", function(req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    // Scramjet configuration
    window.__scramjet$config = {
      prefix: '/service/',
      wispServer: window.location.protocol === 'https:' ? 'wss://' + window.location.host + '/wisp' : 'ws://' + window.location.host + '/wisp',
      codec: 'plain',
      bare: {
        version: 'v3',
        path: '/bare/'
      }
    };
  `);
});

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

app.get("/voidvc", function (req, res) {
  res.sendFile(path.join(dirname, "static/void-vc.html"));
});

// Main index page route - special handling for the homepage
app.get("/", function(req, res) {
  res.sendFile(path.join(dirname, "static/index.html"));
});

// ==== STATIC FILES FALLBACK ====
// Only used if our optimized handler doesn't catch something
app.use(express.static(path.join(dirname, "static"), {
  etag: false,         // We handle ETags ourselves
  lastModified: false  // We don't use Last-Modified
}));

// ==== 404 HANDLER ====
app.get('*', function(req, res, next) {
  // Skip the 404 page for service paths to prevent breaking proxied sites
  if (req.path.includes('/service/') || req.path.startsWith('/uv/service/')) {
    return next();
  }
  
  res.status(404);
  res.sendFile(path.join(dirname, "static/404.html"));
});

// ==== SERVER SETUP ====
// Handle WebSocket upgrade requests
server.on('upgrade', (req, socket, head) => {
  if (bare.shouldRoute(req)) {
    bare.routeUpgrade(req, socket, head);
  } else if (req.url.startsWith('/wisp') || req.headers['sec-websocket-protocol'] === 'wisp') {
    // Let the wisp handler handle this
    // The handler was set up in setupWispServer
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

// Set up file watcher for the entire static directory
// This will detect any file changes and update hashes automatically
try {
  const staticDir = path.join(dirname, "static");
  console.log(`Setting up file watcher for ${staticDir}...`);
  
  fs.watch(staticDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    
    // Construct full and relative paths
    const fullPath = path.join(staticDir, filename);
    const relativePath = '/' + filename.replace(/\\/g, '/');
    
    // Skip certain files/directories to prevent excessive processing
    if (
      filename.includes('node_modules') || 
      filename.includes('.git') ||
      filename.startsWith('.') ||
      filename.endsWith('.tmp') ||
      filename.endsWith('.log')
    ) {
      return;
    }
    
    // Add to processing queue
    fileProcessQueue.add({ fullPath, relativePath });
    
    // Start processing queue if not already processing
    if (!processingQueue) {
      setTimeout(processFileQueue, 50);
    }
  });
  
  console.log("File watching enabled - changes will be detected automatically");
} catch (err) {
  console.error("Error setting up file watcher:", err.message);
  console.log("File watching NOT enabled - server restart required for changes");
}

// Start server
server.listen({port: PORT, host: '0.0.0.0'}, () => {
  console.log(`Server listening on port ${PORT} (IPv4 and IPv6) - Instant file updates enabled`);
  console.log(`Bare server available at /bare/ and Wisp server available at /wisp`);
});
