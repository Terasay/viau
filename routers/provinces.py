from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import sqlite3
import sys
import math
from datetime import datetime

sys.path.append('..')

router = APIRouter(prefix="/api/provinces")

def get_db():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Инициализация таблиц провинций и построек"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Таблица провинций
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS provinces (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country_id TEXT NOT NULL,
            name TEXT NOT NULL,
            city_name TEXT NOT NULL,
            square TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (country_id) REFERENCES countries (id) ON DELETE CASCADE
        )
    ''')
    
    # Таблица типов построек (цены в золоте)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS building_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            base_cost INTEGER NOT NULL DEFAULT 1000,
            maintenance_cost INTEGER NOT NULL DEFAULT 100,
            building_category TEXT NOT NULL DEFAULT 'educational',
            effect_type TEXT,
            effect_value REAL,
            required_tech_id TEXT
        )
    ''')
    
    # Миграция: добавляем новые колонки если их нет
    cursor.execute("PRAGMA table_info(building_types)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'building_category' not in columns:
        cursor.execute('ALTER TABLE building_types ADD COLUMN building_category TEXT NOT NULL DEFAULT "educational"')
        print('✓ Добавлена колонка building_category')
    
    if 'required_tech_id' not in columns:
        cursor.execute('ALTER TABLE building_types ADD COLUMN required_tech_id TEXT')
        print('✓ Добавлена колонка required_tech_id')
    
    # Таблица построек в провинциях
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS buildings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            province_id INTEGER NOT NULL,
            building_type_id INTEGER NOT NULL,
            level INTEGER NOT NULL DEFAULT 1,
            built_at TEXT NOT NULL,
            FOREIGN KEY (province_id) REFERENCES provinces (id) ON DELETE CASCADE,
            FOREIGN KEY (building_type_id) REFERENCES building_types (id)
        )
    ''')
    
    # Добавляем базовые типы построек, если их нет (цены указаны в золоте)
    cursor.execute('SELECT COUNT(*) as count FROM building_types')
    existing_count = cursor.fetchone()['count']
    
    # Если таблица пустая, добавляем постройки
    if existing_count == 0:
        default_buildings = [
            # ОБРАЗОВАТЕЛЬНЫЕ ПОСТРОЙКИ (влияют на прирост образования и науки)
            # Цены в золоте (gold units)
            ('Школа', 'Начальное образование для населения. Увеличивает прирост образования.', 
             3000, 300, 'educational', 'education_growth', 0.05, None),
            ('Университет', 'Высшее учебное заведение. Значительно увеличивает прирост образования и науки.', 
             8000, 800, 'educational', 'education_growth', 0.15, None),
            ('Академия наук', 'Центр научных исследований. Максимально увеличивает прирост науки.', 
             15000, 1500, 'educational', 'science_growth', 0.20, None),
            ('Библиотека', 'Хранилище знаний. Увеличивает прирост образования.', 
             2000, 200, 'educational', 'education_growth', 0.03, None),
            
            # ПРОИЗВОДСТВЕННЫЕ ПОСТРОЙКИ - ПЕХОТНОЕ СНАРЯЖЕНИЕ
            ('Оружейная мастерская', 'Производит холодное оружие и простое огнестрельное оружие.', 
             5000, 500, 'military_infantry', 'production_rifles', 50, 'arquebus'),
            ('Завод винтовок', 'Массовое производство современных винтовок для армии.', 
             12000, 1200, 'military_infantry', 'production_rifles', 200, 'tech_rifles_1'),
            ('Пороховой завод', 'Производство пороха и боеприпасов для пехоты.', 
             8000, 800, 'military_infantry', 'production_ammunition', 500, 'early_muskets'),
            
            # ПРОИЗВОДСТВЕННЫЕ ПОСТРОЙКИ - ТЕХНИКА
            ('Завод артиллерии', 'Производство пушек и артиллерийских орудий.', 
             15000, 1500, 'military_vehicles', 'production_artillery', 10, 'tech_artillery_1'),
            ('Танковый завод', 'Производство бронетехники и танков.', 
             25000, 2500, 'military_vehicles', 'production_tanks', 5, 'tech_tanks_1'),
            ('Авиационный завод', 'Производство самолётов для военных нужд.', 
             30000, 3000, 'military_vehicles', 'production_aircraft', 3, 'tech_aircraft_1'),
            ('Автомобильный завод', 'Производство военных грузовиков и транспорта.', 
             18000, 1800, 'military_vehicles', 'production_vehicles', 20, 'tech_vehicles_1'),
            
            # ПРОИЗВОДСТВЕННЫЕ ПОСТРОЙКИ - ФЛОТ
            ('Верфь парусных кораблей', 'Строительство парусных военных судов.', 
             20000, 2000, 'military_naval', 'production_sailing_ships', 2, None),
            ('Паровая верфь', 'Строительство паровых военных кораблей.', 
             35000, 3500, 'military_naval', 'production_steam_ships', 1, 'tech_steam_ships_1'),
            ('Верфь эсминцев', 'Строительство современных эсминцев и фрегатов.', 
             50000, 5000, 'military_naval', 'production_destroyers', 1, 'tech_destroyers_1'),
            ('Верфь линкоров', 'Строительство больших линейных кораблей.', 
             80000, 8000, 'military_naval', 'production_battleships', 1, 'tech_battleships_1'),
            ('Верфь подводных лодок', 'Строительство подводных лодок.', 
             40000, 4000, 'military_naval', 'production_submarines', 1, 'tech_submarines_1'),
        ]
        
        cursor.executemany('''
            INSERT INTO building_types 
            (name, description, base_cost, maintenance_cost, building_category, effect_type, effect_value, required_tech_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', default_buildings)
        print(f'✓ Добавлено {len(default_buildings)} типов построек')
    else:
        # Если в таблице есть старые постройки без категорий, обновляем их
        cursor.execute('SELECT id, name FROM building_types WHERE building_category IS NULL OR building_category = ""')
        old_buildings = cursor.fetchall()
        if old_buildings:
            # Устанавливаем дефолтную категорию для старых построек
            cursor.execute('UPDATE building_types SET building_category = "educational" WHERE building_category IS NULL OR building_category = ""')
            print(f'✓ Обновлено {len(old_buildings)} старых построек')
    
    conn.commit()
    conn.close()

# Инициализируем таблицы при импорте модуля
init_db()

def get_currency_rate(currency_code):
    """Получить курс валюты из конвертера"""
    try:
        import json
        converter_data_file = 'data/converter_data.json'
        with open(converter_data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if 'currencies' in data and currency_code in data['currencies']:
                return data['currencies'][currency_code]['rate']
    except Exception as e:
        print(f'Ошибка получения курса валюты: {e}')
    return 1  # Дефолтный курс

def convert_gold_to_currency(gold_amount, currency_code):
    """Конвертировать золото в валюту и округлить до десятков вверх"""
    currency_rate = get_currency_rate(currency_code)
    price = gold_amount * currency_rate
    # Округление до десятков вверх
    return math.ceil(price / 10) * 10

async def get_current_user(request: Request):
    """Получение текущего пользователя из токена"""
    sys.path.append('..')
    from main import get_current_user as main_get_current_user
    return await main_get_current_user(request)

@router.get("/country/{country_id}")
async def get_provinces(country_id: str, request: Request):
    """Получение провинций страны"""
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
                return JSONResponse({'success': False, 'error': 'Нет доступа к этой стране'}, status_code=403)
        
        # Получаем провинции
        cursor.execute('''
            SELECT id, name, city_name, square, created_at
            FROM provinces
            WHERE country_id = ?
            ORDER BY name
        ''', (country_id,))
        
        provinces = []
        for row in cursor.fetchall():
            provinces.append({
                'id': row['id'],
                'name': row['name'],
                'city_name': row['city_name'],
                'square': row['square'],
                'created_at': row['created_at']
            })
        
        return JSONResponse({
            'success': True,
            'provinces': provinces
        })
    
    except Exception as e:
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.post("/")
async def create_province(request: Request):
    """Создание провинции (только админ)"""
    user = await get_current_user(request)
    if not user or user['role'] != 'admin':
        return JSONResponse({'success': False, 'error': 'Требуются права администратора'}, status_code=403)
    
    data = await request.json()
    country_id = data.get('country_id')
    name = data.get('name', '').strip()
    city_name = data.get('city_name', '').strip()
    square = data.get('square', '').strip()
    
    if not all([country_id, name, city_name, square]):
        return JSONResponse({'success': False, 'error': 'Все поля обязательны'}, status_code=400)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Проверяем существование страны
        cursor.execute('SELECT id FROM countries WHERE id = ?', (country_id,))
        if not cursor.fetchone():
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
        # Создаем провинцию
        created_at = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO provinces (country_id, name, city_name, square, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (country_id, name, city_name, square, created_at))
        
        province_id = cursor.lastrowid
        conn.commit()
        
        return JSONResponse({
            'success': True,
            'message': 'Провинция успешно создана',
            'province_id': province_id
        })
    
    except Exception as e:
        conn.rollback()
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.put("/{province_id}")
async def update_province(province_id: int, request: Request):
    """Обновление провинции (только админ)"""
    user = await get_current_user(request)
    if not user or user['role'] != 'admin':
        return JSONResponse({'success': False, 'error': 'Требуются права администратора'}, status_code=403)
    
    data = await request.json()
    name = data.get('name', '').strip()
    city_name = data.get('city_name', '').strip()
    square = data.get('square', '').strip()
    
    if not all([name, city_name, square]):
        return JSONResponse({'success': False, 'error': 'Все поля обязательны'}, status_code=400)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Проверяем существование провинции
        cursor.execute('SELECT id FROM provinces WHERE id = ?', (province_id,))
        if not cursor.fetchone():
            return JSONResponse({'success': False, 'error': 'Провинция не найдена'}, status_code=404)
        
        # Обновляем провинцию
        cursor.execute('''
            UPDATE provinces
            SET name = ?, city_name = ?, square = ?
            WHERE id = ?
        ''', (name, city_name, square, province_id))
        
        conn.commit()
        
        return JSONResponse({
            'success': True,
            'message': 'Провинция успешно обновлена'
        })
    
    except Exception as e:
        conn.rollback()
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.delete("/{province_id}")
async def delete_province(province_id: int, request: Request):
    """Удаление провинции (только админ)"""
    user = await get_current_user(request)
    if not user or user['role'] != 'admin':
        return JSONResponse({'success': False, 'error': 'Требуются права администратора'}, status_code=403)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Проверяем существование провинции
        cursor.execute('SELECT id FROM provinces WHERE id = ?', (province_id,))
        if not cursor.fetchone():
            return JSONResponse({'success': False, 'error': 'Провинция не найдена'}, status_code=404)
        
        # Удаляем провинцию (постройки удалятся автоматически через CASCADE)
        cursor.execute('DELETE FROM provinces WHERE id = ?', (province_id,))
        
        conn.commit()
        
        return JSONResponse({
            'success': True,
            'message': 'Провинция успешно удалена'
        })
    
    except Exception as e:
        conn.rollback()
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.get("/{province_id}/buildings")
async def get_province_buildings(province_id: int, request: Request):
    """Получение построек провинции"""
    user = await get_current_user(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Требуется авторизация'}, status_code=401)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Проверяем доступ к провинции
        cursor.execute('''
            SELECT p.id, c.player_id
            FROM provinces p
            JOIN countries c ON p.country_id = c.id
            WHERE p.id = ?
        ''', (province_id,))
        
        province = cursor.fetchone()
        if not province:
            return JSONResponse({'success': False, 'error': 'Провинция не найдена'}, status_code=404)
        
        if user['role'] not in ['admin', 'moderator']:
            if province['player_id'] != user['id']:
                return JSONResponse({'success': False, 'error': 'Нет доступа к этой провинции'}, status_code=403)
        
        # Получаем постройки
        cursor.execute('''
            SELECT 
                b.id,
                b.level,
                b.built_at,
                bt.name,
                bt.description,
                bt.base_cost,
                bt.maintenance_cost,
                bt.effect_type,
                bt.effect_value
            FROM buildings b
            JOIN building_types bt ON b.building_type_id = bt.id
            WHERE b.province_id = ?
            ORDER BY b.built_at DESC
        ''', (province_id,))
        
        buildings = []
        for row in cursor.fetchall():
            buildings.append({
                'id': row['id'],
                'name': row['name'],
                'description': row['description'],
                'level': row['level'],
                'base_cost': row['base_cost'],
                'maintenance_cost': row['maintenance_cost'],
                'effect_type': row['effect_type'],
                'effect_value': row['effect_value'],
                'built_at': row['built_at']
            })
        
        return JSONResponse({
            'success': True,
            'buildings': buildings
        })
    
    except Exception as e:
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.get("/building-types")
async def get_building_types(request: Request):
    """Получение всех типов построек с учётом доступных технологий"""
    user = await get_current_user(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Требуется авторизация'}, status_code=401)
    
    # Получаем country_id из query параметра (опционально)
    country_id = request.query_params.get('country_id')
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Получаем список изученных технологий для страны (если указана)
        researched_techs = set()
        if country_id:
            cursor.execute('''
                SELECT tech_id FROM country_technologies 
                WHERE country_id = ?
            ''', (country_id,))
            researched_techs = {row['tech_id'] for row in cursor.fetchall()}
        
        # Получаем все типы построек
        cursor.execute('''
            SELECT 
                id, name, description, base_cost, maintenance_cost, 
                building_category, effect_type, effect_value, required_tech_id
            FROM building_types
            ORDER BY building_category, base_cost
        ''')
        
        building_types = []
        for row in cursor.fetchall():
            # Проверяем доступность постройки по технологиям
            required_tech = row['required_tech_id']
            is_available = True
            
            if required_tech and country_id:
                is_available = required_tech in researched_techs
            
            building_types.append({
                'id': row['id'],
                'name': row['name'],
                'description': row['description'],
                'base_cost': row['base_cost'],
                'maintenance_cost': row['maintenance_cost'],
                'building_category': row['building_category'],
                'effect_type': row['effect_type'],
                'effect_value': row['effect_value'],
                'required_tech_id': row['required_tech_id'],
                'is_available': is_available
            })
        
        return JSONResponse({
            'success': True,
            'building_types': building_types
        })
    
    except Exception as e:
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.post("/{province_id}/buildings")
async def build_building(province_id: int, request: Request):
    """Строительство здания в провинции"""
    user = await get_current_user(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Требуется авторизация'}, status_code=401)
    
    data = await request.json()
    building_type_id = data.get('building_type_id')
    
    if not building_type_id:
        return JSONResponse({'success': False, 'error': 'Не указан тип здания'}, status_code=400)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Проверяем доступ к провинции и получаем данные страны
        cursor.execute('''
            SELECT p.id, p.country_id, c.player_id, c.main_currency
            FROM provinces p
            JOIN countries c ON p.country_id = c.id
            WHERE p.id = ?
        ''', (province_id,))
        
        province = cursor.fetchone()
        if not province:
            return JSONResponse({'success': False, 'error': 'Провинция не найдена'}, status_code=404)
        
        if user['role'] not in ['admin', 'moderator']:
            if province['player_id'] != user['id']:
                return JSONResponse({'success': False, 'error': 'Нет доступа к этой провинции'}, status_code=403)
        
        # Получаем баланс страны из таблицы country_currencies
        currency_code = province['main_currency'] or 'ESC'
        cursor.execute('''
            SELECT amount FROM country_currencies 
            WHERE country_id = ? AND currency_code = ?
        ''', (province['country_id'], currency_code))
        
        balance_row = cursor.fetchone()
        current_balance = balance_row['amount'] if balance_row else 0
        
        # Получаем данные типа здания
        cursor.execute('SELECT * FROM building_types WHERE id = ?', (building_type_id,))
        building_type = cursor.fetchone()
        
        if not building_type:
            return JSONResponse({'success': False, 'error': 'Тип здания не найден'}, status_code=404)
        
        # Конвертируем цену из золота в валюту страны
        actual_cost = convert_gold_to_currency(building_type['base_cost'], currency_code)
        
        # Проверяем баланс страны
        if current_balance < actual_cost:
            return JSONResponse({
                'success': False, 
                'error': f'Недостаточно средств. Требуется: {actual_cost}, доступно: {current_balance}'
            }, status_code=400)
        
        # Списываем деньги из country_currencies
        cursor.execute('''
            UPDATE country_currencies
            SET amount = amount - ?
            WHERE country_id = ? AND currency_code = ?
        ''', (actual_cost, province['country_id'], currency_code))
        
        # Создаем здание мгновенно
        built_at = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO buildings (province_id, building_type_id, level, built_at)
            VALUES (?, ?, 1, ?)
        ''', (province_id, building_type_id, built_at))
        
        conn.commit()
        
        return JSONResponse({
            'success': True,
            'message': f'Построено: {building_type["name"]}'
        })
    
    except Exception as e:
        conn.rollback()
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.delete("/buildings/{building_id}")
async def demolish_building(building_id: int, request: Request):
    """Снос здания"""
    user = await get_current_user(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Требуется авторизация'}, status_code=401)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Проверяем доступ к зданию
        cursor.execute('''
            SELECT b.id, c.player_id
            FROM buildings b
            JOIN provinces p ON b.province_id = p.id
            JOIN countries c ON p.country_id = c.id
            WHERE b.id = ?
        ''', (building_id,))
        
        building = cursor.fetchone()
        if not building:
            return JSONResponse({'success': False, 'error': 'Здание не найдено'}, status_code=404)
        
        if user['role'] not in ['admin', 'moderator']:
            if building['player_id'] != user['id']:
                return JSONResponse({'success': False, 'error': 'Нет доступа к этому зданию'}, status_code=403)
        
        # Удаляем здание
        cursor.execute('DELETE FROM buildings WHERE id = ?', (building_id,))
        
        conn.commit()
        
        return JSONResponse({
            'success': True,
            'message': 'Здание успешно снесено'
        })
    
    except Exception as e:
        conn.rollback()
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

# Эндпоинты для управления каталогом построек удалены
# Постройки теперь фиксированы и задаются в init_db()
