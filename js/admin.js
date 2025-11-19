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
    let out = 'ID | Логин      | Email                | Страна   | Роль   | Бан | Мут\n';
    out += '---|------------|---------------------|----------|--------|-----|-----\n';
    for (const u of users) {
        out += `${u.id.toString().padEnd(2)} | ${u.username.padEnd(10)} | ${u.email.padEnd(19)} | ${(u.country||'').padEnd(8)} | ${u.role.padEnd(6)} | ${u.banned ? 'Да' : 'Нет'} | ${u.muted ? 'Да' : 'Нет'}\n`;
    }
    return out;
}
