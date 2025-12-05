let currentUser = null;
let currentCountry = null;

document.addEventListener('DOMContentLoaded', async () => {
    await initGame();
});

async function initGame() {
    const loadingScreen = document.getElementById('loading-screen');
    const accessDenied = document.getElementById('access-denied');
    const gameContainer = document.getElementById('game-container');

    try {
        // Проверка авторизации
        const token = localStorage.getItem('token');
        if (!token) {
            showAccessDenied();
            return;
        }

        // Получение данных пользователя
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

        // Проверка роли (должен быть player, moderator или admin)
        const allowedRoles = ['player', 'moderator', 'admin'];
        if (!allowedRoles.includes(currentUser.role)) {
            showAccessDenied();
            return;
        }

        // Загрузка данных страны игрока
        await loadCountryData();

        // Инициализация интерфейса
        initInterface();

        // Скрываем загрузку, показываем игру
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
        // Получаем список всех стран (для админов) или только свою страну
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

        // Ищем страну текущего пользователя
        const userCountry = data.countries.find(c => c.player_id === currentUser.id);

        if (!userCountry) {
            // Если у игрока нет страны - редирект на регистрацию
            alert('У вас нет зарегистрированной страны. Пожалуйста, заполните заявку.');
            window.location.href = 'https://zxcmirok.ru/registration';
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
    // Заполняем информацию в шапке
    document.getElementById('country-name').textContent = currentCountry.country_name;
    document.getElementById('ruler-name').textContent = 
        `${currentCountry.ruler_first_name} ${currentCountry.ruler_last_name}`;
    document.getElementById('username').textContent = currentUser.username;

    // Заполняем ресурсы
    document.getElementById('currency-name').textContent = currentCountry.currency;
    document.getElementById('secret-coins').textContent = currentCountry.secret_coins;

    // Заполняем секцию обзора
    document.getElementById('overview-country').textContent = currentCountry.country_name;
    document.getElementById('overview-ruler').textContent = 
        `${currentCountry.ruler_first_name} ${currentCountry.ruler_last_name}`;
    document.getElementById('overview-currency').textContent = currentCountry.currency;
    document.getElementById('overview-coins').textContent = currentCountry.secret_coins;

    // Настройка навигации
    setupNavigation();

    // Кнопка выхода
    document.getElementById('logout-btn').addEventListener('click', logout);
}

function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.game-section');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionName = btn.dataset.section;

            // Убираем активные классы
            navBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Добавляем активные классы
            btn.classList.add('active');
            document.getElementById(`${sectionName}-section`).classList.add('active');
        });
    });
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти из игры?')) {
        localStorage.removeItem('token');
        window.location.href = '/';
    }
}

// Функции для работы с данными страны (будут расширяться)
async function updateCountryData() {
    // Перезагрузка данных страны с сервера
    await loadCountryData();
    initInterface();
}

// Глобальный доступ к данным для других модулей
window.gameState = {
    getUser: () => currentUser,
    getCountry: () => currentCountry,
    updateCountry: updateCountryData
};