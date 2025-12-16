from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import sqlite3
import sys
from datetime import datetime

router = APIRouter(prefix="/api/economic")

def get_db():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Инициализация таблицы стран"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS countries (
            id TEXT PRIMARY KEY,
            player_id INTEGER UNIQUE,
            ruler_first_name TEXT NOT NULL,
            ruler_last_name TEXT NOT NULL,
            country_name TEXT NOT NULL,
            currency TEXT DEFAULT 'Золото',
            secret_coins INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (player_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

init_db()

def migrate_existing_players():
    """Создаёт страны для всех одобренных заявок, у которых ещё нет записи в countries"""
    import json
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT 
                pa.id,
                pa.user_id,
                pa.first_name,
                pa.last_name,
                pa.country,
                u.username
            FROM player_applications pa
            JOIN users u ON pa.user_id = u.id
            WHERE pa.status = 'approved'
        ''')
        
        approved_apps = cursor.fetchall()
        countries_created = 0
        
        countries_path = 'data/countries.json'
        country_names = {}
        try:
            with open(countries_path, 'r', encoding='utf-8') as f:
                countries_list = json.load(f)
                for c in countries_list:
                    country_names[c['id']] = c['name']
        except Exception as e:
            print(f"Warning: Could not load countries.json: {e}")
        
        for app in approved_apps:
            cursor.execute("SELECT id FROM countries WHERE player_id = ?", (app['user_id'],))
            if cursor.fetchone():
                continue
            
            # Создаём страну
            country_id = app['country']
            country_name = country_names.get(country_id, country_id)
            
            success = create_country(
                country_id=country_id,
                player_id=app['user_id'],
                ruler_first_name=app['first_name'],
                ruler_last_name=app['last_name'],
                country_name=country_name,
                currency='Золото',
                conn=conn,
                cursor=cursor
            )
            
            if success:
                countries_created += 1
                print(f"[+] Created country {country_name} for player {app['username']}")
        
        conn.commit()
        
        if countries_created > 0:
            print(f"Migration complete: {countries_created} countries created")
        else:
            print("No countries to migrate")
            
        return countries_created
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
        return 0
    finally:
        conn.close()

async def check_admin(request: Request):
    """Проверка прав администратора"""
    import sys
    sys.path.append('..')
    from main import get_current_user
    
    user = await get_current_user(request)
    if not user or user.get('role') != 'admin':
        return None
    return user

def create_country(country_id: str, player_id: int, ruler_first_name: str, ruler_last_name: str, country_name: str, currency: str = 'Золото', conn=None, cursor=None):
    """Создание новой страны в БД
    
    Args:
        country_id: ID страны
        player_id: ID игрока
        ruler_first_name: Имя правителя
        ruler_last_name: Фамилия правителя
        country_name: Название страны
        currency: Валюта
        conn: Существующее соединение с БД (опционально)
        cursor: Существующий курсор (опционально)
    """
    own_connection = False
    if conn is None:
        conn = get_db()
        cursor = conn.cursor()
        own_connection = True
    
    try:
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO countries (
                id, player_id, ruler_first_name, ruler_last_name,
                country_name, currency, secret_coins, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            country_id,
            player_id,
            ruler_first_name,
            ruler_last_name,
            country_name,
            currency,
            0,
            now,
            now
        ))
        
        if own_connection:
            conn.commit()
        return True
    except sqlite3.IntegrityError as e:
        print(f"Country already exists or integrity error: {e}")
        if own_connection:
            conn.rollback()
        return False
    except Exception as e:
        print(f"Error creating country: {e}")
        if own_connection:
            conn.rollback()
        return False
    finally:
        if own_connection:
            conn.close()

@router.get("/countries")
async def get_all_countries(request: Request):
    """Получение списка стран (для админов - все страны, для игроков - только своя)"""
    import sys
    sys.path.append('..')
    from main import get_current_user
    
    user = await get_current_user(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Требуется авторизация'}, status_code=401)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        if user.get('role') == 'admin':
            cursor.execute('''
                SELECT 
                    c.id,
                    c.player_id,
                    c.ruler_first_name,
                    c.ruler_last_name,
                    c.country_name,
                    c.currency,
                    c.secret_coins,
                    c.created_at,
                    c.updated_at,
                    u.username as player_username
                FROM countries c
                LEFT JOIN users u ON c.player_id = u.id
                ORDER BY c.created_at DESC
            ''')
        else:
            cursor.execute('''
                SELECT 
                    c.id,
                    c.player_id,
                    c.ruler_first_name,
                    c.ruler_last_name,
                    c.country_name,
                    c.currency,
                    c.secret_coins,
                    c.created_at,
                    c.updated_at,
                    u.username as player_username
                FROM countries c
                LEFT JOIN users u ON c.player_id = u.id
                WHERE c.player_id = ?
            ''', (user['id'],))
        
        countries = []
        for row in cursor.fetchall():
            countries.append({
                'id': row['id'],
                'player_id': row['player_id'],
                'player_username': row['player_username'],
                'ruler_first_name': row['ruler_first_name'],
                'ruler_last_name': row['ruler_last_name'],
                'country_name': row['country_name'],
                'currency': row['currency'],
                'secret_coins': row['secret_coins'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at']
            })
        
        return JSONResponse({'success': True, 'countries': countries})
    except Exception as e:
        print(f"Error loading countries: {e}")
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.get("/country/{country_id}")
async def get_country(country_id: str, request: Request):
    """Получение информации о стране"""
    import sys
    sys.path.append('..')
    from main import get_current_user
    
    user = await get_current_user(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Требуется авторизация'}, status_code=401)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT 
                c.*,
                u.username as player_username,
                u.email as player_email
            FROM countries c
            LEFT JOIN users u ON c.player_id = u.id
            WHERE c.id = ?
        ''', (country_id,))
        
        country = cursor.fetchone()
        if not country:
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
        # Игрок может видеть только свою страну, админ - все
        if user.get('role') != 'admin' and user.get('id') != country['player_id']:
            return JSONResponse({'success': False, 'error': 'Нет доступа'}, status_code=403)
        
        return JSONResponse({
            'success': True,
            'country': {
                'id': country['id'],
                'player_id': country['player_id'],
                'player_username': country['player_username'],
                'player_email': country['player_email'],
                'ruler_first_name': country['ruler_first_name'],
                'ruler_last_name': country['ruler_last_name'],
                'country_name': country['country_name'],
                'currency': country['currency'],
                'secret_coins': country['secret_coins'],
                'created_at': country['created_at'],
                'updated_at': country['updated_at']
            }
        })
    except Exception as e:
        print(f"Error loading country: {e}")
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

