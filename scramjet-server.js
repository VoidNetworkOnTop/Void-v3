import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { createBareServer } from '@tomphttp/bare-server-node';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer();
const PORT = process.env.SCRAMJET_PORT || 8082;

// Create bare server
const bare = createBareServer('/bare/');

// Set up routes
app.use(express.static(path.join(__dirname, 'static')));
app.use('/scramjet', express.static(path.join(__dirname, 'static/scramjet')));

// Handle the Scramjet route
app.get('/scramjet/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'static/scramjet-handler.html'));
});

// Handle WebSocket and HTTP requests
server.on('request', (req, res) => {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

server.on('upgrade', (req, socket, head) => {
  if (bare.shouldRoute(req)) {
    bare.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Scramjet server running at http://localhost:${PORT}`);
});
