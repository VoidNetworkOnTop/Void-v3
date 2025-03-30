// Particles Background Script
// Add this script to any webpage to create a nice white particles background

(function() {
  // Wait for the DOM to be fully loaded before initializing
  document.addEventListener('DOMContentLoaded', initParticlesBackground);
  
  // If the DOM is already loaded, run initialization immediately
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initParticlesBackground, 1);
  }
  
  function initParticlesBackground() {
    console.log("Particles.js: Initializing background effect");
    
    // Create canvas element  
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas to cover the entire background
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '1'; // Make sure it's behind everything
    canvas.style.pointerEvents = 'none'; // Allow clicking through canvas
    
    // Add a class for easier debugging
    canvas.classList.add('particles-js-canvas');
    
    // Append canvas to body
    document.body.appendChild(canvas);
    
    // Particle settings
    const particleCount = 100;
    const particleSize = 3; // Increased size for better visibility
    const particleColor = 'rgba(255, 255, 255, 0.8)'; // More opacity
    const lineColor = 'rgba(255, 255, 255, 0.5)'; // Brighter connecting lines
    const lineDistance = 150;
    const moveSpeed = 0.15; // Much slower movement
    
    // Array to store particles
    let particles = [];
    
    // Resize handler - this needs to happen immediately and on resize
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log("Particles.js: Canvas resized to", canvas.width, "x", canvas.height);
    }
    
    // Initialize particles
    function initParticles() {
      particles = [];
      
      for (let i = 0; i < particleCount; i++) {
        const radius = Math.random() * particleSize + 1.5; // Slightly larger minimum size
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: radius,
          originalRadius: radius, // Store original radius for scaling effects
          vx: Math.random() * moveSpeed * 2 - moveSpeed,
          vy: Math.random() * moveSpeed * 2 - moveSpeed,
          color: particleColor,
          colorTransition: 0,
          lastMouseX: null,
          lastMouseY: null
        });
      }
      console.log("Particles.js: Created", particles.length, "particles");
    }
    
    // Draw particles
    function drawParticles() {
      // Clear the canvas completely on each frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply mouse effects
      applyMouseEffect();
      
      // Update and draw each particle
      for (let i = 0; i < particles.length; i++) {
        let particle = particles[i];
        
        // Move particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.vx = -particle.vx;
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.vy = -particle.vy;
        }
        
        // Add slight friction
        particle.vx *= 0.99;
        particle.vy *= 0.99;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        
        // Draw connecting lines
        for (let j = i + 1; j < particles.length; j++) {
          let otherParticle = particles[j];
          let dx = particle.x - otherParticle.x;
          let dy = particle.y - otherParticle.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < lineDistance) {
            ctx.beginPath();
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1.2 * (1 - distance / lineDistance); // Thicker and brighter lines
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
            
            // Add a small glow effect to the connections
            if (distance < lineDistance * 0.5) {
              ctx.beginPath();
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
              ctx.lineWidth = 2.5 * (1 - distance / lineDistance);
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.stroke();
            }
          }
        }
      }
      
      // Request next animation frame
      requestAnimationFrame(drawParticles);
    }
    
    // Mouse interaction
    let mouseX = null;
    let mouseY = null;
    const mouseRadius = 250; // Larger interaction radius
    let lastMouseMoveTime = 0;
    let isMouseMoving = false;
    
    function handleMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      // Track if mouse is actively moving
      lastMouseMoveTime = Date.now();
      isMouseMoving = true;
      
      // Set a timeout to detect when mouse stops moving
      setTimeout(() => {
        if (Date.now() - lastMouseMoveTime >= 100) {
          isMouseMoving = false;
        }
      }, 150);
    }
    
    // Updated animation effect for when cursor moves
    function applyMouseEffect() {
      if (mouseX === null || mouseY === null) return;
      
      particles.forEach(particle => {
        const dx = mouseX - particle.x;
        const dy = mouseY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouseRadius) {
          if (isMouseMoving) {
            // EFFECT 1: When mouse is moving - Particles split and move away perpendicular to cursor direction
            // Calculate movement vector of mouse
            const mouseVectorX = particle.lastMouseX ? mouseX - particle.lastMouseX : 0;
            const mouseVectorY = particle.lastMouseY ? mouseY - particle.lastMouseY : 0;
            
            // Calculate perpendicular vector (two directions)
            const perpLength = Math.sqrt(mouseVectorX * mouseVectorX + mouseVectorY * mouseVectorY);
            if (perpLength > 0) {
              const perpX = -mouseVectorY / perpLength;
              const perpY = mouseVectorX / perpLength;
              
              // Decide which perpendicular direction to use (creates split effect)
              const dotProduct = dx * perpX + dy * perpY;
              const perpSignX = dotProduct < 0 ? -1 : 1;
              const perpSignY = dotProduct < 0 ? -1 : 1;
              
              // Apply force perpendicular to mouse movement
              const force = Math.pow((mouseRadius - distance) / mouseRadius, 2) * 1.2;
              particle.vx += perpSignX * perpX * force;
              particle.vy += perpSignY * perpY * force;
              
              // Add color effect
              particle.color = 'rgba(180, 220, 255, 0.9)'; // Light blue when affected
              particle.colorTransition = 30; // Frames to transition back
            }
          } else {
            // EFFECT 2: When mouse is still - Gentle attraction with orbit
            const force = (mouseRadius - distance) / mouseRadius * 0.05;
            
            // Calculate angle to cursor
            const angle = Math.atan2(dy, dx);
            
            // Attract slightly towards cursor
            particle.vx += Math.cos(angle) * force * 0.4;
            particle.vy += Math.sin(angle) * force * 0.4;
            
            // Add orbital velocity (perpendicular to attraction)
            particle.vx += Math.cos(angle + Math.PI/2) * force * 0.8;
            particle.vy += Math.sin(angle + Math.PI/2) * force * 0.8;
            
            // Add color effect
            particle.color = 'rgba(255, 240, 200, 0.9)'; // Warm glow when orbiting
            particle.colorTransition = 20; // Frames to transition back
          }
          
          // Store last mouse position for vector calculation
          particle.lastMouseX = mouseX;
          particle.lastMouseY = mouseY;
          
          // Limit velocity
          const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
          if (speed > 2.5) {
            particle.vx = (particle.vx / speed) * 2.5;
            particle.vy = (particle.vy / speed) * 2.5;
          }
        } else {
          // Gradually return to original color
          if (particle.colorTransition > 0) {
            particle.colorTransition--;
            
            if (particle.colorTransition <= 0) {
              particle.color = particleColor;
            }
          }
          
          // Reset mouse position memory if out of range
          particle.lastMouseX = null;
          particle.lastMouseY = null;
        }
      });
    }
    }
    
    // Run everything
    resizeCanvas();
    initParticles();
    drawParticles();
    
    // Event listeners
    window.addEventListener('resize', function() {
      resizeCanvas();
      initParticles();
    });
    
    window.addEventListener('mousemove', handleMouseMove);
    
    console.log("Particles.js: Animation started");
  }
})();
