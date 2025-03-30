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
    const particleSize = 3;
    const particleColor = 'rgba(255, 255, 255, 0.8)';
    const lineColor = 'rgba(255, 255, 255, 0.5)';
    const lineDistance = 150;
    const moveSpeed = 0.7; // Increased base movement speed
    
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
          originalRadius: radius, // Store original radius for scaling effects
          vx: Math.random() * moveSpeed * 2 - moveSpeed,
          vy: Math.random() * moveSpeed * 2 - moveSpeed,
          color: particleColor,
          wasAffected: 0 // For tracking cursor interaction state
        });
      }
      console.log("Particles.js: Created", particles.length, "particles");
    }
    
    // Mouse interaction
    let mouseX = null;
    let mouseY = null;
    const mouseRadius = 200;
    
    function handleMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
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
        
        // Mouse interaction - umbrella effect (keeps particles away from cursor)
        if (mouseX !== null && mouseY !== null) {
          const dx = mouseX - particle.x;
          const dy = mouseY - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const umbrellaRadius = 80; // Size of the "empty" space around cursor
          
          if (distance < mouseRadius) {
            // Strong repulsion when inside the cursor's influence zone
            // Force is strongest when close to the umbrella boundary
            let force;
            
            if (distance < umbrellaRadius) {
              // Inside the umbrella - very strong force pushing outward
              force = 0.3 * (umbrellaRadius / (distance + 5)); // +5 prevents division by zero
              
              // Push particle away from cursor
              const angle = Math.atan2(dy, dx);
              particle.vx = -Math.cos(angle) * force;
              particle.vy = -Math.sin(angle) * force;
              
              // Make particles glow red when being strongly repelled
              particle.color = `rgba(255, 160, 160, ${0.7 + 0.3 * Math.min(force/2, 1)})`;
            } else {
              // Outside umbrella but within influence - milder repulsion
              force = 0.08 * (mouseRadius - distance) / (mouseRadius - umbrellaRadius);
              
              // Push particle away from cursor, but less strongly
              const angle = Math.atan2(dy, dx);
              particle.vx -= Math.cos(angle) * force;
              particle.vy -= Math.sin(angle) * force;
              
              // Particles in the outer zone turn light blue
              particle.color = `rgba(180, 230, 255, ${0.7 + 0.3 * force})`;
            }
            
            // Track that this particle was affected by cursor
            particle.wasAffected = 10; // Will persist for 10 frames
          } else {
            // If particle was recently affected but now isn't
            if (particle.wasAffected > 0) {
              particle.wasAffected--;
              
              // Gradually fade back to original color
              if (particle.wasAffected === 0) {
                particle.color = particleColor;
                particle.radius = particle.originalRadius; // Reset radius just in case
              }
            }
          }
        }
        
        // Apply very mild damping to maintain momentum
        particle.vx *= 0.995;
        particle.vy *= 0.995;
        
        // Add tiny random movement to ensure particles always move
        particle.vx += (Math.random() - 0.5) * 0.03;
        particle.vy += (Math.random() - 0.5) * 0.03;
        
        // Ensure minimum movement speed
        const minSpeed = 0.1;
        const currentSpeed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (currentSpeed < minSpeed) {
          // If moving too slowly, give a small boost in current direction
          particle.vx = particle.vx === 0 ? (Math.random() - 0.5) * minSpeed : particle.vx * (minSpeed / currentSpeed);
          particle.vy = particle.vy === 0 ? (Math.random() - 0.5) * minSpeed : particle.vy * (minSpeed / currentSpeed);
        }
        
        // Strict velocity limiting only for excessive speeds
        const maxSpeed = 2.0; // Higher max speed
        if (currentSpeed > maxSpeed) {
          particle.vx = (particle.vx / currentSpeed) * maxSpeed;
          particle.vy = (particle.vy / currentSpeed) * maxSpeed;
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color || particleColor;
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
    
    console.log("Particles.js: Animation started");
  }
})();
