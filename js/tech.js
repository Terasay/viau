let techData = null;
let allTechData = {};
let playerProgress = null;
let selectedTech = null;
let isInitialized = false;
let currentCategory = localStorage.getItem('techCategory') || 'land_forces';
let currentCountryId = null;
let viewingCountryId = null;
let currentResearchPoints = 0;
let showHiddenTechs = localStorage.getItem('showHiddenTechs') === 'true';
let isAdminView = false;
let educationScienceData = {};
let buildingsBonuses = { education_bonus: 0, science_bonus: 0, education_buildings: [], science_buildings: [] };

async function initTechnologies(category = 'land_forces') {
    console.log('Initializing tech tree for category:', category);
    console.log('🔍 Checking notifications system:', {
        showSuccess: typeof window.showSuccess,
        showError: typeof window.showError,
        showWarning: typeof window.showWarning,
        showInfo: typeof window.showInfo
    });
    
    currentCategory = category;
    
    if (!viewingCountryId && window.gameState) {
        const user = window.gameState.getUser();
        const country = window.gameState.getCountry();
        
        isAdminView = user && (user.role === 'admin' || user.role === 'moderator');
        
        // Проверяем сохранённую страну для технологий
        const savedTechCountry = localStorage.getItem('techViewingCountryId');
        const savedTechCountryName = localStorage.getItem('techViewingCountryName');
        
        if (isAdminView && savedTechCountry) {
            // Если админ и есть сохранённая страна, используем её
            viewingCountryId = savedTechCountry;
            console.log('Восстановлена сохранённая страна для технологий:', savedTechCountry, savedTechCountryName);
        } else if (country) {
            currentCountryId = country.id;
            viewingCountryId = country.id;
        } else if (isAdminView) {
            await showCountrySelector();
            return;
        } else {
            showTechError('Ошибка: страна не найдена');
            return;
        }
    }
    
    if (!viewingCountryId) {
        console.error('No country selected for viewing');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        
        const categories = ['land_forces', 'navy', 'industry', 'education', 'infrastructure', 'economy'];
        
        const promises = categories.map(cat => 
            fetch(`/api/tech/tree/${cat}?country_id=${viewingCountryId}&show_hidden=${showHiddenTechs}`, {
                headers: { 'Authorization': token }
            }).then(res => res.ok ? res.json() : null)
        );
        
        const results = await Promise.all(promises);
        
        results.forEach((data, index) => {
            if (data && data.success) {
                allTechData[categories[index]] = data.data;
            }
        });
        
        if (allTechData[category]) {
            techData = allTechData[category];
            console.log('Tech data loaded:', techData);
        } else {
            console.error('Failed to load tech tree for category:', category);
            showTechError('Не удалось загрузить древо технологий');
            return;
        }
        
        if (viewingCountryId) {
            console.log('Fetching country progress for:', viewingCountryId);
            const progressResponse = await fetch(`/api/tech/country/${viewingCountryId}/progress`, {
                headers: { 'Authorization': token }
            });
            
            if (progressResponse.ok) {
                const progressData = await progressResponse.json();
                console.log('Country progress:', progressData);
                if (progressData.success) {
                    playerProgress = {
                        researched: progressData.researched || [],
                        researching: progressData.researching,
                        progress: progressData.research_progress || 0
                    };
                }
            }
            
            console.log('Fetching research points for:', viewingCountryId);
            const rpResponse = await fetch(`/api/game/research-points/${viewingCountryId}`, {
                headers: { 'Authorization': token }
            });
            
            if (rpResponse.ok) {
                const rpData = await rpResponse.json();
                console.log('Research points:', rpData);
                if (rpData.success) {
                    currentResearchPoints = rpData.research_points || 0;
                }
            }
            
            // Загружаем данные образования и науки
            console.log('Fetching education/science data for:', viewingCountryId);
            const eduSciResponse = await fetch(`/api/economic/country/${viewingCountryId}/education-science`, {
                headers: { 'Authorization': token }
            });
            
            if (eduSciResponse.ok) {
                const eduSciData = await eduSciResponse.json();
                console.log('Education/science data:', eduSciData);
                if (eduSciData.success) {
                    educationScienceData = {
                        education_level: eduSciData.education_level || 0,
                        science_level: eduSciData.science_level || 0
                    };
                }
            }
            
            // Загружаем бонусы от зданий
            console.log('Fetching buildings bonuses for:', viewingCountryId);
            const bonusesResponse = await fetch(`/api/tech/country/${viewingCountryId}/buildings-bonuses`, {
                headers: { 'Authorization': token }
            });
            
            if (bonusesResponse.ok) {
                const bonusesData = await bonusesResponse.json();
                console.log('Buildings bonuses:', bonusesData);
                if (bonusesData.success) {
                    buildingsBonuses = {
                        education_bonus: bonusesData.education_bonus || 0,
                        science_bonus: bonusesData.science_bonus || 0,
                        education_buildings: bonusesData.education_buildings || [],
                        science_buildings: bonusesData.science_buildings || [],
                        total_education_buildings: bonusesData.total_education_buildings || 0,
                        total_science_buildings: bonusesData.total_science_buildings || 0
                    };
                }
            }
        } else {
            playerProgress = {
                researched: [],
                researching: null,
                progress: 0
            };
            currentResearchPoints = 0;
        }
        
        renderTechTree();
        isInitialized = true;
        console.log('Tech tree initialized successfully');
        
    } catch (error) {
        console.error('Error initializing technologies:', error);
    }
}

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
    
    const header = document.createElement('div');
    header.className = 'tech-category-header';
    
    let headerHTML = `
        <div class="tech-category-title">
            <i class="fas fa-flag"></i>
            <h3>${techData.name}</h3>
        </div>
    `;
    
    if (isAdminView && viewingCountryId) {
        const savedCountryName = localStorage.getItem('techViewingCountryName') || 'Неизвестная страна';
        headerHTML += `
            <div class="tech-admin-controls">
                <button class="btn-change-country" onclick="window.techModule.changeCountry()" title="Сменить страну">
                    <i class="fas fa-exchange-alt"></i> Страна: ${savedCountryName}
                </button>
                <button class="btn-toggle-hidden" onclick="window.techModule.toggleHiddenTechs()" title="${showHiddenTechs ? 'Скрыть закрытые технологии' : 'Показать закрытые технологии'}">
                    <i class="fas fa-${showHiddenTechs ? 'eye-slash' : 'eye'}"></i>
                    <span>${showHiddenTechs ? 'Скрыть закрытые' : 'Показать закрытые'}</span>
                </button>
            </div>
        `;
    }
    
    header.innerHTML = headerHTML;
    container.appendChild(header);
    console.log('Header added');
    
    // Секция образования и науки
    if (viewingCountryId) {
        const education = educationScienceData.education_level || 0;
        const science = educationScienceData.science_level || 0;
        
        if (isAdminView) {
            // Админ видит слайдеры для редактирования
        const eduSciSection = document.createElement('div');
        eduSciSection.className = 'tech-education-science-section';
        
        const education = educationScienceData.education_level || 0;
        const science = educationScienceData.science_level || 0;
        
        // Формируем HTML для бонусов от образовательных зданий
        let educationBonusHTML = '';
        if (buildingsBonuses.total_education_buildings > 0) {
            educationBonusHTML = `
                <div class="buildings-bonus education-buildings-bonus">
                    <i class="fas fa-building"></i>
                    <span>Бонус от зданий (${buildingsBonuses.total_education_buildings} шт.): +${buildingsBonuses.education_bonus.toFixed(2)}%/ход</span>
                </div>
            `;
        }
        
        // Формируем HTML для бонусов от научных зданий
        let scienceBonusHTML = '';
        if (buildingsBonuses.total_science_buildings > 0) {
            scienceBonusHTML = `
                <div class="buildings-bonus science-buildings-bonus">
                    <i class="fas fa-building"></i>
                    <span>Бонус от зданий (${buildingsBonuses.total_science_buildings} шт.): +${buildingsBonuses.science_bonus.toFixed(2)}%/ход</span>
                </div>
            `;
        }
        
        eduSciSection.innerHTML = `
            <div class="education-science-container">
                <div class="param-card">
                    <div class="param-header">
                        <i class="fas fa-graduation-cap"></i>
                        <h4>Образованность населения</h4>
                    </div>
                    <div class="param-slider-container">
                        <div class="param-slider-wrapper">
                            <input type="range" 
                                   id="education-slider" 
                                   class="param-slider"
                                   min="0" 
                                   max="100" 
                                   step="0.1"
                                   value="${education}"
                                   oninput="window.techModule.updateParamDisplay('education', this.value)">
                            <div class="param-slider-track">
                                <div id="progress-education" class="param-slider-progress" style="width: ${education}%"></div>
                            </div>
                        </div>
                        <div id="value-education" class="param-slider-value">${education.toFixed(1)}</div>
                    </div>
                    <div class="param-description">
                        <div style="font-size: 0.85em; color: var(--text-secondary); margin-top: 8px;">
                            <div>Естественный прирост: <strong>+0.10%/ход</strong></div>
                            ${buildingsBonuses.total_education_buildings > 0 ? `<div>Бонус от зданий: <strong>+${buildingsBonuses.education_bonus.toFixed(2)}%/ход</strong></div>` : ''}
                            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid var(--border);">
                                Общий прирост: <strong style="color: var(--primary);">+${(0.10 + (buildingsBonuses.education_bonus || 0)).toFixed(2)}%/ход</strong>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="param-card">
                    <div class="param-header">
                        <i class="fas fa-flask"></i>
                        <h4>Уровень науки</h4>
                    </div>
                    <div class="param-slider-container">
                        <div class="param-slider-wrapper">
                            <input type="range" 
                                   id="science-slider" 
                                   class="param-slider"
                                   min="0" 
                                   max="100" 
                                   step="0.1"
                                   value="${science}"
                                   oninput="window.techModule.updateParamDisplay('science', this.value)">
                            <div class="param-slider-track">
                                <div id="progress-science" class="param-slider-progress" style="width: ${science}%"></div>
                            </div>
                        </div>
                        <div id="value-science" class="param-slider-value">${science.toFixed(1)}</div>
                    </div>
                    <div class="param-description">
                        <div style="font-size: 0.85em; color: var(--text-secondary); margin-top: 8px;">
                            <div>Естественный прирост: <strong>+0.10%/ход</strong></div>
                            ${buildingsBonuses.total_science_buildings > 0 ? `<div>Бонус от зданий: <strong>+${buildingsBonuses.science_bonus.toFixed(2)}%/ход</strong></div>` : ''}
                            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid var(--border);">
                                Общий прирост: <strong style="color: var(--primary);">+${(0.10 + (buildingsBonuses.science_bonus || 0)).toFixed(2)}%/ход</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <button class="btn-save-education-science" onclick="window.techModule.saveEducationScience()">
                <i class="fas fa-save"></i> Сохранить параметры
            </button>
        `;
        
            container.appendChild(eduSciSection);
            console.log('Education/science section added (admin)');
        } else {
            // Игрок видит только текущие значения
            const playerEduSciSection = document.createElement('div');
            playerEduSciSection.className = 'tech-education-science-section player-view';
            
            // Формируем HTML для бонусов от образовательных зданий
            let educationBonusHTML = '';
            if (buildingsBonuses.total_education_buildings > 0) {
                educationBonusHTML = `
                    <div class="buildings-bonus education-buildings-bonus">
                        <i class="fas fa-building"></i>
                        <span>Бонус от зданий (${buildingsBonuses.total_education_buildings} шт.): +${buildingsBonuses.education_bonus.toFixed(2)}%/ход</span>
                    </div>
                `;
            }
            
            // Формируем HTML для бонусов от научных зданий
            let scienceBonusHTML = '';
            if (buildingsBonuses.total_science_buildings > 0) {
                scienceBonusHTML = `
                    <div class="buildings-bonus science-buildings-bonus">
                        <i class="fas fa-building"></i>
                        <span>Бонус от зданий (${buildingsBonuses.total_science_buildings} шт.): +${buildingsBonuses.science_bonus.toFixed(2)}%/ход</span>
                    </div>
                `;
            }
            
            playerEduSciSection.innerHTML = `
                <div class="education-science-container">
                    <div class="param-card">
                        <div class="param-header">
                            <i class="fas fa-graduation-cap"></i>
                            <h4>Образованность населения</h4>
                        </div>
                        <div class="param-value-display">
                            <span class="param-value-large">${education.toFixed(1)}%</span>
                        </div>
                        <div class="param-description">
                            <div style="font-size: 0.85em; color: var(--text-secondary); margin-top: 8px;">
                                <div>Естественный прирост: <strong>+0.10%/ход</strong></div>
                                ${buildingsBonuses.total_education_buildings > 0 ? `<div>Бонус от зданий: <strong>+${buildingsBonuses.education_bonus.toFixed(2)}%/ход</strong></div>` : ''}
                                <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid var(--border);">
                                    Общий прирост: <strong style="color: var(--primary);">+${(0.10 + (buildingsBonuses.education_bonus || 0)).toFixed(2)}%/ход</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="param-card">
                        <div class="param-header">
                            <i class="fas fa-flask"></i>
                            <h4>Уровень науки</h4>
                        </div>
                        <div class="param-value-display">
                            <span class="param-value-large">${science.toFixed(1)}%</span>
                        </div>
                        <div class="param-description">
                            <div style="font-size: 0.85em; color: var(--text-secondary); margin-top: 8px;">
                                <div>Естественный прирост: <strong>+0.10%/ход</strong></div>
                                ${buildingsBonuses.total_science_buildings > 0 ? `<div>Бонус от зданий: <strong>+${buildingsBonuses.science_bonus.toFixed(2)}%/ход</strong></div>` : ''}
                                <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid var(--border);">
                                    Общий прирост: <strong style="color: var(--primary);">+${(0.10 + (buildingsBonuses.science_bonus || 0)).toFixed(2)}%/ход</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(playerEduSciSection);
            console.log('Education/science section added (player)');
        }
    }
    
    const linesContainer = document.createElement('div');
    linesContainer.className = 'tech-lines-container';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'tech-lines-wrapper';
    
    console.log('Rendering', techData.lines.length, 'tech lines');
    
    techData.lines.forEach((line, index) => {
        console.log(`Rendering line ${index + 1}:`, line.name);
        const lineElement = renderTechLine(line, index);
        wrapper.appendChild(lineElement);
    });
    
    linesContainer.appendChild(wrapper);
    
    setupDragScroll(linesContainer);
    
    const zoomIndicator = document.createElement('div');
    zoomIndicator.className = 'tech-zoom-indicator';
    zoomIndicator.textContent = '100%';
    linesContainer.appendChild(zoomIndicator);
    
    container.appendChild(linesContainer);
    console.log('Lines container added');
    
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
    
    updateResearchPointsDisplay();
}

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

function renderTechLine(line, lineIndex) {
    const lineDiv = document.createElement('div');
    lineDiv.className = 'tech-line';
    
    const lineHorizontalOffset = lineIndex * 1600;
    lineDiv.style.left = `${lineHorizontalOffset}px`;
    
    const header = document.createElement('div');
    header.className = 'tech-line-header';
    header.innerHTML = `
        <h4><i class="fas fa-stream"></i> ${line.name}</h4>
    `;
    lineDiv.appendChild(header);
    
    const nodesContainer = document.createElement('div');
    nodesContainer.className = 'tech-nodes-container';
    nodesContainer.id = `tech-line-${line.id}`;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('tech-connections');
    nodesContainer.appendChild(svg);
    
    const positions = calculateTechPositionsOptimized(line.technologies);

    const maxY = Math.max(...Object.values(positions).map(p => p.y));
    const maxX = Math.max(...Object.values(positions).map(p => p.x));
    nodesContainer.style.minHeight = `${maxY + 200}px`;
    nodesContainer.style.minWidth = `${maxX + 300}px`;
    
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
    
    setTimeout(() => {
        drawConnectionsOptimized(line.technologies, nodeElements, svg, positions);
    }, 50);
    
    return lineDiv;
}

function calculateTechPositionsOptimized(technologies) {
    const positions = {};
    const nodeWidth = 260;
    const nodeHeight = 80;
    const verticalSpacing = 140;
    const horizontalSpacing = 60;
    const headerOffset = 80;
    const centerX = 600;
    
    const sortedTechnologies = [...technologies].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.id.localeCompare(b.id);
    });
    
    const techMap = {};
    sortedTechnologies.forEach(tech => {
        techMap[tech.id] = tech;
    });
    
    const children = {};
    const parents = {};
    
    sortedTechnologies.forEach(tech => {
        children[tech.id] = [];
        parents[tech.id] = [];
    });
    
    sortedTechnologies.forEach(tech => {
        if (tech.requires) {
            tech.requires.forEach(reqId => {
                if (techMap[reqId]) {
                    children[reqId].push(tech.id);
                    parents[tech.id].push(reqId);
                }
            });
        }
    });
    
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
    
    sortedTechnologies.forEach(tech => calculateDescendants(tech.id));
    
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
    
    sortedTechnologies.forEach(tech => calculateLevel(tech.id));
    
    const levelGroups = {};
    sortedTechnologies.forEach(tech => {
        const level = levels[tech.id];
        if (!levelGroups[level]) levelGroups[level] = [];
        levelGroups[level].push(tech);
    });
    
    const occupiedPositions = {};
    
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
    
    const sortedLevels = Object.keys(levelGroups).map(Number).sort((a, b) => a - b);
    
    sortedLevels.forEach(level => {
        const techs = levelGroups[level];
        const y = level * verticalSpacing + headerOffset;
        
        const techsByParentGroup = new Map();
        
        const sortedTechs = [...techs].sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.id.localeCompare(b.id);
        });
        
        sortedTechs.forEach(tech => {
            const techParents = parents[tech.id].filter(p => positions[p]);
            
            if (techParents.length === 0) {
                if (!techsByParentGroup.has('root')) {
                    techsByParentGroup.set('root', []);
                }
                techsByParentGroup.get('root').push(tech);
            } else {
                const parentKey = techParents.sort().join(',');
                if (!techsByParentGroup.has(parentKey)) {
                    techsByParentGroup.set(parentKey, []);
                }
                techsByParentGroup.get(parentKey).push(tech);
            }
        });
        
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
        
        sortedGroups.forEach(([parentKey, groupTechs]) => {
            if (parentKey === 'root') {
                let currentX = 50;
                groupTechs.forEach(tech => {
                    while (!isPositionFree(level, currentX)) {
                        currentX += nodeWidth + horizontalSpacing;
                    }
                    positions[tech.id] = { x: currentX, y };
                    occupyPosition(level, currentX);
                    currentX += nodeWidth + horizontalSpacing;
                });
            } else {
                const parentIds = parentKey.split(',');
                const parentPositions = parentIds.map(p => positions[p]).filter(Boolean);
                
                if (parentPositions.length > 0) {
                    const parentXs = parentPositions.map(p => p.x);
                    const minParentX = Math.min(...parentXs);
                    const maxParentX = Math.max(...parentXs);
                    const avgParentX = parentXs.reduce((a, b) => a + b, 0) / parentXs.length;
                    
                    const groupWidth = groupTechs.length * (nodeWidth + horizontalSpacing) - horizontalSpacing;
                    
                    let idealStartX = avgParentX - groupWidth / 2;
                    
                    let startX = 50;
                    let foundPosition = false;
                    
                    if (idealStartX >= 50) {
                        let canPlaceHere = true;
                        for (let i = 0; i < groupTechs.length; i++) {
                            const testX = idealStartX + i * (nodeWidth + horizontalSpacing);
                            if (!isPositionFree(level, testX)) {
                                canPlaceHere = false;
                                break;
                            }
                        }
                        if (canPlaceHere) {
                            startX = idealStartX;
                            foundPosition = true;
                        }
                    }
                    
                    if (!foundPosition) {
                        let testX = Math.max(50, minParentX - groupWidth - horizontalSpacing);
                        while (testX < maxParentX + nodeWidth + horizontalSpacing) {
                            let canPlaceHere = true;
                            for (let i = 0; i < groupTechs.length; i++) {
                                const checkX = testX + i * (nodeWidth + horizontalSpacing);
                                if (!isPositionFree(level, checkX)) {
                                    canPlaceHere = false;
                                    break;
                                }
                            }
                            
                            if (canPlaceHere) {
                                startX = testX;
                                foundPosition = true;
                                break;
                            }
                            
                            testX += horizontalSpacing;
                        }
                    }
                    
                    if (!foundPosition) {
                        startX = maxParentX + nodeWidth + horizontalSpacing;
                        while (!isPositionFree(level, startX)) {
                            startX += nodeWidth + horizontalSpacing;
                        }
                    }
                    
                    groupTechs.forEach((tech, index) => {
                        const x = startX + index * (nodeWidth + horizontalSpacing);
                        positions[tech.id] = { x, y };
                        occupyPosition(level, x);
                    });
                }
            }
        });
    });
    
    for (let iteration = 0; iteration < 2; iteration++) {
        sortedLevels.forEach(level => {
            const techs = levelGroups[level];
            
            techs.forEach(tech => {
                const techChildren = children[tech.id].filter(c => positions[c]);
                if (techChildren.length === 0) return;
                
                const childXs = techChildren.map(c => positions[c].x);
                const minChildX = Math.min(...childXs);
                const maxChildX = Math.max(...childXs);
                const avgChildX = (minChildX + maxChildX) / 2;
                
                const currentX = positions[tech.id].x;
                const targetX = avgChildX;
                
                const moveStep = (targetX - currentX) * 0.3;
                const newX = currentX + moveStep;
                
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
    
    const minX = Math.min(...Object.values(positions).map(p => p.x));
    const offsetX = minX - 50;
    
    if (offsetX > 0) {
        Object.values(positions).forEach(pos => {
            pos.x -= offsetX;
        });
    }
    
    return positions;
}


function drawConnectionsOptimized(technologies, elements, svg, positions) {
    svg.innerHTML = '';
    
    const nodeWidth = 240;
    
    const nodeHeights = {};
    Object.keys(elements).forEach(techId => {
        const element = elements[techId];
        nodeHeights[techId] = element.offsetHeight || 70;
    });
    
    const maxX = Math.max(...Object.values(positions).map(p => p.x)) + 400;
    const maxY = Math.max(...Object.values(positions).map(p => p.y)) + 250;
    svg.setAttribute('width', maxX);
    svg.setAttribute('height', maxY);
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';
    svg.style.overflow = 'visible';
    
    const techMap = {};
    technologies.forEach(tech => {
        techMap[tech.id] = tech;
    });
    
    const connections = [];
    technologies.forEach(tech => {
        if (tech.requires && tech.requires.length > 0) {
            tech.requires.forEach(reqId => {
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
    
    const exitPoints = {};
    connections.forEach(conn => {
        const key = conn.from;
        if (!exitPoints[key]) exitPoints[key] = [];
        exitPoints[key].push(conn);
    });
    
    const entryPoints = {};
    connections.forEach(conn => {
        const key = conn.to;
        if (!entryPoints[key]) entryPoints[key] = [];
        entryPoints[key].push(conn);
    });
    
    const techLevels = {};
    Object.keys(positions).forEach(techId => {
        const yPos = positions[techId].y;
        const level = Math.round((yPos - 80) / 140);
        techLevels[techId] = level;
    });
    
    const techsByLevel = {};
    Object.keys(positions).forEach(techId => {
        const level = techLevels[techId];
        if (!techsByLevel[level]) techsByLevel[level] = [];
        techsByLevel[level].push({
            id: techId,
            x: positions[techId].x,
            width: nodeWidth
        });
    });
    
    connections.forEach(conn => {
        const fromPos = conn.fromPos;
        const toPos = conn.toPos;
        
        const fromHeight = nodeHeights[conn.from] || 70;
        const x1 = fromPos.x + nodeWidth / 2;
        const y1 = fromPos.y + fromHeight;
        
        const x2 = toPos.x + nodeWidth / 2;
        const y2 = toPos.y;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        const verticalDist = y2 - y1;
        const horizontalDist = Math.abs(x2 - x1);
        

        const fromLevel = techLevels[conn.from];
        const toLevel = techLevels[conn.to];
        const levelDiff = toLevel - fromLevel;
        
        let d;
        
        if (verticalDist > 0) {

            if (levelDiff > 1) {

                let minObstacleX = Infinity;
                let maxObstacleX = -Infinity;
                
                for (let level = fromLevel + 1; level < toLevel; level++) {
                    const levelTechs = techsByLevel[level] || [];
                    levelTechs.forEach(tech => {
                        if (tech.id !== conn.from && tech.id !== conn.to) {
                            minObstacleX = Math.min(minObstacleX, tech.x);
                            maxObstacleX = Math.max(maxObstacleX, tech.x + tech.width);
                        }
                    });
                }
               
                let corridorX;
                const margin = 30;
                
                if (minObstacleX === Infinity) {
                    const controlOffset = Math.min(verticalDist * 0.3, 40);
                    const midY = y1 + verticalDist / 2;
                    d = `M ${x1} ${y1} 
                         C ${x1} ${y1 + controlOffset}, 
                           ${x1} ${midY}, 
                           ${(x1 + x2) / 2} ${midY}
                         S ${x2} ${y2 - controlOffset}, 
                           ${x2} ${y2}`;
                } else {
                    const distToLeft = Math.abs(x1 - (minObstacleX - margin));
                    const distToRight = Math.abs(x1 - (maxObstacleX + margin));
                    
                    if (distToLeft < distToRight && minObstacleX > 50) {
                        corridorX = minObstacleX - margin;
                    } else {
                        corridorX = maxObstacleX + margin;
                    }
                    
                    const step1Y = y1 + 30;
                    const step2Y = y2 - 30;
                    
                    d = `M ${x1} ${y1}
                         L ${x1} ${step1Y}
                         C ${x1} ${step1Y + 15},
                           ${x1 + (corridorX - x1) * 0.5} ${step1Y + 20},
                           ${corridorX} ${step1Y + 25}
                         L ${corridorX} ${step2Y - 25}
                         C ${corridorX} ${step2Y - 20},
                           ${x2 - (x2 - corridorX) * 0.5} ${step2Y - 15},
                           ${x2} ${step2Y}
                         L ${x2} ${y2}`;
                }
            } else if (horizontalDist < 20) {
                d = `M ${x1} ${y1} L ${x2} ${y2}`;
            } else {
                const controlOffset = Math.min(verticalDist * 0.3, 40);
                const midY = y1 + verticalDist / 2;
                d = `M ${x1} ${y1} 
                     C ${x1} ${y1 + controlOffset}, 
                       ${x1} ${midY}, 
                       ${(x1 + x2) / 2} ${midY}
                     S ${x2} ${y2 - controlOffset}, 
                       ${x2} ${y2}`;
            }
        } else {
            const bendY = Math.min(y1, y2) - 50;
            d = `M ${x1} ${y1} 
                 L ${x1} ${bendY} 
                 L ${x2} ${bendY} 
                 L ${x2} ${y2}`;
        }
        
        path.setAttribute('d', d);
        path.classList.add('tech-connection-line');
        
        const fromStatus = getTechStatus({ id: conn.from, requires: [] });
        const toTech = techMap[conn.to];
        const toStatus = getTechStatus(toTech);
        
        if (fromStatus === 'researched' && toStatus === 'researched') {
            path.classList.add('active');
        }
        
        svg.appendChild(path);
    });
}

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
        <div class="tech-node-year"><i class="fas fa-flask"></i> ${tech.year} ОИ</div>
    `;
    
    node.addEventListener('click', () => {
        showTechInfo(tech);
    });
    
    return node;
}

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
                <div class="tech-year"><i class="fas fa-flask"></i> Стоимость: ${tech.year} ОИ</div>
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

function findTechById(techId) {
    if (techData) {
        for (const line of techData.lines) {
            const tech = line.technologies.find(t => t.id === techId);
            if (tech) return tech;
        }
    }
    
    for (const category in allTechData) {
        const catData = allTechData[category];
        for (const line of catData.lines) {
            const tech = line.technologies.find(t => t.id === techId);
            if (tech) return tech;
        }
    }
    
    return null;
}

function closeTechInfo() {
    const infoPanel = document.getElementById('tech-info-panel');
    if (infoPanel) {
        infoPanel.classList.remove('visible');
    }
}

async function researchTechnology(techId) {
    console.log('Starting research for:', techId);
    
    if (!viewingCountryId) {
        window.showError('Ошибка', 'Страна не выбрана');
        return;
    }
    
    const user = window.gameState?.getUser();
    const isAdmin = user && (user.role === 'admin' || user.role === 'moderator');
    
    if (!isAdmin && viewingCountryId !== currentCountryId) {
        window.showError('Ошибка', 'Вы можете изучать технологии только для своей страны');
        return;
    }
    
    if (!isAdmin && selectedTech) {
        const cost = selectedTech.year || 0;
        if (currentResearchPoints < cost) {
            window.showError('Недостаточно ОИ', `<strong>Требуется:</strong> ${cost} ОИ<br/><strong>Доступно:</strong> ${currentResearchPoints} ОИ`);
            return;
        }
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/tech/research', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({
                tech_id: techId,
                country_id: viewingCountryId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            let message = 'Технология успешно изучена!';
            let details = '';
            
            if (data.research_points_remaining !== undefined) {
                currentResearchPoints = data.research_points_remaining;
                updateResearchPointsDisplay();
                details = `<strong>Потрачено:</strong> ${data.research_points_spent} ОИ<br/><strong>Осталось:</strong> ${currentResearchPoints} ОИ`;
            }
            
            if (!playerProgress.researched) {
                playerProgress.researched = [];
            }
            playerProgress.researched.push(techId);
            
            renderTechTree();
            
            closeTechInfo();
            
            // Показываем уведомление
            const fullMessage = details ? `${message}<br/>${details}` : message;
            console.log('🎯 Trying to show notification:', fullMessage);
            console.log('🎯 window.showSuccess type:', typeof window.showSuccess);
            
            if (typeof window.showSuccess === 'function') {
                console.log('🎯 Calling window.showSuccess...');
                const notification = window.showSuccess('Успех!', fullMessage);
                console.log('🎯 Notification returned:', notification);
            } else {
                console.error('window.showSuccess не найдена!');
                showModal('Успех!', `<i class="fas fa-check-circle"></i><p>${fullMessage}</p>`, 'success', ['OK']);
            }
        } else {
            const errorMsg = data.error || 'Не удалось изучить технологию';
            if (typeof window.showError === 'function') {
                window.showError('Ошибка', errorMsg);
            } else {
                console.error('window.showError не найдена!');
                showModal('Ошибка', `<i class="fas fa-exclamation-circle"></i><p>${errorMsg}</p>`, 'error', ['OK']);
            }
        }
        
    } catch (error) {
        console.error('Error researching technology:', error);
        const errorMsg = 'Произошла ошибка при изучении технологии';
        if (typeof window.showError === 'function') {
            window.showError('Ошибка', errorMsg);
        } else {
            console.error('window.showError не найдена!');
            showModal('Ошибка', `<i class="fas fa-exclamation-circle"></i><p>${errorMsg}</p>`, 'error', ['OK']);
        }
    }
}

