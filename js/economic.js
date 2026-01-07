const economicModule = (function() {
    let countryId = null;
    let countryName = '';
    let availableCurrencies = {};
    let availableResources = {};
    let countryData = null;
    let balanceData = null;
    let taxSettings = {};
    let incomeSettings = {};

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
        await loadBalanceData();
        await loadTaxSettings();
        await loadIncomeSettings();
        renderEconomyView();
    }

    async function loadAvailableData() {
        try {
            const [currResponse, resResponse] = await Promise.all([
                fetch('/api/economic/available-currencies'),
                fetch('/api/economic/available-resources')
            ]);
            
            const currData = await currResponse.json();
            const resData = await resResponse.json();
            
            console.log('Available currencies loaded:', currData);
            console.log('Available resources loaded:', resData);
            
            if (currData.success) availableCurrencies = currData.currencies;
            if (resData.success) availableResources = resData.resources;
            
            console.log('Currencies object:', availableCurrencies);
            console.log('Resources object:', availableResources);
        } catch (e) {
            console.error('Ошибка загрузки валют/ресурсов:', e);
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
                console.log('Country data set:', countryData);
            } else {
                console.error('Ошибка загрузки ресурсов страны:', data.message);
            }
        } catch (e) {
            console.error('Ошибка загрузки ресурсов:', e);
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
                console.log('Balance data loaded:', balanceData);
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
            
            if (typeof window.showSuccess === 'function') {
                window.showSuccess('Успех', isAdmin ? 'Все настройки успешно обновлены' : 'Налоги успешно обновлены');
            } else {
                alert(isAdmin ? 'Все настройки успешно обновлены' : 'Налоги успешно обновлены');
            }
            await refresh();
            
        } catch (e) {
            console.error('Ошибка сохранения настроек:', e);
            if (typeof window.showError === 'function') {
                window.showError('Ошибка', e.message || 'Не удалось сохранить настройки');
            } else {
                alert('Ошибка: ' + (e.message || 'Не удалось сохранить настройки'));
            }
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

    return {
        init,
        refresh,
        changeCountry,
        selectCountry,
        saveSettings,
        updateTaxDisplay,
        saveTaxSettings: saveSettings  // алиас для обратной совместимости
    };
})();

window.economicModule = economicModule;
