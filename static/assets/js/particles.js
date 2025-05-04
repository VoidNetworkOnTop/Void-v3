// Upward Floating Particles with Umbrella Effect
// Particles float upward and bounce off a hard umbrella around the cursor

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
    
    // Particle settings
    const particleCount = 150;
    const minSize = 1.5;
    const maxSize = 4;
    const baseOpacity = 0.3;
    const floatSpeedMin = 0.5; // Faster upward movement
    const floatSpeedMax = 1.5;
    const horizontalDrift = 0.3; // More horizontal movement
    
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
          // Upward movement with random speed and direction
          speedY: -(floatSpeedMin + Math.random() * (floatSpeedMax - floatSpeedMin)),
          speedX: (Math.random() - 0.5) * horizontalDrift,
          // Original speed for return to natural movement
          originalSpeedY: -(floatSpeedMin + Math.random() * (floatSpeedMax - floatSpeedMin)),
          originalSpeedX: (Math.random() - 0.5) * horizontalDrift,
          // Each particle gets a slight blur effect for smoother appearance
          blur: Math.random() * 2
        });
      }
      console.log("Upward Particles: Created", particles.length, "particles");
    }
    
    // Mouse interaction - umbrella effect
    let mouseX = null;
    let mouseY = null;
    const umbrellaRadius = 100; // Radius of the umbrella
    
    function handleMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
    
    // Check if particle hits the umbrella
    function checkUmbrellaCollision(particle) {
      if (mouseX === null || mouseY === null) return false;
      
      const dx = mouseX - particle.x;
      const dy = mouseY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      return distance < umbrellaRadius;
    }
    
    // Redirect particle around the umbrella
    function redirectParticle(particle) {
      if (mouseX === null || mouseY === null) return;
      
      const dx = mouseX - particle.x;
      const dy = mouseY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate angle to cursor
      const angle = Math.atan2(dy, dx);
      
      // Calculate bounce angle (redirect around the umbrella)
      const bounceAngle = angle + Math.PI; // Opposite direction
      
      // Set new speed to redirect around umbrella
      const redirectSpeed = 1.0;
      particle.speedX = Math.cos(bounceAngle) * redirectSpeed;
      particle.speedY = Math.sin(bounceAngle) * redirectSpeed;
    }
    
    // Draw particles
    function drawParticles() {
      // Complete clear with no trail effect
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw umbrella area for visualization (optional)
      if (mouseX !== null && mouseY !== null) {
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, umbrellaRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // Update and draw each particle
      for (let i = 0; i < particles.length; i++) {
        let particle = particles[i];
        
        // Check if particle hits umbrella
        if (checkUmbrellaCollision(particle)) {
          redirectParticle(particle);
        } else {
          // Gradually return to natural movement
          particle.speedX += (particle.originalSpeedX - particle.speedX) * 0.1;
          particle.speedY += (particle.originalSpeedY - particle.speedY) * 0.1;
        }
        
        // Move particle
        particle.y += particle.speedY;
        particle.x += particle.speedX;
        
        // Wrap around when particle reaches top - respawn at bottom
        if (particle.y < 0) {
          particle.y = canvas.height;
          particle.x = Math.random() * canvas.width;
          // Reset to original speed
          particle.speedX = particle.originalSpeedX;
          particle.speedY = particle.originalSpeedY;
        }
        
        // Wrap around sides too
        if (particle.x < 0) {
          particle.x = canvas.width;
        } else if (particle.x > canvas.width) {
          particle.x = 0;
        }
        
        // Draw particles with consistent opacity
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        
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
    
    console.log("Upward Particles: Animation started");
  }
})();
