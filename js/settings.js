// Состояние приложения
let currentUser = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadUserData();
    loadTheme();
});

// Инициализация приложения
function initializeApp() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Навигация по разделам
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
        });
    });

    // Загрузка аватара
    const avatarUpload = document.getElementById('avatarUpload');
    avatarUpload.addEventListener('change', handleAvatarUpload);

    // Удаление аватара
    const removeAvatar = document.getElementById('removeAvatar');
    removeAvatar.addEventListener('click', handleRemoveAvatar);

    // Форма смены пароля
    const changePasswordForm = document.getElementById('changePasswordForm');
    changePasswordForm.addEventListener('submit', handleChangePassword);

    // Проверка силы пароля
    const newPasswordInput = document.getElementById('newPassword');
    newPasswordInput.addEventListener('input', checkPasswordStrength);

    // Переключение видимости пароля
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', togglePasswordVisibility);
    });

    // Переключение темы
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', toggleTheme);

    // Выбор темы
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            setTheme(theme);
        });
    });
}

// Загрузка данных пользователя
async function loadUserData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/me', {
            headers: {
                'Authorization': token
            }
        });

        const data = await response.json();
        
        if (data.logged_in) {
            currentUser = data;
            displayUserData(data);
            if (data.avatar) {
                displayAvatar(data.avatar);
            }
        } else {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showToast('Ошибка загрузки данных', 'error');
    }
}

// Отображение данных пользователя
function displayUserData(user) {
    document.getElementById('usernameValue').textContent = user.username;
    document.getElementById('emailValue').textContent = user.email || 'Не указан';
    document.getElementById('userIdValue').textContent = '#' + user.id;
    document.getElementById('countryValue').textContent = user.country || 'Не указана';
    
    // Вместо даты создания показываем статус мута
    const mutedInfo = user.muted ? 
        (user.mute_until ? `Замучен до ${formatDate(user.mute_until)}` : 'Замучен') : 
        'Нет';
    document.getElementById('createdAtValue').textContent = mutedInfo;
    
    const roleValue = document.getElementById('roleValue');
    roleValue.textContent = user.role === 'admin' ? 'Администратор' : 'Пользователь';
    if (user.role === 'admin') {
        roleValue.classList.add('admin');
    }

    // Установка инициалов для аватара
    const initials = user.username.substring(0, 2).toUpperCase();
    document.getElementById('avatarInitials').textContent = initials;
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) {
        return 'Не указана';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Переключение между разделами
function switchSection(sectionName) {
    // Обновление активного пункта навигации
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Переключение секций
    document.querySelectorAll('.settings-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionName}-section`).classList.add('active');
}

// Отображение аватара
function displayAvatar(avatarUrl) {
    const avatarImage = document.getElementById('avatarImage');
    const avatarInitials = document.getElementById('avatarInitials');
    const removeButton = document.getElementById('removeAvatar');

    avatarImage.src = avatarUrl;
    avatarImage.style.display = 'block';
    avatarInitials.style.display = 'none';
    removeButton.style.display = 'flex';
}

// Скрытие аватара
function hideAvatar() {
    const avatarImage = document.getElementById('avatarImage');
    const avatarInitials = document.getElementById('avatarInitials');
    const removeButton = document.getElementById('removeAvatar');

    avatarImage.style.display = 'none';
    avatarInitials.style.display = 'block';
    removeButton.style.display = 'none';
}

// Обработка загрузки аватара
async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
        showToast('Пожалуйста, выберите изображение', 'error');
        return;
    }

    // Проверка размера файла (5 МБ)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Размер файла не должен превышать 5 МБ', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/avatar/upload', {
            method: 'POST',
            headers: {
                'Authorization': token
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            displayAvatar(data.avatar_url);
            showToast('Аватар успешно загружен', 'success');
            
            // Обновляем данные пользователя
            if (currentUser) {
                currentUser.avatar = data.avatar_url;
            }
        } else {
            showToast(data.error || 'Ошибка загрузки аватара', 'error');
        }
    } catch (error) {
        console.error('Ошибка загрузки аватара:', error);
        showToast('Ошибка загрузки аватара', 'error');
    }
    
    // Сбрасываем input для возможности загрузки того же файла
    e.target.value = '';
}

