let currentUser = null;
let maps = [];
let currentMapId = null;

let gridSettings = {
    visible: true,
    mainColor: '#e74c3c',
    level1Color: '#3498db',
    level2Color: '#2ecc71',
    level3Color: '#9b59b6',
    level4Color: '#e67e22',
    mainLineWidth: 2,
    subLineWidth: 1
};

const canvas = document.getElementById('canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const zoomInfo = document.getElementById('zoomInfo');
const zoomInput = document.getElementById('zoomInput');
const quadLevelSelect = document.getElementById('quadLevelSelect');
const fileInput = document.getElementById('mapFileInput');
if (fileInput) {
    fileInput.addEventListener('change', handleFilePreview);
}

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
    loadSettings();
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
        const response = await fetch('/api/maps/list', {
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

function handleFilePreview(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('filePreview');
    const fileDisplay = document.querySelector('.file-input-display span');
    
    if (file) {
        fileDisplay.textContent = file.name;
        fileDisplay.style.color = '#4facfe';
        
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewContainer.innerHTML = `
                    <div class="preview-info">
                        <i class="fas fa-check-circle"></i>
                        <span>Файл выбран: <strong>${file.name}</strong></span>
                        <span class="file-size">${fileSizeMB} МБ</span>
                    </div>
                    <img src="${e.target.result}" alt="Предпросмотр" class="preview-image">
                `;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    } else {
        fileDisplay.textContent = 'Выберите файл...';
        fileDisplay.style.color = '#b8c5d6';
        previewContainer.style.display = 'none';
    }
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
    document.getElementById('mapNameInput').value = '';
    document.getElementById('mapFileInput').value = '';
    document.getElementById('uploadStatus').textContent = '';
    
    const previewContainer = document.getElementById('filePreview');
    const fileDisplay = document.querySelector('.file-input-display span');
    if (previewContainer) previewContainer.style.display = 'none';
    if (fileDisplay) {
        fileDisplay.textContent = 'Выберите файл...';
        fileDisplay.style.color = '#b8c5d6';
    }
}

async function submitUploadMap() {
    const name = document.getElementById('mapNameInput').value.trim();
    const fileInput = document.getElementById('mapFileInput');
    const file = fileInput.files[0];
    
    if (!name) {
        window.showWarning('Предупреждение', 'Введите название карты');
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
        const response = await fetch('/api/maps/upload', {
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
        const response = await fetch('/api/maps/edit', {
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
        const response = await fetch('/api/maps/delete', {
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
    
    if (gridSettings.visible) {
        drawQuadTree(offsetX, offsetY, mapWidth, mapHeight, level);
    }
    
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
    
    ctx.strokeStyle = gridSettings.mainColor;
    ctx.lineWidth = gridSettings.mainLineWidth;
    ctx.strokeRect(x, y, width, height);
    
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
            
            ctx.strokeStyle = gridSettings.mainColor;
            ctx.lineWidth = gridSettings.mainLineWidth;
            ctx.beginPath();
            
            if (j < gridSize - 1) {
                ctx.moveTo(qx + quadWidth, qy);
                ctx.lineTo(qx + quadWidth, qy + quadHeight);
            }
            
            if (i < gridSize - 1) {
                ctx.moveTo(qx, qy + quadHeight);
                ctx.lineTo(qx + quadWidth, qy + quadHeight);
            }
            
            ctx.stroke();
            
            if (maxLevel === 0 && quadWidth > 40) {
                const fontSize = Math.max(12, Math.min(32, quadWidth / 8));
                ctx.fillStyle = gridSettings.mainColor;
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
    
    const colors = [
        gridSettings.level1Color,
        gridSettings.level2Color,
        gridSettings.level3Color,
        gridSettings.level4Color
    ];
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
            ctx.lineWidth = gridSettings.subLineWidth;
            ctx.beginPath();
            
            if (j < subGrid - 1) {
                ctx.moveTo(sx + subWidth, sy);
                ctx.lineTo(sx + subWidth, sy + subHeight);
            }
            
            if (i < subGrid - 1) {
                ctx.moveTo(sx, sy + subHeight);
                ctx.lineTo(sx + subWidth, sy + subHeight);
            }
            
            ctx.stroke();
            
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

function loadSettings() {
    const saved = localStorage.getItem('mapGridSettings');
    if (saved) {
        try {
            gridSettings = JSON.parse(saved);
            applySettings();
        } catch (e) {
            console.error('Ошибка загрузки настроек:', e);
        }
    }
}

function saveSettings() {
    localStorage.setItem('mapGridSettings', JSON.stringify(gridSettings));
}

function applySettings() {
    const toggleGrid = document.getElementById('toggleGrid');
    const mainGridColor = document.getElementById('mainGridColor');
    const level1Color = document.getElementById('level1Color');
    const level2Color = document.getElementById('level2Color');
    const level3Color = document.getElementById('level3Color');
    const level4Color = document.getElementById('level4Color');
    const mainLineWidth = document.getElementById('mainLineWidth');
    const subLineWidth = document.getElementById('subLineWidth');
    const mainLineWidthValue = document.getElementById('mainLineWidthValue');
    const subLineWidthValue = document.getElementById('subLineWidthValue');
    
    if (toggleGrid) toggleGrid.checked = gridSettings.visible;
    if (mainGridColor) mainGridColor.value = gridSettings.mainColor;
    if (level1Color) level1Color.value = gridSettings.level1Color;
    if (level2Color) level2Color.value = gridSettings.level2Color;
    if (level3Color) level3Color.value = gridSettings.level3Color;
    if (level4Color) level4Color.value = gridSettings.level4Color;
    if (mainLineWidth) mainLineWidth.value = gridSettings.mainLineWidth;
    if (subLineWidth) subLineWidth.value = gridSettings.subLineWidth;
    if (mainLineWidthValue) mainLineWidthValue.textContent = gridSettings.mainLineWidth + 'px';
    if (subLineWidthValue) subLineWidthValue.textContent = gridSettings.subLineWidth + 'px';
    
    if (canvas) draw();
}

function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'block';
        panel.classList.add('settings-panel-open');
    } else {
        panel.style.display = 'none';
        panel.classList.remove('settings-panel-open');
    }
}

function updateGridVisibility() {
    gridSettings.visible = document.getElementById('toggleGrid').checked;
    saveSettings();
    draw();
}

function updateGridColors() {
    gridSettings.mainColor = document.getElementById('mainGridColor').value;
    gridSettings.level1Color = document.getElementById('level1Color').value;
    gridSettings.level2Color = document.getElementById('level2Color').value;
    gridSettings.level3Color = document.getElementById('level3Color').value;
    gridSettings.level4Color = document.getElementById('level4Color').value;
    saveSettings();
    draw();
}

function updateLineWidth(type, value) {
    if (type === 'main') {
        gridSettings.mainLineWidth = parseFloat(value);
        document.getElementById('mainLineWidthValue').textContent = value + 'px';
    } else {
        gridSettings.subLineWidth = parseFloat(value);
        document.getElementById('subLineWidthValue').textContent = value + 'px';
    }
    saveSettings();
    draw();
}

function resetSettings() {
    gridSettings = {
        visible: true,
        mainColor: '#e74c3c',
        level1Color: '#3498db',
        level2Color: '#2ecc71',
        level3Color: '#9b59b6',
        level4Color: '#e67e22',
        mainLineWidth: 2,
        subLineWidth: 1
    };
    saveSettings();
    applySettings();
}

init();