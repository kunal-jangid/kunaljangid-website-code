// v2-motion.js

class FluidEngine {
    constructor(v2Motion) {
        this.v2Motion = v2Motion;
        this.canvas = document.getElementById('fluid-paths');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.blobs = [];
        this.animationId = null;
        this.mouse = { x: 0, y: 0, active: false };

        // Apply blur via CSS filter for GPU acceleration
        this.canvas.style.filter = 'blur(80px)';
        this.canvas.style.transform = 'translate3d(0,0,0)'; // Force hardware acceleration

        this.handlers = {
            resize: () => {
                this.canvas.width = window.innerWidth;
                this.canvas.height = Math.max(document.documentElement.scrollHeight, window.innerHeight);
            },
            mousemove: (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY + window.scrollY;
            },
            mousedown: () => { this.mouse.active = true; },
            mouseup: () => { this.mouse.active = false; },
            touchstart: (e) => {
                this.mouse.active = true;
                if (e.touches[0]) {
                    this.mouse.x = e.touches[0].clientX;
                    this.mouse.y = e.touches[0].clientY + window.scrollY;
                }
            },
            touchmove: (e) => {
                if (e.touches[0]) {
                    this.mouse.x = e.touches[0].clientX;
                    this.mouse.y = e.touches[0].clientY + window.scrollY;
                }
            },
            touchend: () => { this.mouse.active = false; }
        };

        this.init();
    }

    init() {
        this.handlers.resize();
        window.addEventListener('resize', this.handlers.resize);
        window.addEventListener('mousemove', this.handlers.mousemove);
        window.addEventListener('mousedown', this.handlers.mousedown);
        window.addEventListener('mouseup', this.handlers.mouseup);
        window.addEventListener('touchstart', this.handlers.touchstart, { passive: true });
        window.addEventListener('touchmove', this.handlers.touchmove, { passive: true });
        window.addEventListener('touchend', this.handlers.touchend, { passive: true });

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

            if (this.mouse.active) {
                const dx = this.mouse.x - blob.x;
                const dy = this.mouse.y - blob.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < 1000000) { // 1000^2
                    const dist = Math.sqrt(distSq);
                    const force = (1000 - dist) / 1000;
                    blob.x += dx * force * 0.025;
                    blob.y += dy * force * 0.025;
                }
            }

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

    onThemeChange(color) {
        // Theme sync is handled by the animate loop pulling from v2Motion.accentColor
    }

    destroy() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', this.handlers.resize);
        window.removeEventListener('mousemove', this.handlers.mousemove);
        window.removeEventListener('mousedown', this.handlers.mousedown);
        window.removeEventListener('mouseup', this.handlers.mouseup);
        window.removeEventListener('touchstart', this.handlers.touchstart);
        window.removeEventListener('touchmove', this.handlers.touchmove);
        window.removeEventListener('touchend', this.handlers.touchend);
        this.canvas.style.filter = 'none';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        console.log('Liquid Engine Destroyed');
    }
}

class MeshEngine {
    constructor(v2Motion) {
        this.v2Motion = v2Motion;
        this.canvas = document.getElementById('fluid-paths');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.points = [];
        this.animationId = null;
        this.mouse = { x: 0, y: 0, active: false };

        this.gridSize = 100;
        this.springStrength = 0.003;
        this.damping = 0.98;
        this.influenceRadius = 10000;

        this.handlers = {
            resize: () => {
                this.canvas.width = window.innerWidth;
                this.canvas.height = Math.max(document.documentElement.scrollHeight, window.innerHeight);
                this.initGrid();
            },
            mousemove: (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY + window.scrollY;
            },
            mousedown: () => { this.mouse.active = true; },
            mouseup: () => { this.mouse.active = false; },
            touchstart: (e) => {
                this.mouse.active = true;
                if (e.touches[0]) {
                    this.mouse.x = e.touches[0].clientX;
                    this.mouse.y = e.touches[0].clientY + window.scrollY;
                }
            },
            touchmove: (e) => {
                if (e.touches[0]) {
                    this.mouse.x = e.touches[0].clientX;
                    this.mouse.y = e.touches[0].clientY + window.scrollY;
                }
            },
            touchend: () => { this.mouse.active = false; }
        };

        this.init();
    }

    init() {
        this.handlers.resize();
        window.addEventListener('resize', this.handlers.resize);
        window.addEventListener('mousemove', this.handlers.mousemove);
        window.addEventListener('mousedown', this.handlers.mousedown);
        window.addEventListener('mouseup', this.handlers.mouseup);
        window.addEventListener('touchstart', this.handlers.touchstart, { passive: true });
        window.addEventListener('touchmove', this.handlers.touchmove, { passive: true });
        window.addEventListener('touchend', this.handlers.touchend, { passive: true });

        this.animate();
        console.log('Mesh Engine Started');
    }

