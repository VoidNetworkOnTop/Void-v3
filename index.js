import { createBareServer } from '@tomphttp/bare-server-node';
import express from 'express';
import http from 'node:http';
import path from "node:path";
import fs from "node:fs";

const app = express();
const server = http.createServer();
const dirname = process.cwd();
const PORT = 8080;

// ==== ADD THIS - CREATE A SIMPLE TRANSPARENT PNG ====
// Generate a 1x1 transparent PNG to serve when images are not found
const transparentPng = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
  0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
  0x42, 0x60, 0x82
]);

// ==== IMAGE REQUEST HANDLER ====
// This middleware handles all image requests BEFORE anything else
app.use((req, res, next) => {
  // Only handle requests that look like images
  if (req.path.match(/\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/i)) {
    console.log(`Image requested: ${req.path}`);
    
    // Get proper content type based on extension
    const ext = path.extname(req.path).toLowerCase();
    let contentType = 'image/png'; // Default
    
    switch(ext) {
      case '.png': contentType = 'image/png'; break;
      case '.jpg': 
      case '.jpeg': contentType = 'image/jpeg'; break;
      case '.gif': contentType = 'image/gif'; break;
      case '.svg': contentType = 'image/svg+xml'; break;
      case '.ico': contentType = 'image/x-icon'; break;
      case '.webp': contentType = 'image/webp'; break;
      case '.avif': contentType = 'image/avif'; break;
    }
    
    // First try to serve from img/gameimg folder
    const gameImgPath = path.join(dirname, "static", "img", "gameimg", path.basename(req.path));
    if (fs.existsSync(gameImgPath) && fs.statSync(gameImgPath).isFile()) {
      console.log(`Found image at: ${gameImgPath}`);
      res.setHeader('Content-Type', contentType);
      return res.sendFile(gameImgPath);
    }
    
    // Then try the regular static path
    const regularPath = path.join(dirname, "static", req.path);
    if (fs.existsSync(regularPath) && fs.statSync(regularPath).isFile()) {
      console.log(`Found image at: ${regularPath}`);
      res.setHeader('Content-Type', contentType);
      return res.sendFile(regularPath);
    }
    
    // Image not found anywhere - return transparent image instead of 404 HTML
    console.log(`Image not found, serving transparent pixel: ${req.path}`);
    res.setHeader('Content-Type', 'image/png');
    return res.send(transparentPng);
  }
  
  // Not an image, continue to next handler
  next();
});

// Create bare server
const bare = createBareServer("/bare/");

// ==== ROUTES ====
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

// Main index page route
app.get("/", function(req, res) {
  res.sendFile(path.join(dirname, "static/index.html"));
});

// Serve static files
app.use(express.static(path.join(dirname, "static")));

// Handle 404s - but NOT for image requests which are handled above
app.get('*', function(req, res) {
  // Skip for service paths
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
  console.log(`Server listening on port ${PORT}`);
});