// Удаление аватара
async function handleRemoveAvatar() {
    if (!currentUser || !currentUser.avatar) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/avatar/delete', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            hideAvatar();
            showToast('Аватар удалён', 'success');
            
            // Обновляем данные пользователя
            if (currentUser) {
                currentUser.avatar = null;
            }
        } else {
            showToast(data.error || 'Ошибка удаления аватара', 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления аватара:', error);
        showToast('Ошибка удаления аватара', 'error');
    }
}

// Обработка смены пароля
async function handleChangePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Валидация
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Заполните все поля', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('Пароль должен содержать минимум 6 символов', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('Пароли не совпадают', 'error');
        return;
    }

    if (currentPassword === newPassword) {
        showToast('Новый пароль должен отличаться от текущего', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });

        const data = await response.json();
        
        if (data.success) {
            showToast('Пароль успешно изменён', 'success');
            e.target.reset();
            document.getElementById('passwordStrength').className = 'password-strength';
            document.querySelector('.strength-text').textContent = 'Введите пароль';
        } else {
            showToast(data.error || 'Ошибка смены пароля', 'error');
        }

    } catch (error) {
        console.error('Ошибка смены пароля:', error);
        showToast('Ошибка смены пароля', 'error');
    }
}

// Проверка силы пароля
function checkPasswordStrength(e) {
    const password = e.target.value;
    const strengthElement = document.getElementById('passwordStrength');
    const strengthText = strengthElement.querySelector('.strength-text');

    if (!password) {
        strengthElement.className = 'password-strength';
        strengthText.textContent = 'Введите пароль';
        return;
    }

    let strength = 0;
    
    // Проверки
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    // Установка класса и текста
    if (strength <= 2) {
        strengthElement.className = 'password-strength weak';
        strengthText.textContent = 'Слабый пароль';
    } else if (strength <= 3) {
        strengthElement.className = 'password-strength medium';
        strengthText.textContent = 'Средний пароль';
    } else {
        strengthElement.className = 'password-strength strong';
        strengthText.textContent = 'Надёжный пароль';
    }
}

// Переключение видимости пароля
function togglePasswordVisibility(e) {
    const button = e.currentTarget;
    const targetId = button.dataset.target;
    const input = document.getElementById(targetId);
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Загрузка темы
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    
    // Установка активной опции темы
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('active');
        if (option.dataset.theme === savedTheme) {
            option.classList.add('active');
        }
    });
}

// Применение темы
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        document.querySelector('#themeToggle i').classList.replace('fa-moon', 'fa-sun');
    } else if (theme === 'light') {
        document.body.classList.remove('dark-theme');
        document.querySelector('#themeToggle i').classList.replace('fa-sun', 'fa-moon');
    } else if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.body.classList.add('dark-theme');
            document.querySelector('#themeToggle i').classList.replace('fa-moon', 'fa-sun');
        } else {
            document.body.classList.remove('dark-theme');
            document.querySelector('#themeToggle i').classList.replace('fa-sun', 'fa-moon');
        }
    }
}

// Установка темы
function setTheme(theme) {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
    
    // Обновление активной опции
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('active');
        if (option.dataset.theme === theme) {
            option.classList.add('active');
        }
    });
    
    showToast('Тема успешно изменена', 'success');
}

// Переключение темы (кнопка в хедере)
function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Показ уведомления
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('.toast-icon i');
    const title = toast.querySelector('.toast-title');
    const messageElement = toast.querySelector('.toast-message');

    // Установка типа
    toast.className = 'toast';
    if (type === 'error') {
        toast.classList.add('error');
        icon.className = 'fas fa-times-circle';
        title.textContent = 'Ошибка';
    } else if (type === 'warning') {
        toast.classList.add('warning');
        icon.className = 'fas fa-exclamation-triangle';
        title.textContent = 'Внимание';
    } else {
        icon.className = 'fas fa-check-circle';
        title.textContent = 'Успешно';
    }

    messageElement.textContent = message;

    // Показ
    toast.classList.add('show');

    // Скрытие через 3 секунды
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Слушатель изменения системной темы
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const theme = localStorage.getItem('theme');
    if (theme === 'auto') {
        applyTheme('auto');
    }
});