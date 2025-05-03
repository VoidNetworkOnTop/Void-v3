// Diagonal Particles Background Script
// Particles flowing diagonally from top-left and top-right corners

(function() {
  // Wait for the DOM to be fully loaded before initializing
  document.addEventListener('DOMContentLoaded', initParticlesBackground);
  
  // If the DOM is already loaded, run initialization immediately
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initParticlesBackground, 1);
  }
  
  function initParticlesBackground() {
    console.log("Diagonal Particles: Initializing background effect");
    
    // Create canvas element  
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas to cover the entire background
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '0'; // Make sure it's behind everything
    canvas.style.pointerEvents = 'none'; // Allow clicking through canvas
    
    // Add a class for easier debugging
    canvas.classList.add('diagonal-particles-canvas');
    
    // Append canvas to body
    document.body.appendChild(canvas);
    
    // Particle settings
    const particleCount = 150; // Total particles (split between both sources)
    const minSize = 1.5;
    const maxSize = 4;
    const baseOpacity = 0.3; // Lower base opacity for more transparency
    const baseSpeed = 2.5; // Increased base speed for faster diagonal movement
    
    // Array to store particles
    let particles = [];
    
    // Resize handler
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log("Diagonal Particles: Canvas resized to", canvas.width, "x", canvas.height);
    }
    
    // Initialize particles
    function initParticles() {
      particles = [];
      
      // Create two groups of particles
      for (let i = 0; i < particleCount; i++) {
        const size = minSize + Math.random() * (maxSize - minSize);
        const opacity = baseOpacity * (0.4 + Math.random() * 0.6); // Varied opacity
        const speed = baseSpeed * (0.8 + Math.random() * 0.5); // Faster speed range
        
        // Determine which corner this particle comes from
        const fromTopLeft = i < particleCount / 2;
        
        // Create diagonal velocity vectors
        let speedX, speedY;
        if (fromTopLeft) {
          // Top-left to bottom-right diagonal
          speedX = speed;  // Moving right
          speedY = speed;  // Moving down
        } else {
          // Top-right to bottom-left diagonal
          speedX = -speed; // Moving left
          speedY = speed;  // Moving down
        }
        
        // Add some randomness to the diagonal movement
        speedX += (Math.random() - 0.5) * 0.2;
        speedY += (Math.random() - 0.5) * 0.2;
        
        particles.push({
          x: fromTopLeft ? 0 : canvas.width,
          y: 0,
          size: size,
          opacity: opacity,
          speedX: speedX,
          speedY: speedY,
          fromTopLeft: fromTopLeft,
          // Each particle gets a slight blur effect for smoother appearance
          blur: Math.random() * 2
        });
      }
      console.log("Diagonal Particles: Created", particles.length, "particles");
    }
    
    // Mouse interaction
    let mouseX = null;
    let mouseY = null;
    const mouseRadius = 120;
    
    function handleMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
    
    // Draw particles
    function drawParticles() {
      // Complete clear with no trail effect
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw each particle
      for (let i = 0; i < particles.length; i++) {
        let particle = particles[i];
        
        // Move particle along its diagonal path
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Reset particle if it goes off screen
        if (particle.y > canvas.height || 
            (particle.fromTopLeft && particle.x > canvas.width) ||
            (!particle.fromTopLeft && particle.x < 0)) {
          
          // Reset to starting position
          particle.x = particle.fromTopLeft ? 0 : canvas.width;
          particle.y = 0;
          
          // Slightly vary the speed for visual interest
          const speed = baseSpeed * (0.8 + Math.random() * 0.5);
          
          if (particle.fromTopLeft) {
            particle.speedX = speed + (Math.random() - 0.5) * 0.2;
            particle.speedY = speed + (Math.random() - 0.5) * 0.2;
          } else {
            particle.speedX = -speed + (Math.random() - 0.5) * 0.2;
            particle.speedY = speed + (Math.random() - 0.5) * 0.2;
          }
        }
        
        // Mouse interaction - gentle avoid effect
        if (mouseX !== null && mouseY !== null) {
          const dx = mouseX - particle.x;
          const dy = mouseY - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < mouseRadius) {
            // Create a very gentle avoidance - just enough to create a subtle effect
            const force = 0.05 * (1 - distance / mouseRadius);
            const angle = Math.atan2(dy, dx);
            
            // Move away from cursor, but very gently
            particle.speedX -= Math.cos(angle) * force;
            particle.speedY -= Math.sin(angle) * force;
            
            // Slightly brighten particles near cursor
            const brightenFactor = 1 + (1 - distance / mouseRadius) * 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(particle.opacity * brightenFactor, 0.95)})`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
          }
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        }
        
        // Apply subtle damping to keep diagonal movement smooth
        particle.speedX *= 0.99;
        particle.speedY *= 0.99;
        
        // Draw particle as a soft circle with slight blur for smoothness
        ctx.beginPath();
        
        // Use shadow blur for softer dots
        ctx.shadowBlur = particle.blur;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        
        // Draw the dot
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Reset shadow for better performance
        ctx.shadowBlur = 0;
      }
      
      // Request next animation frame
      requestAnimationFrame(drawParticles);
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
    
    console.log("Diagonal Particles: Animation started");
  }
})();
