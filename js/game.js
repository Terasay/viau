let currentUser = null;
let currentCountry = null;
let gameState = null;

window.gameState = {
    getUser: () => currentUser,
    getCountry: () => currentCountry,
    getGameState: () => gameState,
    updateCountry: (newCountry) => {
        currentCountry = newCountry;
        initInterface();
    },
    updateGameState: (newState) => {
        gameState = newState;
        updateGameStateDisplay();
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-mode');
    }
    
    await initGame();
});

async function initGame() {
    const loadingScreen = document.getElementById('loading-screen');
    const accessDenied = document.getElementById('access-denied');
    const gameContainer = document.getElementById('game-container');

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAccessDenied();
            return;
        }

        const userResponse = await fetch('/me', {
            headers: { 'Authorization': token }
        });

        if (!userResponse.ok) {
            showAccessDenied();
            return;
        }

        const userData = await userResponse.json();

        if (!userData.logged_in) {
            showAccessDenied();
            return;
        }

        currentUser = userData;

        const allowedRoles = ['player', 'moderator', 'admin'];
        if (!allowedRoles.includes(currentUser.role)) {
            showAccessDenied();
            return;
        }

        if (currentUser.role === 'player') {
            await loadCountryData();
        }

        await loadGameState();

        initInterface();
        updateGameStateDisplay();

        loadingScreen.style.display = 'none';
        gameContainer.style.display = 'flex';

    } catch (error) {
        console.error('Error initializing game:', error);
        showAccessDenied();
    }
}

function showAccessDenied() {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('access-denied').style.display = 'flex';
}

async function loadCountryData() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/economic/countries', {
            headers: { 'Authorization': token }
        });

        if (!response.ok) {
            throw new Error('Failed to load country data');
        }

        const data = await response.json();

        if (!data.success || !data.countries) {
            throw new Error('No country data available');
        }

        const userCountry = data.countries.find(c => c.player_id === currentUser.id);

        if (!userCountry) {
            alert('У вас нет зарегистрированной страны. Пожалуйста, заполните заявку.');
            window.location.href = '/registration';
            return;
        }

        currentCountry = userCountry;
        console.log('Loaded country data:', currentCountry);

    } catch (error) {
        console.error('Error loading country data:', error);
        alert('Ошибка загрузки данных страны');
        window.location.href = '/';
    }
}

