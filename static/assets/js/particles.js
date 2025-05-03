// Fast Falling Particles with Pure Umbrella Bounce Effect
// Rapid diagonal movement with energetic umbrella physics

(function() {
  // Wait for the DOM to be fully loaded before initializing
  document.addEventListener('DOMContentLoaded', initParticlesBackground);
  
  // If the DOM is already loaded, run initialization immediately
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initParticlesBackground, 1);
  }
  
  function initParticlesBackground() {
    console.log("Fast Umbrella Particles: Initializing background effect");
    
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
    canvas.classList.add('fast-umbrella-particles-canvas');
    
    // Append canvas to body
    document.body.appendChild(canvas);
    
    // Particle settings
    const particleCount = 200;
    const minSize = 1.5;
    const maxSize = 3.5;
    const baseOpacity = 0.4;
    const fallSpeed = 1.5; // Much faster falling speed
    const diagonalDrift = 0.8; // Faster diagonal movement
    
    // Array to store particles
    let particles = [];
    
    // Resize handler
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log("Fast Umbrella Particles: Canvas resized to", canvas.width, "x", canvas.height);
    }
    
    // Initialize particles
    function initParticles() {
      particles = [];
      
      for (let i = 0; i < particleCount; i++) {
        // Create particles coming from left and right sides
        const side = Math.random() < 0.5 ? 'left' : 'right';
        let startX, startY, speedX, speedY;
        
        if (side === 'left') {
          // Spawn from left side, moving diagonally down-right
          startX = Math.random() * (canvas.width * 0.1); // First 10% from left
          startY = Math.random() * canvas.height;
          speedX = diagonalDrift * (1 + Math.random() * 0.2); // Right direction
        } else {
          // Spawn from right side, moving diagonally down-left  
          startX = canvas.width - Math.random() * (canvas.width * 0.1); // Last 10% from right
          startY = Math.random() * canvas.height;
          speedX = -diagonalDrift * (1 + Math.random() * 0.2); // Left direction
        }
        
        const size = minSize + Math.random() * (maxSize - minSize);
        const opacity = baseOpacity * (0.7 + Math.random() * 0.3);
        
        particles.push({
          x: startX,
          y: startY,
          size: size,
          opacity: opacity,
          speedY: fallSpeed * (1 + Math.random() * 0.3), // Faster and more variable downward speed
          speedX: speedX,
          // Keep glow for visual effect
          glow: Math.random() * 1.5
        });
      }
      console.log("Fast Umbrella Particles: Created", particles.length, "particles");
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
          particle.y = -particle.size;
          // Reset horizontal position randomly on the spawning side
          if (particle.speedX > 0) {
            particle.x = Math.random() * (canvas.width * 0.1);
          } else {
            particle.x = canvas.width - Math.random() * (canvas.width * 0.1);
          }
          // Reset to initial speed when wrapping
          particle.speedY = fallSpeed * (1 + Math.random() * 0.3);
        }
        
        // Wrap around horizontally
        if (particle.x < -particle.size) {
          particle.x = canvas.width + particle.size;
        } else if (particle.x > canvas.width + particle.size) {
          particle.x = -particle.size;
        }
        
        // Accelerated gravity effect for faster falling
        particle.speedY += 0.01;
        particle.speedY = Math.min(particle.speedY, fallSpeed * 3);
        
        // Maintain diagonal drift with gentle damping
        particle.speedX *= 0.985;
        
        // Draw particle - no interaction-based style changes
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
    
    console.log("Fast Umbrella Particles: Animation started");
  }
})();
