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
	
	// Элементы для восстановления пароля
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

	// 3D Карусель
	const carousel3D = document.getElementById('carousel-3d');
	const leftArrow = document.getElementById('carousel-left');
	const rightArrow = document.getElementById('carousel-right');
	let currentIndex = 0;
	const leftArrow = document.getElementById('carousel-left');
	const rightArrow = document.getElementById('carousel-right');
	let currentIndex = 0;

	function getCarouselItems() {
	    return carousel3D.querySelectorAll('.carousel-item');
	}

	function getTotalItems() {
	    return getCarouselItems().length;
	}

	function getAngleStep() {
	    const totalItems = getTotalItems();
	    return totalItems > 0 ? 360 / totalItems : 90;
	}

	function updateCarousel() {
	const carouselItems = getCarouselItems();
	const totalItems = carouselItems.length;
	const angleStep = getAngleStep();
	const rotationAngle = -currentIndex * angleStep;
	carousel3D.style.transform = `rotateY(${rotationAngle}deg)`;
    
	carouselItems.forEach((item, index) => {
		const itemAngle = index * angleStep;
		const distance = 280;
		item.style.transform = `rotateY(${itemAngle}deg) translateZ(${distance}px)`;
		// Определяем центральный элемент
		const normalizedIndex = ((index - currentIndex) % totalItems + totalItems) % totalItems;
		if (normalizedIndex === 0) {
			item.style.opacity = '1';
			item.style.transform = `rotateY(${itemAngle}deg) translateZ(${distance}px) scale(1.15)`;
			item.style.zIndex = '10';
			item.style.boxShadow = '0 16px 40px rgba(33, 147, 176, 0.4)';
		} else if (normalizedIndex === 1 || normalizedIndex === totalItems - 1) {
			item.style.opacity = '0.7';
			item.style.transform = `rotateY(${itemAngle}deg) translateZ(${distance}px) scale(0.9)`;
			item.style.zIndex = '5';
			item.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
		} else {
			item.style.opacity = '0.4';
			item.style.transform = `rotateY(${itemAngle}deg) translateZ(${distance}px) scale(0.75)`;
			item.style.zIndex = '1';
			item.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
		}
	});
	}

	function rotateCarousel(direction) {
	const totalItems = getTotalItems();
	if (totalItems === 0) return;
	if (direction === 'left') {
		currentIndex = (currentIndex - 1 + totalItems) % totalItems;
	} else {
		currentIndex = (currentIndex + 1) % totalItems;
	}
	updateCarousel();
	attachCarouselItemHandlers();
	}

	if (leftArrow) {
		leftArrow.addEventListener('click', () => rotateCarousel('left'));
	}

	if (rightArrow) {
		rightArrow.addEventListener('click', () => rotateCarousel('right'));
	}

	// Клик по элементу карусели
	function attachCarouselItemHandlers() {
		const carouselItems = getCarouselItems();
		const totalItems = carouselItems.length;
		carouselItems.forEach((item, index) => {
			item.onclick = () => {
				const link = item.getAttribute('data-link');
				const normalizedIndex = ((index - currentIndex) % totalItems + totalItems) % totalItems;
				if (normalizedIndex === 0) {
					if (link === '#logout') {
						if (logoutBtn) logoutBtn.click();
					} else {
						alert('Переход: ' + link.replace('#', ''));
					}
				} else {
					currentIndex = index;
					updateCarousel();
					attachCarouselItemHandlers();
				}
			};
		});
	}

	// Инициализация карусели
	updateCarousel();
	attachCarouselItemHandlers();

	let isAdmin = false; // Добавлено для проверки админа

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
			errorBlock.textContent = data.error || 'Ошибка входа';
		}
	});

	// Функция для отображения приветствия
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

	    // Добавляем admin-элемент только если adminFlag
	    const adminSelector = '.carousel-item[data-link="#admin"]';
	    if (adminFlag && !carousel3D.querySelector(adminSelector)) {
	        const adminItem = document.createElement('div');
	        adminItem.className = 'carousel-item';
	        adminItem.setAttribute('data-link', '#admin');
	        adminItem.innerHTML = `
	            <svg class="carousel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l7 4v5c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V6z"/></svg>
	            <span>Админ</span>
	        `;
	        carousel3D.appendChild(adminItem);
	    } else if (!adminFlag && carousel3D.querySelector(adminSelector)) {
	        carousel3D.querySelector(adminSelector).remove();
	    }
	    currentIndex = 0;
	    updateCarousel();
	    attachCarouselItemHandlers();
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
			isAdmin = (typeof data.role !== 'undefined' && data.role === 'admin');
			showWelcome(data.username);
			pendingEmail = null;
		} else {
			errorBlock.textContent = data.error || 'Неверный код';
		}
	});

	const mainContainer = document.querySelector('.container');

	function showWelcome(username) {
		authBlock.classList.add('hidden');
		welcomeBlock.classList.remove('hidden');
		logoutBtn.classList.remove('hidden');
		if (mainContainer) mainContainer.classList.add('hidden');
		if (welcomeText) {
			welcomeText.textContent = `Добро пожаловать, ${username}! Выберите действие:`;
		}
		localStorage.setItem('username', username);
		pendingEmail = null;
		currentIndex = 0;
		updateCarousel();
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
});