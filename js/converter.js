const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
	body.classList.add('dark-mode');
	themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

themeToggle.addEventListener('click', () => {
	body.classList.toggle('dark-mode');
	const isDark = body.classList.contains('dark-mode');
	themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
	localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

const converterTabs = document.querySelectorAll('.converter-tab');
const converterPanels = document.querySelectorAll('.converter-panel');

converterTabs.forEach(tab => {
	tab.addEventListener('click', () => {
		const targetTab = tab.dataset.tab;
		
		converterTabs.forEach(t => t.classList.remove('active'));
		converterPanels.forEach(p => p.classList.remove('active'));
		
		tab.classList.add('active');
		document.getElementById(`${targetTab}-panel`).classList.add('active');
		
		if (targetTab === 'currency') {
			loadCurrencyRates();
		} else if (targetTab === 'resources') {
			loadResourceRates();
		} else if (targetTab === 'mixed') {
			loadMixedConverter();
		}
	});
});

const currencyAmountFrom = document.getElementById('currency-amount-from');
const currencyAmountTo = document.getElementById('currency-amount-to');
const currencyFrom = document.getElementById('currency-from');
const currencyTo = document.getElementById('currency-to');
const currencySwapBtn = document.getElementById('currency-swap');
const currencyConvertBtn = document.getElementById('currency-convert-btn');
const currencyRateInfo = document.getElementById('currency-rate-info');
const currencyRatesTable = document.getElementById('currency-rates-table');

const resourceAmountFrom = document.getElementById('resource-amount-from');
const resourceAmountTo = document.getElementById('resource-amount-to');
const resourceFrom = document.getElementById('resource-from');
const resourceTo = document.getElementById('resource-to');
const resourceSwapBtn = document.getElementById('resource-swap');
const resourceConvertBtn = document.getElementById('resource-convert-btn');
const resourceRateInfo = document.getElementById('resource-rate-info');
const resourceRatesTable = document.getElementById('resource-rates-table');

const mixedAmountFrom = document.getElementById('mixed-amount-from');
const mixedAmountTo = document.getElementById('mixed-amount-to');
const mixedCurrencyFrom = document.getElementById('mixed-currency-from');
const mixedResourceTo = document.getElementById('mixed-resource-to');
const mixedSwapBtn = document.getElementById('mixed-swap');
const mixedConvertBtn = document.getElementById('mixed-convert-btn');
const mixedRateInfo = document.getElementById('mixed-rate-info');

const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

let currencyRates = {};
let resourceRates = {};
let currencyData = {};
let resourceData = {};

async function loadCurrencyRates() {
	try {
		const response = await fetch('/api/converter/currency-rates');
		const data = await response.json();
		
		if (data.success) {
			currencyRates = data.rates;
			
			const fullDataResp = await fetch('/api/converter/data');
			
			if (fullDataResp.ok) {
				const fullData = await fullDataResp.json();
				if (fullData.success) {
					currencyData = fullData.data.currencies;
				}
			}
			
			populateCurrencySelects();
			displayCurrencyRates();
			updateCurrencyConversion();
		}
	} catch (error) {
		console.error('Ошибка загрузки курсов валют:', error);
		currencyRatesTable.innerHTML = '<div class="error">Ошибка загрузки курсов</div>';
	}
}

function populateCurrencySelects() {
	const codes = Object.keys(currencyRates).sort();
	
	const selectedFrom = currencyFrom.value || Object.keys(currencyRates)[0];
	const selectedTo = currencyTo.value || Object.keys(currencyRates)[1];
	
	currencyFrom.innerHTML = '';
	currencyTo.innerHTML = '';
	
	codes.forEach(code => {
		const name = currencyData[code]?.name || code;
		
		const optionFrom = document.createElement('option');
		optionFrom.value = code;
		optionFrom.textContent = `${code} - ${name}`;
		currencyFrom.appendChild(optionFrom);
		
		const optionTo = document.createElement('option');
		optionTo.value = code;
		optionTo.textContent = `${code} - ${name}`;
		currencyTo.appendChild(optionTo);
	});
	
	if (codes.includes(selectedFrom)) {
		currencyFrom.value = selectedFrom;
	}
	if (codes.includes(selectedTo)) {
		currencyTo.value = selectedTo;
	}
}

function displayCurrencyRates() {
	let html = '';
	
	for (const [currency, rate] of Object.entries(currencyRates)) {
		const name = currencyData[currency]?.name || currency;
		html += `
			<div class="rate-item">
				<div class="rate-from-to">
					<span>1 Золото</span>
					<i class="fas fa-arrow-right rate-arrow"></i>
					<span>${rate} ${currency} (${name})</span>
				</div>
				<div class="rate-value">${rate}</div>
			</div>
		`;
	}
	
	currencyRatesTable.innerHTML = html;
}

async function loadResourceRates() {
	try {
		const response = await fetch('/api/converter/resource-rates');
		const data = await response.json();
		
		if (data.success) {
			resourceRates = data.rates;
			
			const fullDataResp = await fetch('/api/converter/data');
			
			if (fullDataResp.ok) {
				const fullData = await fullDataResp.json();
				if (fullData.success) {
					resourceData = fullData.data.resources;
				}
			}
			
			populateResourceSelects();
			displayResourceRates();
			updateResourceConversion();
		}
	} catch (error) {
		console.error('Ошибка загрузки курсов ресурсов:', error);
		resourceRatesTable.innerHTML = '<div class="error">Ошибка загрузки курсов</div>';
	}
}

function populateResourceSelects() {
	const codes = Object.keys(resourceRates).sort();
	
	const selectedFrom = resourceFrom.value || 'gold';
	const selectedTo = resourceTo.value || 'silver';
	
	resourceFrom.innerHTML = '';
	resourceTo.innerHTML = '';
	
	codes.forEach(code => {
		const name = resourceData[code]?.name || code;
		
		const optionFrom = document.createElement('option');
		optionFrom.value = code;
		optionFrom.textContent = name;
		resourceFrom.appendChild(optionFrom);
		
		const optionTo = document.createElement('option');
		optionTo.value = code;
		optionTo.textContent = name;
		resourceTo.appendChild(optionTo);
	});
	
	if (codes.includes(selectedFrom)) {
		resourceFrom.value = selectedFrom;
	}
	if (codes.includes(selectedTo)) {
		resourceTo.value = selectedTo;
	}
}

function displayResourceRates() {
	const baseResource = 'gold';
	let html = '';
	
	for (const [resource, rate] of Object.entries(resourceRates)) {
		if (resource !== baseResource) {
			const baseName = resourceData[baseResource]?.name || baseResource;
			const resourceName = resourceData[resource]?.name || resource;
			
			html += `
				<div class="rate-item">
					<div class="rate-from-to">
						<span>1 ${baseName}</span>
						<i class="fas fa-arrow-right rate-arrow"></i>
						<span>${resourceName}</span>
					</div>
					<div class="rate-value">${rate}</div>
				</div>
			`;
		}
	}
	
	resourceRatesTable.innerHTML = html;
}

function getResourceName(resource) {
	return resourceData[resource]?.name || resource;
}

function getCurrencyName(currency) {
	return currencyData[currency]?.name || currency;
}

async function convertCurrencyToResource() {
	const amount = parseFloat(document.getElementById('mixed-amount-from').value);
	const currency = document.getElementById('mixed-currency-from').value;
	const resource = document.getElementById('mixed-resource-to').value;
	
	if (isNaN(amount) || amount <= 0) {
		alert('Введите корректную сумму');
		return;
	}
	
	try {
		const response = await fetch('/api/converter/convert-mixed', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ 
				amount, 
				from: currency, 
				to: resource,
				from_type: 'currency',
				to_type: 'resource'
			})
		});
		
		const data = await response.json();
		
		if (data.success) {
			document.getElementById('mixed-amount-to').value = data.result;
			updateMixedRateInfo(currency, resource, data.rate, 'currency', 'resource');
			addToHistory('mixed', amount, currency, data.result, resource);
		}
	} catch (error) {
		console.error('Ошибка конвертации:', error);
		alert('Ошибка конвертации');
	}
}

