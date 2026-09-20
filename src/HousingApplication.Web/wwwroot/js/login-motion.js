/**
 * Login Motion - Interactive Canvas Background Animation
 * Provides lively ambient constellation and floating light nodes for the Login Home Page.
 * Automatically pauses when login screen is hidden to conserve resources.
 */
(function() {
    let canvas = null;
    let ctx = null;
    let animFrameId = null;
    let particles = [];
    let glowOrbs = [];
    let width = 0;
    let height = 0;
    let mouse = { x: -1000, y: -1000, radius: 150 };
    let isRunning = false;

    const PARTICLE_COUNT = 50;
    const CONNECT_DIST = 140;
    const COLORS = [
        'rgba(56, 189, 248, ',  // sky
        'rgba(96, 165, 250, ',  // blue
        'rgba(129, 140, 248, ', // indigo
        'rgba(52, 211, 153, '   // emerald
    ];

    function init() {
        canvas = document.getElementById('login-motion-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        if (!ctx) return;

        resize();
        window.addEventListener('resize', resize);

        const screen = document.getElementById('login-screen');
        if (screen) {
            screen.addEventListener('mousemove', onMouseMove);
            screen.addEventListener('mouseleave', onMouseLeave);

            // MutationObserver to watch when login-screen is shown/hidden
            const observer = new MutationObserver(() => {
                const isHidden = screen.classList.contains('hidden');
                if (isHidden && isRunning) {
                    stop();
                } else if (!isHidden && !isRunning) {
                    start();
                }
            });
            observer.observe(screen, { attributes: true, attributeFilter: ['class', 'style'] });
        }

        initParticles();
        initGlowOrbs();

        const screenElem = document.getElementById('login-screen');
        if (screenElem && !screenElem.classList.contains('hidden')) {
            start();
        }
    }

    function resize() {
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
        height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        if (ctx) ctx.scale(dpr, dpr);
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * (width || 800),
                y: Math.random() * (height || 600),
                vx: (Math.random() - 0.5) * 0.7,
                vy: (Math.random() - 0.5) * 0.7,
                radius: Math.random() * 2 + 1.2,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                alpha: Math.random() * 0.5 + 0.3,
                baseAlpha: Math.random() * 0.5 + 0.3,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    function initGlowOrbs() {
        glowOrbs = [
            { x: width * 0.2, y: height * 0.3, vx: 0.2, vy: 0.15, radius: 240, color: 'rgba(59, 130, 246, 0.12)' },
            { x: width * 0.8, y: height * 0.7, vx: -0.18, vy: -0.12, radius: 280, color: 'rgba(99, 102, 241, 0.10)' },
            { x: width * 0.5, y: height * 0.8, vx: 0.12, vy: -0.2, radius: 200, color: 'rgba(16, 185, 129, 0.08)' }
        ];
    }

    function onMouseMove(e) {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    }

    function onMouseLeave() {
        mouse.x = -1000;
        mouse.y = -1000;
    }

    function animate() {
        if (!isRunning || !ctx) return;
        ctx.clearRect(0, 0, width, height);

        // 1. Draw drifting ambient glow orbs
        for (let i = 0; i < glowOrbs.length; i++) {
            const orb = glowOrbs[i];
            orb.x += orb.vx;
            orb.y += orb.vy;

            if (orb.x < -orb.radius) orb.x = width + orb.radius;
            if (orb.x > width + orb.radius) orb.x = -orb.radius;
            if (orb.y < -orb.radius) orb.y = height + orb.radius;
            if (orb.y > height + orb.radius) orb.y = -orb.radius;

            const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
            grad.addColorStop(0, orb.color);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // 2. Update & Draw Particles
        const now = Date.now() * 0.002;
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            // Natural movement
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off edges
            if (p.x < 0) { p.x = 0; p.vx *= -1; }
            if (p.x > width) { p.x = width; p.vx *= -1; }
            if (p.y < 0) { p.y = 0; p.vy *= -1; }
            if (p.y > height) { p.y = height; p.vy *= -1; }

            // Mouse interaction (gentle repulsion)
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouse.radius && dist > 0) {
                const force = (mouse.radius - dist) / mouse.radius;
                p.x -= (dx / dist) * force * 3;
                p.y -= (dy / dist) * force * 3;
            }

            // Pulse alpha
            p.alpha = p.baseAlpha + Math.sin(now + p.phase) * 0.15;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color + Math.max(0.1, p.alpha) + ')';
            ctx.fill();

            // Connect nearby particles
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const pdx = p.x - p2.x;
                const pdy = p.y - p2.y;
                const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

                if (pdist < CONNECT_DIST) {
                    const lineAlpha = (1 - pdist / CONNECT_DIST) * 0.22;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(148, 163, 184, ${lineAlpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }

        animFrameId = requestAnimationFrame(animate);
    }

    function start() {
        if (isRunning) return;
        isRunning = true;
        animate();
    }

    function stop() {
        isRunning = false;
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    }

    // Initialize on DOMContentLoaded or immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.loginMotion = { start, stop, resize };
})();
