document.addEventListener('DOMContentLoaded', () => {
	const loginBtn = document.getElementById('login-btn');
	const registerBtn = document.getElementById('register-btn');
	const loginForm = document.getElementById('login-form');
	const registerForm = document.getElementById('register-form');
	const verifyForm = document.getElementById('verify-form');
	const welcomeBlock = document.getElementById('welcome');
	const authBlock = document.getElementById('auth-block');
	const welcomeText = document.getElementById('welcome-text');
	const logoutBtn = document.getElementById('logout-btn');
	const themeToggle = document.getElementById('theme-toggle');
	
	const forgotBtn = document.getElementById('forgot-btn');
	const forgotForm = document.getElementById('forgot-form');
	const resetForm = document.getElementById('reset-form');
	const forgotEmailInput = document.getElementById('forgot-email');
	const forgotError = document.getElementById('forgot-error');
	const resetCodeInput = document.getElementById('reset-code');
	const resetPasswordInput = document.getElementById('reset-password');
	const resetError = document.getElementById('reset-error');
	let resetEmail = null;
	let resetStep = 0;

	// ...удалён код 3D-карусели...
	let isAdmin = false; // Добавлено для проверки админа

	// ...удалена поддержка клавиатуры для карусели...

	// Вход
	loginForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const username = document.getElementById('login-username').value;
		const password = document.getElementById('login-password').value;
		const errorBlock = document.getElementById('login-error');
		errorBlock.textContent = '';
		const res = await fetch('/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password })
		});
		const data = await res.json();
		if (data.success) {
			sessionToken = data.token;
			localStorage.setItem('token', sessionToken);
			isAdmin = (typeof data.role !== 'undefined' && data.role === 'admin');
			showWelcome(data.username, isAdmin);
		} else {
			if (data.error && data.error.startsWith('Аккаунт забанен до ')) {
				const iso = data.error.replace('Аккаунт забанен до ', '').trim();
				const dt = new Date(iso);
				const local = dt.toLocaleString();
				errorBlock.textContent = `Аккаунт забанен до ${local}`;
			} else {
				errorBlock.textContent = data.error || 'Ошибка входа';
			}
		}
	});

	// ...удалена функция showWelcome с carousel3D...
	function showWelcome(username, adminFlag) {
		authBlock.classList.add('hidden');
		welcomeBlock.classList.remove('hidden');
		logoutBtn.classList.remove('hidden');
		if (mainContainer) mainContainer.classList.add('hidden');
		if (welcomeText) {
			welcomeText.textContent = `Добро пожаловать, ${username}! Выберите действие:`;
		}
		localStorage.setItem('username', username);
		pendingEmail = null;

		// Админ-карточка
		const featuresGrid = document.querySelector('.features-grid');
		if (featuresGrid) {
			// Удаляем старую админ-карточку, если есть (чтобы не дублировать)
			const oldAdminCard = featuresGrid.querySelector('.feature-card.admin-panel');
			if (oldAdminCard) oldAdminCard.remove();
			if (adminFlag) {
				// Создаём карточку админа
				const adminCard = document.createElement('a');
				adminCard.href = 'admin.html';
				adminCard.className = 'feature-card admin-panel';
				adminCard.innerHTML = `
					<div class="feature-icon"><i class="fas fa-user-shield"></i></div>
					<h3>Админ-панель</h3>
					<p>Управление пользователями и платформой</p>
					<div class="feature-badge">Только для админов</div>
				`;
				featuresGrid.appendChild(adminCard);
			}
		}
	}

	// Проверка авторизации при загрузке
	// ...existing code...

	// Поддержка клавиатуры
	document.addEventListener('keydown', (e) => {
		if (!welcomeBlock.classList.contains('hidden')) {
			if (e.key === 'ArrowLeft') {
				rotateCarousel('left');
			} else if (e.key === 'ArrowRight') {
				rotateCarousel('right');
			}
		}
	});

	let pendingEmail = null;
	let sessionToken = null;
	const THEME_KEY = 'theme-mode';

	// Инициализация темы
	const savedTheme = localStorage.getItem(THEME_KEY);
	const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
	setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

	if (themeToggle) {
		themeToggle.addEventListener('click', () => {
			const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
			setTheme(nextTheme);
		});
	}

	// Переключение между формами
	loginBtn.addEventListener('click', () => {
		loginBtn.classList.add('active');
		registerBtn.classList.remove('active');
		loginForm.classList.remove('hidden');
		registerForm.classList.add('hidden');
		verifyForm.classList.add('hidden');
		forgotForm.classList.add('hidden');
		resetForm.classList.add('hidden');
	});
	
	registerBtn.addEventListener('click', () => {
		registerBtn.classList.add('active');
		loginBtn.classList.remove('active');
		registerForm.classList.remove('hidden');
		loginForm.classList.add('hidden');
		verifyForm.classList.add('hidden');
		forgotForm.classList.add('hidden');
		resetForm.classList.add('hidden');
	});

	// Кнопка "Забыл пароль"
	if (forgotBtn) {
		forgotBtn.addEventListener('click', () => {
			loginForm.classList.add('hidden');
			registerForm.classList.add('hidden');
			verifyForm.classList.add('hidden');
			forgotForm.classList.remove('hidden');
			resetForm.classList.add('hidden');
			forgotError.textContent = '';
			resetStep = 0;
		});
	}

	// Ввод email для восстановления
	if (forgotForm) {
		forgotForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const email = forgotEmailInput.value;
			forgotError.textContent = '';
			const res = await fetch('/forgot', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});
			const data = await res.json();
			if (data.success) {
				resetEmail = email;
				forgotForm.classList.add('hidden');
				resetForm.classList.remove('hidden');
				resetStep = 1;
				resetError.textContent = 'Код выслан на почту. Введите код.';
				resetCodeInput.value = '';
				resetPasswordInput.value = '';
			} else {
				forgotError.textContent = data.error || 'Ошибка восстановления';
			}
		});
	}

	// Ввод кода и нового пароля
	if (resetForm) {
		resetForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const code = resetCodeInput.value;
			const new_password = resetPasswordInput.value;
			resetError.textContent = '';
			if (resetStep === 1) {
				if (!code || !new_password) {
					resetError.textContent = 'Введите код и новый пароль';
					return;
				}
				const res = await fetch('/reset', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: resetEmail, code, new_password })
				});
				const data = await res.json();
				if (data.success) {
					resetError.textContent = 'Пароль успешно изменён!';
					setTimeout(() => {
						resetForm.classList.add('hidden');
						loginForm.classList.remove('hidden');
						loginBtn.classList.add('active');
						registerBtn.classList.remove('active');
					}, 1500);
				} else {
					resetError.textContent = data.error || 'Ошибка смены пароля';
				}
			}
		});
	}

	// Вход
	loginForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const username = document.getElementById('login-username').value;
		const password = document.getElementById('login-password').value;
		const errorBlock = document.getElementById('login-error');
		errorBlock.textContent = '';
		const res = await fetch('/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password })
		});
		const data = await res.json();
		if (data.success) {
			sessionToken = data.token;
			localStorage.setItem('token', sessionToken);
			isAdmin = (typeof data.role !== 'undefined' && data.role === 'admin'); // Проверка на админа по строке
			showWelcome(data.username, isAdmin);
		} else {
			if (data.error && data.error.startsWith('Аккаунт забанен до ')) {
				const iso = data.error.replace('Аккаунт забанен до ', '').trim();
				const dt = new Date(iso);
				const local = dt.toLocaleString();
				errorBlock.textContent = `Аккаунт забанен до ${local}`;
			} else {
				errorBlock.textContent = data.error || 'Ошибка входа';
			}
		}
	});

	// Регистрация
	registerForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const username = document.getElementById('register-username').value;
		const password = document.getElementById('register-password').value;
		const email = document.getElementById('register-email').value;
		const errorBlock = document.getElementById('register-error');
		errorBlock.textContent = '';
		const res = await fetch('/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password, email })
		});
		const data = await res.json();
		if (data.success) {
			pendingEmail = email;
			registerForm.classList.add('hidden');
			verifyForm.classList.remove('hidden');
		} else {
			errorBlock.textContent = data.error || 'Ошибка регистрации';
		}
	});

	// Подтверждение кода
	verifyForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const code = document.getElementById('verify-code').value;
		const errorBlock = document.getElementById('verify-error');
		errorBlock.textContent = '';
		const res = await fetch('/verify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code, email: pendingEmail })
		});
		const data = await res.json();
		if (data.success) {
			sessionToken = data.token;
			localStorage.setItem('token', sessionToken);
			isAdmin = (typeof data.role !== 'undefined' && data.role === 'admin');
			showWelcome(data.username, isAdmin);
			pendingEmail = null;
		} else {
			errorBlock.textContent = data.error || 'Неверный код';
		}
	});

	const mainContainer = document.querySelector('.container');

	function showWelcome(username, adminFlag) {
		authBlock.classList.add('hidden');
		welcomeBlock.classList.remove('hidden');
		logoutBtn.classList.remove('hidden');
		if (mainContainer) mainContainer.classList.add('hidden');
		if (welcomeText) {
			welcomeText.textContent = `Добро пожаловать, ${username}! Выберите действие:`;
		}
		localStorage.setItem('username', username);
		pendingEmail = null;
		// ...admin-функционал для карусели удалён...
	}

	if (logoutBtn) {
		logoutBtn.addEventListener('click', () => {
			localStorage.removeItem('username');
			localStorage.removeItem('token');
			sessionToken = null;
			welcomeBlock.classList.add('hidden');
			authBlock.classList.remove('hidden');
			logoutBtn.classList.add('hidden');
			if (mainContainer) mainContainer.classList.remove('hidden');
			if (welcomeText) {
				welcomeText.textContent = '';
			}
			pendingEmail = null;
			resetForms();
		});
	}

	// Проверка авторизации при загрузке
	const savedToken = localStorage.getItem('token');
	const savedUsername = localStorage.getItem('username');
	if (savedToken && savedUsername) {
		// Проверяем токен на сервере
		fetch('/me', {
			method: 'GET',
			headers: { 'Authorization': savedToken }
		}).then(async res => {
			const data = await res.json();
			if (data.logged_in && data.username === savedUsername) {
				sessionToken = savedToken;
				isAdmin = (typeof data.role !== 'undefined' && data.role === 'admin');
				showWelcome(savedUsername, isAdmin);
			} else {
				localStorage.removeItem('token');
				localStorage.removeItem('username');
			}
		});
	}

	function resetForms() {
		loginBtn.classList.add('active');
		registerBtn.classList.remove('active');
		loginForm.classList.remove('hidden');
		registerForm.classList.add('hidden');
		verifyForm.classList.add('hidden');
		forgotForm.classList.add('hidden');
		resetForm.classList.add('hidden');
	}

	function setTheme(theme) {
		document.body.classList.toggle('dark-mode', theme === 'dark');
		localStorage.setItem(THEME_KEY, theme);
		if (themeToggle) {
			themeToggle.setAttribute('aria-pressed', theme === 'dark');
			const label = themeToggle.querySelector('.theme-toggle__label');
			if (label) {
				label.textContent = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
			}
		}
	}

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
});