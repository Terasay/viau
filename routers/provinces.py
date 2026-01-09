from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import sqlite3
import sys
import math
import json
from datetime import datetime

sys.path.append('..')

router = APIRouter(prefix="/api/provinces")

def get_db():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn

BUILDING_TYPES = {
    'Обсерватории': {
        'description': 'На вершине башни мерцают линзы и латунные круги: звездочёты отмечают ходы светил, вычисляют затмения и сверяют календарь по небесам.',
        'base_cost': 3000,
        'maintenance_cost': 300,
        'building_category': 'educational',
        'required_tech_ids': ['latin_schools'],
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
    
    # ОРУЖЕЙНАЯ ЛИНИЯ (производство пехотного снаряжения)
    'Оружейный двор': {
        'description': 'Ряды мастерских и кузниц, где оружейники чинят старое и собирают простые стволы по заказу гарнизона.',
        'base_cost': 3000,
        'maintenance_cost': 300,
        'building_category': 'military_infantry',
        'required_tech_ids': ['arquebus'],
        'effects': []
    },
    'Оружейная мануфактура': {
        'description': 'Под одной крышей трудятся десятки мастеров: детали делаются партиями, а сборка идёт почти без остановки.',
        'base_cost': 8000,
        'maintenance_cost': 800,
        'building_category': 'military_infantry',
        'required_tech_ids': ['flintlock_musket_1'],
        'effects': []
    },
    'Оружейный завод': {
        'description': 'Цеха с машинами и строгими нормами: сталь, сверление, калибровка и серийная сборка становятся делом конвейера.',
        'base_cost': 18000,
        'maintenance_cost': 1800,
        'building_category': 'military_infantry',
        'required_tech_ids': ['breechloader_1'],
        'effects': []
    },
    'Крупный оружейный завод': {
        'description': 'Целый промышленный квартал: свои склады, испытательные площадки и потоки заказов, способные вооружать армии.',
        'base_cost': 35000,
        'maintenance_cost': 3500,
        'building_category': 'military_infantry',
        'required_tech_ids': ['magazine_rifles_1'],
        'effects': []
    },
    
    # ЛИТЕЙНО-АРТИЛЛЕРИЙСКАЯ ЛИНИЯ (производство артиллерии)
    'Литейный двор': {
        'description': 'Печи, формы и копоть: здесь льют ядра, простые детали и отливают первые орудийные заготовки для войск.',
        'base_cost': 5000,
        'maintenance_cost': 500,
        'building_category': 'military_artillery',
        'required_tech_ids': ['bronze_cannons'],
        'effects': []
    },
    'Арсенал': {
        'description': 'Каменные склады под охраной, где хранятся пушки, боеприпасы и запасные части, а мастера поддерживают их в готовности.',
        'base_cost': 10000,
        'maintenance_cost': 1000,
        'building_category': 'military_artillery',
        'required_tech_ids': ['field_artillery_1'],
        'effects': []
    },
    'Литейная мануфактура': {
        'description': 'Литьё поставлено на поток: заказы идут сериями, формы унифицируются, а качество проверяют по меркам.',
        'base_cost': 18000,
        'maintenance_cost': 1800,
        'building_category': 'military_artillery',
        'required_tech_ids': ['rifled_artillery_1'],
        'effects': []
    },
    'Королевская артиллерийская мануфактура': {
        'description': 'Привилегированное производство под патронажем короны: лучшие литейщики и инженеры создают орудия по государственным чертежам.',
        'base_cost': 30000,
        'maintenance_cost': 3000,
        'building_category': 'military_artillery',
        'required_tech_ids': ['breech_loading_artillery'],
        'effects': []
    },
    'Артиллерийский завод': {
        'description': 'Большие цеха обработки и сборки: стволы растачиваются точно, лафеты делаются серийно, испытания проходят по регламенту.',
        'base_cost': 50000,
        'maintenance_cost': 5000,
        'building_category': 'military_artillery',
        'required_tech_ids': ['heavy_artillery'],
        'effects': []
    },
    
    # СУДОСТРОИТЕЛЬНАЯ ЛИНИЯ (производство кораблей)
    'Верфь': {
        'description': 'Стапели у воды и запах смолы: здесь строят и чинят суда, заготавливая лес и снабжение прямо на месте.',
        'base_cost': 15000,
        'maintenance_cost': 1500,
        'building_category': 'military_naval',
        'required_tech_ids': ['galleons_1'],
        'effects': []
    },
    'Корабельный двор': {
        'description': 'Разросшийся комплекс со складами, мастерскими и доками: корпус, рангоут и оснастка делаются согласованно и быстрее.',
        'base_cost': 30000,
        'maintenance_cost': 3000,
        'building_category': 'military_naval',
        'required_tech_ids': ['ships_of_line'],
        'effects': []
    },
    'Адмиралтейство': {
        'description': 'Штаб и управление флотом: здесь утверждают проекты, распределяют заказы, снабжение и следят за готовностью кораблей.',
        'base_cost': 60000,
        'maintenance_cost': 6000,
        'building_category': 'military_naval',
        'required_tech_ids': ['ironclad'],
        'effects': []
    },
    'Королевское адмиралтейство': {
        'description': 'Морская власть державы: единые стандарты, большие бюджеты и прямые приказы короны превращают верфи в инструмент политики и войны.',
        'base_cost': 100000,
        'maintenance_cost': 10000,
        'building_category': 'military_naval',
        'required_tech_ids': ['dreadnought'],
        'effects': []
    }
}

def init_db():
    """Инициализация таблиц провинций и построек"""
    conn = get_db()
    cursor = conn.cursor()
    
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
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS buildings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            province_id INTEGER NOT NULL,
            building_type_name TEXT NOT NULL,
            level INTEGER NOT NULL DEFAULT 1,
            production_type TEXT,
            built_at TEXT NOT NULL,
            FOREIGN KEY (province_id) REFERENCES provinces (id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute("PRAGMA table_info(buildings)")
    columns = [row[1] for row in cursor.fetchall()]
    
    # Миграция: добавляем поле production_type если его нет
    if 'production_type' not in columns:
        print('Добавление поля production_type в таблицу buildings...')
        cursor.execute('ALTER TABLE buildings ADD COLUMN production_type TEXT')
        conn.commit()
        print('✓ Поле production_type добавлено')
    
    if 'building_type_id' in columns and 'building_type_name' not in columns:
        print('Миграция построек на новую систему...')
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
        
        cursor.execute('''
            INSERT INTO buildings_new (id, province_id, building_type_name, level, built_at)
            SELECT b.id, b.province_id, bt.name, b.level, b.built_at
            FROM buildings b
            LEFT JOIN building_types bt ON b.building_type_id = bt.id
            WHERE bt.name IS NOT NULL
        ''')
        
        cursor.execute('DROP TABLE buildings')
        cursor.execute('ALTER TABLE buildings_new RENAME TO buildings')
        print('✓ Построки мигрированы на систему без БД типов')
    
    conn.commit()
    conn.close()

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
    return 1

def convert_gold_to_currency(gold_amount, currency_code):
    """Конвертировать золото в валюту и округлить до десятков вверх"""
    currency_rate = get_currency_rate(currency_code)
    price = gold_amount * currency_rate
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
        cursor.execute('SELECT player_id FROM countries WHERE id = ?', (country_id,))
        country = cursor.fetchone()
        
        if not country:
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
        if user['role'] not in ['admin', 'moderator']:
            if country['player_id'] != user['id']:
                return JSONResponse({'success': False, 'error': 'Нет доступа к этой стране'}, status_code=403)
        
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
        cursor.execute('SELECT id FROM countries WHERE id = ?', (country_id,))
        if not cursor.fetchone():
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
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
        cursor.execute('SELECT id FROM provinces WHERE id = ?', (province_id,))
        if not cursor.fetchone():
            return JSONResponse({'success': False, 'error': 'Провинция не найдена'}, status_code=404)
        
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
        cursor.execute('SELECT id FROM provinces WHERE id = ?', (province_id,))
        if not cursor.fetchone():
            return JSONResponse({'success': False, 'error': 'Провинция не найдена'}, status_code=404)
        
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
        
        cursor.execute('''
            SELECT id, building_type_name, level, production_type, built_at
            FROM buildings
            WHERE province_id = ?
            ORDER BY built_at DESC
        ''', (province_id,))
        
        buildings = []
        for row in cursor.fetchall():
            building_name = row['building_type_name']
            
            if building_name not in BUILDING_TYPES:
                continue
            
            building_data = BUILDING_TYPES[building_name]
            
            effects = []
            for effect_type, effect_value in building_data['effects']:
                effects.append({
                    'effect_type': effect_type,
                    'effect_value': effect_value
                })
            
            # Получаем название производимого снаряжения если установлено
            production_type_name = None
            if row['production_type']:
                sys.path.append('..')
                from routers.economic import get_available_military_equipment
                equipment_response = await get_available_military_equipment()
                equipment_data = json.loads(equipment_response.body)
                
                if equipment_data.get('success'):
                    all_equipment = equipment_data.get('equipment', {})
                    if row['production_type'] in all_equipment:
                        production_type_name = all_equipment[row['production_type']].get('name')
            
            buildings.append({
                'id': row['id'],
                'name': building_name,
                'description': building_data['description'],
                'level': row['level'],
                'base_cost': building_data['base_cost'],
                'maintenance_cost': building_data['maintenance_cost'],
                'built_at': row['built_at'],
                'effects': effects,
                'category': building_data.get('building_category'),
                'production_type': row['production_type'],
                'production_type_name': production_type_name
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
    
    country_id = request.query_params.get('country_id')
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        researched_techs = set()
        if country_id:
            cursor.execute('''
                SELECT tech_id FROM country_technologies 
                WHERE country_id = ?
            ''', (country_id,))
            researched_techs = {row['tech_id'] for row in cursor.fetchall()}
        
        building_types = []
        for building_name, building_data in BUILDING_TYPES.items():
            required_techs = building_data['required_tech_ids']
            
            if required_techs:
                is_available = country_id and all(tech in researched_techs for tech in required_techs)
            else:
                is_available = True
            
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
                'required_tech_ids': building_data['required_tech_ids'],
                'is_available': is_available,
                'effects': effects
            })
        
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
        
        currency_code = province['main_currency'] or 'ESC'
        cursor.execute('''
            SELECT amount FROM country_currencies 
            WHERE country_id = ? AND currency_code = ?
        ''', (province['country_id'], currency_code))
        
        balance_row = cursor.fetchone()
        current_balance = balance_row['amount'] if balance_row else 0
        
        actual_cost = convert_gold_to_currency(building_data['base_cost'], currency_code)
        
        if current_balance < actual_cost:
            return JSONResponse({
                'success': False, 
                'error': f'Недостаточно средств. Требуется: {actual_cost}, доступно: {current_balance}'
            }, status_code=400)
        
        cursor.execute('''
            UPDATE country_currencies
            SET amount = amount - ?
            WHERE country_id = ? AND currency_code = ?
        ''', (actual_cost, province['country_id'], currency_code))
        
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


@router.post("/buildings/{building_id}/set-production")
async def set_building_production(building_id: int, request: Request):
    """Установка типа производства для здания"""
    user = await get_current_user(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Требуется авторизация'}, status_code=401)
    
    data = await request.json()
    equipment_code = data.get('equipment_code')
    
    if not equipment_code:
        return JSONResponse({'success': False, 'error': 'Не указан тип снаряжения'}, status_code=400)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Получаем информацию о здании и стране
        cursor.execute('''
            SELECT b.id, b.building_type_name, c.id as country_id, c.player_id
            FROM buildings b
            JOIN provinces p ON b.province_id = p.id
            JOIN countries c ON p.country_id = c.id
            WHERE b.id = ?
        ''', (building_id,))
        
        building = cursor.fetchone()
        if not building:
            return JSONResponse({'success': False, 'error': 'Здание не найдено'}, status_code=404)
        
        # Проверяем доступ
        if user['role'] not in ['admin', 'moderator']:
            if building['player_id'] != user['id']:
                return JSONResponse({'success': False, 'error': 'Нет доступа к этому зданию'}, status_code=403)
        
        # Получаем информацию о типе здания
        building_type_name = building['building_type_name']
        if building_type_name not in BUILDING_TYPES:
            return JSONResponse({'success': False, 'error': 'Тип здания не найден'}, status_code=404)
        
        building_data = BUILDING_TYPES[building_type_name]
        building_category = building_data.get('building_category')
        
        # Импортируем данные о снаряжении
        sys.path.append('..')
        from routers.economic import get_available_military_equipment
        equipment_response = await get_available_military_equipment()
        equipment_data = json.loads(equipment_response.body)
        
        if not equipment_data.get('success'):
            return JSONResponse({'success': False, 'error': 'Не удалось загрузить данные о снаряжении'}, status_code=500)
        
        all_equipment = equipment_data.get('equipment', {})
        
        # Проверяем существование выбранного снаряжения
        if equipment_code not in all_equipment:
            return JSONResponse({'success': False, 'error': 'Неверный тип снаряжения'}, status_code=400)
        
        equipment_info = all_equipment[equipment_code]
        required_tech = equipment_info.get('required_tech')
        
        # Определяем какой тип снаряжения может производить это здание
        allowed_categories = {
            'military_infantry': ['arquebuses', 'light_muskets', 'muskets', 'rifles', 'needle_rifles', 'bolt_action_rifles'],
            'military_artillery': ['field_artillery', 'siege_artillery', 'heavy_artillery'],
            'military_naval': ['galleons', 'ships_of_line', 'steam_frigates', 'ironclads', 'pre_dreadnoughts', 'dreadnoughts', 'destroyers', 'cruisers', 'submarines']
        }
        
        if building_category not in allowed_categories:
            return JSONResponse({'success': False, 'error': 'Это здание не может производить снаряжение'}, status_code=400)
        
        if equipment_code not in allowed_categories[building_category]:
            return JSONResponse({'success': False, 'error': 'Это здание не может производить данный тип снаряжения'}, status_code=400)
        
        # Проверяем наличие технологии у страны
        cursor.execute('''
            SELECT tech_id FROM country_technologies
            WHERE country_id = ? AND tech_id = ?
        ''', (building['country_id'], required_tech))
        
        tech = cursor.fetchone()
        if not tech:
            return JSONResponse({'success': False, 'error': f'Требуется технология: {required_tech}'}, status_code=400)
        
        # Устанавливаем тип производства
        cursor.execute('''
            UPDATE buildings
            SET production_type = ?
            WHERE id = ?
        ''', (equipment_code, building_id))
        
        conn.commit()
        
        return JSONResponse({
            'success': True,
            'message': f'Производство установлено: {equipment_info.get("name")}',
            'production_type': equipment_code
        })
        
    except Exception as e:
        conn.rollback()
        print(f'Error setting production: {e}')
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()


@router.get("/buildings/{building_id}/available-production")
async def get_available_production(building_id: int, request: Request):
    """Получение доступных типов производства для здания"""
    user = await get_current_user(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Требуется авторизация'}, status_code=401)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Получаем информацию о здании и стране
        cursor.execute('''
            SELECT b.id, b.building_type_name, b.production_type, c.id as country_id
            FROM buildings b
            JOIN provinces p ON b.province_id = p.id
            JOIN countries c ON p.country_id = c.id
            WHERE b.id = ?
        ''', (building_id,))
        
        building = cursor.fetchone()
        if not building:
            return JSONResponse({'success': False, 'error': 'Здание не найдено'}, status_code=404)
        
        building_type_name = building['building_type_name']
        if building_type_name not in BUILDING_TYPES:
            return JSONResponse({'success': False, 'error': 'Тип здания не найден'}, status_code=404)
        
        building_data = BUILDING_TYPES[building_type_name]
        building_category = building_data.get('building_category')
        maintenance_cost = building_data.get('maintenance_cost', 0)
        
        # Определяем какие типы снаряжения доступны для этой категории
        category_equipment = {
            'military_infantry': ['arquebuses', 'light_muskets', 'muskets', 'rifles', 'needle_rifles', 'bolt_action_rifles'],
            'military_artillery': ['field_artillery', 'siege_artillery', 'heavy_artillery'],
            'military_naval': ['galleons', 'ships_of_line', 'steam_frigates', 'ironclads', 'pre_dreadnoughts', 'dreadnoughts', 'destroyers', 'cruisers', 'submarines']
        }
        
        if building_category not in category_equipment:
            return JSONResponse({
                'success': True,
                'available_equipment': [],
                'current_production': building['production_type']
            })
        
        # Получаем исследованные технологии страны
        cursor.execute('''
            SELECT tech_id FROM country_technologies
            WHERE country_id = ?
        ''', (building['country_id'],))
        
        researched_techs = [row['tech_id'] for row in cursor.fetchall()]
        
        # Импортируем данные о снаряжении
        sys.path.append('..')
        from routers.economic import get_available_military_equipment
        equipment_response = await get_available_military_equipment()
        equipment_data = json.loads(equipment_response.body)
        
        if not equipment_data.get('success'):
            return JSONResponse({'success': False, 'error': 'Не удалось загрузить данные о снаряжении'}, status_code=500)
        
        all_equipment = equipment_data.get('equipment', {})
        
        # Получаем информацию о пользователе для проверки роли
        cursor.execute('SELECT role FROM users WHERE id = ?', (user['id'],))
        user_row = cursor.fetchone()
        is_admin = user_row and user_row['role'] in ['admin', 'moderator']
        
        # Фильтруем доступное снаряжение
        available = []
        for eq_code in category_equipment[building_category]:
            if eq_code in all_equipment:
                eq_info = all_equipment[eq_code]
                required_tech = eq_info.get('required_tech')
                is_available = required_tech in researched_techs
                
                # Для обычных игроков показываем только доступное снаряжение
                if not is_admin and not is_available:
                    continue
                
                batch_size = eq_info.get('batch_size', 1)
                equipment_price = eq_info.get('price', 1)
                
                # Рассчитываем производственную мощность здания
                cost_per_unit = maintenance_cost / batch_size if batch_size > 0 else 0
                
                # Проверка: может ли завод производить это снаряжение
                can_produce = cost_per_unit >= equipment_price
                
                # Расчёт множителя производства (если может производить)
                production_multiplier = 1.0
                actual_production = batch_size
                
                if can_produce and equipment_price > 0:
                    production_multiplier = cost_per_unit / equipment_price
                    actual_production = int(batch_size * production_multiplier)
                
                available.append({
                    'code': eq_code,
                    'name': eq_info.get('name'),
                    'required_tech': required_tech,
                    'required_tech_name': eq_info.get('required_tech_name'),
                    'available': is_available,
                    'resources': eq_info.get('resources', {}),
                    'batch_size': batch_size,
                    'price': equipment_price,
                    'can_produce': can_produce,
                    'production_multiplier': round(production_multiplier, 2),
                    'actual_production': actual_production
                })
        
        return JSONResponse({
            'success': True,
            'available_equipment': available,
            'current_production': building['production_type'],
            'building_category': building_category,
            'building_name': building_type_name,
            'maintenance_cost': maintenance_cost,
            'is_admin': is_admin
        })
        
    except Exception as e:
        print(f'Error getting available production: {e}')
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()
