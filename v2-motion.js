// v2-motion.js
const v2Motion = {
    accentColor: '',

    init() {
        console.log('✨ v2-motion.js: Initializing Premium Motion Engine');
        this.initThemeEngine();
        this.initMagneticCursor();
        this.initRevealAnimations();
        this.initFluidPaths();
    },

    initFluidPaths() {
        const canvas = document.getElementById('fluid-paths');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        let width, height;
        const paths = [];
        
        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        
        window.addEventListener('resize', resize);
        resize();

        // Initialize accent color
        this.accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();

        // Initialize 3 elegant paths with yPercent for resize-stability
        for (let i = 0; i < 3; i++) {
            paths.push({
                yPercent: Math.random(),
                length: Math.random() * 0.5 + 0.5,
                amplitude: Math.random() * 50 + 50,
                speed: Math.random() * 0.01 + 0.005,
                offset: Math.random() * Math.PI * 2,
                thickness: Math.random() * 2 + 1
            });
        }

        const animate = (time) => {
            ctx.clearRect(0, 0, width, height);
            
            // Use cached accent color and move state setters outside the loop
            ctx.strokeStyle = this.accentColor;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = 0.15; // Low opacity for subtle look

            paths.forEach((path, i) => {
                const t = time * path.speed + path.offset;
                const pathY = path.yPercent * height;
                
                ctx.beginPath();
                ctx.lineWidth = path.thickness;

                const startY = pathY + Math.sin(t) * path.amplitude;
                ctx.moveTo(-100, startY);

                // Draw a complex sweeping curve across the screen
                ctx.bezierCurveTo(
                    width * 0.3, startY + Math.cos(t * 0.8) * 200,
                    width * 0.7, startY + Math.sin(t * 1.2) * 200,
                    width + 100, pathY + Math.sin(t * 0.5) * path.amplitude
                );
                
                ctx.stroke();
            });

            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    },

    initThemeEngine() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle || !document.startViewTransition) return;

        // Capture click coordinates for ripple origin
        themeToggle.addEventListener('click', (e) => {
            document.documentElement.style.setProperty('--click-x', `${e.clientX}px`);
            document.documentElement.style.setProperty('--click-y', `${e.clientY}px`);
        }, { capture: true });

        // Intercept the global renderThemePipeline
        const originalRender = window.renderThemePipeline;
        if (typeof originalRender === 'function') {
            window.renderThemePipeline = (index) => {
                document.startViewTransition(() => {
                    originalRender(index);
                    // Update cached accent color after theme change
                    this.accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
                });
            };
        }
    },

    initMagneticCursor() {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        document.body.appendChild(cursor);

        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        const lerp = (a, b, n) => (1 - n) * a + n * b;

        const animate = () => {
            cursorX = lerp(cursorX, mouseX, 0.15);
            cursorY = lerp(cursorY, mouseY, 0.15);
            
            const offset = cursor.classList.contains('active') ? 40 : 10;
            cursor.style.transform = `translate3d(${cursorX - offset}px, ${cursorY - offset}px, 0)`;
            
            requestAnimationFrame(animate);
        };
        animate();

        // Magnetic interaction
        const interactiveElements = document.querySelectorAll('#theme-toggle, .group, a, button');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('active'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
        });
    },

    initRevealAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Apply slight stagger based on index if multiple visible at once
                    setTimeout(() => {
                        entry.target.classList.add('reveal-in');
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        const targets = document.querySelectorAll('header, section h2, .group, footer');
        targets.forEach(el => {
            el.classList.add('reveal-init');
            observer.observe(el);
        });
    }
};

window.addEventListener('DOMContentLoaded', () => v2Motion.init());
