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
        node.className = 'node-card shadow-lg';
        node.innerHTML = `
            <span class="text-[10px] uppercase tracking-widest opacity-50 font-mono">${p.category}</span>
            <h3 class="font-bold text-sm">${p.title}</h3>
        `;
        // Random distribution in world space
        const x = Math.random() * 2000 + 1000;
        const y = Math.random() * 2000 + 1000;
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
        
        ctx.beginPath();
        // Offset by card center (approx 125x50)
        ctx.moveTo(nodeA.x + 125, nodeA.y + 50);
        ctx.lineTo(nodeB.x + 125, nodeB.y + 50);
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
