// Popup client script - loads Socket.IO and handles popup display
(function() {
  // Load Socket.IO if not already loaded
  if (typeof io === 'undefined') {
    const script = document.createElement('script');
    script.src = 'http://localhost:8081/socket.io/socket.io.js';
    script.onload = initializePopupClient;
    document.head.appendChild(script);
  } else {
    initializePopupClient();
  }
  
  function initializePopupClient() {
    // Connect to popup service
    const socket = io('http://localhost:8081');
    
    // Listen for popup messages
    socket.on('popup_message', function(data) {
      showPopup(data.message);
    });
    
    // Function to show popup
    function showPopup(message) {
      // Create popup container if it doesn't exist
      let popupContainer = document.getElementById('popup-container');
      if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.id = 'popup-container';
        popupContainer.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999;';
        document.body.appendChild(popupContainer);
      }
      
      // Create popup element
      const popup = document.createElement('div');
      popup.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 25px 35px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        max-width: 400px;
        text-align: center;
        animation: fadeInScale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        position: relative;
      `;
      
      // Create close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 15px;
        background: none;
        border: none;
        color: rgba(255,255,255,0.8);
        font-size: 24px;
        cursor: pointer;
        line-height: 20px;
        transition: color 0.2s;
      `;
      closeBtn.onmouseover = () => closeBtn.style.color = 'white';
      closeBtn.onmouseout = () => closeBtn.style.color = 'rgba(255,255,255,0.8)';
      closeBtn.onclick = () => popup.remove();
      popup.appendChild(closeBtn);
      
      // Create message element
      const messageEl = document.createElement('p');
      messageEl.style.margin = '0';
      messageEl.style.fontSize = '16px';
      messageEl.style.lineHeight = '1.6';
      messageEl.textContent = message;
      popup.appendChild(messageEl);
      
      // Add popup to container
      popupContainer.appendChild(popup);
      
      // Auto-remove after 8 seconds
      setTimeout(() => {
        if (popup.parentNode) {
          popup.style.animation = 'fadeOut 0.3s ease-out forwards';
          setTimeout(() => popup.remove(), 300);
        }
      }, 8000);
    }
  }
  
  // Add CSS for animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInScale {
      from { 
        opacity: 0; 
        transform: translate(-50%, -50%) scale(0.8);
      }
      to { 
        opacity: 1; 
        transform: translate(-50%, -50%) scale(1);
      }
    }
    
    @keyframes fadeOut {
      from { 
        opacity: 1; 
        transform: translate(-50%, -50%) scale(1);
      }
      to { 
        opacity: 0; 
        transform: translate(-50%, -50%) scale(0.8);
      }
    }
  `;
  document.head.appendChild(style);
})();
