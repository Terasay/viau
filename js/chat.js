// Глобальные переменные
let currentUser = null;
let messages = [];
let onlineUsers = [];
let ws = null;

// Для предпросмотра файлов
let selectedFiles = [];
let filePreviewContainer = null;

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

// Последнее сообщение для группировки
let lastMessageData = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // --- Emoji alias map (базовые, можно расширить) ---
    const emojiAliasMap = {
        ':smile:': '😄', ':laughing:': '😆', ':blush:': '😊', ':heart:': '❤️', ':thumbsup:': '👍',
        ':sob:': '😭', ':joy:': '😂', ':wink:': '😉', ':sunglasses:': '😎', ':thinking:': '🤔',
        ':fire:': '🔥', ':star:': '⭐', ':100:': '💯', ':clap:': '👏', ':ok_hand:': '👌',
        ':grin:': '😁', ':cry:': '😢', ':angry:': '😠', ':kiss:': '😘', ':wave:': '👋',
        ':pray:': '🙏', ':see_no_evil:': '🙈', ':tada:': '🎉', ':poop:': '💩', ':cat:': '🐱',
        ':dog:': '🐶', ':upside_down:': '🙃', ':eyes:': '👀', ':zzz:': '💤', ':skull:': '💀',
        ':monkey:': '🐵', ':apple:': '🍎', ':peach:': '🍑', ':eggplant:': '🍆', ':rocket:': '🚀',
        ':unicorn:': '🦄', ':muscle:': '💪', ':broken_heart:': '💔', ':confetti_ball:': '🎊', ':crown:': '👑',
        ':checkered_flag:': '🏁', ':soccer:': '⚽', ':basketball:': '🏀', ':football:': '🏈', ':tennis:': '🎾',
        ':ping_pong:': '🏓', ':medal:': '🏅', ':trophy:': '🏆', ':gem:': '💎', ':moneybag:': '💰',
        ':robot:': '🤖', ':alien:': '👽', ':ghost:': '👻', ':clown:': '🤡', ':nerd:': '🤓',
        ':star_struck:': '🤩', ':partying_face:': '🥳', ':exploding_head:': '🤯', ':shushing_face:': '🤫', ':facepalm:': '🤦',
        ':shrug:': '🤷', ':man_shrugging:': '🤷‍♂️', ':woman_shrugging:': '🤷‍♀️', ':man_dancing:': '🕺', ':dancer:': '💃',
        ':man_facepalming:': '🤦‍♂️', ':woman_facepalming:': '🤦‍♀️', ':v:': '✌️', ':peace:': '✌️', ':wave:': '👋',
        ':smirk:': '😏', ':neutral_face:': '😐', ':expressionless:': '😑', ':no_mouth:': '😶', ':grinning:': '😀',
        ':relieved:': '😌', ':sleeping:': '😴', ':mask:': '😷', ':scream:': '😱', ':confused:': '😕',
        ':yum:': '😋', ':stuck_out_tongue:': '😛', ':money_mouth:': '🤑', ':hugs:': '🤗', ':thinking_face:': '🤔'
    };

    // --- Автозамена :alias: на emoji ---
    function replaceEmojiAliases(text) {
        return text.replace(/:([a-zA-Z0-9_]+):/g, (match) => emojiAliasMap[match] || match);
    }

    // При вводе — автозамена alias на emoji и применяем twemoji сразу
    messageInput.addEventListener('input', (e) => {
        const cursor = messageInput.selectionStart;
        const newText = replaceEmojiAliases(messageInput.value);
        if (newText !== messageInput.value) {
            messageInput.value = newText;
            messageInput.selectionStart = messageInput.selectionEnd = cursor;
        }
        // Применяем twemoji к полю ввода для красивого отображения
        if (window.twemoji) {
            // Создаем временный элемент для парсинга
            const temp = document.createElement('div');
            temp.textContent = messageInput.value;
            twemoji.parse(temp);
        }
    });

    // При отправке — автозамена alias на emoji (на всякий случай)
    const origSendMessage = sendMessage;
    window.sendMessage = function() {
        messageInput.value = replaceEmojiAliases(messageInput.value);
        origSendMessage();
    };

    await checkAuth();
    setupEventListeners();
    setupImageModal();

    // Создаём контейнер для предпросмотра файлов
    filePreviewContainer = document.createElement('div');
    filePreviewContainer.id = 'filePreviewContainer';
    filePreviewContainer.style.display = 'flex';
    filePreviewContainer.style.flexWrap = 'wrap';
    filePreviewContainer.style.gap = '10px';
    filePreviewContainer.style.margin = '10px 0';
    messagesContainer.parentNode.insertBefore(filePreviewContainer, messagesContainer);

    // --- Emoji Picker ---
    const emojiPicker = document.createElement('emoji-picker');
    emojiPicker.style.position = 'absolute';
    emojiPicker.style.bottom = '70px';
    emojiPicker.style.right = '40px';
    emojiPicker.style.zIndex = '1000';
    emojiPicker.style.display = 'none';
    document.body.appendChild(emojiPicker);

    // Кнопка для открытия emoji picker
    const emojiBtn = document.createElement('button');
    emojiBtn.id = 'emojiBtn';
    emojiBtn.className = 'btn-emoji';
    emojiBtn.type = 'button';
    emojiBtn.title = 'Эмодзи';
    emojiBtn.innerHTML = '<i class="fas fa-smile"></i>';
    
    // Вставляем кнопку перед sendBtn
    const inputWrapper = document.querySelector('.input-wrapper');
    inputWrapper.insertBefore(emojiBtn, inputWrapper.querySelector('#sendBtn'));
    inputWrapper.style.position = 'relative';
    emojiPicker.style.bottom = '60px';
    emojiPicker.style.left = '0';

    emojiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
        if (emojiPicker.style.display === 'block') {
            emojiPicker.style.left = '0px';
            emojiPicker.style.right = '';
            setTimeout(() => {
                const pickerRect = emojiPicker.getBoundingClientRect();
                const wrapperRect = inputWrapper.getBoundingClientRect();
                const windowWidth = window.innerWidth;
                if (pickerRect.right > windowWidth) {
                    let shift = pickerRect.right - windowWidth + 8;
                    let left = parseInt(emojiPicker.style.left || '0', 10) - shift;
                    if (wrapperRect.left + left < 0) left = -wrapperRect.left + 8;
                    emojiPicker.style.left = left + 'px';
                }
            }, 0);
        }
    });

    // Вставка emoji в поле ввода
    emojiPicker.addEventListener('emoji-click', (event) => {
        const emoji = event.detail.unicode;
        const input = document.getElementById('messageInput');
        if (input) {
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const value = input.value;
            input.value = value.slice(0, start) + emoji + value.slice(end);
            input.focus();
            input.selectionStart = input.selectionEnd = start + emoji.length;
            
            // Обновляем счетчик символов
            updateCharCounter();
        }
        emojiPicker.style.display = 'none';
    });

    // Закрытие picker при клике вне
    document.addEventListener('click', (e) => {
        if (emojiPicker.style.display === 'block' && !emojiPicker.contains(e.target) && e.target !== emojiBtn) {
            emojiPicker.style.display = 'none';
        }
    });
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
        charCounter.style.color = 'var(--danger)';
    } else {
        charCounter.style.color = 'var(--text-tertiary)';
    }
}

