// Модуль для работы с древом технологий

let techData = null;
let allTechData = {}; // Хранит все категории для межкатегориальных связей
let playerProgress = null;
let selectedTech = null;
let isInitialized = false;
let currentCategory = 'land_forces';

// Инициализация модуля технологий
async function initTechnologies(category = 'land_forces') {
    console.log('Initializing tech tree for category:', category);
    currentCategory = category;
    
    try {
        const token = localStorage.getItem('token');
        
        // Загружаем ВСЕ категории технологий для межкатегориальных требований
        const categories = ['land_forces', 'navy', 'industry', 'education', 'infrastructure', 'economy'];
        
        for (const cat of categories) {
            const response = await fetch(`/api/tech/tree/${cat}`, {
                headers: { 'Authorization': token }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    allTechData[cat] = data.data;
                }
            }
        }
        
        // Устанавливаем текущую категорию
        if (allTechData[category]) {
            techData = allTechData[category];
            console.log('Tech data loaded:', techData);
        } else {
            console.error('Failed to load tech tree for category:', category);
            showError('Не удалось загрузить древо технологий');
            return;
        }
        
        // Загружаем прогресс игрока
        const progressResponse = await fetch('/api/tech/player/progress', {
            headers: { 'Authorization': token }
        });
        
        if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            console.log('Player progress:', progressData);
            if (progressData.success) {
                playerProgress = progressData;
            }
        }
        
        // Отрисовываем древо
        renderTechTree();
        isInitialized = true;
        console.log('Tech tree initialized successfully');
        
    } catch (error) {
        console.error('Error initializing technologies:', error);
    }
}

// Отрисовка древа технологий
function renderTechTree() {
    console.log('Rendering tech tree...');
    const container = document.getElementById('tech-tree-content');
    if (!container) {
        console.error('Tech tree container not found!');
        return;
    }
    
    if (!techData) {
        console.error('No tech data to render!');
        return;
    }
    
    console.log('Container found, clearing content');
    container.innerHTML = '';
    
    // Заголовок категории
    const header = document.createElement('div');
    header.className = 'tech-category-header';
    header.innerHTML = `
        <div class="tech-category-title">
            <i class="fas fa-flag"></i>
            <h3>${techData.name}</h3>
        </div>
    `;
    container.appendChild(header);
    console.log('Header added');
    
    // Контейнер линий
    const linesContainer = document.createElement('div');
    linesContainer.className = 'tech-lines-container';
    
    // Wrapper для контента с прокруткой
    const wrapper = document.createElement('div');
    wrapper.className = 'tech-lines-wrapper';
    
    console.log('Rendering', techData.lines.length, 'tech lines');
    
    // Отрисовываем каждую линию технологий горизонтально
    techData.lines.forEach((line, index) => {
        console.log(`Rendering line ${index + 1}:`, line.name);
        const lineElement = renderTechLine(line, index);
        wrapper.appendChild(lineElement);
    });
    
    linesContainer.appendChild(wrapper);
    
    // Добавляем drag-to-scroll
    setupDragScroll(linesContainer);
    
    // Индикатор зума
    const zoomIndicator = document.createElement('div');
    zoomIndicator.className = 'tech-zoom-indicator';
    zoomIndicator.textContent = '100%';
    linesContainer.appendChild(zoomIndicator);
    
    container.appendChild(linesContainer);
    console.log('Lines container added');
    
    // Легенда
    const legend = document.createElement('div');
    legend.className = 'tech-legend';
    legend.innerHTML = `
        <div class="tech-legend-item">
            <div class="tech-legend-box researched"></div>
            <span>Изучено</span>
        </div>
        <div class="tech-legend-item">
            <div class="tech-legend-box available"></div>
            <span>Доступно</span>
        </div>
        <div class="tech-legend-item">
            <div class="tech-legend-box locked"></div>
            <span>Заблокировано</span>
        </div>
    `;
    container.appendChild(legend);
    console.log('Legend added. Render complete!');
}

