// v2-motion.js

class FluidEngine {
    constructor(v2Motion) {
        this.v2Motion = v2Motion;
        this.canvas = document.getElementById('fluid-paths');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.blobs = [];
        this.animationId = null;

        // Apply blur via CSS filter for GPU acceleration
        this.canvas.style.filter = 'blur(80px)';
        this.canvas.style.transform = 'translate3d(0,0,0)'; // Force hardware acceleration

        this.handlers = {
            resize: () => {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }
        };

        this.init();
    }

    init() {
        this.handlers.resize();
        window.addEventListener('resize', this.handlers.resize);

        const count = 4;
        for (let i = 0; i < count; i++) {
            this.blobs.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                r: 250 + Math.random() * 200,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                sinOffset: Math.random() * Math.PI * 2
            });
        }

        this.animate();
        console.log('Liquid Engine Started');
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const accentColor = this.v2Motion.accentColor || '#39FF14';
        const now = Date.now() * 0.001;

        this.blobs.forEach(blob => {
            blob.x += blob.vx + Math.sin(now + blob.sinOffset) * 0.5;
            blob.y += blob.vy + Math.cos(now + blob.sinOffset) * 0.5;

            const margin = blob.r;
            if (blob.x < -margin) blob.x = this.canvas.width + margin;
            if (blob.x > this.canvas.width + margin) blob.x = -margin;
            if (blob.y < -margin) blob.y = this.canvas.height + margin;
            if (blob.y > this.canvas.height + margin) blob.y = -margin;

            const grad = this.ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
            grad.addColorStop(0, accentColor);
            grad.addColorStop(1, 'rgba(0,0,0,0)');

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', this.handlers.resize);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        console.log('Liquid Engine Destroyed');
    }
}

const v2Motion = {
    accentColor: '',
    activeEngine: null,

    init() {
        console.log('✨ v2-motion.js: Initializing Premium Motion Engine');
        this.initThemeEngine();
        this.initRevealAnimations();
        this.activeEngine = new FluidEngine(this);
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
