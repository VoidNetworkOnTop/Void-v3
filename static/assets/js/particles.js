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
    
    // Function to spawn a special red particle
    function spawnSpecialRedParticle(force = false) {
      // Remove any existing red particles if forced
      if (force && hasSpecialRedParticle) {
        for (let i = 0; i < particles.length; i++) {
          if (particles[i].isSpecialRed) {
            particles.splice(i, 1);
            break;
          }
        }
        hasSpecialRedParticle = false;
      }
      
      // Only spawn if there isn't already a special red particle
      if (!hasSpecialRedParticle) {
        console.log("Special neon red particle spawned");
        
        // Create the special red particle
        const size = maxSize * 3; // Make it extremely large for visibility
        particles.push({
          x: Math.random() * canvas.width,
          y: canvas.height, // Start at the bottom
          size: size,
          opacity: 1.0, // Full opacity for maximum visibility
          // Slower upward movement
          speedY: -(floatSpeedMin * 0.5), // Make it slower so it's easier to see
          speedX: (Math.random() - 0.5) * horizontalDrift,
          // Original speed for reference
          originalSpeedY: -(floatSpeedMin * 0.5),
          originalSpeedX: (Math.random() - 0.5) * horizontalDrift,
          blur: 8, // Extreme glow for neon effect
          isSpecialRed: true, // Flag for special particle
          pulsePhase: 0 // For pulsing effect
        });
        
        hasSpecialRedParticle = true;
        
        // Log the particle for debugging
        console.log("RED PARTICLE DETAILS:", particles[particles.length - 1]);
      } else {
        console.log("Red particle already exists, not spawning a new one.");
      }
    }
    
    // Function to check if special particles are still visible
    function checkSpecialRedParticle() {
      // Look through all particles
      for (let i = 0; i < particles.length; i++) {
        if (particles[i].isSpecialRed && particles[i].y < 0) {
          // Red particle has left the screen
          console.log("Red particle left the screen, removing it");
          particles.splice(i, 1);
          hasSpecialRedParticle = false;
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
      spawnSpecialRedParticle(true); // Force a new red particle
      return "Super neon red particle spawned. Try moving your cursor near it - it won't be affected!";
    };
    
    // Start the timer
    startSpecialRedParticleTimer();
    
    // For testing purposes, spawn one right away
    setTimeout(() => spawnSpecialRedParticle(), 5000); // Spawn first one after 5 seconds
    
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
          
          // Super neon red particle with intense glow
          ctx.fillStyle = `rgba(255, 0, 60, ${particle.opacity})`;
          ctx.shadowColor = 'rgba(255, 50, 80, 1)'; // More intense shadow for neon glow
          ctx.shadowBlur = particle.blur + (Math.sin(particle.pulsePhase) * 3);
          
          // Draw the dot with extra glow for neon effect
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw a second smaller, brighter core for the neon effect
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
  }
})();