// Настройка drag-to-scroll
function setupDragScroll(element) {
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;
    let currentZoom = 1;
    const minZoom = 0.3;
    const maxZoom = 2;
    const zoomSpeed = 0.1;
    
    const wrapper = element.querySelector('.tech-lines-wrapper');
    
    element.addEventListener('mousedown', (e) => {
        // Игнорируем клики по узлам технологий
        if (e.target.closest('.tech-node')) return;
        
        isDragging = true;
        element.classList.add('dragging');
        startX = e.pageX;
        startY = e.pageY;
        scrollLeft = element.scrollLeft;
        scrollTop = element.scrollTop;
    });
    
    element.addEventListener('mouseleave', () => {
        isDragging = false;
        element.classList.remove('dragging');
    });
    
    element.addEventListener('mouseup', () => {
        isDragging = false;
        element.classList.remove('dragging');
    });
    
    element.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX;
        const y = e.pageY;
        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;
        element.scrollLeft = scrollLeft - walkX;
        element.scrollTop = scrollTop - walkY;
    });
    
    // Зум колёсиком мыши
    element.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
        const newZoom = Math.min(Math.max(currentZoom + delta, minZoom), maxZoom);
        
        if (newZoom !== currentZoom) {
            // Получаем позицию курсора относительно контейнера
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Вычисляем точку масштабирования
            const scrollX = element.scrollLeft + x;
            const scrollY = element.scrollTop + y;
            
            // Применяем новый зум
            currentZoom = newZoom;
            wrapper.style.transform = `scale(${currentZoom})`;
            wrapper.style.transformOrigin = '0 0';
            
            // Корректируем скролл чтобы зум был относительно курсора
            element.scrollLeft = scrollX * (newZoom / (currentZoom - delta)) - x;
            element.scrollTop = scrollY * (newZoom / (currentZoom - delta)) - y;
            
            // Обновляем индикатор зума
            const indicator = element.querySelector('.tech-zoom-indicator');
            if (indicator) {
                indicator.textContent = `${Math.round(currentZoom * 100)}%`;
                indicator.classList.add('visible');
                clearTimeout(indicator.hideTimeout);
                indicator.hideTimeout = setTimeout(() => {
                    indicator.classList.remove('visible');
                }, 1500);
            }
        }
    }, { passive: false });
}

// Отрисовка одной линии технологий
function renderTechLine(line, lineIndex) {
    const lineDiv = document.createElement('div');
    lineDiv.className = 'tech-line';
    
    const lineHorizontalOffset = lineIndex * 1600; // расстояние между линиями по горизонтали
    lineDiv.style.left = `${lineHorizontalOffset}px`;
    
    // Заголовок линии
    const header = document.createElement('div');
    header.className = 'tech-line-header';
    header.innerHTML = `
        <h4><i class="fas fa-stream"></i> ${line.name}</h4>
    `;
    lineDiv.appendChild(header);
    
    // Контейнер для узлов
    const nodesContainer = document.createElement('div');
    nodesContainer.className = 'tech-nodes-container';
    nodesContainer.id = `tech-line-${line.id}`;
    
    // Создаем SVG для связей
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('tech-connections');
    svg.style.width = '100%';
    svg.style.height = '100%';
    nodesContainer.appendChild(svg);
    
    // Вычисляем позиции для технологий
    const positions = calculateTechPositions(line.technologies);
    
    // Обновляем высоту контейнера
    const maxY = Math.max(...Object.values(positions).map(p => p.y));
    nodesContainer.style.minHeight = `${maxY + 200}px`;
    
    // Отрисовываем узлы с вычисленными позициями
    const nodeElements = {};
    line.technologies.forEach(tech => {
        const node = createTechNode(tech);
        const pos = positions[tech.id];
        node.style.left = `${pos.x}px`;
        node.style.top = `${pos.y}px`;
        nodesContainer.appendChild(node);
        nodeElements[tech.id] = node;
    });
    
    lineDiv.appendChild(nodesContainer);
    
    // Рисуем связи после того, как элементы добавлены в DOM
    setTimeout(() => {
        drawConnections(line.technologies, nodeElements, svg, positions);
    }, 100);
    
    return lineDiv;
}

