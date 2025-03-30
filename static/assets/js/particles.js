// Particles Background Script
// Add this script to any webpage to create a nice white particles background

(function() {
  // Wait for the DOM to be fully loaded before initializing
  document.addEventListener('DOMContentLoaded', initParticlesBackground);
  
  // If the DOM is already loaded, run initialization immediately
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initParticlesBackground, 1);
  }
  
  function initParticlesBackground() {
    console.log("Particles.js: Initializing background effect");
    
    // Create canvas element  
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas to cover the entire background
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '1'; // Make sure it's behind everything
    canvas.style.pointerEvents = 'none'; // Allow clicking through canvas
    
    // Add a class for easier debugging
    canvas.classList.add('particles-js-canvas');
    
    // Append canvas to body
    document.body.appendChild(canvas);
    
    // Particle settings
    const particleCount = 100;
    const particleSize = 3; // Increased size for better visibility
    const particleColor = 'rgba(255, 255, 255, 0.8)'; // More opacity
    const lineColor = 'rgba(255, 255, 255, 0.5)'; // Brighter connecting lines
    const lineDistance = 150;
    const moveSpeed = 0.3; // Slower movement
    
    // Array to store particles
    let particles = [];
    
    // Resize handler - this needs to happen immediately and on resize
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log("Particles.js: Canvas resized to", canvas.width, "x", canvas.height);
    }
    
    // Initialize particles
    function initParticles() {
      particles = [];
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * particleSize + 1.5, // Slightly larger minimum size
          vx: Math.random() * moveSpeed * 2 - moveSpeed,
          vy: Math.random() * moveSpeed * 2 - moveSpeed
        });
      }
      console.log("Particles.js: Created", particles.length, "particles");
    }
    
    // Draw particles
    function drawParticles() {
      // Clear the canvas completely on each frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw each particle
      for (let i = 0; i < particles.length; i++) {
        let particle = particles[i];
        
        // Move particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.vx = -particle.vx;
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.vy = -particle.vy;
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();
        
        // Draw connecting lines
        for (let j = i + 1; j < particles.length; j++) {
          let otherParticle = particles[j];
          let dx = particle.x - otherParticle.x;
          let dy = particle.y - otherParticle.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < lineDistance) {
            ctx.beginPath();
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1.2 * (1 - distance / lineDistance); // Thicker and brighter lines
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
            
            // Add a small glow effect to the connections
            if (distance < lineDistance * 0.5) {
              ctx.beginPath();
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
              ctx.lineWidth = 2.5 * (1 - distance / lineDistance);
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.stroke();
            }
          }
        }
      }
      
      // Request next animation frame
      requestAnimationFrame(drawParticles);
    }
    
    // Mouse interaction
    let mouseX = null;
    let mouseY = null;
    const mouseRadius = 200; // Larger interaction radius
    
    function handleMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      particles.forEach(particle => {
        if (mouseX === null || mouseY === null) return;
        
        const dx = mouseX - particle.x;
        const dy = mouseY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouseRadius) {
          // New cursor interaction: particles move in a circular pattern around cursor
          // Calculate angle and create circular motion
          const angle = Math.atan2(dy, dx) + Math.PI/2; // Perpendicular to the cursor direction
          const force = (mouseRadius - distance) / mouseRadius;
          
          // Apply circular motion
          particle.vx += Math.cos(angle) * force * 0.2;
          particle.vy += Math.sin(angle) * force * 0.2;
          
          // Add slight attraction to keep particles near cursor
          particle.vx += dx * force * 0.001;
          particle.vy += dy * force * 0.001;
          
          // Limit velocity
          const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
          if (speed > 2) {
            particle.vx = (particle.vx / speed) * 2;
            particle.vy = (particle.vy / speed) * 2;
          }
        }
      });
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
    
    console.log("Particles.js: Animation started");
  }
})();