// Инициализация чата
function initChat() {
    const userInfoSpan = userInfo.querySelector('span');
    if (userInfoSpan) {
        userInfoSpan.textContent = currentUser.username + (currentUser.role === 'admin' ? ' (админ)' : '');
    }
    if (currentUser.muted) {
        showMutedNotice();
    }
    loadChatHistory();
    setupWebSocket();
}

// Загрузка истории чата
function loadChatHistory() {
    fetch('/chat/messages', {
        method: 'GET'
    })
    .then(res => res.json())
    .then(data => {
        messages = [];
        messagesContainer.innerHTML = '';
        lastMessageData = null; // Сбрасываем группировку
        data.messages.forEach(msg => {
            addMessage(msg, false);
        });
        // После загрузки истории — парсим emoji
        if (window.twemoji) {
            twemoji.parse(messagesContainer);
        }
        scrollToBottom();
    })
    .catch(e => {
        console.error('Ошибка загрузки истории:', e);
    });
}

// Обновление списка пользователей онлайн
function updateOnlineUsers(users) {
    onlineUsers = users || [];
    const onlineCountElement = document.querySelector('.online-count');
    if (onlineCountElement) {
        const countText = onlineCountElement.querySelector('i').nextSibling;
        if (countText) {
            countText.textContent = ` ${onlineUsers.length} онлайн`;
        } else {
            onlineCountElement.innerHTML = `<i class="fas fa-circle"></i> ${onlineUsers.length} онлайн`;
        }
    }
    
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

// Функция для проверки, нужно ли группировать сообщения
function shouldGroupMessage(newMessageData) {
    if (!lastMessageData) return false;
    
    // Проверяем, что от одного пользователя
    if (lastMessageData.username !== newMessageData.username) return false;
    
    // Проверяем разницу во времени (15 минут = 900000 мс)
    const lastTime = new Date(lastMessageData.timestamp);
    const newTime = new Date(newMessageData.timestamp);
    const timeDiff = Math.abs(newTime - lastTime);
    
    if (timeDiff > 900000) return false; // 15 минут
    
    return true;
}

// Добавление сообщения
function addMessage(messageData, save = true) {
    const isGrouped = shouldGroupMessage(messageData);
    
    const message = document.createElement('div');
    message.className = 'message';
    if (messageData.username === currentUser.username) {
        message.classList.add('own');
    }
    
    // Добавляем класс для группированных сообщений
    if (isGrouped) {
        message.classList.add('grouped');
    }
    
    message.dataset.id = messageData.id;
    
    // Аватар показываем только если не группированное
    if (!isGrouped) {
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = messageData.username[0].toUpperCase();
        message.appendChild(avatar);
    } else {
        // Для группированных сообщений добавляем пустой div для отступа
        const spacer = document.createElement('div');
        spacer.style.width = '40px';
        spacer.style.flexShrink = '0';
        message.appendChild(spacer);
    }
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    // Заголовок показываем только если не группированное
    if (!isGrouped) {
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
        content.appendChild(header);
    }
    
    const text = document.createElement('div');
    text.className = 'message-text';
    if (/<img|<a/.test(messageData.text)) {
        text.innerHTML = messageData.text;
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
    content.appendChild(text);

    // Кнопки редактирования и удаления
    const canEditOrDelete = (messageData.username === currentUser.username) || (currentUser.role === 'admin');
    if (canEditOrDelete && messageData.id) {
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        
        // Кнопка удалить
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Удалить';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = async (e) => {
            e.stopPropagation();
            if (confirm('Удалить сообщение?')) {
                await deleteMessageApi(messageData.id);
            }
        };
        actions.appendChild(deleteBtn);
        
        // Кнопка редактировать
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Редактировать';
        editBtn.className = 'edit-btn';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            showEditMessageInput(message, messageData, text, actions);
        };
        actions.appendChild(editBtn);
        content.appendChild(actions);
    }

    message.appendChild(content);
    messagesContainer.appendChild(message);
    
    // Рендерим emoji через Twemoji
    if (window.twemoji) {
        twemoji.parse(message);
    }
    
    scrollToBottom();
    
    // Обновляем последнее сообщение для группировки
    lastMessageData = messageData;
}

