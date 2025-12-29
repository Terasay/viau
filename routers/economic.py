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

async def get_current_user(request: Request):
    """Получение текущего пользователя из токена"""
    sys.path.append('..')
    from main import get_current_user as main_get_current_user
    return await main_get_current_user(request)

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
            main_currency TEXT DEFAULT 'ESC',
            secret_coins INTEGER DEFAULT 0,
            research_points INTEGER DEFAULT 100,
            balance REAL DEFAULT 1000.0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (player_id) REFERENCES users (id)
        )
    ''')
    
    cursor.execute("PRAGMA table_info(countries)")
    columns = [column[1] for column in cursor.fetchall()]
    if 'research_points' not in columns:
        cursor.execute('ALTER TABLE countries ADD COLUMN research_points INTEGER DEFAULT 100')
    if 'main_currency' not in columns:
        cursor.execute('ALTER TABLE countries ADD COLUMN main_currency TEXT DEFAULT "ESC"')
        cursor.execute('UPDATE countries SET main_currency = "ESC" WHERE main_currency IS NULL')
    if 'balance' not in columns:
        cursor.execute('ALTER TABLE countries ADD COLUMN balance REAL DEFAULT 1000.0')
        cursor.execute('UPDATE countries SET balance = 1000.0 WHERE balance IS NULL')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS country_resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country_id TEXT NOT NULL,
            resource_code TEXT NOT NULL,
            amount INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (country_id) REFERENCES countries (id) ON DELETE CASCADE,
            UNIQUE(country_id, resource_code)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS country_currencies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country_id TEXT NOT NULL,
            currency_code TEXT NOT NULL,
            amount INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (country_id) REFERENCES countries (id) ON DELETE CASCADE,
            UNIQUE(country_id, currency_code)
        )
    ''')
    
    # Таблица настроек налогов
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS country_tax_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country_id TEXT NOT NULL,
            social_layer TEXT NOT NULL,
            tax_rate REAL NOT NULL DEFAULT 0.0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (country_id) REFERENCES countries (id) ON DELETE CASCADE,
            UNIQUE(country_id, social_layer)
        )
    ''')
    
    # Таблица истории экономики по ходам
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS economy_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country_id TEXT NOT NULL,
            turn_number INTEGER NOT NULL,
            balance_start REAL NOT NULL,
            balance_end REAL NOT NULL,
            income REAL NOT NULL,
            expenses REAL NOT NULL,
            tax_income REAL NOT NULL,
            tax_settings TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (country_id) REFERENCES countries (id) ON DELETE CASCADE,
            UNIQUE(country_id, turn_number)
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
                country_name, currency, main_currency, secret_coins, research_points, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            country_id,
            player_id,
            ruler_first_name,
            ruler_last_name,
            country_name,
            currency,
            'ESC',
            0,
            100,
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
                    c.main_currency,
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
                    c.main_currency,
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
                'main_currency': row['main_currency'],
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
    """Мигрировать существующих игроков"""
    user = await check_admin(request)
    if not user:
        return JSONResponse({'success': False, 'message': 'Доступ запрещён'}, status_code=403)
    
    count = migrate_existing_players()
    return JSONResponse({'success': True, 'message': f'Создано стран: {count}'})

@router.get("/available-currencies")
async def get_available_currencies():
    """Получить список всех доступных валют из converter_data.json"""
    try:
        import json
        with open('data/converter_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        return JSONResponse({'success': True, 'currencies': data.get('currencies', {})})
    except Exception as e:
        return JSONResponse({'success': False, 'message': str(e)}, status_code=500)

@router.get("/available-resources")
async def get_available_resources():
    """Получить список всех доступных ресурсов из converter_data.json"""
    try:
        import json
        with open('data/converter_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        return JSONResponse({'success': True, 'resources': data.get('resources', {})})
    except Exception as e:
        return JSONResponse({'success': False, 'message': str(e)}, status_code=500)

@router.get("/country/{country_id}/resources")
async def get_country_resources(country_id: str, request: Request):
    """Получить все ресурсы страны"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT * FROM countries WHERE id = ?', (country_id,))
        country = cursor.fetchone()
        if not country:
            return JSONResponse({'success': False, 'message': 'Страна не найдена'}, status_code=404)
        
        cursor.execute('''
            SELECT resource_code, amount 
            FROM country_resources 
            WHERE country_id = ?
        ''', (country_id,))
        resources = {row[0]: row[1] for row in cursor.fetchall()}
        
        cursor.execute('''
            SELECT currency_code, amount 
            FROM country_currencies 
            WHERE country_id = ?
        ''', (country_id,))
        currencies = {row[0]: row[1] for row in cursor.fetchall()}
        
        return JSONResponse({
            'success': True,
            'main_currency': country['main_currency'],
            'resources': resources,
            'currencies': currencies
        })
    finally:
        conn.close()

@router.post("/country/{country_id}/update-main-currency")
async def update_main_currency(country_id: str, request: Request):
    """Обновить основную валюту страны (только админ)"""
    user = await check_admin(request)
    if not user:
        return JSONResponse({'success': False, 'message': 'Доступ запрещён'}, status_code=403)
    
    data = await request.json()
    new_currency = data.get('main_currency')
    
    if not new_currency:
        return JSONResponse({'success': False, 'message': 'Не указана валюта'}, status_code=400)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            UPDATE countries 
            SET main_currency = ?, updated_at = ? 
            WHERE id = ?
        ''', (new_currency, datetime.now().isoformat(), country_id))
        
        if cursor.rowcount == 0:
            return JSONResponse({'success': False, 'message': 'Страна не найдена'}, status_code=404)
        
        conn.commit()
        return JSONResponse({'success': True, 'message': 'Валюта обновлена'})
    finally:
        conn.close()