function showTechError(message) {
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

async function switchCategory(category) {
    console.log('Switching to category:', category);
    
    currentCategory = category;
    localStorage.setItem('techCategory', category);
    
    document.querySelectorAll('.tech-category-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.category === category) {
            tab.classList.add('active');
        }
    });
    
    if (allTechData[category]) {
        techData = allTechData[category];
        renderTechTree();
        updateResearchPointsDisplay();
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

setTimeout(() => {
    initEventHandlers();
}, 100);

async function showCountrySelector() {
    const container = document.getElementById('tech-tree-content');
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading-content">
            <i class="fas fa-globe fa-3x"></i>
            <h3>Загрузка списка стран...</h3>
            <div class="loading-spinner"></div>
        </div>
    `;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/tech/admin/countries', {
            headers: { 'Authorization': token }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            showTechError('Ошибка загрузки списка стран');
            return;
        }
        
        container.innerHTML = `
            <div class="tech-country-selector">
                <div class="tech-category-header">
                    <div class="tech-category-title">
                        <i class="fas fa-flag"></i>
                        <h3>Выберите страну для просмотра технологий</h3>
                    </div>
                </div>
                <div class="countries-grid">
                    ${data.countries.map(country => `
                        <div class="country-card" onclick="window.techModule.selectCountry('${country.id}', '${country.name}')">
                            <div class="country-card-header">
                                <i class="fas fa-flag"></i>
                                <h4>${country.name}</h4>
                            </div>
                            <div class="country-card-info">
                                <div class="country-info-row">
                                    <i class="fas fa-crown"></i>
                                    <span>${country.ruler}</span>
                                </div>
                                <div class="country-info-row">
                                    <i class="fas fa-user"></i>
                                    <span>${country.player || 'Нет игрока'}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading countries:', error);
        showTechError('Не удалось загрузить список стран');
    }
}

async function selectCountry(countryId, countryName) {
    console.log('Selected country:', countryId, countryName);
    viewingCountryId = countryId;
    
    // Сохраняем выбор в localStorage
    localStorage.setItem('techViewingCountryId', countryId);
    localStorage.setItem('techViewingCountryName', countryName);
    
    // Перезагружаем дерево технологий с новой страной
    await initTechnologies(currentCategory);
}

function updateCountryIndicator(countryName) {
    const header = document.querySelector('.tech-category-header');
    if (!header) return;
    
    let indicator = document.querySelector('.tech-country-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'tech-country-indicator';
        header.appendChild(indicator);
    }
    
    indicator.innerHTML = `
        <i class="fas fa-flag"></i>
        <span>Просмотр страны: <strong>${countryName}</strong></span>
        <button class="btn-change-country" onclick="window.techModule.showCountrySelector()">
            <i class="fas fa-exchange-alt"></i> Сменить страну
        </button>
    `;
}

async function updateResearchPointsDisplay() {
    const user = window.gameState?.getUser();
    const isAdmin = user && (user.role === 'admin' || user.role === 'moderator');
    
    let rpDisplay = document.querySelector('.tech-rp-display');
    const header = document.querySelector('.tech-category-header');
    
    if (header && !rpDisplay) {
        rpDisplay = document.createElement('div');
        rpDisplay.className = 'tech-rp-display';
        header.appendChild(rpDisplay);
    }
    
    if (rpDisplay) {
        // Рассчитываем прогноз прироста
        const gain = await calculateResearchPointsGain();
        const gainText = gain > 0 ? ` <span style="color: #22c55e; font-weight: 600;">(+${gain})</span>` : '';
        
        if (isAdmin) {
            rpDisplay.innerHTML = `
                <i class="fas fa-flask"></i>
                <span>ОИ страны: <strong>${currentResearchPoints}</strong>${gainText}</span>
                <button class="btn-edit-rp" onclick="window.techModule.editResearchPoints()" title="Редактировать ОИ">
                    <i class="fas fa-edit"></i>
                </button>
            `;
        } else {
            rpDisplay.innerHTML = `
                <i class="fas fa-flask"></i>
                <span>Очки исследований: <strong>${currentResearchPoints}</strong>${gainText}</span>
            `;
        }
    }
}

async function editResearchPoints() {
    const result = await showPrompt('Редактирование очков исследований', 'Введите новое количество ОИ:', currentResearchPoints.toString());
    
    if (result === null) return;
    
    const newPoints = parseInt(result);
    if (isNaN(newPoints) || newPoints < 0) {
        window.showError('Ошибка ввода', 'Некорректное значение. Введите число больше или равно 0.');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/game/countries/${viewingCountryId}/research-points`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ research_points: newPoints })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentResearchPoints = newPoints;
            updateResearchPointsDisplay();
            window.showSuccess('Успех!', `Очки исследований успешно обновлены: ${newPoints} ОИ`);
        } else {
            window.showError('Ошибка', data.error || 'Не удалось обновить ОИ');
        }
    } catch (error) {
        console.error('Error updating research points:', error);
        window.showError('Ошибка', 'Произошла ошибка при обновлении ОИ');
    }
}

