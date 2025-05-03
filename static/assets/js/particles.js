// Rapid Diagonal Falling Particles with Pure Umbrella Bounce Effect
// Very fast diagonal movement with energetic umbrella physics

(function() {
  // Wait for the DOM to be fully loaded before initializing
  document.addEventListener('DOMContentLoaded', initParticlesBackground);
  
  // If the DOM is already loaded, run initialization immediately
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initParticlesBackground, 1);
  }
  
  function initParticlesBackground() {
    console.log("Fast Diagonal Particles: Initializing background effect");
    
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
    canvas.classList.add('fast-diagonal-particles-canvas');
    
    // Append canvas to body
    document.body.appendChild(canvas);
    
    // Particle settings - much faster values
    const particleCount = 220;
    const minSize = 1.5;
    const maxSize = 3.5;
    const baseOpacity = 0.4;
    const fallSpeed = 3.5; // Very fast falling speed
    const diagonalDrift = 2.5; // Much stronger diagonal movement
    
    // Array to store particles
    let particles = [];
    
    // Resize handler
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log("Fast Diagonal Particles: Canvas resized to", canvas.width, "x", canvas.height);
    }
    
    // Initialize particles
    function initParticles() {
      particles = [];
      
      for (let i = 0; i < particleCount; i++) {
        // Split particles - half from left, half from right
        const side = i < particleCount / 2 ? 'left' : 'right';
        let startX, startY, speedX, speedY;
        
        if (side === 'left') {
          // Spawn from top-left area, moving diagonally down-right
          startX = Math.random() * (canvas.width * 0.2) - (canvas.width * 0.1); // Can start off-screen left
          startY = Math.random() * (canvas.height * 0.3); // Start from top third
          speedX = diagonalDrift * (1.2 + Math.random() * 0.5); // Strong right movement
          speedY = fallSpeed * (1 + Math.random() * 0.5); // Fast downward movement
        } else {
          // Spawn from top-right area, moving diagonally down-left  
          startX = canvas.width - Math.random() * (canvas.width * 0.2) + (canvas.width * 0.1); // Can start off-screen right
          startY = Math.random() * (canvas.height * 0.3); // Start from top third
          speedX = -diagonalDrift * (1.2 + Math.random() * 0.5); // Strong left movement
          speedY = fallSpeed * (1 + Math.random() * 0.5); // Fast downward movement
        }
        
        const size = minSize + Math.random() * (maxSize - minSize);
        const opacity = baseOpacity * (0.7 + Math.random() * 0.3);
        
        particles.push({
          x: startX,
          y: startY,
          size: size,
          opacity: opacity,
          speedY: speedY,
          speedX: speedX,
          side: side, // Remember which side particle came from
          // Keep glow for visual effect
          glow: Math.random() * 1.5
        });
      }
      console.log("Fast Diagonal Particles: Created", particles.length, "particles");
    }
    
    // Mouse interaction - pure umbrella bounce only
    let mouseX = null;
    let mouseY = null;
    const umbrellaRadius = 60; // Umbrella radius
    const bounceMultiplier = 1.5; // Increase bounce energy
    
    function handleMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
    
    // Draw particles
    function drawParticles() {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw each particle
      for (let i = 0; i < particles.length; i++) {
        let particle = particles[i];
        
        // Store original position for collision check
        const nextX = particle.x + particle.speedX;
        const nextY = particle.y + particle.speedY;
        
        // Umbrella collision detection
        let hitUmbrella = false;
        if (mouseX !== null && mouseY !== null) {
          const dx = nextX - mouseX;
          const dy = nextY - mouseY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < umbrellaRadius) {
            hitUmbrella = true;
            
            // Calculate collision normal
            const normalX = dx / distance;
            const normalY = dy / distance;
            
            // Reflect particle's velocity with enhanced bounce
            const dotProduct = particle.speedX * normalX + particle.speedY * normalY;
            particle.speedX = particle.speedX - 2 * dotProduct * normalX;
            particle.speedY = particle.speedY - 2 * dotProduct * normalY;
            
            // Apply bounce multiplier for more energetic bounces
            particle.speedX *= bounceMultiplier;
            particle.speedY *= bounceMultiplier;
            
            // Move particle away from umbrella to prevent sticking
            const pushDistance = umbrellaRadius - distance + 2;
            particle.x = mouseX + normalX * umbrellaRadius;
            particle.y = mouseY + normalY * umbrellaRadius;
          }
        }
        
        // Apply velocity if no collision
        if (!hitUmbrella) {
          particle.x += particle.speedX;
          particle.y += particle.speedY;
        }
        
        // Wrap around when particle reaches edges
        if (particle.y > canvas.height + particle.size) {
          // Reset particle to its side of origin with stronger diagonal movement
          particle.y = -particle.size * 2;
          
          if (particle.side === 'left') {
            particle.x = Math.random() * (canvas.width * 0.2) - (canvas.width * 0.1);
            particle.speedX = diagonalDrift * (1.2 + Math.random() * 0.5);
            particle.speedY = fallSpeed * (1 + Math.random() * 0.5);
          } else {
            particle.x = canvas.width - Math.random() * (canvas.width * 0.2) + (canvas.width * 0.1);
            particle.speedX = -diagonalDrift * (1.2 + Math.random() * 0.5);
            particle.speedY = fallSpeed * (1 + Math.random() * 0.5);
          }
        }
        
        // Wrap around horizontally with stronger reset
        if (particle.x < -particle.size * 2) {
          particle.x = canvas.width + particle.size * 2;
        } else if (particle.x > canvas.width + particle.size * 2) {
          particle.x = -particle.size * 2;
        }
        
        // Strong gravity effect for faster falling
        particle.speedY += 0.03;
        particle.speedY = Math.min(particle.speedY, fallSpeed * 4);
        
        // Very gentle damping to maintain diagonal movement
        particle.speedX *= 0.99;
        
        // Keep a minimum horizontal speed to maintain diagonal effect
        if (particle.side === 'left' && particle.speedX < diagonalDrift * 0.5) {
          particle.speedX = diagonalDrift * 0.5;
        } else if (particle.side === 'right' && particle.speedX > -diagonalDrift * 0.5) {
          particle.speedX = -diagonalDrift * 0.5;
        }
        
        // Draw particle
        ctx.beginPath();
        
        // Create gradient for visual appeal
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${particle.opacity})`);
        gradient.addColorStop(0.7, `rgba(255, 255, 255, ${particle.opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        // Subtle glow effect
        ctx.shadowBlur = particle.glow;
        ctx.shadowColor = `rgba(255, 255, 255, ${particle.opacity * 0.3})`;
        
        ctx.fillStyle = gradient;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Reset shadow
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
    
    console.log("Fast Diagonal Particles: Animation started");
  }
})();