function updateMixedRateInfo(from, to, rate, fromType, toType) {
	const fromName = fromType === 'currency' ? getCurrencyName(from) : getResourceName(from);
	const toName = toType === 'currency' ? getCurrencyName(to) : getResourceName(to);
	const mixedRateInfo = document.getElementById('mixed-rate-info');
	
	if (mixedRateInfo) {
		mixedRateInfo.innerHTML = `
			<i class="fas fa-info-circle"></i>
			<span>1 ${fromName} = ${rate} ${toName}</span>
		`;
	}
}

async function convertCurrency() {
	const amount = parseFloat(currencyAmountFrom.value);
	const from = currencyFrom.value;
	const to = currencyTo.value;
	
	if (isNaN(amount) || amount <= 0) {
		alert('Введите корректную сумму');
		return;
	}
	
	try {
		const response = await fetch('/api/converter/convert-currency', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ amount, from, to })
		});
		
		const data = await response.json();
		
		if (data.success) {
			currencyAmountTo.value = data.result.toFixed(2);
			updateCurrencyRateInfo(from, to, data.rate);
			addToHistory('currency', amount, `${from} (${getCurrencyName(from)})`, data.result, `${to} (${getCurrencyName(to)})`);
		}
	} catch (error) {
		console.error('Ошибка конвертации:', error);
		alert('Ошибка конвертации');
	}
}