function showModal(title, message, type = 'info', buttons = ['OK']) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('modal-overlay');
        const container = document.getElementById('modal-container');
        const titleEl = document.getElementById('modal-title');
        const messageEl = document.getElementById('modal-message');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');
        const closeBtn = document.getElementById('modal-close');
        
        container.className = 'modal-container modal-' + type;
        
        titleEl.textContent = title;
        messageEl.innerHTML = message;
        
        confirmBtn.textContent = buttons[0] || 'OK';
        confirmBtn.style.display = 'inline-flex';
        
        if (buttons.length > 1) {
            cancelBtn.textContent = buttons[1];
            cancelBtn.style.display = 'inline-flex';
        } else {
            cancelBtn.style.display = 'none';
        }
        
        overlay.style.display = 'flex';
        setTimeout(() => overlay.classList.add('visible'), 10);
        
        const closeModal = (result) => {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
            resolve(result);
        };
        
        confirmBtn.onclick = () => closeModal(true);
        cancelBtn.onclick = () => closeModal(false);
        closeBtn.onclick = () => closeModal(false);
        overlay.onclick = (e) => {
            if (e.target === overlay) closeModal(false);
        };
    });
}

function showConfirm(title, message) {
    return showModal(title, `<i class="fas fa-question-circle"></i><p>${message}</p>`, 'confirm', ['OK', 'Отмена']);
}