function initInterface() {
    console.log('=== initInterface DEBUG ===');
    console.log('currentUser:', currentUser);
    console.log('currentCountry:', currentCountry);
    console.log('currentCountry.secret_coins:', currentCountry?.secret_coins);
    
    if (currentUser.role === 'admin' || currentUser.role === 'moderator') {
        document.getElementById('country-name').textContent = currentUser.role === 'admin' ? 'Панель администратора' : 'Панель модератора';
        document.getElementById('ruler-name').textContent = 'Управление игрой';
        document.getElementById('currency-name').textContent = '-';
        // Отображаем секретные монеты для админа/модератора
        document.getElementById('secret-coins').textContent = currentUser.secret_coins || 0;
    } else if (currentCountry) {
        document.getElementById('country-name').textContent = currentCountry.country_name;
        document.getElementById('ruler-name').textContent = 
            `${currentCountry.ruler_first_name} ${currentCountry.ruler_last_name}`;
        
        const mainCurrency = currentCountry.main_currency || currentCountry.currency || 'ESC';
        document.getElementById('currency-name').textContent = mainCurrency;
        
        // Секретные монеты берём из страны (currentCountry)
        const secretCoins = currentCountry.secret_coins !== undefined ? currentCountry.secret_coins : 0;
        document.getElementById('secret-coins').textContent = secretCoins;
        document.getElementById('overview-country').textContent = currentCountry.country_name;
        document.getElementById('overview-ruler').textContent = 
            `${currentCountry.ruler_first_name} ${currentCountry.ruler_last_name}`;
        document.getElementById('overview-currency').textContent = mainCurrency;
        document.getElementById('overview-coins').textContent = secretCoins;
    }

    document.getElementById('username').textContent = currentUser.username;

    const secretCoinsElement = document.getElementById('secret-coins');
    if (secretCoinsElement) {
        secretCoinsElement.style.cursor = 'pointer';
        secretCoinsElement.parentElement.style.cursor = 'pointer';
        secretCoinsElement.parentElement.addEventListener('click', () => {
            window.location.href = '/secret_shop';
        });
    }

    const modalCloseBtn = document.getElementById('modal-close');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }

    if (currentUser.role === 'admin' || currentUser.role === 'moderator') {
        const overviewSection = document.getElementById('overview-section');
        overviewSection.innerHTML = `
            <h2><i class="fas fa-tools"></i> Панель управления игрой</h2>
            <div class="section-grid">
                <div class="info-card">
                    <h3><i class="fas fa-user-shield"></i> Информация о роли</h3>
                    <div class="info-row">
                        <span class="info-label">Роль:</span>
                        <span class="info-value">${currentUser.role === 'admin' ? 'Администратор' : 'Модератор'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Пользователь:</span>
                        <span class="info-value">${currentUser.username}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${currentUser.email}</span>
                    </div>
                </div>
                <div class="info-card">
                    <h3><i class="fas fa-cogs"></i> Быстрые действия</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 16px;">
                        <button class="btn-primary" onclick="window.location.href='/admin'">
                            <i class="fas fa-user-shield"></i> Админ-панель
                        </button>
                        <button class="btn-secondary" onclick="window.location.href='/chat'">
                            <i class="fas fa-comments"></i> Чат
                        </button>
                        <button class="btn-secondary" onclick="window.location.href='/map'">
                            <i class="fas fa-map"></i> Карты
                        </button>
                    </div>
                </div>
                ${currentUser.role === 'admin' ? `
                <div class="info-card">
                    <h3><i class="fas fa-hourglass-half"></i> Управление ходами</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 16px;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <span>Текущий ход:</span>
                            <strong id="admin-current-turn">-</strong>
                        </div>
                        <button class="btn-primary" onclick="nextTurn()">
                            <i class="fas fa-forward"></i> Следующий ход
                        </button>
                        <button class="btn-secondary" onclick="setTurn()">
                            <i class="fas fa-edit"></i> Установить ход
                        </button>
                    </div>
                </div>
                ` : ''}
            </div>
            <div style="margin-top: 24px;">
                <div class="info-card">
                    <h3><i class="fas fa-chart-bar"></i> Редактор статистики стран</h3>
                    <p style="color: var(--text-secondary); margin: 12px 0;">Управление населением, религиями, культурами и социальными слоями стран</p>
                    <button class="btn-primary" onclick="openStatisticsEditor()" style="width: 100%; margin-top: 16px;">
                        <i class="fas fa-edit"></i> Открыть редактор статистики
                    </button>
                </div>
            </div>
            <div style="margin-top: 24px;">
                <div class="info-card">
                    <h3><i class="fas fa-history"></i> История экономики</h3>
                    <p style="color: var(--text-secondary); margin: 12px 0;">Просмотр истории экономических показателей всех стран по ходам</p>
                    <button class="btn-primary" onclick="openEconomyHistory()" style="width: 100%; margin-top: 16px;">
                        <i class="fas fa-chart-line"></i> Просмотреть историю экономики
                    </button>
                </div>
            </div>
        `;
    }

    setupNavigation();

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        updateThemeIcon();
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeIcon();
        });
    }

    document.getElementById('home-btn').addEventListener('click', goToHome);
}

