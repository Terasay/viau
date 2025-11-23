let currentUser = null;
let maps = [];
let currentMapId = null;

const canvas = document.getElementById('canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const zoomInfo = document.getElementById('zoomInfo');
const zoomInput = document.getElementById('zoomInput');
const quadLevelSelect = document.getElementById('quadLevelSelect');

let manualQuadLevel = null;
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

async function init() {
    await checkAuth();
    if (currentUser) {
        if (currentUser.role === 'admin') {
            document.getElementById('uploadMapBtn').style.display = 'block';
        }
        await loadMaps();
    }
    setupEventListeners();
}

async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }
    
    try {
        const response = await fetch('/me', {
            headers: { 'Authorization': token }
        });
        const data = await response.json();
        if (data.logged_in) {
            currentUser = data;
        } else {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        window.location.href = '/';
    }
}

async function loadMaps() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/maps/list', {
            headers: { 'Authorization': token }
        });
        const data = await response.json();
        if (data.success) {
            maps = data.maps;
            renderGallery();
        }
    } catch (error) {
        console.error('Ошибка загрузки карт:', error);
    }
}

function renderGallery() {
    const gallery = document.getElementById('mapGallery');
    
    if (maps.length === 0) {
        gallery.innerHTML = '<div class="no-maps">Карты пока не загружены</div>';
        return;
    }
    
    gallery.innerHTML = '';
    
    maps.forEach(map => {
        const card = document.createElement('div');
        card.className = 'map-card';
        
        card.innerHTML = `
            <img class="map-card-image" src="${map.file_url}" alt="${map.name}">
            <div class="map-card-info">
                <div class="map-card-title">${map.name}</div>
                ${currentUser.role === 'admin' ? `
                    <div class="map-card-actions">
                        <button class="btn-edit" onclick="openEditModal(${map.id}, '${map.name}')">Редактировать</button>
                        <button class="btn-delete" onclick="deleteMap(${map.id})">Удалить</button>
                    </div>
                ` : ''}
            </div>
        `;
        
        card.querySelector('.map-card-image').onclick = () => openMapViewer(map.id);
        card.querySelector('.map-card-title').onclick = () => openMapViewer(map.id);
        
        gallery.appendChild(card);
    });
}

function openMapViewer(mapId) {
    currentMapId = mapId;
    const map = maps.find(m => m.id === mapId);
    if (!map) return;
    
    document.getElementById('galleryScreen').style.display = 'none';
    document.getElementById('viewerScreen').style.display = 'block';
    
    const img = new Image();
    img.onload = () => {
        mapImage = img;
        resizeCanvas();
        fitToScreen();
    };
    img.src = map.file_url;
}

function closeViewer() {
    document.getElementById('viewerScreen').style.display = 'none';
    document.getElementById('galleryScreen').style.display = 'block';
    currentMapId = null;
    mapImage = null;
}

function openUploadModal() {
    document.getElementById('uploadModal').style.display = 'flex';
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
    document.getElementById('mapNameInput').value = '';
    document.getElementById('mapFileInput').value = '';
    document.getElementById('uploadStatus').textContent = '';
}

async function submitUploadMap() {
    const name = document.getElementById('mapNameInput').value.trim();
    const fileInput = document.getElementById('mapFileInput');
    const file = fileInput.files[0];
    
    if (!name) {
        showUploadStatus('Введите название карты', 'error');
        return;
    }
    
    if (!file) {
        showUploadStatus('Выберите файл карты', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/maps/upload', {
            method: 'POST',
            headers: { 'Authorization': token },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showUploadStatus('Карта успешно загружена!', 'success');
            setTimeout(() => {
                closeUploadModal();
                loadMaps();
            }, 1500);
        } else {
            showUploadStatus(data.error || 'Ошибка загрузки', 'error');
        }
    } catch (error) {
        showUploadStatus('Ошибка соединения', 'error');
    }
}

function showUploadStatus(message, type) {
    const status = document.getElementById('uploadStatus');
    status.textContent = message;
    status.className = type;
}

let editingMapId = null;

function openEditModal(mapId, currentName) {
    editingMapId = mapId;
    document.getElementById('editMapNameInput').value = currentName;
    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    editingMapId = null;
}

async function submitEditMap() {
    const newName = document.getElementById('editMapNameInput').value.trim();
    
    if (!newName) {
        alert('Введите название карты');
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/maps/edit', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: editingMapId,
                name: newName
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeEditModal();
            loadMaps();
        } else {
            alert(data.error || 'Ошибка редактирования');
        }
    } catch (error) {
        alert('Ошибка соединения');
    }
}

async function deleteMap(mapId) {
    if (!confirm('Вы уверены, что хотите удалить эту карту?')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/maps/delete', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: mapId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadMaps();
        } else {
            alert(data.error || 'Ошибка удаления');
        }
    } catch (error) {
        alert('Ошибка соединения');
    }
}

function setupEventListeners() {
    document.getElementById('uploadMapBtn')?.addEventListener('click', openUploadModal);
    document.getElementById('backToMainBtn')?.addEventListener('click', () => {
        window.location.href = '/';
    });
    
    if (!canvas) return;
    
    if (quadLevelSelect) {
        quadLevelSelect.addEventListener('change', () => {
            manualQuadLevel = quadLevelSelect.value === 'auto' ? null : parseInt(quadLevelSelect.value, 10);
            draw();
        });
    }
    
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
    
    window.addEventListener('resize', resizeCanvas);
    
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
}

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 60;
    draw();
}

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

function fitToScreen() {
    if (!mapImage) {
        zoom = 1.0;
        panX = 0;
        panY = 0;
        draw();
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
    
    zoom *= factor;
    if (zoom < 0.05) zoom = 0.05;
    if (zoom > 100) zoom = 100;
    
    panX = x - (worldX * zoom + canvas.width / 2);
    panY = y - (worldY * zoom + canvas.height / 2);
    
    draw();
}

function getQuadLevel() {
    if (manualQuadLevel !== null) return manualQuadLevel;
    
    if (zoom < 0.3) return 0;
    if (zoom < 0.8) return 1;
    if (zoom < 1.5) return 2;
    if (zoom < 3.5) return 3;
    return 4;
}

function draw() {
    if (!ctx || !canvas) return;
    
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
    
    if (zoomInfo) {
        let levelText = manualQuadLevel !== null ? `Ручной: ${level}` : `Авто: ${level}`;
        zoomInfo.textContent = `Zoom: ${zoom.toFixed(2)}x | Level: ${levelText}`;
    }
    if (zoomInput) zoomInput.value = zoom.toFixed(2);
    if (quadLevelSelect) quadLevelSelect.value = manualQuadLevel === null ? 'auto' : String(manualQuadLevel);
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

init();