    initGrid() {
        this.points = [];
        const spacingX = this.canvas.width / (this.gridSize - 1);
        const spacingY = this.canvas.height / (this.gridSize - 1);

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const px = x * spacingX;
                const py = y * spacingY;
                this.points.push({
                    x: px,
                    y: py,
                    baseX: px,
                    baseY: py,
                    vx: 0,
                    vy: 0
                });
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const accentColor = this.v2Motion.accentColor || '#39FF14';
        this.ctx.strokeStyle = accentColor;
        this.ctx.fillStyle = accentColor;
        this.ctx.lineWidth = 1;

        // Update physics
        const maxVelocity = 15;
        const maxDisplacement = this.influenceRadius * 0.8;

        this.points.forEach(p => {
            // Spring back to base position
            const dxBase = p.baseX - p.x;
            const dyBase = p.baseY - p.y;
            
            p.vx += dxBase * this.springStrength;
            p.vy += dyBase * this.springStrength;

            // Mouse interaction
            if (this.mouse.active) {
                const dxMouse = this.mouse.x - p.x;
                const dyMouse = this.mouse.y - p.y;
                const distSq = dxMouse * dxMouse + dyMouse * dyMouse;
                
                if (distSq < this.influenceRadius * this.influenceRadius) {
                    const dist = Math.sqrt(distSq);
                    const force = (this.influenceRadius - dist) / this.influenceRadius;
                    
                    // Pull toward mouse
                    p.vx += dxMouse * force * 0.1;
                    p.vy += dyMouse * force * 0.1;
                }
            }

            // Clamp velocity for stability
            const speedSq = p.vx * p.vx + p.vy * p.vy;
            if (speedSq > maxVelocity * maxVelocity) {
                const speed = Math.sqrt(speedSq);
                p.vx = (p.vx / speed) * maxVelocity;
                p.vy = (p.vy / speed) * maxVelocity;
            }

            p.vx *= this.damping;
            p.vy *= this.damping;
            p.x += p.vx;
            p.y += p.vy;

            // Clamp displacement to prevent mesh "explosion"
            const dxDisp = p.x - p.baseX;
            const dyDisp = p.y - p.baseY;
            const dispSq = dxDisp * dxDisp + dyDisp * dyDisp;
            if (dispSq > maxDisplacement * maxDisplacement) {
                const disp = Math.sqrt(dispSq);
                p.x = p.baseX + (dxDisp / disp) * maxDisplacement;
                p.y = p.baseY + (dyDisp / disp) * maxDisplacement;
            }
        });

        // Draw lines
        this.ctx.globalAlpha = 0.2;
        this.ctx.beginPath();
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const i = y * this.gridSize + x;
                const p = this.points[i];

                // Connect to right neighbor
                if (x < this.gridSize - 1) {
                    const pRight = this.points[i + 1];
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(pRight.x, pRight.y);
                }

                // Connect to bottom neighbor
                if (y < this.gridSize - 1) {
                    const pBottom = this.points[i + this.gridSize];
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(pBottom.x, pBottom.y);
                }
            }
        }
        this.ctx.stroke();

        // Draw points (Batched for efficiency)
        this.ctx.globalAlpha = 0.3;
        this.ctx.beginPath();
        this.points.forEach(p => {
            this.ctx.moveTo(p.x + 1, p.y);
            this.ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
        });
        this.ctx.fill();

        this.ctx.globalAlpha = 1.0;
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    onThemeChange(color) {
        // Theme sync is handled by the animate loop pulling from v2Motion.accentColor
    }

    destroy() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', this.handlers.resize);
        window.removeEventListener('mousemove', this.handlers.mousemove);
        window.removeEventListener('mousedown', this.handlers.mousedown);
        window.removeEventListener('mouseup', this.handlers.mouseup);
        window.removeEventListener('touchstart', this.handlers.touchstart);
        window.removeEventListener('touchmove', this.handlers.touchmove);
        window.removeEventListener('touchend', this.handlers.touchend);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        console.log('Mesh Engine Destroyed');
    }
}

const BackgroundController = {
    mode: 'fluid',
    activeEngine: null,
    v2Motion: null,

    init(v2Motion) {
        this.v2Motion = v2Motion;
        this.mode = localStorage.getItem('background-mode') || 'fluid';
        this.updateToggleUI();
        this.startEngine();
        this.bindEvents();

        // Watch for content height changes to resize canvas
        const resizeObserver = new ResizeObserver(() => {
            if (this.activeEngine && this.activeEngine.handlers && this.activeEngine.handlers.resize) {
                this.activeEngine.handlers.resize();
            }
        });
        resizeObserver.observe(document.body);
    },

    bindEvents() {
        const toggleBtn = document.getElementById('bg-mode-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.setMode(this.mode === 'fluid' ? 'mesh' : 'fluid');
            });
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
        const indicator = document.getElementById('bg-toggle-indicator');
        if (indicator) {
            // Fluid = Left (0), Mesh = Right (24px approx)
            indicator.style.transform = this.mode === 'fluid' 
                ? 'translateX(0)' 
                : 'translateX(24px)';
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
                    document.documentElement.classList.add('no-transitions');
                    originalRender(index);
                    // Update cached accent color after theme change
                    this.accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
                    
                    // Notify active engine if it supports theme changes
                    if (BackgroundController.activeEngine && typeof BackgroundController.activeEngine.onThemeChange === 'function') {
                        BackgroundController.activeEngine.onThemeChange(this.accentColor);
                    }
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

    initMagneticCursor() {
        if (window.innerWidth < 768) return; // Disable on mobile
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
            
            const offset = 15;
            cursor.style.transform = `translate3d(${cursorX - offset}px, ${cursorY - offset}px, 0)`;
            
            requestAnimationFrame(animate);
        };
        animate();
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
