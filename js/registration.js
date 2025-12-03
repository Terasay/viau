let currentUser = null;
let hasApplication = false;

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    await checkAuth();
    await loadCountries();
    await loadRules();
    setupEventListeners();
    setupReferralCodeInput();
});

function initTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.querySelector('#themeToggle i').className = 'fas fa-sun';
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    const themeIcon = document.querySelector('#themeToggle i');
    
    if (isDark) {
        themeIcon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        themeIcon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

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
        
        if (!response.ok) {
            throw new Error('Auth failed');
        }
        
        const data = await response.json();
        
        if (!data.logged_in) {
            showLoginModal();
            return;
        }
        
        currentUser = data;
        
        // Обновляем информацию о пользователе
        document.querySelector('#userInfo span').textContent = currentUser.username;
        
        // Проверяем есть ли уже заявка
        await checkExistingApplication();
        
    } catch (error) {
        console.error('Auth error:', error);
        showLoginModal();
    }
}

async function loadCountries() {
    try {
        const response = await fetch('/data/countries.json');
        const countries = await response.json();
        
        const countrySelect = document.getElementById('country');
        countrySelect.innerHTML = '<option value="">Выберите страну</option>';
        
        // Получаем занятые страны
        const token = localStorage.getItem('token');
        let occupiedCountries = [];
        
        if (token) {
            try {
                const occupiedResponse = await fetch('/api/registration/occupied-countries', {
                    headers: { 'Authorization': token }
                });
                if (occupiedResponse.ok) {
                    const data = await occupiedResponse.json();
                    occupiedCountries = data.countries || [];
                }
            } catch (e) {
                console.log('Could not fetch occupied countries');
            }
        }
        
        countries.forEach(country => {
            if (country.available && !occupiedCountries.includes(country.id)) {
                const option = document.createElement('option');
                option.value = country.id;
                option.textContent = country.name;
                countrySelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error loading countries:', error);
        document.getElementById('country').innerHTML = '<option value="">Ошибка загрузки</option>';
    }
}

async function loadRules() {
    try {
        const response = await fetch('/data/rules.txt');
        const rules = await response.text();
        document.getElementById('rulesContent').textContent = rules;
    } catch (error) {
        console.error('Error loading rules:', error);
        document.getElementById('rulesContent').textContent = 'Не удалось загрузить правила. Попробуйте позже.';
    }
}

function showRulesModal() {
    document.getElementById('rulesModal').classList.add('active');
}

function closeRulesModal() {
    document.getElementById('rulesModal').classList.remove('active');
}

// Делаем функцию глобальной для onclick
window.closeRulesModal = closeRulesModal;

async function checkExistingApplication() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/registration/my-application', {
            headers: {
                'Authorization': token
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.application) {
                hasApplication = true;
                showExistingApplication(data.application);
            }
        }
    } catch (error) {
        console.error('Error checking application:', error);
    }
}

function showExistingApplication(application) {
    // Показываем статус заявки
    const statusBlock = document.getElementById('applicationStatus');
    statusBlock.style.display = 'flex';
    
    // Обновляем статус
    const statusIcon = statusBlock.querySelector('.status-icon i');
    const statusTitle = statusBlock.querySelector('h3');
    const statusText = statusBlock.querySelector('p');
    
    if (application.status === 'pending') {
        statusIcon.className = 'fas fa-clock';
        statusTitle.textContent = 'Ваша заявка на рассмотрении';
        statusText.textContent = 'Администрация рассматривает вашу заявку. Вы получите уведомление о результате.';
    } else if (application.status === 'approved') {
        statusIcon.className = 'fas fa-check-circle';
        statusTitle.textContent = 'Ваша заявка одобрена!';
        statusText.textContent = 'Поздравляем! Ваша заявка была одобрена. Теперь вы полноценный игрок.';
        statusBlock.querySelector('.status-icon').style.background = 'rgba(16, 185, 129, 0.1)';
        statusBlock.querySelector('.status-icon').style.color = 'var(--success)';
    } else if (application.status === 'rejected') {
        statusIcon.className = 'fas fa-times-circle';
        statusTitle.textContent = 'Ваша заявка отклонена';
        statusText.textContent = application.rejection_reason || 'К сожалению, ваша заявка была отклонена.';
        statusBlock.querySelector('.status-icon').style.background = 'rgba(239, 68, 68, 0.1)';
        statusBlock.querySelector('.status-icon').style.color = 'var(--danger)';
    }
    
    // Заполняем форму данными из заявки
    fillFormWithApplication(application);
    
    // Блокируем форму если заявка на рассмотрении или одобрена
    if (application.status === 'pending' || application.status === 'approved') {
        disableForm();
    }
}

