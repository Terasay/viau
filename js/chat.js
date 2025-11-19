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
    userInfo.textContent = `${currentUser.username} ${currentUser.role === 'admin' ? '👑' : ''}`;
    
    if (currentUser.muted) {
        showMutedNotice();
    }
    
    // Симуляция WebSocket соединения (в реальном проекте нужен WebSocket сервер)
    simulateChat();
    
    // Загрузка истории сообщений (если есть)
    loadChatHistory();
}

// Симуляция чата (замените на реальный WebSocket)
function simulateChat() {
    // Добавляем системное сообщение о входе
    addSystemMessage(`${currentUser.username} присоединился к чату`);
    
    // Обновляем список пользователей онлайн
    updateOnlineUsers();
    
    // Симуляция получения сообщений от других пользователей
    setTimeout(() => {
        if (messages.length === 1) {
            addMessage({
                username: 'GameMaster',
                role: 'admin',
                text: 'Добро пожаловать в игровой чат! 🎮',
                timestamp: new Date()
            });
        }
    }, 2000);
}

// Загрузка истории чата
function loadChatHistory() {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
        try {
            const parsed = JSON.parse(savedMessages);
            // Загружаем только последние 50 сообщений
            messages = parsed.slice(-50);
            messages.forEach(msg => {
                if (msg.type === 'system') {
                    addSystemMessage(msg.text, false);
                } else {
                    addMessage(msg, false);
                }
            });
            scrollToBottom();
        } catch (e) {
            console.error('Ошибка загрузки истории:', e);
        }
    }
}

// Сохранение истории чата
function saveChatHistory() {
    try {
        localStorage.setItem('chatMessages', JSON.stringify(messages.slice(-50)));
    } catch (e) {
        console.error('Ошибка сохранения истории:', e);
    }
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
    
    if (save) {
        messages.push({
            username: messageData.username,
            role: messageData.role,
            text: messageData.text,
            timestamp: timestamp
        });
        saveChatHistory();
    }
}

// Добавление системного сообщения
function addSystemMessage(text, save = true) {
    const message = document.createElement('div');
    message.className = 'message system';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = text;
    
    message.appendChild(content);
    messagesContainer.appendChild(message);
    scrollToBottom();
    
    if (save) {
        messages.push({
            type: 'system',
            text: text,
            timestamp: new Date()
        });
        saveChatHistory();
    }
}

// Отправка сообщения
function sendMessage() {
    const text = messageInput.value.trim();
    
    if (!text) return;
    
    if (currentUser.muted) {
        alert('Вы не можете отправлять сообщения, так как вы замучены');
        return;
    }
    
    const messageData = {
        username: currentUser.username,
        role: currentUser.role,
        text: text,
        timestamp: new Date()
    };
    
    addMessage(messageData);
    
    // Здесь должна быть отправка на сервер через WebSocket
    // ws.send(JSON.stringify(messageData));
    
    messageInput.value = '';
    updateCharCounter();
}

// Обновление счетчика символов
function updateCharCounter() {
    const length = messageInput.value.length;
    charCounter.textContent = `${length} / 500`;
    
    if (length >= 500) {
        charCounter.style.color = '#ff6b6b';
    } else {
        charCounter.style.color = '#999';
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
    notice.textContent = '⚠️ Вы не можете отправлять сообщения. Вы замучены администратором.';
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
}

// Экспорт для использования в других модулях (если нужно)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        addMessage,
        addSystemMessage,
        updateOnlineUsers
    };
}