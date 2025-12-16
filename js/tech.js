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
        
        // Загружаем все категории параллельно для скорости
        const promises = categories.map(cat => 
            fetch(`/api/tech/tree/${cat}`, {
                headers: { 'Authorization': token }
            }).then(res => res.ok ? res.json() : null)
        );
        
        const results = await Promise.all(promises);
        
        results.forEach((data, index) => {
            if (data && data.success) {
                allTechData[categories[index]] = data.data;
            }
        });
        
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
    
    element.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
        const newZoom = Math.min(Math.max(currentZoom + delta, minZoom), maxZoom);
        
        if (newZoom !== currentZoom) {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const scrollX = element.scrollLeft + x;
            const scrollY = element.scrollTop + y;
            
            currentZoom = newZoom;
            wrapper.style.transform = `scale(${currentZoom})`;
            wrapper.style.transformOrigin = '0 0';
            
            element.scrollLeft = scrollX * (newZoom / (currentZoom - delta)) - x;
            element.scrollTop = scrollY * (newZoom / (currentZoom - delta)) - y;
            
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
    
    const lineHorizontalOffset = lineIndex * 1600;
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
    nodesContainer.appendChild(svg);
    
    // Вычисляем позиции для технологий с учетом минимизации пересечений
    const positions = calculateTechPositionsOptimized(line.technologies);
    
    // Обновляем высоту контейнера
    const maxY = Math.max(...Object.values(positions).map(p => p.y));
    const maxX = Math.max(...Object.values(positions).map(p => p.x));
    nodesContainer.style.minHeight = `${maxY + 200}px`;
    nodesContainer.style.minWidth = `${maxX + 300}px`;
    
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
        drawConnectionsOptimized(line.technologies, nodeElements, svg, positions);
    }, 50);
    
    return lineDiv;
}

