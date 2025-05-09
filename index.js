import { createBareServer } from '@tomphttp/bare-server-node';
import express from 'express';
import http from 'node:http';
import https from 'node:https';
import path from "node:path";
import fs from "node:fs";

const app = express();
const server = http.createServer();
const dirname = process.cwd();
const PORT = 8080;

// Disable unnecessary Express features for better performance
app.disable('x-powered-by');

// Optimize HTTP agent settings for better performance
const httpAgent = new http.Agent({
  keepAlive: true,            // Enable keep-alive connections
  keepAliveMsecs: 1000,       // Keep-alive for 1 second
  maxSockets: 256,            // Increase max sockets per host
  maxFreeSockets: 256,        // Keep more idle sockets available
  timeout: 60000              // 60 second timeout
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 256, 
  maxFreeSockets: 256,
  timeout: 60000
});

// Create optimized bare server with improved settings
const bare = createBareServer("/bare/", {
  // Custom fetch options for all bare requests
  httpAgent,
  httpsAgent,
  credentials: 'omit',       // Don't send credentials by default
  cache: 'force-cache',      // Try to use cache when possible
  redirect: 'follow',        // Auto-follow redirects
  // Optimized settings
  logErrors: false,          // Disable error logging for better performance
  filterRemote: false,       // Disable remote filtering for faster operation
  // Connection limits and timeouts
  maxRedirects: 10,          // Limit redirect chains
  maxTimeout: 30000,         // 30 second max timeout
  requestTimeout: 25000      // 25 second request timeout
});

// Fast UV file serving
const uvCache = new Map();
app.use((req, res, next) => {
  // Only process UV files
  if (req.path.startsWith('/uv/') && req.method === 'GET') {
    const filePath = path.join(dirname, "static", req.path);
    
    // Check if we have it cached
    if (uvCache.has(filePath)) {
      const { content, contentType } = uvCache.get(filePath);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
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
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(content);
    } catch (error) {
      // If file not found, continue to next middleware
      return next();
    }
  }
  next();
});

// Images get priority
app.use(express.static("img", { 
  maxAge: '1d' // 1 day cache
}));

// All existing routes with added cache headers
app.get("/ga", function (req, res) {
  res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
  res.sendFile(path.join(dirname, "static/games.html"));
});

app.get("/rga", function(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(dirname, "static/rga.html"));
});

app.get("/learn", function (req, res) {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(dirname, "static/proxy.html"));
});

app.get("/app", function (req, res) {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(dirname, "static/apps.html"));
});

app.get("/credits", function (req, res) {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(dirname, "static/credits.html"));
});

app.get("/voidurls", function (req, res) {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(dirname, "static/voidurls.html"));
});

app.get("/settings", function (req, res) {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(dirname, "static/settings.html"));
});

app.get("/chat", function (req, res) {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(dirname, "static/chat.html"));
});

app.get("/voidgpt", function (req, res) {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(dirname, "static/voidgpt.html"));
});

// Static files with caching
app.use(express.static(path.join(dirname, "static"), {
  maxAge: '1h' // 1 hour cache
}));

// 404 handler - unchanged
app.get('*', function(req, res) {
  res.sendFile(path.join(dirname, "static/404.html"));
});

// Handle WebSocket upgrade requests correctly
server.on('upgrade', (req, socket, head) => {
  if (bare.shouldRoute(req)) {
    bare.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

// The main request handler - mostly unchanged
server.on("request", (req, res) => {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

// Better server timeouts
server.keepAliveTimeout = 30000; // 30 seconds
server.headersTimeout = 35000; // 35 seconds

// Start server - unchanged
server.listen({port: PORT, host: '0.0.0.0'}, () => {
  console.log("Optimized server listening on port " + PORT + " (IPv4 and IPv6)");
});
