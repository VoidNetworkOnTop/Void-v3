// Refined Falling Dots Background Script
// Particles fall from left and right with umbrella effect around cursor

(function() {
  // Wait for the DOM to be fully loaded before initializing
  document.addEventListener('DOMContentLoaded', initParticlesBackground);
  
  // If the DOM is already loaded, run initialization immediately
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initParticlesBackground, 1);
  }
  
  function initParticlesBackground() {
    console.log("Refined Falling Dots: Initializing background effect");
    
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
    const particleCount = 200; // More particles for richer effect
    const minSize = 1.5;
    const maxSize = 4; // Same max size as original
    const baseOpacity = 0.4; // Better visibility
    const fallSpeed = 0.7; // Faster falling speed
    const horizontalDrift = 0.1; // Slight horizontal movement
    
    // Enhanced visual settings
    const glowIntensity = 0.8;
    const innerColor = 'rgba(255, 255, 255, ';
    const outerColor = 'rgba(200, 220, 255, '; // Subtle blue tint
    
    // Array to store particles
    let particles = [];
    
    // Resize handler
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log("Refined Falling Dots: Canvas resized to", canvas.width, "x", canvas.height);
    }
    
    // Initialize particles
    function initParticles() {
      particles = [];
      
      for (let i = 0; i < particleCount; i++) {
        // Create particles coming from left and right edges
        const side = Math.random() > 0.5 ? 'left' : 'right';
        const size = minSize + Math.random() * (maxSize - minSize);
        const opacity = baseOpacity * (0.5 + Math.random() * 0.5);
        
        // Spawn from left third or right third of screen
        let xPosition;
        if (side === 'left') {
          xPosition = Math.random() * canvas.width * 0.3;
        } else {
          xPosition = canvas.width * 0.7 + Math.random() * canvas.width * 0.3;
        }
        
        particles.push({
          x: xPosition,
          y: Math.random() * canvas.height,
          size: size,
          opacity: opacity,
          // Faster downward movement with more horizontal drift
          speedY: fallSpeed * (0.7 + Math.random() * 0.6),
          speedX: (Math.random() - 0.5) * horizontalDrift * 2,
          // Each particle gets a slight blur effect for smoother appearance
          blur: Math.random() * 2.5,
          side: side
        });
      }
      console.log("Refined Falling Dots: Created", particles.length, "particles");
    }
    
    // Mouse interaction with umbrella effect
    let mouseX = null;
    let mouseY = null;
    const umbrellaRadius = 50; // Invisible bubble around cursor
    
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
        
        // Mouse interaction - umbrella effect
        if (mouseX !== null && mouseY !== null) {
          const dx = mouseX - particle.x;
          const dy = mouseY - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < umbrellaRadius) {
            // Umbrella bounce effect - stronger repulsion
            const force = 0.3 * (1 - distance / umbrellaRadius);
            const angle = Math.atan2(dy, dx);
            
            // Push particle away from cursor more aggressively
            particle.speedX -= Math.cos(angle) * force * 2;
            particle.speedY -= Math.sin(angle) * force;
            
            // Bounce particles around the umbrella
            if (distance < umbrellaRadius * 0.8) {
              particle.speedY += Math.abs(Math.sin(angle)) * force;
              particle.speedX += Math.sign(dx) * force * 1.5;
            }
          }
          // Gradually return to normal speed
          particle.speedX *= 0.94;
          particle.speedY = Math.max(particle.speedY * 0.95, fallSpeed * 0.7);
        }
        
        // Move particle
        particle.y += particle.speedY;
        particle.x += particle.speedX;
        
        // Limit maximum speeds for smooth animation
        particle.speedX = Math.max(-horizontalDrift * 3, Math.min(horizontalDrift * 3, particle.speedX));
        particle.speedY = Math.max(fallSpeed * 0.2, Math.min(fallSpeed * 1.8, particle.speedY));
        
        // Wrap around when particle reaches bottom
        if (particle.y > canvas.height) {
          particle.y = -particle.size;
          // Respawn on appropriate side
          if (particle.side === 'left') {
            particle.x = Math.random() * canvas.width * 0.3;
          } else {
            particle.x = canvas.width * 0.7 + Math.random() * canvas.width * 0.3;
          }
        }
        
        // Wrap around sides
        if (particle.x < -particle.size) {
          particle.x = canvas.width + particle.size;
        } else if (particle.x > canvas.width + particle.size) {
          particle.x = -particle.size;
        }
        
        // Create gradient for refined visual effect
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 2
        );
        gradient.addColorStop(0, innerColor + particle.opacity + ')');
        gradient.addColorStop(0.5, outerColor + (particle.opacity * 0.7) + ')');
        gradient.addColorStop(1, outerColor + '0)');
        
        // Draw particle as a soft circle with gradient and glow
        ctx.beginPath();
        
        // Add outer glow
        ctx.shadowBlur = particle.blur * 2;
        ctx.shadowColor = 'rgba(200, 220, 255, ' + (particle.opacity * glowIntensity) + ')';
        
        ctx.fillStyle = gradient;
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
    
    console.log("Refined Falling Dots: Animation started");
  }
})();
