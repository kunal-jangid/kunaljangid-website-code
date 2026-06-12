// v2-motion.js
const v2Motion = {
    init() {
        console.log('✨ v2-motion.js: Initializing Premium Motion Engine');
        this.initThemeEngine();
        this.initMagneticCursor();
        this.initRevealAnimations();
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
        // To be implemented in Task 4
    }
};

window.addEventListener('DOMContentLoaded', () => v2Motion.init());