function updateThemeIcon() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        const isDark = document.body.classList.contains('dark-mode');
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.game-section');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionName = btn.dataset.section;

            navBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${sectionName}-section`).classList.add('active');
            
            localStorage.setItem('activeSection', sectionName);
            
            if (sectionName === 'technologies' && window.techModule) {
                window.techModule.init();
            }
            
            if (sectionName === 'my-character' && window.charModule) {
                window.charModule.loadMyCharacter();
            }
            
            if (sectionName === 'economy') {
                if (!window.economicModule) {
                    console.error('economicModule не загружен');
                    return;
                }
                if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator')) {
                    // Проверяем сохраненную страну
                    const savedCountry = localStorage.getItem('econViewingCountryId');
                    const savedCountryName = localStorage.getItem('econViewingCountryName');
                    
                    if (savedCountry && savedCountryName) {
                        // Если есть сохраненная страна, используем ее
                        console.log('Восстановлена сохраненная страна для экономики:', savedCountry, savedCountryName);
                        window.economicModule.init(savedCountry, savedCountryName);
                    } else {
                        // Если нет сохраненной страны, показываем окно выбора
                        window.showCountrySelectionModal('economy');
                    }
                } else if (currentCountry) {
                    window.economicModule.init(currentCountry.id, currentCountry.country_name);
                }
            }
        });
    });
    
    const savedSection = localStorage.getItem('activeSection');
    if (savedSection) {
        const savedBtn = document.querySelector(`[data-section="${savedSection}"]`);
        if (savedBtn) {
            savedBtn.click();
        }
    }
}

async function loadGameState() {
    try {
        const response = await fetch('/api/game/turn');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                gameState = data;
            }
        }
    } catch (error) {
        console.error('Error loading game state:', error);
    }
}

function updateGameStateDisplay() {
    if (!gameState) return;
    
    const turnElement = document.getElementById('game-turn');
    if (turnElement) {
        turnElement.textContent = gameState.current_turn;
    }
    
    const adminTurnElement = document.getElementById('admin-current-turn');
    if (adminTurnElement) {
        adminTurnElement.textContent = gameState.current_turn;
    }
}

async function nextTurn() {
    const confirmed = await showConfirm('Подтверждение', 'Вы уверены, что хотите перейти к следующему ходу?');
    if (!confirmed) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/admin/game/next-turn', {
            method: 'POST',
            headers: { 'Authorization': token }
        });
        
        const data = await response.json();
        
        if (data.success) {
            gameState.current_turn = data.current_turn;
            updateGameStateDisplay();
            await showSuccess(data.message || 'Ход успешно изменён');
        } else {
            await showError(data.error || 'Не удалось изменить ход');
        }
    } catch (error) {
        console.error('Error advancing turn:', error);
        await showError('Произошла ошибка при изменении хода');
    }
}

async function setTurn() {
    const turnNumber = await showPrompt('Установка хода', 'Введите номер хода:', (gameState?.current_turn || 1).toString());
    
    if (turnNumber === null) {
        return;
    }
    
    const turn = parseInt(turnNumber);
    if (isNaN(turn) || turn < 1) {
        await showError('Некорректный номер хода. Введите число больше или равно 1.');
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/admin/game/set-turn', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ turn: turn })
        });
        
        const data = await response.json();
        
        if (data.success) {
            gameState.current_turn = data.current_turn;
            updateGameStateDisplay();
            await showSuccess(data.message || 'Ход успешно установлен');
        } else {
            await showError(data.error || 'Не удалось установить ход');
        }
    } catch (error) {
        console.error('Error setting turn:', error);
        await showError('Произошла ошибка при установке хода');
    }
}

function goToHome() {
    window.location.href = '/';
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти из игры?')) {
        localStorage.removeItem('token');
        window.location.href = '/';
    }
}

async function updateCountryData() {
    if (currentUser.role === 'player') {
        await loadCountryData();
    }
    initInterface();
}

window.gameState = {
    getUser: () => currentUser,
    getCountry: () => currentCountry,
    updateCountry: updateCountryData
};

window.selectCountryForTech = function(countryId, countryName) {
    closeModal();
    if (window.techModule) {
        window.techModule.setViewingCountry(countryId, countryName);
        window.techModule.init();
    }
};

window.selectCountryForEconomy = function(countryId, countryName) {
    console.log('selectCountryForEconomy вызвана:', { countryId, countryName });
    closeModal();
    if (window.economicModule && window.economicModule.selectCountry) {
        window.economicModule.selectCountry(countryId, countryName);
    } else {
        console.error('economicModule.selectCountry не найден');
    }
};

window.showCountrySelectionModal = async function(sectionType = 'technologies') {
    console.log('showCountrySelectionModal вызвана с типом:', sectionType);
    const modal = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    const modalFooter = document.getElementById('modal-footer');

    console.log('Элементы модального окна:', { modal, modalBody, modalTitle, modalFooter });

    if (!modal || !modalBody || !modalTitle || !modalFooter) {
        console.error('Модальные элементы не найдены:', { modal, modalBody, modalTitle, modalFooter });
        return;
    }

    const titleText = sectionType === 'economy' 
        ? 'Выбор страны для просмотра экономики' 
        : 'Выбор страны для управления технологиями';
    modalTitle.textContent = titleText;
    console.log('Заголовок модального окна установлен:', titleText);

    try {
        console.log('Начинаем загрузку списка стран...');
        const token = localStorage.getItem('token');
        const response = await fetch('/api/economic/countries', {
            headers: { 'Authorization': token }
        });
        const data = await response.json();
        console.log('Получены данные стран:', data);

        if (!data.success || !data.countries || data.countries.length === 0) {
            console.log('Нет доступных стран');
            modalBody.innerHTML = '<p>Нет доступных стран</p>';
            modalFooter.innerHTML = '<button class="btn-secondary" onclick="closeModal()">Закрыть</button>';
            modal.classList.add('visible');
            console.log('Модальное окно должно быть видимым, классы:', modal.className);
            return;
        }

        let html = '<div style="max-height: 400px; overflow-y: auto;">';
        html += '<div style="display: grid; gap: 12px;">';

        data.countries.forEach(country => {
            const functionName = sectionType === 'economy' ? 'selectCountryForEconomy' : 'selectCountryForTech';
            html += `
                <div class="country-select-card" onclick="${functionName}('${country.id}', '${country.country_name}')" style="
                    padding: 16px;
                    background: rgba(0, 255, 198, 0.1);
                    border: 1px solid rgba(0, 255, 198, 0.3);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s;
                ">
                    <div style="font-weight: 600; font-size: 1.1em; color: #00ffc6; margin-bottom: 4px;">
                        ${country.country_name}
                    </div>
                    <div style="color: #888; font-size: 0.9em;">
                        ${country.ruler_first_name} ${country.ruler_last_name}
                    </div>
                </div>
            `;
        });

        html += '</div></div>';
        modalBody.innerHTML = html;
        modalFooter.innerHTML = '<button class="btn-secondary" onclick="closeModal()">Отмена</button>';
        modal.classList.add('visible');
        console.log('Модальное окно открыто, классы:', modal.className);
        console.log('Стили модального окна:', window.getComputedStyle(modal).display);

    } catch (error) {
        console.error('Error loading countries:', error);
        modalBody.innerHTML = '<p style="color: #ff4444;">Ошибка загрузки списка стран</p>';
        modalFooter.innerHTML = '<button class="btn-secondary" onclick="closeModal()">Закрыть</button>';
        modal.classList.add('visible');
        console.log('Модальное окно открыто (ошибка), классы:', modal.className);
    }
};

function closeModal() {
    const modal = document.getElementById('modal-overlay');
    if (modal) {
        modal.classList.remove('visible');
    }
}

window.closeModal = closeModal;

function openStatisticsModal(type) {
    const modal = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    const modalFooter = document.getElementById('modal-footer');
    const modalContainer = document.getElementById('modal-container');
    
    if (!modal || !modalBody || !modalTitle || !modalFooter) {
        console.error('Модальное окно не найдено');
        return;
    }
    
    // Делаем модальное окно крупным
    modalContainer.style.maxWidth = '1200px';
    modalContainer.style.width = '95%';
    
    const titles = {
        'religion': 'Религии страны',
        'culture': 'Культура страны',
        'social': 'Социальные слои'
    };
    
    const icons = {
        'religion': 'fa-church',
        'culture': 'fa-palette',
        'social': 'fa-users'
    };
    
    modalTitle.innerHTML = `<i class="fas ${icons[type]}"></i> ${titles[type]}`;
    
    // Показываем загрузку
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 60px;">
            <i class="fas fa-spinner fa-spin fa-3x" style="color: var(--primary);"></i>
            <p style="margin-top: 20px; color: var(--text-secondary);">Загрузка статистики...</p>
        </div>
    `;
    
    modalFooter.innerHTML = '<button class="btn-secondary" onclick="closeModal()">Закрыть</button>';
    modal.classList.add('visible');
    
    // Получаем ID страны текущего пользователя
    const countryId = currentCountry?.id;
    if (!countryId) {
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--danger);">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <p style="margin-top: 20px;">Не удалось определить страну</p>
            </div>
        `;
        return;
    }
    
    // Загружаем статистику
    const token = localStorage.getItem('token');
    fetch(`/api/statistics/country/${countryId}`, {
        headers: { 'Authorization': token }
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            throw new Error(data.error || 'Ошибка загрузки статистики');
        }
        
        // Создаём контейнер для диаграммы
        const chartId = `chart-${type}-${Date.now()}`;
        modalBody.innerHTML = `
            <div class="statistics-modal-content">
                <div id="${chartId}" class="chart-container"></div>
            </div>
        `;
        
        // Отрисовываем диаграмму в зависимости от типа
        setTimeout(() => {
            const chartOptions = {
                width: 750,
                height: 550,
                radius: 180,
                population: data.population || 0
            };
            
            if (type === 'religion') {
                if (typeof window.drawPieChart === 'function') {
                    window.drawPieChart(chartId, data.religions, {
                        ...chartOptions,
                        title: `Религиозный состав населения`
                    });
                } else {
                    modalBody.innerHTML = '<p style="color: var(--danger);">Модуль отрисовки диаграмм не загружен</p>';
                }
            } else if (type === 'culture') {
                if (typeof window.drawNestedPieChart === 'function') {
                    window.drawNestedPieChart(chartId, data.cultures, {
                        ...chartOptions,
                        title: `Культурный состав населения`
                    });
                } else {
                    modalBody.innerHTML = '<p style="color: var(--danger);">Модуль отрисовки диаграмм не загружен</p>';
                }
            } else if (type === 'social') {
                if (typeof window.drawPieChart === 'function') {
                    window.drawPieChart(chartId, data.social_layers, {
                        ...chartOptions,
                        title: `Социальная структура населения`
                    });
                } else {
                    modalBody.innerHTML = '<p style="color: var(--danger);">Модуль отрисовки диаграмм не загружен</p>';
                }
            }
        }, 100);
    })
    .catch(error => {
        console.error('Error loading statistics:', error);
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--danger);">
                <i class="fas fa-exclamation-circle fa-3x"></i>
                <p style="margin-top: 20px; font-size: 1.1em;">Ошибка загрузки данных</p>
                <p style="margin-top: 8px; font-size: 0.9em; color: var(--text-secondary);">${error.message}</p>
            </div>
        `;
    });
}

