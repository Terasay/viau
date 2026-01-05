// Модуль управления провинциями - полная переработка
const provincesModule = (function() {
    let currentCountryId = null;
    let currentCountryName = '';
    let isAdminView = false;
    let provinces = [];
    let buildingTypes = [];
    let currencyCode = 'ESC';
    let currencyName = 'единиц';
    let goldRate = 1;

    async function init() {
        console.log('Provinces module init started');
        const gameState = window.gameState;
        if (gameState) {
            const user = gameState.getUser();
            const country = gameState.getCountry();
            
            console.log('User:', user);
            console.log('Country:', country);
            
            if (user && country) {
                currentCountryId = country.id;
                currentCountryName = country.name;
                currencyCode = country.main_currency || 'ESC';
                isAdminView = user.role === 'admin' || user.role === 'moderator';
            } else {
                isAdminView = user && (user.role === 'admin' || user.role === 'moderator');
            }
        }
        
        if (currentCountryId) {
            await loadData();
        } else {
            console.log('No country selected, rendering empty state');
            render();
        }
    }

    async function loadData() {
        if (!currentCountryId) {
            console.warn('loadData: no currentCountryId');
            return;
        }
        
        console.log('Loading data for country:', currentCountryId);
        
        try {
            await Promise.all([
                loadProvinces(),
                loadBuildingTypes(),
                loadCurrencyData()
            ]);
            console.log('Data loaded successfully');
            render();
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            showError('Ошибка', error.message);
        }
    }

    async function loadProvinces() {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/provinces/country/${currentCountryId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
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
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (data.success) {
            buildingTypes = data.building_types || [];
        } else {
            throw new Error(data.error);
        }
    }

    async function loadCurrencyData() {
        try {
            const response = await fetch('/api/converter/data');
            const data = await response.json();
            
            if (data.success && data.data && data.data.currencies) {
                const currencyInfo = data.data.currencies[currencyCode];
                if (currencyInfo) {
                    goldRate = currencyInfo.rate || 1;
                    currencyName = getCurrencyGenitiveName(currencyInfo.name);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки валюты:', error);
        }
    }

    function getCurrencyGenitiveName(fullName) {
        const genitiveMap = {
            'Краун': 'краунов',
            'Вельштадт': 'вельштадтов',
            'Флорен': 'флоренов',
            'Российский рубль': 'рублей',
            'Штадтмарк': 'штадтмарок',
            'Стедмарк': 'стедмарок',
            'Маркталер': 'маркталеров',
            'Фортуна': 'фортун',
            'Талар': 'таларов',
            'Грейнталер': 'грейнталеров',
            'Меденция': 'меденций',
            'Нордкрона': 'нордкрон',
            'Эскудо': 'эскудо',
            'Денье': 'дeнье'
        };
        return genitiveMap[fullName] || fullName.toLowerCase();
    }

    function convertGoldToPrice(goldAmount) {
        const price = goldAmount * goldRate;
        return Math.ceil(price / 10) * 10;
    }

    function formatPrice(goldAmount) {
        const convertedPrice = convertGoldToPrice(goldAmount);
        let formatted = `${convertedPrice} ${currencyName}`;
        if (isAdminView) {
            formatted += ` (${goldAmount} золота)`;
        }
        return formatted;
    }

    function render() {
        const container = document.getElementById('provinces-content');
        if (!container) {
            console.error('Container #provinces-content not found');
            return;
        }

        if (!currentCountryId) {
            container.innerHTML = `
                <div class="placeholder-text">
                    <i class="fas fa-globe"></i>
                    <p>Выберите страну для просмотра провинций</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="provinces-header">
                <h2><i class="fas fa-city"></i> Провинции страны: ${currentCountryName}</h2>
                ${isAdminView ? `<button class="btn-primary" onclick="provincesModule.showAddProvinceModal()">
                    <i class="fas fa-plus"></i> Добавить провинцию
                </button>` : ''}
            </div>
        `;

        if (provinces.length === 0) {
            html += `
                <div class="placeholder-text">
                    <i class="fas fa-city"></i>
                    <p>${isAdminView ? 'Создайте первую провинцию' : 'В вашей стране пока нет провинций'}</p>
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
            <div class="province-card">
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
                        <span class="info-label"><i class="fas fa-th"></i> Квадрат</span>
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
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalFooter = document.getElementById('modal-footer');
        
        modalTitle.innerHTML = `<i class="fas fa-industry"></i> Постройки: ${provinceName}`;
        modalBody.innerHTML = '<p style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Загрузка...</p>';
        modalFooter.innerHTML = '<button class="btn-secondary" onclick="closeModal()">Закрыть</button>';
        modal.classList.add('visible');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/provinces/${provinceId}/buildings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            if (data.success) {
                renderBuildingsModal(provinceId, data.buildings || []);
            } else {
                modalBody.innerHTML = `<p style="color: var(--error); text-align: center;">${data.error}</p>`;
            }
        } catch (error) {
            modalBody.innerHTML = `<p style="color: var(--error); text-align: center;">Ошибка: ${error.message}</p>`;
        }
    }

    function renderBuildingsModal(provinceId, buildings) {
        const modalBody = document.getElementById('modal-body');
        
        let html = `
            <button class="btn-primary" style="margin-bottom: 20px;" onclick="provincesModule.showBuildMenu(${provinceId})">
                <i class="fas fa-hammer"></i> Построить здание
            </button>
        `;

        if (buildings.length === 0) {
            html += `
                <div class="placeholder-text">
                    <i class="fas fa-industry"></i>
                    <p>В этой провинции пока нет построек</p>
                </div>
            `;
        } else {
            html += '<div class="buildings-list">';
            
            buildings.forEach(building => {
                const effectText = getEffectText(building.effect_type, building.effect_value);
                const maintenance = formatPrice(building.maintenance_cost);
                
                html += `
                    <div class="building-item">
                        <div class="building-header">
                            <h4><i class="fas fa-industry"></i> ${building.name}</h4>
                        </div>
                        <p class="building-description">${building.description}</p>
                        <div class="building-stats">
                            <div class="stat-item">
                                <i class="fas fa-coins"></i>
                                <span>Содержание: ${maintenance}/ход</span>
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
    }

    function getEffectText(effectType, effectValue) {
        if (!effectType || !effectValue) return '';
        
        const effects = {
            'education_growth': `+${(effectValue * 100).toFixed(1)}% к приросту образования/ход`,
            'science_growth': `+${(effectValue * 100).toFixed(1)}% к приросту науки/ход`,
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
            'production_submarines': `Строит ${effectValue} подлодок/ход`
        };
        
        return effects[effectType] || '';
    }

    function showBuildMenu(provinceId) {
        const modalBody = document.getElementById('modal-body');
        
        const categories = {
            'educational': { name: 'Образовательные постройки', icon: 'fa-graduation-cap', buildings: [] },
            'military_infantry': { name: 'Производство пехотного снаряжения', icon: 'fa-person-rifle', buildings: [] },
            'military_vehicles': { name: 'Производство военной техники', icon: 'fa-truck-monster', buildings: [] },
            'military_naval': { name: 'Верфи и кораблестроение', icon: 'fa-ship', buildings: [] }
        };
        
        buildingTypes.forEach(type => {
            if (type.available && categories[type.building_category]) {
                categories[type.building_category].buildings.push(type);
            }
        });
        
        let html = '<h3 style="margin-bottom: 20px;">Выберите тип здания</h3>';
        
        for (const [categoryKey, category] of Object.entries(categories)) {
            if (category.buildings.length === 0) continue;
            
            html += `
                <div class="building-category">
                    <div class="category-header">
                        <i class="fas ${category.icon}"></i>
                        <h4>${category.name}</h4>
                    </div>
                    <div class="building-types-grid">
            `;
            
            category.buildings.forEach(type => {
                const price = formatPrice(type.base_cost);
                const maintenance = formatPrice(type.maintenance_cost);
                const effectText = getEffectText(type.effect_type, type.effect_value);
                
                html += `
                    <div class="building-type-card">
                        <h4><i class="fas ${category.icon}"></i> ${type.name}</h4>
                        <p>${type.description}</p>
                        <div class="building-type-stats">
                            <div class="stat-row">
                                <i class="fas fa-coins"></i>
                                <span>Стоимость: ${price}</span>
                            </div>
                            <div class="stat-row">
                                <i class="fas fa-hand-holding-usd"></i>
                                <span>Содержание: ${maintenance}/ход</span>
                            </div>
                            ${effectText ? `
                                <div class="stat-row">
                                    <i class="fas fa-chart-line"></i>
                                    <span>${effectText}</span>
                                </div>
                            ` : ''}
                        </div>
                        <button class="btn-primary" onclick="provincesModule.buildBuilding(${provinceId}, ${type.id})">
                            <i class="fas fa-hammer"></i> Построить
                        </button>
                    </div>
                `;
            });
            
            html += '</div></div>';
        }
        
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
                await showSuccess('Успех', 'Здание успешно построено');
                closeModal();
                await loadData();
            } else {
                showError('Ошибка', data.error);
            }
        } catch (error) {
            showError('Ошибка', error.message);
        }
    }

    function showAddProvinceModal() {
        const modal = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalFooter = document.getElementById('modal-footer');
        
        modalTitle.innerHTML = '<i class="fas fa-plus"></i> Добавить провинцию';
        modalBody.innerHTML = `
            <div class="form-group">
                <label><i class="fas fa-map-marker-alt"></i> Название провинции</label>
                <input type="text" id="province-name" class="modal-input" placeholder="Например: Центральная область">
            </div>
            <div class="form-group">
                <label><i class="fas fa-city"></i> Город</label>
                <input type="text" id="province-city" class="modal-input" placeholder="Например: Столичный град">
            </div>
            <div class="form-group">
                <label><i class="fas fa-th"></i> Квадрат</label>
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
            showError('Ошибка', 'Все поля обязательны для заполнения');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const url = provinceId ? `/api/provinces/${provinceId}` : '/api/provinces/';
            const method = provinceId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    country_id: currentCountryId,
                    name: name,
                    city_name: cityName,
                    square: square
                })
            });
            
            const data = await response.json();
            if (data.success) {
                await showSuccess('Успех', provinceId ? 'Провинция обновлена' : 'Провинция создана');
                closeModal();
                await loadData();
            } else {
                showError('Ошибка', data.error);
            }
        } catch (error) {
            showError('Ошибка', error.message);
        }
    }

    function editProvince(provinceId) {
        const province = provinces.find(p => p.id === provinceId);
        if (!province) return;
        
        const modal = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalFooter = document.getElementById('modal-footer');
        
        modalTitle.innerHTML = '<i class="fas fa-edit"></i> Редактировать провинцию';
        modalBody.innerHTML = `
            <div class="form-group">
                <label><i class="fas fa-map-marker-alt"></i> Название провинции</label>
                <input type="text" id="province-name" class="modal-input" value="${province.name}">
            </div>
            <div class="form-group">
                <label><i class="fas fa-city"></i> Город</label>
                <input type="text" id="province-city" class="modal-input" value="${province.city_name}">
            </div>
            <div class="form-group">
                <label><i class="fas fa-th"></i> Квадрат</label>
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
        
        if (!confirm(`Вы уверены, что хотите удалить провинцию "${province.name}"? Все постройки будут удалены.`)) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/provinces/${provinceId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            if (data.success) {
                await showSuccess('Успех', 'Провинция удалена');
                await loadData();
            } else {
                showError('Ошибка', data.error);
            }
        } catch (error) {
            showError('Ошибка', error.message);
        }
    }

    async function selectCountry(countryId, countryName) {
        currentCountryId = countryId;
        currentCountryName = countryName;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/economic/country/${countryId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            if (data.success && data.country) {
                currencyCode = data.country.main_currency || 'ESC';
            }
        } catch (error) {
            console.error('Ошибка загрузки валюты:', error);
        }
        
        await loadData();
    }

    async function ensureDataLoaded() {
        if (!currentCountryId) {
            if (isAdminView) {
                if (window.showCountrySelectionModal) {
                    window.showCountrySelectionModal('provinces');
                }
            }
            return;
        }
        
        if (provinces.length === 0 && buildingTypes.length === 0) {
            await loadData();
        } else {
            render();
        }
    }

    function showSuccess(title, message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('modal-overlay');
            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');
            const modalFooter = document.getElementById('modal-footer');
            
            modal.className = 'modal-overlay visible modal-success';
            modalTitle.innerHTML = `<i class="fas fa-check-circle"></i> ${title}`;
            modalBody.innerHTML = `<p style="text-align: center;">${message}</p>`;
            modalFooter.innerHTML = '<button class="btn-primary" onclick="closeModal()">OK</button>';
            
            setTimeout(() => {
                closeModal();
                resolve();
            }, 2000);
        });
    }

    function showError(title, message) {
        const modal = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalFooter = document.getElementById('modal-footer');
        
        modal.className = 'modal-overlay visible modal-error';
        modalTitle.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${title}`;
        modalBody.innerHTML = `<p style="text-align: center; color: var(--error);">${message}</p>`;
        modalFooter.innerHTML = '<button class="btn-secondary" onclick="closeModal()">Закрыть</button>';
    }

    return {
        init,
        ensureDataLoaded,
        selectCountry,
        showBuildings,
        showBuildMenu,
        buildBuilding,
        showAddProvinceModal,
        saveProvince,
        editProvince,
        deleteProvince
    };
})();

window.provincesModule = provincesModule;
