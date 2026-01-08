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

# ЕДИНСТВЕННЫЙ ИСТОЧНИК ДАННЫХ О ПОСТРОЙКАХ
BUILDING_TYPES = {
    # ОБРАЗОВАТЕЛЬНЫЕ ПОСТРОЙКИ
    'Обсерватории': {
        'description': 'На вершине башни мерцают линзы и латунные круги: звездочёты отмечают ходы светил, вычисляют затмения и сверяют календарь по небесам.',
        'base_cost': 3000,
        'maintenance_cost': 300,
        'building_category': 'educational',
        'required_tech_ids': ['latin_schools'],  # Список требуемых технологий
        'effects': [('science_growth', 0.10)]
    },
    'Университет': {
        'description': 'Каменные аудитории и шумные диспуты под сводами: здесь учат праву, медицине и философии, а рукописи переходят из рук в руки до глубокой ночи.',
        'base_cost': 8000,
        'maintenance_cost': 800,
        'building_category': 'educational',
        'required_tech_ids': ['universities_1'],
        'effects': [('education_growth', 0.20), ('science_growth', 0.08)]
    },
    'Королевская академия наук': {
        'description': 'Закрытые заседания, доклады и опытные мастерские под покровительством короны: лучшие умы спорят о природе вещей и проверяют смелые теории.',
        'base_cost': 15000,
        'maintenance_cost': 1500,
        'building_category': 'educational',
        'required_tech_ids': ['scientific_societies'],
        'effects': [('science_growth', 0.40)]
    },
    'Национальная библиотека': {
        'description': 'Тихие залы и бесконечные стеллажи: сюда стекаются книги, карты и хроники со всего света, чтобы хранители знаний берегли их от времени и огня.',
        'base_cost': 2000,
        'maintenance_cost': 200,
        'building_category': 'educational',
        'required_tech_ids': ['state_education'],
        'effects': [('education_growth', 0.10), ('science_growth', 0.20)]
    },
    'Высшее училище': {
        'description': 'Практичные классы и строгие наставники: здесь готовят инженеров, писцов и врачевателей, оттачивая ремесло учёности на задачах дня.',
        'base_cost': 2000,
        'maintenance_cost': 200,
        'building_category': 'educational',
        'required_tech_ids': ['gymnasiums_1'],
        'effects': [('education_growth', 0.10)]
    },
    
    # ВОЕННЫЕ ПОСТРОЙКИ - ПЕХОТА
    'Оружейная мастерская': {
        'description': 'Производит холодное оружие и простое огнестрельное оружие.',
        'base_cost': 5000,
        'maintenance_cost': 500,
        'building_category': 'military_infantry',
        'required_tech_ids': ['arquebus'],
        'effects': [('production_rifles', 50)]
    },
    'Завод винтовок': {
        'description': 'Массовое производство современных винтовок для армии.',
        'base_cost': 12000,
        'maintenance_cost': 1200,
        'building_category': 'military_infantry',
        'required_tech_ids': ['mass_rifle_production'],
        'effects': [('production_rifles', 200)]
    },
    'Пороховой завод': {
        'description': 'Производство пороха и боеприпасов для пехоты.',
        'base_cost': 8000,
        'maintenance_cost': 800,
        'building_category': 'military_infantry',
        'required_tech_ids': ['early_muskets'],
        'effects': [('production_ammunition', 500)]
    },
    
    # ВОЕННЫЕ ПОСТРОЙКИ - ТЕХНИКА
    'Завод артиллерии': {
        'description': 'Производство пушек и артиллерийских орудий.',
        'base_cost': 15000,
        'maintenance_cost': 1500,
        'building_category': 'military_vehicles',
        'required_tech_ids': ['field_artillery_1'],
        'effects': [('production_artillery', 10)]
    },
    'Танковый завод': {
        'description': 'Производство бронетехники и танков.',
        'base_cost': 25000,
        'maintenance_cost': 2500,
        'building_category': 'military_vehicles',
        'required_tech_ids': [],  # Пустой список = нет требований
        'effects': [('production_tanks', 5)]
    },
    'Авиационный завод': {
        'description': 'Производство самолётов для военных нужд.',
        'base_cost': 30000,
        'maintenance_cost': 3000,
        'building_category': 'military_vehicles',
        'required_tech_ids': [],
        'effects': [('production_aircraft', 3)]
    },
    'Автомобильный завод': {
        'description': 'Производство военных грузовиков и транспорта.',
        'base_cost': 18000,
        'maintenance_cost': 1800,
        'building_category': 'military_vehicles',
        'required_tech_ids': [],
        'effects': [('production_vehicles', 20)]
    },
    
    # ВОЕННЫЕ ПОСТРОЙКИ - ФЛОТ
    'Верфь парусных кораблей': {
        'description': 'Строительство парусных военных судов.',
        'base_cost': 20000,
        'maintenance_cost': 2000,
        'building_category': 'military_naval',
        'required_tech_ids': ['galleons_1'],
        'effects': [('production_sailing_ships', 2)]
    },
    'Паровая верфь': {
        'description': 'Строительство паровых военных кораблей.',
        'base_cost': 35000,
        'maintenance_cost': 3500,
        'building_category': 'military_naval',
        'required_tech_ids': ['steam_ships_of_line'],
        'effects': [('production_steam_ships', 1)]
    },
    'Верфь эсминцев': {
        'description': 'Строительство современных эсминцев и фрегатов.',
        'base_cost': 50000,
        'maintenance_cost': 5000,
        'building_category': 'military_naval',
        'required_tech_ids': ['cruisers_1'],
        'effects': [('production_destroyers', 1)]
    },
    'Верфь линкоров': {
        'description': 'Строительство больших линейных кораблей.',
        'base_cost': 80000,
        'maintenance_cost': 8000,
        'building_category': 'military_naval',
        'required_tech_ids': ['pre_dreadnoughts'],
        'effects': [('production_battleships', 1)]
    },
    'Верфь подводных лодок': {
        'description': 'Строительство подводных лодок.',
        'base_cost': 40000,
        'maintenance_cost': 4000,
        'building_category': 'military_naval',
        'required_tech_ids': ['torpedoes'],
        'effects': [('production_submarines', 1)]
    }
}

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
    
    # Таблица построек (хранит только фактически построенные здания)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS buildings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            province_id INTEGER NOT NULL,
            building_type_name TEXT NOT NULL,
            level INTEGER NOT NULL DEFAULT 1,
            built_at TEXT NOT NULL,
            FOREIGN KEY (province_id) REFERENCES provinces (id) ON DELETE CASCADE
        )
    ''')
    
    # Миграция: переименовываем колонку building_type_id в building_type_name
    cursor.execute("PRAGMA table_info(buildings)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'building_type_id' in columns and 'building_type_name' not in columns:
        print('🔄 Миграция построек на новую систему...')
        # Создаем новую таблицу
        cursor.execute('''
            CREATE TABLE buildings_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                province_id INTEGER NOT NULL,
                building_type_name TEXT NOT NULL,
                level INTEGER NOT NULL DEFAULT 1,
                built_at TEXT NOT NULL,
                FOREIGN KEY (province_id) REFERENCES provinces (id) ON DELETE CASCADE
            )
        ''')
        
        # Копируем данные со сопоставлением ID -> имя
        cursor.execute('''
            INSERT INTO buildings_new (id, province_id, building_type_name, level, built_at)
            SELECT b.id, b.province_id, bt.name, b.level, b.built_at
            FROM buildings b
            LEFT JOIN building_types bt ON b.building_type_id = bt.id
            WHERE bt.name IS NOT NULL
        ''')
        
        # Удаляем старую таблицу и переименовываем новую
        cursor.execute('DROP TABLE buildings')
        cursor.execute('ALTER TABLE buildings_new RENAME TO buildings')
        print('✓ Построки мигрированы на систему без БД типов')
    
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
        
        # Получаем постройки из БД (только ID и имя типа)
        cursor.execute('''
            SELECT id, building_type_name, level, built_at
            FROM buildings
            WHERE province_id = ?
            ORDER BY built_at DESC
        ''', (province_id,))
        
        buildings = []
        for row in cursor.fetchall():
            building_name = row['building_type_name']
            
            # Берем данные из константы
            if building_name not in BUILDING_TYPES:
                continue  # Пропускаем удаленные типы построек
            
            building_data = BUILDING_TYPES[building_name]
            
            # Формируем массив эффектов
            effects = []
            for effect_type, effect_value in building_data['effects']:
                effects.append({
                    'effect_type': effect_type,
                    'effect_value': effect_value
                })
            
            buildings.append({
                'id': row['id'],
                'name': building_name,
                'description': building_data['description'],
                'level': row['level'],
                'base_cost': building_data['base_cost'],
                'maintenance_cost': building_data['maintenance_cost'],
                'built_at': row['built_at'],
                'effects': effects
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
        
        # Формируем список построек из константы
        building_types = []
        for building_name, building_data in BUILDING_TYPES.items():
            # Проверяем доступность постройки по технологиям
            required_techs = building_data['required_tech_ids']
            
            # Если постройка требует технологии
            if required_techs:
                # Она доступна только если передан country_id И ВСЕ технологии изучены
                is_available = country_id and all(tech in researched_techs for tech in required_techs)
            else:
                # Постройки без требований всегда доступны
                is_available = True
            
            # Формируем массив эффектов
            effects = []
            for effect_type, effect_value in building_data['effects']:
                effects.append({
                    'effect_type': effect_type,
                    'effect_value': effect_value
                })
            
            building_types.append({
                'name': building_name,
                'description': building_data['description'],
                'base_cost': building_data['base_cost'],
                'maintenance_cost': building_data['maintenance_cost'],
                'building_category': building_data['building_category'],
                'required_tech_ids': building_data['required_tech_ids'],  # Список технологий
                'is_available': is_available,
                'effects': effects
            })
        
        # Сортируем по категории и цене
        building_types.sort(key=lambda x: (x['building_category'], x['base_cost']))
        
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
    building_name = data.get('building_name')  # Теперь передаем имя вместо ID
    
    if not building_name:
        return JSONResponse({'success': False, 'error': 'Не указан тип здания'}, status_code=400)
    
    # Проверяем существование типа постройки
    if building_name not in BUILDING_TYPES:
        return JSONResponse({'success': False, 'error': 'Тип здания не найден'}, status_code=404)
    
    building_data = BUILDING_TYPES[building_name]
    
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
        
        # Конвертируем цену из золота в валюту страны
        actual_cost = convert_gold_to_currency(building_data['base_cost'], currency_code)
        
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
            INSERT INTO buildings (province_id, building_type_name, level, built_at)
            VALUES (?, ?, 1, ?)
        ''', (province_id, building_name, built_at))
        
        conn.commit()
        
        return JSONResponse({
            'success': True,
            'message': f'Построено: {building_name}'
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
