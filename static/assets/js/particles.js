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
    canvas.style.zIndex = '0'; // Make sure it's behind everything
    canvas.style.pointerEvents = 'none'; // Allow clicking through canvas
    
    // Add a class for easier debugging
    canvas.classList.add('particles-js-canvas');
    
    // Append canvas to body
    document.body.appendChild(canvas);
    
    // Particle settings
    const particleCount = 100;
    const particleSize = 3;
    const particleColor = 'rgba(255, 255, 255, 0.8)';
    const lineColor = 'rgba(255, 255, 255, 0.5)';
    const lineDistance = 150;
    const moveSpeed = 0.7;
    
    // Cursor interaction settings
    const minDistance = 80; // Particles can't get closer than this to cursor
    const attractRadius = 250; // Maximum attraction distance
    
    // Array to store particles
    let particles = [];
    
    // Resize handler
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log("Particles.js: Canvas resized to", canvas.width, "x", canvas.height);
    }
    
    // Initialize particles
    function initParticles() {
      particles = [];
      
      for (let i = 0; i < particleCount; i++) {
        const radius = Math.random() * particleSize + 1.5;
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: radius,
          originalRadius: radius,
          vx: Math.random() * moveSpeed * 2 - moveSpeed,
          vy: Math.random() * moveSpeed * 2 - moveSpeed,
          color: particleColor
        });
      }
      console.log("Particles.js: Created", particles.length, "particles");
    }
    
    // Mouse interaction
    let mouseX = null;
    let mouseY = null;
    
    function handleMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
    
    // Draw particles
    function drawParticles() {
      // Clear the canvas completely on each frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // First update all particle positions
      updateParticles();
      
      // Then draw connections
      drawConnections();
      
      // Then draw particles on top
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      }
      
      // Request next animation frame
      requestAnimationFrame(drawParticles);
    }
    
    // Update particle positions and properties
    function updateParticles() {
      for (let i = 0; i < particles.length; i++) {
        let particle = particles[i];
        
        // Mouse interaction - attraction with minimum distance
        if (mouseX !== null && mouseY !== null) {
          const dx = mouseX - particle.x;
          const dy = mouseY - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < attractRadius) {
            if (distance < minDistance) {
              // Too close - push away to maintain minimum distance
              const pushStrength = 0.5 * (1 - distance / minDistance);
              const angle = Math.atan2(dy, dx);
              particle.vx -= Math.cos(angle) * pushStrength;
              particle.vy -= Math.sin(angle) * pushStrength;
              
              // Make particles brighter
              particle.color = 'rgba(255, 255, 255, 1.0)';
              particle.radius = particle.originalRadius * 1.5;
            } else {
              // Pull towards cursor
              const pullStrength = 0.2 * (1 - distance / attractRadius);
              particle.vx += dx * pullStrength * 0.01;
              particle.vy += dy * pullStrength * 0.01;
              
              // Make particles slightly brighter
              const brightness = 0.8 + 0.2 * (1 - distance / attractRadius);
              particle.color = `rgba(255, 255, 255, ${brightness})`;
              particle.radius = particle.originalRadius * (1 + 0.5 * (1 - distance / attractRadius));
            }
          } else {
            // Reset color and size if not affected
            particle.color = particleColor;
            particle.radius = particle.originalRadius;
          }
        }
        
        // Move particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Add tiny random movement
        particle.vx += (Math.random() - 0.5) * 0.03;
        particle.vy += (Math.random() - 0.5) * 0.03;
        
        // Apply very mild friction
        particle.vx *= 0.99;
        particle.vy *= 0.99;
        
        // Ensure minimum movement speed
        const minSpeed = 0.1;
        const currentSpeed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (currentSpeed < minSpeed) {
          particle.vx = particle.vx === 0 ? (Math.random() - 0.5) * minSpeed : particle.vx * (minSpeed / currentSpeed);
          particle.vy = particle.vy === 0 ? (Math.random() - 0.5) * minSpeed : particle.vy * (minSpeed / currentSpeed);
        }
        
        // Maximum speed limit
        const maxSpeed = 3.0;
        if (currentSpeed > maxSpeed) {
          particle.vx = (particle.vx / currentSpeed) * maxSpeed;
          particle.vy = (particle.vy / currentSpeed) * maxSpeed;
        }
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.vx = -particle.vx;
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.vy = -particle.vy;
        }
      }
    }
    
    // Draw connections between particles
    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        
        for (let j = i + 1; j < particles.length; j++) {
          const otherParticle = particles[j];
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < lineDistance) {
            ctx.beginPath();
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1.2 * (1 - distance / lineDistance);
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
