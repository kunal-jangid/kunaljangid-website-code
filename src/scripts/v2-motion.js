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

        if (document.startViewTransition) {
            themeToggle.addEventListener('click', (e) => {
                document.documentElement.style.setProperty('--click-x', `${e.clientX}px`);
                document.documentElement.style.setProperty('--click-y', `${e.clientY}px`);
            }, { capture: true });
        }

        const originalRender = window.renderThemePipeline;
        if (typeof originalRender === 'function') {
            window.renderThemePipeline = (index) => {
                const updateTheme = () => {
                    document.documentElement.classList.add('no-transitions');
                    originalRender(index);
                    this.accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
                };

                if (document.startViewTransition) {
                    const transition = document.startViewTransition(updateTheme);
                    transition.finished.finally(() => {
                        document.documentElement.classList.remove('no-transitions');
                    });
                } else {
                    updateTheme();
                    document.documentElement.classList.remove('no-transitions');
                }
            };
        }
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