// Вычисление позиций технологий в виде древа по зависимостям
function calculateTechPositions(technologies) {
    const positions = {};
    const nodeWidth = 260; // ширина узла + отступ
    const verticalSpacing = 150; // расстояние между уровнями по вертикали
    const horizontalSpacing = 80; // минимальное расстояние между узлами
    
    // Создаем карту технологий для быстрого доступа
    const techMap = {};
    technologies.forEach(tech => {
        techMap[tech.id] = tech;
    });
    
    // Функция для расчета уровня (глубины) технологии в дереве
    const calculateLevel = (techId, visited = new Set()) => {
        if (visited.has(techId)) return 0; // защита от циклов
        visited.add(techId);
        
        const tech = techMap[techId];
        if (!tech || !tech.requires || tech.requires.length === 0) {
            return 0; // корневая технология
        }
        
        // Уровень = максимальный уровень родителей + 1
        const parentLevels = tech.requires
            .filter(reqId => techMap[reqId]) // только технологии из этой линии
            .map(reqId => calculateLevel(reqId, new Set(visited)));
        
        return parentLevels.length > 0 ? Math.max(...parentLevels) + 1 : 0;
    };
    
    // Вычисляем уровни для всех технологий
    const levels = {};
    technologies.forEach(tech => {
        levels[tech.id] = calculateLevel(tech.id);
    });
    
    // Группируем по уровням
    const levelGroups = {};
    technologies.forEach(tech => {
        const level = levels[tech.id];
        if (!levelGroups[level]) {
            levelGroups[level] = [];
        }
        levelGroups[level].push(tech);
    });
    
    // Позиционируем технологии по уровням
    const headerOffset = 100; // Отступ для заголовка линии
    
    Object.keys(levelGroups).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
        const techs = levelGroups[level];
        const y = parseInt(level) * verticalSpacing + headerOffset;
        
        // Сортируем технологии по средней X-координате родителей
        techs.sort((a, b) => {
            const aParents = a.requires.filter(reqId => techMap[reqId] && positions[reqId]);
            const bParents = b.requires.filter(reqId => techMap[reqId] && positions[reqId]);
            
            const aAvg = aParents.length > 0 
                ? aParents.reduce((sum, reqId) => sum + positions[reqId].x, 0) / aParents.length
                : a.year || 0; // Если нет родителей, сортируем по году
            const bAvg = bParents.length > 0
                ? bParents.reduce((sum, reqId) => sum + positions[reqId].x, 0) / bParents.length
                : b.year || 0;
            
            return aAvg - bAvg;
        });
        
        // Вычисляем общую ширину для центрирования
        const totalWidth = techs.length * nodeWidth;
        const startX = Math.max(50, (1400 - totalWidth) / 2); // Центрируем, но не меньше 50px
        
        // Массив для отслеживания занятых позиций на этом уровне
        const occupiedRanges = [];
        
        // Распределяем технологии по горизонтали
        techs.forEach((tech, index) => {
            let x;
            
            // Если есть родители в этой линии, центрируем относительно них
            if (tech.requires && tech.requires.length > 0) {
                const parentPositions = tech.requires
                    .filter(reqId => techMap[reqId] && positions[reqId])
                    .map(reqId => positions[reqId].x);
                
                if (parentPositions.length > 0) {
                    // Центрируем между родителями
                    x = parentPositions.reduce((a, b) => a + b, 0) / parentPositions.length;
                } else {
                    // Если родители не в этой линии, используем равномерное распределение
                    x = startX + index * nodeWidth;
                }
            } else {
                // Корневые узлы - равномерное распределение с центрированием
                x = startX + index * nodeWidth;
            }
            
            // Проверяем конфликты и корректируем позицию
            let adjusted = false;
            for (const range of occupiedRanges) {
                // Если текущая позиция пересекается с занятой
                if (x < range.end && x + nodeWidth > range.start) {
                    // Смещаем вправо от конца занятого диапазона
                    x = range.end;
                    adjusted = true;
                    break;
                }
            }
            
            // Добавляем текущий диапазон в список занятых
            occupiedRanges.push({ start: x, end: x + nodeWidth });
            // Сортируем для правильной проверки следующих
            occupiedRanges.sort((a, b) => a.start - b.start);
            
            positions[tech.id] = { x, y };
        });
    });
    
    return positions;
}

