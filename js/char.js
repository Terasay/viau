// Модуль управления персонажем игрока
let currentCharacter = null;

// Названия навыков
const skillNames = {
    military: 'Военное дело',
    administration: 'Администрация',
    diplomacy: 'Дипломатия',
    intrigue: 'Интриги',
    knowledge: 'Знания'
};

// Иконки навыков
const skillIcons = {
    military: 'fa-fist-raised',
    administration: 'fa-landmark',
    diplomacy: 'fa-handshake',
    intrigue: 'fa-user-secret',
    knowledge: 'fa-book'
};

async function loadMyCharacter() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        showError('Требуется авторизация');
        return;
    }

    try {
        const response = await fetch('/api/characters/my', {
            headers: {
                'Authorization': token
            }
        });

        const data = await response.json();

        if (data.success) {
            currentCharacter = data.character;
            displayCharacter(currentCharacter);
        } else {
            showError(data.error || 'Не удалось загрузить персонажа');
        }
    } catch (error) {
        console.error('Error loading character:', error);
        showError('Ошибка при загрузке персонажа');
    }
}

function displayCharacter(character) {
    // Заполняем основную информацию
    document.getElementById('char-first-name').textContent = character.first_name;
    document.getElementById('char-last-name').textContent = character.last_name;
    document.getElementById('char-position').textContent = character.position;
    document.getElementById('char-age').textContent = character.age;
    document.getElementById('char-country').textContent = character.country;
    
    // Заполняем дополнительную информацию
    document.getElementById('char-ethnicity').textContent = character.ethnicity || 'Не указана';
    document.getElementById('char-religion').textContent = character.religion || 'Не указана';
    document.getElementById('char-relatives').textContent = character.relatives || 'Нет';
    
    // Отображаем очки навыков
    const skillPointsElement = document.getElementById('char-skill-points');
    skillPointsElement.textContent = character.skill_points || 0;
    
    // Отображаем уведомление если нет очков
    const noPointsNotice = document.querySelector('.no-points-notice');
    if (character.skill_points <= 0) {
        if (!noPointsNotice) {
            const notice = document.createElement('div');
            notice.className = 'no-points-notice';
            notice.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span>У вас нет доступных очков навыков. Очки можно получить за достижения в игре.</span>
            `;
            document.querySelector('.skills-section').insertBefore(
                notice,
                document.querySelector('.skills-grid')
            );
        }
    } else {
        if (noPointsNotice) {
            noPointsNotice.remove();
        }
    }
    
    // Отображаем навыки
    displaySkills(character);
}

function displaySkills(character) {
    const skillsGrid = document.querySelector('.skills-grid');
    skillsGrid.innerHTML = '';
    
    const skills = ['military', 'administration', 'diplomacy', 'intrigue', 'knowledge'];
    
    skills.forEach(skill => {
        const value = character[skill] || 0;
        const maxValue = 10;
        const percentage = (value / maxValue) * 100;
        const canUpgrade = character.skill_points > 0 && value < maxValue;
        
        const skillItem = document.createElement('div');
        skillItem.className = 'skill-item';
        
        skillItem.innerHTML = `
            <div class="skill-header">
                <div class="skill-name">
                    <i class="fas ${skillIcons[skill]}"></i>
                    <span>${skillNames[skill]}</span>
                </div>
                <div class="skill-controls">
                    <div class="skill-value">${value} / ${maxValue}</div>
                    ${value < maxValue ? `
                        <button class="skill-upgrade-btn" 
                                data-skill="${skill}" 
                                ${!canUpgrade ? 'disabled' : ''}>
                            <i class="fas fa-plus"></i>
                            <span>Улучшить</span>
                        </button>
                    ` : `
                        <div class="skill-max">
                            <i class="fas fa-check-circle"></i>
                            <span>Максимум</span>
                        </div>
                    `}
                </div>
            </div>
            <div class="skill-bar-container">
                <div class="skill-bar" style="width: ${percentage}%"></div>
            </div>
        `;
        
        skillsGrid.appendChild(skillItem);
    });
    
    // Добавляем обработчики для кнопок улучшения
    document.querySelectorAll('.skill-upgrade-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const skill = btn.dataset.skill;
            upgradeSkill(skill);
        });
    });
}

async function upgradeSkill(skill) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        showError('Требуется авторизация');
        return;
    }

    // Проверяем наличие очков
    if (currentCharacter.skill_points <= 0) {
        showError('Недостаточно очков навыков');
        return;
    }

    try {
        const response = await fetch('/api/characters/upgrade-skill', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ skill })
        });

        const data = await response.json();

        if (data.success) {
            currentCharacter = data.character;
            displayCharacter(currentCharacter);
            showSuccess(data.message || 'Навык улучшен!');
            
            // Анимация улучшения
            const skillItem = document.querySelector(`[data-skill="${skill}"]`).closest('.skill-item');
            skillItem.style.animation = 'none';
            setTimeout(() => {
                skillItem.style.animation = 'fadeIn 0.5s ease';
            }, 10);
        } else {
            showError(data.error || 'Не удалось улучшить навык');
        }
    } catch (error) {
        console.error('Error upgrading skill:', error);
        showError('Ошибка при улучшении навыка');
    }
}

function showSuccess(message) {
    // Используем систему модальных окон из game.js
    if (window.showAlert) {
        window.showAlert('Успех', message, 'success');
    } else {
        alert(message);
    }
}

function showError(message) {
    // Используем систему модальных окон из game.js
    if (window.showAlert) {
        window.showAlert('Ошибка', message, 'error');
    } else {
        alert(message);
    }
}

// Инициализация при загрузке секции персонажа
window.charModule = {
    loadMyCharacter,
    getCurrentCharacter: () => currentCharacter
};

// Автоматическая загрузка при открытии секции
document.addEventListener('DOMContentLoaded', () => {
    const charSection = document.getElementById('my-character-section');
    if (charSection) {
        // Используем MutationObserver для отслеживания открытия секции
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (charSection.style.display !== 'none' && charSection.classList.contains('active')) {
                        loadMyCharacter();
                    }
                }
            });
        });
        
        observer.observe(charSection, { attributes: true });
    }
});
