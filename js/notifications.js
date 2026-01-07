/**
 * Система уведомлений (Toast Notifications)
 * Использование:
 * showNotification('Заголовок', 'Сообщение', 'success'); // success, error, warning, info
 * showNotification('Успех!', 'Данные сохранены', 'success', 3000); // автозакрытие через 3 секунды
 */

let notificationContainer = null;

function initNotifications() {
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
}

function showNotification(title, message, type = 'info', duration = 5000) {
    initNotifications();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${icons[type] || icons.info}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" aria-label="Закрыть">
            <i class="fas fa-times"></i>
        </button>
        ${duration > 0 ? `<div class="notification-progress" style="--duration: ${duration}ms"></div>` : ''}
    `;

    notificationContainer.appendChild(notification);

    // Анимация появления
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Закрытие по клику на крестик
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        closeNotification(notification);
    });

    // Автозакрытие
    if (duration > 0) {
        setTimeout(() => {
            closeNotification(notification);
        }, duration);
    }

    return notification;
}

function closeNotification(notification) {
    notification.classList.remove('show');
    notification.classList.add('hide');
    setTimeout(() => {
        if (notification.parentElement) {
            notification.parentElement.removeChild(notification);
        }
    }, 300);
}

// Удобные алиасы
function showSuccess(title, message, duration = 4000) {
    return showNotification(title, message, 'success', duration);
}

function showError(title, message, duration = 5000) {
    return showNotification(title, message, 'error', duration);
}

function showWarning(title, message, duration = 4500) {
    return showNotification(title, message, 'warning', duration);
}

function showInfo(title, message, duration = 4000) {
    return showNotification(title, message, 'info', duration);
}

// Экспорт в глобальную область
window.showNotification = showNotification;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
window.closeNotification = closeNotification;

// Логируем успешную загрузку
console.log('✅ Notifications system loaded:', {
    showSuccess: typeof window.showSuccess,
    showError: typeof window.showError,
    showWarning: typeof window.showWarning,
    showInfo: typeof window.showInfo
});
