// graph.js
const graphState = {
    nodes: [],
    connections: [],
    zoom: 1,
    offset: { x: 0, y: 0 },
    isDragging: false,
    accentColor: '#C2441C'
};

const projects = [
    { 
        id: 1, 
        title: 'Metadata-Driven Configuration Platform', 
        category: 'Enterprise System // Core Architecture',
        desc: 'Co-architected a dynamic rendering layout using React 19 that dynamically compiles modular UI configurations from structured JSON/Metadata schemas.',
        tags: ['React 19', 'TypeScript', 'Dynamic Schema Layouts']
    },
    { 
        id: 2, 
        title: 'Distributed Platform Modernization', 
        category: 'Enterprise System // UI Modernization',
        desc: 'Led end-to-end framework modernization sprints to upgrade legacy frontend instances up to Angular 21, abstracting UI components.',
        tags: ['Angular 21', 'Architecture Refactoring', 'AI Driven Development']
    },
    { 
        id: 3, 
        title: 'High-Throughput Archival Processing Engine', 
        category: 'Enterprise System // Data Infrastructure',
        desc: 'Engineered a performant asynchronous database archival pipeline to process and offload 500M+ inactive historical table records.',
        tags: ['Java', 'Spring Boot', 'PL/SQL Optimization']
    },
    { 
        id: 4, 
        title: 'Autonomous Quantitative Analysis Dashboard', 
        category: 'Personal Project // Systems & Automation',
        desc: 'Modular quantitative Python data pipeline cross-referencing real-time prediction odds with news API data using localized LLM nodes.',
        tags: ['Python', 'Ollama', 'Gemma 3', 'TradingView API']
    },
    { 
        id: 5, 
        title: 'Second Guesser // Intention Dissector', 
        category: 'Personal Project',
        desc: 'Lightweight desktop utility that grabs a swift screen region capture and loops it directly into Gemini models for conversational evaluation.',
        tags: ['Python', 'Gemini API', 'Region Capture']
    }
];

const decorativeNodes = [];
function spawnDecorativeNodes() {
    for (let i = 0; i < 40; i++) {
        decorativeNodes.push({
            x: Math.random() * 4000 + 500,
            y: Math.random() * 4000 + 500,
            size: Math.random() * 3 + 1,
            phase: Math.random() * Math.PI * 2
        });
    }
}

function spawnNodes() {
    const container = document.getElementById('node-container');
    projects.forEach((p, i) => {
        const node = document.createElement('div');
        node.className = 'node-card shadow-lg cursor-grab group';
        node.innerHTML = `
            <span class="text-[9px] uppercase tracking-widest opacity-40 font-mono">${p.category}</span>
            <h3 class="font-bold text-base leading-tight">${p.title}</h3>
            <p class="text-[11px] opacity-70 leading-relaxed mt-1 line-clamp-3 group-hover:line-clamp-none transition-all duration-300">${p.desc}</p>
            <div class="flex flex-wrap gap-1 mt-2">
                ${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}
            </div>
        `;
        // More centered initial distribution in world space
        const x = Math.random() * 1000 + 2000;
        const y = Math.random() * 1000 + 2000;
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        
        container.appendChild(node);
        graphState.nodes.push({ 
            id: p.id, 
            element: node, 
            x, y, 
            vx: 0, vy: 0,
            lastX: x, lastY: y
        });
    });
    spawnDecorativeNodes();
    
    // Initial center view
    graphState.offset.x = window.innerWidth / 2 - 2500;
    graphState.offset.y = window.innerHeight / 2 - 2500;
}

const themeConfig = [
    { name: 'cream', bg: '#EEE9DF', text: '#2B323F', border: '#111111', accent: '#C2441C' },
    { name: 'tactile', bg: '#090F15', text: '#F0E7D5', border: '#F0E7D5', accent: '#39FF14' },
    { name: 'beet_red', bg: '#7a1f3d', text: '#c7b63c', border: '#c7b63c', accent: '#f6e199' },
    { name: 'sage_kermit', bg: '#688763', text: '#0F2E15', border: '#0F2E15', accent: '#DAE2CB' }
];

function initTheme() {
    const savedIndex = localStorage.getItem('portfolio-theme-state') || 0;
    const activeTheme = themeConfig[savedIndex] || themeConfig[0];
    const root = document.documentElement;

    root.style.setProperty('--bg-color', activeTheme.bg);
    root.style.setProperty('--text-color', activeTheme.text);
    root.style.setProperty('--border-color', activeTheme.border);
    root.style.setProperty('--accent-color', activeTheme.accent);
    
    graphState.accentColor = activeTheme.accent;
    console.log(`Graph Theme Sync: Initialized (${activeTheme.name})`);
}

function initConnections() {
    for (let i = 0; i < graphState.nodes.length; i++) {
        const target = (i + 1) % graphState.nodes.length;
        graphState.connections.push({ from: i, to: target });
    }
}

// Interaction State
let activeNode = null;
let isPanning = false;
let startPan = { x: 0, y: 0 };
let dragOffset = { x: 0, y: 0 };

document.addEventListener('mousedown', (e) => {
    const card = e.target.closest('.node-card');
    if (card) {
        activeNode = graphState.nodes.find(n => n.element === card);
        const rect = card.getBoundingClientRect();
        dragOffset.x = (e.clientX - rect.left) / graphState.zoom;
        dragOffset.y = (e.clientY - rect.top) / graphState.zoom;
        card.style.cursor = 'grabbing';
        card.style.zIndex = 1000;
        card.classList.add('dragging');
    } else {
        isPanning = true;
        startPan.x = e.clientX - graphState.offset.x;
        startPan.y = e.clientY - graphState.offset.y;
        document.body.style.cursor = 'grabbing';
    }
});

