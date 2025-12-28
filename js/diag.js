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
            width: options.width || 700,
            height: options.height || 500,
            radius: options.radius || 160,
            showPercentages: options.showPercentages !== false,
            showLegend: options.showLegend !== false,
            title: options.title || '',
            population: options.population || 0,
            ...options
        };

        // Создаём контейнер для диаграммы и легенды
        const chartWrapper = document.createElement('div');
        chartWrapper.style.display = 'flex';
        chartWrapper.style.gap = '30px';
        chartWrapper.style.alignItems = 'flex-start';
        chartWrapper.style.justifyContent = 'center';
        chartWrapper.style.flexWrap = 'wrap';

        // Создаём canvas для диаграммы
        const canvas = document.createElement('canvas');
        const dpr = window.devicePixelRatio || 1;
        
        // Устанавливаем реальный размер с учетом DPI
        canvas.width = settings.width * dpr;
        canvas.height = settings.height * dpr;
        
        // CSS размер остается прежним
        canvas.style.width = settings.width + 'px';
        canvas.style.height = settings.height + 'px';
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';
        canvas.style.cursor = 'pointer';

        const ctx = canvas.getContext('2d');
        // Масштабируем контекст под высокий DPI
        ctx.scale(dpr, dpr);
        
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

        // Создаём tooltip с уникальным ID
        const tooltipId = `tooltip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const tooltip = document.createElement('div');
        tooltip.id = tooltipId;
        tooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.92);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.15s ease;
            z-index: 999999;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
            white-space: nowrap;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        document.body.appendChild(tooltip);

        // Функция отрисовки диаграммы
        const drawChart = (hoveredIndex = -1) => {
            ctx.clearRect(0, 0, settings.width, settings.height);
            
            segments.forEach((segment, index) => {
                const isHovered = index === hoveredIndex;
                const radiusOffset = isHovered ? 10 : 0;
                
                // Рисуем сегмент
                ctx.fillStyle = segment.color;
                ctx.beginPath();
                ctx.arc(centerX, centerY, settings.radius + radiusOffset, segment.startAngle, segment.endAngle);
                ctx.lineTo(centerX, centerY);
                ctx.closePath();
                ctx.fill();

                // Рисуем границу сегмента
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Добавляем процент в сегмент (если больше 5%)
                if (settings.showPercentages && segment.percentage > 5) {
                    const midAngle = (segment.startAngle + segment.endAngle) / 2;
                    const textRadius = (settings.radius + radiusOffset) * 0.7;
                    const textX = centerX + Math.cos(midAngle) * textRadius;
                    const textY = centerY + Math.sin(midAngle) * textRadius;

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px Inter, sans-serif';
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
        };

        // Функция для определения сегмента по координатам
        const getSegmentAtPoint = (x, y) => {
            const rect = canvas.getBoundingClientRect();
            // Используем логические размеры (settings), а не физические (canvas.width с DPI)
            const scaleX = settings.width / rect.width;
            const scaleY = settings.height / rect.height;
            const canvasX = (x - rect.left) * scaleX;
            const canvasY = (y - rect.top) * scaleY;
            
            const dx = canvasX - centerX;
            const dy = canvasY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Проверяем, находится ли точка в пределах кольца
            if (distance < settings.radius * 0.5 || distance > settings.radius) {
                return -1;
            }
            
            let angle = Math.atan2(dy, dx);
            if (angle < -Math.PI / 2) {
                angle += 2 * Math.PI;
            }
            
            for (let i = 0; i < segments.length; i++) {
                let startAngle = segments[i].startAngle;
                let endAngle = segments[i].endAngle;
                
                if (startAngle < -Math.PI / 2) startAngle += 2 * Math.PI;
                if (endAngle < -Math.PI / 2) endAngle += 2 * Math.PI;
                
                if (angle >= startAngle && angle <= endAngle) {
                    return i;
                }
            }
            
            return -1;
        };

        // Обработчики событий для интерактивности
        let currentHoveredIndex = -1;

        canvas.addEventListener('mousemove', (e) => {
            const segmentIndex = getSegmentAtPoint(e.clientX, e.clientY);
            
            if (segmentIndex !== currentHoveredIndex) {
                currentHoveredIndex = segmentIndex;
                drawChart(currentHoveredIndex);
                
                if (segmentIndex >= 0) {
                    const segment = segments[segmentIndex];
                    const populationCount = settings.population > 0 
                        ? (settings.population * segment.percentage / 100).toFixed(2)
                        : null;
                    
                    let tooltipHTML = `
                        <div style="font-weight: 600; margin-bottom: 6px;">${segment.label}</div>
                        <div style="color: #e2e8f0;">Процент: ${segment.percentage.toFixed(2)}%</div>
                    `;
                    
                    if (populationCount !== null && settings.population > 0) {
                        tooltipHTML += `<div style="color: #e2e8f0;">Население: ${populationCount} млн</div>`;
                    }
                    
                    tooltip.innerHTML = tooltipHTML;
                    tooltip.style.opacity = '1';
                } else {
                    tooltip.style.opacity = '0';
                }
            }
            
            if (segmentIndex >= 0) {
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY + 15) + 'px';
            }
        });

        canvas.addEventListener('mouseleave', () => {
            currentHoveredIndex = -1;
            drawChart();
            tooltip.style.opacity = '0';
        });

        // Очистка tooltip при удалении контейнера
        const observer = new MutationObserver((mutations) => {
            if (!document.body.contains(container)) {
                tooltip.remove();
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Первоначальная отрисовка
        drawChart();

        // Добавляем canvas в обёртку
        const canvasContainer = document.createElement('div');
        canvasContainer.style.position = 'relative';
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

    // Генерация цветовой гаммы для этноса (различные оттенки одного цвета)
    const generateEthnosColorScheme = (baseColor, count) => {
        const schemes = {
            0: { h: 235, s: 85, name: 'blue' },      // Синий
            1: { h: 270, s: 75, name: 'purple' },    // Фиолетовый
            2: { h: 200, s: 80, name: 'cyan' },      // Голубой
            3: { h: 140, s: 70, name: 'green' },     // Зелёный
            4: { h: 30, s: 85, name: 'orange' },     // Оранжевый
            5: { h: 350, s: 75, name: 'red' },       // Красный
            6: { h: 290, s: 70, name: 'magenta' },   // Пурпурный
            7: { h: 180, s: 65, name: 'teal' }       // Бирюзовый
        };
        
        const scheme = schemes[baseColor % 8];
        const colors = [];
        
        // Генерируем оттенки от светлого к тёмному
        for (let i = 0; i < count; i++) {
            const lightnessStart = 70;
            const lightnessEnd = 40;
            const lightness = count === 1 
                ? 55 
                : lightnessStart - (i / (count - 1)) * (lightnessStart - lightnessEnd);
            colors.push(`hsl(${scheme.h}, ${scheme.s}%, ${lightness}%)`);
        }
        
        return colors;
    };

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

        // Подготовка данных с группировкой по этносам
        const ethnicGroups = [];
        let hasData = false;

        for (const [ethnos, data] of Object.entries(nestedData)) {
            if (data.nations && Object.keys(data.nations).length > 0) {
                const nations = [];
                for (const [nation, percentage] of Object.entries(data.nations)) {
                    if (percentage > 0) {
                        nations.push({ name: nation, percentage });
                        hasData = true;
                    }
                }
                if (nations.length > 0) {
                    ethnicGroups.push({ ethnos, nations });
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

        // Настройки
        const settings = {
            width: options.width || 700,
            height: options.height || 500,
            radius: options.radius || 160,
            showPercentages: options.showPercentages !== false,
            showLegend: options.showLegend !== false,
            title: options.title || '',
            population: options.population || 0,
            ...options
        };

        // Создаём контейнер
        const chartWrapper = document.createElement('div');
        chartWrapper.style.display = 'flex';
        chartWrapper.style.gap = '30px';
        chartWrapper.style.alignItems = 'flex-start';
        chartWrapper.style.justifyContent = 'center';
        chartWrapper.style.flexWrap = 'wrap';

        // Canvas с поддержкой высокого DPI
        const canvas = document.createElement('canvas');
        const dpr = window.devicePixelRatio || 1;
        
        // Устанавливаем реальный размер с учетом DPI
        canvas.width = settings.width * dpr;
        canvas.height = settings.height * dpr;
        
        // CSS размер остается прежним
        canvas.style.width = settings.width + 'px';
        canvas.style.height = settings.height + 'px';
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';
        canvas.style.cursor = 'pointer';

        const ctx = canvas.getContext('2d');
        // Масштабируем контекст под высокий DPI
        ctx.scale(dpr, dpr);
        
        const centerX = settings.width / 2;
        const centerY = settings.height / 2;

        // Подготовка сегментов с цветовыми схемами для каждого этноса
        let segments = [];
        let currentAngle = -Math.PI / 2;

        ethnicGroups.forEach((group, groupIndex) => {
            const groupColors = generateEthnosColorScheme(groupIndex, group.nations.length);
            
            group.nations.forEach((nation, nationIndex) => {
                const sliceAngle = (nation.percentage / 100) * 2 * Math.PI;
                
                segments.push({
                    ethnos: group.ethnos,
                    label: nation.name,
                    percentage: nation.percentage,
                    color: groupColors[nationIndex],
                    startAngle: currentAngle,
                    endAngle: currentAngle + sliceAngle,
                    isLastInGroup: nationIndex === group.nations.length - 1,
                    groupIndex
                });
                
                currentAngle += sliceAngle;
            });
        });

        // Tooltip с уникальным ID
        const tooltipId = `tooltip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const tooltip = document.createElement('div');
        tooltip.id = tooltipId;
        tooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.92);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.15s ease;
            z-index: 999999;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
            white-space: nowrap;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        document.body.appendChild(tooltip);

        // Отрисовка
        const drawChart = (hoveredIndex = -1) => {
            ctx.clearRect(0, 0, settings.width, settings.height);
            
            segments.forEach((segment, index) => {
                const isHovered = index === hoveredIndex;
                const radiusOffset = isHovered ? 10 : 0;
                
                // Сегмент
                ctx.fillStyle = segment.color;
                ctx.beginPath();
                ctx.arc(centerX, centerY, settings.radius + radiusOffset, segment.startAngle, segment.endAngle);
                ctx.lineTo(centerX, centerY);
                ctx.closePath();
                ctx.fill();

                // Граница сегмента
                const nextSegment = segments[index + 1];
                const isDifferentEthnos = !nextSegment || nextSegment.groupIndex !== segment.groupIndex;
                
                if (isDifferentEthnos) {
                    // Сплошная линия между разными этносами
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                    ctx.lineWidth = 3;
                    ctx.setLineDash([]);
                } else {
                    // Пунктирная линия между нациями одного этноса
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                }
                
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(
                    centerX + Math.cos(segment.endAngle) * (settings.radius + radiusOffset),
                    centerY + Math.sin(segment.endAngle) * (settings.radius + radiusOffset)
                );
                ctx.stroke();
                ctx.setLineDash([]);

                // Процент
                if (settings.showPercentages && segment.percentage > 3) {
                    const midAngle = (segment.startAngle + segment.endAngle) / 2;
                    const textRadius = (settings.radius + radiusOffset) * 0.7;
                    const textX = centerX + Math.cos(midAngle) * textRadius;
                    const textY = centerY + Math.sin(midAngle) * textRadius;

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                    ctx.shadowBlur = 3;
                    ctx.fillText(`${segment.percentage.toFixed(1)}%`, textX, textY);
                    ctx.shadowBlur = 0;
                }
            });

            // Внутренний круг
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-primary') || '#f8fafc';
            ctx.beginPath();
            ctx.arc(centerX, centerY, settings.radius * 0.5, 0, 2 * Math.PI);
            ctx.fill();
        };

        // Определение сегмента по координатам
        const getSegmentAtPoint = (x, y) => {
            const rect = canvas.getBoundingClientRect();
            // Используем логические размеры (settings), а не физические (canvas.width с DPI)
            const scaleX = settings.width / rect.width;
            const scaleY = settings.height / rect.height;
            const canvasX = (x - rect.left) * scaleX;
            const canvasY = (y - rect.top) * scaleY;
            
            const dx = canvasX - centerX;
            const dy = canvasY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < settings.radius * 0.5 || distance > settings.radius) {
                return -1;
            }
            
            let angle = Math.atan2(dy, dx);
            if (angle < -Math.PI / 2) {
                angle += 2 * Math.PI;
            }
            
            for (let i = 0; i < segments.length; i++) {
                let startAngle = segments[i].startAngle;
                let endAngle = segments[i].endAngle;
                
                if (startAngle < -Math.PI / 2) startAngle += 2 * Math.PI;
                if (endAngle < -Math.PI / 2) endAngle += 2 * Math.PI;
                
                if (angle >= startAngle && angle <= endAngle) {
                    return i;
                }
            }
            
            return -1;
        };

        // Интерактивность
        let currentHoveredIndex = -1;

        canvas.addEventListener('mousemove', (e) => {
            const segmentIndex = getSegmentAtPoint(e.clientX, e.clientY);
            
            if (segmentIndex !== currentHoveredIndex) {
                currentHoveredIndex = segmentIndex;
                drawChart(currentHoveredIndex);
                
                if (segmentIndex >= 0) {
                    const segment = segments[segmentIndex];
                    const populationCount = settings.population > 0 
                        ? (settings.population * segment.percentage / 100).toFixed(2)
                        : null;
                    
                    let tooltipHTML = `
                        <div style="font-weight: 600; margin-bottom: 6px;">${segment.label}</div>
                        <div style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">${segment.ethnos}</div>
                        <div style="color: #e2e8f0;">Процент: ${segment.percentage.toFixed(2)}%</div>
                    `;
                    
                    if (populationCount !== null && settings.population > 0) {
                        tooltipHTML += `<div style="color: #e2e8f0;">Население: ${populationCount} млн</div>`;
                    }
                    
                    tooltip.innerHTML = tooltipHTML;
                    tooltip.style.opacity = '1';
                } else {
                    tooltip.style.opacity = '0';
                }
            }
            
            if (segmentIndex >= 0) {
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY + 15) + 'px';
            }
        });

        canvas.addEventListener('mouseleave', () => {
            currentHoveredIndex = -1;
            drawChart();
            tooltip.style.opacity = '0';
        });

        // Очистка tooltip при удалении контейнера
        const observer = new MutationObserver((mutations) => {
            if (!document.body.contains(container)) {
                tooltip.remove();
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        drawChart();

        const canvasContainer = document.createElement('div');
        canvasContainer.style.position = 'relative';
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

                const ethnosText = document.createElement('div');
                ethnosText.style.cssText = `
                    color: var(--text-tertiary);
                    font-size: 0.75em;
                    margin-top: 2px;
                `;
                ethnosText.textContent = segment.ethnos;

                const valueText = document.createElement('div');
                valueText.style.cssText = `
                    color: var(--text-secondary);
                    font-size: 0.85em;
                    margin-top: 2px;
                `;
                valueText.textContent = `${segment.percentage.toFixed(1)}%`;

                textContainer.appendChild(labelText);
                textContainer.appendChild(ethnosText);
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
