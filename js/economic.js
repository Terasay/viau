const economicModule = (function() {
    let countryId = null;
    let countryName = '';
    let availableCurrencies = {};
    let availableResources = {};
    let availableMilitaryEquipment = {};
    let countryData = null;
    let balanceData = null;
    let taxSettings = {};
    let incomeSettings = {};
    let militaryEquipment = {};

    async function init(playerCountryId, playerCountryName = '') {
        console.log('economicModule.init вызван с параметрами:', { playerCountryId, playerCountryName });
        
        // Если параметры переданы, используем их
        if (playerCountryId) {
            countryId = playerCountryId;
            countryName = playerCountryName;
        } else {
            // Проверяем сохраненную страну для экономики
            const savedEconCountry = localStorage.getItem('econViewingCountryId');
            const savedEconCountryName = localStorage.getItem('econViewingCountryName');
            
            // Если админ и есть сохраненная страна, используем её
            const user = window.gameState?.getUser();
            if (user && (user.role === 'admin' || user.role === 'moderator') && savedEconCountry) {
                countryId = savedEconCountry;
                countryName = savedEconCountryName || '';
                console.log('Восстановлена сохраненная страна для экономики:', savedEconCountry);
            }
        }
        
        if (!countryId) {
            console.error('Не удалось определить ID страны');
            return;
        }
        
        await loadAvailableData();
        await loadCountryResources();
        await loadMilitaryEquipment();
        await loadBalanceData();
        await loadTaxSettings();
        await loadIncomeSettings();
        renderEconomyView();
    }

    async function loadAvailableData() {
        try {
            const [currResponse, resResponse, equipResponse] = await Promise.all([
                fetch('/api/economic/available-currencies'),
                fetch('/api/economic/available-resources'),
                fetch('/api/economic/available-military-equipment')
            ]);
            
            const currData = await currResponse.json();
            const resData = await resResponse.json();
            const equipData = await equipResponse.json();
            
            console.log('Available currencies loaded:', currData);
            console.log('Available resources loaded:', resData);
            console.log('Available military equipment loaded:', equipData);
            
            if (currData.success) availableCurrencies = currData.currencies;
            if (resData.success) availableResources = resData.resources;
            if (equipData.success) availableMilitaryEquipment = equipData.equipment;
            
            console.log('Currencies object:', availableCurrencies);
            console.log('Resources object:', availableResources);
            console.log('Military equipment object:', availableMilitaryEquipment);
        } catch (e) {
            console.error('Ошибка загрузки валют/ресурсов/снаряжения:', e);
        }
    }

    async function loadCountryResources() {
        try {
            const token = localStorage.getItem('token');
            console.log('Loading resources for country:', countryId);
            const response = await fetch(`/api/economic/country/${countryId}/resources`, {
                headers: { 'Authorization': token }
            });
            const data = await response.json();
            
            console.log('Country resources response:', data);
            
            if (data.success) {
                countryData = data;
            } else {
                console.error('Failed to load resources:', data.error);
            }
        } catch (e) {
            console.error('Ошибка загрузки ресурсов:', e);
        }
    }

    async function loadMilitaryEquipment() {
        try {
            const token = localStorage.getItem('token');
            console.log('Loading military equipment for country:', countryId);
            const response = await fetch(`/api/economic/country/${countryId}/military-equipment`, {
                headers: { 'Authorization': token }
            });
            const data = await response.json();
            
            console.log('Military equipment response:', data);
            
            if (data.success) {
                militaryEquipment = data.equipment;
            } else {
                console.error('Failed to load military equipment:', data.error);
            }
        } catch (e) {
            console.error('Ошибка загрузки военного снаряжения:', e);
        }
    }

    async function loadBalanceData() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/economic/country/${countryId}/balance-forecast`, {
                headers: { 'Authorization': token }
            });
            const data = await response.json();
            
            if (data.success) {
                balanceData = data;
            } else {
                console.error('Ошибка загрузки баланса:', data.message);
            }
        } catch (e) {
            console.error('Ошибка загрузки баланса:', e);
        }
    }

    async function loadTaxSettings() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/economic/country/${countryId}/tax-settings`, {
                headers: { 'Authorization': token }
            });
            const data = await response.json();
            
            if (data.success) {
                taxSettings = data.tax_settings;
                console.log('Tax settings loaded:', taxSettings);
            } else {
                console.error('Ошибка загрузки налоговых настроек:', data.message);
            }
        } catch (e) {
            console.error('Ошибка загрузки налоговых настроек:', e);
        }
    }

    async function loadIncomeSettings() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/economic/country/${countryId}/income-settings`, {
                headers: { 'Authorization': token }
            });
            const data = await response.json();
            
            if (data.success) {
                incomeSettings = data.income_settings;
                console.log('Income settings loaded:', incomeSettings);
            } else {
                console.error('Ошибка загрузки настроек дохода:', data.message);
            }
        } catch (e) {
            console.error('Ошибка загрузки настроек дохода:', e);
        }
    }

    function renderEconomyView() {
        console.log('renderEconomyView вызвана', { countryData, countryId, countryName });
        const container = document.getElementById('economy-content');
        if (!container) {
            console.error('Контейнер #economy-content не найден!');
            return;
        }

        if (!countryData) {
            console.log('countryData не загружены, показываем загрузку');
            container.innerHTML = '<div class="loading-msg">Загрузка данных...</div>';
            return;
        }

        console.log('Рендеринг экономики для страны:', countryData);
        const mainCurrencyInfo = availableCurrencies[countryData.main_currency];
        const mainCurrencyName = mainCurrencyInfo ? mainCurrencyInfo.name : countryData.main_currency;

        console.log('countryData.currencies:', countryData.currencies);
        console.log('countryData.resources:', countryData.resources);

        const headerTitle = countryName 
            ? `Экономика страны: ${countryName}` 
            : 'Экономика страны';
        
        const user = window.gameState?.getUser();
        const isAdmin = user && (user.role === 'admin' || user.role === 'moderator');

        let html = `
            <div class="economy-header">
                <div class="economy-header-left">
                    <h2><i class="fas fa-chart-line"></i> ${headerTitle}</h2>
                    ${isAdmin ? `<button class="btn-change-country" onclick="economicModule.changeCountry()" title="Сменить страну">
                        <i class="fas fa-exchange-alt"></i> Сменить страну
                    </button>` : ''}
                </div>
                <div class="main-currency-display">
                    <i class="fas fa-coins"></i>
                    <span>Основная валюта: <strong>${mainCurrencyName}</strong></span>
                </div>
            </div>
            <!-- Баланс и прогноз -->
            <div class="balance-section">
                <div class="balance-card">
                    <div class="balance-header">
                        <i class="fas fa-wallet"></i>
                        <h3>Текущий баланс</h3>
                    </div>
                    <div class="balance-value">
                        ${(balanceData?.balance || 0).toFixed(2)} <span class="currency-label">${balanceData?.currency || mainCurrencyName}</span>
                    </div>
                    <div class="balance-forecast ${(balanceData?.forecast?.net_change || 0) >= 0 ? 'positive' : 'negative'}">
                        <i class="fas ${(balanceData?.forecast?.net_change || 0) >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                        <span>Прогноз: ${(balanceData?.forecast?.net_change || 0) > 0 ? '+' : ''}${(balanceData?.forecast?.net_change || 0).toFixed(2)}</span>
                    </div>
                </div>

                <div class="forecast-breakdown">
                    <div class="forecast-item income">
                        <i class="fas fa-arrow-down"></i>
                        <div>
                            <span class="forecast-label">Доходы</span>
                            <span class="forecast-value">+${(balanceData?.forecast?.income || 0).toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="forecast-item expenses">
                        <i class="fas fa-arrow-up"></i>
                        <div>
                            <span class="forecast-label">Расходы</span>
                            <span class="forecast-value">-${(balanceData?.forecast?.expenses || 0).toFixed(2)}</span>
                        </div>
                    </div>
                    ${balanceData?.forecast?.expenses_breakdown?.buildings_count > 0 ? `
                        <div class="forecast-item buildings">
                            <i class="fas fa-industry"></i>
                            <div>
                                <span class="forecast-label">Содержание зданий (${balanceData.forecast.expenses_breakdown.buildings_count} шт.)</span>
                                <span class="forecast-value">-${(balanceData.forecast.expenses_breakdown.buildings_maintenance || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Налоги -->
            <div class="economy-section">
                <div class="section-header">
                    <i class="fas fa-percent"></i>
                    <h3>Налоговые ставки</h3>
                </div>
                <div class="tax-settings-grid">
                    ${['Элита', 'Высший класс', 'Средний класс', 'Низший класс'].map(layer => {
                        const taxRate = taxSettings[layer] !== undefined ? taxSettings[layer] : 0;
                        const avgIncome = incomeSettings[layer] !== undefined ? incomeSettings[layer] : '';
                        const taxBreakdown = balanceData?.forecast?.tax_breakdown?.[layer];
                        return `
                            <div class="tax-item">
                                <div class="tax-item-content">
                                    <div class="tax-layer-name">
                                        <i class="fas fa-users"></i>
                                        ${layer}
                                    </div>
                                    ${isAdmin ? `
                                        <div class="tax-info-display">
                                            <div class="tax-info-item">
                                                <span class="tax-info-label">Заработок:</span>
                                                <span class="tax-info-value">
                                                    <input type="number" 
                                                           class="income-input-inline" 
                                                           id="income-${layer}" 
                                                           value="${avgIncome}" 
                                                           min="0" 
                                                           step="0.1">
                                                    <span style="margin-left: 4px;">${balanceData?.currency || 'монет'}</span>
                                                </span>
                                            </div>
                                        </div>
                                    ` : `
                                        <div class="tax-info-display">
                                            <div class="tax-info-item">
                                                <span class="tax-info-label">Заработок:</span>
                                                <span class="tax-info-value">${avgIncome !== '' ? avgIncome + ' ' + (balanceData?.currency || 'монет') : '—'}</span>
                                            </div>
                                        </div>
                                    `}
                                    ${taxBreakdown ? `
                                        <div class="tax-income-info">
                                            <span class="tax-population">${taxBreakdown.population.toLocaleString('ru-RU')} чел.</span>
                                            <span class="tax-income">+${taxBreakdown.income.toFixed(2)} ${balanceData.currency}</span>
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="tax-slider-container">
                                    <label class="tax-slider-label">Налоговая ставка:</label>
                                    <div class="tax-slider-wrapper">
                                        <input type="range" 
                                               class="tax-slider" 
                                               id="tax-${layer}" 
                                               min="0" 
                                               max="50" 
                                               step="0.5" 
                                               value="${taxRate}"
                                               oninput="economicModule.updateTaxDisplay('${layer}', this.value)">
                                        <div class="tax-slider-track">
                                            <div class="tax-slider-progress" id="progress-${layer}" style="width: ${(taxRate / 50) * 100}%"></div>
                                        </div>
                                    </div>
                                    <div class="tax-slider-value" id="value-${layer}">${taxRate}%</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                    <div class="tax-item marginals">
                        <div class="tax-layer-name">
                            <i class="fas fa-users-slash"></i>
                            Маргиналы
                        </div>
                        <div class="tax-exempt">
                            <i class="fas fa-ban"></i>
                            <span>Не платят налоги</span>
                        </div>
                    </div>
                    <button class="btn-save-taxes" onclick="economicModule.saveSettings()">
                        <i class="fas fa-save"></i> ${isAdmin ? 'Сохранить все настройки' : 'Сохранить налоги'}
                    </button>
                </div>
            </div>
            <div class="economy-grid">
                <div class="economy-section">
                    <div class="section-header">
                        <i class="fas fa-money-bill-wave"></i>
                        <h3>Валюты</h3>
                    </div>
                    <div class="resources-list">
        `;

        // Проверяем, что availableCurrencies - это объект и не пустой
        if (availableCurrencies && typeof availableCurrencies === 'object' && Object.keys(availableCurrencies).length > 0) {
            for (const [code, info] of Object.entries(availableCurrencies)) {
                const amount = countryData.currencies[code] || 0;
                const isMain = code === countryData.main_currency;
                html += `
                    <div class="resource-item ${isMain ? 'main-currency' : ''}">
                        <div class="resource-icon">
                            <i class="fas fa-coins"></i>
                        </div>
                        <div class="resource-info">
                            <div class="resource-name">
                                ${info.name}
                                ${isMain ? '<span class="badge-main">Основная</span>' : ''}
                            </div>
                            <div class="resource-code">${code}</div>
                        </div>
                        <div class="resource-amount">${amount.toLocaleString('ru-RU')}</div>
                    </div>
                `;
            }
        } else {
            console.error('availableCurrencies пуст или не является объектом:', availableCurrencies);
            html += '<div class="loading-msg">Нет доступных валют</div>';
        }

        html += `
                    </div>
                </div>

                <div class="economy-section">
                    <div class="section-header">
                        <i class="fas fa-box"></i>
                        <h3>Ресурсы</h3>
                    </div>
                    <div class="resources-list">
        `;

        const resourceIcons = {
            'gold': 'fa-solid fa-warehouse',
            'silver': 'fa-solid fa-warehouse',
            'bronze': 'fa-solid fa-warehouse',
            'iron': 'fa-solid fa-warehouse',
            'wood': 'fa-solid fa-warehouse',
            'crystal': 'fa-solid fa-warehouse',
            'tin': 'fa-solid fa-warehouse',
            'cuprum': 'fa-solid fa-warehouse',
            'oil': 'fa-solid fa-warehouse',
            'coal': 'fa-solid fa-warehouse'
        };

        // Проверяем, что availableResources - это объект и не пустой
        if (availableResources && typeof availableResources === 'object' && Object.keys(availableResources).length > 0) {
            for (const [code, info] of Object.entries(availableResources)) {
                const amount = countryData.resources[code] || 0;
                const icon = resourceIcons[code] || 'fa-cube';
                html += `
                    <div class="resource-item">
                        <div class="resource-icon">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="resource-info">
                            <div class="resource-name">${info.name}</div>
                            <div class="resource-code">${code}</div>
                        </div>
                        <div class="resource-amount">${amount.toLocaleString('ru-RU')}</div>
                    </div>
                `;
            }
        } else {
            console.error('availableResources пуст или не является объектом:', availableResources);
            html += '<div class="loading-msg">Нет доступных ресурсов</div>';
        }

        html += `
                    </div>
                </div>
            </div>

            <!-- Военный склад -->
            <div class="economy-section military-warehouse-section">
                <div class="section-header">
                    <i class="fas fa-shield-alt"></i>
                    <h3>Военный склад</h3>
                </div>
                <div class="military-categories">
        `;

        // Категории снаряжения
        const categories = {
            'infantry': {
                name: 'Пехотное вооружение',
                icon: 'fa-user-shield',
                items: ['arquebuses', 'light_muskets', 'muskets', 'rifles', 'needle_rifles', 'bolt_action_rifles']
            },
            'vehicles': {
                name: 'Артиллерия и техника',
                icon: 'fa-truck-monster',
                items: ['field_artillery', 'siege_artillery', 'heavy_artillery', 'light_tanks', 'medium_tanks', 'heavy_tanks', 'fighters', 'bombers', 'transport_vehicles', 'armored_vehicles']
            },
            'naval': {
                name: 'Военно-морской флот',
                icon: 'fa-anchor',
                items: ['galleons', 'ships_of_line', 'steam_frigates', 'ironclads', 'pre_dreadnoughts', 'dreadnoughts', 'destroyers', 'cruisers', 'submarines']
            }
        };

        // Отображаем категории
        if (availableMilitaryEquipment && typeof availableMilitaryEquipment === 'object' && Object.keys(availableMilitaryEquipment).length > 0) {
            for (const [categoryId, category] of Object.entries(categories)) {
                let totalInCategory = 0;
                let hasVisibleItems = false;
                
                // Подсчитываем общее количество и проверяем видимость
                for (const itemCode of category.items) {
                    const equipData = militaryEquipment[itemCode];
                    if (equipData) {
                        totalInCategory += equipData.amount || 0;
                        if (equipData.ever_had > 0) {
                            hasVisibleItems = true;
                        }
                    }
                }
                
                // Если админ или есть видимые элементы, показываем категорию
                if (isAdmin || hasVisibleItems) {
                    html += `
                        <div class="military-category">
                            <div class="category-header" onclick="economicModule.toggleCategory('${categoryId}')">
                                <div class="category-title">
                                    <i class="fas ${category.icon}"></i>
                                    <span>${category.name}</span>
                                </div>
                                ${totalInCategory > 0 ? `<div class="category-total">Всего: ${totalInCategory}</div>` : ''}
                                <div class="category-arrow" id="arrow-${categoryId}">
                                    <i class="fas fa-chevron-down"></i>
                                </div>
                            </div>
                            <div class="category-content" id="category-${categoryId}">
                                <div class="category-items">
                    `;
                    
                    // Отображаем элементы категории
                    for (const itemCode of category.items) {
                        const itemData = availableMilitaryEquipment[itemCode];
                        if (!itemData) continue;
                        
                        const equipData = militaryEquipment[itemCode];
                        const amount = equipData?.amount || 0;
                        const everHad = equipData?.ever_had || 0;
                        
                        // Показываем админу все, игрокам - только с ever_had > 0
                        if (isAdmin || everHad > 0) {
                            const isHidden = everHad === 0;
                            const { name, icon, price, batch_size, resources, required_tech_name } = itemData;
                            
                            // Формируем строку с ресурсами
                            let resourcesStr = '';
                            if (resources && Object.keys(resources).length > 0) {
                                const resourceParts = [];
                                for (const [resCode, resAmount] of Object.entries(resources)) {
                                    const resInfo = availableResources[resCode];
                                    const resName = resInfo ? resInfo.name : resCode;
                                    resourceParts.push(`${resName}: ${resAmount}`);
                                }
                                resourcesStr = ` • Ресурсы (на ${batch_size} ед.): ${resourceParts.join(', ')}`;
                            }
                            
                            // Добавляем информацию о требуемой технологии
                            const techStr = required_tech_name ? ` • Технология: ${required_tech_name}` : '';
                            
                            html += `
                                <div class="military-item ${isHidden ? 'item-hidden' : ''}">
                                    <div class="military-item-icon">
                                        <i class="fas ${icon}"></i>
                                    </div>
                                    <div class="military-item-info">
                                        <div class="military-item-name">
                                            ${name}
                                            ${isHidden && isAdmin ? '<span class="item-hidden-badge"><i class="fas fa-eye-slash"></i> Скрыто от игрока</span>' : ''}
                                        </div>
                                        <div class="military-item-code">
                                            ${itemCode} • ${price}/ед.${resourcesStr}${techStr}
                                        </div>
                                    </div>
                                    ${isAdmin ? `
                                        <input 
                                            type="number" 
                                            class="military-item-input" 
                                            id="equip-${itemCode}" 
                                            value="${amount}" 
                                            min="0"
                                            placeholder="0"
                                        />
                                    ` : `
                                        <div class="military-item-amount">${amount}</div>
                                    `}
                                </div>
                            `;
                        }
                    }
                    
                    html += `
                                </div>
                            </div>
                        </div>
                    `;
                }
            }
        } else {
            html += '<p style="color: var(--text-tertiary); text-align: center; padding: 20px;">Нет доступного снаряжения</p>';
        }

        html += `
                </div>
                ${isAdmin ? `
                    <button class="btn-save-military" onclick="economicModule.saveMilitaryEquipment()">
                        <i class="fas fa-save"></i> Сохранить военный склад
                    </button>
                ` : ''}
            </div>

            <div class="economy-footer">
                <button class="btn-refresh" onclick="economicModule.refresh()">
                    <i class="fas fa-sync-alt"></i> Обновить данные
                </button>
            </div>
        `;

        container.innerHTML = html;
    }

    async function refresh() {
        await loadCountryResources();
        await loadMilitaryEquipment();
        await loadBalanceData();
        await loadTaxSettings();
        await loadIncomeSettings();
        renderEconomyView();
    }
    
    async function changeCountry() {
        // Показываем модальное окно выбора страны
        if (window.showCountrySelectionModal) {
            await window.showCountrySelectionModal('economy');
        }
    }
    
    async function selectCountry(selectedCountryId, selectedCountryName) {
        console.log('economicModule.selectCountry вызвана:', { selectedCountryId, selectedCountryName });
        countryId = selectedCountryId;
        countryName = selectedCountryName;
        
        // Сохраняем выбор в localStorage
        localStorage.setItem('econViewingCountryId', selectedCountryId);
        localStorage.setItem('econViewingCountryName', selectedCountryName);
        
        // Перезагружаем данные
        await loadMilitaryEquipment();
        await loadCountryResources();
        await loadBalanceData();
        await loadTaxSettings();
        await loadIncomeSettings();
        renderEconomyView();
    }

    async function saveSettings() {
        const user = window.gameState?.getUser();
        const isAdmin = user && (user.role === 'admin' || user.role === 'moderator');
        
        const newTaxSettings = {};
        const newIncomeSettings = {};
        const layers = ['Элита', 'Высший класс', 'Средний класс', 'Низший класс'];
        
        for (const layer of layers) {
            const taxInput = document.getElementById(`tax-${layer}`);
            const incomeInput = document.getElementById(`income-${layer}`);
            
            if (taxInput) {
                newTaxSettings[layer] = parseFloat(taxInput.value) || 0;
            }
            // Только админ может изменять заработок
            if (incomeInput && isAdmin) {
                newIncomeSettings[layer] = parseFloat(incomeInput.value) || 0;
            }
        }

        try {
            const token = localStorage.getItem('token');
            
            // Сохраняем налоговые ставки
            const taxResponse = await fetch(`/api/economic/country/${countryId}/tax-settings`, {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tax_settings: newTaxSettings })
            });

            const taxData = await taxResponse.json();
            
            if (!taxData.success) {
                throw new Error(taxData.error || 'Ошибка сохранения налоговых ставок');
            }
            
            // Сохраняем настройки дохода (только для админа)
            if (isAdmin) {
                const incomeResponse = await fetch(`/api/economic/country/${countryId}/income-settings`, {
                    method: 'POST',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ income_settings: newIncomeSettings })
                });

                const incomeData = await incomeResponse.json();
                
                if (!incomeData.success) {
                    throw new Error(incomeData.error || 'Ошибка сохранения настроек дохода');
                }
            }
            
            window.showSuccess('Успех', isAdmin ? 'Все настройки успешно обновлены' : 'Налоги успешно обновлены');
            await refresh();
            
        } catch (e) {
            console.error('Ошибка сохранения настроек:', e);
            window.showError('Ошибка', e.message || 'Не удалось сохранить настройки');
        }
    }

    function updateTaxDisplay(layer, value) {
        const valueElement = document.getElementById(`value-${layer}`);
        const progressElement = document.getElementById(`progress-${layer}`);
        if (valueElement) {
            valueElement.textContent = `${parseFloat(value).toFixed(1)}%`;
        }
        if (progressElement) {
            progressElement.style.width = `${(value / 50) * 100}%`;
        }
    }

    function toggleCategory(categoryId) {
        const content = document.getElementById(`category-${categoryId}`);
        const arrow = document.getElementById(`arrow-${categoryId}`);
        
        if (!content || !arrow) return;
        
        const isOpen = content.classList.contains('open');
        
        if (isOpen) {
            // Закрываем
            content.classList.remove('open');
            arrow.classList.remove('rotate');
        } else {
            // Открываем
            content.classList.add('open');
            arrow.classList.add('rotate');
        }
    }

    async function saveMilitaryEquipment() {
        const user = window.gameState?.getUser();
        if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
            alert('Требуются права администратора');
            return;
        }

        // Собираем все значения из input полей
        const updates = {};
        const inputs = document.querySelectorAll('.military-item-input');
        
        for (const input of inputs) {
            const equipCode = input.id.replace('equip-', '');
            const newAmount = parseInt(input.value) || 0;
            const oldAmount = militaryEquipment[equipCode]?.amount || 0;
            
            // Сохраняем только изменённые значения
            if (newAmount !== oldAmount) {
                updates[equipCode] = newAmount;
            }
        }

        if (Object.keys(updates).length === 0) {
            alert('Нет изменений для сохранения');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            
            // Отправляем каждое обновление
            for (const [equipCode, amount] of Object.entries(updates)) {
                const response = await fetch(`/api/economic/country/${countryId}/update-military-equipment`, {
                    method: 'POST',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        equipment_code: equipCode,
                        amount: amount
                    })
                });

                const data = await response.json();
                if (!data.success) {
                    throw new Error(`Ошибка обновления ${equipCode}: ${data.error}`);
                }
            }

            alert(`Военный склад успешно обновлён (${Object.keys(updates).length} изменений)`);
            await refresh();
        } catch (e) {
            console.error('Ошибка сохранения военного снаряжения:', e);
            alert('Ошибка сохранения: ' + e.message);
        }
    }

    return {
        init,
        refresh,
        changeCountry,
        selectCountry,
        saveSettings,
        updateTaxDisplay,
        toggleCategory,
        saveMilitaryEquipment,
        saveTaxSettings: saveSettings  // алиас для обратной совместимости
    };
})();

window.economicModule = economicModule;
