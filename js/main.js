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

	let isAdmin = false;

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

	function showWelcome(username, adminFlag) {
		authBlock.classList.add('hidden');
		welcomeBlock.classList.remove('hidden');
		logoutBtn.classList.remove('hidden');
		if (mainContainer) mainContainer.classList.add('hidden');
		if (welcomeText) {
			welcomeText.textContent = `Добро пожаловать, ${username}! Выберите действие:`;
		}
		const usernameDisplay = document.getElementById('username-display');
		if (usernameDisplay) {
			usernameDisplay.textContent = username;
		}
		localStorage.setItem('username', username);
		pendingEmail = null;

		const featuresGrid = document.querySelector('.features-grid');
		if (featuresGrid) {
			const oldAdminCard = featuresGrid.querySelector('.feature-card.admin-panel');
			if (oldAdminCard) oldAdminCard.remove();
			if (adminFlag) {
				const adminCard = document.createElement('a');
				adminCard.href = '/admin';
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
	const THEME_KEY = 'theme';

	const savedTheme = localStorage.getItem(THEME_KEY);
	const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
	setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

	if (themeToggle) {
		themeToggle.addEventListener('click', () => {
			const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
			setTheme(nextTheme);
		});
	}

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

	const savedToken = localStorage.getItem('token');
	const savedUsername = localStorage.getItem('username');
	if (savedToken && savedUsername) {
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
});