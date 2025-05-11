#!/usr/bin/env node

import { Server as SocketIOServer } from 'socket.io';
import express from 'express';
import http from 'node:http';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const PORT = 8081; // Different port from your main server

// Enable CORS
app.use(cors());
app.use(express.json());

// Create Socket.IO server instance
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store connected clients
const connectedClients = new Map();

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  connectedClients.set(socket.id, socket);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    connectedClients.delete(socket.id);
  });
});

// Function to broadcast popup message to all clients
function broadcastPopup(message) {
  console.log(`Broadcasting message to ${connectedClients.size} clients: ${message}`);
  io.emit('popup_message', { message: message });
}

// API endpoint to send popups
app.post('/popup', (req, res) => {
  // Only allow from localhost
  if (req.ip !== '127.0.0.1' && req.ip !== '::1' && !req.ip.includes('127.0.0.1')) {
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
    clientCount: connectedClients.size 
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connectedClients: connectedClients.size
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Popup service running on port ${PORT}`);
  console.log(`Connected clients: ${connectedClients.size}`);
});
