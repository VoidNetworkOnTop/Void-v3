// Upward Floating Particles with Hard Umbrella Effect
// Particles float upward and bounce off a hard umbrella barrier around the cursor

(function() {
  // Wait for the DOM to be fully loaded before initializing
  document.addEventListener('DOMContentLoaded', initParticlesBackground);
  
  // If the DOM is already loaded, run initialization immediately
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initParticlesBackground, 1);
  }
  
  function initParticlesBackground() {
    // Create canvas element  
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas to cover the entire background
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '1000'; // Higher z-index to ensure clicks reach it
    canvas.style.pointerEvents = 'auto'; // Allow clicks on canvas but keep default cursor
    canvas.style.cursor = 'default'; // Default cursor
    
    // Add a class for easier reference
    canvas.classList.add('floating-particles-canvas');
    
    // Append canvas to body
    document.body.appendChild(canvas);
    
    // Particle settings - increased count and speed
    const particleCount = 300; // More particles
    const minSize = 1.5;
    const maxSize = 4;
    const baseOpacity = 0.3;
    const floatSpeedMin = 1.5; // Much faster upward movement
    const floatSpeedMax = 3.0;
    const horizontalDrift = 0.8; // Maximum horizontal movement for diagonal effect
    
    // Array to store particles
    let particles = [];
    
    // Resize handler
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    // Initialize particles
    function initParticles() {
      particles = [];
      
      for (let i = 0; i < particleCount; i++) {
        // Create particles at random positions starting from the bottom
        const size = minSize + Math.random() * (maxSize - minSize);
        const opacity = baseOpacity * (0.4 + Math.random() * 0.6);
        
        particles.push({
          x: Math.random() * canvas.width,
          y: canvas.height - Math.random() * 50, // Start near bottom
          size: size,
          opacity: opacity,
          // More varied diagonal movement
          speedY: -(floatSpeedMin + Math.random() * (floatSpeedMax - floatSpeedMin)),
          speedX: (Math.random() - 0.5) * horizontalDrift * 2, // Double horizontal variation
          // Original speed for return to natural movement
          originalSpeedY: -(floatSpeedMin + Math.random() * (floatSpeedMax - floatSpeedMin)),
          originalSpeedX: (Math.random() - 0.5) * horizontalDrift * 2,
          // Each particle gets a slight blur effect for smoother appearance
          blur: Math.random() * 2,
          isSpecialRed: false // Flag for normal particles
        });
      }
    }
    
    // Mouse interaction - hard umbrella effect
    let mouseX = null;
    let mouseY = null;
    const umbrellaRadius = 100; // Radius of the umbrella
    
    function handleMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
    
    // Check if particle will hit the umbrella in next frame
    function checkUmbrellaCollision(particle, nextX, nextY) {
      // Special red particles ignore umbrella
      if (particle.isSpecialRed) return false;
      
      if (mouseX === null || mouseY === null) return false;
      
      const dx = mouseX - nextX;
      const dy = mouseY - nextY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if particle would be inside umbrella or just touching it
      return distance < (umbrellaRadius + particle.size);
    }
    
    // Handle collision and redirect particle
    function handleUmbrellaCollision(particle) {
      if (mouseX === null || mouseY === null) return;
      
      // Calculate distance to umbrella center
      const dx = mouseX - particle.x;
      const dy = mouseY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If particle is already inside, push it out
      if (distance < umbrellaRadius + particle.size) {
        // Push particle outside umbrella
        const pushFactor = (umbrellaRadius + particle.size) / distance;
        particle.x = mouseX - dx * pushFactor;
        particle.y = mouseY - dy * pushFactor;
      }
      
      // Calculate collision normal (direction from collision point)
      const normal = {
        x: (particle.x - mouseX) / distance,
        y: (particle.y - mouseY) / distance
      };
      
      // Reflect velocity off umbrella surface
      const dotProduct = particle.speedX * normal.x + particle.speedY * normal.y;
      particle.speedX = particle.speedX - 2 * dotProduct * normal.x;
      particle.speedY = particle.speedY - 2 * dotProduct * normal.y;
      
      // Add some bounce intensity to make it feel more solid
      const bounceIntensity = 1.2;
      particle.speedX *= bounceIntensity;
      particle.speedY *= bounceIntensity;
    }
    
    // ======== SPECIAL RED PARTICLE FEATURE - START ========
    // This section adds a special red particle that appears randomly once per hour
    // and is immune to the umbrella effect. Can be removed if not needed.
    
    // Variables for special red particle
    let hasSpecialRedParticle = false;
    let specialRedParticleTimer = null;
    
    // Function to spawn a special red particle
    function spawnSpecialRedParticle() {
      // Only spawn if there isn't already a special red particle
      if (!hasSpecialRedParticle) {
        // Determine left or right side (avoiding middle)
        let particleX;
        
        // Define the middle section (30% of screen width)
        const middleStart = canvas.width * 0.35;
        const middleEnd = canvas.width * 0.65;
        
        // Randomly choose left or right side
        if (Math.random() < 0.5) {
          // Left side - 0 to 35% of screen width
          particleX = Math.random() * middleStart;
        } else {
          // Right side - 65% to 100% of screen width
          particleX = middleEnd + Math.random() * (canvas.width - middleEnd);
        }
        
        // Make the red particle similar to normal ones but still special
        const size = minSize + Math.random() * (maxSize - minSize) * 1.5; // Slightly larger than average
        
        // Calculate speeds similar to normal particles
        const speedY = -(floatSpeedMin + Math.random() * (floatSpeedMax - floatSpeedMin));
        const speedX = (Math.random() - 0.5) * horizontalDrift;
        
        // Add the red particle
        particles.push({
          x: particleX,
          y: canvas.height, // Start at the bottom
          size: size,
          opacity: 0.8, // More visible than regular particles
          // Normal movement speed
          speedY: speedY,
          speedX: speedX,
          // Original speed reference
          originalSpeedY: speedY,
          originalSpeedX: speedX,
          blur: 3, // Slight glow, not overwhelming
          isSpecialRed: true,
          pulsePhase: 0
        });
        
        hasSpecialRedParticle = true;
      }
    }
    
    // Check if special particles are still visible
    function checkSpecialRedParticle() {
      // Look through all particles
      for (let i = 0; i < particles.length; i++) {
        if (particles[i].isSpecialRed && particles[i].y < 0) {
          // Red particle has left the screen
          particles.splice(i, 1);
          hasSpecialRedParticle = false;
          break;
        }
      }
    }
    
    // Function to check if a click hit the red particle
    function checkRedParticleClick(clickX, clickY) {
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        if (particle.isSpecialRed) {
          // Calculate distance between click and particle
          const dx = clickX - particle.x;
          const dy = clickY - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Check if click is within particle radius - using a much larger hit area
          if (distance <= particle.size * 4) { // Much larger hit area for easier clicking
            return true;
          }
        }
      }
      return false;
    }
    
    // Handle click on canvas
    function handleCanvasClick(e) {
      e.preventDefault(); // Prevent default behavior
      e.stopPropagation(); // Stop propagation to ensure the click is captured
      
      const clickX = e.clientX;
      const clickY = e.clientY;
      
      // Check if the red particle was clicked
      if (checkRedParticleClick(clickX, clickY)) {
        // Navigate to the specified URL
        window.location.href = window.location.origin + '/assets/html/footer2.html';
      }
    }
    
    // Start the hourly timer for spawning the special red particle
    function startSpecialRedParticleTimer() {
      // Clear any existing timer
      if (specialRedParticleTimer) {
        clearInterval(specialRedParticleTimer);
      }
      
      // Set timer to spawn a red particle every hour (3600000 ms)
      specialRedParticleTimer = setInterval(() => {
        spawnSpecialRedParticle();
      }, 3600000); // Every hour
    }
    
    // For testing purposes, spawn one right away
    setTimeout(() => spawnSpecialRedParticle(), 5000); // Spawn first one after 5 seconds
    
    // ======== SPECIAL RED PARTICLE FEATURE - END ========
    
    // Draw particles
    function drawParticles() {
      // Complete clear with no trail effect
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw each particle
      for (let i = 0; i < particles.length; i++) {
        let particle = particles[i];
        
        // Calculate next position
        let nextX = particle.x + particle.speedX;
        let nextY = particle.y + particle.speedY;
        
        // Check for umbrella collision before moving
        if (checkUmbrellaCollision(particle, nextX, nextY)) {
          // Handle the collision
          handleUmbrellaCollision(particle);
        } else {
          // Gradually return to natural movement
          particle.speedX += (particle.originalSpeedX - particle.speedX) * 0.05;
          particle.speedY += (particle.originalSpeedY - particle.speedY) * 0.05;
        }
        
        // Move particle
        particle.y += particle.speedY;
        particle.x += particle.speedX;
        
        // Wrap around when particle reaches top - respawn at bottom
        if (particle.y < 0) {
          // For regular particles only
          if (!particle.isSpecialRed) {
            particle.y = canvas.height;
            particle.x = Math.random() * canvas.width;
            // Reset to original speed
            particle.speedX = particle.originalSpeedX;
            particle.speedY = particle.originalSpeedY;
          } 
          // Special red particles will be cleaned up by checkSpecialRedParticle
        }
        
        // Wrap around sides too
        if (particle.x < 0) {
          particle.x = canvas.width;
        } else if (particle.x > canvas.width) {
          particle.x = 0;
        }
        
        // Choose color based on particle type
        if (particle.isSpecialRed) {
          // Update pulse phase for neon effect
          if (particle.pulsePhase !== undefined) {
            particle.pulsePhase = (particle.pulsePhase + 0.05) % (Math.PI * 2);
          }
          
          // Red particle - more subtle now
          ctx.fillStyle = 'rgba(255, 50, 50, ' + particle.opacity + ')';
          ctx.shadowColor = 'rgba(255, 0, 0, 0.7)';
          ctx.shadowBlur = particle.blur;
          
          // Draw the red dot
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Regular white particles
          ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
          
          // Use shadow blur for softer dots
          ctx.shadowBlur = particle.blur;
          
          // Draw the dot
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Reset shadow for better performance
        ctx.shadowBlur = 0;
      }
      
      // Check if the special red particle needs cleanup
      checkSpecialRedParticle();
      
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
    
    // Add click handler for red particle - using both mousedown and click for better detection
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousedown', handleCanvasClick); // Also try mousedown event
    
    // For debugging - temporary solution
    window.addEventListener('keydown', function(e) {
      // Press 'r' key to navigate to footer2.html (for testing)
      if (e.key === 'r') {
        window.location.href = window.location.origin + '/assets/html/footer2.html';
      }
    });
  }
})();
