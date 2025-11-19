// Глобальные переменные
let currentUser = null;
let messages = [];
let onlineUsers = [];
let ws = null;

// Модальное окно для просмотра изображений
let imageModal = null;
let modalImg = null;
let modalClose = null;
let modalZoomIn = null;
let modalZoomOut = null;
let modalZoomReset = null;
let currentScale = 1;

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
const fileInput = document.getElementById('fileInput');
const attachBtn = document.getElementById('attachBtn');

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    setupEventListeners();
    setupImageModal();
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

function updateCharCounter() {
	const length = messageInput.value.length;
	charCounter.textContent = `${length} / 500`;
	if (length >= 500) {
		charCounter.style.color = '#ff6b6b';
	} else {
		charCounter.style.color = '#999';
	}
}

// Инициализация чата
function initChat() {
    userInfo.textContent = `${currentUser.username}${currentUser.role === 'admin' ? ' (админ)' : ''}`;
    if (currentUser.muted) {
        showMutedNotice();
    }
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
function updateOnlineUsers(users) {
    onlineUsers = users || [];
    onlineCount.textContent = `${onlineUsers.length} онлайн`;
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
    // Если текст содержит <img> или <a>, вставляем как html
    if (/<img|<a/.test(messageData.text)) {
        text.innerHTML = messageData.text;
        // Добавляем обработчик клика по картинке для открытия модального окна
        const imgs = text.querySelectorAll('img');
        imgs.forEach(img => {
            img.style.cursor = 'pointer';
            img.addEventListener('click', () => {
                openImageModal(img.src);
            });
        });
    } else {
        text.textContent = messageData.text;
    }
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
        // При открытии сразу отправляем токен для авторизации
        const token = localStorage.getItem('token');
        ws.send(JSON.stringify({ token }));
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'message' && data.message) {
                addMessage(data.message, false);
            } else if (data.type === 'online_users' && Array.isArray(data.users)) {
                updateOnlineUsers(data.users);
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
    // date - объект Date
    // Формат: ДД.ММ.ГГГГ ЧЧ:ММ
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
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
            if (document.body.classList.contains('dark-theme')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
        });
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }
    // Кнопка прикрепления файла
    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => {
            fileInput.click();
        });
        fileInput.addEventListener('change', handleFileUpload);
    }
    // Вставка файла через Ctrl+V
    messageInput.addEventListener('paste', handlePasteFile);
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        uploadFile(file);
        fileInput.value = '';
    }
}

function handlePasteFile(e) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) {
                uploadFile(file);
                e.preventDefault();
                break;
            }
        }
    }
}

function uploadFile(file) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    fetch('/chat/upload', {
        method: 'POST',
        headers: {
            'Authorization': token
        },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.url) {
            // Отправить ссылку на файл как сообщение
            sendFileMessage(data.url, file.type);
        } else {
            alert(data.error || 'Ошибка загрузки файла');
        }
    })
    .catch(() => {
        alert('Ошибка загрузки файла');
    });
}

function sendFileMessage(url, fileType) {
    const token = localStorage.getItem('token');
    let text = '';
    if (fileType.startsWith('image/')) {
        text = `<img src="${url}" alt="image" style="max-width:300px;max-height:300px;">`;
    } else {
        text = `<a href="${url}" target="_blank">Документ</a>`;
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ token, text }));
    } else {
        alert('Нет соединения с сервером');
    }
}

// Экспорт для использования в других модулях (если нужно)

// --- Модальное окно для просмотра изображений ---
function setupImageModal() {
    // Создаём элементы модального окна, если их нет
    if (document.getElementById('imageModal')) return;
    imageModal = document.createElement('div');
    imageModal.id = 'imageModal';
    imageModal.style.position = 'fixed';
    imageModal.style.top = '0';
    imageModal.style.left = '0';
    imageModal.style.width = '100vw';
    imageModal.style.height = '100vh';
    imageModal.style.background = 'rgba(0,0,0,0.85)';
    imageModal.style.display = 'none';
    imageModal.style.alignItems = 'center';
    imageModal.style.justifyContent = 'center';
    imageModal.style.zIndex = '9999';
    imageModal.innerHTML = `
        <div style="position:relative;max-width:90vw;max-height:90vh;display:flex;flex-direction:column;align-items:center;">
            <img id="modalImg" src="" style="max-width:90vw;max-height:80vh;border-radius:12px;box-shadow:0 0 40px #000;transition:transform 0.2s;" />
            <div style="margin-top:15px;display:flex;gap:10px;">
                <button id="modalZoomIn" style="padding:8px 16px;border-radius:8px;border:none;background:#667eea;color:#fff;font-size:18px;cursor:pointer;">+</button>
                <button id="modalZoomOut" style="padding:8px 16px;border-radius:8px;border:none;background:#667eea;color:#fff;font-size:18px;cursor:pointer;">-</button>
                <button id="modalZoomReset" style="padding:8px 16px;border-radius:8px;border:none;background:#764ba2;color:#fff;font-size:16px;cursor:pointer;">Сброс</button>
                <button id="modalClose" style="padding:8px 16px;border-radius:8px;border:none;background:#ff6b6b;color:#fff;font-size:16px;cursor:pointer;">Закрыть</button>
            </div>
        </div>
    `;
    document.body.appendChild(imageModal);
    modalImg = document.getElementById('modalImg');
    modalClose = document.getElementById('modalClose');
    modalZoomIn = document.getElementById('modalZoomIn');
    modalZoomOut = document.getElementById('modalZoomOut');
    modalZoomReset = document.getElementById('modalZoomReset');

    modalClose.addEventListener('click', closeImageModal);
    modalZoomIn.addEventListener('click', () => zoomImage(1.2));
    modalZoomOut.addEventListener('click', () => zoomImage(0.8));
    modalZoomReset.addEventListener('click', () => zoomImage(1, true));
    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) closeImageModal();
    });
    modalImg.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0) zoomImage(1.1);
        else zoomImage(0.9);
    });
    document.addEventListener('keydown', (e) => {
        if (imageModal.style.display === 'flex' && (e.key === 'Escape' || e.key === 'Esc')) {
            closeImageModal();
        }
    });
}

function openImageModal(src) {
    if (!imageModal) setupImageModal();
    modalImg.src = src;
    imageModal.style.display = 'flex';
    currentScale = 1;
    modalImg.style.transform = 'scale(1)';
}

function closeImageModal() {
    imageModal.style.display = 'none';
    modalImg.src = '';
}

function zoomImage(factor, reset = false) {
    if (reset) {
        currentScale = 1;
    } else {
        currentScale *= factor;
        if (currentScale < 0.2) currentScale = 0.2;
        if (currentScale > 5) currentScale = 5;
    }
    modalImg.style.transform = `scale(${currentScale})`;
}