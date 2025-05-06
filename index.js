import { createBareServer } from '@tomphttp/bare-server-node';
import express from 'express';
import http from 'node:http';
import path from "node:path";
const app = express();
const bare = createBareServer("/bare/", {
  logErrors: true,
  // Increased timeout for slow connections
  timeout: 60000, // 60 seconds
  // Maintain connections
  keepAlive: true,
});
const server = http.createServer();
const __dirname = process.cwd();
const PORT = process.env.PORT || 8080;

// IMGS GET PRIORITY
app.use(express.static("img"))

// Game routes
app.get("/ga", function (req, res) {
  res.sendFile(path.join(__dirname, "static/games.html"));
})

app.get("/rga", function(req, res) {
  res.sendFile(path.join(__dirname, "static/rga.html"))
})

app.get("/learn", function (req, res) {
  res.sendFile(path.join(__dirname, "static/proxy.html"));
})

app.get("/app", function (req, res) {
  res.sendFile(path.join(__dirname, "static/apps.html"));
})

app.get("/credits", function (req, res) {
  res.sendFile(path.join(__dirname, "static/credits.html"));
})

app.get("/voidurls", function (req, res) {
  res.sendFile(path.join(__dirname, "static/voidurls.html"));
})

app.get("/settings", function (req, res) {
  res.sendFile(path.join(__dirname, "static/settings.html"));
})

app.get("/chat", function (req, res) {
  res.sendFile(path.join(__dirname, "static/chat.html"));
})

app.get("/voidgpt", function (req, res) {
  res.sendFile(path.join(__dirname, "static/voidgpt.html"));
})

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Static files
app.use(express.static(path.join(__dirname, "static")));

// 404 handler
app.get('*', function(req, res) {
  res.status(404).sendFile(path.join(__dirname, "static/404.html"))
})

// Route requests between bare server and express with error handling
server.on("request", (req, res) => {
  try {
    if (bare.shouldRoute(req)) {
      bare.routeRequest(req, res);
    } else {
      app(req, res);
    }
  } catch (error) {
    console.error("Server error:", error);
    try {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    } catch (e) {}
  }
});

// Handle WebSocket connections
server.on("upgrade", (req, socket, head) => {
  try {
    if (bare.shouldRoute(req)) {
      bare.routeUpgrade(req, socket, head);
    } else {
      socket.end();
    }
  } catch (error) {
    console.error("WebSocket error:", error);
    socket.end();
  }
});

// Start server
server.listen({port: PORT}, () => {
  console.log("listening on port " + PORT);
});

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.close(() => {
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