// Оптимизированное вычисление позиций технологий
// Оптимизированное вычисление позиций технологий с учётом основной цепочки
function calculateTechPositionsOptimized(technologies) {
    const positions = {};
    const nodeWidth = 260;
    const nodeHeight = 80;
    const verticalSpacing = 140;
    const horizontalSpacing = 60;
    const headerOffset = 80;
    const centerX = 600; // Центральная линия для основной цепочки
    
    // Создаем карту технологий
    const techMap = {};
    technologies.forEach(tech => {
        techMap[tech.id] = tech;
    });
    
    // Строим граф зависимостей (только внутри линии)
    const children = {}; // родитель -> дети
    const parents = {};  // ребенок -> родители
    
    technologies.forEach(tech => {
        children[tech.id] = [];
        parents[tech.id] = [];
    });
    
    technologies.forEach(tech => {
        if (tech.requires) {
            tech.requires.forEach(reqId => {
                if (techMap[reqId]) {
                    children[reqId].push(tech.id);
                    parents[tech.id].push(reqId);
                }
            });
        }
    });
    
    // Вычисляем "вес" каждой технологии - количество потомков
    const descendantCount = {};
    const calculateDescendants = (techId, visited = new Set()) => {
        if (descendantCount[techId] !== undefined) return descendantCount[techId];
        if (visited.has(techId)) return 0;
        visited.add(techId);
        
        const techChildren = children[techId];
        if (techChildren.length === 0) {
            descendantCount[techId] = 0;
            return 0;
        }
        
        let count = techChildren.length;
        techChildren.forEach(childId => {
            count += calculateDescendants(childId, new Set(visited));
        });
        
        descendantCount[techId] = count;
        return count;
    };
    
    technologies.forEach(tech => calculateDescendants(tech.id));
    
    // Вычисляем уровни (глубину) для каждой технологии
    const levels = {};
    const calculateLevel = (techId, visited = new Set()) => {
        if (levels[techId] !== undefined) return levels[techId];
        if (visited.has(techId)) return 0;
        visited.add(techId);
        
        const techParents = parents[techId].filter(p => techMap[p]);
        if (techParents.length === 0) {
            levels[techId] = 0;
            return 0;
        }
        
        const maxParentLevel = Math.max(...techParents.map(p => calculateLevel(p, new Set(visited))));
        levels[techId] = maxParentLevel + 1;
        return levels[techId];
    };
    
    technologies.forEach(tech => calculateLevel(tech.id));
    
    // Группируем по уровням
    const levelGroups = {};
    technologies.forEach(tech => {
        const level = levels[tech.id];
        if (!levelGroups[level]) levelGroups[level] = [];
        levelGroups[level].push(tech);
    });
    
    // Отслеживаем занятые позиции на каждом уровне
    const occupiedPositions = {}; // level -> [{x, width}]
    
    const isPositionFree = (level, x, width = nodeWidth) => {
        if (!occupiedPositions[level]) return true;
        
        for (const occupied of occupiedPositions[level]) {
            if (!(x + width + horizontalSpacing <= occupied.x || 
                  x >= occupied.x + occupied.width + horizontalSpacing)) {
                return false;
            }
        }
        return true;
    };
    
    const occupyPosition = (level, x, width = nodeWidth) => {
        if (!occupiedPositions[level]) occupiedPositions[level] = [];
        occupiedPositions[level].push({ x, width });
    };
    
    // Позиционируем технологии
    const sortedLevels = Object.keys(levelGroups).map(Number).sort((a, b) => a - b);
    
    sortedLevels.forEach(level => {
        const techs = levelGroups[level];
        const y = level * verticalSpacing + headerOffset;
        
        // Группируем технологии по их родителям для оптимального размещения
        const techsByParentGroup = new Map();
        
        techs.forEach(tech => {
            const techParents = parents[tech.id].filter(p => positions[p]);
            
            if (techParents.length === 0) {
                // Технологии без родителей - корневая группа
                if (!techsByParentGroup.has('root')) {
                    techsByParentGroup.set('root', []);
                }
                techsByParentGroup.get('root').push(tech);
            } else {
                // Создаем ключ группы на основе родителей (сортируем для консистентности)
                const parentKey = techParents.sort().join(',');
                if (!techsByParentGroup.has(parentKey)) {
                    techsByParentGroup.set(parentKey, []);
                }
                techsByParentGroup.get(parentKey).push(tech);
            }
        });
        
        // Сортируем группы по средней X-позиции их родителей
        const sortedGroups = Array.from(techsByParentGroup.entries()).sort((a, b) => {
            const [keyA, techsA] = a;
            const [keyB, techsB] = b;
            
            if (keyA === 'root') return -1;
            if (keyB === 'root') return 1;
            
            const parentsA = keyA.split(',');
            const parentsB = keyB.split(',');
            
            const avgXA = parentsA.reduce((sum, p) => sum + (positions[p]?.x || centerX), 0) / parentsA.length;
            const avgXB = parentsB.reduce((sum, p) => sum + (positions[p]?.x || centerX), 0) / parentsB.length;
            
            return avgXA - avgXB;
        });
        
        // Размещаем технологии по группам
        sortedGroups.forEach(([parentKey, groupTechs]) => {
            // Вычисляем целевую X-позицию для группы
            let targetX;
            
            if (parentKey === 'root') {
                targetX = centerX - (groupTechs.length * (nodeWidth + horizontalSpacing)) / 2;
            } else {
                const parentIds = parentKey.split(',');
                const parentPositions = parentIds.map(p => positions[p]).filter(Boolean);
                
                if (parentPositions.length > 0) {
                    const avgParentX = parentPositions.reduce((sum, pos) => sum + pos.x, 0) / parentPositions.length;
                    // Центрируем группу относительно среднего положения родителей
                    targetX = avgParentX - (groupTechs.length * (nodeWidth + horizontalSpacing)) / 2 + nodeWidth / 2;
                } else {
                    targetX = centerX;
                }
            }
            
            // Размещаем технологии группы последовательно
            groupTechs.forEach((tech, index) => {
                let x = targetX + index * (nodeWidth + horizontalSpacing);
                
                // Ищем ближайшую свободную позицию
                const searchRadius = 10;
                let bestX = x;
                let minDistance = Infinity;
                
                // Проверяем диапазон позиций вокруг целевой
                for (let offset = 0; offset < searchRadius; offset++) {
                    const candidates = [
                        x + offset * (nodeWidth + horizontalSpacing),
                        x - offset * (nodeWidth + horizontalSpacing)
                    ];
                    
                    for (const candidateX of candidates) {
                        if (candidateX < 50) continue; // Минимальная граница
                        
                        if (isPositionFree(level, candidateX)) {
                            const distance = Math.abs(candidateX - x);
                            if (distance < minDistance) {
                                minDistance = distance;
                                bestX = candidateX;
                            }
                            if (offset === 0) break; // Нашли идеальную позицию
                        }
                    }
                    
                    if (minDistance === 0) break; // Нашли идеальную позицию
                }
                
                positions[tech.id] = { x: bestX, y };
                occupyPosition(level, bestX);
            });
        });
    });
    
    // Второй проход: оптимизируем позиции родителей относительно детей
    for (let iteration = 0; iteration < 2; iteration++) {
        sortedLevels.forEach(level => {
            const techs = levelGroups[level];
            
            techs.forEach(tech => {
                const techChildren = children[tech.id].filter(c => positions[c]);
                if (techChildren.length === 0) return;
                
                // Вычисляем центр всех детей
                const childXs = techChildren.map(c => positions[c].x);
                const minChildX = Math.min(...childXs);
                const maxChildX = Math.max(...childXs);
                const avgChildX = (minChildX + maxChildX) / 2;
                
                // Пробуем переместить к центру детей
                const currentX = positions[tech.id].x;
                const targetX = avgChildX;
                
                // Двигаемся постепенно к целевой позиции
                const moveStep = (targetX - currentX) * 0.3;
                const newX = currentX + moveStep;
                
                // Проверяем, не конфликтует ли новая позиция
                const sameLevelTechs = techs.filter(t => t.id !== tech.id);
                let canMove = true;
                
                for (const other of sameLevelTechs) {
                    const otherX = positions[other.id].x;
                    if (Math.abs(newX - otherX) < nodeWidth + horizontalSpacing) {
                        canMove = false;
                        break;
                    }
                }
                
                if (canMove && Math.abs(moveStep) > 5) {
                    positions[tech.id].x = newX;
                }
            });
        });
    }
    
    // Нормализация: сдвигаем всё влево, убирая лишнее пространство
    const minX = Math.min(...Object.values(positions).map(p => p.x));
    const offsetX = minX - 50;
    
    if (offsetX > 0) {
        Object.values(positions).forEach(pos => {
            pos.x -= offsetX;
        });
    }
    
    return positions;
}


