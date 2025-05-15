// aero-integration.js - Place in your project root

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Aero configuration - using static folder
const AERO_DIR = path.join(__dirname, 'static/aero');
const AERO_SERVER = path.join(AERO_DIR, 'index.js'); // Adjust if the main file is different
const AERO_PORT = 8081;
const AERO_PREFIX = '/aero/';

// Create proxy middleware for Aero
export const aeroMiddleware = createProxyMiddleware({
  target: `http://localhost:${AERO_PORT}`,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  pathRewrite: {
    ['^' + AERO_PREFIX]: '/' // Remove the prefix when forwarding
  },
  onProxyRes: (proxyRes, req, res) => {
    // Set custom headers if needed
    proxyRes.headers['x-powered-by'] = 'Void-Network';
  },
  onError: (err, req, res) => {
    console.error('Aero proxy error:', err);
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    res.end('Aero Proxy Error: ' + err.message);
  }
});

// Function to start the Aero server
export function startAeroServer() {
  return new Promise((resolve, reject) => {
    // Check if the Aero server file exists
    if (!fs.existsSync(AERO_SERVER)) {
      return reject(new Error(`Aero server not found at ${AERO_SERVER}`));
    }

    console.log(`Starting Aero server from ${AERO_SERVER}`);

    // Start the Aero server as a child process
    const aeroProcess = spawn('node', [AERO_SERVER], {
      cwd: AERO_DIR,
      env: {
        ...process.env,
        PORT: AERO_PORT.toString(),
        PREFIX: AERO_PREFIX
      }
    });

    // Log Aero output
    aeroProcess.stdout.on('data', (data) => {
      console.log(`[Aero] ${data.toString().trim()}`);
    });

    aeroProcess.stderr.on('data', (data) => {
      console.error(`[Aero Error] ${data.toString().trim()}`);
    });

    // Handle process exit
    aeroProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`Aero process exited with code ${code}`);
      }
    });

    // Wait for a moment to consider the server started
    setTimeout(() => {
      console.log('Aero server started');
      resolve(aeroProcess);
    }, 3000);
  });
}

// Function to stop the Aero server
export function stopAeroServer(aeroProcess) {
  return new Promise((resolve) => {
    if (!aeroProcess) {
      return resolve();
    }

    aeroProcess.on('exit', () => {
      console.log('Aero server stopped');
      resolve();
    });

    // Send SIGTERM to gracefully shut down
    aeroProcess.kill('SIGTERM');

    // Force kill after 5 seconds if not exited
    setTimeout(() => {
      if (!aeroProcess.killed) {
        console.log('Forcing Aero server to stop');
        aeroProcess.kill('SIGKILL');
      }
    }, 5000);
  });
}

// Configuration object for client-side usage
export const aeroConfig = {
  baseUrl: `http://localhost:${AERO_PORT}`,
  prefix: AERO_PREFIX,
  port: AERO_PORT
};
