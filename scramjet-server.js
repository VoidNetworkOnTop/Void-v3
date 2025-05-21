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

// Set up static file serving
app.use(express.static(path.join(__dirname, 'static')));

// Serve Scramjet files
app.use('/scramjet', express.static(path.join(__dirname, 'static/scramjet')));

// Handle Scramjet proxy routes - this is the key addition
app.get('/scramjet/*', (req, res) => {
    const encodedUrl = req.params[0]; // Everything after /scramjet/
    
    if (!encodedUrl) {
        return res.status(400).send('No URL provided');
    }
    
    try {
        // Decode the URL
        let paddedUrl = encodedUrl.replace(/-/g, "+").replace(/_/g, "/");
        
        // Add proper padding
        while (paddedUrl.length % 4) {
            paddedUrl += '=';
        }
        
        const decoded = Buffer.from(paddedUrl, 'base64').toString('utf-8');
        const targetUrl = decodeURIComponent(decoded);
        
        console.log('Scramjet proxy request:', targetUrl);
        
        // For now, serve the handler HTML that will let the service worker handle it
        res.sendFile(path.join(__dirname, 'static/scramjet-handler.html'));
        
    } catch (error) {
        console.error('Error decoding Scramjet URL:', error);
        res.status(400).send('Invalid encoded URL');
    }
});

// Handle the main Scramjet route for navigation
app.get('/scramjet-handler.html', (req, res) => {
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
    console.log('Scramjet proxy available at /scramjet/');
});

export default server;