@router.post("/country/{country_id}/update-resource")
async def update_country_resource(country_id: str, request: Request):
    """Обновить количество ресурса страны (только админ)"""
    user = await check_admin(request)
    if not user:
        return JSONResponse({'success': False, 'message': 'Доступ запрещён'}, status_code=403)
    
    data = await request.json()
    resource_code = data.get('resource_code')
    amount = data.get('amount', 0)
    
    if not resource_code:
        return JSONResponse({'success': False, 'message': 'Не указан код ресурса'}, status_code=400)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO country_resources (country_id, resource_code, amount, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(country_id, resource_code) 
            DO UPDATE SET amount = ?, updated_at = ?
        ''', (country_id, resource_code, amount, now, now, amount, now))
        
        conn.commit()
        return JSONResponse({'success': True, 'message': 'Ресурс обновлён'})
    except Exception as e:
        return JSONResponse({'success': False, 'message': str(e)}, status_code=500)
    finally:
        conn.close()

@router.post("/country/{country_id}/update-currency")
async def update_country_currency(country_id: str, request: Request):
    """Обновление количества валюты у страны"""
    user = await get_current_user(request)
    if not user or user['role'] != 'admin':
        return JSONResponse({'success': False, 'error': 'Требуются права администратора'}, status_code=403)
    
    data = await request.json()
    currency_code = data.get('currency_code')
    amount = data.get('amount', 0)
    
    if not currency_code:
        return JSONResponse({'success': False, 'error': 'Не указан код валюты'}, status_code=400)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        now = datetime.now().isoformat()
        
        cursor.execute(
            '''INSERT INTO country_currencies (country_id, currency_code, amount, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(country_id, currency_code) 
               DO UPDATE SET amount = ?, updated_at = ?''',
            (country_id, currency_code, amount, now, now, amount, now)
        )
        
        conn.commit()
        return JSONResponse({'success': True, 'message': 'Валюта обновлена'})
        
    except Exception as e:
        conn.rollback()
        print(f"Error updating currency: {e}")
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

# ========== НАЛОГИ И БАЛАНС ==========

@router.get("/country/{country_id}/tax-settings")
async def get_tax_settings(country_id: str, request: Request):
    """Получение настроек налогов для страны"""
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
                return JSONResponse({'success': False, 'error': 'Доступ запрещён'}, status_code=403)
        
        cursor.execute(
            'SELECT social_layer, tax_rate FROM country_tax_settings WHERE country_id = ?',
            (country_id,)
        )
        
        tax_settings = {}
        for row in cursor.fetchall():
            tax_settings[row['social_layer']] = row['tax_rate']
        
        # Установить значения по умолчанию для слоев, если не установлены
        default_layers = ['Богачи', 'Знать', 'Средний класс', 'Нижний класс']
        for layer in default_layers:
            if layer not in tax_settings:
                tax_settings[layer] = 10.0  # 10% по умолчанию
        
        return JSONResponse({
            'success': True,
            'tax_settings': tax_settings
        })
        
    except Exception as e:
        print(f"Error getting tax settings: {e}")
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.post("/country/{country_id}/tax-settings")
async def update_tax_settings(country_id: str, request: Request):
    """Обновление настроек налогов для страны"""
    user = await get_current_user(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Требуется авторизация'}, status_code=401)
    
    data = await request.json()
    tax_settings = data.get('tax_settings', {})
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT player_id FROM countries WHERE id = ?', (country_id,))
        country = cursor.fetchone()
        
        if not country:
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
        if user['role'] not in ['admin', 'moderator']:
            if country['player_id'] != user['id']:
                return JSONResponse({'success': False, 'error': 'Доступ запрещён'}, status_code=403)
        
        now = datetime.now().isoformat()
        
        for social_layer, tax_rate in tax_settings.items():
            if social_layer == 'Маргиналы':
                continue  # Маргиналы не платят налоги
            
            cursor.execute(
                '''INSERT INTO country_tax_settings (country_id, social_layer, tax_rate, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?)
                   ON CONFLICT(country_id, social_layer) 
                   DO UPDATE SET tax_rate = ?, updated_at = ?''',
                (country_id, social_layer, tax_rate, now, now, tax_rate, now)
            )
        
        conn.commit()
        return JSONResponse({'success': True, 'message': 'Налоговые ставки обновлены'})
        
    except Exception as e:
        conn.rollback()
        print(f"Error updating tax settings: {e}")
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.get("/country/{country_id}/balance-forecast")
async def get_balance_forecast(country_id: str, request: Request):
    """Получение баланса и прогноза доходов/расходов"""
    user = await get_current_user(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Требуется авторизация'}, status_code=401)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT player_id, balance, main_currency FROM countries WHERE id = ?', (country_id,))
        country = cursor.fetchone()
        
        if not country:
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
        if user['role'] not in ['admin', 'moderator']:
            if country['player_id'] != user['id']:
                return JSONResponse({'success': False, 'error': 'Доступ запрещён'}, status_code=403)
        
        # Получаем статистику населения
        cursor.execute('SELECT population FROM country_stats WHERE country_id = ?', (country_id,))
        stats = cursor.fetchone()
        population = stats['population'] if stats else 0.0
        
        # Получаем социальные слои
        cursor.execute(
            'SELECT layer_name, percentage FROM country_social_layers WHERE country_id = ?',
            (country_id,)
        )
        social_layers = {}
        for row in cursor.fetchall():
            social_layers[row['layer_name']] = row['percentage']
        
        # Получаем настройки налогов
        cursor.execute(
            'SELECT social_layer, tax_rate FROM country_tax_settings WHERE country_id = ?',
            (country_id,)
        )
        tax_settings = {}
        for row in cursor.fetchall():
            tax_settings[row['social_layer']] = row['tax_rate']
        
        # Расчет налоговых доходов
        tax_income = 0.0
        tax_breakdown = {}
        
        # Средний доход на человека по слоям (условные значения)
        income_per_person = {
            'Богачи': 100.0,
            'Знать': 50.0,
            'Средний класс': 20.0,
            'Нижний класс': 5.0,
            'Маргиналы': 0.0
        }
        
        for layer_name, percentage in social_layers.items():
            if layer_name == 'Маргиналы':
                continue  # Маргиналы не платят налоги
            
            layer_population = population * (percentage / 100.0)
            tax_rate = tax_settings.get(layer_name, 10.0)
            base_income = income_per_person.get(layer_name, 10.0)
            
            layer_tax = layer_population * base_income * (tax_rate / 100.0)
            tax_income += layer_tax
            tax_breakdown[layer_name] = {
                'population': round(layer_population, 2),
                'tax_rate': tax_rate,
                'income': round(layer_tax, 2)
            }
        
        # Расчет расходов (пока что базовые)
        base_expenses = population * 0.5  # 0.5 валюты на человека
        
        total_income = tax_income
        total_expenses = base_expenses
        net_change = total_income - total_expenses
        
        return JSONResponse({
            'success': True,
            'balance': round(country['balance'], 2),
            'currency': country['main_currency'],
            'forecast': {
                'income': round(total_income, 2),
                'expenses': round(total_expenses, 2),
                'net_change': round(net_change, 2),
                'tax_breakdown': tax_breakdown
            }
        })
        
    except Exception as e:
        print(f"Error calculating balance forecast: {e}")
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.get("/country/{country_id}/economy-history")
async def get_economy_history(country_id: str, request: Request):
    """Получение истории экономики страны (только для админа)"""
    user = await get_current_user(request)
    if not user or user['role'] not in ['admin', 'moderator']:
        return JSONResponse({'success': False, 'error': 'Требуются права администратора'}, status_code=403)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            '''SELECT turn_number, balance_start, balance_end, income, expenses, 
                      tax_income, tax_settings, created_at
               FROM economy_history 
               WHERE country_id = ?
               ORDER BY turn_number DESC
               LIMIT 50''',
            (country_id,)
        )
        
        history = []
        for row in cursor.fetchall():
            import json
            history.append({
                'turn': row['turn_number'],
                'balance_start': row['balance_start'],
                'balance_end': row['balance_end'],
                'income': row['income'],
                'expenses': row['expenses'],
                'tax_income': row['tax_income'],
                'tax_settings': json.loads(row['tax_settings']),
                'date': row['created_at']
            })
        
        return JSONResponse({
            'success': True,
            'history': history
        })
        
    except Exception as e:
        print(f"Error getting economy history: {e}")
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.get("/economy-history/all")
async def get_all_economy_history(request: Request):
    """Получение истории экономики всех стран (только для админа)"""
    user = await get_current_user(request)
    if not user or user['role'] not in ['admin', 'moderator']:
        return JSONResponse({'success': False, 'error': 'Требуются права администратора'}, status_code=403)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Получаем список всех стран
        cursor.execute('SELECT id, country_name FROM countries ORDER BY country_name')
        countries = cursor.fetchall()
        
        result = {}
        for country in countries:
            country_id = country['id']
            country_name = country['country_name']
            
            cursor.execute(
                '''SELECT turn_number, balance_start, balance_end, income, expenses, 
                          tax_income, tax_settings, created_at
                   FROM economy_history 
                   WHERE country_id = ?
                   ORDER BY turn_number DESC
                   LIMIT 20''',
                (country_id,)
            )
            
            history = []
            import json
            for row in cursor.fetchall():
                history.append({
                    'turn': row['turn_number'],
                    'balance_start': row['balance_start'],
                    'balance_end': row['balance_end'],
                    'income': row['income'],
                    'expenses': row['expenses'],
                    'tax_income': row['tax_income'],
                    'tax_settings': json.loads(row['tax_settings']),
                    'date': row['created_at']
                })
            
            result[country_id] = {
                'country_name': country_name,
                'history': history
            }
        
        return JSONResponse({
            'success': True,
            'countries': result
        })
        
    except Exception as e:
        print(f"Error getting all economy history: {e}")
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()
