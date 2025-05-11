#!/usr/bin/env node

import { Server as SocketIOServer } from 'socket.io';
import express from 'express';
import http from 'node:http';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const PORT = 8081; // Different port from your main server

// Enable CORS for all origins (important for on-demand TLS)
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Create Socket.IO server instance with proper CORS configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling']
});

// Store connected clients
const connectedClients = new Map();

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id} from ${socket.handshake.address}`);
  connectedClients.set(socket.id, socket);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    connectedClients.delete(socket.id);
  });
  
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Function to broadcast popup message to all clients
function broadcastPopup(message) {
  console.log(`Broadcasting message to ${connectedClients.size} clients: "${message}"`);
  io.emit('popup_message', { 
    message: message,
    timestamp: new Date().toISOString()
  });
}

// API endpoint to send popups
app.post('/popup', (req, res) => {
  // Get client IP for logging
  const clientIp = req.ip || req.connection.remoteAddress;
  
  // Only allow from localhost (for security)
  if (clientIp !== '127.0.0.1' && clientIp !== '::1' && !clientIp.includes('127.0.0.1')) {
    console.warn(`Popup attempt denied from IP: ${clientIp}`);
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  broadcastPopup(message);
  res.json({ 
    success: true, 
    message: 'Popup sent',
    clientCount: connectedClients.size,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connectedClients: connectedClients.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Root endpoint - just shows service info
app.get('/', (req, res) => {
  res.json({
    service: 'popup-service',
    version: '1.0.0',
    connectedClients: connectedClients.size,
    status: 'running'
  });
});

// Handle 404s
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Popup service running on port ${PORT}`);
  console.log(`Connected clients: ${connectedClients.size}`);
  console.log(`Server time: ${new Date().toISOString()}`);
});