async function convertResource() {
	const amount = parseInt(resourceAmountFrom.value);
	const from = resourceFrom.value;
	const to = resourceTo.value;
	
	if (isNaN(amount) || amount <= 0) {
		alert('Введите корректное количество');
		return;
	}
	
	try {
		const response = await fetch('/api/converter/convert-resource', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ amount, from, to })
		});
		
		const data = await response.json();
		
		if (data.success) {
			resourceAmountTo.value = data.result;
			updateResourceRateInfo(from, to, data.rate);
			addToHistory('resources', amount, getResourceName(from), data.result, getResourceName(to));
		}
	} catch (error) {
		console.error('Ошибка конвертации:', error);
		alert('Ошибка конвертации');
	}
}

function updateCurrencyRateInfo(from, to, rate) {
	currencyRateInfo.innerHTML = `
		<i class="fas fa-info-circle"></i>
		<span>1 ${from} = ${rate.toFixed(4)} ${to}</span>
	`;
}

function updateResourceRateInfo(from, to, rate) {
	resourceRateInfo.innerHTML = `
		<i class="fas fa-info-circle"></i>
		<span>1 ${getResourceName(from)} = ${rate} ${getResourceName(to)}</span>
	`;
}

currencyAmountFrom.addEventListener('input', updateCurrencyConversion);
currencyFrom.addEventListener('change', updateCurrencyConversion);
currencyTo.addEventListener('change', updateCurrencyConversion);

async function updateCurrencyConversion() {
	const amount = parseFloat(currencyAmountFrom.value);
	const from = currencyFrom.value;
	const to = currencyTo.value;
	
	if (isNaN(amount) || amount <= 0 || Object.keys(currencyRates).length === 0) {
		currencyAmountTo.value = '';
		return;
	}
	
	try {
		const response = await fetch('/api/converter/convert-currency', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ amount, from, to })
		});
		
		const data = await response.json();
		
		if (data.success) {
			currencyAmountTo.value = data.result.toFixed(2);
			updateCurrencyRateInfo(from, to, data.rate);
		}
	} catch (error) {
		console.error('Ошибка конвертации:', error);
	}
}

resourceAmountFrom.addEventListener('input', updateResourceConversion);
resourceFrom.addEventListener('change', updateResourceConversion);
resourceTo.addEventListener('change', updateResourceConversion);

async function updateResourceConversion() {
	const amount = parseInt(resourceAmountFrom.value);
	const from = resourceFrom.value;
	const to = resourceTo.value;
	
	if (isNaN(amount) || amount <= 0 || Object.keys(resourceRates).length === 0) {
		resourceAmountTo.value = '';
		return;
	}
	
	try {
		const response = await fetch('/api/converter/convert-resource', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ amount, from, to })
		});
		
		const data = await response.json();
		
		if (data.success) {
			resourceAmountTo.value = data.result;
			updateResourceRateInfo(from, to, data.rate);
		}
	} catch (error) {
		console.error('Ошибка конвертации:', error);
	}
}

