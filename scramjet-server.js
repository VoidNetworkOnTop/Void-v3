import express from 'express';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { createBareServer } from '@tomphttp/bare-server-node';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer();
const PORT = process.env.SCRAMJET_PORT || 8082;

// Create bare server
const bare = createBareServer('/bare/');

// Enable trust proxy for proper IP handling
app.set('trust proxy', true);

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Set up static file serving
app.use(express.static(path.join(__dirname, 'static')));

// Serve Scramjet static files (JS, CSS, etc.)
app.use('/scramjet', express.static(path.join(__dirname, 'static/scramjet')));

// Custom proxy endpoint for the service worker
app.all('/proxy', async (req, res) => {
    const targetUrl = req.query.url || req.body.url;
    
    if (!targetUrl) {
        return res.status(400).send('Missing target URL');
    }
    
    console.log('Proxy request for:', targetUrl);
    
    try {
        // Validate URL
        const url = new URL(targetUrl);
        
        // Choose appropriate module based on protocol
        const httpModule = url.protocol === 'https:' ? https : http;
        
        // Set up request options
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method: req.method,
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': req.headers['accept'] || 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
                'Accept-Encoding': 'identity', // Don't request compressed content
                'Connection': 'close',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            timeout: 30000,
            rejectUnauthorized: false // Allow self-signed certificates
        };
        
        // Remove hop-by-hop headers and problematic headers
        const skipHeaders = [
            'host', 'connection', 'upgrade', 'proxy-authenticate', 
            'proxy-authorization', 'te', 'trailers', 'transfer-encoding',
            'content-encoding', 'content-length', 'origin', 'referer'
        ];
        
        // Copy safe headers from original request
        for (const [key, value] of Object.entries(req.headers)) {
            if (!skipHeaders.includes(key.toLowerCase()) && !key.startsWith('x-proxy-')) {
                options.headers[key] = value;
            }
        }
        
        // Set proper host header
        options.headers.Host = url.host;
        
        console.log('Making request to:', `${url.protocol}//${url.host}${url.pathname}${url.search}`);
        
        const proxyReq = httpModule.request(options, (proxyRes) => {
            console.log('Response status:', proxyRes.statusCode);
            console.log('Response headers:', proxyRes.headers);
            
            // Set response status
            res.status(proxyRes.statusCode);
            
            // Copy response headers (skip problematic ones)
            const skipResponseHeaders = [
                'transfer-encoding', 'content-encoding', 'content-security-policy',
                'content-security-policy-report-only', 'x-frame-options',
                'x-content-type-options', 'strict-transport-security',
                'referrer-policy', 'permissions-policy', 'cross-origin-embedder-policy',
                'cross-origin-opener-policy', 'cross-origin-resource-policy'
            ];
            
            for (const [key, value] of Object.entries(proxyRes.headers)) {
                if (!skipResponseHeaders.includes(key.toLowerCase())) {
                    res.set(key, value);
                }
            }
            
            // Add CORS headers
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Access-Control-Allow-Methods', '*');
            res.set('Access-Control-Allow-Headers', '*');
            res.set('X-Frame-Options', 'ALLOWALL');
            
            // Pipe the response
            proxyRes.pipe(res);
        });
        
        // Handle request errors
        proxyReq.on('error', (error) => {
            console.error('Proxy request error:', error);
            if (!res.headersSent) {
                res.status(502).json({
                    error: 'Proxy request failed',
                    message: error.message,
                    target: targetUrl
                });
            }
        });
        
        // Handle timeout
        proxyReq.on('timeout', () => {
            console.error('Proxy request timeout for:', targetUrl);
            proxyReq.destroy();
            if (!res.headersSent) {
                res.status(504).json({
                    error: 'Request timeout',
                    message: 'The target server took too long to respond',
                    target: targetUrl
                });
            }
        });
        
        // If there's a request body, write it
        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
            if (typeof req.body === 'string') {
                proxyReq.write(req.body);
            } else {
                proxyReq.write(JSON.stringify(req.body));
            }
        }
        
        // End the request
        proxyReq.end();
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(400).json({
            error: 'Invalid request',
            message: error.message,
            target: targetUrl
        });
    }
});

// Handle CORS preflight requests for the proxy endpoint
app.options('/proxy', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', '*');
    res.set('Access-Control-Allow-Headers', '*');
    res.set('Access-Control-Max-Age', '86400');
    res.status(200).end();
});

// Handle the main Scramjet route for navigation
app.get('/scramjet-handler.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'static/scramjet-handler.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        scramjet: 'active'
    });
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

// Error handling
server.on('error', (error) => {
    console.error('Server error:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Scramjet server running at http://localhost:${PORT}`);
    console.log('📁 Static files served from /static/');
    console.log('🔄 Scramjet proxy available at /scramjet/');
    console.log('🌐 Backend proxy endpoint at /proxy');
    console.log('🔧 Bare server available at /bare/');
    console.log('💡 Service worker will handle all /scramjet/ requests');
});

export default server;
