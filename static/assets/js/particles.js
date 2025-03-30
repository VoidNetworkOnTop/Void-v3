// Particles Background Script
// Add this script to any webpage to create a nice white particles background

(function() {
  // Create canvas element
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas to cover the entire background
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '-1';
  canvas.style.pointerEvents = 'none'; // Allow clicking through canvas
  
  // Append canvas to body
  document.body.appendChild(canvas);
  
  // Particle settings
  const particleCount = 100;
  const particleSize = 2;
  const particleColor = 'rgba(255, 255, 255, 0.7)';
  const lineColor = 'rgba(255, 255, 255, 0.2)';
  const lineDistance = 150;
  const moveSpeed = 0.5;
  
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
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * particleSize + 1,
        vx: Math.random() * moveSpeed * 2 - moveSpeed,
        vy: Math.random() * moveSpeed * 2 - moveSpeed
      });
    }
  }
  
  // Draw particles
  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw each particle
    particles.forEach(particle => {
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
      particles.forEach(otherParticle => {
        const dx = particle.x - otherParticle.x;
        const dy = particle.y - otherParticle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < lineDistance) {
          ctx.beginPath();
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 0.5 * (1 - distance / lineDistance);
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(otherParticle.x, otherParticle.y);
          ctx.stroke();
        }
      });
    });
    
    requestAnimationFrame(drawParticles);
  }
  
  // Mouse interaction - optional effect that makes particles move towards mouse
  let mouseX = 0;
  let mouseY = 0;
  const mouseRadius = 150;
  
  function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    particles.forEach(particle => {
      const dx = mouseX - particle.x;
      const dy = mouseY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < mouseRadius) {
        const force = (mouseRadius - distance) / mouseRadius;
        particle.vx += dx * force * 0.02;
        particle.vy += dy * force * 0.02;
        
        // Limit velocity
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (speed > 2) {
          particle.vx = (particle.vx / speed) * 2;
          particle.vy = (particle.vy / speed) * 2;
        }
      }
    });
  }
  
  // Initialize
  window.addEventListener('resize', function() {
    resizeCanvas();
    initParticles();
  });
  
  window.addEventListener('mousemove', handleMouseMove);
  
  resizeCanvas();
  initParticles();
  drawParticles();
})();