function fillFormWithApplication(app) {
    document.getElementById('firstName').value = app.first_name || '';
    document.getElementById('lastName').value = app.last_name || '';
    document.getElementById('countryOrigin').value = app.country_origin || '';
    document.getElementById('age').value = app.age || '';
    document.getElementById('country').value = app.country || '';
    document.getElementById('religion').value = app.religion || '';
    document.getElementById('ethnicity').value = app.ethnicity || '';
    document.getElementById('relatives').value = app.relatives || '';
    document.getElementById('referralCode').value = app.referral_code || '';
    document.getElementById('rulesAccept').checked = true;
    document.getElementById('fairPlay').checked = true;
}

function disableForm() {
    const form = document.getElementById('applicationForm');
    const inputs = form.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
        if (input.id !== 'editApplicationBtn' && input.id !== 'cancelApplicationBtn') {
            input.disabled = true;
        }
    });
}

function enableForm() {
    const form = document.getElementById('applicationForm');
    const inputs = form.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
        input.disabled = false;
    });
}

function setupEventListeners() {
    // Кнопка назад
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = '/';
    });
    
    // Переключатель темы
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Кнопка отправки формы
    document.getElementById('submitBtn').addEventListener('click', handleSubmit);
    
    // Кнопка очистки формы
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (confirm('Вы уверены что хотите очистить форму?')) {
            const form = document.getElementById('applicationForm');
            form.querySelectorAll('input[type="text"], input[type="number"], select, textarea').forEach(input => {
                input.value = '';
            });
            form.querySelectorAll('input[type="checkbox"]').forEach(input => {
                input.checked = false;
            });
        }
    });
    
    // Кнопка редактирования заявки
    document.getElementById('editApplicationBtn').addEventListener('click', () => {
        enableForm();
        document.getElementById('applicationStatus').style.display = 'none';
    });
    
    // Кнопка отзыва заявки
    document.getElementById('cancelApplicationBtn').addEventListener('click', handleCancelApplication);
    
    // Ссылка на правила
    document.getElementById('rulesLink').addEventListener('click', (e) => {
        e.preventDefault();
        showRulesModal();
    });
}

function setupReferralCodeInput() {
    const referralInput = document.getElementById('referralCode');
    referralInput.addEventListener('input', (e) => {
        // Приводим к верхнему регистру и оставляем только латинские буквы
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4);
    });
}

function setupCharCounters() {
    // Больше не используется, но оставим для обратной совместимости
}

async function handleSubmit() {
    // Валидация формы
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const countryOrigin = document.getElementById('countryOrigin').value.trim();
    const age = document.getElementById('age').value;
    const country = document.getElementById('country').value;
    const rulesAccept = document.getElementById('rulesAccept').checked;
    const fairPlay = document.getElementById('fairPlay').checked;
    
    if (!firstName || !lastName || !countryOrigin || !age || !country) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }
    
    if (!rulesAccept || !fairPlay) {
        alert('Необходимо согласиться с правилами игры');
        return;
    }
    
    const referralCode = document.getElementById('referralCode').value.trim();
    if (referralCode && (referralCode.length !== 4 || !/^[A-Z]{4}$/.test(referralCode))) {
        alert('Реферальный код должен состоять из 4 букв латинского алфавита (A-Z)');
        return;
    }
    
    const applicationData = {
        first_name: firstName,
        last_name: lastName,
        country_origin: countryOrigin,
        age: parseInt(age),
        country: country,
        religion: document.getElementById('religion').value.trim() || null,
        ethnicity: document.getElementById('ethnicity').value.trim() || null,
        relatives: document.getElementById('relatives').value.trim() || null,
        referral_code: referralCode || null
    };
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    
    try {
        const token = localStorage.getItem('token');
        const url = hasApplication ? '/api/registration/update-application' : '/api/registration/submit-application';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(applicationData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccessModal();
        } else {
            alert(data.error || 'Ошибка при отправке заявки');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Подать заявку';
        }
    } catch (error) {
        console.error('Submit error:', error);
        alert('Ошибка при отправке заявки');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Подать заявку';
    }
}

async function handleCancelApplication() {
    if (!confirm('Вы уверены что хотите отозвать заявку? Это действие нельзя отменить.')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/registration/cancel-application', {
            method: 'POST',
            headers: {
                'Authorization': token
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Заявка успешно отозвана');
            window.location.reload();
        } else {
            alert(data.error || 'Ошибка при отзыве заявки');
        }
    } catch (error) {
        console.error('Cancel error:', error);
        alert('Ошибка при отзыве заявки');
    }
}

function showSuccessModal() {
    document.getElementById('successModal').classList.add('active');
}

function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
}
