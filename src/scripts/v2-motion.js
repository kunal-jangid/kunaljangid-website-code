// v2-motion.js

const v2Motion = {
    accentColor: '',

    init() {
        console.log('✨ v2-motion.js: Initializing Premium Motion Engine');
        this.initThemeEngine();
        this.initRevealAnimations();
    },

    initThemeEngine() {
        this.accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();

        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        // Ensure accent color syncs whenever theme changes
        window.addEventListener('storage', () => {
            this.accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
        });
    },

    initRevealAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('reveal-in');
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        const targets = document.querySelectorAll('header, section h2, .group, footer, .reveal-target');
        targets.forEach(el => {
            el.classList.add('reveal-init');
            observer.observe(el);
        });
    }
};

window.addEventListener('DOMContentLoaded', () => v2Motion.init());