// Оптимизированное рисование связей
function drawConnectionsOptimized(technologies, elements, svg, positions) {
    svg.innerHTML = '';
    
    const nodeWidth = 240;
    const nodeHeight = 70;
    
    // Устанавливаем размеры SVG
    const maxX = Math.max(...Object.values(positions).map(p => p.x)) + 400;
    const maxY = Math.max(...Object.values(positions).map(p => p.y)) + 250;
    svg.setAttribute('width', maxX);
    svg.setAttribute('height', maxY);
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';
    svg.style.overflow = 'visible';
    
    // Создаем карту технологий для быстрого доступа
    const techMap = {};
    technologies.forEach(tech => {
        techMap[tech.id] = tech;
    });
    
    // Собираем все связи
    const connections = [];
    technologies.forEach(tech => {
        if (tech.requires && tech.requires.length > 0) {
            tech.requires.forEach(reqId => {
                // Рисуем только связи внутри линии
                if (techMap[reqId] && positions[reqId] && positions[tech.id]) {
                    connections.push({
                        from: reqId,
                        to: tech.id,
                        fromPos: positions[reqId],
                        toPos: positions[tech.id]
                    });
                }
            });
        }
    });
    
    // Группируем связи по точкам выхода для распределения
    const exitPoints = {};
    connections.forEach(conn => {
        const key = conn.from;
        if (!exitPoints[key]) exitPoints[key] = [];
        exitPoints[key].push(conn);
    });
    
    // Группируем связи по точкам входа
    const entryPoints = {};
    connections.forEach(conn => {
        const key = conn.to;
        if (!entryPoints[key]) entryPoints[key] = [];
        entryPoints[key].push(conn);
    });
    
    // Рисуем связи
    connections.forEach(conn => {
        const fromPos = conn.fromPos;
        const toPos = conn.toPos;
        
        // Вычисляем смещение для точки выхода (если несколько детей)
        const exitGroup = exitPoints[conn.from];
        const exitIndex = exitGroup.indexOf(conn);
        const exitCount = exitGroup.length;
        const exitSpread = Math.min(nodeWidth * 0.6, exitCount * 30);
        const exitOffset = exitCount > 1 
            ? (exitIndex - (exitCount - 1) / 2) * (exitSpread / exitCount)
            : 0;
        
        // Вычисляем смещение для точки входа (если несколько родителей)
        const entryGroup = entryPoints[conn.to];
        const entryIndex = entryGroup.indexOf(conn);
        const entryCount = entryGroup.length;
        const entrySpread = Math.min(nodeWidth * 0.6, entryCount * 30);
        const entryOffset = entryCount > 1 
            ? (entryIndex - (entryCount - 1) / 2) * (entrySpread / entryCount)
            : 0;
        
        // Точка выхода (снизу родителя)
        const x1 = fromPos.x + nodeWidth / 2 + exitOffset;
        const y1 = fromPos.y + nodeHeight;
        
        // Точка входа (сверху ребенка)
        const x2 = toPos.x + nodeWidth / 2 + entryOffset;
        const y2 = toPos.y;
        
        // Создаем путь
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        const verticalDist = y2 - y1;
        const horizontalDist = Math.abs(x2 - x1);
        
        let d;
        
        if (verticalDist > 0) {
            // Нормальный случай: ребенок ниже родителя
            // Используем S-образную кривую
            const midY = y1 + verticalDist / 2;
            
            if (horizontalDist < 20) {
                // Почти вертикальная линия
                d = `M ${x1} ${y1} L ${x2} ${y2}`;
            } else {
                // S-образная кривая
                const controlOffset = Math.min(verticalDist * 0.3, 40);
                d = `M ${x1} ${y1} 
                     C ${x1} ${y1 + controlOffset}, 
                       ${x1} ${midY}, 
                       ${(x1 + x2) / 2} ${midY}
                     S ${x2} ${y2 - controlOffset}, 
                       ${x2} ${y2}`;
            }
        } else {
            // Редкий случай: нужно обойти
            const bendY = Math.min(y1, y2) - 50;
            d = `M ${x1} ${y1} 
                 L ${x1} ${bendY} 
                 L ${x2} ${bendY} 
                 L ${x2} ${y2}`;
        }
        
        path.setAttribute('d', d);
        path.classList.add('tech-connection-line');
        
        // Подсвечиваем если обе технологии изучены
        const fromStatus = getTechStatus({ id: conn.from, requires: [] });
        const toTech = techMap[conn.to];
        const toStatus = getTechStatus(toTech);
        
        if (fromStatus === 'researched' && toStatus === 'researched') {
            path.classList.add('active');
        }
        
        svg.appendChild(path);
    });
}