window.openStatisticsModal = openStatisticsModal;

// Редактор статистики для админа
let currentEditingCountry = null;

async function openStatisticsEditor() {
    const modal = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    const modalFooter = document.getElementById('modal-footer');
    const modalContainer = document.getElementById('modal-container');
    
    if (!modal || !modalBody || !modalTitle || !modalFooter) return;
    
    modalContainer.style.maxWidth = '1000px';
    modalContainer.style.width = '95%';
    
    modalTitle.innerHTML = '<i class="fas fa-chart-bar"></i> Редактор статистики стран';
    
    // Загружаем список стран
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/economic/countries', {
            headers: { 'Authorization': token }
        });
        const data = await response.json();
        
        if (!data.success || !data.countries) {
            modalBody.innerHTML = '<p style="color: var(--danger);">Ошибка загрузки списка стран</p>';
            modalFooter.innerHTML = '<button class="btn-secondary" onclick="closeModal()">Закрыть</button>';
            modal.classList.add('visible');
            return;
        }
        
        let countriesHtml = '<div class="statistics-editor-list">';
        data.countries.forEach(country => {
            countriesHtml += `
                <div class="country-edit-item" onclick="selectCountryForEdit('${country.id}', '${country.country_name.replace(/'/g, "\\'")}')">  
                    <div>
                        <strong>${country.country_name}</strong>
                        <span style="color: var(--text-tertiary); font-size: 0.9em;">ID: ${country.id}</span>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </div>
            `;
        });
        countriesHtml += '</div>';
        
        modalBody.innerHTML = `
            <p style="color: var(--text-secondary); margin-bottom: 16px;">Выберите страну для редактирования статистики:</p>
            ${countriesHtml}
        `;
        
        modalFooter.innerHTML = '<button class="btn-secondary" onclick="closeModal()">Закрыть</button>';
        modal.classList.add('visible');
        
    } catch (error) {
        console.error('Error loading countries:', error);
        modalBody.innerHTML = '<p style="color: var(--danger);">Ошибка подключения к серверу</p>';
        modalFooter.innerHTML = '<button class="btn-secondary" onclick="closeModal()">Закрыть</button>';
        modal.classList.add('visible');
    }
}

