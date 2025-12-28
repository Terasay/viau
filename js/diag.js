// Модуль для отрисовки круговых диаграмм
(function() {
    'use strict';

    // Генерация цветовой палитры
    const generateColors = (count) => {
        const colors = [
            '#6366f1', // primary
            '#8b5cf6', // secondary
            '#3b82f6', // info
            '#10b981', // success
            '#f59e0b', // warning
            '#ef4444', // danger
            '#ec4899', // pink
            '#14b8a6', // teal
            '#f97316', // orange
            '#06b6d4', // cyan
            '#8b5cf6', // violet
            '#84cc16', // lime
            '#a855f7', // purple
            '#0ea5e9', // sky
            '#22c55e', // green
            '#eab308', // yellow
            '#dc2626', // red
            '#7c3aed', // violet-600
            '#059669', // emerald
            '#d97706'  // amber
        ];
        
        // Если нужно больше цветов, генерируем дополнительные
        while (colors.length < count) {
            const hue = Math.floor(Math.random() * 360);
            colors.push(`hsl(${hue}, 70%, 60%)`);
        }
        
        return colors.slice(0, count);
    };

    // Основная функция отрисовки круговой диаграммы
    function drawPieChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        // Очищаем контейнер
        container.innerHTML = '';
        container.style.padding = '20px';

        // Проверяем наличие данных
        if (!data || Object.keys(data).length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; color: var(--text-secondary);">
                    <i class="fas fa-inbox fa-3x" style="opacity: 0.3;"></i>
                    <p style="margin-top: 20px; font-size: 1.1em;">Данные отсутствуют</p>
                    <p style="margin-top: 8px; font-size: 0.9em;">Статистика для этой страны ещё не заполнена</p>
                </div>
            `;
            return;
        }

        // Фильтруем данные (убираем нулевые значения)
        const filteredData = {};
        for (const [key, value] of Object.entries(data)) {
            if (value > 0) {
                filteredData[key] = value;
            }
        }

        if (Object.keys(filteredData).length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; color: var(--text-secondary);">
                    <i class="fas fa-chart-pie fa-3x" style="opacity: 0.3;"></i>
                    <p style="margin-top: 20px; font-size: 1.1em;">Нет данных для отображения</p>
                </div>
            `;
            return;
        }

        // Настройки по умолчанию
        const settings = {
            width: options.width || 800,
            height: options.height || 500,
            radius: options.radius || 150,
            showPercentages: options.showPercentages !== false,
            showLegend: options.showLegend !== false,
            title: options.title || '',
            ...options
        };

        // Создаём контейнер для диаграммы и легенды
        const chartWrapper = document.createElement('div');
        chartWrapper.style.display = 'flex';
        chartWrapper.style.gap = '40px';
        chartWrapper.style.alignItems = 'center';
        chartWrapper.style.justifyContent = 'center';
        chartWrapper.style.flexWrap = 'wrap';

        // Создаём canvas для диаграммы
        const canvas = document.createElement('canvas');
        canvas.width = settings.width;
        canvas.height = settings.height;
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';

        const ctx = canvas.getContext('2d');
        const centerX = settings.width / 2;
        const centerY = settings.height / 2;

        // Подготовка данных
        const total = Object.values(filteredData).reduce((sum, val) => sum + val, 0);
        const colors = generateColors(Object.keys(filteredData).length);
        
        let segments = [];
        let currentAngle = -Math.PI / 2; // Начинаем сверху

        Object.entries(filteredData).forEach(([label, value], index) => {
            const percentage = (value / total) * 100;
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            segments.push({
                label,
                value,
                percentage,
                color: colors[index],
                startAngle: currentAngle,
                endAngle: currentAngle + sliceAngle
            });
            
            currentAngle += sliceAngle;
        });

        // Отрисовка диаграммы
        segments.forEach((segment, index) => {
            // Рисуем сегмент
            ctx.fillStyle = segment.color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, settings.radius, segment.startAngle, segment.endAngle);
            ctx.lineTo(centerX, centerY);
            ctx.closePath();
            ctx.fill();

            // Рисуем границу сегмента
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Добавляем процент в сегмент (если больше 5%)
            if (settings.showPercentages && segment.percentage > 5) {
                const midAngle = (segment.startAngle + segment.endAngle) / 2;
                const textRadius = settings.radius * 0.7;
                const textX = centerX + Math.cos(midAngle) * textRadius;
                const textY = centerY + Math.sin(midAngle) * textRadius;

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 14px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${segment.percentage.toFixed(1)}%`, textX, textY);
            }
        });

        // Добавляем внутренний круг (donut effect)
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-primary') || '#f8fafc';
        ctx.beginPath();
        ctx.arc(centerX, centerY, settings.radius * 0.5, 0, 2 * Math.PI);
        ctx.fill();

        // Добавляем canvas в обёртку
        const canvasContainer = document.createElement('div');
        canvasContainer.appendChild(canvas);
        chartWrapper.appendChild(canvasContainer);

        // Создаём легенду
        if (settings.showLegend) {
            const legend = document.createElement('div');
            legend.className = 'chart-legend';
            legend.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-height: ${settings.height}px;
                overflow-y: auto;
                padding: 10px;
            `;

            segments.forEach((segment, index) => {
                const legendItem = document.createElement('div');
                legendItem.className = 'legend-item';
                legendItem.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px;
                    background: var(--bg-tertiary);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                `;

                const colorBox = document.createElement('div');
                colorBox.style.cssText = `
                    width: 20px;
                    height: 20px;
                    background: ${segment.color};
                    border-radius: 4px;
                    flex-shrink: 0;
                `;

                const textContainer = document.createElement('div');
                textContainer.style.flex = '1';

                const labelText = document.createElement('div');
                labelText.style.cssText = `
                    color: var(--text-primary);
                    font-weight: 600;
                    font-size: 0.95em;
                `;
                labelText.textContent = segment.label;

                const valueText = document.createElement('div');
                valueText.style.cssText = `
                    color: var(--text-secondary);
                    font-size: 0.85em;
                    margin-top: 2px;
                `;
                valueText.textContent = `${segment.percentage.toFixed(1)}% (${segment.value.toFixed(2)})`;

                textContainer.appendChild(labelText);
                textContainer.appendChild(valueText);

                legendItem.appendChild(colorBox);
                legendItem.appendChild(textContainer);

                // Hover эффект
                legendItem.addEventListener('mouseenter', () => {
                    legendItem.style.borderColor = segment.color;
                    legendItem.style.transform = 'translateX(8px)';
                });

                legendItem.addEventListener('mouseleave', () => {
                    legendItem.style.borderColor = 'transparent';
                    legendItem.style.transform = 'translateX(0)';
                });

                legend.appendChild(legendItem);
            });

            chartWrapper.appendChild(legend);
        }

        // Добавляем заголовок, если указан
        if (settings.title) {
            const title = document.createElement('h3');
            title.style.cssText = `
                color: var(--text-primary);
                font-size: 1.3em;
                margin-bottom: 20px;
                text-align: center;
                width: 100%;
            `;
            title.textContent = settings.title;
            container.appendChild(title);
        }

        container.appendChild(chartWrapper);
    }

    // Функция для отрисовки вложенной диаграммы (для культур с этносами и нациями)
    function drawNestedPieChart(containerId, nestedData, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        container.innerHTML = '';
        container.style.padding = '20px';

        // Проверяем наличие данных
        if (!nestedData || Object.keys(nestedData).length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; color: var(--text-secondary);">
                    <i class="fas fa-inbox fa-3x" style="opacity: 0.3;"></i>
                    <p style="margin-top: 20px; font-size: 1.1em;">Данные отсутствуют</p>
                </div>
            `;
            return;
        }

        // Преобразуем вложенные данные в плоский формат для отображения
        const flatData = {};
        let hasData = false;

        for (const [ethnos, data] of Object.entries(nestedData)) {
            if (data.nations && Object.keys(data.nations).length > 0) {
                for (const [nation, percentage] of Object.entries(data.nations)) {
                    if (percentage > 0) {
                        flatData[`${ethnos} - ${nation}`] = percentage;
                        hasData = true;
                    }
                }
            }
        }

        if (!hasData) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; color: var(--text-secondary);">
                    <i class="fas fa-chart-pie fa-3x" style="opacity: 0.3;"></i>
                    <p style="margin-top: 20px; font-size: 1.1em;">Нет данных для отображения</p>
                </div>
            `;
            return;
        }

        // Используем обычную круговую диаграмму для отображения
        drawPieChart(containerId, flatData, options);
    }

    // Экспортируем функции в глобальную область
    window.drawPieChart = drawPieChart;
    window.drawNestedPieChart = drawNestedPieChart;

    // Функция для тестирования диаграмм (можно удалить в продакшене)
    window.testChart = function() {
        const testData = {
            'Ронцуизм': 35.5,
            'Соларизм': 22.3,
            'Клуизм': 15.0,
            'Конфессия Пяти Божеств': 10.2,
            'Лекланис': 8.5,
            'Алаглохи': 5.0,
            'Длаврутос': 2.5,
            'Церковь Вечного Рока': 1.0
        };
        
        const testContainer = document.createElement('div');
        testContainer.id = 'test-chart-container';
        testContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--bg-secondary);
            padding: 30px;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-xl);
            z-index: 10000;
            max-width: 90vw;
            max-height: 90vh;
            overflow: auto;
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: var(--danger);
            color: white;
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
        `;
        closeBtn.onclick = () => document.body.removeChild(testContainer);
        
        testContainer.appendChild(closeBtn);
        document.body.appendChild(testContainer);
        
        drawPieChart('test-chart-container', testData, {
            title: 'Тестовая диаграмма',
            width: 800,
            height: 500
        });
        
        console.log('Тестовая диаграмма отображена. Закройте её, нажав на ×');
    };

})();
