import { createBareServer } from '@tomphttp/bare-server-node';
import express from 'express';
import http from 'node:http';
import path from "node:path";
import { fileURLToPath } from 'url';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize application
const app = express();
const PORT = process.env.PORT || 8080;

// Create a more robust bare server with configuration
const bare = createBareServer('/bare/', {
  // More permissive CORS policy for game resources
  cors: {
    origin: '*', // Allow requests from any origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  },
  // Increased timeout for slow connections
  timeout: 60000, // 60 seconds
  // Maintain connections
  keepAlive: true,
  // Improved logging
  logErrors: true
});

// Add request logging for diagnostics
app.use((req, res, next) => {
  const start = Date.now();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const logLine = `${new Date().toISOString()} ${ip} "${req.method} ${req.url}"`;
  
  // Log when the response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${logLine} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).sendFile(path.join(__dirname, "static/404.html")); // Using 404.html as fallback
});

// Set Cache-Control headers for static assets
const setCache = (res, maxAge) => {
  res.setHeader('Cache-Control', `max-age=${maxAge}, public`);
};

// Serve images with longer cache time (IMGS GET PRIORITY)
app.use('/img', (req, res, next) => {
  setCache(res, 86400); // 1 day in seconds
  next();
});
app.use(express.static("img"));

// Serve static files with standard cache
app.use(express.static(path.join(__dirname, "static"), {
  maxAge: '3600000', // 1 hour in milliseconds
  etag: true,
  lastModified: true
}));

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Game routes
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

app.get("/voidgpt", function (req, res) {
  res.sendFile(path.join(__dirname, "static/voidgpt.html"));
});

// Improved 404 handler - explicitly set status code
app.get('*', function(req, res) {
  res.status(404).sendFile(path.join(__dirname, "static/404.html"));
});

// Create HTTP server
const server = http.createServer();

// Add error handling to server
server.on('error', (err) => {
  console.error('Server error:', err);
  
  // Try to restart the server in case of critical errors
  if (err.code === 'EADDRINUSE') {
    console.log('Address in use, retrying...');
    setTimeout(() => {
      server.close();
      server.listen({
        port: PORT,
        host: '0.0.0.0'
      });
    }, 1000);
  }
});

// Route requests between bare server and express
server.on("request", (req, res) => {
  try {
    if (bare.shouldRoute(req)) {
      bare.routeRequest(req, res);
    } else {
      app(req, res);
    }
  } catch (error) {
    console.error("Request handling error:", error);
    
    // Try to send a basic error response
    try {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    } catch (e) {
      console.error("Failed to send error response:", e);
    }
  }
});

// Add error upgrade handling for WebSocket connections
server.on("upgrade", (req, socket, head) => {
  try {
    if (bare.shouldRoute(req)) {
      bare.routeUpgrade(req, socket, head);
    } else {
      socket.end();
    }
  } catch (error) {
    console.error("Upgrade handling error:", error);
    socket.end();
  }
});

// Start the server with better logging
server.listen({
  port: PORT,
  host: '0.0.0.0'  // Listen on all interfaces
}, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Bare server running at http://localhost:${PORT}/bare/`);
  console.log(`Process ID: ${process.pid}`);
});

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  // Keep the server running despite the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep the server running despite the rejection
});
