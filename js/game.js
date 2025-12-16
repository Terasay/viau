let currentUser = null;
let currentCountry = null;

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

        initInterface();

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
    if (currentUser.role === 'admin' || currentUser.role === 'moderator') {
        document.getElementById('country-name').textContent = currentUser.role === 'admin' ? 'Панель администратора' : 'Панель модератора';
        document.getElementById('ruler-name').textContent = 'Управление игрой';
        document.getElementById('currency-name').textContent = '-';
        document.getElementById('secret-coins').textContent = '-';
    } else if (currentCountry) {
        document.getElementById('country-name').textContent = currentCountry.country_name;
        document.getElementById('ruler-name').textContent = 
            `${currentCountry.ruler_first_name} ${currentCountry.ruler_last_name}`;
        document.getElementById('currency-name').textContent = currentCountry.currency;
        document.getElementById('secret-coins').textContent = currentCountry.secret_coins || 0;
        document.getElementById('overview-country').textContent = currentCountry.country_name;
        document.getElementById('overview-ruler').textContent = 
            `${currentCountry.ruler_first_name} ${currentCountry.ruler_last_name}`;
        document.getElementById('overview-currency').textContent = currentCountry.currency;
        document.getElementById('overview-coins').textContent = currentCountry.secret_coins || 0;
    }

    document.getElementById('username').textContent = currentUser.username;

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
            
            if (sectionName === 'technologies' && window.techModule) {
                window.techModule.init();
            }
        });
    });
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