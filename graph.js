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
    { id: 1, title: 'Metadata-Driven Platform', category: 'Enterprise' },
    { id: 2, title: 'Framework Modernization', category: 'Modernization' },
    { id: 3, title: 'Archival Engine', category: 'Data' },
    { id: 4, title: 'Quant Dashboard', category: 'Python' },
    { id: 5, title: 'Second Guesser', category: 'LLM Utility' }
];

function spawnNodes() {
    const container = document.getElementById('node-container');
    projects.forEach((p, i) => {
        const node = document.createElement('div');
        node.className = 'node-card shadow-lg cursor-grab';
        node.innerHTML = `
            <span class="text-[10px] uppercase tracking-widest opacity-50 font-mono">${p.category}</span>
            <h3 class="font-bold text-sm">${p.title}</h3>
        `;
        // Random distribution in world space
        const x = Math.random() * 800 + 100;
        const y = Math.random() * 600 + 100;
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
        const skew = Math.min(Math.max(vx * 0.5, -15), 15);
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
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.2, graphState.zoom + delta), 2);
    
    // Zoom toward mouse position
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

function drawThreads() {
    const canvas = document.getElementById('canvas-bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const time = Date.now() * 0.001;
    
    graphState.connections.forEach(conn => {
        const nodeA = graphState.nodes[conn.from];
        const nodeB = graphState.nodes[conn.to];
        
        // Convert world to screen for canvas
        const ax = nodeA.x * graphState.zoom + graphState.offset.x + 125 * graphState.zoom;
        const ay = nodeA.y * graphState.zoom + graphState.offset.y + 50 * graphState.zoom;
        const bx = nodeB.x * graphState.zoom + graphState.offset.x + 125 * graphState.zoom;
        const by = nodeB.y * graphState.zoom + graphState.offset.y + 50 * graphState.zoom;
        
        const cpX = (ax + bx) / 2 + Math.sin(time + conn.from) * 50;
        const cpY = (ay + by) / 2 + Math.cos(time + conn.to) * 50 + 50;
        
        // Spectrum shift
        ctx.strokeStyle = `hsla(${(time * 50 + conn.from * 20) % 360}, 70%, 50%, 0.4)`;
        ctx.lineWidth = 2 * graphState.zoom;

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(cpX, cpY, bx, by);
        ctx.stroke();
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

