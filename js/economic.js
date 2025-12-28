const economicModule = (function() {
    let countryId = null;
    let countryName = '';
    let availableCurrencies = {};
    let availableResources = {};
    let countryData = null;

    async function init(playerCountryId, playerCountryName = '') {
        console.log('economicModule.init вызван с параметрами:', { playerCountryId, playerCountryName });
        
        // Проверяем сохраненную страну для экономики
        const savedEconCountry = localStorage.getItem('econViewingCountryId');
        const savedEconCountryName = localStorage.getItem('econViewingCountryName');
        
        // Если админ и есть сохраненная страна, используем её
        const user = window.gameState?.getUser();
        if (user && (user.role === 'admin' || user.role === 'moderator') && savedEconCountry && !playerCountryId) {
            countryId = savedEconCountry;
            countryName = savedEconCountryName || '';
            console.log('Восстановлена сохраненная страна для экономики:', savedEconCountry);
        } else {
            countryId = playerCountryId;
            countryName = playerCountryName;
        }
        
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

            <div class="economy-grid">
                <div class="economy-section">
                    <div class="section-header">
                        <i class="fas fa-money-bill-wave"></i>
                        <h3>Валюты</h3>
                    </div>
                    <div class="resources-list">
        `;

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
        renderEconomyView();
    }

    return {
        init,
        refresh,
        changeCountry,
        selectCountry
    };
})();

window.economicModule = economicModule;