function showPrompt(title, message, defaultValue = '') {
    return new Promise((resolve) => {
        const overlay = document.getElementById('modal-overlay');
        const container = document.getElementById('modal-container');
        const titleEl = document.getElementById('modal-title');
        const messageEl = document.getElementById('modal-message');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');
        const closeBtn = document.getElementById('modal-close');
        
        container.className = 'modal-container modal-prompt';
        titleEl.textContent = title;
        messageEl.innerHTML = `
            <i class="fas fa-edit"></i>
            <p>${message}</p>
            <input type="text" id="modal-input" class="modal-input" value="${defaultValue}" />
        `;
        
        confirmBtn.textContent = 'OK';
        confirmBtn.style.display = 'inline-flex';
        cancelBtn.textContent = 'Отмена';
        cancelBtn.style.display = 'inline-flex';
        
        overlay.style.display = 'flex';
        setTimeout(() => {
            overlay.classList.add('visible');
            const input = document.getElementById('modal-input');
            if (input) {
                input.focus();
                input.select();
            }
        }, 10);
        
        const closeModal = (result) => {
            const input = document.getElementById('modal-input');
            const value = result && input ? input.value : null;
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
            resolve(value);
        };
        
        confirmBtn.onclick = () => closeModal(true);
        cancelBtn.onclick = () => closeModal(false);
        closeBtn.onclick = () => closeModal(false);
        overlay.onclick = (e) => {
            if (e.target === overlay) closeModal(false);
        };
        
        const input = document.getElementById('modal-input');
        if (input) {
            input.onkeypress = (e) => {
                if (e.key === 'Enter') closeModal(true);
            };
        }
    });
}

