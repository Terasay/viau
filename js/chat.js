// Глобальные переменные
let currentUser = null;
let messages = [];
let onlineUsers = [];
let ws = null;
let userAvatarsCache = {};

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

// Настройки
let chatSettings = {
    textSize: 15,
    emojiSize: 20
};
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
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');

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
        ':man_facepalming:': '🤦‍♂️', ':woman_facepalming:': '🤦‍♀️', ':v:': '✌️', ':peace:': '✌️',
        ':smirk:': '😏', ':neutral_face:': '😐', ':expressionless:': '😑', ':no_mouth:': '😶', ':grinning:': '😀',
        ':relieved:': '😌', ':sleeping:': '😴', ':mask:': '😷', ':scream:': '😱', ':confused:': '😕',
        ':yum:': '😋', ':stuck_out_tongue:': '😛', ':money_mouth:': '🤑', ':hugs:': '🤗', ':thinking_face:': '🤔'
    };

    // --- Автозамена :alias: на emoji ---
    function replaceEmojiAliases(text) {
        return text.replace(/:([a-zA-Z0-9_]+):/g, (match) => emojiAliasMap[match] || match);
    }

    // При вводе — автозамена alias на emoji и рендер через Twemoji
    messageInput.addEventListener('input', (e) => {
        const cursor = messageInput.selectionStart;
        const newText = replaceEmojiAliases(messageInput.value);
        if (newText !== messageInput.value) {
            messageInput.value = newText;
            messageInput.selectionStart = messageInput.selectionEnd = cursor;
        }
        // Парсим Twemoji для поля ввода
        if (window.twemoji) {
            const parent = messageInput.parentElement;
            twemoji.parse(parent);
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
    emojiBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-4a6 6 0 0 0 6-6H6a6 6 0 0 0 6 6zm-3-7a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm6 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    // Вставляем кнопку перед sendBtn
    const inputWrapper = document.querySelector('.input-wrapper');
    inputWrapper.insertBefore(emojiBtn, inputWrapper.querySelector('#sendBtn'));
    inputWrapper.style.position = 'relative';
    emojiPicker.style.bottom = '60px';
    emojiPicker.style.left = '0';

    emojiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Показываем emoji-picker
        emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
        if (emojiPicker.style.display === 'block') {
            // Сброс позиции
            emojiPicker.style.left = '0px';
            emojiPicker.style.right = '';
            // Динамическое позиционирование
            setTimeout(() => {
                const pickerRect = emojiPicker.getBoundingClientRect();
                const wrapperRect = inputWrapper.getBoundingClientRect();
                const windowWidth = window.innerWidth;
                // Если выходит за правый край окна
                if (pickerRect.right > windowWidth) {
                    // Смещаем влево на разницу
                    let shift = pickerRect.right - windowWidth + 8; // 8px отступ
                    let left = parseInt(emojiPicker.style.left || '0', 10) - shift;
                    // Не даём уйти за левый край
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
        }
        emojiPicker.style.display = 'none';
    });

    // --- Emoji Preview Block ---
    const emojiPreview = document.createElement('div');
    emojiPreview.id = 'emojiPreview';
    emojiPreview.style.display = 'none';
    emojiPreview.style.position = 'absolute';
    emojiPreview.style.left = '0';
    emojiPreview.style.bottom = 'calc(100% + 10px)';
    emojiPreview.style.width = '220px';
    emojiPreview.style.minHeight = '60px';
    emojiPreview.style.background = 'var(--picker-bg, #fff)';
    emojiPreview.style.borderRadius = '14px';
    emojiPreview.style.boxShadow = '0 2px 16px rgba(0,0,0,0.13)';
    emojiPreview.style.padding = '12px 10px 10px 10px';
    emojiPreview.style.fontSize = '32px';
    emojiPreview.style.textAlign = 'center';
    emojiPreview.style.color = 'var(--picker-color, #222)';
    emojiPreview.style.pointerEvents = 'none';
    emojiPreview.style.transition = 'opacity 0.15s';
    emojiPreview.style.opacity = '0.98';
    emojiPreview.style.userSelect = 'none';
    emojiPreview.style.fontFamily = 'inherit';
    emojiPreview.style.lineHeight = '1.1';
    emojiPreview.innerHTML = '';
    emojiPicker.appendChild(emojiPreview);

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

async function getUserAvatar(username) {
    if (userAvatarsCache[username]) {
        return userAvatarsCache[username];
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/admin/users', {
            headers: {
                'Authorization': token
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const user = data.users.find(u => u.username === username);
            if (user && user.avatar) {
                userAvatarsCache[username] = user.avatar;
                return user.avatar;
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки аватарки:', error);
    }
    
    return null;
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

// Загрузка истории чата
function loadChatHistory() {
    fetch('/api/chat/messages', {
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

// Обновление списка пользователей онлайн
function updateOnlineUsers(users) {
    onlineUsers = users || [];
    onlineCount.textContent = `${onlineUsers.length} онлайн`;
    usersList.innerHTML = '';
    onlineUsers.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        // Попытка загрузить аватарку пользователя
        (async () => {
            let avatarUrl = null;
            if (userAvatarsCache[user.username]) {
                avatarUrl = userAvatarsCache[user.username];
            } else {
                try {
                    const res = await fetch(`/user/${encodeURIComponent(user.username)}/avatar`);
                    const data = await res.json();
                    if (data.success && data.avatar) {
                        avatarUrl = data.avatar;
                    }
                    userAvatarsCache[user.username] = avatarUrl;
                } catch (e) {
                    avatarUrl = null;
                }
            }
            if (avatarUrl) {
                avatar.innerHTML = `<img src="${avatarUrl}" alt="avatar" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">`;
            } else {
                avatar.textContent = user.username[0].toUpperCase();
            }
        })();
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
    // Проверяем, нужно ли группировать с предыдущим сообщением
    const lastMessage = messagesContainer.lastElementChild;
    let shouldGroup = false;
    
    if (lastMessage && lastMessage.classList.contains('message')) {
        const lastUsername = lastMessage.dataset.username;
        const lastTimestamp = parseInt(lastMessage.dataset.timestamp || '0');
        const currentTimestamp = messageData.timestamp ? new Date(messageData.timestamp).getTime() : Date.now();
        const timeDiff = (currentTimestamp - lastTimestamp) / 1000 / 60; // разница в минутах
        
        if (lastUsername === messageData.username && timeDiff < 15) {
            shouldGroup = true;
            // Добавляем новый текстовый блок в существующий message-content
            const lastContent = lastMessage.querySelector('.message-content');
            if (lastContent) {
                const text = document.createElement('div');
                text.className = 'message-text grouped-text';
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
                
                // Добавляем кнопки редактирования и удаления для нового текста
                const canEditOrDelete = (messageData.username === currentUser.username) || (currentUser.role === 'admin');
                if (canEditOrDelete && messageData.id) {
                    text.dataset.messageId = messageData.id;
                    const actions = document.createElement('div');
                    actions.className = 'message-actions';
                    actions.style.display = 'none';
                    actions.style.marginTop = '2px';
                    actions.style.fontSize = '11px';
                    actions.style.gap = '8px';
                    actions.style.alignItems = 'center';
                    actions.style.opacity = '0.8';
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = 'Удалить';
                    deleteBtn.className = 'delete-btn';
                    deleteBtn.style.color = '#ff6b6b';
                    deleteBtn.style.background = 'none';
                    deleteBtn.style.border = 'none';
                    deleteBtn.style.cursor = 'pointer';
                    deleteBtn.style.fontSize = '11px';
                    deleteBtn.style.padding = '0 6px';
                    deleteBtn.onclick = async (e) => {
                        e.stopPropagation();
                        if (confirm('Удалить сообщение?')) {
                            await deleteMessageApi(messageData.id);
                        }
                    };
                    actions.appendChild(deleteBtn);
                    
                    const editBtn = document.createElement('button');
                    editBtn.textContent = 'Редактировать';
                    editBtn.className = 'edit-btn';
                    editBtn.style.color = '';
                    editBtn.style.background = 'none';
                    editBtn.style.border = 'none';
                    editBtn.style.cursor = 'pointer';
                    editBtn.style.fontSize = '11px';
                    editBtn.style.padding = '0 6px';
                    editBtn.onclick = (e) => {
                        e.stopPropagation();
                        showEditMessageInputForText(text, messageData);
                    };
                    actions.appendChild(editBtn);
                    
                    const textWrapper = document.createElement('div');
                    textWrapper.style.position = 'relative';
                    textWrapper.appendChild(text);
                    textWrapper.appendChild(actions);
                    
                    textWrapper.addEventListener('mouseenter', () => {
                        actions.style.display = 'flex';
                    });
                    textWrapper.addEventListener('mouseleave', () => {
                        actions.style.display = 'none';
                    });
                    
                    lastContent.appendChild(textWrapper);
                } else {
                    lastContent.appendChild(text);
                }
                
                // Обновляем timestamp последнего сообщения
                lastMessage.dataset.timestamp = messageData.timestamp ? new Date(messageData.timestamp).getTime() : Date.now();
                
                // Рендерим emoji через Twemoji
                if (window.twemoji) {
                    twemoji.parse(text);
                }
                
                scrollToBottom();
                return;
            }
        }
    }
    
    // Создаем новое сообщение (если не группируется)
    const message = document.createElement('div');
    message.className = 'message';
    if (messageData.username === currentUser.username) {
        message.classList.add('own');
    }
    message.dataset.id = messageData.id;
    message.dataset.username = messageData.username;
    message.dataset.timestamp = messageData.timestamp ? new Date(messageData.timestamp).getTime() : Date.now();
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    // Попытка загрузить аватарку пользователя
    (async () => {
        let avatarUrl = null;
        if (userAvatarsCache[messageData.username]) {
            avatarUrl = userAvatarsCache[messageData.username];
        } else {
            try {
                const res = await fetch(`/user/${encodeURIComponent(messageData.username)}/avatar`);
                const data = await res.json();
                if (data.success && data.avatar) {
                    avatarUrl = data.avatar;
                }
                userAvatarsCache[messageData.username] = avatarUrl;
            } catch (e) {
                avatarUrl = null;
            }
        }
        if (avatarUrl) {
            avatar.innerHTML = `<img src="${avatarUrl}" alt="avatar" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">`;
        } else {
            avatar.textContent = messageData.username[0].toUpperCase();
        }
    })();
    message.appendChild(avatar);
    
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
    content.appendChild(header);
    
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
        actions.style.display = 'none';
        actions.style.marginTop = '2px';
        actions.style.fontSize = '11px';
        actions.style.gap = '8px';
        actions.style.alignItems = 'center';
        actions.style.opacity = '0.8';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Удалить';
        deleteBtn.className = 'delete-btn';
        deleteBtn.style.color = '#ff6b6b';
        deleteBtn.style.background = 'none';
        deleteBtn.style.border = 'none';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontSize = '11px';
        deleteBtn.style.padding = '0 6px';
        deleteBtn.onclick = async (e) => {
            e.stopPropagation();
            if (confirm('Удалить сообщение?')) {
                await deleteMessageApi(messageData.id);
            }
        };
        actions.appendChild(deleteBtn);
        
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Редактировать';
        editBtn.className = 'edit-btn';
        editBtn.style.color = '';
        editBtn.style.background = 'none';
        editBtn.style.border = 'none';
        editBtn.style.cursor = 'pointer';
        editBtn.style.fontSize = '11px';
        editBtn.style.padding = '0 6px';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            showEditMessageInput(message, messageData, text);
        };
        actions.appendChild(editBtn);
        content.appendChild(actions);
        
        message.addEventListener('mouseenter', () => {
            actions.style.display = 'flex';
        });
        message.addEventListener('mouseleave', () => {
            actions.style.display = 'none';
        });
    }

    message.appendChild(content);
    messagesContainer.appendChild(message);
    
    // Рендерим emoji через Twemoji
    if (window.twemoji) {
        twemoji.parse(message);
    }
    
    scrollToBottom();

    // Функция редактирования для группированного текста
    function showEditMessageInputForText(textElem, msgData) {
        const originalText = textElem.textContent || textElem.innerText;
        textElem.style.display = 'none';
        
        const parentWrapper = textElem.parentElement;
        const actionsElem = parentWrapper.querySelector('.message-actions');
        if (actionsElem) actionsElem.style.display = 'none';
        
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.value = msgData.text.replace(/<[^>]+>/g, '');
        editInput.style.fontSize = '13px';
        editInput.style.width = '90%';
        editInput.style.marginTop = '4px';
        editInput.style.borderRadius = '6px';
        editInput.style.border = '1px solid #ccc';
        editInput.style.padding = '4px 8px';
        parentWrapper.insertBefore(editInput, textElem);
        
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Сохранить';
        saveBtn.style.fontSize = '11px';
        saveBtn.style.marginLeft = '6px';
        saveBtn.style.background = 'var(--btn-bg)';
        saveBtn.style.color = 'var(--btn-color)';
        saveBtn.style.border = 'none';
        saveBtn.style.borderRadius = '6px';
        saveBtn.style.cursor = 'pointer';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Отмена';
        cancelBtn.style.fontSize = '11px';
        cancelBtn.style.marginLeft = '6px';
        cancelBtn.style.background = 'none';
        cancelBtn.style.color = '#999';
        cancelBtn.style.border = 'none';
        cancelBtn.style.cursor = 'pointer';
        
        parentWrapper.insertBefore(saveBtn, textElem);
        parentWrapper.insertBefore(cancelBtn, textElem);
        
        saveBtn.onclick = async () => {
            const newText = editInput.value.trim();
            if (!newText) return alert('Текст не может быть пустым');
            await editMessageApi(msgData.id, newText);
        };
        
        cancelBtn.onclick = () => {
            editInput.remove();
            saveBtn.remove();
            cancelBtn.remove();
            textElem.style.display = '';
            if (actionsElem) actionsElem.style.display = 'none';
        };
    }

    // Функция редактирования для обычного сообщения
    function showEditMessageInput(messageElem, msgData, textElem) {
        textElem.style.display = 'none';
        const actionsElem = content.querySelector('.message-actions');
        if (actionsElem) actionsElem.style.display = 'none';
        
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.value = msgData.text.replace(/<[^>]+>/g, '');
        editInput.style.fontSize = '13px';
        editInput.style.width = '90%';
        editInput.style.marginTop = '4px';
        editInput.style.borderRadius = '6px';
        editInput.style.border = '1px solid #ccc';
        editInput.style.padding = '4px 8px';
        content.appendChild(editInput);
        
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Сохранить';
        saveBtn.style.fontSize = '11px';
        saveBtn.style.marginLeft = '6px';
        saveBtn.style.background = 'var(--btn-bg)';
        saveBtn.style.color = 'var(--btn-color)';
        saveBtn.style.border = 'none';
        saveBtn.style.borderRadius = '6px';
        saveBtn.style.cursor = 'pointer';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Отмена';
        cancelBtn.style.fontSize = '11px';
        cancelBtn.style.marginLeft = '6px';
        cancelBtn.style.background = 'none';
        cancelBtn.style.color = '#999';
        cancelBtn.style.border = 'none';
        cancelBtn.style.cursor = 'pointer';
        
        content.appendChild(saveBtn);
        content.appendChild(cancelBtn);
        
        saveBtn.onclick = async () => {
            const newText = editInput.value.trim();
            if (!newText) return alert('Текст не может быть пустым');
            await editMessageApi(msgData.id, newText);
        };
        
        cancelBtn.onclick = () => {
            editInput.remove();
            saveBtn.remove();
            cancelBtn.remove();
            textElem.style.display = '';
            if (actionsElem) actionsElem.style.display = 'none';
        };
    }
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
        const res = await fetch('/api/chat/edit_message', {
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

// Отправка сообщения
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
        // --- Настройки чата: обработка ползунков ---
        const textSizeSlider = document.getElementById('textSizeSlider');
        const textSizeValue = document.getElementById('textSizeValue');
        const emojiSizeSlider = document.getElementById('emojiSizeSlider');
        const emojiSizeValue = document.getElementById('emojiSizeValue');
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        const resetSettingsBtn = document.getElementById('resetSettingsBtn');

        // Функция применения настроек к чату
        function applyChatSettings() {
            // Размер текста сообщений
            document.querySelectorAll('.message-text').forEach(el => {
                el.style.fontSize = chatSettings.textSize + 'px';
            });
            // Размер эмодзи (Twemoji)
            document.querySelectorAll('.message-text img.emoji, .message-text img.twemoji').forEach(el => {
                el.style.width = chatSettings.emojiSize + 'px';
                el.style.height = chatSettings.emojiSize + 'px';
            });
        }

        // Синхронизация значений ползунков и отображения
        function syncSettingsUI() {
            if (textSizeSlider && textSizeValue) {
                textSizeSlider.value = chatSettings.textSize;
                textSizeValue.textContent = chatSettings.textSize + 'px';
            }
            if (emojiSizeSlider && emojiSizeValue) {
                emojiSizeSlider.value = chatSettings.emojiSize;
                emojiSizeValue.textContent = chatSettings.emojiSize + 'px';
            }
        }

        // Обработчики ползунков
        if (textSizeSlider && textSizeValue) {
            textSizeSlider.addEventListener('input', (e) => {
                chatSettings.textSize = parseInt(e.target.value, 10);
                textSizeValue.textContent = chatSettings.textSize + 'px';
                applyChatSettings();
            });
        }
        if (emojiSizeSlider && emojiSizeValue) {
            emojiSizeSlider.addEventListener('input', (e) => {
                chatSettings.emojiSize = parseInt(e.target.value, 10);
                emojiSizeValue.textContent = chatSettings.emojiSize + 'px';
                applyChatSettings();
            });
        }

        // Сброс настроек
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                chatSettings.textSize = 15;
                chatSettings.emojiSize = 20;
                syncSettingsUI();
                applyChatSettings();
            });
        }

        // Сохранение настроек (можно добавить сохранение в localStorage)
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                // Можно добавить сохранение в localStorage, если нужно
                settingsModal.classList.remove('active');
            });
        }

        // При открытии настроек — синхронизировать UI
        if (settingsBtn && settingsModal) {
            settingsBtn.addEventListener('click', () => {
                syncSettingsUI();
            });
        }

        // Применять настройки при загрузке
        applyChatSettings();
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
    
    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => {
            fileInput.click();
        });
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    messageInput.addEventListener('paste', handlePasteFile);

    // Открытие модального окна настроек
    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('active');
        });
        // Закрытие по клику вне модального окна или по overlay
        const overlay = settingsModal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                settingsModal.classList.remove('active');
            });
        }
    }
}

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
        preview.style.border = '1px solid #ccc';
        preview.style.borderRadius = '8px';
        preview.style.padding = '6px';
        preview.style.background = '#f9f9f9';
        preview.style.maxWidth = '120px';
        preview.style.maxHeight = '120px';
        preview.style.overflow = 'hidden';
        
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '×';
        removeBtn.style.position = 'absolute';
        removeBtn.style.top = '2px';
        removeBtn.style.right = '2px';
        removeBtn.style.background = '#ff6b6b';
        removeBtn.style.color = '#fff';
        removeBtn.style.border = 'none';
        removeBtn.style.borderRadius = '50%';
        removeBtn.style.width = '22px';
        removeBtn.style.height = '22px';
        removeBtn.style.cursor = 'pointer';
        removeBtn.onclick = () => {
            selectedFiles.splice(idx, 1);
            renderFilePreview();
        };
        preview.appendChild(removeBtn);
        
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.style.maxWidth = '100px';
            img.style.maxHeight = '100px';
            img.style.borderRadius = '6px';
            img.src = URL.createObjectURL(file);
            preview.appendChild(img);
        } else {
            const icon = document.createElement('div');
            icon.textContent = '📄';
            icon.style.fontSize = '40px';
            preview.appendChild(icon);
        }
        
        const name = document.createElement('div');
        name.textContent = file.name;
        name.style.fontSize = '12px';
        name.style.wordBreak = 'break-all';
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
        fetch('/api/chat/upload', {
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