// Создание узла технологии
function createTechNode(tech) {
    const node = document.createElement('div');
    node.className = 'tech-node';
    node.dataset.techId = tech.id;
    
    const status = getTechStatus(tech);
    node.classList.add(status);
    
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
    
    if (playerProgress.researched.includes(tech.id)) {
        return 'researched';
    }
    
    const requirementsMet = tech.requires.every(reqId => 
        playerProgress.researched.includes(reqId)
    );
    
    if (requirementsMet) {
        return 'available';
    }
    
    return 'locked';
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
    
    // Получаем требования с указанием категории для межкатегориальных
    let requirementsHTML = '';
    if (tech.requires && tech.requires.length > 0) {
        const reqTechs = tech.requires.map(reqId => {
            const reqTech = findTechById(reqId);
            const reqStatus = getTechStatus({ id: reqId, requires: [] });
            const checkIcon = reqStatus === 'researched' ? '✓' : '✗';
            const checkClass = reqStatus === 'researched' ? 'req-met' : 'req-unmet';
            
            let techName = reqId;
            let categoryHint = '';
            
            if (reqTech) {
                techName = reqTech.name;
                // Проверяем, из другой ли это категории
                const techCategory = findTechCategory(reqId);
                if (techCategory && techCategory !== currentCategory) {
                    const categoryNames = {
                        'land_forces': 'Сухопутные войска',
                        'navy': 'Флот',
                        'industry': 'Промышленность',
                        'education': 'Образование',
                        'infrastructure': 'Инфраструктура',
                        'economy': 'Экономика'
                    };
                    categoryHint = ` <span class="req-category">(${categoryNames[techCategory] || techCategory})</span>`;
                }
            }
            
            return `<li class="${checkClass}"><span class="req-check">${checkIcon}</span> ${techName}${categoryHint}</li>`;
        }).join('');
        
        requirementsHTML = `
            <div class="tech-info-section">
                <h4>Требования</h4>
                <ul class="tech-requirements-list">${reqTechs}</ul>
            </div>
        `;
    }
    
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
            Технология позволяет улучшить возможности вашего государства.
        </div>
        ${requirementsHTML}
        ${researchButton}
    `;
    
    infoPanel.classList.add('visible');
}

// Найти категорию технологии
function findTechCategory(techId) {
    for (const category in allTechData) {
        const catData = allTechData[category];
        for (const line of catData.lines) {
            const tech = line.technologies.find(t => t.id === techId);
            if (tech) return category;
        }
    }
    return null;
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
    
    document.querySelectorAll('.tech-category-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.category === category) {
            tab.classList.add('active');
        }
    });
    
    if (allTechData[category]) {
        currentCategory = category;
        techData = allTechData[category];
        renderTechTree();
    } else {
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
        
        await initTechnologies(category);
    }
}

// Инициализация обработчиков событий
function initEventHandlers() {
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

// Экспортируем функции
window.techModule = {
    init: initTechnologies,
    showInfo: showTechInfo,
    closeInfo: closeTechInfo,
    switchCategory: switchCategory
};
