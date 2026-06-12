// v2-motion.js

class FluidEngine {
    constructor(v2Motion) { 
        this.v2Motion = v2Motion;
        console.log('Liquid Engine Started'); 
    }
    destroy() { console.log('Liquid Engine Destroyed'); }
}

class MeshEngine {
    constructor(v2Motion) { 
        this.v2Motion = v2Motion;
        console.log('Mesh Engine Started'); 
    }
    destroy() { console.log('Mesh Engine Destroyed'); }
}

const BackgroundController = {
    mode: 'fluid',
    activeEngine: null,
    v2Motion: null,

    init(v2Motion) {
        this.v2Motion = v2Motion;
        this.mode = localStorage.getItem('background-mode') || 'fluid';
        this.startEngine();
        this.updateToggleUI();
        this.bindEvents();
    },

    bindEvents() {
        const fluidToggle = document.getElementById('bg-toggle-fluid');
        const meshToggle = document.getElementById('bg-toggle-mesh');

        if (fluidToggle) {
            fluidToggle.addEventListener('click', () => this.setMode('fluid'));
        }
        if (meshToggle) {
            meshToggle.addEventListener('click', () => this.setMode('mesh'));
        }
    },

    setMode(newMode) {
        if (this.mode === newMode) return;
        this.mode = newMode;
        localStorage.setItem('background-mode', this.mode);
        this.updateToggleUI();
        this.startEngine();
    },

    updateToggleUI() {
        const fluidToggle = document.getElementById('bg-toggle-fluid');
        const meshToggle = document.getElementById('bg-toggle-mesh');

        if (fluidToggle && meshToggle) {
            if (this.mode === 'fluid') {
                fluidToggle.style.opacity = '1';
                meshToggle.style.opacity = '0.3';
            } else {
                fluidToggle.style.opacity = '0.3';
                meshToggle.style.opacity = '1';
            }
        }
    },

    startEngine() {
        if (this.activeEngine) {
            this.activeEngine.destroy();
        }

        if (this.mode === 'fluid') {
            this.activeEngine = new FluidEngine(this.v2Motion);
        } else {
            this.activeEngine = new MeshEngine(this.v2Motion);
        }
    }
};

const v2Motion = {
    accentColor: '',

    init() {
        console.log('✨ v2-motion.js: Initializing Premium Motion Engine');
        this.initThemeEngine();
        this.initMagneticCursor();
        this.initRevealAnimations();
        BackgroundController.init(this);
    },

    initThemeEngine() {
        // Initialize accent color
        this.accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();

        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        // Capture click coordinates for ripple origin if transitions are supported
        if (document.startViewTransition) {
            themeToggle.addEventListener('click', (e) => {
                document.documentElement.style.setProperty('--click-x', `${e.clientX}px`);
                document.documentElement.style.setProperty('--click-y', `${e.clientY}px`);
            }, { capture: true });
        }

        // Intercept the global renderThemePipeline
        const originalRender = window.renderThemePipeline;
        if (typeof originalRender === 'function') {
            window.renderThemePipeline = (index) => {
                const updateTheme = () => {
                    originalRender(index);
                    // Update cached accent color after theme change
                    this.accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
                    
                    // Notify active engine if it supports theme changes
                    if (BackgroundController.activeEngine && typeof BackgroundController.activeEngine.onThemeChange === 'function') {
                        BackgroundController.activeEngine.onThemeChange(this.accentColor);
                    }
                };

                if (document.startViewTransition) {
                    document.startViewTransition(updateTheme);
                } else {
                    updateTheme();
                }
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

        const targets = document.querySelectorAll('header, section h2, .group, footer, .reveal-target');
        targets.forEach(el => {
            el.classList.add('reveal-init');
            observer.observe(el);
        });
    }
};

window.addEventListener('DOMContentLoaded', () => v2Motion.init());