class UpdateCountryData(BaseModel):
    currency: Optional[str] = None
    secret_coins: Optional[int] = None

@router.post("/country/{country_id}/update")
async def update_country(country_id: str, data: UpdateCountryData, request: Request):
    """Обновление данных страны (только админ)"""
    user = await check_admin(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Нет доступа'}, status_code=403)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        now = datetime.now().isoformat()
        
        cursor.execute("SELECT id FROM countries WHERE id = ?", (country_id,))
        if not cursor.fetchone():
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
        updates = []
        params = []
        
        if data.currency is not None:
            updates.append("currency = ?")
            params.append(data.currency)
        
        if data.secret_coins is not None:
            updates.append("secret_coins = ?")
            params.append(data.secret_coins)
        
        if not updates:
            return JSONResponse({'success': False, 'error': 'Нет данных для обновления'})
        
        updates.append("updated_at = ?")
        params.append(now)
        params.append(country_id)
        
        cursor.execute(f'''
            UPDATE countries SET {', '.join(updates)}
            WHERE id = ?
        ''', params)
        
        conn.commit()
        
        return JSONResponse({'success': True, 'message': 'Страна обновлена'})
    except Exception as e:
        conn.rollback()
        print(f"Error updating country: {e}")
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.post("/country/{country_id}/add-coins")
async def add_secret_coins(country_id: str, amount: int, request: Request):
    """Добавление секретных монет стране (только админ)"""
    user = await check_admin(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Нет доступа'}, status_code=403)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        now = datetime.now().isoformat()
        
        cursor.execute('''
            UPDATE countries 
            SET secret_coins = secret_coins + ?,
                updated_at = ?
            WHERE id = ?
        ''', (amount, now, country_id))
        
        if cursor.rowcount == 0:
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
        conn.commit()
        
        return JSONResponse({'success': True, 'message': f'Добавлено {amount} секретных монет'})
    except Exception as e:
        conn.rollback()
        print(f"Error adding coins: {e}")
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.delete("/country/{country_id}")
async def delete_country(country_id: str, request: Request):
    """Удаление страны (только админ)"""
    user = await check_admin(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Нет доступа'}, status_code=403)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("DELETE FROM countries WHERE id = ?", (country_id,))
        
        if cursor.rowcount == 0:
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
        conn.commit()
        
        return JSONResponse({'success': True, 'message': 'Страна удалена'})
    except Exception as e:
        conn.rollback()
        print(f"Error deleting country: {e}")
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.post("/migrate-existing-players")
async def migrate_existing_players_endpoint(request: Request):
    """Создаёт страны для всех одобренных заявок без стран (только админ)"""
    user = await check_admin(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Нет доступа'}, status_code=403)
    
    try:
        count = migrate_existing_players()
        return JSONResponse({
            'success': True,
            'message': f'Создано стран: {count}',
            'count': count
        })
    except Exception as e:
        print(f"Error in migration endpoint: {e}")
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