// Создание узла технологии
function createTechNode(tech) {
    const node = document.createElement('div');
    node.className = 'tech-node';
    node.dataset.techId = tech.id;
    
    // Определяем статус технологии
    const status = getTechStatus(tech);
    node.classList.add(status);
    
    // Иконка в зависимости от статуса
    let icon = 'fa-lock';
    if (status === 'researched') icon = 'fa-check-circle';
    else if (status === 'available') icon = 'fa-circle';
    
    node.innerHTML = `
        <div class="tech-node-header">
            <h5 class="tech-node-name">${tech.name}</h5>
            <i class="fas ${icon} tech-node-icon"></i>
        </div>
        <div class="tech-node-year">${tech.year} г.</div>
    `;
    
    // Клик по узлу - показываем информацию
    node.addEventListener('click', () => {
        showTechInfo(tech);
    });
    
    return node;
}

// Определение статуса технологии
function getTechStatus(tech) {
    if (!playerProgress || !playerProgress.researched) {
        return 'locked';
    }
    
    // Проверяем, изучена ли технология
    if (playerProgress.researched.includes(tech.id)) {
        return 'researched';
    }
    
    // Проверяем, доступна ли для изучения
    const requirementsMet = tech.requires.every(reqId => 
        playerProgress.researched.includes(reqId)
    );
    
    if (requirementsMet) {
        return 'available';
    }
    
    return 'locked';
}

// Рисование связей между технологиями
function drawConnections(technologies, elements, svg, positions) {
    svg.innerHTML = '';
    
    // Устанавливаем размеры SVG с запасом
    const maxX = Math.max(...Object.values(positions).map(p => p.x)) + 400;
    const maxY = Math.max(...Object.values(positions).map(p => p.y)) + 250;
    svg.setAttribute('width', maxX);
    svg.setAttribute('height', maxY);
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';
    
    const nodeWidth = 240;
    const nodeHeight = 70; // примерная высота узла
    
    technologies.forEach(tech => {
        if (tech.requires && tech.requires.length > 0) {
            tech.requires.forEach(reqId => {
                const fromNode = elements[reqId];
                const toNode = elements[tech.id];
                
                if (fromNode && toNode && positions[reqId] && positions[tech.id]) {
                    const fromPos = positions[reqId];
                    const toPos = positions[tech.id];
                    
                    // Точка выхода из родительского блока (снизу, центр)
                    const x1 = fromPos.x + nodeWidth / 2;
                    const y1 = fromPos.y + nodeHeight;
                    
                    // Точка входа в дочерний блок (сверху, центр)
                    const x2 = toPos.x + nodeWidth / 2;
                    const y2 = toPos.y;
                    
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    
                    // Рассчитываем контрольные точки для кривой Безье
                    const verticalDistance = y2 - y1;
                    const horizontalDistance = Math.abs(x2 - x1);
                    
                    // Используем кривую Безье с учетом расстояния
                    const controlOffset = Math.min(verticalDistance * 0.4, 60);
                    const cx1 = x1;
                    const cy1 = y1 + controlOffset;
                    const cx2 = x2;
                    const cy2 = y2 - controlOffset;
                    
                    const d = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
                    
                    line.setAttribute('d', d);
                    line.classList.add('tech-connection-line');
                    
                    // Подсвечиваем линию, если обе технологии изучены
                    const fromTech = { id: reqId, requires: [] };
                    const fromStatus = getTechStatus(fromTech);
                    const toStatus = getTechStatus(tech);
                    if (fromStatus === 'researched' && toStatus === 'researched') {
                        line.classList.add('active');
                    }
                    
                    svg.appendChild(line);
                }
            });
        }
    });
}