currencySwapBtn.addEventListener('click', () => {
	const tempValue = currencyFrom.value;
	currencyFrom.value = currencyTo.value;
	currencyTo.value = tempValue;
	
	const tempAmount = currencyAmountFrom.value;
	currencyAmountFrom.value = currencyAmountTo.value;
	
	updateCurrencyConversion();
});

resourceSwapBtn.addEventListener('click', () => {
	const tempValue = resourceFrom.value;
	resourceFrom.value = resourceTo.value;
	resourceTo.value = tempValue;
	
	const tempAmount = resourceAmountFrom.value;
	resourceAmountFrom.value = resourceAmountTo.value;
	
	updateResourceConversion();
});

currencyConvertBtn.addEventListener('click', convertCurrency);
resourceConvertBtn.addEventListener('click', convertResource);

function addToHistory(type, amountFrom, currencyFrom, amountTo, currencyTo) {
	const history = getHistory();
	
	const item = {
		type,
		amountFrom,
		currencyFrom,
		amountTo,
		currencyTo,
		timestamp: new Date().toISOString()
	};
	
	history.unshift(item);
	
	if (history.length > 20) {
		history.pop();
	}
	
	saveHistory(history);
	displayHistory();
}

function getHistory() {
	const history = localStorage.getItem('converterHistory');
	return history ? JSON.parse(history) : [];
}

function saveHistory(history) {
	localStorage.setItem('converterHistory', JSON.stringify(history));
}

function displayHistory() {
	const history = getHistory();
	
	if (history.length === 0) {
		historyList.innerHTML = `
			<div class="history-empty">
				<i class="fas fa-clock"></i>
				<p>История конвертаций пуста</p>
			</div>
		`;
		return;
	}
	
	let html = '';
	
	history.forEach(item => {
		const time = new Date(item.timestamp).toLocaleString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
		
		html += `
			<div class="history-item">
				<div class="history-conversion">
					<span class="history-type ${item.type}">${item.type === 'currency' ? 'Валюта' : 'Ресурс'}</span>
					<span>${item.amountFrom} ${item.currencyFrom}</span>
					<i class="fas fa-arrow-right history-arrow"></i>
					<span>${item.amountTo} ${item.currencyTo}</span>
				</div>
				<div class="history-time">${time}</div>
			</div>
		`;
	});
	
	historyList.innerHTML = html;
}

clearHistoryBtn.addEventListener('click', () => {
	if (confirm('Вы уверены, что хотите очистить историю конвертаций?')) {
		localStorage.removeItem('converterHistory');
		displayHistory();
	}
});

async function loadMixedConverter() {
	if (Object.keys(currencyRates).length === 0) {
		await loadCurrencyRates();
	}
	if (Object.keys(resourceRates).length === 0) {
		await loadResourceRates();
	}
	
	populateMixedSelects();
	updateMixedConversion();
}

function populateMixedSelects() {
	const currencyCodes = Object.keys(currencyRates).sort();
	const resourceCodes = Object.keys(resourceRates).sort();
	
	mixedCurrencyFrom.innerHTML = '';
	mixedResourceTo.innerHTML = '';
	
	currencyCodes.forEach(code => {
		const name = currencyData[code]?.name || code;
		const option = document.createElement('option');
		option.value = code;
		option.textContent = `${code} - ${name}`;
		mixedCurrencyFrom.appendChild(option);
	});
	
	resourceCodes.forEach(code => {
		const name = resourceData[code]?.name || code;
		const option = document.createElement('option');
		option.value = code;
		option.textContent = name;
		mixedResourceTo.appendChild(option);
	});
}

