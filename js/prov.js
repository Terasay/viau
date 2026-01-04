// Модуль управления провинциями
let provincesModule = (function() {
    let currentCountryId = null;
    let currentCountryName = '';
    let isAdminView = false;
    let provinces = [];
    let buildingTypes = [];
    let isInitialized = false; // Флаг инициализации

    async function init() {
        if (isInitialized) {
            return; // Уже инициализирован
        }
        
        console.log('Provinces module initialized');
        const gameState = window.gameState;
        if (gameState) {
            const user = gameState.getUser();
            const country = gameState.getCountry();
            
            if (user && country) {
                isAdminView = user.role === 'admin' || user.role === 'moderator';
                currentCountryId = country.id;
                currentCountryName = country.country_name || country.name || 'Неизвестная страна';
                console.log('Provinces module: country set', currentCountryId, currentCountryName);
                // Не загружаем данные сразу, будем загружать при открытии вкладки
            } else if (user && user.role === 'admin') {
                // Для админа без выбранной страны устанавливаем режим админа
                isAdminView = true;
                console.log('Provinces module: admin mode without selected country');
            }
        }
        
        isInitialized = true;
    }

    async function loadData() {
        if (!currentCountryId) {
            console.log('No country selected for provinces');
            return;
        }
        
        try {
            await Promise.all([
                loadProvinces(),
                loadBuildingTypes()
            ]);
            render();
        } catch (error) {
            console.error('Error loading provinces data:', error);
            const container = document.getElementById('provinces-content');
            if (container) {
                container.innerHTML = `
                    <div class="placeholder-card">
                        <i class="fas fa-exclamation-triangle fa-3x" style="color: var(--error);"></i>
                        <h3>Ошибка загрузки</h3>
                        <p>Не удалось загрузить данные провинций. Попробуйте перезагрузить страницу.</p>
                    </div>
                `;
            }
        }
    }

    async function ensureDataLoaded() {
        // Инициализируем модуль при первом вызове
        if (!isInitialized) {
            await init();
        }
        
        // Проверяем, выбрана ли страна
        if (!currentCountryId) {
            // Если админ и страна не выбрана - показываем окно выбора
            if (isAdminView) {
                const container = document.getElementById('provinces-content');
                if (container) {
                    container.innerHTML = `
                        <div class="placeholder-card">
                            <i class="fas fa-city fa-3x"></i>
                            <h3>Выберите страну</h3>
                            <p>Для просмотра провинций выберите страну из списка</p>
                            <button class="btn-primary" onclick="window.showCountrySelectionModal('provinces')">
                                <i class="fas fa-globe"></i> Выбрать страну
                            </button>
                        </div>
                    `;
                }
            } else {
                // Для игрока показываем ошибку
                const container = document.getElementById('provinces-content');
                if (container) {
                    container.innerHTML = `
                        <div class="placeholder-card">
                            <i class="fas fa-exclamation-triangle fa-3x" style="color: var(--error);"></i>
                            <h3>Ошибка загрузки</h3>
                            <p>Не удалось определить вашу страну. Попробуйте перезагрузить страницу.</p>
                        </div>
                    `;
                }
            }
            return;
        }
        
        // Загружаем данные только если они еще не загружены
        if (provinces.length === 0 && buildingTypes.length === 0) {
            await loadData();
        } else {
            render();
        }
    }

    async function loadProvinces() {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/provinces/country/${currentCountryId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        if (data.success) {
            provinces = data.provinces || [];
        } else {
            throw new Error(data.error);
        }
    }

    async function loadBuildingTypes() {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/provinces/building-types', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        if (data.success) {
            buildingTypes = data.building_types || [];
        } else {
            throw new Error(data.error);
        }
    }

    function render() {
        const container = document.getElementById('provinces-content');
        if (!container) return;

        let html = `
            <div class="provinces-header">
                <div>
                    <h2><i class="fas fa-city"></i> Провинции страны: ${currentCountryName}</h2>
                </div>
                <div style="display: flex; gap: 10px;">
                    ${isAdminView ? '<button class="btn-secondary" onclick="provincesModule.showBuildingTypesManager()"><i class="fas fa-cogs"></i> Управление каталогом построек</button>' : ''}
                    ${isAdminView ? '<button class="btn-primary" onclick="provincesModule.showAddProvinceModal()"><i class="fas fa-plus"></i> Добавить провинцию</button>' : ''}
                </div>
            </div>
        `;

        if (provinces.length === 0) {
            html += `
                <div class="placeholder-card">
                    <i class="fas fa-city fa-3x"></i>
                    <h3>Нет провинций</h3>
                    <p>${isAdminView ? 'Создайте первую провинцию для этой страны' : 'В вашей стране пока нет провинций'}</p>
                </div>
            `;
        } else {
            html += '<div class="provinces-grid">';
            provinces.forEach(province => {
                html += renderProvinceCard(province);
            });
            html += '</div>';
        }

        container.innerHTML = html;
    }

    function renderProvinceCard(province) {
        return `
            <div class="province-card" data-province-id="${province.id}">
                <div class="province-card-header">
                    <div>
                        <h3><i class="fas fa-map-marker-alt"></i> ${province.name}</h3>
                        <p class="province-city"><i class="fas fa-city"></i> ${province.city_name}</p>
                    </div>
                    ${isAdminView ? `
                        <div class="province-actions">
                            <button class="btn-icon" onclick="provincesModule.editProvince(${province.id})" title="Редактировать">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-danger" onclick="provincesModule.deleteProvince(${province.id})" title="Удалить">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
                <div class="province-info">
                    <div class="info-row">
                        <span class="info-label"><i class="fas fa-th"></i> Квадрат:</span>
                        <span class="info-value">${province.square}</span>
                    </div>
                </div>
                <button class="btn-secondary btn-full" onclick="provincesModule.showBuildings(${province.id}, '${province.name}')">
                    <i class="fas fa-industry"></i> Постройки
                </button>
            </div>
        `;
    }

    async function showBuildings(provinceId, provinceName) {
        const modal = document.getElementById('modal-overlay');
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const modalFooter = document.getElementById('modal-footer');
        
        modalTitle.innerHTML = `<i class="fas fa-industry"></i> Постройки: ${provinceName}`;
        modalBody.innerHTML = '<p style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Загрузка...</p>';
        modalFooter.innerHTML = '<button class="btn-secondary" onclick="closeModal()">Закрыть</button>';
        modal.classList.add('visible');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/provinces/${provinceId}/buildings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            if (data.success) {
                renderBuildingsModal(provinceId, data.buildings);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error loading buildings:', error);
            modalBody.innerHTML = `<p style="color: var(--error); text-align: center;">Ошибка загрузки построек: ${error.message}</p>`;
        }
    }

    function renderBuildingsModal(provinceId, buildings) {
        const modalBody = document.getElementById('modal-body');
        const modalFooter = document.getElementById('modal-footer');
        
        let html = '';
        
        // Кнопка строительства
        html += `
            <button class="btn-primary" style="margin-bottom: 20px;" onclick="provincesModule.showBuildMenu(${provinceId})">
                Построить здание
            </button>
        `;

        if (buildings.length === 0) {
            html += `
                <div class="placeholder-text">
                    <i class="fas fa-industry fa-2x"></i>
                    <p>В этой провинции пока нет построек</p>
                </div>
            `;
        } else {
            html += '<div class="buildings-list">';
            
            buildings.forEach(building => {
                const effectText = getEffectText(building.effect_type, building.effect_value);
                
                html += `
                    <div class="building-item">
                        <div class="building-header">
                            <h4>
                                <i class="fas fa-industry"></i> ${building.name}
                            </h4>
                            <button class="btn-icon btn-danger" onclick="provincesModule.demolishBuilding(${building.id}, ${provinceId})" title="Снести">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <p class="building-description">${building.description}</p>
                        <div class="building-stats">
                            <div class="stat-item">
                                <i class="fas fa-level-up-alt"></i>
                                <span>Уровень: ${building.level}</span>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-coins"></i>
                                <span>Содержание: ${building.maintenance_cost}</span>
                            </div>
                            ${effectText ? `
                                <div class="stat-item">
                                    <i class="fas fa-chart-line"></i>
                                    <span>${effectText}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        modalBody.innerHTML = html;
        modalFooter.innerHTML = '<button class="btn-secondary" onclick="closeModal()">Закрыть</button>';
    }

    function getEffectText(effectType, effectValue) {
        if (!effectType || !effectValue) return '';
        
        const effects = {
            'income': `+${effectValue} к доходу`,
            'education': `+${effectValue}% к образованию`,
            'science': `+${effectValue}% к науке`,
            'population': `+${effectValue}% к росту населения`
        };
        
        return effects[effectType] || '';
    }

    function showBuildMenu(provinceId) {
        const modalBody = document.getElementById('modal-body');
        
        let html = `
            <h3 style="margin-bottom: 20px;"> Выберите тип здания</h3>
            <div class="building-types-grid">
        `;
        
        buildingTypes.forEach(type => {
            const effectText = getEffectText(type.effect_type, type.effect_value);
            
            html += `
                <div class="building-type-card">
                    <h4><i class="fas fa-industry"></i> ${type.name}</h4>
                    <p>${type.description}</p>
                    <div class="building-type-stats">
                        <div class="stat-row">
                            <i class="fas fa-coins"></i>
                            <span>Стоимость: ${type.base_cost}</span>
                        </div>
                        <div class="stat-row">
                            <i class="fas fa-wrench"></i>
                            <span>Содержание: ${type.maintenance_cost}/ход</span>
                        </div>
                        ${effectText ? `
                            <div class="stat-row">
                                <i class="fas fa-chart-line"></i>
                                <span>${effectText}</span>
                            </div>
                        ` : ''}
                    </div>
                    <button class="btn-primary btn-full" onclick="provincesModule.buildBuilding(${provinceId}, ${type.id})">
                        Построить
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        modalBody.innerHTML = html;
    }

    async function buildBuilding(provinceId, buildingTypeId) {
        if (!confirm('Вы уверены, что хотите построить это здание?')) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/provinces/${provinceId}/buildings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ building_type_id: buildingTypeId })
            });
            
            const data = await response.json();
            if (data.success) {
                await showSuccess('Здание построено', data.message);
                // Обновляем баланс страны
                if (window.gameState) {
                    await window.gameState.updateCountry();
                }
                // Перезагружаем список построек
                const provinceName = provinces.find(p => p.id === provinceId)?.name || '';
                await showBuildings(provinceId, provinceName);
            } else {
                await showError('Ошибка', data.error);
            }
        } catch (error) {
            console.error('Error building:', error);
            await showError('Ошибка', error.message);
        }
    }

    async function demolishBuilding(buildingId, provinceId) {
        if (!confirm('Вы уверены, что хотите снести это здание?')) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/provinces/buildings/${buildingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            if (data.success) {
                await showSuccess('Успешно', data.message);
                // Перезагружаем список построек
                const provinceName = provinces.find(p => p.id === provinceId)?.name || '';
                await showBuildings(provinceId, provinceName);
            } else {
                await showError('Ошибка', data.error);
            }
        } catch (error) {
            console.error('Error demolishing:', error);
            await showError('Ошибка', error.message);
        }
    }

    function showAddProvinceModal() {
        const modal = document.getElementById('modal-overlay');
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const modalFooter = document.getElementById('modal-footer');
        
        modalTitle.innerHTML = '<i class="fas fa-plus"></i> Добавить провинцию';
        modalBody.innerHTML = `
            <div class="form-group">
                <label for="province-name"><i class="fas fa-map-marker-alt"></i> Название провинции:</label>
                <input type="text" id="province-name" class="modal-input" placeholder="Например: Центральная область">
            </div>
            <div class="form-group">
                <label for="province-city"><i class="fas fa-city"></i> Город:</label>
                <input type="text" id="province-city" class="modal-input" placeholder="Например: Столичный град">
            </div>
            <div class="form-group">
                <label for="province-square"><i class="fas fa-th"></i> Квадрат:</label>
                <input type="text" id="province-square" class="modal-input" placeholder="Например: A5">
            </div>
        `;
        modalFooter.innerHTML = `
            <button class="btn-primary" onclick="provincesModule.saveProvince()">
                <i class="fas fa-save"></i> Сохранить
            </button>
            <button class="btn-secondary" onclick="closeModal()">Отмена</button>
        `;
        
        modal.classList.add('visible');
    }

    async function saveProvince(provinceId = null) {
        const name = document.getElementById('province-name').value.trim();
        const cityName = document.getElementById('province-city').value.trim();
        const square = document.getElementById('province-square').value.trim();
        
        if (!name || !cityName || !square) {
            await showError('Ошибка', 'Все поля обязательны для заполнения');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const url = provinceId ? `/api/provinces/${provinceId}` : '/api/provinces/';
            const method = provinceId ? 'PUT' : 'POST';
            
            const body = provinceId 
                ? { name, city_name: cityName, square }
                : { country_id: currentCountryId, name, city_name: cityName, square };
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            const data = await response.json();
            if (data.success) {
                closeModal();
                await showSuccess('Успешно', data.message);
                await loadProvinces();
                render();
            } else {
                await showError('Ошибка', data.error);
            }
        } catch (error) {
            console.error('Error saving province:', error);
            await showError('Ошибка', error.message);
        }
    }

    function editProvince(provinceId) {
        const province = provinces.find(p => p.id === provinceId);
        if (!province) return;
        
        const modal = document.getElementById('modal-overlay');
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const modalFooter = document.getElementById('modal-footer');
        
        modalTitle.innerHTML = '<i class="fas fa-edit"></i> Редактировать провинцию';
        modalBody.innerHTML = `
            <div class="form-group">
                <label for="province-name"><i class="fas fa-map-marker-alt"></i> Название провинции:</label>
                <input type="text" id="province-name" class="modal-input" value="${province.name}">
            </div>
            <div class="form-group">
                <label for="province-city"><i class="fas fa-city"></i> Город:</label>
                <input type="text" id="province-city" class="modal-input" value="${province.city_name}">
            </div>
            <div class="form-group">
                <label for="province-square"><i class="fas fa-th"></i> Квадрат:</label>
                <input type="text" id="province-square" class="modal-input" value="${province.square}">
            </div>
        `;
        modalFooter.innerHTML = `
            <button class="btn-primary" onclick="provincesModule.saveProvince(${provinceId})">
                <i class="fas fa-save"></i> Сохранить
            </button>
            <button class="btn-secondary" onclick="closeModal()">Отмена</button>
        `;
        
        modal.classList.add('visible');
    }

    async function deleteProvince(provinceId) {
        const province = provinces.find(p => p.id === provinceId);
        if (!province) return;
        
        if (!confirm(`Вы уверены, что хотите удалить провинцию "${province.name}"? Все постройки в ней будут удалены.`)) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/provinces/${provinceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            if (data.success) {
                await showSuccess('Успешно', data.message);
                await loadProvinces();
                render();
            } else {
                await showError('Ошибка', data.error);
            }
        } catch (error) {
            console.error('Error deleting province:', error);
            await showError('Ошибка', error.message);
        }
    }

    function selectCountry(countryId, countryName) {
        currentCountryId = countryId;
        currentCountryName = countryName;
        console.log('Provinces: country selected', countryId, countryName);
        
        // Сбрасываем загруженные данные
        provinces = [];
        buildingTypes = [];
        
        // Загружаем данные для новой страны
        ensureDataLoaded();
    }

    // Вспомогательные функции для модальных окон
    function showSuccess(title, message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('modal-overlay');
            const modalBody = document.getElementById('modal-body');
            const modalTitle = document.getElementById('modal-title');
            const modalFooter = document.getElementById('modal-footer');
            
            modalTitle.innerHTML = `<i class="fas fa-check-circle" style="color: var(--success);"></i> ${title}`;
            modalBody.innerHTML = `<p style="text-align: center;">${message}</p>`;
            modalFooter.innerHTML = `
                <button class="btn-primary" onclick="closeModal()">OK</button>
            `;
            
            modal.classList.add('visible');
            
            // Автоматически закрываем через 2 секунды
            setTimeout(() => {
                closeModal();
                resolve();
            }, 2000);
        });
    }

    function showError(title, message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('modal-overlay');
            const modalBody = document.getElementById('modal-body');
            const modalTitle = document.getElementById('modal-title');
            const modalFooter = document.getElementById('modal-footer');
            
            modalTitle.innerHTML = `<i class="fas fa-exclamation-circle" style="color: var(--error);"></i> ${title}`;
            modalBody.innerHTML = `<p style="text-align: center; color: var(--error);">${message}</p>`;
            modalFooter.innerHTML = `
                <button class="btn-secondary" onclick="closeModal()">OK</button>
            `;
            
            modal.classList.add('visible');
            
            setTimeout(() => {
                resolve();
            }, 100);
        });
    }

    // ========== УПРАВЛЕНИЕ КАТАЛОГОМ ПОСТРОЕК (ТОЛЬКО АДМИН) ==========

    async function showBuildingTypesManager() {
        const modal = document.getElementById('modal-overlay');
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const modalFooter = document.getElementById('modal-footer');
        
        modalTitle.innerHTML = '<i class="fas fa-cogs"></i> Управление каталогом построек';
        modalBody.innerHTML = '<p style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Загрузка...</p>';
        modalFooter.innerHTML = '<button class="btn-secondary" onclick="closeModal()">Закрыть</button>';
        modal.classList.add('visible');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/provinces/building-types', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                renderBuildingTypesManager(data.building_types);
            } else {
                await showError('Ошибка', data.error || 'Не удалось загрузить типы построек');
            }
        } catch (error) {
            console.error('Error loading building types:', error);
            await showError('Ошибка', 'Не удалось загрузить типы построек');
        }
    }

    function renderBuildingTypesManager(buildingTypes) {
        const modalBody = document.getElementById('modal-body');
        const modalFooter = document.getElementById('modal-footer');
        
        let html = `
            <button class="btn-primary" style="margin-bottom: 20px;" onclick="provincesModule.showAddBuildingTypeModal()">
                <i class="fas fa-plus"></i><span>Добавить тип постройки</span>
            </button>
        `;

        if (buildingTypes.length === 0) {
            html += '<p style="text-align: center; color: var(--text-secondary);">Нет доступных типов построек</p>';
        } else {
            html += '<div class="building-types-manager-list">';
            buildingTypes.forEach(type => {
                html += `
                    <div class="building-type-manager-card" data-type-id="${type.id}">
                        <div class="building-type-manager-header">
                            <h4><i class="fas fa-industry"></i> ${type.name}</h4>
                            <div class="building-type-manager-actions">
                                <button class="btn-icon" onclick="provincesModule.editBuildingType(${type.id})" title="Редактировать">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon btn-danger" onclick="provincesModule.deleteBuildingType(${type.id}, '${type.name}')" title="Удалить">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <p class="building-type-manager-description">${type.description || 'Нет описания'}</p>
                        <div class="building-type-manager-stats">
                            <div class="stat-row">
                                <i class="fas fa-coins"></i> Стоимость: <strong>${type.base_cost}</strong>
                            </div>
                            <div class="stat-row">
                                <i class="fas fa-money-bill-wave"></i> Содержание: <strong>${type.maintenance_cost}</strong>
                            </div>
                            <div class="stat-row">
                                <i class="fas fa-clock"></i> Время стройки: <strong>${type.build_time} ${type.build_time === 1 ? 'ход' : 'хода'}</strong>
                            </div>
                            ${type.effect_type ? `
                                <div class="stat-row">
                                    <i class="fas fa-star"></i> Эффект: <strong>${getEffectText(type.effect_type, type.effect_value)}</strong>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        modalBody.innerHTML = html;
        modalFooter.innerHTML = '<button class="btn-secondary" onclick="closeModal()">Закрыть</button>';
    }

    function showAddBuildingTypeModal() {
        const modal = document.getElementById('modal-overlay');
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const modalFooter = document.getElementById('modal-footer');
        
        modalTitle.innerHTML = '<i class="fas fa-plus"></i> Добавить тип постройки';
        modalBody.innerHTML = `
            <form id="building-type-form" onsubmit="event.preventDefault(); provincesModule.saveBuildingType();">
                <div class="form-group">
                    <label><i class="fas fa-tag"></i> Название</label>
                    <input type="text" id="building-type-name" class="modal-input" required>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-align-left"></i> Описание</label>
                    <textarea id="building-type-description" class="modal-input" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-coins"></i> Стоимость строительства</label>
                    <input type="number" id="building-type-cost" class="modal-input" min="0" value="1000" required>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-money-bill-wave"></i> Стоимость содержания</label>
                    <input type="number" id="building-type-maintenance" class="modal-input" min="0" value="100" required>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-star"></i> Тип эффекта</label>
                    <select id="building-type-effect-type" class="modal-input">
                        <option value="">Нет эффекта</option>
                        <option value="income">Доход</option>
                        <option value="education">Образование</option>
                        <option value="science">Наука</option>
                        <option value="population">Рост населения</option>
                    </select>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-chart-line"></i> Значение эффекта</label>
                    <input type="number" id="building-type-effect-value" class="modal-input" step="0.1" value="0">
                </div>
            </form>
        `;
        modalFooter.innerHTML = `
            <button class="btn-primary" onclick="provincesModule.saveBuildingType()">
                <i class="fas fa-save"></i> Сохранить
            </button>
            <button class="btn-secondary" onclick="closeModal()">Отмена</button>
        `;
        
        modal.classList.add('visible');
    }

    async function editBuildingType(buildingTypeId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/provinces/building-types', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                const buildingType = data.building_types.find(bt => bt.id === buildingTypeId);
                if (buildingType) {
                    showEditBuildingTypeModal(buildingType);
                }
            }
        } catch (error) {
            console.error('Error loading building type:', error);
            await showError('Ошибка', 'Не удалось загрузить тип постройки');
        }
    }

    function showEditBuildingTypeModal(buildingType) {
        const modal = document.getElementById('modal-overlay');
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const modalFooter = document.getElementById('modal-footer');
        
        modalTitle.innerHTML = '<i class="fas fa-edit"></i> Редактировать тип постройки';
        modalBody.innerHTML = `
            <form id="building-type-form" onsubmit="event.preventDefault(); provincesModule.saveBuildingType(${buildingType.id});">
                <div class="form-group">
                    <label><i class="fas fa-tag"></i> Название</label>
                    <input type="text" id="building-type-name" class="modal-input" value="${buildingType.name}" required>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-align-left"></i> Описание</label>
                    <textarea id="building-type-description" class="modal-input" rows="3">${buildingType.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-coins"></i> Стоимость строительства</label>
                    <input type="number" id="building-type-cost" class="modal-input" min="0" value="${buildingType.base_cost}" required>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-money-bill-wave"></i> Стоимость содержания</label>
                    <input type="number" id="building-type-maintenance" class="modal-input" min="0" value="${buildingType.maintenance_cost}" required>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-star"></i> Тип эффекта</label>
                    <select id="building-type-effect-type" class="modal-input">
                        <option value="">Нет эффекта</option>
                        <option value="income" ${buildingType.effect_type === 'income' ? 'selected' : ''}>Доход</option>
                        <option value="education" ${buildingType.effect_type === 'education' ? 'selected' : ''}>Образование</option>
                        <option value="science" ${buildingType.effect_type === 'science' ? 'selected' : ''}>Наука</option>
                        <option value="population" ${buildingType.effect_type === 'population' ? 'selected' : ''}>Рост населения</option>
                    </select>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-chart-line"></i> Значение эффекта</label>
                    <input type="number" id="building-type-effect-value" class="modal-input" step="0.1" value="${buildingType.effect_value || 0}">
                </div>
            </form>
        `;
        modalFooter.innerHTML = `
            <button class="btn-primary" onclick="provincesModule.saveBuildingType(${buildingType.id})">
                <i class="fas fa-save"></i> Сохранить
            </button>
            <button class="btn-secondary" onclick="closeModal()">Отмена</button>
        `;
        
        modal.classList.add('visible');
    }

    async function saveBuildingType(buildingTypeId = null) {
        const name = document.getElementById('building-type-name').value.trim();
        const description = document.getElementById('building-type-description').value.trim();
        const base_cost = parseInt(document.getElementById('building-type-cost').value);
        const maintenance_cost = parseInt(document.getElementById('building-type-maintenance').value);
        const effect_type = document.getElementById('building-type-effect-type').value;
        const effect_value = parseFloat(document.getElementById('building-type-effect-value').value);
        
        if (!name) {
            await showError('Ошибка', 'Название обязательно');
            return;
        }
        
        const token = localStorage.getItem('token');
        const url = buildingTypeId 
            ? `/api/provinces/building-types/${buildingTypeId}`
            : '/api/provinces/building-types';
        const method = buildingTypeId ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    description,
                    base_cost,
                    maintenance_cost,
                    effect_type,
                    effect_value
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                await showSuccess('Успех', data.message);
                // Перезагружаем список типов построек
                setTimeout(() => {
                    showBuildingTypesManager();
                }, 1500);
            } else {
                await showError('Ошибка', data.error || 'Не удалось сохранить тип постройки');
            }
        } catch (error) {
            console.error('Error saving building type:', error);
            await showError('Ошибка', 'Не удалось сохранить тип постройки');
        }
    }

    async function deleteBuildingType(buildingTypeId, buildingTypeName) {
        if (!confirm(`Вы уверены, что хотите удалить тип постройки "${buildingTypeName}"?`)) {
            return;
        }
        
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch(`/api/provinces/building-types/${buildingTypeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                await showSuccess('Успех', data.message);
                // Перезагружаем список типов построек
                setTimeout(() => {
                    showBuildingTypesManager();
                }, 1500);
            } else {
                await showError('Ошибка', data.error || 'Не удалось удалить тип постройки');
            }
        } catch (error) {
            console.error('Error deleting building type:', error);
            await showError('Ошибка', 'Не удалось удалить тип постройки');
        }
    }

    // Публичный API модуля
    return {
        init,
        ensureDataLoaded,
        selectCountry,
        showBuildings,
        showBuildMenu,
        buildBuilding,
        demolishBuilding,
        showAddProvinceModal,
        saveProvince,
        editProvince,
        deleteProvince,
        showBuildingTypesManager,
        showAddBuildingTypeModal,
        editBuildingType,
        saveBuildingType,
        deleteBuildingType
    };
})();

// Экспортируем модуль глобально
window.provincesModule = provincesModule;