// Показ информации о технологии
function showTechInfo(tech) {
    selectedTech = tech;
    
    let infoPanel = document.getElementById('tech-info-panel');
    if (!infoPanel) {
        infoPanel = document.createElement('div');
        infoPanel.id = 'tech-info-panel';
        infoPanel.className = 'tech-info-panel';
        document.getElementById('technologies-section').appendChild(infoPanel);
    }
    
    const status = getTechStatus(tech);
    let statusText = 'Заблокировано';
    let statusClass = 'locked';
    
    if (status === 'researched') {
        statusText = 'Изучено';
        statusClass = 'researched';
    } else if (status === 'available') {
        statusText = 'Доступно';
        statusClass = 'available';
    }
    
    // Получаем требования
    let requirementsHTML = '';
    if (tech.requires && tech.requires.length > 0) {
        const reqTechs = tech.requires.map(reqId => {
            const reqTech = findTechById(reqId);
            const reqStatus = getTechStatus({ id: reqId, requires: [] });
            const checkIcon = reqStatus === 'researched' ? '✓' : '✗';
            return `<li>${checkIcon} ${reqTech ? reqTech.name : reqId}</li>`;
        }).join('');
        requirementsHTML = `
            <div class="tech-info-section">
                <h4>Требования</h4>
                <ul>${reqTechs}</ul>
            </div>
        `;
    }
    
    // Кнопка исследования
    let researchButton = '';
    if (status === 'available') {
        researchButton = `
            <button class="tech-research-button" onclick="researchTechnology('${tech.id}')">
                <i class="fas fa-flask"></i>
                Начать исследование
            </button>
        `;
    }
    
    infoPanel.innerHTML = `
        <div class="tech-info-header">
            <div class="tech-info-title">
                <h3>${tech.name}</h3>
                <div class="tech-year">${tech.year} г.</div>
            </div>
            <button class="tech-info-close" onclick="closeTechInfo()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="tech-info-status ${statusClass}">${statusText}</div>
        <div class="tech-info-description">
            Технология позволяет улучшить военные возможности вашего государства.
        </div>
        ${requirementsHTML}
        ${researchButton}
    `;
    
    infoPanel.classList.add('visible');
}

// Найти технологию по ID во всех категориях
function findTechById(techId) {
    // Сначала ищем в текущей категории
    if (techData) {
        for (const line of techData.lines) {
            const tech = line.technologies.find(t => t.id === techId);
            if (tech) return tech;
        }
    }
    
    // Если не нашли, ищем во всех категориях
    for (const category in allTechData) {
        const catData = allTechData[category];
        for (const line of catData.lines) {
            const tech = line.technologies.find(t => t.id === techId);
            if (tech) return tech;
        }
    }
    
    return null;
}

// Закрыть панель информации
function closeTechInfo() {
    const infoPanel = document.getElementById('tech-info-panel');
    if (infoPanel) {
        infoPanel.classList.remove('visible');
    }
}

// Начать исследование технологии
function researchTechnology(techId) {
    console.log('Starting research for:', techId);
    // TODO: Реализовать отправку запроса на сервер
    alert('Функция исследования технологий будет доступна в следующих обновлениях');
}

// Функция для отображения ошибки
function showError(message) {
    const container = document.getElementById('tech-tree-content');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <h3>${message}</h3>
                <p>Попробуйте обновить страницу</p>
            </div>
        `;
    }
}

// Переключение категории технологий
async function switchCategory(category) {
    console.log('Switching to category:', category);
    
    // Обновляем активную вкладку
    document.querySelectorAll('.tech-category-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.category === category) {
            tab.classList.add('active');
        }
    });
    
    // Если данные уже загружены, просто переключаемся
    if (allTechData[category]) {
        currentCategory = category;
        techData = allTechData[category];
        renderTechTree();
    } else {
        // Показываем загрузку
        const container = document.getElementById('tech-tree-content');
        if (container) {
            container.innerHTML = `
                <div class="loading-content">
                    <i class="fas fa-flask fa-3x"></i>
                    <h3>Загрузка древа технологий...</h3>
                    <div class="loading-spinner"></div>
                </div>
            `;
        }
        
        // Загружаем новую категорию
        await initTechnologies(category);
    }
}

// Инициализация обработчиков событий
function initEventHandlers() {
    // Обработчики для вкладок категорий
    document.querySelectorAll('.tech-category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;
            if (category !== currentCategory) {
                switchCategory(category);
            }
        });
    });
}

// Инициализация при загрузке страницы
setTimeout(() => {
    initEventHandlers();
}, 100);

// Экспортируем функции для использования в game.js
window.techModule = {
    init: initTechnologies,
    showInfo: showTechInfo,
    closeInfo: closeTechInfo,
    switchCategory: switchCategory
};
