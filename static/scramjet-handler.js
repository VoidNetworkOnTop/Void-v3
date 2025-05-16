// scramjet-handler.js - Handles integration between your site and Scramjet

// Load Scramjet configuration if not already loaded
if (typeof window.__scramjet$config === 'undefined') {
  // Fetch configuration dynamically
  fetch('/scramjet/config.js')
    .then(response => response.text())
    .then(text => {
      const script = document.createElement('script');
      script.textContent = text;
      document.head.appendChild(script);
    })
    .catch(err => console.error('Failed to load Scramjet config:', err));
}

// Function to load Scramjet scripts dynamically
function loadScramjetScripts() {
  return new Promise((resolve, reject) => {
    // Create and append the Scramjet script
    const script = document.createElement('script');
    script.src = '/scramjet/dist/scramjet.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Scramjet loaded successfully');
      resolve();
    };
    
    script.onerror = () => {
      console.error('Failed to load Scramjet');
      reject(new Error('Failed to load Scramjet'));
    };
    
    document.head.appendChild(script);
  });
}

// Function to encode a URL using Scramjet
async function encodeScramjetUrl(url) {
  // Make sure Scramjet is loaded
  if (typeof window.__scramjet$config === 'undefined') {
    await new Promise(resolve => {
      const checkConfig = setInterval(() => {
        if (window.__scramjet$config) {
          clearInterval(checkConfig);
          resolve();
        }
      }, 50);
    });
  }
  
  // Make sure the Scramjet encode function is available
  if (typeof window.__scramjet$encode !== 'function') {
    await loadScramjetScripts();
    
    // Wait for Scramjet to initialize
    await new Promise(resolve => {
      const checkEncode = setInterval(() => {
        if (typeof window.__scramjet$encode === 'function') {
          clearInterval(checkEncode);
          resolve();
        }
      }, 50);
    });
  }
  
  // Now encode the URL using Scramjet
  return window.__scramjet$config.prefix + window.__scramjet$encode(url);
}

// Export functions for use in other scripts
window.scramjetHandler = {
  encode: encodeScramjetUrl,
  loadScripts: loadScramjetScripts
};
