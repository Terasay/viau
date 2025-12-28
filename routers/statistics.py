from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import sqlite3
import sys
sys.path.append('..')

router = APIRouter(prefix="/api/statistics")

def get_db():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_statistics_tables():
    """Инициализация таблиц статистики для стран"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Таблица основной статистики страны (население)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS country_stats (
            country_id TEXT PRIMARY KEY,
            population REAL NOT NULL DEFAULT 0.0,
            FOREIGN KEY (country_id) REFERENCES countries(id)
        )
    ''')
    
    # Таблица религий (8 религий с процентами)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS country_religions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country_id TEXT NOT NULL,
            religion_name TEXT NOT NULL,
            percentage REAL NOT NULL DEFAULT 0.0,
            FOREIGN KEY (country_id) REFERENCES countries(id),
            UNIQUE(country_id, religion_name)
        )
    ''')
    
    # Таблица культур (этносы и нации)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS country_cultures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country_id TEXT NOT NULL,
            ethnos TEXT NOT NULL,
            nation TEXT,
            percentage REAL NOT NULL DEFAULT 0.0,
            FOREIGN KEY (country_id) REFERENCES countries(id),
            UNIQUE(country_id, ethnos, nation)
        )
    ''')
    
    # Таблица социальных слоёв (5 слоёв с процентами)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS country_social_layers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country_id TEXT NOT NULL,
            layer_name TEXT NOT NULL,
            percentage REAL NOT NULL DEFAULT 0.0,
            FOREIGN KEY (country_id) REFERENCES countries(id),
            UNIQUE(country_id, layer_name)
        )
    ''')
    
    conn.commit()
    conn.close()

# Инициализируем таблицы при импорте модуля
init_statistics_tables()

async def get_current_user(request: Request):
    """Получение текущего пользователя из токена"""
    from main import get_current_user as main_get_current_user
    return await main_get_current_user(request)

@router.get("/country/{country_id}")
async def get_country_statistics(country_id: str, request: Request):
    """Получение всей статистики для страны"""
    user = await get_current_user(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Требуется авторизация'}, status_code=401)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Проверяем доступ к стране
        cursor.execute('SELECT player_id FROM countries WHERE id = ?', (country_id,))
        country = cursor.fetchone()
        
        if not country:
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
        if user['role'] not in ['admin', 'moderator']:
            if country['player_id'] != user['id']:
                return JSONResponse({'success': False, 'error': 'Доступ запрещён'}, status_code=403)
        
        # Получаем население
        cursor.execute('SELECT population FROM country_stats WHERE country_id = ?', (country_id,))
        stats = cursor.fetchone()
        population = stats['population'] if stats else 0.0
        
        # Получаем религии
        cursor.execute('SELECT religion_name, percentage FROM country_religions WHERE country_id = ?', (country_id,))
        religions = {row['religion_name']: row['percentage'] for row in cursor.fetchall()}
        
        # Получаем культуры
        cursor.execute('SELECT ethnos, nation, percentage FROM country_cultures WHERE country_id = ?', (country_id,))
        cultures_raw = cursor.fetchall()
        
        # Группируем культуры по этносам
        cultures = {}
        for row in cultures_raw:
            ethnos = row['ethnos']
            if ethnos not in cultures:
                cultures[ethnos] = {'nations': {}, 'total': 0.0}
            
            if row['nation']:
                cultures[ethnos]['nations'][row['nation']] = row['percentage']
                cultures[ethnos]['total'] += row['percentage']
        
        # Получаем социальные слои
        cursor.execute('SELECT layer_name, percentage FROM country_social_layers WHERE country_id = ?', (country_id,))
        social_layers = {row['layer_name']: row['percentage'] for row in cursor.fetchall()}
        
        return JSONResponse({
            'success': True,
            'country_id': country_id,
            'population': population,
            'religions': religions,
            'cultures': cultures,
            'social_layers': social_layers
        })
    
    except Exception as e:
        print(f"Error getting country statistics: {e}")
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.post("/country/{country_id}/population")
async def update_population(country_id: str, request: Request):
    """Обновление населения страны (только для админа)"""
    user = await get_current_user(request)
    if not user or user['role'] != 'admin':
        return JSONResponse({'success': False, 'error': 'Требуются права администратора'}, status_code=403)
    
    data = await request.json()
    population = data.get('population', 0.0)
    
    if population < 0:
        return JSONResponse({'success': False, 'error': 'Население не может быть отрицательным'}, status_code=400)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT id FROM countries WHERE id = ?', (country_id,))
        if not cursor.fetchone():
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
        cursor.execute('''
            INSERT INTO country_stats (country_id, population)
            VALUES (?, ?)
            ON CONFLICT(country_id) DO UPDATE SET population = ?
        ''', (country_id, population, population))
        conn.commit()
        
        return JSONResponse({
            'success': True,
            'country_id': country_id,
            'population': population
        })
    
    except Exception as e:
        print(f"Error updating population: {e}")
        conn.rollback()
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.post("/country/{country_id}/religions")
async def update_religions(country_id: str, request: Request):
    """Обновление религий страны (только для админа)"""
    user = await get_current_user(request)
    if not user or user['role'] != 'admin':
        return JSONResponse({'success': False, 'error': 'Требуются права администратора'}, status_code=403)
    
    data = await request.json()
    religions = data.get('religions', {})
    
    # Проверяем, что сумма процентов не превышает 100
    total = sum(religions.values())
    if total > 100:
        return JSONResponse({'success': False, 'error': f'Сумма процентов превышает 100% ({total}%)'}, status_code=400)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT id FROM countries WHERE id = ?', (country_id,))
        if not cursor.fetchone():
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
        # Удаляем старые данные
        cursor.execute('DELETE FROM country_religions WHERE country_id = ?', (country_id,))
        
        # Добавляем новые данные
        for religion_name, percentage in religions.items():
            cursor.execute('''
                INSERT INTO country_religions (country_id, religion_name, percentage)
                VALUES (?, ?, ?)
            ''', (country_id, religion_name, percentage))
        
        conn.commit()
        
        return JSONResponse({
            'success': True,
            'country_id': country_id,
            'religions': religions
        })
    
    except Exception as e:
        print(f"Error updating religions: {e}")
        conn.rollback()
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.post("/country/{country_id}/cultures")
async def update_cultures(country_id: str, request: Request):
    """Обновление культур страны (только для админа)"""
    user = await get_current_user(request)
    if not user or user['role'] != 'admin':
        return JSONResponse({'success': False, 'error': 'Требуются права администратора'}, status_code=403)
    
    data = await request.json()
    cultures = data.get('cultures', {})
    
    # Проверяем, что сумма процентов наций не превышает 100
    total = 0.0
    for ethnos_data in cultures.values():
        for nation_percentage in ethnos_data.get('nations', {}).values():
            total += nation_percentage
    
    if total > 100:
        return JSONResponse({'success': False, 'error': f'Сумма процентов наций превышает 100% ({total}%)'}, status_code=400)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT id FROM countries WHERE id = ?', (country_id,))
        if not cursor.fetchone():
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
        # Удаляем старые данные
        cursor.execute('DELETE FROM country_cultures WHERE country_id = ?', (country_id,))
        
        # Добавляем новые данные
        for ethnos, ethnos_data in cultures.items():
            for nation, percentage in ethnos_data.get('nations', {}).items():
                cursor.execute('''
                    INSERT INTO country_cultures (country_id, ethnos, nation, percentage)
                    VALUES (?, ?, ?, ?)
                ''', (country_id, ethnos, nation, percentage))
        
        conn.commit()
        
        return JSONResponse({
            'success': True,
            'country_id': country_id,
            'cultures': cultures
        })
    
    except Exception as e:
        print(f"Error updating cultures: {e}")
        conn.rollback()
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.post("/country/{country_id}/social-layers")
async def update_social_layers(country_id: str, request: Request):
    """Обновление социальных слоёв страны (только для админа)"""
    user = await get_current_user(request)
    if not user or user['role'] != 'admin':
        return JSONResponse({'success': False, 'error': 'Требуются права администратора'}, status_code=403)
    
    data = await request.json()
    social_layers = data.get('social_layers', {})
    
    # Проверяем, что сумма процентов не превышает 100
    total = sum(social_layers.values())
    if total > 100:
        return JSONResponse({'success': False, 'error': f'Сумма процентов превышает 100% ({total}%)'}, status_code=400)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT id FROM countries WHERE id = ?', (country_id,))
        if not cursor.fetchone():
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
        # Удаляем старые данные
        cursor.execute('DELETE FROM country_social_layers WHERE country_id = ?', (country_id,))
        
        # Добавляем новые данные
        for layer_name, percentage in social_layers.items():
            cursor.execute('''
                INSERT INTO country_social_layers (country_id, layer_name, percentage)
                VALUES (?, ?, ?)
            ''', (country_id, layer_name, percentage))
        
        conn.commit()
        
        return JSONResponse({
            'success': True,
            'country_id': country_id,
            'social_layers': social_layers
        })
    
    except Exception as e:
        print(f"Error updating social layers: {e}")
        conn.rollback()
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.get("/reference/religions")
async def get_religions_reference():
    """Получение справочника религий"""
    religions = [
        "Ронцуизм",
        "Конфессия Пяти Божеств",
        "Соларизм",
        "Церковь Вечного Рока",
        "Лекланис",
        "Клуизм",
        "Длаврутос",
        "Алаглохи"
    ]
    return JSONResponse({'success': True, 'religions': religions})

@router.get("/reference/cultures")
async def get_cultures_reference():
    """Получение справочника культур (этносов и наций)"""
    cultures = {
        "Монтары": ["Величи", "Миртане", "Сверяне", "Моравини", "Далани"],
        "Селестийцы": ["Эстеры", "Веллары", "Брейты", "Штальрены", "Корвелли", "Палеоны"],
        "Норды": ["Скейры", "Хольды"],
        "Люминарцы саванн": ["Наари", "Каданы"],
        "Люминарские речники": ["Ньямба", "Тарру"],
        "Элизийцы": ["Марстримцы", "Бризены"],
        "Талассийцы": ["Саримы", "Джарру"],
        "Талмирцы": ["Мерденсы", "Фарденсы"]
    }
    return JSONResponse({'success': True, 'cultures': cultures})

@router.get("/reference/social-layers")
async def get_social_layers_reference():
    """Получение справочника социальных слоёв"""
    social_layers = [
        "Элита",
        "Высший класс",
        "Средний класс",
        "Низший класс",
        "Маргиналы"
    ]
    return JSONResponse({'success': True, 'social_layers': social_layers})
