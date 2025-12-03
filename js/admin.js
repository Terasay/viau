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

    const adminTabs = document.querySelectorAll('.admin-tab');
    const adminSections = document.querySelectorAll('.admin-section');

    adminTabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            const sectionName = tab.dataset.section;
            
            adminTabs.forEach(t => t.classList.remove('active'));
            
            adminSections.forEach(s => {
                s.classList.remove('active');
                s.style.display = 'none';
            });
            
            tab.classList.add('active');
            const activeSection = document.getElementById(`${sectionName}-section`);
            activeSection.classList.add('active');
            activeSection.style.display = 'block';

            if (sectionName === 'users') {
                await loadUsers();
            } else if (sectionName === 'currencies') {
                await loadCurrencies();
            } else if (sectionName === 'resources') {
                await loadResources();
            } else if (sectionName === 'applications') {
                await loadApplications();
            }
        });
    });

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

        try {
            const resp = await fetch('/api/registration/occupied-countries', {
                headers: { 'Authorization': token }
            });
            if (resp.status === 403) {
                alert('Доступ запрещён');
                return;
            }
            const data = await resp.json();
            return data.countries || [];
        } catch (e) {
            console.error('Error loading occupied countries:', e);
            return [];
        }
    }

    // === ЗАЯВКИ ===
    let currentApplicationsFilter = 'pending';
    let allApplications = [];

    async function loadApplications() {
        const applicationsList = document.getElementById('applications-list');
        applicationsList.innerHTML = '<div class="loading-msg">Загрузка заявок...</div>';

        try {
            const resp = await fetch('/api/registration/admin/all-applications', {
                headers: { 'Authorization': token }
            });

            if (resp.status === 403) {
                applicationsList.innerHTML = '<div class="error">Доступ запрещён</div>';
                return;
            }

            const data = await resp.json();
            if (data.success) {
                allApplications = data.applications;
                updateApplicationsCounts();
                displayApplications(currentApplicationsFilter);
            } else {
                applicationsList.innerHTML = '<div class="error">Ошибка загрузки заявок</div>';
            }
        } catch (e) {
            console.error('Error loading applications:', e);
            applicationsList.innerHTML = '<div class="error">Ошибка загрузки заявок</div>';
        }
    }

    function updateApplicationsCounts() {
        const pending = allApplications.filter(a => a.status === 'pending').length;
        const approved = allApplications.filter(a => a.status === 'approved').length;
        const rejected = allApplications.filter(a => a.status === 'rejected').length;

        document.getElementById('pending-count').textContent = pending;
        document.getElementById('approved-count').textContent = approved;
        document.getElementById('rejected-count').textContent = rejected;
    }

    function displayApplications(filter) {
        const applicationsList = document.getElementById('applications-list');
        const filtered = allApplications.filter(a => a.status === filter);

        if (filtered.length === 0) {
            applicationsList.innerHTML = `<div class="loading-msg">Нет заявок со статусом "${filter}"</div>`;
            return;
        }

        let html = '';
        for (const app of filtered) {
            const statusText = app.status === 'pending' ? 'На рассмотрении' :
                             app.status === 'approved' ? 'Одобрена' : 'Отклонена';
            
            const date = new Date(app.created_at).toLocaleString('ru-RU');
            
            html += `
                <div class="application-card ${app.status}">
                    <div class="application-header">
                        <div>
                            <div class="application-user">${app.username}</div>
                            <div class="application-date">Подана: ${date}</div>
                        </div>
                        <div class="application-status ${app.status}">${statusText}</div>
                    </div>
                    
                    <div class="application-details">
                        <div class="detail-item">
                            <div class="detail-label">Имя персонажа</div>
                            <div class="detail-value">${app.first_name || '-'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Фамилия/Дом</div>
                            <div class="detail-value">${app.last_name || '-'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Происхождение</div>
                            <div class="detail-value">${app.country_origin || '-'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Возраст</div>
                            <div class="detail-value">${app.age || '-'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Страна для игры</div>
                            <div class="detail-value">${app.country || '-'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Религия</div>
                            <div class="detail-value">${app.religion || 'Не указана'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Этнос</div>
                            <div class="detail-value">${app.ethnicity || 'Не указан'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Реферальный код</div>
                            <div class="detail-value">${app.referral_code || 'Нет'}</div>
                        </div>
                    </div>
                    
                    ${app.relatives ? `
                        <div class="detail-item" style="margin-top: 8px;">
                            <div class="detail-label">Родственники</div>
                            <div class="detail-value">${app.relatives}</div>
                        </div>
                    ` : ''}
                    
                    ${app.rejection_reason ? `
                        <div class="rejection-reason">
                            <strong>Причина отклонения:</strong> ${app.rejection_reason}
                        </div>
                    ` : ''}
                    
                    <div class="application-actions">
                        ${app.status === 'pending' ? `
                            <button class="btn-approve" onclick="approveApplication(${app.id}, '${app.country}')">
                                <i class="fas fa-check"></i> Одобрить
                            </button>
                            <button class="btn-reject" onclick="showRejectModal(${app.id})">
                                <i class="fas fa-times"></i> Отклонить
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        applicationsList.innerHTML = html;
    }

    // Фильтры заявок
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentApplicationsFilter = btn.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displayApplications(currentApplicationsFilter);
        });
    });

    // Одобрение заявки
    window.approveApplication = async function(appId, country) {
        if (!confirm(`Одобрить заявку и назначить страну "${country}"?`)) {
            return;
        }

        try {
            const resp = await fetch('/api/registration/admin/approve-application', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({
                    application_id: appId,
                    assigned_country: country
                })
            });

            const data = await resp.json();
            if (data.success) {
                alert('Заявка одобрена!');
                await loadApplications();
            } else {
                alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
            }
        } catch (e) {
            console.error('Error approving application:', e);
            alert('Ошибка при одобрении заявки');
        }
    };

    // Модальное окно отклонения
    window.showRejectModal = function(appId) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay-admin active';
        modal.innerHTML = `
            <div class="modal-content-admin">
                <button class="modal-close-btn" onclick="this.closest('.modal-overlay-admin').remove()">
                    <i class="fas fa-times"></i>
                </button>
                <h3 class="modal-title">Отклонить заявку</h3>
                <div class="modal-form">
                    <label>
                        Причина отклонения:
                        <textarea id="reject-reason" placeholder="Укажите причину отклонения..." required></textarea>
                    </label>
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="this.closest('.modal-overlay-admin').remove()">
                            Отмена
                        </button>
                        <button class="btn-reject" onclick="rejectApplication(${appId})">
                            <i class="fas fa-times"></i> Отклонить
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    // Отклонение заявки
    window.rejectApplication = async function(appId) {
        const reason = document.getElementById('reject-reason').value.trim();
        if (!reason) {
            alert('Укажите причину отклонения');
            return;
        }

        try {
            const resp = await fetch('/api/registration/admin/reject-application', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({
                    application_id: appId,
                    reason: reason
                })
            });

            const data = await resp.json();
            if (data.success) {
                alert('Заявка отклонена');
                document.querySelector('.modal-overlay-admin').remove();
                await loadApplications();
            } else {
                alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
            }
        } catch (e) {
            console.error('Error rejecting application:', e);
            alert('Ошибка при отклонении заявки');
        }
    };

    const currenciesList = document.getElementById('currencies-list');

    async function loadCurrencies() {
        try {
            const resp = await fetch('/api/converter/admin/all-data', {
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

    const addCurrencyForm = document.getElementById('add-currency-form');
    const addCurrencyResult = document.getElementById('add-currency-result');

    addCurrencyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('currency-code-add').value.toUpperCase();
        const name = document.getElementById('currency-name-add').value;
        const rate = parseFloat(document.getElementById('currency-rate-add').value);

        try {
            const resp = await fetch('/api/converter/admin/currency/add', {
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
            const resp = await fetch('/api/converter/admin/currency/update', {
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

    const deleteCurrencyForm = document.getElementById('delete-currency-form');
    const deleteCurrencyResult = document.getElementById('delete-currency-result');

    deleteCurrencyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('currency-code-delete').value.toUpperCase();

        if (!confirm(`Вы уверены, что хотите удалить валюту ${code}?`)) {
            return;
        }

        try {
            const resp = await fetch('/api/converter/admin/currency/delete', {
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

    const resourcesList = document.getElementById('resources-list');

    async function loadResources() {
        try {
            const resp = await fetch('/api/converter/admin/all-data', {
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
            const resp = await fetch('/api/converter/admin/resource/add', {
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
            const resp = await fetch('/api/converter/admin/resource/update', {
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

    const deleteResourceForm = document.getElementById('delete-resource-form');
    const deleteResourceResult = document.getElementById('delete-resource-result');

    deleteResourceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('resource-code-delete').value.toLowerCase();

        if (!confirm(`Вы уверены, что хотите удалить ресурс ${code}?`)) {
            return;
        }

        try {
            const resp = await fetch('/api/converter/admin/resource/delete', {
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