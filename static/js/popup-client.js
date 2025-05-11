// Popup client script - loads Socket.IO and handles popup display
(function() {
  // Use the proxy path for production - this goes through Caddy
  const popupServiceUrl = window.location.origin;
  const popupServicePath = '/popup-service/socket.io/';
  
  console.log('Connecting to popup service at:', popupServiceUrl + popupServicePath);
  
  // Load Socket.IO if not already loaded
  if (typeof io === 'undefined') {
    const script = document.createElement('script');
    script.src = `${popupServiceUrl}/popup-service/socket.io/socket.io.js`;
    script.onload = initializePopupClient;
    script.onerror = function() {
      console.error('Failed to load Socket.IO script from:', script.src);
    };
    document.head.appendChild(script);
  } else {
    initializePopupClient();
  }
  
  function initializePopupClient() {
    console.log('Initializing popup client...');
    
    // Connect to popup service with the correct path
    const socket = io(popupServiceUrl, {
      path: popupServicePath
    });
    
    socket.on('connect', function() {
      console.log('✓ Connected to popup service');
    });
    
    socket.on('disconnect', function() {
      console.log('Disconnected from popup service');
    });
    
    socket.on('connect_error', function(error) {
      console.error('Connection error:', error);
    });
    
    // Listen for popup messages
    socket.on('popup_message', function(data) {
      console.log('Received popup message:', data.message);
      showPopup(data.message);
    });
    
    // Function to show popup
    function showPopup(message) {
      // Create popup container if it doesn't exist
      let popupContainer = document.getElementById('popup-container');
      if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.id = 'popup-container';
        popupContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; width: 350px;';
        document.body.appendChild(popupContainer);
      }
      
      // Create popup element
      const popup = document.createElement('div');
      popup.style.cssText = `
        background: #000;
        color: #fff;
        padding: 25px 30px;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(255,255,255,0.3), 0 0 40px rgba(255,255,255,0.2), 0 0 60px rgba(255,255,255,0.1);
        margin-bottom: 15px;
        width: 100%;
        box-sizing: border-box;
        animation: slideInDown 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        border: 1px solid rgba(255,255,255,0.2);
        position: relative;
        overflow: hidden;
      `;
      
      // Create glowing border effect
      const glowBorder = document.createElement('div');
      glowBorder.style.cssText = `
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border: 2px solid rgba(255,255,255,0.5);
        border-radius: 10px;
        opacity: 0;
        animation: borderGlow 3s ease-in-out infinite;
      `;
      popup.appendChild(glowBorder);
      
      // Create close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.style.cssText = `
        position: absolute;
        top: 12px;
        right: 15px;
        background: none;
        border: none;
        color: rgba(255,255,255,0.7);
        font-size: 24px;
        cursor: pointer;
        line-height: 20px;
        transition: color 0.2s, transform 0.2s;
        z-index: 1;
      `;
      closeBtn.onmouseover = () => {
        closeBtn.style.color = '#fff';
        closeBtn.style.transform = 'scale(1.1)';
      };
      closeBtn.onmouseout = () => {
        closeBtn.style.color = 'rgba(255,255,255,0.7)';
        closeBtn.style.transform = 'scale(1)';
      };
      closeBtn.onclick = () => {
        popup.style.animation = 'slideOutUp 0.3s ease-out forwards';
        setTimeout(() => popup.remove(), 300);
      };
      popup.appendChild(closeBtn);
      
      // Create message element
      const messageEl = document.createElement('p');
      messageEl.style.margin = '0';
      messageEl.style.fontSize = '16px';
      messageEl.style.lineHeight = '1.6';
      messageEl.style.paddingRight = '30px';
      messageEl.style.textShadow = '0 0 10px rgba(255,255,255,0.1)';
      messageEl.textContent = message;
      popup.appendChild(messageEl);
      
      // Add popup to container
      popupContainer.appendChild(popup);
      
      // Auto-remove after 8 seconds
      setTimeout(() => {
        if (popup.parentNode) {
          popup.style.animation = 'slideOutUp 0.3s ease-out forwards';
          setTimeout(() => popup.remove(), 300);
        }
      }, 8000);
    }
  }
  
  // Add CSS for animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInDown {
      from { 
        opacity: 0; 
        transform: translateY(-100%);
      }
      to { 
        opacity: 1; 
        transform: translateY(0);
      }
    }
    
    @keyframes slideOutUp {
      from { 
        opacity: 1; 
        transform: translateY(0);
      }
      to { 
        opacity: 0; 
        transform: translateY(-100%);
      }
    }
    
    @keyframes borderGlow {
      0% { 
        opacity: 0;
        box-shadow: 0 0 5px rgba(255,255,255,0.2);
      }
      50% { 
        opacity: 1;
        box-shadow: 0 0 20px rgba(255,255,255,0.4), 0 0 30px rgba(255,255,255,0.3);
      }
      100% { 
        opacity: 0;
        box-shadow: 0 0 5px rgba(255,255,255,0.2);
      }
    }
    
    /* Responsive design for mobile */
    @media (max-width: 480px) {
      #popup-container {
        left: 10px !important;
        right: 10px !important;
        width: auto !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
