// Modernized Particles Background Script
// Redesigned with a crystalline, abstract geometric style

(function() {
  // Wait for the DOM to be fully loaded before initializing
  document.addEventListener('DOMContentLoaded', initParticlesBackground);
  
  // If the DOM is already loaded, run initialization immediately
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initParticlesBackground, 1);
  }
  
  function initParticlesBackground() {
    console.log("Geometric Particles: Initializing background effect");
    
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
    canvas.classList.add('geometric-particles-canvas');
    
    // Append canvas to body
    document.body.appendChild(canvas);
    
    // Particle settings
    const particleCount = 70; // Fewer particles for a cleaner look
    const particleBaseSize = 2;
    const particleColor = 'rgba(255, 255, 255, 0.5)'; // More transparent by default
    const lineColor = 'rgba(255, 255, 255, 0.3)'; // More subtle connections
    const lineDistance = 180; // Longer connection distance
    const moveSpeed = 0.4; // Slower movement for more elegance
    
    // Array to store particles
    let particles = [];
    
    // Flow field parameters
    const flowFieldResolution = 50;
    let flowField = [];
    let flowAngle = 0;
    
    // Resize handler
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      generateFlowField(); // Regenerate flow field on resize
      console.log("Geometric Particles: Canvas resized to", canvas.width, "x", canvas.height);
    }
    
    // Generate a perlin-like flow field for more natural movement
    function generateFlowField() {
      flowField = [];
      const cols = Math.ceil(canvas.width / flowFieldResolution);
      const rows = Math.ceil(canvas.height / flowFieldResolution);
      
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // Create a vector field with some natural variation
          const angle = Math.sin(x * 0.1) * Math.cos(y * 0.1) * Math.PI * 2;
          flowField.push(angle);
        }
      }
    }
    
    // Update flow field animation
    function updateFlowField() {
      flowAngle += 0.002;
      for (let i = 0; i < flowField.length; i++) {
        const row = Math.floor(i / Math.ceil(canvas.width / flowFieldResolution));
        const col = i % Math.ceil(canvas.width / flowFieldResolution);
        flowField[i] = Math.sin(col * 0.1 + flowAngle) * Math.cos(row * 0.1 + flowAngle) * Math.PI * 2;
      }
    }
    
    // Initialize particles
    function initParticles() {
      particles = [];
      
      for (let i = 0; i < particleCount; i++) {
        const size = Math.random() * particleBaseSize + 1;
        const shapeType = Math.floor(Math.random() * 3); // 0=diamond, 1=line, 2=triangle
        
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: size,
          originalSize: size,
          vx: Math.random() * moveSpeed * 2 - moveSpeed,
          vy: Math.random() * moveSpeed * 2 - moveSpeed,
          color: particleColor,
          opacity: 0.3 + Math.random() * 0.5, // Varied opacity
          rotation: Math.random() * Math.PI * 2, // Random rotation
          rotationSpeed: (Math.random() * 0.02 - 0.01) * 0.3, // Very slow rotation
          shapeType: shapeType,
          pulsePhase: Math.random() * Math.PI * 2, // For pulsing effect
          wasAffected: 0 // For tracking cursor interaction state
        });
      }
      console.log("Geometric Particles: Created", particles.length, "particles");
    }
    
    // Mouse interaction
    let mouseX = null;
    let mouseY = null;
    const mouseRadius = 250;
    
    function handleMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
    
    // Draw a diamond shape
    function drawDiamond(ctx, x, y, size, rotation) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      ctx.beginPath();
      ctx.moveTo(0, -size * 2); // Top
      ctx.lineTo(size, 0);      // Right
      ctx.lineTo(0, size * 2);  // Bottom
      ctx.lineTo(-size, 0);     // Left
      ctx.closePath();
      
      ctx.fill();
      ctx.restore();
    }
    
    // Draw a line with varied thickness
    function drawLine(ctx, x, y, size, rotation) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      ctx.beginPath();
      ctx.moveTo(-size * 3, 0);
      ctx.lineTo(size * 3, 0);
      ctx.lineWidth = size / 2;
      ctx.stroke();
      
      ctx.restore();
    }
    
    // Draw a triangle
    function drawTriangle(ctx, x, y, size, rotation) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.5);
      ctx.lineTo(size * 1.3, size);
      ctx.lineTo(-size * 1.3, size);
      ctx.closePath();
      
      ctx.fill();
      ctx.restore();
    }
    
    // Draw particles
    function drawParticles() {
      // Clear the canvas completely on each frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update the flow field
      updateFlowField();
      
      // Update and draw each particle
      for (let i = 0; i < particles.length; i++) {
        let particle = particles[i];
        
        // Get flow field influence
        const col = Math.floor(particle.x / flowFieldResolution);
        const row = Math.floor(particle.y / flowFieldResolution);
        const index = row * Math.ceil(canvas.width / flowFieldResolution) + col;
        
        if (flowField[index] !== undefined) {
          // Apply subtle flow field influence
          const flowAngle = flowField[index];
          const flowForce = 0.05;
          
          particle.vx += Math.cos(flowAngle) * flowForce;
          particle.vy += Math.sin(flowAngle) * flowForce;
        }
        
        // Move particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Wrap around edges instead of bouncing (creates smoother flow)
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        // Rotate particle (very slowly)
        particle.rotation += particle.rotationSpeed;
        
        // Subtle pulsing effect
        particle.pulsePhase += 0.01;
        const pulseFactor = 0.15 * Math.sin(particle.pulsePhase) + 1; // Range between 0.85 and 1.15
        const currentSize = particle.originalSize * pulseFactor;
        
        // Mouse interaction - now creates a gentle attraction effect
        if (mouseX !== null && mouseY !== null) {
          const dx = mouseX - particle.x;
          const dy = mouseY - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < mouseRadius) {
            // Create a gentle swirl around cursor
            const swirl = 0.1;
            const angle = Math.atan2(dy, dx);
            const swirlAngle = angle + Math.PI / 2; // Perpendicular to the radius
            
            // Add perpendicular force (creates swirling)
            particle.vx += Math.cos(swirlAngle) * swirl * (mouseRadius - distance) / mouseRadius;
            particle.vy += Math.sin(swirlAngle) * swirl * (mouseRadius - distance) / mouseRadius;
            
            // Add slight attraction to mouse
            if (distance > 100) {
              const pull = 0.02;
              particle.vx += (dx / distance) * pull;
              particle.vy += (dy / distance) * pull;
            }
            
            // Brightening effect near mouse
            const brightnessFactor = 1 + 0.5 * (1 - distance / mouseRadius);
            particle.color = `rgba(255, 255, 255, ${Math.min(particle.opacity * brightnessFactor, 0.9)})`;
            
            particle.wasAffected = 10; // Will persist for 10 frames
          } else {
            // If particle was recently affected but now isn't
            if (particle.wasAffected > 0) {
              particle.wasAffected--;
              
              // Gradually fade back to original color
              if (particle.wasAffected === 0) {
                particle.color = `rgba(255, 255, 255, ${particle.opacity})`;
              }
            }
          }
        }
        
        // Apply very mild damping to maintain smooth momentum
        particle.vx *= 0.99;
        particle.vy *= 0.99;
        
        // Add tiny random movement for natural effect
        particle.vx += (Math.random() - 0.5) * 0.01;
        particle.vy += (Math.random() - 0.5) * 0.01;
        
        // Ensure minimum movement speed
        const minSpeed = 0.05;
        const currentSpeed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (currentSpeed < minSpeed) {
          particle.vx = particle.vx === 0 ? (Math.random() - 0.5) * minSpeed : particle.vx * (minSpeed / currentSpeed);
          particle.vy = particle.vy === 0 ? (Math.random() - 0.5) * minSpeed : particle.vy * (minSpeed / currentSpeed);
        }
        
        // Strict velocity limiting for smooth movement
        const maxSpeed = 1.0;
        if (currentSpeed > maxSpeed) {
          particle.vx = (particle.vx / currentSpeed) * maxSpeed;
          particle.vy = (particle.vy / currentSpeed) * maxSpeed;
        }
        
        // Draw particle based on shape type
        ctx.fillStyle = particle.color;
        ctx.strokeStyle = particle.color;
        
        switch(particle.shapeType) {
          case 0: // Diamond
            drawDiamond(ctx, particle.x, particle.y, currentSize, particle.rotation);
            break;
          case 1: // Line
            drawLine(ctx, particle.x, particle.y, currentSize, particle.rotation);
            break;
          case 2: // Triangle
            drawTriangle(ctx, particle.x, particle.y, currentSize, particle.rotation);
            break;
        }
        
        // Draw connecting lines more selectively
        for (let j = i + 1; j < particles.length; j++) {
          let otherParticle = particles[j];
          let dx = particle.x - otherParticle.x;
          let dy = particle.y - otherParticle.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < lineDistance) {
            // Only connect particles that are similar or complementary
            const connectChance = Math.abs(particle.shapeType - otherParticle.shapeType) <= 1 ? 1 : 0.3;
            
            if (Math.random() < connectChance) {
              const opacity = 0.15 * (1 - distance / lineDistance);
              ctx.beginPath();
              ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
              ctx.lineWidth = 0.5 * (1 - distance / lineDistance);
              
              // Draw dashed lines for an elegant effect
              ctx.setLineDash([5, 5]);
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.stroke();
              ctx.setLineDash([]); // Reset for next drawing
            }
          }
        }
      }
      
      // Request next animation frame
      requestAnimationFrame(drawParticles);
    }
    
    // Run everything
    resizeCanvas();
    generateFlowField();
    initParticles();
    drawParticles();
    
    // Event listeners
    window.addEventListener('resize', function() {
      resizeCanvas();
      initParticles();
    });
    
    window.addEventListener('mousemove', handleMouseMove);
    
    console.log("Geometric Particles: Animation started");
  }
})();
