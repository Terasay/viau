// Модуль для работы с древом технологий

let techData = null;
let playerProgress = null;
let selectedTech = null;
let isInitialized = false;

// Инициализация модуля технологий
async function initTechnologies() {
    // Если уже инициализировано, просто отрисовываем
    if (isInitialized && techData) {
        console.log('Tech tree already initialized, skipping load');
        return;
    }
    
    console.log('Initializing tech tree...');
    
    try {
        const token = localStorage.getItem('token');
        
        // Загружаем данные древа технологий
        const treeResponse = await fetch('/api/tech/tree/land_forces', {
            headers: { 'Authorization': token }
        });
        
        if (!treeResponse.ok) {
            console.error('Failed to load tech tree:', treeResponse.status);
            return;
        }
        
        const treeData = await treeResponse.json();
        console.log('Tech tree response:', treeData);
        
        if (!treeData.success) {
            console.error('Tech tree error:', treeData.error);
            return;
        }
        
        techData = treeData.data;
        console.log('Tech data loaded:', techData);
        
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
    
    console.log('Rendering', techData.lines.length, 'tech lines');
    
    // Отрисовываем каждую линию технологий
    techData.lines.forEach((line, index) => {
        console.log(`Rendering line ${index + 1}:`, line.name);
        const lineElement = renderTechLine(line);
        linesContainer.appendChild(lineElement);
    });
    
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

// Отрисовка одной линии технологий
function renderTechLine(line) {
    const lineDiv = document.createElement('div');
    lineDiv.className = 'tech-line';
    
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
    
    // Группируем технологии по тирам
    const tierGroups = {};
    line.technologies.forEach(tech => {
        if (!tierGroups[tech.tier]) {
            tierGroups[tech.tier] = [];
        }
        tierGroups[tech.tier].push(tech);
    });
    
    // Создаем SVG для связей
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('tech-connections');
    nodesContainer.appendChild(svg);
    
    // Отрисовываем тиры
    const tierElements = {};
    Object.keys(tierGroups).sort((a, b) => a - b).forEach(tier => {
        const tierDiv = document.createElement('div');
        tierDiv.className = 'tech-tier';
        tierDiv.dataset.tier = tier;
        
        tierGroups[tier].forEach(tech => {
            const node = createTechNode(tech);
            tierDiv.appendChild(node);
            
            // Сохраняем элемент для рисования связей
            if (!tierElements[tech.id]) {
                tierElements[tech.id] = node;
            }
        });
        
        nodesContainer.appendChild(tierDiv);
    });
    
    lineDiv.appendChild(nodesContainer);
    
    // Рисуем связи после того, как элементы добавлены в DOM
    setTimeout(() => {
        drawConnections(line.technologies, tierElements, svg);
    }, 100);
    
    return lineDiv;
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
function drawConnections(technologies, elements, svg) {
    svg.innerHTML = '';
    
    technologies.forEach(tech => {
        if (tech.requires && tech.requires.length > 0) {
            tech.requires.forEach(reqId => {
                const fromNode = elements[reqId];
                const toNode = elements[tech.id];
                
                if (fromNode && toNode) {
                    const fromRect = fromNode.getBoundingClientRect();
                    const toRect = toNode.getBoundingClientRect();
                    const containerRect = svg.parentElement.getBoundingClientRect();
                    
                    const x1 = fromRect.right - containerRect.left;
                    const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
                    const x2 = toRect.left - containerRect.left;
                    const y2 = toRect.top + toRect.height / 2 - containerRect.top;
                    
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    
                    // Рисуем кривую Безье для более плавной линии
                    const midX = (x1 + x2) / 2;
                    const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
                    
                    line.setAttribute('d', d);
                    line.classList.add('tech-connection-line');
                    
                    // Подсвечиваем линию, если обе технологии изучены
                    const fromStatus = getTechStatus({ id: reqId, requires: [] });
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

// Найти технологию по ID
function findTechById(techId) {
    if (!techData) return null;
    
    for (const line of techData.lines) {
        const tech = line.technologies.find(t => t.id === techId);
        if (tech) return tech;
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

// Экспортируем функции для использования в game.js
window.techModule = {
    init: initTechnologies,
    showInfo: showTechInfo,
    closeInfo: closeTechInfo
};
