let currentCharacter = null;
let isAdmin = false;
let selectedCharacterId = null;

const skillNames = {
    military: 'Военное дело',
    administration: 'Администрация',
    diplomacy: 'Дипломатия',
    intrigue: 'Интриги',
    knowledge: 'Знания'
};

const skillIcons = {
    military: 'fa-fist-raised',
    administration: 'fa-landmark',
    diplomacy: 'fa-handshake',
    intrigue: 'fa-user-secret',
    knowledge: 'fa-book'
};

async function checkUserRole() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const response = await fetch('/api/admin/check', {
            headers: {
                'Authorization': token
            }
        });
        const data = await response.json();
        return data.is_admin || false;
    } catch (error) {
        return false;
    }
}

async function loadAllCharacters() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/characters/admin/all', {
            headers: {
                'Authorization': token
            }
        });

        const data = await response.json();

        if (data.success) {
            populateCharacterSelect(data.characters);
        } else {
            showCharError(data.error || 'Не удалось загрузить список персонажей');
        }
    } catch (error) {
        console.error('Error loading characters:', error);
        showCharError('Ошибка при загрузке списка персонажей');
    }
}

function populateCharacterSelect(characters) {
    const select = document.getElementById('character-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Выберите персонажа --</option>';
    
    characters.forEach(char => {
        const option = document.createElement('option');
        option.value = char.id;
        option.textContent = `${char.name} (${char.country_name})`;
        select.appendChild(option);
    });

    select.addEventListener('change', async (e) => {
        const characterId = e.target.value;
        if (characterId) {
            selectedCharacterId = characterId;
            await loadCharacterById(characterId);
        }
    });
}

async function loadCharacterById(characterId) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/characters/admin/${characterId}`, {
            headers: {
                'Authorization': token
            }
        });

        const data = await response.json();

        if (data.success) {
            currentCharacter = data.character;
            displayCharacter(currentCharacter);
        } else {
            showCharError(data.error || 'Не удалось загрузить персонажа');
        }
    } catch (error) {
        console.error('Error loading character:', error);
        showCharError('Ошибка при загрузке персонажа');
    }
}

async function loadMyCharacter() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        showCharError('Требуется авторизация');
        return;
    }

    isAdmin = await checkUserRole();

    if (isAdmin) {
        const selector = document.getElementById('admin-character-selector');
        if (selector) {
            selector.style.display = 'block';
        }
        
        await loadAllCharacters();
    } else {
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
                showCharError(data.error || 'Не удалось загрузить персонажа');
            }
        } catch (error) {
            console.error('Error loading character:', error);
            showCharError('Ошибка при загрузке персонажа');
        }
    }
}

function displayCharacter(character) {
    document.getElementById('char-first-name').textContent = character.first_name;
    document.getElementById('char-last-name').textContent = character.last_name;
    document.getElementById('char-position').textContent = character.position;
    document.getElementById('char-age').textContent = character.age;
    document.getElementById('char-country').textContent = character.country;
    
    document.getElementById('char-ethnicity').textContent = character.ethnicity || 'Не указана';
    document.getElementById('char-religion').textContent = character.religion || 'Не указана';
    document.getElementById('char-relatives').textContent = character.relatives || 'Нет';
    
    const skillPointsElement = document.getElementById('char-skill-points');
    skillPointsElement.textContent = character.skill_points || 0;
    
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
        showCharError('Требуется авторизация');
        return;
    }

    // Проверяем наличие очков
    if (currentCharacter.skill_points <= 0) {
        showCharError('Недостаточно очков навыков');
        return;
    }

    try {
        // Если админ и выбран персонаж, прокачиваем его
        const url = (isAdmin && selectedCharacterId) 
            ? '/api/characters/admin/upgrade-skill'
            : '/api/characters/upgrade-skill';

        const body = (isAdmin && selectedCharacterId)
            ? { skill, character_id: selectedCharacterId }
            : { skill };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (data.success) {
            currentCharacter = data.character;
            displayCharacter(currentCharacter);
            showCharSuccess(data.message || 'Навык улучшен!');
            
            // Анимация улучшения
            const skillItem = document.querySelector(`[data-skill="${skill}"]`).closest('.skill-item');
            skillItem.style.animation = 'none';
            setTimeout(() => {
                skillItem.style.animation = 'fadeIn 0.5s ease';
            }, 10);
        } else {
            showCharError(data.error || 'Не удалось улучшить навык');
        }
    } catch (error) {
        console.error('Error upgrading skill:', error);
        showCharError('Ошибка при улучшении навыка');
    }
}

function showCharSuccess(message) {
    // Используем систему модальных окон из game.js
    if (window.showAlert) {
        window.showAlert('Успех', message, 'success');
    } else {
        alert(message);
    }
}

function showCharError(message) {
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
