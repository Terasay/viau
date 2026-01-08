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
            } else if (sectionName === 'characters') {
                await loadCharacters();
            } else if (sectionName === 'settings') {
                await loadSettings();
            } else if (sectionName === 'countries-economic') {
                await window.loadCountriesEconomic();
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

    const countryActionForm = document.getElementById('country-action-form');
    const countryActionResult = document.getElementById('country-action-result');
    
    if (countryActionForm) {
        countryActionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userId = document.getElementById('country-user-id').value;
            
            if (!confirm(`Вы уверены, что хотите снять игрока с его страны? Это вернёт ему роль "user" и освободит страну.`)) {
                return;
            }
            
            countryActionResult.textContent = 'Отправка...';
            countryActionResult.className = '';
            
            try {
                const resp = await fetch('/admin/remove-player-country', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify({ user_id: parseInt(userId) })
                });
                
                const data = await resp.json();
                
                if (data.success) {
                    countryActionResult.textContent = data.message || 'Страна успешно освобождена!';
                    countryActionResult.style.color = '#00ff88';
                    countryActionForm.reset();
                    await loadUsers();
                } else {
                    countryActionResult.textContent = data.error || 'Ошибка';
                    countryActionResult.style.color = '#ff4444';
                }
            } catch (err) {
                countryActionResult.textContent = 'Ошибка запроса';
                countryActionResult.style.color = '#ff4444';
            }
        });
    }

    const deleteUserForm = document.getElementById('delete-user-form');
    const deleteUserResult = document.getElementById('delete-user-result');
    
    if (deleteUserForm) {
        deleteUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userId = document.getElementById('delete-user-id').value;
            
            if (!confirm(`⚠️ ВЫ УВЕРЕНЫ?\n\nЭто полностью удалит пользователя ID ${userId} из системы!\n\nБудет удалено:\n- Аккаунт\n- Аватар\n- Заявки\n- Сообщения в чате\n- Персонаж\n- Страна (если есть)\n\nЭто действие НЕОБРАТИМО!`)) {
                return;
            }
            
            if (!confirm(`ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ!\n\nВы действительно хотите НАВСЕГДА удалить пользователя ID ${userId}?\n\nВведённые данные НЕ МОГУТ БЫТЬ ВОССТАНОВЛЕНЫ!`)) {
                return;
            }
            
            deleteUserResult.textContent = 'Удаление...';
            deleteUserResult.className = '';
            
            try {
                const resp = await fetch('/admin/delete-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify({ user_id: parseInt(userId) })
                });
                
                const data = await resp.json();
                
                if (data.success) {
                    window.showSuccess('Успешно удалено', data.message);
                    deleteUserResult.textContent = data.message;
                    deleteUserResult.className = 'form-result success';
                    deleteUserForm.reset();
                    await loadUsers();
                } else {
                    window.showError('Ошибка', data.error || 'Не удалось удалить пользователя');
                    deleteUserResult.textContent = data.error || 'Ошибка удаления';
                    deleteUserResult.className = 'form-result error';
                }
            } catch (err) {
                window.showError('Ошибка', 'Ошибка запроса');
                deleteUserResult.textContent = 'Ошибка запроса';
                deleteUserResult.className = 'form-result error';
            }
        });
    }

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
                            <button class="btn-approve" onclick="showApproveModal(${app.id}, '${app.username}')">
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

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentApplicationsFilter = btn.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displayApplications(currentApplicationsFilter);
        });
    });

    window.showApproveModal = async function(appId, username) {
        const app = allApplications.find(a => a.id === appId);
        if (!app) {
            window.showError('Ошибка', 'Заявка не найдена');
            return;
        }

        let countriesOptions = '<option value="">-- Выберите страну --</option>';
        try {
            const resp = await fetch('/api/settings/countries', {
                headers: { 'Authorization': token }
            });
            const data = await resp.json();
            if (data.success && data.countries) {
                for (const country of data.countries) {
                    const selected = app.country === country.id ? 'selected' : '';
                    countriesOptions += `<option value="${country.id}" ${selected}>${country.name}</option>`;
                }
            }
        } catch (e) {
            console.error('Error loading countries:', e);
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay-admin active';
        modal.innerHTML = `
            <div class="modal-content-admin" style="max-width: 700px;">
                <button class="modal-close-btn" onclick="this.closest('.modal-overlay-admin').remove()">
                    <i class="fas fa-times"></i>
                </button>
                <h3 class="modal-title">Одобрить заявку - ${username}</h3>
                <div class="modal-form">
                    <p style="color: #888; margin-bottom: 16px;">Проверьте и при необходимости отредактируйте данные перед одобрением:</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <label>
                            Имя персонажа:
                            <input type="text" id="approve-first-name" value="${app.first_name || ''}" required>
                        </label>
                        <label>
                            Фамилия/Дом:
                            <input type="text" id="approve-last-name" value="${app.last_name || ''}" required>
                        </label>
                        <label>
                            Происхождение:
                            <input type="text" id="approve-country-origin" value="${app.country_origin || ''}" required>
                        </label>
                        <label>
                            Возраст:
                            <input type="number" id="approve-age" value="${app.age || ''}" required>
                        </label>
                        <label>
                            Страна для игры:
                            <select id="approve-country" required>
                                ${countriesOptions}
                            </select>
                        </label>
                        <label>
                            Религия:
                            <input type="text" id="approve-religion" value="${app.religion || ''}">
                        </label>
                        <label>
                            Этнос:
                            <input type="text" id="approve-ethnicity" value="${app.ethnicity || ''}">
                        </label>
                        <label>
                            Реферальный код:
                            <input type="text" id="approve-referral" value="${app.referral_code || ''}" maxlength="4" pattern="[A-Z]{4}">
                        </label>
                    </div>
                    
                    <label style="margin-top: 8px;">
                        Родственники:
                        <textarea id="approve-relatives" style="min-height: 60px;">${app.relatives || ''}</textarea>
                    </label>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="this.closest('.modal-overlay-admin').remove()">
                            Отмена
                        </button>
                        <button class="btn-approve" onclick="approveApplication(${appId})">
                            <i class="fas fa-check"></i> Одобрить заявку
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.approveApplication = async function(appId) {
        const firstName = document.getElementById('approve-first-name')?.value.trim();
        const lastName = document.getElementById('approve-last-name')?.value.trim();
        const countryOrigin = document.getElementById('approve-country-origin')?.value.trim();
        const age = parseInt(document.getElementById('approve-age')?.value);
        const country = document.getElementById('approve-country')?.value;
        const religion = document.getElementById('approve-religion')?.value.trim();
        const ethnicity = document.getElementById('approve-ethnicity')?.value.trim();
        const referralCode = document.getElementById('approve-referral')?.value.trim();
        const relatives = document.getElementById('approve-relatives')?.value.trim();

        if (!firstName || !lastName || !countryOrigin || !age || !country) {
            window.showWarning('Неполные данные', 'Заполните все обязательные поля');
            return;
        }

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
                    first_name: firstName,
                    last_name: lastName,
                    country_origin: countryOrigin,
                    age: age,
                    assigned_country: country,
                    religion: religion || null,
                    ethnicity: ethnicity || null,
                    referral_code: referralCode || null,
                    relatives: relatives || null
                })
            });

            const data = await resp.json();
            if (data.success) {
                window.showSuccess('Успех!', 'Заявка одобрена! Пользователь получил роль "player".');
                document.querySelector('.modal-overlay-admin').remove();
                await loadApplications();
            } else {
                window.showError('Ошибка', data.error || 'Неизвестная ошибка');
            }
        } catch (e) {
            console.error('Error approving application:', e);
            window.showError('Ошибка', 'Ошибка при одобрении заявки');
        }
    };

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

    window.rejectApplication = async function(appId) {
        const reason = document.getElementById('reject-reason').value.trim();
        if (!reason) {
            window.showWarning('Незаполнено поле', 'Укажите причину отклонения');
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
                window.showSuccess('Готово', 'Заявка отклонена');
                document.querySelector('.modal-overlay-admin').remove();
                await loadApplications();
            } else {
                window.showError('Ошибка', data.error || 'Неизвестная ошибка');
            }
        } catch (e) {
            console.error('Error rejecting application:', e);
            window.showError('Ошибка', 'Ошибка при отклонении заявки');
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

    const charactersList = document.getElementById('characters-list');

    async function loadCharacters() {
        try {
            const resp = await fetch('/api/characters/admin/all', {
                headers: { 'Authorization': token }
            });
            
            if (resp.status === 403) {
                charactersList.innerHTML = '<div class="error">Нет доступа</div>';
                return;
            }

            const data = await resp.json();
            if (data.success) {
                displayCharacters(data.characters);
            }
        } catch (e) {
            charactersList.innerHTML = '<div class="error">Ошибка загрузки персонажей</div>';
        }
    }

    function displayCharacters(characters) {
        if (!characters || characters.length === 0) {
            charactersList.innerHTML = '<div class="loading-msg">Нет персонажей</div>';
            return;
        }

        let html = '';
        for (const char of characters) {
            const age = 1516 - char.birth_year;
            html += `
                <div class="item-card character-card" onclick="selectCharacter(${char.id})" style="cursor: pointer;">
                    <div class="item-header">
                        <div>
                            <div class="item-code">${char.first_name} ${char.last_name}</div>
                            <div class="item-name">${char.position} • ${age} лет (${char.birth_year} г.р.)</div>
                            ${char.country ? `<div style="color: #00ffc6; font-size: 0.85em; margin-top: 4px;"><i class="fas fa-flag"></i> ${char.country}</div>` : ''}
                        </div>
                        <div style="text-align: right;">
                            <div style="color: #888; font-size: 0.85em;">ID: ${char.id}</div>
                            ${char.user_id ? `<div style="color: #888; font-size: 0.85em;">User: ${char.user_id}</div>` : ''}
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 12px; font-size: 0.85em;">
                        <div style="text-align: center;">
                            <div style="color: #888;"><i class="fas fa-shield-alt"></i> Военное</div>
                            <div style="color: #00ffc6; font-weight: bold;">${char.military}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="color: #888;"><i class="fas fa-chart-line"></i> Управление</div>
                            <div style="color: #00ffc6; font-weight: bold;">${char.administration}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="color: #888;"><i class="fas fa-handshake"></i> Дипломатия</div>
                            <div style="color: #00ffc6; font-weight: bold;">${char.diplomacy}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="color: #888;"><i class="fas fa-user-secret"></i> Интриги</div>
                            <div style="color: #00ffc6; font-weight: bold;">${char.intrigue}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="color: #888;"><i class="fas fa-book"></i> Знания</div>
                            <div style="color: #00ffc6; font-weight: bold;">${char.knowledge}</div>
                        </div>
                    </div>
                    ${char.ethnicity || char.religion ? `
                        <div style="margin-top: 8px; font-size: 0.85em; color: #aaa;">
                            ${char.ethnicity ? `Этнос: ${char.ethnicity}` : ''} 
                            ${char.ethnicity && char.religion ? ' • ' : ''}
                            ${char.religion ? `Религия: ${char.religion}` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }
        charactersList.innerHTML = html;
    }

    window.selectCharacter = async function(charId) {
        try {
            const resp = await fetch('/api/characters/admin/all', {
                headers: { 'Authorization': token }
            });
            const data = await resp.json();
            const char = data.characters.find(c => c.id === charId);
            
            if (!char) return;
            
            document.getElementById('char-id-edit').value = char.id;
            document.getElementById('char-first-name-edit').value = char.first_name;
            document.getElementById('char-last-name-edit').value = char.last_name;
            document.getElementById('char-birth-year-edit').value = char.birth_year;
            document.getElementById('char-position-edit').value = char.position;
            document.getElementById('char-ethnicity-edit').value = char.ethnicity || '';
            document.getElementById('char-religion-edit').value = char.religion || '';
            document.getElementById('char-relatives-edit').value = char.relatives || '';
            document.getElementById('char-friends-edit').value = char.friends || '';
            document.getElementById('char-enemies-edit').value = char.enemies || '';
            document.getElementById('char-military-edit').value = char.military;
            document.getElementById('char-administration-edit').value = char.administration;
            document.getElementById('char-diplomacy-edit').value = char.diplomacy;
            document.getElementById('char-intrigue-edit').value = char.intrigue;
            document.getElementById('char-knowledge-edit').value = char.knowledge;
            document.getElementById('char-user-id-edit').value = char.user_id || '';
            document.getElementById('char-country-edit').value = char.country || '';
            
            document.getElementById('edit-character-form').style.display = 'block';
            document.getElementById('edit-character-form').scrollIntoView({ behavior: 'smooth' });
        } catch (e) {
            console.error('Error selecting character:', e);
        }
    };

    const addCharacterForm = document.getElementById('add-character-form');
    const addCharacterResult = document.getElementById('add-character-result');

    addCharacterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const characterData = {
            first_name: document.getElementById('char-first-name-add').value,
            last_name: document.getElementById('char-last-name-add').value,
            birth_year: parseInt(document.getElementById('char-birth-year-add').value),
            position: document.getElementById('char-position-add').value,
            ethnicity: document.getElementById('char-ethnicity-add').value || null,
            religion: document.getElementById('char-religion-add').value || null,
            relatives: document.getElementById('char-relatives-add').value || null,
            friends: document.getElementById('char-friends-add').value || null,
            enemies: document.getElementById('char-enemies-add').value || null,
            military: parseInt(document.getElementById('char-military-add').value),
            administration: parseInt(document.getElementById('char-administration-add').value),
            diplomacy: parseInt(document.getElementById('char-diplomacy-add').value),
            intrigue: parseInt(document.getElementById('char-intrigue-add').value),
            knowledge: parseInt(document.getElementById('char-knowledge-add').value),
            user_id: document.getElementById('char-user-id-add').value ? parseInt(document.getElementById('char-user-id-add').value) : null,
            country: document.getElementById('char-country-add').value || null
        };

        try {
            const resp = await fetch('/api/characters/admin/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(characterData)
            });

            const data = await resp.json();
            
            if (data.success) {
                addCharacterResult.textContent = 'Персонаж добавлен!';
                addCharacterResult.className = 'form-result success';
                addCharacterForm.reset();
                await loadCharacters();
            } else {
                addCharacterResult.textContent = data.error || 'Ошибка';
                addCharacterResult.className = 'form-result error';
            }
        } catch (err) {
            addCharacterResult.textContent = 'Ошибка запроса';
            addCharacterResult.className = 'form-result error';
        }
    });

    const editCharacterForm = document.getElementById('edit-character-form');
    const editCharacterResult = document.getElementById('edit-character-result');

    editCharacterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const characterData = {
            id: parseInt(document.getElementById('char-id-edit').value),
            first_name: document.getElementById('char-first-name-edit').value,
            last_name: document.getElementById('char-last-name-edit').value,
            birth_year: parseInt(document.getElementById('char-birth-year-edit').value),
            position: document.getElementById('char-position-edit').value,
            ethnicity: document.getElementById('char-ethnicity-edit').value || null,
            religion: document.getElementById('char-religion-edit').value || null,
            relatives: document.getElementById('char-relatives-edit').value || null,
            friends: document.getElementById('char-friends-edit').value || null,
            enemies: document.getElementById('char-enemies-edit').value || null,
            military: parseInt(document.getElementById('char-military-edit').value),
            administration: parseInt(document.getElementById('char-administration-edit').value),
            diplomacy: parseInt(document.getElementById('char-diplomacy-edit').value),
            intrigue: parseInt(document.getElementById('char-intrigue-edit').value),
            knowledge: parseInt(document.getElementById('char-knowledge-edit').value),
            user_id: document.getElementById('char-user-id-edit').value ? parseInt(document.getElementById('char-user-id-edit').value) : null,
            country: document.getElementById('char-country-edit').value || null
        };

        try {
            const resp = await fetch('/api/characters/admin/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(characterData)
            });

            const data = await resp.json();
            
            if (data.success) {
                editCharacterResult.textContent = 'Персонаж обновлён!';
                editCharacterResult.className = 'form-result success';
                await loadCharacters();
            } else {
                editCharacterResult.textContent = data.error || 'Ошибка';
                editCharacterResult.className = 'form-result error';
            }
        } catch (err) {
            editCharacterResult.textContent = 'Ошибка запроса';
            editCharacterResult.className = 'form-result error';
        }
    });

    document.getElementById('delete-character-btn').addEventListener('click', async () => {
        const charId = document.getElementById('char-id-edit').value;
        
        if (!confirm('Вы уверены, что хотите удалить этого персонажа?')) {
            return;
        }

        try {
            const resp = await fetch('/api/characters/admin/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ id: parseInt(charId) })
            });

            const data = await resp.json();
            
            if (data.success) {
                editCharacterResult.textContent = 'Персонаж удалён!';
                editCharacterResult.className = 'form-result success';
                editCharacterForm.style.display = 'none';
                await loadCharacters();
            } else {
                editCharacterResult.textContent = data.error || 'Ошибка';
                editCharacterResult.className = 'form-result error';
            }
        } catch (err) {
            editCharacterResult.textContent = 'Ошибка запроса';
            editCharacterResult.className = 'form-result error';
        }
    });

    async function loadSettings() {
        await loadRules();
        await loadCountries();
    }

    window.availableCurrencies = {};
    window.availableResources = {};

    window.loadAvailableData = async function() {
        try {
            const [currResponse, resResponse] = await Promise.all([
                fetch('/api/economic/available-currencies'),
                fetch('/api/economic/available-resources')
            ]);
            
            const currData = await currResponse.json();
            const resData = await resResponse.json();
            
            if (currData.success) window.availableCurrencies = currData.currencies;
            if (resData.success) window.availableResources = resData.resources;
        } catch (e) {
            console.error('Ошибка загрузки валют/ресурсов:', e);
        }
    }

    window.loadCountriesEconomic = async function() {
        await window.loadAvailableData();
        
        const countriesList = document.getElementById('countries-economic-list');
        countriesList.innerHTML = '<div class="loading-msg">Загрузка стран...</div>';

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/economic/countries', {
                headers: { 'Authorization': token }
            });
            const data = await response.json();

            if (!data.success) {
                countriesList.innerHTML = `<div class="error">${data.error}</div>`;
                return;
            }

            displayCountriesEconomic(data.countries);
        } catch (e) {
            countriesList.innerHTML = `<div class="error">Ошибка загрузки: ${e.message}</div>`;
        }
    }

    const migrateCountriesBtn = document.getElementById('migrate-countries-btn');
    const migrateResult = document.getElementById('migrate-result');

    if (migrateCountriesBtn) {
        migrateCountriesBtn.addEventListener('click', async () => {
            if (!confirm('Создать страны для всех одобренных заявок без стран?')) {
                return;
            }

            migrateCountriesBtn.disabled = true;
            migrateCountriesBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Миграция...';
            migrateResult.textContent = 'Выполняется миграция...';
            migrateResult.className = 'form-result';

            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/economic/migrate-existing-players', {
                    method: 'POST',
                    headers: { 'Authorization': token }
                });
                const data = await response.json();

                if (data.success) {
                    migrateResult.textContent = data.message;
                    migrateResult.className = 'form-result success';
                    await window.loadCountriesEconomic();
                } else {
                    migrateResult.textContent = `Ошибка: ${data.error}`;
                    migrateResult.className = 'form-result error';
                }
            } catch (err) {
                migrateResult.textContent = `Ошибка: ${err.message}`;
                migrateResult.className = 'form-result error';
            } finally {
                migrateCountriesBtn.disabled = false;
                migrateCountriesBtn.innerHTML = '<i class="fas fa-database"></i> Запустить миграцию';
            }
        });
    }

    function displayCountriesEconomic(countries) {
        const countriesList = document.getElementById('countries-economic-list');

        if (!countries || countries.length === 0) {
            countriesList.innerHTML = '<div class="loading-msg">Нет зарегистрированных стран</div>';
            return;
        }

        let html = '';
        for (const country of countries) {
            const mainCurrencyName = availableCurrencies[country.main_currency]?.name || country.main_currency;
            html += `
                <div class="item-card">
                    <div class="item-header">
                        <div>
                            <div class="item-code">${country.country_name}</div>
                            <div class="item-name">ID: ${country.id}</div>
                        </div>
                        <div class="item-rate">
                            <i class="fas fa-gem"></i> ${country.secret_coins} секретных монет
                        </div>
                    </div>
                    <div class="application-details" style="margin-top:12px">
                        <div class="detail-item">
                            <span class="detail-label">Правитель</span>
                            <span class="detail-value">${country.ruler_first_name} ${country.ruler_last_name}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Игрок</span>
                            <span class="detail-value">${country.player_username || 'N/A'} (ID: ${country.player_id})</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Основная валюта</span>
                            <span class="detail-value">${mainCurrencyName} (${country.main_currency})</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Создана</span>
                            <span class="detail-value">${new Date(country.created_at).toLocaleString('ru-RU')}</span>
                        </div>
                    </div>
                    <div style="margin-top: 12px; display: flex; gap: 8px;">
                        <button onclick="manageCountryResources('${country.id}', '${country.country_name}')" class="btn-view">
                            <i class="fas fa-boxes"></i> Управление ресурсами
                        </button>
                    </div>
                </div>
            `;
        }

        countriesList.innerHTML = html;
    }

    const addCoinsForm = document.getElementById('add-coins-form');
    const addCoinsResult = document.getElementById('add-coins-result');

    if (addCoinsForm) {
        addCoinsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const countryId = document.getElementById('coins-country-id').value.trim();
            const amount = parseInt(document.getElementById('coins-amount').value);
            
            addCoinsResult.textContent = 'Отправка...';
            addCoinsResult.className = 'form-result';
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/economic/country/${countryId}/add-coins?amount=${amount}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    addCoinsResult.textContent = data.message;
                    addCoinsResult.className = 'form-result success';
                    addCoinsForm.reset();
                    await window.loadCountriesEconomic();
                } else {
                    addCoinsResult.textContent = `Ошибка: ${data.error}`;
                    addCoinsResult.className = 'form-result error';
                }
            } catch (err) {
                addCoinsResult.textContent = `Ошибка: ${err.message}`;
                addCoinsResult.className = 'form-result error';
            }
        });
    }

    const updateCurrencyCountryForm = document.getElementById('update-currency-form');
    const updateCurrencyCountryResult = document.getElementById('update-currency-result');

    if (updateCurrencyCountryForm) {
        updateCurrencyCountryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const countryId = document.getElementById('currency-country-id').value.trim();
            const currency = document.getElementById('currency-name').value.trim();
            
            updateCurrencyCountryResult.textContent = 'Отправка...';
            updateCurrencyCountryResult.className = 'form-result';
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/economic/country/${countryId}/update`, {
                    method: 'POST',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ currency })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    updateCurrencyCountryResult.textContent = data.message;
                    updateCurrencyCountryResult.className = 'form-result success';
                    updateCurrencyCountryForm.reset();
                    await window.loadCountriesEconomic();
                } else {
                    updateCurrencyCountryResult.textContent = `Ошибка: ${data.error}`;
                    updateCurrencyCountryResult.className = 'form-result error';
                }
            } catch (err) {
                updateCurrencyCountryResult.textContent = `Ошибка: ${err.message}`;
                updateCurrencyCountryResult.className = 'form-result error';
            }
        });
    }

    async function loadSettings() {
        await loadRules();
        await loadCountries();
    }

    const rulesContent = document.getElementById('rules-content');
    const editRulesForm = document.getElementById('edit-rules-form');
    const editRulesResult = document.getElementById('edit-rules-result');

    async function loadRules() {
        try {
            const resp = await fetch('/api/settings/rules', {
                headers: { 'Authorization': token }
            });
            const data = await resp.json();
            
            if (data.success) {
                rulesContent.value = data.content;
            } else {
                rulesContent.value = 'Ошибка загрузки правил';
            }
        } catch (e) {
            rulesContent.value = 'Ошибка загрузки правил';
        }
    }

    editRulesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const resp = await fetch('/api/settings/rules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ content: rulesContent.value })
            });

            const data = await resp.json();
            
            if (data.success) {
                editRulesResult.textContent = 'Правила сохранены!';
                editRulesResult.className = 'form-result success';
            } else {
                editRulesResult.textContent = data.error || 'Ошибка сохранения';
                editRulesResult.className = 'form-result error';
            }
        } catch (err) {
            editRulesResult.textContent = 'Ошибка запроса';
            editRulesResult.className = 'form-result error';
        }
    });

    const countriesListSettings = document.getElementById('countries-list');

    async function loadCountries() {
        try {
            const resp = await fetch('/api/settings/countries', {
                headers: { 'Authorization': token }
            });
            const data = await resp.json();
            
            if (data.success) {
                displayCountries(data.countries);
            }
        } catch (e) {
            countriesListSettings.innerHTML = '<div class="error">Ошибка загрузки стран</div>';
        }
    }

    function displayCountries(countries) {
        if (!countries || countries.length === 0) {
            countriesListSettings.innerHTML = '<div class="loading-msg">Нет стран</div>';
            return;
        }

        let html = '';
        for (const country of countries) {
            const statusColor = country.available ? '#00ff88' : '#ff4444';
            const statusText = country.available ? 'Доступна' : 'Недоступна';
            
            html += `
                <div class="item-card" onclick="selectCountry('${country.id}')" style="cursor:pointer;">
                    <div class="item-header">
                        <div>
                            <div class="item-code">${country.name}</div>
                            <div class="item-name">ID: ${country.id}</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="color:${statusColor};font-weight:bold;">${statusText}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        countriesListSettings.innerHTML = html;
    }

    window.selectCountry = async function(countryId) {
        try {
            const resp = await fetch('/api/settings/countries', {
                headers: { 'Authorization': token }
            });
            const data = await resp.json();
            const country = data.countries.find(c => c.id === countryId);
            
            if (!country) return;
            
            document.getElementById('country-id-edit-old').value = country.id;
            document.getElementById('country-id-edit').value = country.id;
            document.getElementById('country-name-edit').value = country.name;
            document.getElementById('country-available-edit').checked = country.available;
            
            document.getElementById('edit-country-form').style.display = 'flex';
            document.getElementById('country-edit-placeholder').style.display = 'none';
            document.getElementById('edit-country-form').scrollIntoView({ behavior: 'smooth' });
        } catch (e) {
            console.error('Error selecting country:', e);
        }
    };

    const addCountryForm = document.getElementById('add-country-form');
    const addCountryResult = document.getElementById('add-country-result');

    addCountryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const countryData = {
            id: document.getElementById('country-id-add').value,
            name: document.getElementById('country-name-add').value,
            available: document.getElementById('country-available-add').checked
        };

        try {
            const resp = await fetch('/api/settings/countries/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(countryData)
            });

            const data = await resp.json();
            
            if (data.success) {
                addCountryResult.textContent = 'Страна добавлена!';
                addCountryResult.className = 'form-result success';
                addCountryForm.reset();
                document.getElementById('country-available-add').checked = true;
                await loadCountries();
            } else {
                addCountryResult.textContent = data.error || 'Ошибка';
                addCountryResult.className = 'form-result error';
            }
        } catch (err) {
            addCountryResult.textContent = 'Ошибка запроса';
            addCountryResult.className = 'form-result error';
        }
    });

    const editCountryForm = document.getElementById('edit-country-form');
    const editCountryResult = document.getElementById('edit-country-result');

    editCountryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const countryData = {
            old_id: document.getElementById('country-id-edit-old').value,
            id: document.getElementById('country-id-edit').value,
            name: document.getElementById('country-name-edit').value,
            available: document.getElementById('country-available-edit').checked
        };

        try {
            const resp = await fetch('/api/settings/countries/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(countryData)
            });

            const data = await resp.json();
            
            if (data.success) {
                editCountryResult.textContent = 'Страна обновлена!';
                editCountryResult.className = 'form-result success';
                await loadCountries();
            } else {
                editCountryResult.textContent = data.error || 'Ошибка';
                editCountryResult.className = 'form-result error';
            }
        } catch (err) {
            editCountryResult.textContent = 'Ошибка запроса';
            editCountryResult.className = 'form-result error';
        }
    });

    document.getElementById('delete-country-btn').addEventListener('click', async () => {
        const countryId = document.getElementById('country-id-edit-old').value;
        const countryName = document.getElementById('country-name-edit').value;
        
        if (!confirm(`Вы уверены, что хотите удалить страну "${countryName}"?`)) {
            return;
        }

        try {
            const resp = await fetch('/api/settings/countries/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ id: countryId })
            });

            const data = await resp.json();
            
            if (data.success) {
                editCountryResult.textContent = 'Страна удалена!';
                editCountryResult.className = 'form-result success';
                editCountryForm.style.display = 'none';
                document.getElementById('country-edit-placeholder').style.display = 'block';
                await loadCountries();
            } else {
                editCountryResult.textContent = data.error || 'Ошибка';
                editCountryResult.className = 'form-result error';
            }
        } catch (err) {
            editCountryResult.textContent = 'Ошибка запроса';
            editCountryResult.className = 'form-result error';
        }
    });
});

window.manageCountryResources = async function(countryId, countryName) {
    const modalOverlay = document.querySelector('.modal-overlay-admin');
    const modalContent = document.querySelector('.modal-content-admin');
    
    if (!modalOverlay || !modalContent) {
        console.error('Модальное окно не найдено в DOM', { modalOverlay, modalContent });
        window.showError('Ошибка', 'Элементы модального окна не найдены');
        return;
    }
    
    const modalTitle = modalContent.querySelector('.modal-title');
    const modalForm = modalContent.querySelector('.modal-form');

    if (!modalTitle || !modalForm) {
        console.error('Элементы внутри модального окна не найдены', { modalTitle, modalForm, modalContent });
        window.showError('Ошибка', 'Не удалось открыть модальное окно');
        return;
    }

    modalTitle.textContent = `Управление ресурсами: ${countryName}`;
    
    if (Object.keys(window.availableCurrencies).length === 0 || Object.keys(window.availableResources).length === 0) {
        await window.loadAvailableData();
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/economic/country/${countryId}/resources`, {
            headers: { 'Authorization': token }
        });
        const data = await response.json();
        
        if (!data.success) {
            window.showError('Ошибка', 'Ошибка загрузки ресурсов');
            return;
        }

        let formHtml = '<div style="max-height: 500px; overflow-y: auto;">';
        
        formHtml += '<div style="margin-bottom: 20px; padding: 16px; background: #232323; border-radius: 8px;">';
        formHtml += '<h3 style="margin: 0 0 12px 0; color: #00ffc6;"><i class="fas fa-coins"></i> Основная валюта</h3>';
        formHtml += '<select id="main-currency-select" style="width: 100%;">';
        for (const [code, info] of Object.entries(window.availableCurrencies)) {
            const selected = code === data.main_currency ? 'selected' : '';
            formHtml += `<option value="${code}" ${selected}>${info.name} (${code})</option>`;
        }
        formHtml += '</select>';
        formHtml += '<button onclick="updateMainCurrency(\'' + countryId + '\')" style="margin-top: 8px; width: 100%;" class="btn-approve">Обновить основную валюту</button>';
        formHtml += '</div>';
        
        formHtml += '<div style="margin-bottom: 20px;">';
        formHtml += '<h3 style="margin: 0 0 12px 0; color: #00ffc6;"><i class="fas fa-money-bill-wave"></i> Валюты</h3>';
        for (const [code, info] of Object.entries(window.availableCurrencies)) {
            const amount = data.currencies[code] || 0;
            formHtml += `
                <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
                    <label style="flex: 1; margin: 0;">${info.name} (${code})</label>
                    <input type="number" id="currency-${code}" value="${amount}" style="width: 120px;" />
                    <button onclick="updateCountryCurrency('${countryId}', '${code}')" class="btn-approve" style="padding: 6px 12px;">
                        <i class="fas fa-save"></i>
                    </button>
                </div>
            `;
        }
        formHtml += '</div>';
        
        formHtml += '<div>';
        formHtml += '<h3 style="margin: 0 0 12px 0; color: #00ffc6;"><i class="fas fa-box"></i> Ресурсы</h3>';
        for (const [code, info] of Object.entries(window.availableResources)) {
            const amount = data.resources[code] || 0;
            formHtml += `
                <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
                    <label style="flex: 1; margin: 0;">${info.name} (${code})</label>
                    <input type="number" id="resource-${code}" value="${amount}" style="width: 120px;" />
                    <button onclick="updateCountryResource('${countryId}', '${code}')" class="btn-approve" style="padding: 6px 12px;">
                        <i class="fas fa-save"></i>
                    </button>
                </div>
            `;
        }
        formHtml += '</div>';
        formHtml += '</div>';

        modalForm.innerHTML = formHtml;
        modalOverlay.classList.add('active');
    } catch (e) {
		window.showError('Ошибка', e.message);
    }
};

