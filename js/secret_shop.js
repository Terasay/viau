// Секретный магазин
let currentUser = null;
let userCoins = 0;

document.addEventListener('DOMContentLoaded', async () => {
    loadTheme();
    await loadUserData();
    setupEventListeners();
});

function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
}

async function loadUserData() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    try {
        const response = await fetch('/me', {
            headers: { 'Authorization': token }
        });

        if (!response.ok) {
            window.location.href = '/';
            return;
        }

        const data = await response.json();
        if (!data.logged_in) {
            window.location.href = '/';
            return;
        }

        currentUser = data;
        await loadSecretCoins();
    } catch (error) {
        console.error('Error loading user data:', error);
        window.location.href = '/';
    }
}

async function loadSecretCoins() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/shop/coins', {
            headers: { 'Authorization': token }
        });

        const data = await response.json();
        
        if (data.success) {
            userCoins = data.coins;
            document.getElementById('user-coins').textContent = userCoins;
        } else {
            showShopError('Не удалось загрузить баланс');
        }
    } catch (error) {
        console.error('Error loading coins:', error);
        showShopError('Ошибка загрузки баланса');
    }
}

function setupEventListeners() {
    // Переключатель темы
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // Кнопка "Назад"
    document.getElementById('back-btn').addEventListener('click', () => {
        window.location.href = '/game.html';
    });

    // Кнопки покупки
    document.querySelectorAll('.btn-buy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const item = e.currentTarget.dataset.item;
            const price = parseInt(e.currentTarget.dataset.price);
            showPurchaseConfirmation(item, price);
        });
    });
}

function showPurchaseConfirmation(item, price) {
    if (userCoins < price) {
        showShopError(`Недостаточно монет! Требуется: ${price}, у вас: ${userCoins}`);
        return;
    }

    const modal = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');
    const confirmBtn = document.getElementById('confirm-purchase');

    let itemName = '';
    let itemDescription = '';

    switch(item) {
        case 'skill-point':
            itemName = 'Очко навыка правителя';
            itemDescription = `За ${price} секретных монет вы получите 1 очко навыка, которое сможете распределить в разделе "Мой персонаж".`;
            break;
    }

    modalBody.innerHTML = `
        <div style="text-align: center;">
            <i class="fas fa-shopping-cart" style="font-size: 3rem; color: var(--gold); margin-bottom: 1rem;"></i>
            <h3 style="margin-bottom: 0.5rem; color: var(--text-primary);">${itemName}</h3>
            <p style="margin-bottom: 1rem;">${itemDescription}</p>
            <div style="padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius); margin-top: 1rem;">
                <strong style="color: var(--text-primary);">Стоимость:</strong> 
                <span style="color: var(--gold); font-weight: 700;">${price}</span>
                <i class="fas fa-gem" style="color: var(--gold);"></i>
            </div>
        </div>
    `;

    // Убираем старые обработчики
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', () => {
        purchaseItem(item, price);
    });

    modal.classList.add('visible');
}

async function purchaseItem(item, price) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/shop/purchase', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ item, price })
        });

        const data = await response.json();

        if (data.success) {
            closeModal();
            userCoins = data.new_balance;
            document.getElementById('user-coins').textContent = userCoins;
            showShopSuccess(data.message || 'Покупка совершена успешно!');
        } else {
            showShopError(data.error || 'Не удалось совершить покупку');
        }
    } catch (error) {
        console.error('Error purchasing item:', error);
        showShopError('Ошибка при покупке');
    }
}

function closeModal() {
    const modal = document.getElementById('modal-overlay');
    modal.classList.remove('visible');
}

function showShopSuccess(message) {
    // Создаем простое уведомление
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: linear-gradient(135deg, var(--success), #059669);
        color: white;
        padding: 1rem 2rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 1rem;
    `;
    notification.innerHTML = `
        <i class="fas fa-check-circle" style="font-size: 1.5rem;"></i>
        <span style="font-weight: 600;">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showShopError(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: linear-gradient(135deg, var(--danger), #dc2626);
        color: white;
        padding: 1rem 2rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 1rem;
    `;
    notification.innerHTML = `
        <i class="fas fa-exclamation-circle" style="font-size: 1.5rem;"></i>
        <span style="font-weight: 600;">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Добавляем стили для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
