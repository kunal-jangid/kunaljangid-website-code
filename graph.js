// graph.js
const graphState = {
    nodes: [],
    connections: [],
    zoom: 1,
    offset: { x: 0, y: 0 },
    isDragging: false,
    accentColor: '#C2441C'
};

const CLUSTER_COLORS = {
    project: '#C2441C',
    music: '#1DB954',
    photo: '#ffffff'
};

const projects = [
    { 
        id: 'p1', 
        title: 'Metadata-Driven Configuration Platform', 
        category: 'Enterprise System // Core Architecture',
        desc: 'Co-architected a dynamic rendering layout using React 19 that dynamically compiles modular UI configurations from structured JSON/Metadata schemas.',
        tags: ['React 19', 'TypeScript', 'Dynamic Schema Layouts']
    },
    { 
        id: 'p2', 
        title: 'Distributed Platform Modernization', 
        category: 'Enterprise System // UI Modernization',
        desc: 'Led end-to-end framework modernization sprints to upgrade legacy frontend instances up to Angular 21, abstracting UI components.',
        tags: ['Angular 21', 'Architecture Refactoring', 'AI Driven Development']
    },
    { 
        id: 'p3', 
        title: 'High-Throughput Archival Processing Engine', 
        category: 'Enterprise System // Data Infrastructure',
        desc: 'Engineered a performant asynchronous database archival pipeline to process and offload 500M+ inactive historical table records.',
        tags: ['Java', 'Spring Boot', 'PL/SQL Optimization']
    },
    { 
        id: 'p4', 
        title: 'Autonomous Quantitative Analysis Dashboard', 
        category: 'Personal Project // Systems & Automation',
        desc: 'Modular quantitative Python data pipeline cross-referencing real-time prediction odds with news API data using localized LLM nodes.',
        tags: ['Python', 'Ollama', 'Gemma 3', 'TradingView API']
    },
    { 
        id: 'p5', 
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

async function spawnNodes() {
    spawnProjectNodes();
    spawnPhotoNodes();
    spawnDecorativeNodes();
    
    // Initial center view
    centerViewport();

    // Spawn music nodes asynchronously
    await spawnMusicNodes();
}

function centerViewport() {
    const worldCenterX = 2833;
    const worldCenterY = 2833;
    
    const padding = window.innerWidth < 768 ? 100 : 600;
    const availableWidth = window.innerWidth - padding;
    const availableHeight = window.innerHeight - padding;
    
    // More zoomed out on mobile initially to show scale
    const baseZoom = window.innerWidth < 768 ? 0.25 : 0.8;
    const desiredZoom = Math.min(availableWidth / 3500, availableHeight / 3500, baseZoom);
    
    graphState.zoom = Math.max(0.1, desiredZoom);
    graphState.offset.x = window.innerWidth / 2 - worldCenterX * graphState.zoom;
    graphState.offset.y = window.innerHeight / 2 - worldCenterY * graphState.zoom;
}

// Sanitization helper to prevent XSS
const escapeHTML = (str) => String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[m]);

function spawnProjectNodes() {
    const container = document.getElementById('node-container');
    projects.forEach((p, i) => {
        const node = document.createElement('div');
        node.className = 'node-card shadow-lg cursor-grab group';
        node.innerHTML = `
            <span class="text-[9px] uppercase tracking-widest opacity-40 font-mono">${escapeHTML(p.category)}</span>
            <h3 class="font-bold text-base leading-tight">${escapeHTML(p.title)}</h3>
            <p class="text-[11px] opacity-70 leading-relaxed mt-1 line-clamp-3 group-hover:line-clamp-none transition-all duration-300">${escapeHTML(p.desc)}</p>
            <div class="flex flex-wrap gap-1 mt-2">
                ${p.tags.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('')}
            </div>
        `;
        // Centered around 2500, 2500
        const x = 2500 + (Math.random() - 0.5) * 800;
        const y = 2500 + (Math.random() - 0.5) * 800;
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        
        container.appendChild(node);
        graphState.nodes.push({ 
            id: p.id, 
            cluster: 'project',
            element: node, 
            x, y, 
            vx: 0, vy: 0,
            lastX: x, lastY: y
        });
    });
}

async function spawnMusicNodes() {
    const container = document.getElementById('node-container');
    const workerEndpoint = 'https://spotify-telemetry.kunaljangid2k3.workers.dev';
    
    try {
        const response = await fetch(workerEndpoint);
        if (!response.ok) throw new Error();
        const data = await response.json();
        
        let tracksToRender = data.tracks && data.tracks.length > 0 ? data.tracks : [data];
        
        // Deduplicate tracks by songUrl to prevent identical vinyls
        const uniqueTracks = [];
        const seenUrls = new Set();
        for (const track of tracksToRender) {
            if (track.songUrl && !seenUrls.has(track.songUrl)) {
                seenUrls.add(track.songUrl);
                uniqueTracks.push(track);
            }
        }
        
        // Limit to 5 unique tracks to prevent the cluster from becoming too dense
        tracksToRender = uniqueTracks.slice(0, 9);
        
        tracksToRender.forEach((trackData, i) => {
            // Ensure a fallback cover exists
            const cover = trackData.coverUrl || 'https://images.unsplash.com/photo-1619983081563-430f53602796?w=400';
            const title = trackData.songName || 'Unknown Track';
            const artist = trackData.artistName || 'Unknown Artist';
            const link = trackData.songUrl || '#';

            const node = document.createElement('div');
            node.className = 'node-music shadow-2xl group';
            // Use dataset to store link for mouseup handler
            node.dataset.link = link;
            
            node.innerHTML = `
                <div class="vinyl-inner" style="background-image: url('${escapeHTML(cover)}')"></div>
                <div class="music-info-overlay">
                    <span class="text-[10px] font-bold uppercase tracking-tighter mb-1">${escapeHTML(artist)}</span>
                    <h4 class="text-xs font-black leading-tight">${escapeHTML(title)}</h4>
                    <span class="text-[8px] opacity-60 mt-2">[ Click to Open ]</span>
                </div>
            `;
            
            // Use existing cluster coordinates (2000, 4000) with wider spread for multiple
            const spread = tracksToRender.length > 1 ? 800 : 400;
            const x = 2000 + Math.random() * spread - (spread/2);
            const y = 4000 + Math.random() * spread - (spread/2);
            node.style.left = `${x}px`;
            node.style.top = `${y}px`;
            
            container.appendChild(node);
            graphState.nodes.push({ 
                id: `live-music-${i}`, 
                element: node, 
                x, y, 
                vx: 0, vy: 0, 
                lastX: x, lastY: y, 
                cluster: 'music' 
            });
        });
        
        // Re-initialize connections to include the newly fetched nodes
        initConnections();
    } catch (e) {
        console.warn("Could not fetch live music data", e);
    }
}


function spawnPhotoNodes() {
    const container = document.getElementById('node-container');
    if (!window.photoAssets) return;

    window.photoAssets.forEach((src, i) => {
        const node = document.createElement('div');
        node.className = 'node-photo group';
        node.innerHTML = `<img src="${escapeHTML(src)}" loading="lazy" alt="Photography ${escapeHTML(i)}">`;
        
        // Cluster around 4000, 2000
        const x = 4000 + (Math.random() - 0.5) * 1200;
        const y = 2000 + (Math.random() - 0.5) * 1200;
        
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        
        container.appendChild(node);
        graphState.nodes.push({
            id: `photo-${i}`,
            cluster: 'photo',
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
    let savedIndex = parseInt(localStorage.getItem('portfolio-theme-state')) || 0;
    
    function applyTheme(index) {
        const activeTheme = themeConfig[index] || themeConfig[0];
        const root = document.documentElement;

        root.style.setProperty('--bg-color', activeTheme.bg);
        root.style.setProperty('--text-color', activeTheme.text);
        root.style.setProperty('--border-color', activeTheme.border);
        root.style.setProperty('--accent-color', activeTheme.accent);
        
        graphState.accentColor = activeTheme.accent;
        CLUSTER_COLORS.project = activeTheme.accent;
        
        // Dynamically update the UI button colors
        const toggleBtn = document.getElementById('theme-toggle');
        if(toggleBtn) {
            toggleBtn.style.color = activeTheme.text;
            toggleBtn.style.borderColor = activeTheme.text;
        }
    }

    // Initial application
    applyTheme(savedIndex);
    console.log(`Graph Theme Sync: Initialized (${themeConfig[savedIndex].name})`);

    // Setup Toggle Listener
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            savedIndex = (savedIndex + 1) % themeConfig.length;
            localStorage.setItem('portfolio-theme-state', savedIndex);
            applyTheme(savedIndex);
        });
    }
}

function initConnections() {
    // Clear existing connections
    graphState.connections = [];

    const projectNodes = graphState.nodes.filter(n => n.cluster === 'project');
    const photoNodes = graphState.nodes.filter(n => n.cluster === 'photo');
    const musicNodes = graphState.nodes.filter(n => n.cluster === 'music');

    // Intra-cluster links (rings)
    [projectNodes, musicNodes, photoNodes].forEach(cluster => {
        for (let i = 0; i < cluster.length; i++) {
            const fromIdx = graphState.nodes.indexOf(cluster[i]);
            const toIdx = graphState.nodes.indexOf(cluster[(i + 1) % cluster.length]);
            graphState.connections.push({ from: fromIdx, to: toIdx, type: 'inner' });
        }
    });

    // Inter-cluster bridges
    if (projectNodes.length && musicNodes.length) createBridges(projectNodes, musicNodes);
    if (musicNodes.length && photoNodes.length) createBridges(musicNodes, photoNodes);
    if (photoNodes.length && projectNodes.length) createBridges(photoNodes, projectNodes);
}

function createBridges(groupA, groupB) {
    const bridgeCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 bridges
    for (let i = 0; i < bridgeCount; i++) {
        const nodeA = groupA[Math.floor(Math.random() * groupA.length)];
        const nodeB = groupB[Math.floor(Math.random() * groupB.length)];
        graphState.connections.push({
            from: graphState.nodes.indexOf(nodeA),
            to: graphState.nodes.indexOf(nodeB),
            type: 'bridge'
        });
    }
}

// Interaction State
let activeNode = null;
let isPanning = false;
let startPan = { x: 0, y: 0 };
let dragOffset = { x: 0, y: 0 };
let hasDragged = false;
let navAnimationId = null;

document.addEventListener('mousedown', (e) => {
    if (navAnimationId) {
        cancelAnimationFrame(navAnimationId);
        navAnimationId = null;
    }
    const card = e.target.closest('.node-card, .node-photo, .node-music');
    if (card) {
        activeNode = graphState.nodes.find(n => n.element === card);
        const rect = card.getBoundingClientRect();
        dragOffset.x = (e.clientX - rect.left) / graphState.zoom;
        dragOffset.y = (e.clientY - rect.top) / graphState.zoom;
        
        card.style.cursor = 'grabbing';
        card.style.zIndex = 1000;
        card.classList.add('dragging');
        hasDragged = false;
    } else {
        isPanning = true;
        startPan.x = e.clientX - graphState.offset.x;
        startPan.y = e.clientY - graphState.offset.y;
        document.body.style.cursor = 'grabbing';
    }
});

document.addEventListener('mousemove', (e) => {
    if (activeNode) {
        hasDragged = true;
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
        const card = activeNode.element;
        card.style.cursor = 'grab';
        
        card.style.zIndex = 10;
        card.style.transform = 'scale(1)';
        card.classList.remove('dragging');
        
        // Custom click handler for vinyl nodes to prevent firing on drag
        if (!hasDragged && card.classList.contains('node-music')) {
            const link = card.dataset.link;
            if (link) window.open(link, '_blank');
        }
        
        activeNode = null;
    }
    isPanning = false;
    document.body.style.cursor = 'default';
});

document.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true,
        cancelable: true,
        view: window
    });
    e.target.dispatchEvent(mouseEvent);
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true,
        cancelable: true,
        view: window
    });
    e.target.dispatchEvent(mouseEvent);
    e.preventDefault();
}, { passive: false });

