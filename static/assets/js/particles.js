// Self-contained particles script
(function() {
    // Configuration
    const config = {
        particleCount: 80,
        particleColor: '#ffffff',
        particleSize: 3,
        particleOpacity: 0.5,
        particleSpeed: 6,
        particleDirection: 'top',
        particleDistanceToRepulse: 200,
        particleDistanceToLink: 150,
        particleLinkedOpacity: 0.4,
        particleHoverMode: 'repulse',
        particleClickMode: 'push',
        particlesPerClick: 4,
        particleInteractivity: true,
        zIndex: 1,
        backgroundColor: '#000'
    };

    // Create container
    const container = document.createElement('div');
    container.id = 'particles-container';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: ${config.zIndex};
        pointer-events: none;
        background-color: ${config.backgroundColor};
    `;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: ${config.particleInteractivity ? 'auto' : 'none'};
    `;
    container.appendChild(canvas);
    document.body.insertBefore(container, document.body.firstChild);

    // Add necessary styles
    const style = document.createElement('style');
    style.textContent = `
        body { margin: 0; }
        .container, .games-box, main { position: relative; z-index: 10; }
        #loadingOverlay { z-index: 999999 !important; }
    `;
    document.head.appendChild(style);

    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: null, y: null };

    // Resize canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Particle class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * config.particleSize + 1;
            this.speedX = Math.random() * 3 - 1.5;
            this.speedY = Math.random() * 3 - 1.5;
            
            if (config.particleDirection === 'top') {
                this.speedY = -Math.abs(this.speedY);
            } else if (config.particleDirection === 'bottom') {
                this.speedY = Math.abs(this.speedY);
            }
            
            this.opacity = config.particleOpacity;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Bounce off edges
            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

            // Mouse interaction - repulse
            if (config.particleHoverMode === 'repulse' && mouse.x !== null && mouse.y !== null) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < config.particleDistanceToRepulse) {
                    const force = (1 - distance / config.particleDistanceToRepulse) * 5;
                    this.x += (dx / distance) * force;
                    this.y += (dy / distance) * force;
                }
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.fill();
        }
    }

    // Create particles
    function createParticles() {
        particles = [];
        for (let i = 0; i < config.particleCount; i++) {
            particles.push(new Particle());
        }
    }

    // Draw particles and connections
    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw connections
        if (config.particleDistanceToLink > 0) {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < config.particleDistanceToLink) {
                        const opacity = (1 - distance / config.particleDistanceToLink) * config.particleLinkedOpacity;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
        }

        // Draw particles
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        requestAnimationFrame(drawParticles);
    }

    // Initialize
    function init() {
        createParticles();
        drawParticles();
    }

    // Mouse events
    if (config.particleInteractivity) {
        canvas.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        canvas.addEventListener('mouseout', () => {
            mouse.x = null;
            mouse.y = null;
        });

        canvas.addEventListener('click', (e) => {
            if (config.particleClickMode === 'push') {
                for (let i = 0; i < config.particlesPerClick; i++) {
                    particles.push(new Particle());
                }
            }
        });
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
