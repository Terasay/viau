document.addEventListener('DOMContentLoaded', async () => {
    const forbidden = document.getElementById('forbidden');
    const adminContent = document.getElementById('admin-content');
    const usersList = document.getElementById('users-list');

    // Получаем токен из localStorage (или другого хранилища)
    const token = localStorage.getItem('token');
    if (!token) {
        forbidden.style.display = 'block';
        return;
    }

    // Проверяем роль пользователя
    const meResp = await fetch('/me', {
        headers: { 'Authorization': token }
    });
    const me = await meResp.json();
    if (!me.logged_in || me.role !== 'admin') {
        forbidden.style.display = 'block';
        return;
    }
    adminContent.style.display = 'block';

    // Загружаем пользователей
    try {
        const resp = await fetch('/admin/users', {
            headers: { 'Authorization': token }
        });
        if (resp.status === 403) {
            forbidden.style.display = 'block';
            adminContent.style.display = 'none';
            return;
        }
        const data = await resp.json();
        usersList.textContent = formatUsers(data.users);
    } catch (e) {
        usersList.textContent = 'Ошибка загрузки пользователей.';
    }
});

function formatUsers(users) {
    if (!users || users.length === 0) return 'Нет пользователей.';
    // Фиксированные ширины
    const widths = {
        id: 2,
        username: 10,
        email: 22,
        country: 8,
        role: 6,
        banned: 5,
        muted: 5
    };
    function fit(str, len) {
        str = String(str || '');
        return str.length > len ? str.slice(0, len - 1) + '…' : str.padEnd(len);
    }
    let out = `${fit('ID', widths.id)} | ${fit('Логин', widths.username)} | ${fit('Email', widths.email)} | ${fit('Страна', widths.country)} | ${fit('Роль', widths.role)} | ${fit('Бан', widths.banned)} | ${fit('Мут', widths.muted)}\n`;
    out += `${'-'.repeat(widths.id)}|${'-'.repeat(widths.username + 2)}|${'-'.repeat(widths.email + 2)}|${'-'.repeat(widths.country + 2)}|${'-'.repeat(widths.role + 2)}|${'-'.repeat(widths.banned + 2)}|${'-'.repeat(widths.muted)}\n`;
    for (const u of users) {
        out += `${fit(u.id, widths.id)} | ${fit(u.username, widths.username)} | ${fit(u.email, widths.email)} | ${fit(u.country, widths.country)} | ${fit(u.role, widths.role)} | ${u.banned ? 'Да'.padEnd(widths.banned) : 'Нет'.padEnd(widths.banned)} | ${u.muted ? 'Да'.padEnd(widths.muted) : 'Нет'.padEnd(widths.muted)}\n`;
    }
    return out;
}
