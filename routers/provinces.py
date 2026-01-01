from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import sqlite3
import sys
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
    
    # Таблица типов построек
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS building_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            base_cost INTEGER NOT NULL DEFAULT 1000,
            maintenance_cost INTEGER NOT NULL DEFAULT 100,
            build_time INTEGER NOT NULL DEFAULT 1,
            effect_type TEXT,
            effect_value REAL
        )
    ''')
    
    # Таблица построек в провинциях
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS buildings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            province_id INTEGER NOT NULL,
            building_type_id INTEGER NOT NULL,
            level INTEGER NOT NULL DEFAULT 1,
            construction_turn INTEGER,
            built_at TEXT NOT NULL,
            FOREIGN KEY (province_id) REFERENCES provinces (id) ON DELETE CASCADE,
            FOREIGN KEY (building_type_id) REFERENCES building_types (id)
        )
    ''')
    
    # Добавляем базовые типы построек, если их нет
    cursor.execute('SELECT COUNT(*) as count FROM building_types')
    if cursor.fetchone()['count'] == 0:
        default_buildings = [
            ('Текстильная фабрика', 'Производит ткани, повышает доход', 5000, 500, 2, 'income', 1000),
            ('Металлургический завод', 'Производит металл, повышает доход', 8000, 800, 3, 'income', 1500),
            ('Химический завод', 'Производит химикаты, повышает доход', 10000, 1000, 3, 'income', 2000),
            ('Машиностроительный завод', 'Производит машины, повышает доход', 12000, 1200, 4, 'income', 2500),
            ('Судостроительная верфь', 'Строит корабли, повышает доход', 15000, 1500, 5, 'income', 3000),
            ('Университет', 'Повышает образование', 7000, 700, 3, 'education', 5.0),
            ('Исследовательский центр', 'Повышает науку', 8000, 800, 3, 'science', 5.0),
            ('Библиотека', 'Повышает образование', 3000, 300, 2, 'education', 2.0),
            ('Больница', 'Повышает рост населения', 5000, 500, 2, 'population', 0.1),
            ('Ферма', 'Производит еду, повышает население', 2000, 200, 1, 'population', 0.05),
        ]
        
        cursor.executemany('''
            INSERT INTO building_types 
            (name, description, base_cost, maintenance_cost, build_time, effect_type, effect_value)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', default_buildings)
    
    conn.commit()
    conn.close()

# Инициализируем таблицы при импорте модуля
init_db()

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
            if country['player_id'] != user['user_id']:
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
            if province['player_id'] != user['user_id']:
                return JSONResponse({'success': False, 'error': 'Нет доступа к этой провинции'}, status_code=403)
        
        # Получаем постройки
        cursor.execute('''
            SELECT 
                b.id,
                b.level,
                b.construction_turn,
                b.built_at,
                bt.name,
                bt.description,
                bt.base_cost,
                bt.maintenance_cost,
                bt.build_time,
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
                'build_time': row['build_time'],
                'effect_type': row['effect_type'],
                'effect_value': row['effect_value'],
                'construction_turn': row['construction_turn'],
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
    """Получение всех типов построек"""
    user = await get_current_user(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Требуется авторизация'}, status_code=401)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT 
                id, name, description, base_cost, maintenance_cost, 
                build_time, effect_type, effect_value
            FROM building_types
            ORDER BY name
        ''')
        
        building_types = []
        for row in cursor.fetchall():
            building_types.append({
                'id': row['id'],
                'name': row['name'],
                'description': row['description'],
                'base_cost': row['base_cost'],
                'maintenance_cost': row['maintenance_cost'],
                'build_time': row['build_time'],
                'effect_type': row['effect_type'],
                'effect_value': row['effect_value']
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
            SELECT p.id, p.country_id, c.player_id, c.balance
            FROM provinces p
            JOIN countries c ON p.country_id = c.id
            WHERE p.id = ?
        ''', (province_id,))
        
        province = cursor.fetchone()
        if not province:
            return JSONResponse({'success': False, 'error': 'Провинция не найдена'}, status_code=404)
        
        if user['role'] not in ['admin', 'moderator']:
            if province['player_id'] != user['user_id']:
                return JSONResponse({'success': False, 'error': 'Нет доступа к этой провинции'}, status_code=403)
        
        # Получаем данные типа здания
        cursor.execute('SELECT * FROM building_types WHERE id = ?', (building_type_id,))
        building_type = cursor.fetchone()
        
        if not building_type:
            return JSONResponse({'success': False, 'error': 'Тип здания не найден'}, status_code=404)
        
        # Проверяем баланс страны
        if province['balance'] < building_type['base_cost']:
            return JSONResponse({
                'success': False, 
                'error': f'Недостаточно средств. Требуется: {building_type["base_cost"]}, доступно: {province["balance"]}'
            }, status_code=400)
        
        # Получаем текущий ход
        cursor.execute('SELECT current_turn FROM game_state WHERE id = 1')
        game_state = cursor.fetchone()
        current_turn = game_state['current_turn'] if game_state else 1
        construction_turn = current_turn + building_type['build_time']
        
        # Списываем деньги
        cursor.execute('''
            UPDATE countries
            SET balance = balance - ?
            WHERE id = ?
        ''', (building_type['base_cost'], province['country_id']))
        
        # Создаем здание
        built_at = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO buildings (province_id, building_type_id, level, construction_turn, built_at)
            VALUES (?, ?, 1, ?, ?)
        ''', (province_id, building_type_id, construction_turn, built_at))
        
        conn.commit()
        
        return JSONResponse({
            'success': True,
            'message': f'Начато строительство: {building_type["name"]}. Будет завершено на ходу {construction_turn}',
            'construction_turn': construction_turn
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
            if building['player_id'] != user['user_id']:
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