async function toggleHiddenTechs() {
    showHiddenTechs = !showHiddenTechs;
    localStorage.setItem('showHiddenTechs', showHiddenTechs.toString());
    console.log('Toggling hidden techs:', showHiddenTechs);
    
    await initTechnologies(currentCategory);
}

async function changeCountry() {
    await showCountrySelector();
}

async function calculateResearchPointsGain() {
    if (!viewingCountryId) return 0;
    
    const token = localStorage.getItem('token');
    
    try {
        // Получаем население
        const statsResponse = await fetch(`/api/statistics/country/${viewingCountryId}`, {
            headers: { 'Authorization': token }
        });
        
        if (!statsResponse.ok) return 0;
        
        const statsData = await statsResponse.json();
        if (!statsData.success) return 0;
        
        const population = statsData.population || 0; // в миллионах
        const education = educationScienceData.education_level || 0;
        const science = educationScienceData.science_level || 0;
        
        // Формула: (P × E × 4) + (S × 35)
        const gain = (population * education * 4) + (science * 35);
        return Math.round(gain);
        
    } catch (error) {
        console.error('Error calculating research gain:', error);
        return 0;
    }
}

function updateParamDisplay(param, value) {
    const valueElement = document.getElementById(`value-${param}`);
    const progressElement = document.getElementById(`progress-${param}`);
    
    if (valueElement) {
        valueElement.textContent = parseFloat(value).toFixed(1);
    }
    
    if (progressElement) {
        progressElement.style.width = `${value}%`;
    }
    
    // Пересчитываем прогноз ОИ при изменении параметров
    updateResearchPointsDisplay();
}