async function selectCountryForEdit(countryId, countryName) {
    currentEditingCountry = { id: countryId, name: countryName };
    
    const modal = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    const modalFooter = document.getElementById('modal-footer');
    
    modalTitle.innerHTML = `<i class="fas fa-edit"></i> Редактирование статистики: ${countryName}`;
    
    // Показываем загрузку
    modalBody.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Загрузка данных...</p></div>';
    
    // Загружаем текущие данные и справочники
    const token = localStorage.getItem('token');
    try {
        const [statsResponse, religionsResponse, culturesResponse, layersResponse] = await Promise.all([
            fetch(`/api/statistics/country/${countryId}`, { headers: { 'Authorization': token } }),
            fetch('/api/statistics/reference/religions'),
            fetch('/api/statistics/reference/cultures'),
            fetch('/api/statistics/reference/social-layers')
        ]);
        
        const stats = await statsResponse.json();
        const religions = await religionsResponse.json();
        const cultures = await culturesResponse.json();
        const layers = await layersResponse.json();
        
        renderStatisticsForm(stats, religions.religions, cultures.cultures, layers.social_layers);
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        modalBody.innerHTML = '<p style="color: var(--danger);">Ошибка загрузки данных статистики</p>';
        modalFooter.innerHTML = `
            <button class="btn-secondary" onclick="openStatisticsEditor()">Назад</button>
            <button class="btn-secondary" onclick="closeModal()">Закрыть</button>
        `;
    }
}

