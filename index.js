import { createBareServer } from '@tomphttp/bare-server-node';
import express from 'express';
import http from 'node:http';
import path from "node:path";
import compression from 'compression';
import { promisify } from 'util';

const app = express();
const PORT = 8080;
const __dirname = process.cwd();

// Create Bare server with improved error handling
const bare = createBareServer("/bare/");

// Enhanced Bare server with better error handling
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
    
    // If headers not sent yet, send friendly error response
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: true,
        message: 'Proxy server error',
        code: error.code || 'UNKNOWN_ERROR',
        url: req.url
      }));
    }
  }
};

// Apply compression middleware to reduce bandwidth usage and improve speed
app.use(compression());

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

// Memory monitoring
const MEMORY_CHECK_INTERVAL = 60000; // 1 minute
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  console.log(`Memory usage: ${memoryUsageMB}MB`);
  
  // Auto-restart if memory usage is too high (adjust threshold as needed)
  if (memoryUsageMB > 800) {
    console.log('Memory usage too high, restarting...');
    process.exit(1); // PM2 will restart
  }
}, MEMORY_CHECK_INTERVAL);

// Start the server
server.listen({ port: PORT }, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Bare server running at /bare/`);
});

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
