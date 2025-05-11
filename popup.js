#!/usr/bin/env node

import http from 'node:http';

// Get message from command line arguments
const args = process.argv.slice(2);
const message = args.join(' ');

if (!message) {
  console.error('Usage: popup <message>');
  console.error('Example: popup "Hello everyone! Important announcement here."');
  process.exit(1);
}

// Send POST request to the popup service
const postData = JSON.stringify({
  message: message
});

const options = {
  hostname: 'localhost',
  port: 8081, // Popup service port
  path: '/popup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.success) {
        console.log(`✓ Popup sent successfully to ${response.clientCount} connected clients`);
        console.log(`Message: "${message}"`);
      } else {
        console.error('Error:', response.error);
        process.exit(1);
      }
    } catch (e) {
      console.error('Error parsing response:', e.message);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error(`Error sending popup: ${e.message}`);
  console.error('Make sure the popup service is running on localhost:8081');
  process.exit(1);
});

req.write(postData);
req.end();