async function updateMixedConversion() {
	const amount = parseFloat(mixedAmountFrom.value);
	const currency = mixedCurrencyFrom.value;
	const resource = mixedResourceTo.value;
	
	if (isNaN(amount) || amount <= 0 || !currency || !resource) {
		mixedAmountTo.value = '';
		return;
	}
	
	try {
		const response = await fetch('/api/converter/convert-mixed', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ 
				amount, 
				from: currency, 
				to: resource,
				from_type: 'currency',
				to_type: 'resource'
			})
		});
		
		const data = await response.json();
		
		if (data.success) {
			mixedAmountTo.value = data.result;
			updateMixedRateInfo(currency, resource, data.rate, 'currency', 'resource');
		}
	} catch (error) {
		console.error('Ошибка конвертации:', error);
	}
}

mixedAmountFrom.addEventListener('input', updateMixedConversion);
mixedCurrencyFrom.addEventListener('change', updateMixedConversion);
mixedResourceTo.addEventListener('change', updateMixedConversion);

mixedSwapBtn.addEventListener('click', () => {
	const currencyValue = mixedCurrencyFrom.value;
	const resourceValue = mixedResourceTo.value;
	
	// Меняем местами селекты
	mixedCurrencyFrom.innerHTML = '';
	mixedResourceTo.innerHTML = '';
	
	// Заполняем наоборот
	const resourceCodes = Object.keys(resourceRates).sort();
	const currencyCodes = Object.keys(currencyRates).sort();
	
	resourceCodes.forEach(code => {
		const name = resourceData[code]?.name || code;
		const option = document.createElement('option');
		option.value = code;
		option.textContent = name;
		mixedCurrencyFrom.appendChild(option);
	});
	
	currencyCodes.forEach(code => {
		const name = currencyData[code]?.name || code;
		const option = document.createElement('option');
		option.value = code;
		option.textContent = `${code} - ${name}`;
		mixedResourceTo.appendChild(option);
	});
	
	// Устанавливаем старые значения
	if (resourceValue) mixedCurrencyFrom.value = resourceValue;
	if (currencyValue) mixedResourceTo.value = currencyValue;
	
	const tempAmount = mixedAmountFrom.value;
	mixedAmountFrom.value = mixedAmountTo.value || tempAmount;
	
	updateMixedConversionReverse();
});

async function updateMixedConversionReverse() {
	const amount = parseFloat(mixedAmountFrom.value);
	const resource = mixedCurrencyFrom.value;
	const currency = mixedResourceTo.value;
	
	if (isNaN(amount) || amount <= 0 || !resource || !currency) {
		mixedAmountTo.value = '';
		return;
	}
	
	try {
		const response = await fetch('/api/converter/convert-mixed', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ 
				amount, 
				from: resource, 
				to: currency,
				from_type: 'resource',
				to_type: 'currency'
			})
		});
		
		const data = await response.json();
		
		if (data.success) {
			mixedAmountTo.value = data.result;
			updateMixedRateInfo(resource, currency, data.rate, 'resource', 'currency');
		}
	} catch (error) {
		console.error('Ошибка конвертации:', error);
	}
}

mixedConvertBtn.addEventListener('click', async () => {
	const amount = parseFloat(mixedAmountFrom.value);
	const fromItem = mixedCurrencyFrom.value;
	const toItem = mixedResourceTo.value;
	
	if (isNaN(amount) || amount <= 0) {
		alert('Введите корректную сумму');
		return;
	}
	
	// Определяем типы
	const fromType = Object.keys(currencyRates).includes(fromItem) ? 'currency' : 'resource';
	const toType = Object.keys(currencyRates).includes(toItem) ? 'currency' : 'resource';
	
	try {
		const response = await fetch('/api/converter/convert-mixed', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ 
				amount, 
				from: fromItem, 
				to: toItem,
				from_type: fromType,
				to_type: toType
			})
		});
		
		const data = await response.json();
		
		if (data.success) {
			mixedAmountTo.value = data.result;
			updateMixedRateInfo(fromItem, toItem, data.rate, fromType, toType);
			addToHistory('mixed', amount, fromItem, data.result, toItem);
		}
	} catch (error) {
		console.error('Ошибка конвертации:', error);
		alert('Ошибка конвертации');
	}
});

loadCurrencyRates();
displayHistory();