const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const mouseEvent = new MouseEvent('mouseup', {
        clientX: touch ? touch.clientX : 0,
        clientY: touch ? touch.clientY : 0,
        bubbles: true,
        cancelable: true,
        view: window
    });
    e.target.dispatchEvent(mouseEvent);
};

document.addEventListener('touchend', handleTouchEnd, { passive: false });
document.addEventListener('touchcancel', handleTouchEnd, { passive: false });

document.addEventListener('wheel', (e) => {
    if (navAnimationId) {
        cancelAnimationFrame(navAnimationId);
        navAnimationId = null;
    }
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

function smoothNavigate(targetX, targetY, targetZoom) {
    if (navAnimationId) cancelAnimationFrame(navAnimationId);
    
    const startX = graphState.offset.x;
    const startY = graphState.offset.y;
    const startZoom = graphState.zoom;
    
    // Target offset needs to center the world coordinate (targetX, targetY)
    const finalOffsetX = window.innerWidth / 2 - targetX * targetZoom;
    const finalOffsetY = window.innerHeight / 2 - targetY * targetZoom;
    
    const duration = 800;
    const startTime = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Cubic-out easing
        const ease = 1 - Math.pow(1 - progress, 3);
        
        graphState.offset.x = startX + (finalOffsetX - startX) * ease;
        graphState.offset.y = startY + (finalOffsetY - startY) * ease;
        graphState.zoom = startZoom + (targetZoom - startZoom) * ease;
        
        updateTransform();
        
        if (progress < 1) {
            navAnimationId = requestAnimationFrame(animate);
        } else {
            navAnimationId = null;
        }
    }
    
    navAnimationId = requestAnimationFrame(animate);
}

// Export or make available globally if needed for HTML buttons
window.smoothNavigate = smoothNavigate;

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

const NODE_OFFSETS = {
    project: { x: 150, y: 75 },
    music: { x: 90, y: 90 }, // Updated for 180x180 circle
    photo: { x: 100, y: 100 }
};

function drawThreads() {
    const canvas = document.getElementById('canvas-bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const time = Date.now() * 0.001;
    const zoom = graphState.zoom;
    const offX = graphState.offset.x;
    const offY = graphState.offset.y;
    const vw = canvas.width;
    const vh = canvas.height;
    
    drawGrid(ctx, canvas, time);

    // Render Decorative Nodes
    decorativeNodes.forEach(dn => {
        const dx = dn.x * zoom + offX;
        const dy = dn.y * zoom + offY;
        
        // Skip if off-screen
        if (dx < -50 || dx > vw + 50 || dy < -50 || dy > vh + 50) return;

        const pulse = Math.sin(time + dn.phase) * 0.5 + 0.5;
        ctx.fillStyle = graphState.accentColor;
        ctx.globalAlpha = 0.1 + pulse * 0.2;
        ctx.beginPath();
        ctx.arc(dx, dy, dn.size * zoom, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    graphState.connections.forEach(conn => {
        const nodeA = graphState.nodes[conn.from];
        const nodeB = graphState.nodes[conn.to];
        
        if (!nodeA || !nodeB) return;

        // Visibility Culling
        const offsetA = NODE_OFFSETS[nodeA.cluster];
        const offsetB = NODE_OFFSETS[nodeB.cluster];

        const ax = nodeA.x * zoom + offX + offsetA.x * zoom;
        const ay = nodeA.y * zoom + offY + offsetA.y * zoom;
        const bx = nodeB.x * zoom + offX + offsetB.x * zoom;
        const by = nodeB.y * zoom + offY + offsetB.y * zoom;

        // Skip if both ends are off-screen
        const buffer = 200 * zoom;
        if ((ax < -buffer && bx < -buffer) || 
            (ax > vw + buffer && bx > vw + buffer) || 
            (ay < -buffer && by < -buffer) || 
            (ay > vh + buffer && by > vh + buffer)) {
            return;
        }

        const threadColor = CLUSTER_COLORS[nodeA.cluster];
        
        const dist = Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2));
        const cpX = (ax + bx) / 2 + Math.sin(time + conn.from) * (dist * 0.1);
        const cpY = (ay + by) / 2 + Math.cos(time + conn.to) * (dist * 0.1) + 50 * zoom;
        
        // Aura Glow
        ctx.shadowBlur = 15 * zoom;
        ctx.shadowColor = threadColor;
        
        // Spectrum shift thread
        if (conn.type === 'bridge') {
            ctx.setLineDash([10 * zoom, 5 * zoom]);
            const gradient = ctx.createLinearGradient(ax, ay, bx, by);
            gradient.addColorStop(0, threadColor);
            gradient.addColorStop(1, CLUSTER_COLORS[nodeB.cluster]);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2 * zoom;
        } else {
            ctx.setLineDash([]);
            ctx.strokeStyle = threadColor;
            ctx.lineWidth = 3 * zoom;
        }
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(cpX, cpY, bx, by);
        ctx.stroke();
        
        // Secondary thin core line
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'white';
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 1 * zoom;
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

