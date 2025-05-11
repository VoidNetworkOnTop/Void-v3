#!/bin/bash

echo "Setting up popup system..."

# Make scripts executable
chmod +x popup-service.js
chmod +x popup.js

# Install dependencies if not already installed
if ! npm list socket.io > /dev/null 2>&1; then
    echo "Installing Socket.IO..."
    npm install socket.io
fi

if ! npm list cors > /dev/null 2>&1; then
    echo "Installing CORS..."
    npm install cors
fi

# Create system command
echo "Setting up system command..."
sudo ln -sf "$(pwd)/popup.js" /usr/local/bin/popup

# Start popup service with PM2
echo "Starting popup service with PM2..."
pm2 start popup-service.js --name "popup-service"

echo ""
echo "✓ Popup system setup complete!"
echo ""
echo "To use the popup system:"
echo "1. Add this line to your HTML pages:"
echo "   <script src='/js/popup-client.js'></script>"
echo ""
echo "2. Send popups using: popup 'Your message here'"
echo ""
echo "The popup service is running on port 8081"
echo "Your main server should continue running on port 8080"
