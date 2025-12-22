// Модуль экономики
const economicModule = (function() {
    let countryId = null;
    let countryName = '';
    let availableCurrencies = {};
    let availableResources = {};
    let countryData = null;

    async function init(playerCountryId, playerCountryName = '') {
        console.log('economicModule.init вызван с параметрами:', { playerCountryId, playerCountryName });
        countryId = playerCountryId;
        countryName = playerCountryName;
        await loadAvailableData();
        await loadCountryResources();
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
            
            if (currData.success) availableCurrencies = currData.currencies;
            if (resData.success) availableResources = resData.resources;
        } catch (e) {
            console.error('Ошибка загрузки валют/ресурсов:', e);
        }
    }

    async function loadCountryResources() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/economic/country/${countryId}/resources`, {
                headers: { 'Authorization': token }
            });
            const data = await response.json();
            
            if (data.success) {
                countryData = data;
            } else {
                console.error('Ошибка загрузки ресурсов страны:', data.message);
            }
        } catch (e) {
            console.error('Ошибка загрузки ресурсов:', e);
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

        const headerTitle = countryName 
            ? `Экономика страны: ${countryName}` 
            : 'Экономика страны';

        let html = `
            <div class="economy-header">
                <h2><i class="fas fa-chart-line"></i> ${headerTitle}</h2>
                <div class="main-currency-display">
                    <i class="fas fa-coins"></i>
                    <span>Основная валюта: <strong>${mainCurrencyName}</strong></span>
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

        // Валюты
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

        // Ресурсы
        const resourceIcons = {
            'gold': 'fa-coins',
            'silver': 'fa-ring',
            'bronze': 'fa-shield',
            'iron': 'fa-hammer',
            'wood': 'fa-tree',
            'crystal': 'fa-gem',
            'tin': 'fa-cube',
            'cuprum': 'fa-plug',
            'oil': 'fa-oil-can',
            'coal': 'fa-fire'
        };

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
        renderEconomyView();
    }

    return {
        init,
        refresh
    };
})();

// Экспортируем модуль
window.economicModule = economicModule;
