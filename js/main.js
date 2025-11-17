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
	});
	registerBtn.addEventListener('click', () => {
		registerBtn.classList.add('active');
		loginBtn.classList.remove('active');
		registerForm.classList.remove('hidden');
		loginForm.classList.add('hidden');
		verifyForm.classList.add('hidden');
	});

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
			showWelcome(data.username);
		} else {
			errorBlock.textContent = data.error || 'Ошибка входа';
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
			showWelcome(data.username);
			pendingEmail = null;
		} else {
			errorBlock.textContent = data.error || 'Неверный код';
		}
	});

	function showWelcome(username) {
		authBlock.classList.add('hidden');
		welcomeBlock.classList.remove('hidden');
		if (welcomeText) {
			welcomeText.textContent = `Приветствуем вновь, ${username}!`;
		}
		localStorage.setItem('username', username);
		pendingEmail = null;
	}

	if (logoutBtn) {
		logoutBtn.addEventListener('click', () => {
			localStorage.removeItem('username');
			localStorage.removeItem('token');
			sessionToken = null;
			welcomeBlock.classList.add('hidden');
			authBlock.classList.remove('hidden');
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
				showWelcome(savedUsername);
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