async function saveEducationScience() {
    if (!viewingCountryId) {
        window.showError('Ошибка', 'Страна не выбрана');
        return;
    }
    
    const educationSlider = document.getElementById('education-slider');
    const scienceSlider = document.getElementById('science-slider');
    
    if (!educationSlider || !scienceSlider) {
        window.showError('Ошибка', 'Элементы интерфейса не найдены');
        return;
    }
    
    const education = parseFloat(educationSlider.value);
    const science = parseFloat(scienceSlider.value);
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/economic/country/${viewingCountryId}/education-science`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({
                education_level: education,
                science_level: science
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            educationScienceData = {
                education_level: education,
                science_level: science
            };
            window.showSuccess('Успех!', 'Параметры образования и науки успешно сохранены!');
        } else {
            window.showError('Ошибка', data.error || 'Не удалось сохранить параметры');
        }
    } catch (error) {
        console.error('Error saving education/science:', error);
        window.showError('Ошибка', 'Произошла ошибка при сохранении параметров');
    }
}

window.techModule = {
    init: initTechnologies,
    showInfo: showTechInfo,
    closeInfo: closeTechInfo,
    switchCategory: switchCategory,
    showCountrySelector: showCountrySelector,
    selectCountry: selectCountry,
    editResearchPoints: editResearchPoints,
    toggleHiddenTechs: toggleHiddenTechs,
    changeCountry: changeCountry,
    updateParamDisplay: updateParamDisplay,
    saveEducationScience: saveEducationScience,
    calculateResearchPointsGain: calculateResearchPointsGain
};