document.addEventListener('mousemove', (e) => {
    if (activeNode) {
        activeNode.x = (e.clientX - graphState.offset.x) / graphState.zoom - dragOffset.x;
        activeNode.y = (e.clientY - graphState.offset.y) / graphState.zoom - dragOffset.y;
        
        activeNode.element.style.left = `${activeNode.x}px`;
        activeNode.element.style.top = `${activeNode.y}px`;
        
        // Velocity-based distortion
        const vx = activeNode.x - activeNode.lastX;
        const skew = Math.min(Math.max(vx * 0.8, -25), 25);
        activeNode.element.style.transform = `scale(1.05) skewX(${skew}deg)`;
        
        activeNode.lastX = activeNode.x;
        activeNode.lastY = activeNode.y;
    } else if (isPanning) {
        graphState.offset.x = e.clientX - startPan.x;
        graphState.offset.y = e.clientY - startPan.y;
        updateTransform();
    }
});

document.addEventListener('mouseup', () => {
    if (activeNode) {
        activeNode.element.style.cursor = 'grab';
        activeNode.element.style.zIndex = 10;
        activeNode.element.style.transform = 'scale(1)';
        activeNode.element.classList.remove('dragging');
        activeNode = null;
    }
    isPanning = false;
    document.body.style.cursor = 'default';
});

document.addEventListener('wheel', (e) => {
    const delta = e.deltaY * -0.0015;
    const newZoom = Math.min(Math.max(0.1, graphState.zoom + delta), 2.5);
    
    const rect = document.getElementById('viewport').getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = (mouseX - graphState.offset.x) / graphState.zoom;
    const worldY = (mouseY - graphState.offset.y) / graphState.zoom;
    
    graphState.zoom = newZoom;
    graphState.offset.x = mouseX - worldX * graphState.zoom;
    graphState.offset.y = mouseY - worldY * graphState.zoom;
    
    updateTransform();
}, { passive: false });

function updateTransform() {
    const container = document.getElementById('node-container');
    container.style.transform = `translate(${graphState.offset.x}px, ${graphState.offset.y}px) scale(${graphState.zoom})`;
}

function drawGrid(ctx, canvas, time) {
    const gridSize = 100 * graphState.zoom;
    const offsetX = graphState.offset.x % gridSize;
    const offsetY = graphState.offset.y % gridSize;

    ctx.beginPath();
    ctx.strokeStyle = graphState.accentColor;
    ctx.globalAlpha = 0.03;
    ctx.lineWidth = 1;

    for (let x = offsetX; x <= canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for (let y = offsetY; y <= canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
}

function drawThreads() {
    const canvas = document.getElementById('canvas-bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const time = Date.now() * 0.001;
    
    drawGrid(ctx, canvas, time);

    // Render Decorative Nodes
    decorativeNodes.forEach(dn => {
        const dx = dn.x * graphState.zoom + graphState.offset.x;
        const dy = dn.y * graphState.zoom + graphState.offset.y;
        
        // Skip if off-screen
        if (dx < -50 || dx > canvas.width + 50 || dy < -50 || dy > canvas.height + 50) return;

        const pulse = Math.sin(time + dn.phase) * 0.5 + 0.5;
        ctx.fillStyle = graphState.accentColor;
        ctx.globalAlpha = 0.1 + pulse * 0.2;
        ctx.beginPath();
        ctx.arc(dx, dy, dn.size * graphState.zoom, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    graphState.connections.forEach(conn => {
        const nodeA = graphState.nodes[conn.from];
        const nodeB = graphState.nodes[conn.to];
        
        // Cards are 300px wide, 150px approx height
        const ax = nodeA.x * graphState.zoom + graphState.offset.x + 150 * graphState.zoom;
        const ay = nodeA.y * graphState.zoom + graphState.offset.y + 75 * graphState.zoom;
        const bx = nodeB.x * graphState.zoom + graphState.offset.x + 150 * graphState.zoom;
        const by = nodeB.y * graphState.zoom + graphState.offset.y + 75 * graphState.zoom;
        
        const dist = Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2));
        const cpX = (ax + bx) / 2 + Math.sin(time + conn.from) * (dist * 0.1);
        const cpY = (ay + by) / 2 + Math.cos(time + conn.to) * (dist * 0.1) + 50 * graphState.zoom;
        
        // Aura Glow
        ctx.shadowBlur = 15 * graphState.zoom;
        ctx.shadowColor = `hsla(${(time * 40 + conn.from * 20) % 360}, 80%, 60%, 0.3)`;
        
        // Spectrum shift thread
        ctx.strokeStyle = `hsla(${(time * 60 + conn.from * 30) % 360}, 70%, 50%, 0.5)`;
        ctx.lineWidth = 3 * graphState.zoom;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(cpX, cpY, bx, by);
        ctx.stroke();
        
        // Secondary thin core line
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'white';
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 1 * graphState.zoom;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    });
    
    requestAnimationFrame(drawThreads);
}

window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    resizeCanvas();
    spawnNodes();
    initConnections();
    updateTransform();
    drawThreads();
});

function resizeCanvas() {
    const canvas = document.getElementById('canvas-bg');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);

