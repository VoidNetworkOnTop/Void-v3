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
        popupContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; width: 380px;';
        document.body.appendChild(popupContainer);
      }
      
      // Create popup element
      const popup = document.createElement('div');
      popup.className = 'notification-popup';
      popup.style.cssText = `
        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
        color: #fff;
        padding: 0;
        border-radius: 12px;
        box-shadow: 
          0 0 30px rgba(255,255,255,0.15),
          0 5px 25px rgba(0,0,0,0.5),
          inset 0 0 1px rgba(255,255,255,0.1);
        margin-bottom: 15px;
        width: 100%;
        box-sizing: border-box;
        animation: popupSlideIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        border: 1px solid rgba(255,255,255,0.1);
        position: relative;
        overflow: hidden;
        transform-origin: top right;
      `;
      
      // Create animated background elements
      createBackgroundEffects(popup);
      
      // Create header section
      const header = document.createElement('div');
      header.style.cssText = `
        background: linear-gradient(90deg, #1a1a1a 0%, #0a0a0a 100%);
        padding: 15px 20px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        position: relative;
        overflow: hidden;
      `;
      
      // Create notification icon
      const icon = document.createElement('div');
      icon.innerHTML = '✨';
      icon.style.cssText = `
        float: left;
        font-size: 20px;
        margin-right: 10px;
        animation: iconPulse 2s infinite;
      `;
      header.appendChild(icon);
      
      // Create title
      const title = document.createElement('span');
      title.textContent = 'System Notification';
      title.style.cssText = `
        font-weight: 600;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #fff;
        opacity: 0.9;
      `;
      header.appendChild(title);
      
      // Create close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.style.cssText = `
        position: absolute;
        top: 12px;
        right: 15px;
        background: none;
        border: none;
        color: rgba(255,255,255,0.6);
        font-size: 24px;
        cursor: pointer;
        line-height: 20px;
        transition: all 0.2s ease;
        z-index: 1;
        width: 30px;
        height: 30px;
        border-radius: 50%;
      `;
      closeBtn.onmouseover = () => {
        closeBtn.style.color = '#fff';
        closeBtn.style.background = 'rgba(255,255,255,0.1)';
        closeBtn.style.transform = 'scale(1.1) rotate(90deg)';
      };
      closeBtn.onmouseout = () => {
        closeBtn.style.color = 'rgba(255,255,255,0.6)';
        closeBtn.style.background = 'none';
        closeBtn.style.transform = 'scale(1) rotate(0deg)';
      };
      closeBtn.onclick = () => {
        dismissPopup(popup);
      };
      header.appendChild(closeBtn);
      
      popup.appendChild(header);
      
      // Create content section
      const content = document.createElement('div');
      content.style.cssText = `
        padding: 20px;
        position: relative;
      `;
      
      // Create message element
      const messageEl = document.createElement('p');
      messageEl.style.cssText = `
        margin: 0;
        font-size: 15px;
        line-height: 1.6;
        color: #e8e8e8;
        animation: textGlow 3s ease-in-out infinite;
      `;
      messageEl.textContent = message;
      content.appendChild(messageEl);
      
      popup.appendChild(content);
      
      // Create progress bar
      const progressBar = document.createElement('div');
      progressBar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #ffffff 0%, #888888 100%);
        width: 100%;
        border-bottom-left-radius: 12px;
        border-bottom-right-radius: 12px;
        transform-origin: left;
        animation: progressShrink 8s linear forwards;
      `;
      popup.appendChild(progressBar);
      
      // Add popup to container
      popupContainer.appendChild(popup);
      
      // Auto-remove after 8 seconds
      setTimeout(() => {
        dismissPopup(popup);
      }, 8000);
      
      // Add interactive behaviors
      popup.onmouseenter = () => {
        progressBar.style.animationPlayState = 'paused';
      };
      
      popup.onmouseleave = () => {
        progressBar.style.animationPlayState = 'running';
      };
    }
    
    function dismissPopup(popup) {
      popup.style.animation = 'popupSlideOut 0.5s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards';
      setTimeout(() => {
        if (popup.parentNode) {
          popup.remove();
        }
      }, 500);
    }
    
    function createBackgroundEffects(popup) {
      // Create floating particles
      for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          animation: floatParticle ${3 + Math.random() * 4}s linear infinite;
          top: ${Math.random() * 100}%;
          left: ${Math.random() * 100}%;
          opacity: ${0.3 + Math.random() * 0.4};
        `;
        popup.appendChild(particle);
      }
      
      // Create corner glow effect
      const cornerGlow = document.createElement('div');
      cornerGlow.style.cssText = `
        position: absolute;
        top: -2px;
        right: -2px;
        width: 40px;
        height: 40px;
        background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
        opacity: 0;
        animation: cornerGlow 2s ease-in-out infinite;
      `;
      popup.appendChild(cornerGlow);
    }
  }
  
  // Add CSS for animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes popupSlideIn {
      0% { 
        opacity: 0; 
        transform: translateY(-100%) scale(0.8);
      }
      100% { 
        opacity: 1; 
        transform: translateY(0) scale(1);
      }
    }
    
    @keyframes popupSlideOut {
      0% { 
        opacity: 1; 
        transform: translateY(0) scale(1);
      }
      100% { 
        opacity: 0; 
        transform: translateX(100%) scale(0.9);
      }
    }
    
    @keyframes progressShrink {
      0% { transform: scaleX(1); }
      100% { transform: scaleX(0); }
    }
    
    @keyframes textGlow {
      0%, 100% { 
        text-shadow: 0 0 5px rgba(255,255,255,0.1);
      }
      50% { 
        text-shadow: 0 0 15px rgba(255,255,255,0.2), 0 0 25px rgba(255,255,255,0.1);
      }
    }
    
    @keyframes iconPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); opacity: 0.8; }
    }
    
    @keyframes floatParticle {
      0% { 
        transform: translateY(0) translateX(0);
        opacity: 0;
      }
      50% { 
        opacity: 1;
      }
      100% { 
        transform: translateY(-100px) translateX(${Math.random() > 0.5 ? '' : '-'}50px);
        opacity: 0;
      }
    }
    
    @keyframes cornerGlow {
      0%, 100% { opacity: 0; }
      50% { opacity: 1; }
    }
    
    /* Responsive design for mobile */
    @media (max-width: 480px) {
      #popup-container {
        left: 10px !important;
        right: 10px !important;
        width: auto !important;
      }
    }
    
    /* Custom scrollbar for popup content if needed */
    .notification-popup::-webkit-scrollbar {
      width: 4px;
    }
    
    .notification-popup::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.05);
    }
    
    .notification-popup::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2);
      border-radius: 2px;
    }
  `;
  document.head.appendChild(style);
})();