window.updateMainCurrency = async function(countryId) {
    const currencyCode = document.getElementById('main-currency-select').value;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/economic/country/${countryId}/update-main-currency`, {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ main_currency: currencyCode })
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.showSuccess('Успех!', 'Основная валюта обновлена!');
            await window.loadCountriesEconomic();
        } else {
            window.showError('Ошибка', data.message);
        }
    } catch (e) {
        console.error('Ошибка в updateMainCurrency:', e);
        window.showError('Ошибка', e.message);
    }
};

window.updateCountryCurrency = async function(countryId, currencyCode) {
    const amount = parseInt(document.getElementById(`currency-${currencyCode}`).value) || 0;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/economic/country/${countryId}/update-currency`, {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currency_code: currencyCode, amount })
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.showSuccess('Успех', 'Валюта успешно обновлена');
        } else {
            window.showError('Ошибка', data.message || 'Не удалось обновить валюту');
        }
    } catch (e) {
		window.showError('Ошибка', e.message);
    }
};

window.updateCountryResource = async function(countryId, resourceCode) {
    const amount = parseInt(document.getElementById(`resource-${resourceCode}`).value) || 0;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/economic/country/${countryId}/update-resource`, {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ resource_code: resourceCode, amount })
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.showSuccess('Успех', 'Ресурс успешно обновлён');
        } else {
            window.showError('Ошибка', data.message || 'Не удалось обновить ресурс');
        }
    } catch (e) {
		window.showError('Ошибка', e.message);
    }
};

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