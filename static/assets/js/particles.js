// Refined Diagonal Falling Particles with Umbrella Effect
// Particles fall from sides with elegant umbrella bounce around cursor

(function() {
  // Wait for the DOM to be fully loaded before initializing
  document.addEventListener('DOMContentLoaded', initParticlesBackground);
  
  // If the DOM is already loaded, run initialization immediately
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initParticlesBackground, 1);
  }
  
  function initParticlesBackground() {
    console.log("Refined Falling Particles: Initializing background effect");
    
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
    canvas.classList.add('refined-particles-canvas');
    
    // Append canvas to body
    document.body.appendChild(canvas);
    
    // Particle settings
    const particleCount = 200; // Increased for richer effect
    const minSize = 1.5;
    const maxSize = 3.5;
    const baseOpacity = 0.4; // Slightly more visible
    const fallSpeed = 0.8; // Significantly faster falling speed
    const diagonalDrift = 0.5; // More pronounced diagonal movement
    
    // Array to store particles
    let particles = [];
    
    // Resize handler
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log("Refined Falling Particles: Canvas resized to", canvas.width, "x", canvas.height);
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
          speedX = diagonalDrift * (0.8 + Math.random() * 0.4); // Right direction
        } else {
          // Spawn from right side, moving diagonally down-left  
          startX = canvas.width - Math.random() * (canvas.width * 0.1); // Last 10% from right
          startY = Math.random() * canvas.height;
          speedX = -diagonalDrift * (0.8 + Math.random() * 0.4); // Left direction
        }
        
        const size = minSize + Math.random() * (maxSize - minSize);
        const opacity = baseOpacity * (0.6 + Math.random() * 0.4); // Less opacity variation
        
        particles.push({
          x: startX,
          y: startY,
          size: size,
          opacity: opacity,
          speedY: fallSpeed * (0.8 + Math.random() * 0.4), // Faster downward speed
          speedX: speedX,
          // Each particle gets a slight glow effect
          glow: Math.random() * 1.5
        });
      }
      console.log("Refined Falling Particles: Created", particles.length, "particles");
    }
    
    // Mouse interaction - umbrella effect
    let mouseX = null;
    let mouseY = null;
    const umbrellaRadius = 60; // Smaller, more focused umbrella radius
    
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
            
            // Reflect particle's velocity
            const dotProduct = particle.speedX * normalX + particle.speedY * normalY;
            particle.speedX = particle.speedX - 2 * dotProduct * normalX;
            particle.speedY = particle.speedY - 2 * dotProduct * normalY;
            
            // Move particle away from umbrella to prevent sticking
            const pushDistance = umbrellaRadius - distance + 2;
            particle.x = mouseX + normalX * umbrellaRadius;
            particle.y = mouseY + normalY * umbrellaRadius;
            
            // Add slight random element to bounce for natural look
            particle.speedX += (Math.random() - 0.5) * 0.2;
            particle.speedY += (Math.random() - 0.5) * 0.2;
            
            // Brighten on collision
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(particle.opacity * 1.5, 0.9)})`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
          }
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
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
        }
        
        // Wrap around horizontally
        if (particle.x < -particle.size) {
          particle.x = canvas.width + particle.size;
        } else if (particle.x > canvas.width + particle.size) {
          particle.x = -particle.size;
        }
        
        // Gravity effect - slightly increase downward speed over time
        particle.speedY += 0.002;
        particle.speedY = Math.min(particle.speedY, fallSpeed * 1.5);
        
        // Limit horizontal speed to maintain diagonal effect
        particle.speedX *= 0.99;
        
        // Draw particle with refined appearance
        ctx.beginPath();
        
        // Create gradient for more refined look
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
      
      // Optional: Visualize umbrella area for debugging
      // if (mouseX !== null && mouseY !== null) {
      //   ctx.beginPath();
      //   ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      //   ctx.arc(mouseX, mouseY, umbrellaRadius, 0, Math.PI * 2);
      //   ctx.stroke();
      // }
      
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
    
    console.log("Refined Falling Particles: Animation started");
  }
})();
