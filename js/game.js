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

    // Добавляем обработчик клика на секретные монеты
    const secretCoinsElement = document.getElementById('secret-coins');
    if (secretCoinsElement) {
        secretCoinsElement.style.cursor = 'pointer';
        secretCoinsElement.parentElement.style.cursor = 'pointer';
        secretCoinsElement.parentElement.addEventListener('click', () => {
            window.location.href = '/secret_shop.html';
        });
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
                <div class="placeholder-card">
                    <i class="fas fa-gamepad fa-3x"></i>
                    <h3>Игровые функции для администраторов</h3>
                    <p>Управление игровыми процессами, событиями и механиками будет доступно в следующих обновлениях</p>
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