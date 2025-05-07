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
    console.log("Upward Particles: Initializing background effect");
    
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
      console.log("Upward Particles: Canvas resized to", canvas.width, "x", canvas.height);
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
      console.log("Upward Particles: Created", particles.length, "particles");
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
    let redParticleIndex = -1; // Keep track of the index
    
    // Function to spawn a special red particle
    function spawnSpecialRedParticle(force = false) {
      console.log("🔴 Attempting to spawn red particle...");
      
      // Remove any existing red particles if forced
      if (force && hasSpecialRedParticle) {
        console.log("🔴 Force flag is true, removing existing red particle");
        if (redParticleIndex >= 0 && redParticleIndex < particles.length) {
          particles.splice(redParticleIndex, 1);
          console.log("🔴 Removed existing red particle at index:", redParticleIndex);
        } else {
          console.log("🔴 Could not find red particle at index:", redParticleIndex);
          // Search for it
          for (let i = 0; i < particles.length; i++) {
            if (particles[i].isSpecialRed) {
              particles.splice(i, 1);
              console.log("🔴 Found and removed red particle at index:", i);
              break;
            }
          }
        }
        hasSpecialRedParticle = false;
        redParticleIndex = -1;
      }
      
      // Only spawn if there isn't already a special red particle
      if (!hasSpecialRedParticle) {
        console.log("🔴 Creating new red particle");
        
        // Always spawn on the left for testing
        const particleX = 50; // Fixed position for debugging
        const particleY = canvas.height - 20; // Just inside bottom edge
        
        // Create a GIANT red particle for testing
        const size = maxSize * 8; // Massive size for testing
        
        // Add the red particle
        particles.push({
          x: particleX,
          y: particleY,
          size: size,
          opacity: 1.0, // Full opacity
          // Very slow upward movement for testing
          speedY: -0.3, // Super slow
          speedX: 0, // No horizontal movement for testing
          // Original speed reference
          originalSpeedY: -0.3,
          originalSpeedX: 0,
          blur: 10, // Extreme glow
          isSpecialRed: true,
          pulsePhase: 0,
          // For debugging
          debugName: "RED_PARTICLE"
        });
        
        // Store the index of the red particle
        redParticleIndex = particles.length - 1;
        hasSpecialRedParticle = true;
        
        // Log detailed info
        console.log("🔴 RED PARTICLE CREATED:", 
          {
            index: redParticleIndex,
            position: `X: ${particleX}, Y: ${particleY}`,
            size: size,
            speed: `X: 0, Y: -0.3 (very slow)`
          }
        );
        
        // Check if it actually exists
        setTimeout(() => {
          let found = false;
          for (let i = 0; i < particles.length; i++) {
            if (particles[i].isSpecialRed) {
              found = true;
              console.log("🔴 Red particle verified at index:", i, "position:", 
                {x: particles[i].x, y: particles[i].y});
              break;
            }
          }
          if (!found) {
            console.log("🔴 ERROR: Red particle was not found in particles array after creation");
          }
        }, 100);
        
      } else {
        console.log("🔴 Red particle already exists, not spawning a new one");
      }
    }
    
    // Log the current position of the red particle for debugging
    function logRedParticlePosition() {
      if (hasSpecialRedParticle && redParticleIndex >= 0 && redParticleIndex < particles.length) {
        const rp = particles[redParticleIndex];
        if (rp && rp.isSpecialRed) {
          console.log("🔴 Red particle position:", 
            {x: rp.x, y: rp.y, visible: rp.y > 0 && rp.y < canvas.height});
        } else {
          console.log("🔴 Red particle at index", redParticleIndex, "is not marked as special");
        }
      } else if (hasSpecialRedParticle) {
        console.log("🔴 Red particle index is invalid:", redParticleIndex);
        // Try to find it
        let found = false;
        for (let i = 0; i < particles.length; i++) {
          if (particles[i].isSpecialRed) {
            redParticleIndex = i;
            found = true;
            console.log("🔴 Found red particle at index:", i);
            break;
          }
        }
        if (!found) {
          console.log("🔴 Could not find red particle in array despite hasSpecialRedParticle=true");
          hasSpecialRedParticle = false;
        }
      }
    }
    
    // Check if special particles are still visible
    function checkSpecialRedParticle() {
      // For debugging - log position every second
      if (hasSpecialRedParticle && Math.random() < 0.01) { // roughly once per second at 60fps
        logRedParticlePosition();
      }
      
      // Look through all particles
      for (let i = 0; i < particles.length; i++) {
        if (particles[i].isSpecialRed && particles[i].y < -100) { // Give extra room
          // Red particle has left the screen
          console.log("🔴 Red particle left the screen, removing it");
          particles.splice(i, 1);
          hasSpecialRedParticle = false;
          redParticleIndex = -1;
          break;
        }
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
    
    // Add console command for testing
    window.spawnRedParticle = function() {
      console.log("🔴 spawnRedParticle() called from console");
      spawnSpecialRedParticle(true); // Force a new red particle
      setTimeout(logRedParticlePosition, 500); // Log position after half a second
      return "Giant red particle spawned at left side. Check console for tracking info.";
    };
    
    // Add commands to check status
    window.checkRedParticle = function() {
      console.log("🔴 Manual check requested");
      logRedParticlePosition();
      return "Red particle status logged to console";
    };
    
    // Start the timer
    startSpecialRedParticleTimer();
    
    // For testing purposes, spawn one right away
    setTimeout(() => {
      console.log("🔴 Initial spawn timeout triggered");
      spawnSpecialRedParticle();
    }, 5000); // Spawn first one after 5 seconds
    
    // ======== SPECIAL RED PARTICLE FEATURE - END ========
    
    // Draw particles
    function drawParticles() {
      // Complete clear with no trail effect
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Umbrella is now invisible - no visualization
      
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
          
          // EXTREME neon red particle - impossible to miss
          
          // First draw a black border for contrast
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size + 4, 0, Math.PI * 2);
          ctx.fill();
          
          // Super neon red particle with intense glow
          ctx.fillStyle = 'rgba(255, 0, 60, 1.0)';
          ctx.shadowColor = 'rgba(255, 0, 80, 1)';
          ctx.shadowBlur = particle.blur + (Math.sin(particle.pulsePhase) * 3);
          
          // Draw the dot with extra glow for neon effect
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw a second smaller, brighter core 
          ctx.fillStyle = 'rgba(255, 220, 220, 0.9)';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
          
          // Even brighter center
          ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 0.25, 0, Math.PI * 2);
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
    
    console.log("Upward Particles: Animation started");
    console.log("Use 'spawnRedParticle()' in the console to spawn a special red particle for testing");
    console.log("Use 'checkRedParticle()' to check status of the red particle");
  }
})();
