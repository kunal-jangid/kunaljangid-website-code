// graph.js
const graphState = {
    nodes: [],
    connections: [],
    zoom: 1,
    offset: { x: 0, y: 0 },
    isDragging: false
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
        const x = Math.random() * 500 + 100;
        const y = Math.random() * 500 + 100;
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        
        container.appendChild(node);
        graphState.nodes.push({ id: p.id, element: node, x, y, vx: 0, vy: 0 });
    });
}

function initTheme() {
    const savedTheme = localStorage.getItem('portfolio-theme-state') || 0;
    console.log('Graph Theme Sync: Initialized');
}

function initConnections() {
    // Connect nodes in a ring or random pattern for chaos
    for (let i = 0; i < graphState.nodes.length; i++) {
        const target = (i + 1) % graphState.nodes.length;
        graphState.connections.push({ from: i, to: target });
    }
}

// Drag Logic
let activeNode = null;
let dragOffset = { x: 0, y: 0 };

document.addEventListener('mousedown', (e) => {
    const card = e.target.closest('.node-card');
    if (card) {
        activeNode = graphState.nodes.find(n => n.element === card);
        const rect = card.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        card.style.cursor = 'grabbing';
        card.style.zIndex = 1000;
        card.classList.add('dragging');
    }
});

document.addEventListener('mousemove', (e) => {
    if (activeNode) {
        // Simple 1:1 screen to world for now (panning added in Task 5)
        activeNode.x = e.clientX - dragOffset.x;
        activeNode.y = e.clientY - dragOffset.y;
        
        activeNode.element.style.left = `${activeNode.x}px`;
        activeNode.element.style.top = `${activeNode.y}px`;
        
        // Fluid distortion effect (skew/scale based on velocity)
        activeNode.element.style.transform = `scale(1.05) skew(${Math.sin(Date.now() / 100) * 2}deg)`;
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
});

function drawThreads() {
    const canvas = document.getElementById('canvas-bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get accent color from CSS variables
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#C2441C';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;

    graphState.connections.forEach(conn => {
        const nodeA = graphState.nodes[conn.from];
        const nodeB = graphState.nodes[conn.to];
        
        // Calculate elastic sagging midpoint
        const cpX = (nodeA.x + nodeB.x) / 2 + 50; // Slight horizontal offset
        const cpY = (nodeA.y + nodeB.y) / 2 + 100; // Vertical sag
        
        ctx.beginPath();
        // Offset by card center (approx 125x50)
        ctx.moveTo(nodeA.x + 125, nodeA.y + 50);
        ctx.quadraticCurveTo(cpX + 125, cpY, nodeB.x + 125, nodeB.y + 50);
        ctx.stroke();
    });
    
    requestAnimationFrame(drawThreads);
}

window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    resizeCanvas();
    spawnNodes();
    initConnections();
    drawThreads();
});

function resizeCanvas() {
    const canvas = document.getElementById('canvas-bg');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