function renderStatisticsForm(currentStats, allReligions, allCultures, allLayers) {
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');
    
    let html = '<div class="statistics-editor-form">';
    
    // Население
    html += `
        <div class="stats-form-section">
            <h4><i class="fas fa-users"></i> Население</h4>
            <p class="stats-form-hint">Формат: 0.77 = 770 тыс., 41.23 = 41.23 млн</p>
            <input type="number" id="stat-population" step="0.01" min="0" 
                   value="${currentStats.population || 0}" 
                   class="modal-input" placeholder="Например: 41.23">
        </div>
    `;
    
    // Религии
    html += `
        <div class="stats-form-section">
            <h4><i class="fas fa-church"></i> Религии</h4>
            <p class="stats-form-hint">Укажите процент верующих для каждой религии (сумма не должна превышать 100%)</p>
            <div class="stats-form-grid">
    `;
    allReligions.forEach(religion => {
        const value = currentStats.religions?.[religion] || 0;
        html += `
            <div class="stats-form-item">
                <label>${religion}</label>
                <input type="number" class="religion-input" data-religion="${religion}" 
                       value="${value}" step="0.1" min="0" max="100" placeholder="0">
            </div>
        `;
    });
    html += '</div></div>';
    
    // Культуры
    html += `
        <div class="stats-form-section">
            <h4><i class="fas fa-palette"></i> Культуры</h4>
            <p class="stats-form-hint">Укажите процент для каждой нации (процент этноса вычисляется автоматически)</p>
    `;
    
    for (const [ethnos, nations] of Object.entries(allCultures)) {
        html += `<div class="stats-form-ethnos"><strong>${ethnos}</strong><div class="stats-form-grid">`;
        nations.forEach(nation => {
            const value = currentStats.cultures?.[ethnos]?.nations?.[nation] || 0;
            html += `
                <div class="stats-form-item">
                    <label>${nation}</label>
                    <input type="number" class="culture-input" data-ethnos="${ethnos}" data-nation="${nation}" 
                           value="${value}" step="0.1" min="0" max="100" placeholder="0">
                </div>
            `;
        });
        html += '</div></div>';
    }
    html += '</div>';
    
    // Социальные слои
    html += `
        <div class="stats-form-section">
            <h4><i class="fas fa-layer-group"></i> Социальные слои</h4>
            <p class="stats-form-hint">Укажите процент населения для каждого социального слоя</p>
            <div class="stats-form-grid">
    `;
    allLayers.forEach(layer => {
        const value = currentStats.social_layers?.[layer] || 0;
        html += `
            <div class="stats-form-item">
                <label>${layer}</label>
                <input type="number" class="layer-input" data-layer="${layer}" 
                       value="${value}" step="0.1" min="0" max="100" placeholder="0">
            </div>
        `;
    });
    html += '</div></div>';
    
    html += '</div>';
    
    modalBody.innerHTML = html;
    
    modalFooter.innerHTML = `
        <button class="btn-secondary" onclick="openStatisticsEditor()">Назад к списку</button>
        <button class="btn-primary" onclick="saveStatistics()">
            <i class="fas fa-save"></i> Сохранить
        </button>
    `;
}

