document.addEventListener('DOMContentLoaded', async () => {
    const exitBtn = document.getElementById('admin-exit-btn');
    if (exitBtn) {
        exitBtn.addEventListener('click', () => {
            window.location.href = '/';
        });
    }

    const forbidden = document.getElementById('forbidden');
    const adminContent = document.getElementById('admin-content');

    const token = localStorage.getItem('token');
    if (!token) {
        forbidden.style.display = 'block';
        return;
    }

    const meResp = await fetch('/me', {
        headers: { 'Authorization': token }
    });
    const me = await meResp.json();
    if (!me.logged_in || me.role !== 'admin') {
        forbidden.style.display = 'block';
        return;
    }
    adminContent.style.display = 'block';

    // Переключение вкладок
    const adminTabs = document.querySelectorAll('.admin-tab');
    const adminSections = document.querySelectorAll('.admin-section');

    adminTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const sectionName = tab.dataset.section;
            
            adminTabs.forEach(t => t.classList.remove('active'));
            adminSections.forEach(s => s.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${sectionName}-section`).classList.add('active');

            // Загружаем данные при переключении
            if (sectionName === 'users') {
                loadUsers();
            } else if (sectionName === 'currencies') {
                loadCurrencies();
            } else if (sectionName === 'resources') {
                loadResources();
            }
        });
    });

    // ===== ПОЛЬЗОВАТЕЛИ =====
    const usersList = document.getElementById('users-list');

    async function loadUsers() {
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
    }

    await loadUsers();

    const userActionForm = document.getElementById('user-action-form');
    const actionResult = document.getElementById('action-result');
    userActionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('user-id').value;
        const action = document.getElementById('action-type').value;
        const value = document.getElementById('action-value').value === 'true';
        const untilRaw = document.getElementById('action-until').value;
        const until = untilRaw ? new Date(untilRaw).toISOString() : null;
        actionResult.textContent = 'Отправка...';
        try {
            const resp = await fetch('/admin/set_status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ id, action, value, until })
            });
            const data = await resp.json();
            if (data.success) {
                actionResult.textContent = 'Успешно.';
                await loadUsers();
            } else {
                actionResult.textContent = data.error || 'Ошибка.';
            }
        } catch (err) {
            actionResult.textContent = 'Ошибка запроса.';
        }
    });

    // ===== ВАЛЮТЫ =====
    const currenciesList = document.getElementById('currencies-list');

    async function loadCurrencies() {
        try {
            const resp = await fetch('/converter/admin/all-data', {
                headers: { 'Authorization': token }
            });
            
            if (resp.status === 403) {
                currenciesList.innerHTML = '<div class="error">Нет доступа</div>';
                return;
            }

            const data = await resp.json();
            if (data.success) {
                displayCurrencies(data.data.currencies);
            }
        } catch (e) {
            currenciesList.innerHTML = '<div class="error">Ошибка загрузки валют</div>';
        }
    }

    function displayCurrencies(currencies) {
        if (!currencies || Object.keys(currencies).length === 0) {
            currenciesList.innerHTML = '<div class="loading-msg">Нет валют</div>';
            return;
        }

        let html = '';
        for (const [code, info] of Object.entries(currencies)) {
            html += `
                <div class="item-card">
                    <div class="item-header">
                        <div>
                            <div class="item-code">${code}</div>
                            <div class="item-name">${info.name}</div>
                        </div>
                        <div class="item-rate">Курс: ${info.rate}</div>
                    </div>
                </div>
            `;
        }
        currenciesList.innerHTML = html;
    }

    // Добавление валюты
    const addCurrencyForm = document.getElementById('add-currency-form');
    const addCurrencyResult = document.getElementById('add-currency-result');

    addCurrencyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('currency-code-add').value.toUpperCase();
        const name = document.getElementById('currency-name-add').value;
        const rate = parseFloat(document.getElementById('currency-rate-add').value);

        try {
            const resp = await fetch('/converter/admin/currency/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ code, name, rate })
            });

            const data = await resp.json();
            
            if (data.success) {
                addCurrencyResult.textContent = 'Валюта добавлена!';
                addCurrencyResult.className = 'form-result success';
                addCurrencyForm.reset();
                await loadCurrencies();
            } else {
                addCurrencyResult.textContent = data.error || 'Ошибка';
                addCurrencyResult.className = 'form-result error';
            }
        } catch (err) {
            addCurrencyResult.textContent = 'Ошибка запроса';
            addCurrencyResult.className = 'form-result error';
        }
    });

    // Редактирование валюты
    const editCurrencyForm = document.getElementById('edit-currency-form');
    const editCurrencyResult = document.getElementById('edit-currency-result');

    editCurrencyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('currency-code-edit').value.toUpperCase();
        const name = document.getElementById('currency-name-edit').value;
        const rate = document.getElementById('currency-rate-edit').value;

        const body = { code };
        if (name) body.name = name;
        if (rate) body.rate = parseFloat(rate);

        try {
            const resp = await fetch('/converter/admin/currency/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(body)
            });

            const data = await resp.json();
            
            if (data.success) {
                editCurrencyResult.textContent = 'Валюта обновлена!';
                editCurrencyResult.className = 'form-result success';
                editCurrencyForm.reset();
                await loadCurrencies();
            } else {
                editCurrencyResult.textContent = data.error || 'Ошибка';
                editCurrencyResult.className = 'form-result error';
            }
        } catch (err) {
            editCurrencyResult.textContent = 'Ошибка запроса';
            editCurrencyResult.className = 'form-result error';
        }
    });

    // Удаление валюты
    const deleteCurrencyForm = document.getElementById('delete-currency-form');
    const deleteCurrencyResult = document.getElementById('delete-currency-result');

    deleteCurrencyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('currency-code-delete').value.toUpperCase();

        if (!confirm(`Вы уверены, что хотите удалить валюту ${code}?`)) {
            return;
        }

        try {
            const resp = await fetch('/converter/admin/currency/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ code })
            });

            const data = await resp.json();
            
            if (data.success) {
                deleteCurrencyResult.textContent = 'Валюта удалена!';
                deleteCurrencyResult.className = 'form-result success';
                deleteCurrencyForm.reset();
                await loadCurrencies();
            } else {
                deleteCurrencyResult.textContent = data.error || 'Ошибка';
                deleteCurrencyResult.className = 'form-result error';
            }
        } catch (err) {
            deleteCurrencyResult.textContent = 'Ошибка запроса';
            deleteCurrencyResult.className = 'form-result error';
        }
    });

    // ===== РЕСУРСЫ =====
    const resourcesList = document.getElementById('resources-list');

    async function loadResources() {
        try {
            const resp = await fetch('/converter/admin/all-data', {
                headers: { 'Authorization': token }
            });
            
            if (resp.status === 403) {
                resourcesList.innerHTML = '<div class="error">Нет доступа</div>';
                return;
            }

            const data = await resp.json();
            if (data.success) {
                displayResources(data.data.resources);
            }
        } catch (e) {
            resourcesList.innerHTML = '<div class="error">Ошибка загрузки ресурсов</div>';
        }
    }

    function displayResources(resources) {
        if (!resources || Object.keys(resources).length === 0) {
            resourcesList.innerHTML = '<div class="loading-msg">Нет ресурсов</div>';
            return;
        }

        let html = '';
        for (const [code, info] of Object.entries(resources)) {
            html += `
                <div class="item-card">
                    <div class="item-header">
                        <div>
                            <div class="item-code">${code}</div>
                            <div class="item-name">${info.name}</div>
                        </div>
                        <div class="item-rate">Курс: ${info.rate}</div>
                    </div>
                </div>
            `;
        }
        resourcesList.innerHTML = html;
    }

    // Добавление ресурса
    const addResourceForm = document.getElementById('add-resource-form');
    const addResourceResult = document.getElementById('add-resource-result');

    addResourceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('resource-code-add').value.toLowerCase();
        const name = document.getElementById('resource-name-add').value;
        const rate = parseInt(document.getElementById('resource-rate-add').value);

        try {
            const resp = await fetch('/converter/admin/resource/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ code, name, rate })
            });

            const data = await resp.json();
            
            if (data.success) {
                addResourceResult.textContent = 'Ресурс добавлен!';
                addResourceResult.className = 'form-result success';
                addResourceForm.reset();
                await loadResources();
            } else {
                addResourceResult.textContent = data.error || 'Ошибка';
                addResourceResult.className = 'form-result error';
            }
        } catch (err) {
            addResourceResult.textContent = 'Ошибка запроса';
            addResourceResult.className = 'form-result error';
        }
    });

    // Редактирование ресурса
    const editResourceForm = document.getElementById('edit-resource-form');
    const editResourceResult = document.getElementById('edit-resource-result');

    editResourceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('resource-code-edit').value.toLowerCase();
        const name = document.getElementById('resource-name-edit').value;
        const rate = document.getElementById('resource-rate-edit').value;

        const body = { code };
        if (name) body.name = name;
        if (rate) body.rate = parseInt(rate);

        try {
            const resp = await fetch('/converter/admin/resource/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(body)
            });

            const data = await resp.json();
            
            if (data.success) {
                editResourceResult.textContent = 'Ресурс обновлен!';
                editResourceResult.className = 'form-result success';
                editResourceForm.reset();
                await loadResources();
            } else {
                editResourceResult.textContent = data.error || 'Ошибка';
                editResourceResult.className = 'form-result error';
            }
        } catch (err) {
            editResourceResult.textContent = 'Ошибка запроса';
            editResourceResult.className = 'form-result error';
        }
    });

    // Удаление ресурса
    const deleteResourceForm = document.getElementById('delete-resource-form');
    const deleteResourceResult = document.getElementById('delete-resource-result');

    deleteResourceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('resource-code-delete').value.toLowerCase();

        if (!confirm(`Вы уверены, что хотите удалить ресурс ${code}?`)) {
            return;
        }

        try {
            const resp = await fetch('/converter/admin/resource/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ code })
            });

            const data = await resp.json();
            
            if (data.success) {
                deleteResourceResult.textContent = 'Ресурс удален!';
                deleteResourceResult.className = 'form-result success';
                deleteResourceForm.reset();
                await loadResources();
            } else {
                deleteResourceResult.textContent = data.error || 'Ошибка';
                deleteResourceResult.className = 'form-result error';
            }
        } catch (err) {
            deleteResourceResult.textContent = 'Ошибка запроса';
            deleteResourceResult.className = 'form-result error';
        }
    });
});

function formatUsers(users) {
    if (!users || users.length === 0) return 'Нет пользователей.';
    const widths = {
        id: 2,
        username: 10,
        email: 22,
        country: 8,
        role: 6,
        banned: 5,
        muted: 5,
        ban_until: 16,
        mute_until: 16
    };
    function fit(str, len) {
        str = String(str || '');
        return str.length > len ? str.slice(0, len - 1) + '…' : str.padEnd(len);
    }
    function formatDate(iso) {
        if (!iso) return '';
        const dt = new Date(iso);
        if (isNaN(dt.getTime())) return iso;
        return dt.toLocaleString();
    }
    let out = `${fit('ID', widths.id)} | ${fit('Логин', widths.username)} | ${fit('Email', widths.email)} | ${fit('Страна', widths.country)} | ${fit('Роль', widths.role)} | ${fit('Бан', widths.banned)} | ${fit('Мут', widths.muted)} | ${fit('ДоБан', widths.ban_until)} | ${fit('ДоМут', widths.mute_until)}\n`;
    out += `${'-'.repeat(widths.id)}|${'-'.repeat(widths.username + 2)}|${'-'.repeat(widths.email + 2)}|${'-'.repeat(widths.country + 2)}|${'-'.repeat(widths.role + 2)}|${'-'.repeat(widths.banned + 2)}|${'-'.repeat(widths.muted + 2)}|${'-'.repeat(widths.ban_until + 2)}|${'-'.repeat(widths.mute_until)}\n`;
    for (const u of users) {
        out += `${fit(u.id, widths.id)} | ${fit(u.username, widths.username)} | ${fit(u.email, widths.email)} | ${fit(u.country, widths.country)} | ${fit(u.role, widths.role)} | ${u.banned ? 'Да'.padEnd(widths.banned) : 'Нет'.padEnd(widths.banned)} | ${u.muted ? 'Да'.padEnd(widths.muted) : 'Нет'.padEnd(widths.muted)} | ${fit(formatDate(u.ban_until), widths.ban_until)} | ${fit(formatDate(u.mute_until), widths.mute_until)}\n`;
    }
    return out;
}