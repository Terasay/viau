const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('fileInput');
const zoomInfo = document.getElementById('zoomInfo');
const zoomInput = document.getElementById('zoomInput');
if (zoomInput) {
    zoomInput.addEventListener('change', (e) => {
        let val = parseFloat(zoomInput.value.replace(',', '.'));
        if (isNaN(val)) return;
        if (val < 0.05) val = 0.05;
        if (val > 100) val = 100;
        zoom = val;
        draw();
    });
}

let mapImage = null;
let zoom = 1.0;
let panX = 0;
let panY = 0;
let isDragging = false;
let lastX = 0;
let lastY = 0;
let animationFrame = null;
let mouseX = 0;
let mouseY = 0;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 60;
    draw();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                mapImage = img;
                fitToScreen();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

function zoomInButton() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    zoomAt(centerX, centerY, 1.3);
}

function zoomOutButton() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    zoomAt(centerX, centerY, 1 / 1.3);
}

function resetView() {
    zoom = 1.0;
    panX = 0;
    panY = 0;
    draw();
}

function fitToScreen() {
    if (!mapImage) {
        resetView();
        return;
    }

    const scaleX = canvas.width / mapImage.width;
    const scaleY = canvas.height / mapImage.height;
    zoom = Math.min(scaleX, scaleY) * 0.95;

    panX = 0;
    panY = 0;
    draw();
}

function zoomAt(x, y, factor) {
    const worldX = (x - panX - canvas.width / 2) / zoom;
    const worldY = (y - panY - canvas.height / 2) / zoom;

    const oldZoom = zoom;
    zoom *= factor;
    if (zoom < 0.05) zoom = 0.05;
    if (zoom > 100) zoom = 100;

    panX = x - (worldX * zoom + canvas.width / 2);
    panY = y - (worldY * zoom + canvas.height / 2);

    draw();
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        panX += dx;
        panY += dy;
        lastX = e.clientX;
        lastY = e.clientY;
        
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(draw);
    }
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    zoomAt(mouseX, mouseY, factor);
    
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(draw);
}, { passive: false });

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
});

function getQuadLevel() {
    let mapWidth = mapImage ? mapImage.width * zoom : 800 * zoom;
    const quadSize = (mapWidth / 4);

    // Новые пороги для уровней:
    // 0: только буквы (до 0.3 зума)
    // 1: A1-A9 (от 0.3 до 0.8)
    // 2: A11-A99 (от 0.8 до 1.5)
    // 3: A111-A999 (от 1.5 до 3.5)
    // 4: A1111-A9999 (от 3.5 и выше)

    if (zoom < 0.3) return 0;         // Только буквы A-S
    if (zoom < 0.8) return 1;         // A1-A9
    if (zoom < 1.5) return 2;         // A11-A99
    if (zoom < 3.5) return 3;         // A111-A999
    return 4;                         // A1111-A9999
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let mapWidth, mapHeight, offsetX, offsetY;

    if (mapImage) {
        mapWidth = mapImage.width * zoom;
        mapHeight = mapImage.height * zoom;
        offsetX = canvas.width / 2 + panX - mapWidth / 2;
        offsetY = canvas.height / 2 + panY - mapHeight / 2;

        ctx.drawImage(mapImage, offsetX, offsetY, mapWidth, mapHeight);
    } else {
        mapWidth = 800 * zoom;
        mapHeight = 600 * zoom;
        offsetX = canvas.width / 2 + panX - mapWidth / 2;
        offsetY = canvas.height / 2 + panY - mapHeight / 2;

        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(offsetX, offsetY, mapWidth, mapHeight);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;
        ctx.strokeRect(offsetX, offsetY, mapWidth, mapHeight);
    }

    const level = getQuadLevel();
    drawQuadTree(offsetX, offsetY, mapWidth, mapHeight, level);

    zoomInfo.textContent = `Zoom: ${zoom.toFixed(2)}x | Level: ${level}`;
    if (zoomInput) zoomInput.value = zoom.toFixed(2);
}

function drawQuadTree(x, y, width, height, maxLevel) {
    const gridSize = 4;
    const quadWidth = width / gridSize;
    const quadHeight = height / gridSize;

    if (quadWidth < 20 || quadHeight < 20) return;

    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'];

    let index = 0;
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (index >= 16) break;
            
            const qx = x + j * quadWidth;
            const qy = y + i * quadHeight;

            if (qx + quadWidth < 0 || qx > canvas.width || 
                qy + quadHeight < 0 || qy > canvas.height) {
                index++;
                continue;
            }

            const letter = letters[index];

            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.strokeRect(qx, qy, quadWidth, quadHeight);

            if (maxLevel === 0 && quadWidth > 40) {
                const fontSize = Math.max(12, Math.min(32, quadWidth / 8));
                ctx.fillStyle = '#e74c3c';
                ctx.font = `bold ${fontSize}px Arial`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(letter, qx + 6, qy + 4);
            }

            if (maxLevel >= 1) {
                drawSubQuadrants(qx, qy, quadWidth, quadHeight, letter, 1, maxLevel);
            }
            
            index++;
        }
    }
}

function drawSubQuadrants(x, y, width, height, prefix, currentLevel, maxLevel) {
    const subGrid = 3;
    const subWidth = width / subGrid;
    const subHeight = height / subGrid;

    if (subWidth < 10 || subHeight < 10) return;

    const colors = ['#3498db', '#2ecc71', '#9b59b6', '#e67e22'];
    const color = colors[Math.min(currentLevel - 1, colors.length - 1)];

    for (let i = 0; i < subGrid; i++) {
        for (let j = 0; j < subGrid; j++) {
            const sx = x + j * subWidth;
            const sy = y + i * subHeight;

            if (sx + subWidth < 0 || sx > canvas.width || 
                sy + subHeight < 0 || sy > canvas.height) continue;

            const num = i * subGrid + j + 1;
            const label = `${prefix}${num}`;

            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeRect(sx, sy, subWidth, subHeight);

            if (currentLevel === maxLevel && subWidth > 30) {
                const fontSize = Math.max(7, Math.min(16, subWidth / 5));
                ctx.fillStyle = color;
                ctx.font = `${fontSize}px Arial`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(label, sx + 4, sy + 2);
            }

            if (currentLevel < maxLevel) {
                drawSubQuadrants(sx, sy, subWidth, subHeight, label, currentLevel + 1, maxLevel);
            }
        }
    }
}

draw();