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
        const response = await fetch(`/api/provinces/building-types?country_id=${currentCountryId}`, {
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
            // Образовательные эффекты
            'education_growth': `+${effectValue}% к приросту образования/ход`,
            'science_growth': `+${effectValue}% к приросту науки/ход`,
            
            // Производственные эффекты
            'production_rifles': `Производит ${effectValue} винтовок/ход`,
            'production_ammunition': `Производит ${effectValue} боеприпасов/ход`,
            'production_artillery': `Производит ${effectValue} орудий/ход`,
            'production_tanks': `Производит ${effectValue} танков/ход`,
            'production_aircraft': `Производит ${effectValue} самолётов/ход`,
            'production_vehicles': `Производит ${effectValue} машин/ход`,
            'production_sailing_ships': `Строит ${effectValue} парусных кораблей/ход`,
            'production_steam_ships': `Строит ${effectValue} паровых кораблей/ход`,
            'production_destroyers': `Строит ${effectValue} эсминцев/ход`,
            'production_battleships': `Строит ${effectValue} линкоров/ход`,
            'production_submarines': `Строит ${effectValue} подлодок/ход`,
            
            // Старые эффекты (на случай миграции)
            'income': `+${effectValue} к доходу`,
            'education': `+${effectValue}% к образованию`,
            'science': `+${effectValue}% к науке`,
            'population': `+${effectValue}% к росту населения`
        };
        
        return effects[effectType] || '';
    }

    function showBuildMenu(provinceId) {
        const modalBody = document.getElementById('modal-body');
        
        // Группируем постройки по категориям
        const categories = {
            'educational': { name: '📚 Образовательные постройки', buildings: [] },
            'military_infantry': { name: '🔫 Производство пехотного снаряжения', buildings: [] },
            'military_vehicles': { name: '🚜 Производство военной техники', buildings: [] },
            'military_naval': { name: '⚓ Верфи и кораблестроение', buildings: [] }
        };
        
        // Фильтруем только доступные постройки и группируем по категориям
        buildingTypes.forEach(type => {
            if (type.is_available && categories[type.building_category]) {
                categories[type.building_category].buildings.push(type);
            }
        });
        
        let html = '<h3 style="margin-bottom: 20px;">🏗️ Выберите тип здания</h3>';
        
        // Отображаем каждую категорию
        for (const [categoryKey, category] of Object.entries(categories)) {
            if (category.buildings.length === 0) continue;
            
            html += `
                <h4 style="margin-top: 25px; margin-bottom: 15px; color: var(--primary); font-size: 1.1em;">
                    ${category.name}
                </h4>
                <div class="building-types-grid">
            `;
            
            category.buildings.forEach(type => {
                const effectText = getEffectText(type.effect_type, type.effect_value);
                const icon = getCategoryIcon(type.building_category);
                
                html += `
                    <div class="building-type-card">
                        <h4><i class="${icon}"></i> ${type.name}</h4>
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
        }
        
        modalBody.innerHTML = html;
    }
    
    function getCategoryIcon(category) {
        const icons = {
            'educational': 'fas fa-graduation-cap',
            'military_infantry': 'fas fa-person-rifle',
            'military_vehicles': 'fas fa-truck-monster',
            'military_naval': 'fas fa-ship'
        };
        return icons[category] || 'fas fa-building';
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
        deleteProvince
    };
})();

// Экспортируем модуль глобально
window.provincesModule = provincesModule;
