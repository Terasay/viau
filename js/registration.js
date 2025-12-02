let currentUser = null;
let hasApplication = false;

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    setupEventListeners();
    setupCharCounters();
});

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
    document.getElementById('characterName').value = app.character_name || '';
    document.getElementById('country').value = app.country || '';
    document.getElementById('age').value = app.age || '';
    document.getElementById('experience').value = app.experience || '';
    document.getElementById('playtime').value = app.playtime || '';
    document.getElementById('motivation').value = app.motivation || '';
    document.getElementById('skills').value = app.skills || '';
    document.getElementById('additionalInfo').value = app.additional_info || '';
    document.getElementById('rulesAccept').checked = true;
    document.getElementById('fairPlay').checked = true;
    
    // Обновляем счётчики
    updateCharCounter('motivation', 'motivationCounter');
    updateCharCounter('skills', 'skillsCounter');
    updateCharCounter('additionalInfo', 'additionalCounter');
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
    
    // Кнопка отправки формы
    document.getElementById('submitBtn').addEventListener('click', handleSubmit);
    
    // Кнопка очистки формы
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (confirm('Вы уверены что хотите очистить форму?')) {
            document.getElementById('applicationForm').reset();
            updateAllCounters();
        }
    });
    
    // Кнопка редактирования заявки
    document.getElementById('editApplicationBtn').addEventListener('click', () => {
        enableForm();
        document.getElementById('applicationStatus').style.display = 'none';
    });
    
    // Кнопка отзыва заявки
    document.getElementById('cancelApplicationBtn').addEventListener('click', handleCancelApplication);
}

function setupCharCounters() {
    const textareas = [
        { id: 'motivation', counter: 'motivationCounter' },
        { id: 'skills', counter: 'skillsCounter' },
        { id: 'additionalInfo', counter: 'additionalCounter' }
    ];
    
    textareas.forEach(({ id, counter }) => {
        const textarea = document.getElementById(id);
        textarea.addEventListener('input', () => {
            updateCharCounter(id, counter);
        });
    });
}

function updateCharCounter(textareaId, counterId) {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    counter.textContent = textarea.value.length;
}

function updateAllCounters() {
    updateCharCounter('motivation', 'motivationCounter');
    updateCharCounter('skills', 'skillsCounter');
    updateCharCounter('additionalInfo', 'additionalCounter');
}

async function handleSubmit() {
    // Валидация формы
    const characterName = document.getElementById('characterName').value.trim();
    const country = document.getElementById('country').value;
    const age = document.getElementById('age').value;
    const experience = document.getElementById('experience').value;
    const playtime = document.getElementById('playtime').value;
    const motivation = document.getElementById('motivation').value.trim();
    const rulesAccept = document.getElementById('rulesAccept').checked;
    const fairPlay = document.getElementById('fairPlay').checked;
    
    if (!characterName || !country || !age || !experience || !playtime || !motivation) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }
    
    if (!rulesAccept || !fairPlay) {
        alert('Необходимо согласиться с правилами игры');
        return;
    }
    
    const applicationData = {
        character_name: characterName,
        country: country,
        age: parseInt(age),
        experience: experience,
        playtime: parseInt(playtime),
        motivation: motivation,
        skills: document.getElementById('skills').value.trim(),
        additional_info: document.getElementById('additionalInfo').value.trim()
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