async function saveStatistics() {
    if (!currentEditingCountry) return;
    
    const token = localStorage.getItem('token');
    const countryId = currentEditingCountry.id;
    
    // Собираем данные
    const population = parseFloat(document.getElementById('stat-population').value) || 0;
    
    const religions = {};
    document.querySelectorAll('.religion-input').forEach(input => {
        const value = parseFloat(input.value) || 0;
        if (value > 0) {
            religions[input.dataset.religion] = value;
        }
    });
    
    const cultures = {};
    document.querySelectorAll('.culture-input').forEach(input => {
        const value = parseFloat(input.value) || 0;
        if (value > 0) {
            const ethnos = input.dataset.ethnos;
            const nation = input.dataset.nation;
            if (!cultures[ethnos]) {
                cultures[ethnos] = { nations: {} };
            }
            cultures[ethnos].nations[nation] = value;
        }
    });
    
    const socialLayers = {};
    document.querySelectorAll('.layer-input').forEach(input => {
        const value = parseFloat(input.value) || 0;
        if (value > 0) {
            socialLayers[input.dataset.layer] = value;
        }
    });
    
    // Проверяем суммы процентов
    const religionsSum = Object.values(religions).reduce((a, b) => a + b, 0);
    if (religionsSum > 100) {
        alert(`Сумма процентов религий превышает 100% (${religionsSum.toFixed(1)}%)`);
        return;
    }
    
    let culturesSum = 0;
    for (const ethnos of Object.values(cultures)) {
        culturesSum += Object.values(ethnos.nations).reduce((a, b) => a + b, 0);
    }
    if (culturesSum > 100) {
        alert(`Сумма процентов наций превышает 100% (${culturesSum.toFixed(1)}%)`);
        return;
    }
    
    const layersSum = Object.values(socialLayers).reduce((a, b) => a + b, 0);
    if (layersSum > 100) {
        alert(`Сумма процентов социальных слоёв превышает 100% (${layersSum.toFixed(1)}%)`);
        return;
    }
    
    // Показываем загрузку
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Сохранение...</p></div>';
    
    try {
        // Сохраняем все данные
        await Promise.all([
            fetch(`/api/statistics/country/${countryId}/population`, {
                method: 'POST',
                headers: { 
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ population })
            }),
            fetch(`/api/statistics/country/${countryId}/religions`, {
                method: 'POST',
                headers: { 
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ religions })
            }),
            fetch(`/api/statistics/country/${countryId}/cultures`, {
                method: 'POST',
                headers: { 
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cultures })
            }),
            fetch(`/api/statistics/country/${countryId}/social-layers`, {
                method: 'POST',
                headers: { 
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ social_layers: socialLayers })
            })
        ]);
        
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-check-circle fa-4x" style="color: var(--success);"></i>
                <h3 style="margin-top: 20px; color: var(--success);">Статистика успешно сохранена!</h3>
                <p style="color: var(--text-secondary); margin-top: 12px;">
                    Население: ${population.toFixed(2)} млн<br>
                    Религий: ${Object.keys(religions).length}<br>
                    Наций: ${culturesSum.toFixed(1)}%<br>
                    Социальных слоёв: ${Object.keys(socialLayers).length}
                </p>
            </div>
        `;
        
        const modalFooter = document.getElementById('modal-footer');
        modalFooter.innerHTML = `
            <button class="btn-primary" onclick="openStatisticsEditor()">Редактировать другую страну</button>
            <button class="btn-secondary" onclick="closeModal()">Закрыть</button>
        `;
        
    } catch (error) {
        console.error('Error saving statistics:', error);
        modalBody.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-times-circle fa-4x" style="color: var(--danger);"></i><h3 style="margin-top: 20px; color: var(--danger);">Ошибка сохранения</h3><p style="color: var(--text-secondary);">Попробуйте снова</p></div>';
        
        const modalFooter = document.getElementById('modal-footer');
        modalFooter.innerHTML = `
            <button class="btn-secondary" onclick="selectCountryForEdit('${countryId}', '${currentEditingCountry.name}')">Повторить</button>
            <button class="btn-secondary" onclick="closeModal()">Закрыть</button>
        `;
    }
}

window.openStatisticsEditor = openStatisticsEditor;
window.selectCountryForEdit = selectCountryForEdit;
window.saveStatistics = saveStatistics;

// История экономики для админа
async function openEconomyHistory() {
    const modal = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    const modalFooter = document.getElementById('modal-footer');
    
    modalTitle.innerHTML = '<i class="fas fa-history"></i> История экономики всех стран';
    modalBody.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-3x"></i><p style="margin-top: 20px;">Загрузка истории...</p></div>';
    modalFooter.innerHTML = '<button class="btn-secondary" onclick="closeModal()">Закрыть</button>';
    
    modal.classList.add('visible');
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/economic/economy-history/all', {
            headers: { 'Authorization': token }
        });
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Ошибка загрузки истории');
        }
        
        let html = '<div class="economy-history-container">';
        
        for (const [countryId, countryData] of Object.entries(data.countries)) {
            html += `
                <div class="economy-history-country">
                    <div class="economy-history-header">
                        <h3><i class="fas fa-flag"></i> ${countryData.country_name}</h3>
                        ${countryData.history.length > 0 ? `<span class="history-count">${countryData.history.length} ходов</span>` : ''}
                    </div>
            `;
            
            if (countryData.history.length === 0) {
                html += '<p style="color: var(--text-tertiary); padding: 20px; text-align: center;">История отсутствует</p>';
            } else {
                html += '<div class="economy-history-list">';
                
                for (const turn of countryData.history) {
                    const changeClass = (turn.balance_end - turn.balance_start) >= 0 ? 'positive' : 'negative';
                    const changeIcon = (turn.balance_end - turn.balance_start) >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
                    
                    html += `
                        <div class="economy-history-item">
                            <div class="history-turn">
                                <i class="fas fa-calendar-alt"></i>
                                <strong>Ход ${turn.turn}</strong>
                            </div>
                            <div class="history-balance">
                                <div class="balance-row">
                                    <span>Начало:</span>
                                    <strong>${turn.balance_start.toFixed(2)}</strong>
                                </div>
                                <div class="balance-row">
                                    <span>Конец:</span>
                                    <strong>${turn.balance_end.toFixed(2)}</strong>
                                </div>
                                <div class="balance-change ${changeClass}">
                                    <i class="fas ${changeIcon}"></i>
                                    ${(turn.balance_end - turn.balance_start) > 0 ? '+' : ''}${(turn.balance_end - turn.balance_start).toFixed(2)}
                                </div>
                            </div>
                            <div class="history-income-expenses">
                                <div class="income-item">
                                    <i class="fas fa-arrow-down" style="color: #22c55e;"></i>
                                    <span>Доходы:</span>
                                    <strong style="color: #22c55e;">${turn.income.toFixed(2)}</strong>
                                </div>
                                <div class="expense-item">
                                    <i class="fas fa-arrow-up" style="color: #ef4444;"></i>
                                    <span>Расходы:</span>
                                    <strong style="color: #ef4444;">${turn.expenses.toFixed(2)}</strong>
                                </div>
                            </div>
                            <div class="history-taxes">
                                <span class="tax-label"><i class="fas fa-percent"></i> Налоговый доход:</span>
                                <strong>${turn.tax_income.toFixed(2)}</strong>
                            </div>
                        </div>
                    `;
                }
                
                html += '</div>';
            }
            
            html += '</div>';
        }
        
        html += '</div>';
        
        modalBody.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading economy history:', error);
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-times-circle fa-4x" style="color: var(--danger);"></i>
                <h3 style="margin-top: 20px; color: var(--danger);">Ошибка загрузки</h3>
                <p style="color: var(--text-secondary); margin-top: 12px;">${error.message}</p>
            </div>
        `;
    }
}

window.openEconomyHistory = openEconomyHistory;