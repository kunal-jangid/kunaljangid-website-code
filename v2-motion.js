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
        // To be implemented in Task 3
    },

    initRevealAnimations() {
        // To be implemented in Task 4
    }
};

window.addEventListener('DOMContentLoaded', () => v2Motion.init());