// Функция для редактирования сообщения
function showEditMessageInput(messageElem, msgData, textElem, actionsElem) {
    textElem.style.display = 'none';
    if (actionsElem) actionsElem.style.display = 'none';
    
    const content = messageElem.querySelector('.message-content');
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.value = msgData.text.replace(/<[^>]+>/g, '');
    editInput.className = 'edit-input';
    content.appendChild(editInput);
    
    const btnContainer = document.createElement('div');
    btnContainer.className = 'edit-buttons';
    
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Сохранить';
    saveBtn.className = 'save-btn';
    saveBtn.onclick = async () => {
        const newText = editInput.value.trim();
        if (!newText) return alert('Текст не может быть пустым');
        await editMessageApi(msgData.id, newText);
    };
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Отмена';
    cancelBtn.className = 'cancel-btn';
    cancelBtn.onclick = () => {
        editInput.remove();
        btnContainer.remove();
        textElem.style.display = '';
        if (actionsElem) actionsElem.style.display = 'none';
    };
    
    btnContainer.appendChild(saveBtn);
    btnContainer.appendChild(cancelBtn);
    content.appendChild(btnContainer);
}

// --- WebSocket ---
function setupWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}/ws/chat`;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        const token = localStorage.getItem('token');
        ws.send(JSON.stringify({ token }));
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'message' && data.message) {
                addMessage(data.message, false);
                loadChatHistory();
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
        setTimeout(setupWebSocket, 2000);
    };
}

// API для удаления сообщения
async function deleteMessageApi(id) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/chat/delete_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.success) {
            loadChatHistory();
        } else {
            alert(data.error || 'Ошибка удаления');
        }
    } catch (e) {
        alert('Ошибка удаления');
    }
}

// API для редактирования сообщения
async function editMessageApi(id, text) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/chat/edit_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ id, text })
        });
        const data = await res.json();
        if (data.success) {
            loadChatHistory();
        } else {
            alert(data.error || 'Ошибка редактирования');
        }
    } catch (e) {
        alert('Ошибка редактирования');
    }
}

// --- Переопределение sendMessage для WebSocket ---
function sendMessage() {
    const text = messageInput.value.trim();
    if (!text && selectedFiles.length === 0) return;
    if (currentUser.muted) {
        alert('Вы не можете отправлять сообщения, так как вы замучены');
        return;
    }
    const token = localStorage.getItem('token');
    if (ws && ws.readyState === WebSocket.OPEN) {
        if (selectedFiles.length > 0) {
            uploadAllFiles(selectedFiles, text, token);
        } else {
            ws.send(JSON.stringify({ token, text }));
        }
        messageInput.value = '';
        updateCharCounter();
        clearFilePreview();
    } else {
        alert('Нет соединения с сервером');
    }
}

// Форматирование времени
function formatTime(date) {
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
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    messageInput.addEventListener('input', updateCharCounter);
    logoutBtn.addEventListener('click', logout);
    
    if (mainBtn) {
        mainBtn.addEventListener('click', () => {
            window.location.href = '/';
        });
    }
    
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const icon = themeBtn.querySelector('i');
            if (document.body.classList.contains('dark-theme')) {
                localStorage.setItem('theme', 'dark');
                icon.className = 'fas fa-sun';
            } else {
                localStorage.setItem('theme', 'light');
                icon.className = 'fas fa-moon';
            }
        });
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            const icon = themeBtn.querySelector('i');
            if (icon) icon.className = 'fas fa-sun';
        }
    }
    
    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => {
            fileInput.click();
        });
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    messageInput.addEventListener('paste', handlePasteFile);
}

// Остальные функции для работы с файлами остаются без изменений
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        addFileToPreview(file);
    });
    fileInput.value = '';
}

function addFileToPreview(file) {
    if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) return;
    selectedFiles.push(file);
    renderFilePreview();
}

function renderFilePreview() {
    if (!filePreviewContainer) return;
    filePreviewContainer.innerHTML = '';
    selectedFiles.forEach((file, idx) => {
        const preview = document.createElement('div');
        preview.style.position = 'relative';
        preview.style.display = 'flex';
        preview.style.flexDirection = 'column';
        preview.style.alignItems = 'center';
        preview.style.border = '1px solid var(--border)';
        preview.style.borderRadius = 'var(--radius)';
        preview.style.padding = '8px';
        preview.style.background = 'var(--bg-tertiary)';
        preview.style.maxWidth = '120px';
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.style.position = 'absolute';
        removeBtn.style.top = '4px';
        removeBtn.style.right = '4px';
        removeBtn.style.background = 'var(--danger)';
        removeBtn.style.color = '#fff';
        removeBtn.style.border = 'none';
        removeBtn.style.borderRadius = '50%';
        removeBtn.style.width = '24px';
        removeBtn.style.height = '24px';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.display = 'flex';
        removeBtn.style.alignItems = 'center';
        removeBtn.style.justifyContent = 'center';
        removeBtn.onclick = () => {
            selectedFiles.splice(idx, 1);
            renderFilePreview();
        };
        preview.appendChild(removeBtn);
        
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.style.maxWidth = '100px';
            img.style.maxHeight = '100px';
            img.style.borderRadius = 'var(--radius)';
            img.src = URL.createObjectURL(file);
            preview.appendChild(img);
        } else {
            const icon = document.createElement('div');
            icon.innerHTML = '<i class="fas fa-file" style="font-size: 40px;"></i>';
            preview.appendChild(icon);
        }
        
        const name = document.createElement('div');
        name.textContent = file.name;
        name.style.fontSize = '11px';
        name.style.wordBreak = 'break-all';
        name.style.marginTop = '4px';
        name.style.textAlign = 'center';
        preview.appendChild(name);
        filePreviewContainer.appendChild(preview);
    });
}

function clearFilePreview() {
    selectedFiles = [];
    renderFilePreview();
}

function uploadAllFiles(files, text, token) {
    let uploaded = [];
    let errors = [];
    let count = files.length;
    files.forEach(file => {
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
                uploaded.push({ url: data.url, type: file.type });
            } else {
                errors.push(data.error || 'Ошибка загрузки файла');
            }
        })
        .catch(() => {
            errors.push('Ошибка загрузки файла');
        })
        .finally(() => {
        count--;
        if (count === 0) {
            let msgText = text;
            uploaded.forEach(f => {
                if (f.type.startsWith('image/')) {
                    msgText += `<img src="${f.url}" alt="image" style="max-width:300px;max-height:300px;">`;
                } else {
                    msgText += `<a href="${f.url}" target="_blank">Документ</a>`;
                }
            });
            if (msgText) {
                ws.send(JSON.stringify({ token, text: msgText }));
            }
            if (errors.length > 0) {
                alert(errors.join('\n'));
            }
        }
    });
});
}
function handlePasteFile(e) {
const items = e.clipboardData.items;
for (let i = 0; i < items.length; i++) {
const item = items[i];
if (item.kind === 'file') {
const file = item.getAsFile();
if (file) {
addFileToPreview(file);
e.preventDefault();
break;
}
}
}
}
// --- Модальное окно для просмотра изображений ---
function setupImageModal() {
if (document.getElementById('imageModal')) return;
imageModal = document.createElement('div');
imageModal.id = 'imageModal';
imageModal.style.position = 'fixed';
imageModal.style.top = '0';
imageModal.style.left = '0';
imageModal.style.width = '100vw';
imageModal.style.height = '100vh';
imageModal.style.background = 'rgba(0,0,0,0.9)';
imageModal.style.display = 'none';
imageModal.style.alignItems = 'center';
imageModal.style.justifyContent = 'center';
imageModal.style.zIndex = '9999';
imageModal.innerHTML =         <div style="position:relative;max-width:90vw;max-height:90vh;display:flex;flex-direction:column;align-items:center;">             <img id="modalImg" src="" style="max-width:90vw;max-height:80vh;border-radius:12px;box-shadow:0 0 40px #000;transition:transform 0.2s;" />             <div style="margin-top:20px;display:flex;gap:12px;">                 <button id="modalZoomIn" style="padding:10px 18px;border-radius:var(--radius-full);border:none;background:var(--primary);color:#fff;font-size:18px;cursor:pointer;"><i class="fas fa-plus"></i></button>                 <button id="modalZoomOut" style="padding:10px 18px;border-radius:var(--radius-full);border:none;background:var(--primary);color:#fff;font-size:18px;cursor:pointer;"><i class="fas fa-minus"></i></button>                 <button id="modalZoomReset" style="padding:10px 18px;border-radius:var(--radius-full);border:none;background:var(--secondary);color:#fff;font-size:14px;cursor:pointer;">Сброс</button>                 <button id="modalClose" style="padding:10px 18px;border-radius:var(--radius-full);border:none;background:var(--danger);color:#fff;font-size:14px;cursor:pointer;"><i class="fas fa-times"></i> Закрыть</button>             </div>         </div>    ;
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