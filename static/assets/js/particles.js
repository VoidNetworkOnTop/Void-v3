// Simple Falling Dots Background Script
// Smooth, gentle downward animation with no connections

(function() {
  // Wait for the DOM to be fully loaded before initializing
  document.addEventListener('DOMContentLoaded', initParticlesBackground);
  
  // If the DOM is already loaded, run initialization immediately
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initParticlesBackground, 1);
  }
  
  function initParticlesBackground() {
    console.log("Falling Dots: Initializing background effect");
    
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
    canvas.classList.add('falling-dots-canvas');
    
    // Append canvas to body
    document.body.appendChild(canvas);
    
    // Particle settings
    const particleCount = 150; // More dots for a fuller effect
    const minSize = 1.5;
    const maxSize = 4;
    const baseOpacity = 0.3; // Lower base opacity for more transparency
    const fallSpeed = 0.3; // Very slow falling speed
    const horizontalDrift = 0.1; // Slight horizontal movement
    
    // Array to store particles
    let particles = [];
    
    // Resize handler
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log("Falling Dots: Canvas resized to", canvas.width, "x", canvas.height);
    }
    
    // Initialize particles
    function initParticles() {
      particles = [];
      
      for (let i = 0; i < particleCount; i++) {
        // Create particles at random positions
        const size = minSize + Math.random() * (maxSize - minSize);
        const opacity = baseOpacity * (0.4 + Math.random() * 0.6); // Varied opacity
        
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: size,
          opacity: opacity,
          // Mostly downward movement with slight horizontal drift
          speedY: fallSpeed * (0.5 + Math.random() * 0.8),
          speedX: (Math.random() - 0.5) * horizontalDrift,
          // Each particle gets a slight blur effect for smoother appearance
          blur: Math.random() * 2
        });
      }
      console.log("Falling Dots: Created", particles.length, "particles");
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
        
        // Move particle
        particle.y += particle.speedY;
        particle.x += particle.speedX;
        
        // Wrap around when particle reaches bottom
        if (particle.y > canvas.height) {
          particle.y = 0;
          particle.x = Math.random() * canvas.width;
        }
        
        // Wrap around sides too
        if (particle.x < 0) {
          particle.x = canvas.width;
        } else if (particle.x > canvas.width) {
          particle.x = 0;
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
        
        // Limit speeds for smooth movement
        particle.speedX = Math.max(-horizontalDrift, Math.min(horizontalDrift, particle.speedX));
        particle.speedY = Math.max(fallSpeed * 0.1, Math.min(fallSpeed * 1.5, particle.speedY));
        
        // Apply subtle damping to horizontal movement
        particle.speedX *= 0.99;
        
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
    
    console.log("Falling Dots: Animation started");
  }
})();
