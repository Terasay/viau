// Глобальные переменные
let currentUser = null;
let messages = [];
let onlineUsers = [];
let ws = null;

// Элементы DOM
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const userInfo = document.getElementById('userInfo');
const onlineCount = document.getElementById('onlineCount');
const usersList = document.getElementById('usersList');
const loginModal = document.getElementById('loginModal');
const logoutBtn = document.getElementById('logoutBtn');
const mainBtn = document.getElementById('mainBtn');
const themeBtn = document.getElementById('themeBtn');
const charCounter = document.getElementById('charCounter');

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    setupEventListeners();
});

// Проверка авторизации
async function checkAuth() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        showLoginModal();
        return;
    }
    
    try {
        const response = await fetch('/me', {
            headers: {
                'Authorization': token
            }
        });
        
        const data = await response.json();
        
        if (data.logged_in) {
            if (data.banned) {
                alert('Ваш аккаунт заблокирован');
                logout();
                return;
            }
            
            currentUser = {
                username: data.username,
                role: data.role,
                country: data.country,
                muted: data.muted
            };
            
            initChat();
        } else {
            showLoginModal();
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        showLoginModal();
    }
}

// Инициализация чата
function initChat() {
    userInfo.textContent = `${currentUser.username}${currentUser.role === 'admin' ? ' (админ)' : ''}`;
    if (currentUser.muted) {
        showMutedNotice();
    }
    updateOnlineUsers();
    loadChatHistory();
    setupWebSocket();
}

// Симуляция чата (замените на реальный WebSocket)
function simulateChat() {
    // Симуляция больше не используется
}

// Загрузка истории чата
function loadChatHistory() {
    // Загрузка истории чата с сервера
    fetch('/chat/messages', {
        method: 'GET'
    })
    .then(res => res.json())
    .then(data => {
        messages = [];
        messagesContainer.innerHTML = '';
        data.messages.forEach(msg => {
            addMessage(msg, false);
        });
        scrollToBottom();
    })
    .catch(e => {
        console.error('Ошибка загрузки истории:', e);
    });
}

// Сохранение истории чата
function saveChatHistory() {
    // История сохраняется на сервере, ничего не делаем
}

// Обновление списка пользователей онлайн
function updateOnlineUsers() {
    // В реальном проекте список приходил бы с сервера
    onlineUsers = [
        { username: currentUser.username, role: currentUser.role },
        { username: 'GameMaster', role: 'admin' },
        { username: 'Player1', role: 'user' },
        { username: 'Player2', role: 'user' }
    ];
    
    // Убираем дубликаты
    onlineUsers = onlineUsers.filter((user, index, self) =>
        index === self.findIndex(u => u.username === user.username)
    );
    
    onlineCount.textContent = `${onlineUsers.length} онлайн`;
    
    // Обновляем список
    usersList.innerHTML = '';
    onlineUsers.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        
        const avatar = document.createElement('div');
        avatar.className = 'user-avatar';
        avatar.textContent = user.username[0].toUpperCase();
        
        const name = document.createElement('div');
        name.className = 'user-name';
        name.textContent = user.username;
        
        userItem.appendChild(avatar);
        userItem.appendChild(name);
        
        if (user.role === 'admin') {
            const badge = document.createElement('div');
            badge.className = 'user-badge admin';
            badge.textContent = 'ADMIN';
            userItem.appendChild(badge);
        }
        
        usersList.appendChild(userItem);
    });
}

// Добавление сообщения
function addMessage(messageData, save = true) {
    const message = document.createElement('div');
    message.className = 'message';
    if (messageData.username === currentUser.username) {
        message.classList.add('own');
    }
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = messageData.username[0].toUpperCase();
    const content = document.createElement('div');
    content.className = 'message-content';
    const header = document.createElement('div');
    header.className = 'message-header';
    const username = document.createElement('div');
    username.className = 'message-username';
    username.textContent = messageData.username;
    header.appendChild(username);
    if (messageData.role === 'admin') {
        const role = document.createElement('div');
        role.className = 'message-role admin';
        role.textContent = 'ADMIN';
        header.appendChild(role);
    }
    const time = document.createElement('div');
    time.className = 'message-time';
    const timestamp = messageData.timestamp ? new Date(messageData.timestamp) : new Date();
    time.textContent = formatTime(timestamp);
    header.appendChild(time);
    const text = document.createElement('div');
    text.className = 'message-text';
    text.textContent = messageData.text;
    content.appendChild(header);
    content.appendChild(text);
    message.appendChild(avatar);
    message.appendChild(content);
    messagesContainer.appendChild(message);
    scrollToBottom();
}

// Добавление системного сообщения
function addSystemMessage(text, save = true) {
    // В новой версии системные сообщения не используются
}

// --- WebSocket ---
function setupWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}/ws/chat`;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        // Соединение установлено
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'message' && data.message) {
                addMessage(data.message, false);
            } else if (data.error) {
                alert(data.error);
            }
        } catch (e) {
            console.error('Ошибка обработки сообщения WebSocket:', e);
        }
    };

    ws.onclose = () => {
        // Попробовать переподключиться через 2 секунды
        setTimeout(setupWebSocket, 2000);
    };
}

// --- Переопределение sendMessage для WebSocket ---
function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    if (currentUser.muted) {
        alert('Вы не можете отправлять сообщения, так как вы замучены');
        return;
    }
    const token = localStorage.getItem('token');
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ token, text }));
        messageInput.value = '';
        updateCharCounter();
    } else {
        alert('Нет соединения с сервером');
    }
}

// Форматирование времени
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Прокрутка вниз
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Показ уведомления о мьюте
function showMutedNotice() {
    const notice = document.createElement('div');
    notice.className = 'muted-notice';
    notice.textContent = 'Вы не можете отправлять сообщения. Вы замучены администратором.';
    messagesContainer.insertBefore(notice, messagesContainer.firstChild);
    messageInput.disabled = true;
    sendBtn.disabled = true;
}

// Показ модального окна входа
function showLoginModal() {
    loginModal.classList.add('active');
}

// Выход из системы
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Отправка сообщения
    sendBtn.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Счетчик символов
    messageInput.addEventListener('input', updateCharCounter);
    
    // Выход
    logoutBtn.addEventListener('click', logout);
    // Переход на главную
    if (mainBtn) {
        mainBtn.addEventListener('click', () => {
            window.location.href = '/index.html';
        });
    }
    // Переключение темы
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            // Сохраняем выбор пользователя
            if (document.body.classList.contains('dark-theme')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
        });
        // При загрузке страницы — применяем сохранённую тему
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }
}

// Экспорт для использования в других модулях (если нужно)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        addMessage,
        addSystemMessage,
        updateOnlineUsers
    };
}