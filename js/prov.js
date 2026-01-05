// Модуль управления провинциями
const provincesModule = (() => {
    let currentCountryId = null;
    let currentCountryName = null;
    let provinces = [];
    let buildingTypes = [];
    let currentProvince = null;
    let dataLoaded = false;

    // Инициализация модуля
    async function init(countryId, countryName) {
        currentCountryId = countryId;
        currentCountryName = countryName;
        dataLoaded = false;
        await loadData();
        render();
    }

    // Загрузка всех данных
    async function loadData() {
        if (dataLoaded && currentCountryId) return;
        
        const token = localStorage.getItem('token');
        
        try {
            // Загружаем провинции и типы построек параллельно
            const [provincesResponse, buildingTypesResponse] = await Promise.all([
                fetch(`/api/provinces/country/${currentCountryId}`, {
                    headers: { 'Authorization': token }
                }),
                fetch(`/api/provinces/building-types?country_id=${currentCountryId}`, {
                    headers: { 'Authorization': token }
                })
            ]);

            const provincesData = await provincesResponse.json();
            const buildingTypesData = await buildingTypesResponse.json();

            if (provincesData.success) {
                provinces = provincesData.provinces;
            }

            if (buildingTypesData.success) {
                buildingTypes = buildingTypesData.building_types;
            }

            dataLoaded = true;
        } catch (error) {
            console.error('Ошибка загрузки данных провинций:', error);
            showError('Не удалось загрузить данные провинций');
        }
    }

    // Основной рендер интерфейса
    function render() {
        const container = document.getElementById('provinces-content');
        if (!container) return;

        const user = window.gameState?.getUser();
        const isAdmin = user?.role === 'admin';

        let html = `
            <div class="provinces-header">
                <div class="provinces-title">
                    <i class="fas fa-city"></i>
                    <h2>Провинции страны: ${currentCountryName || 'Загрузка...'}</h2>
                </div>
                ${isAdmin ? `
                    <button class="btn-primary" onclick="provincesModule.openCreateProvinceModal()">
                        <i class="fas fa-plus"></i>
                        <span>Создать провинцию</span>
                    </button>
                ` : ''}
            </div>
        `;

        if (provinces.length === 0) {
            html += `
                <div class="provinces-empty">
                    <i class="fas fa-city"></i>
                    <h3>Провинции отсутствуют</h3>
                    <p>В этой стране пока нет зарегистрированных провинций</p>
                    ${isAdmin ? '<p class="hint">Создайте первую провинцию, чтобы начать</p>' : ''}
                </div>
            `;
        } else {
            html += '<div class="provinces-grid">';
            
            provinces.forEach(province => {
                html += `
                    <div class="province-card" onclick="provincesModule.openProvinceModal('${province.id}')">
                        <div class="province-card-header">
                            <div class="province-card-icon">
                                <i class="fas fa-city"></i>
                            </div>
                            <div class="province-card-info">
                                <h3>${province.name}</h3>
                                <p class="province-city">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>${province.city_name}</span>
                                </p>
                            </div>
                        </div>
                        <div class="province-card-body">
                            <div class="province-stat">
                                <i class="fas fa-expand"></i>
                                <span class="stat-label">Площадь:</span>
                                <span class="stat-value">${province.square}</span>
                            </div>
                        </div>
                        <div class="province-card-footer">
                            <button class="btn-view">
                                <span>Подробнее</span>
                                <i class="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }

        container.innerHTML = html;
    }

    // Открытие модального окна провинции
    async function openProvinceModal(provinceId) {
        const province = provinces.find(p => p.id === parseInt(provinceId));
        if (!province) return;

        currentProvince = province;

        const modal = document.getElementById('modal-overlay');
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const modalFooter = document.getElementById('modal-footer');
        const modalContainer = document.getElementById('modal-container');

        modalContainer.style.maxWidth = '1400px';
        modalContainer.style.width = '95%';

        modalTitle.innerHTML = `
            <i class="fas fa-city"></i>
            <span>Провинция: ${province.name}</span>
        `;

        modalBody.innerHTML = `
            <div class="province-modal-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Загрузка данных провинции...</p>
            </div>
        `;

        const user = window.gameState?.getUser();
        const isAdmin = user?.role === 'admin';

        modalFooter.innerHTML = `
            ${isAdmin ? `
                <button class="btn-secondary" onclick="provincesModule.openEditProvinceModal('${provinceId}')">
                    <i class="fas fa-edit"></i>
                    <span>Редактировать</span>
                </button>
                <button class="btn-danger" onclick="provincesModule.deleteProvince('${provinceId}')">
                    <i class="fas fa-trash"></i>
                    <span>Удалить</span>
                </button>
            ` : ''}
            <button class="btn-secondary" onclick="closeModal()">
                <span>Закрыть</span>
            </button>
        `;

        modal.classList.add('visible');

        // Загружаем постройки провинции
        await loadProvinceBuildings(provinceId);
    }

    // Загрузка построек провинции
    async function loadProvinceBuildings(provinceId) {
        const token = localStorage.getItem('token');
        const modalBody = document.getElementById('modal-body');

        try {
            const response = await fetch(`/api/provinces/${provinceId}/buildings`, {
                headers: { 'Authorization': token }
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Ошибка загрузки построек');
            }

            renderProvinceDetails(currentProvince, data.buildings);

        } catch (error) {
            console.error('Ошибка загрузки построек:', error);
            modalBody.innerHTML = `
                <div class="province-modal-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Не удалось загрузить данные провинции</p>
                    <p class="error-detail">${error.message}</p>
                </div>
            `;
        }
    }

    // Рендер деталей провинции
    function renderProvinceDetails(province, buildings) {
        const modalBody = document.getElementById('modal-body');
        const user = window.gameState?.getUser();
        const country = window.gameState?.getCountry();

        // Группируем постройки по категориям
        const buildingsByCategory = {
            educational: [],
            military_infantry: [],
            military_vehicles: [],
            military_naval: []
        };

        buildings.forEach(building => {
            const buildingType = buildingTypes.find(bt => bt.name === building.name);
            const category = buildingType?.building_category || 'educational';
            if (!buildingsByCategory[category]) {
                buildingsByCategory[category] = [];
            }
            buildingsByCategory[category].push(building);
        });

        const categoryNames = {
            educational: 'Образовательные постройки',
            military_infantry: 'Пехотное снаряжение',
            military_vehicles: 'Военная техника',
            military_naval: 'Военно-морской флот'
        };

        const categoryIcons = {
            educational: 'fa-graduation-cap',
            military_infantry: 'fa-user-shield',
            military_vehicles: 'fa-tank',
            military_naval: 'fa-ship'
        };

        let html = `
            <div class="province-details">
                <div class="province-info-section">
                    <div class="province-info-grid">
                        <div class="province-info-item">
                            <i class="fas fa-city"></i>
                            <div class="info-content">
                                <span class="info-label">Название провинции</span>
                                <span class="info-value">${province.name}</span>
                            </div>
                        </div>
                        <div class="province-info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <div class="info-content">
                                <span class="info-label">Административный центр</span>
                                <span class="info-value">${province.city_name}</span>
                            </div>
                        </div>
                        <div class="province-info-item">
                            <i class="fas fa-expand"></i>
                            <div class="info-content">
                                <span class="info-label">Площадь</span>
                                <span class="info-value">${province.square}</span>
                            </div>
                        </div>
                        <div class="province-info-item">
                            <i class="fas fa-building"></i>
                            <div class="info-content">
                                <span class="info-label">Всего построек</span>
                                <span class="info-value">${buildings.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="province-buildings-section">
                    <div class="section-header">
                        <h3>
                            <i class="fas fa-building"></i>
                            <span>Постройки провинции</span>
                        </h3>
                        <button class="btn-primary" onclick="provincesModule.openBuildModal('${province.id}')">
                            <i class="fas fa-plus"></i>
                            <span>Построить</span>
                        </button>
                    </div>

                    ${buildings.length === 0 ? `
                        <div class="buildings-empty">
                            <i class="fas fa-building"></i>
                            <p>В провинции пока нет построек</p>
                            <p class="hint">Нажмите "Построить", чтобы начать строительство</p>
                        </div>
                    ` : `
                        <div class="buildings-by-category">
                            ${Object.entries(buildingsByCategory).map(([category, categoryBuildings]) => {
                                if (categoryBuildings.length === 0) return '';
                                
                                return `
                                    <div class="building-category-section">
                                        <h4 class="category-title">
                                            <i class="fas ${categoryIcons[category]}"></i>
                                            <span>${categoryNames[category]}</span>
                                            <span class="category-count">${categoryBuildings.length}</span>
                                        </h4>
                                        <div class="buildings-grid">
                                            ${categoryBuildings.map(building => `
                                                <div class="building-item">
                                                    <div class="building-header">
                                                        <div class="building-icon">
                                                            <i class="fas fa-building"></i>
                                                        </div>
                                                        <div class="building-info">
                                                            <h5>${building.name}</h5>
                                                            <p>${building.description || ''}</p>
                                                        </div>
                                                    </div>
                                                    <div class="building-stats">
                                                        <div class="building-stat">
                                                            <i class="fas fa-layer-group"></i>
                                                            <span>Уровень ${building.level}</span>
                                                        </div>
                                                        <div class="building-stat">
                                                            <i class="fas fa-coins"></i>
                                                            <span>Содержание: ${building.maintenance_cost}</span>
                                                        </div>
                                                    </div>
                                                    <div class="building-actions">
                                                        <button class="btn-icon-small btn-danger" onclick="provincesModule.demolishBuilding('${building.id}')" title="Снести постройку">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

        modalBody.innerHTML = html;
    }

    // Открытие модального окна строительства
    function openBuildModal(provinceId) {
        const province = provinces.find(p => p.id === parseInt(provinceId));
        if (!province) return;

        const modal = document.getElementById('modal-overlay');
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const modalFooter = document.getElementById('modal-footer');

        modalTitle.innerHTML = `
            <i class="fas fa-hammer"></i>
            <span>Строительство в провинции: ${province.name}</span>
        `;

        // Группируем типы построек по категориям
        const buildingsByCategory = {
            educational: [],
            military_infantry: [],
            military_vehicles: [],
            military_naval: []
        };

        buildingTypes.forEach(bt => {
            const category = bt.building_category || 'educational';
            if (!buildingsByCategory[category]) {
                buildingsByCategory[category] = [];
            }
            buildingsByCategory[category].push(bt);
        });

        const categoryNames = {
            educational: 'Образовательные постройки',
            military_infantry: 'Пехотное снаряжение',
            military_vehicles: 'Военная техника',
            military_naval: 'Военно-морской флот'
        };

        const categoryIcons = {
            educational: 'fa-graduation-cap',
            military_infantry: 'fa-user-shield',
            military_vehicles: 'fa-tank',
            military_naval: 'fa-ship'
        };

        const country = window.gameState?.getCountry();
        const currencyCode = country?.main_currency || 'ESC';

        let html = `
            <div class="build-modal-content">
                <div class="build-categories">
                    ${Object.entries(buildingsByCategory).map(([category, buildings]) => {
                        if (buildings.length === 0) return '';
                        
                        return `
                            <div class="build-category">
                                <h4 class="build-category-title">
                                    <i class="fas ${categoryIcons[category]}"></i>
                                    <span>${categoryNames[category]}</span>
                                </h4>
                                <div class="build-options-grid">
                                    ${buildings.map(bt => {
                                        const actualCost = convertGoldToCurrency(bt.base_cost, currencyCode);
                                        const isAvailable = bt.is_available !== false;
                                        const disabledClass = isAvailable ? '' : 'disabled';
                                        
                                        return `
                                            <div class="build-option ${disabledClass}" ${isAvailable ? `onclick="provincesModule.buildBuilding('${provinceId}', '${bt.id}')"` : ''}>
                                                <div class="build-option-header">
                                                    <div class="build-option-icon">
                                                        <i class="fas fa-building"></i>
                                                    </div>
                                                    <div class="build-option-info">
                                                        <h5>${bt.name}</h5>
                                                        <p>${bt.description || ''}</p>
                                                    </div>
                                                </div>
                                                <div class="build-option-cost">
                                                    <i class="fas fa-coins"></i>
                                                    <span class="cost-value">${actualCost} ${currencyCode}</span>
                                                </div>
                                                ${!isAvailable && bt.required_tech_id ? `
                                                    <div class="build-option-locked">
                                                        <i class="fas fa-lock"></i>
                                                        <span>Требуется технология</span>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        modalBody.innerHTML = html;

        modalFooter.innerHTML = `
            <button class="btn-secondary" onclick="provincesModule.openProvinceModal('${provinceId}')">
                <i class="fas fa-arrow-left"></i>
                <span>Назад</span>
            </button>
            <button class="btn-secondary" onclick="closeModal()">
                <span>Закрыть</span>
            </button>
        `;
    }

    // Функция конвертации золота в валюту (примерная, как на бэке)
    function convertGoldToCurrency(goldAmount, currencyCode) {
        // Здесь можно получить реальный курс из converter_data.json
        // Пока используем простое умножение и округление до десятков вверх
        const rate = 1; // Заглушка, можно запросить с сервера
        const price = goldAmount * rate;
        return Math.ceil(price / 10) * 10;
    }

    // Строительство здания
    async function buildBuilding(provinceId, buildingTypeId) {
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`/api/provinces/${provinceId}/buildings`, {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ building_type_id: parseInt(buildingTypeId) })
            });

            const data = await response.json();

            if (data.success) {
                await showSuccess(data.message || 'Постройка успешно построена');
                await window.gameState.updateCountry();
                await loadData();
                await openProvinceModal(provinceId);
            } else {
                await showError(data.error || 'Не удалось построить здание');
            }
        } catch (error) {
            console.error('Ошибка строительства:', error);
            await showError('Произошла ошибка при строительстве');
        }
    }

    // Снос здания
    async function demolishBuilding(buildingId) {
        const confirmed = await showConfirm(
            'Подтверждение',
            'Вы уверены, что хотите снести это здание? Это действие необратимо.'
        );

        if (!confirmed) return;

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`/api/provinces/buildings/${buildingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': token }
            });

            const data = await response.json();

            if (data.success) {
                await showSuccess(data.message || 'Здание успешно снесено');
                await loadData();
                await openProvinceModal(currentProvince.id);
            } else {
                await showError(data.error || 'Не удалось снести здание');
            }
        } catch (error) {
            console.error('Ошибка сноса здания:', error);
            await showError('Произошла ошибка при сносе здания');
        }
    }

    // Создание провинции (админ)
    function openCreateProvinceModal() {
        const modal = document.getElementById('modal-overlay');
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const modalFooter = document.getElementById('modal-footer');

        modalTitle.innerHTML = `
            <i class="fas fa-plus"></i>
            <span>Создание новой провинции</span>
        `;

        modalBody.innerHTML = `
            <div class="province-form">
                <div class="form-group">
                    <label for="province-name">
                        <i class="fas fa-city"></i>
                        <span>Название провинции</span>
                    </label>
                    <input type="text" id="province-name" class="modal-input" placeholder="Например: Северная провинция">
                </div>
                <div class="form-group">
                    <label for="province-city">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>Административный центр</span>
                    </label>
                    <input type="text" id="province-city" class="modal-input" placeholder="Например: Город Север">
                </div>
                <div class="form-group">
                    <label for="province-square">
                        <i class="fas fa-expand"></i>
                        <span>Площадь</span>
                    </label>
                    <input type="text" id="province-square" class="modal-input" placeholder="Например: 1500 км²">
                </div>
            </div>
        `;

        modalFooter.innerHTML = `
            <button class="btn-secondary" onclick="closeModal()">
                <span>Отмена</span>
            </button>
            <button class="btn-primary" onclick="provincesModule.createProvince()">
                <i class="fas fa-check"></i>
                <span>Создать</span>
            </button>
        `;

        modal.classList.add('visible');
    }

    // Создание провинции
    async function createProvince() {
        const name = document.getElementById('province-name')?.value.trim();
        const cityName = document.getElementById('province-city')?.value.trim();
        const square = document.getElementById('province-square')?.value.trim();

        if (!name || !cityName || !square) {
            await showError('Все поля обязательны для заполнения');
            return;
        }

        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/api/provinces/', {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    country_id: currentCountryId,
                    name,
                    city_name: cityName,
                    square
                })
            });

            const data = await response.json();

            if (data.success) {
                await showSuccess(data.message || 'Провинция успешно создана');
                await loadData();
                render();
                closeModal();
            } else {
                await showError(data.error || 'Не удалось создать провинцию');
            }
        } catch (error) {
            console.error('Ошибка создания провинции:', error);
            await showError('Произошла ошибка при создании провинции');
        }
    }

    // Редактирование провинции
    function openEditProvinceModal(provinceId) {
        const province = provinces.find(p => p.id === parseInt(provinceId));
        if (!province) return;

        const modal = document.getElementById('modal-overlay');
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const modalFooter = document.getElementById('modal-footer');

        modalTitle.innerHTML = `
            <i class="fas fa-edit"></i>
            <span>Редактирование провинции</span>
        `;

        modalBody.innerHTML = `
            <div class="province-form">
                <div class="form-group">
                    <label for="edit-province-name">
                        <i class="fas fa-city"></i>
                        <span>Название провинции</span>
                    </label>
                    <input type="text" id="edit-province-name" class="modal-input" value="${province.name}">
                </div>
                <div class="form-group">
                    <label for="edit-province-city">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>Административный центр</span>
                    </label>
                    <input type="text" id="edit-province-city" class="modal-input" value="${province.city_name}">
                </div>
                <div class="form-group">
                    <label for="edit-province-square">
                        <i class="fas fa-expand"></i>
                        <span>Площадь</span>
                    </label>
                    <input type="text" id="edit-province-square" class="modal-input" value="${province.square}">
                </div>
            </div>
        `;

        modalFooter.innerHTML = `
            <button class="btn-secondary" onclick="provincesModule.openProvinceModal('${provinceId}')">
                <i class="fas fa-arrow-left"></i>
                <span>Назад</span>
            </button>
            <button class="btn-primary" onclick="provincesModule.updateProvince('${provinceId}')">
                <i class="fas fa-save"></i>
                <span>Сохранить</span>
            </button>
        `;
    }

    // Обновление провинции
    async function updateProvince(provinceId) {
        const name = document.getElementById('edit-province-name')?.value.trim();
        const cityName = document.getElementById('edit-province-city')?.value.trim();
        const square = document.getElementById('edit-province-square')?.value.trim();

        if (!name || !cityName || !square) {
            await showError('Все поля обязательны для заполнения');
            return;
        }

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`/api/provinces/${provinceId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, city_name: cityName, square })
            });

            const data = await response.json();

            if (data.success) {
                await showSuccess(data.message || 'Провинция успешно обновлена');
                await loadData();
                render();
                closeModal();
            } else {
                await showError(data.error || 'Не удалось обновить провинцию');
            }
        } catch (error) {
            console.error('Ошибка обновления провинции:', error);
            await showError('Произошла ошибка при обновлении провинции');
        }
    }

    // Удаление провинции
    async function deleteProvince(provinceId) {
        const confirmed = await showConfirm(
            'Подтверждение удаления',
            'Вы уверены, что хотите удалить эту провинцию? Все постройки в ней будут также удалены. Это действие необратимо.'
        );

        if (!confirmed) return;

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`/api/provinces/${provinceId}`, {
                method: 'DELETE',
                headers: { 'Authorization': token }
            });

            const data = await response.json();

            if (data.success) {
                await showSuccess(data.message || 'Провинция успешно удалена');
                await loadData();
                render();
                closeModal();
            } else {
                await showError(data.error || 'Не удалось удалить провинцию');
            }
        } catch (error) {
            console.error('Ошибка удаления провинции:', error);
            await showError('Произошла ошибка при удалении провинции');
        }
    }

    // Выбор страны для просмотра (админ/модер)
    function selectCountry(countryId, countryName) {
        localStorage.setItem('provViewingCountryId', countryId);
        localStorage.setItem('provViewingCountryName', countryName);
        dataLoaded = false;
        init(countryId, countryName);
    }

    // Проверка загрузки данных
    function ensureDataLoaded() {
        if (!dataLoaded || !currentCountryId) {
            const user = window.gameState?.getUser();
            const country = window.gameState?.getCountry();
            
            if (user?.role === 'admin' || user?.role === 'moderator') {
                const savedCountry = localStorage.getItem('provViewingCountryId');
                const savedCountryName = localStorage.getItem('provViewingCountryName');
                
                if (savedCountry && savedCountryName) {
                    init(savedCountry, savedCountryName);
                } else {
                    window.showCountrySelectionModal('provinces');
                }
            } else if (country) {
                init(country.id, country.country_name);
            }
        }
    }

    // Публичный API модуля
    return {
        init,
        selectCountry,
        ensureDataLoaded,
        openProvinceModal,
        openBuildModal,
        buildBuilding,
        demolishBuilding,
        openCreateProvinceModal,
        createProvince,
        openEditProvinceModal,
        updateProvince,
        deleteProvince
    };
})();

// Экспортируем модуль в глобальную область видимости
window.provincesModule = provincesModule;