from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import sqlite3
import sys
sys.path.append('..')

router = APIRouter(prefix="/api/admin/game")

def get_db():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn

async def get_current_user(request: Request):
    """Получение текущего пользователя из токена"""
    from main import get_current_user as main_get_current_user
    return await main_get_current_user(request)

async def check_admin(request: Request):
    """Проверка прав администратора"""
    user = await get_current_user(request)
    if not user or user.get('role') != 'admin':
        return None
    return user

@router.get("/countries/research-points")
async def get_all_research_points(request: Request):
    """Получение списка всех стран с их очками исследований (только для админа)"""
    admin = await check_admin(request)
    if not admin:
        return JSONResponse({'success': False, 'error': 'Требуются права администратора'}, status_code=403)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT 
                c.id,
                c.country_name,
                c.ruler_first_name,
                c.ruler_last_name,
                c.research_points,
                u.username as player_username
            FROM countries c
            LEFT JOIN users u ON c.player_id = u.id
            ORDER BY c.country_name
        ''')
        
        countries = []
        for row in cursor.fetchall():
            countries.append({
                'id': row['id'],
                'country_name': row['country_name'],
                'ruler_name': f"{row['ruler_first_name']} {row['ruler_last_name']}",
                'player_username': row['player_username'],
                'research_points': row['research_points']
            })
        
        return JSONResponse({
            'success': True,
            'countries': countries
        })
    
    except Exception as e:
        print(f"Error getting all research points: {e}")
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.post("/countries/{country_id}/research-points")
async def update_research_points(country_id: str, request: Request):
    """Обновление количества очков исследований для страны (только для админа)"""
    admin = await check_admin(request)
    if not admin:
        return JSONResponse({'success': False, 'error': 'Требуются права администратора'}, status_code=403)
    
    data = await request.json()
    new_points = data.get('research_points')
    
    if new_points is None or new_points < 0:
        return JSONResponse({'success': False, 'error': 'Некорректное значение очков исследований'}, status_code=400)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT id FROM countries WHERE id = ?', (country_id,))
        if not cursor.fetchone():
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
        cursor.execute(
            'UPDATE countries SET research_points = ? WHERE id = ?',
            (new_points, country_id)
        )
        conn.commit()
        
        return JSONResponse({
            'success': True,
            'country_id': country_id,
            'research_points': new_points
        })
    
    except Exception as e:
        print(f"Error updating research points: {e}")
        conn.rollback()
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.post("/next-turn")
async def next_turn(request: Request):
    """Переход к следующему ходу (только для админа)"""
    admin = await check_admin(request)
    if not admin:
        return JSONResponse({'success': False, 'error': 'Требуются права администратора'}, status_code=403)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        from datetime import datetime
        import json
        
        cursor.execute('SELECT current_turn FROM game_state WHERE id = 1')
        state = cursor.fetchone()
        
        if not state:
            return JSONResponse({'success': False, 'error': 'Состояние игры не найдено'}, status_code=404)
        
        current_turn = state['current_turn']
        new_turn = current_turn + 1
        
        # Обрабатываем экономику для всех стран
        cursor.execute('SELECT id FROM countries')
        countries = cursor.fetchall()
        
        for country in countries:
            country_id = country['id']
            
            # Получаем основную валюту
            cursor.execute('SELECT main_currency FROM countries WHERE id = ?', (country_id,))
            country_data = cursor.fetchone()
            main_currency = country_data['main_currency']
            
            # Получаем текущий баланс из country_currencies
            cursor.execute(
                'SELECT amount FROM country_currencies WHERE country_id = ? AND currency_code = ?',
                (country_id, main_currency)
            )
            balance_row = cursor.fetchone()
            balance_start = float(balance_row['amount']) if balance_row else 0.0
            
            # Получаем статистику населения (в миллионах: 0.77 = 770 тыс., 41.23 = 41.23 млн)
            cursor.execute('SELECT population FROM country_stats WHERE country_id = ?', (country_id,))
            stats = cursor.fetchone()
            population = (stats['population'] * 1_000_000) if stats else 0.0
            
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
            
            # Получаем настройки среднего заработка
            cursor.execute(
                'SELECT social_layer, avg_income FROM country_income_settings WHERE country_id = ?',
                (country_id,)
            )
            income_settings = {}
            for row in cursor.fetchall():
                income_settings[row['social_layer']] = row['avg_income']
            
            # Расчет налоговых доходов
            tax_income = 0.0
            
            for layer_name, percentage in social_layers.items():
                if layer_name == 'Маргиналы':
                    continue
                
                # Рассчитываем количество людей в этом слое
                layer_population = population * (percentage / 100.0)
                
                # Получаем ставку налога для этого слоя (если не задана, пропускаем)
                tax_rate = tax_settings.get(layer_name)
                if tax_rate is None:
                    continue
                
                # Получаем средний заработок для этого слоя (если не задан, пропускаем)
                base_income = income_settings.get(layer_name)
                if base_income is None:
                    continue
                
                # Налог = население_слоя × средний_заработок × (налоговая_ставка / 100)
                # Например: 500,000 чел × 100 монет × 10% = 5,000,000 монет
                layer_tax = layer_population * base_income * (tax_rate / 100.0)
                tax_income += layer_tax
            
            # Расходы пока не учитываются
            total_expenses = 0.0
            
            total_income = tax_income
            balance_end = balance_start + total_income - total_expenses
            
            # Обновляем баланс в country_currencies
            now_update = datetime.now().isoformat()
            cursor.execute(
                '''INSERT INTO country_currencies (country_id, currency_code, amount, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?)
                   ON CONFLICT(country_id, currency_code) 
                   DO UPDATE SET amount = ?, updated_at = ?''',
                (country_id, main_currency, balance_end, now_update, now_update, balance_end, now_update)
            )
            
            # Сохраняем историю
            now = datetime.now().isoformat()
            cursor.execute(
                '''INSERT INTO economy_history 
                   (country_id, turn_number, balance_start, balance_end, income, expenses, 
                    tax_income, tax_settings, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(country_id, turn_number) 
                   DO UPDATE SET balance_end = ?, income = ?, expenses = ?, tax_income = ?''',
                (country_id, current_turn, balance_start, balance_end, total_income, 
                 total_expenses, tax_income, json.dumps(tax_settings), now,
                 balance_end, total_income, total_expenses, tax_income)
            )
        
        # Обновляем номер хода
        now = datetime.now().isoformat()
        cursor.execute(
            'UPDATE game_state SET current_turn = ?, updated_at = ? WHERE id = 1',
            (new_turn, now)
        )
        conn.commit()
        
        return JSONResponse({
            'success': True,
            'current_turn': new_turn,
            'message': f'Ход успешно изменён на {new_turn}. Экономика всех стран пересчитана.'
        })
    
    except Exception as e:
        print(f"Error advancing turn: {e}")
        conn.rollback()
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.post("/set-turn")
async def set_turn(request: Request):
    """Установить конкретный ход (только для админа)"""
    admin = await check_admin(request)
    if not admin:
        return JSONResponse({'success': False, 'error': 'Требуются права администратора'}, status_code=403)
    
    data = await request.json()
    turn_number = data.get('turn')
    
    if turn_number is None or turn_number < 1:
        return JSONResponse({'success': False, 'error': 'Некорректный номер хода'}, status_code=400)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        from datetime import datetime
        now = datetime.now().isoformat()
        
        cursor.execute(
            'UPDATE game_state SET current_turn = ?, updated_at = ? WHERE id = 1',
            (turn_number, now)
        )
        conn.commit()
        
        return JSONResponse({
            'success': True,
            'current_turn': turn_number,
            'message': f'Ход установлен на {turn_number}'
        })
    
    except Exception as e:
        print(f"Error setting turn: {e}")
        conn.rollback()
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.post("/toggle-pause")
async def toggle_pause(request: Request):
    """Приостановить/возобновить игру (только для админа)"""
    admin = await check_admin(request)
    if not admin:
        return JSONResponse({'success': False, 'error': 'Требуются права администратора'}, status_code=403)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        from datetime import datetime
        
        cursor.execute('SELECT is_paused FROM game_state WHERE id = 1')
        state = cursor.fetchone()
        
        if not state:
            return JSONResponse({'success': False, 'error': 'Состояние игры не найдено'}, status_code=404)
        
        new_paused = 0 if state['is_paused'] else 1
        now = datetime.now().isoformat()
        
        cursor.execute(
            'UPDATE game_state SET is_paused = ?, updated_at = ? WHERE id = 1',
            (new_paused, now)
        )
        conn.commit()
        
        return JSONResponse({
            'success': True,
            'is_paused': bool(new_paused),
            'message': 'Игра приостановлена' if new_paused else 'Игра возобновлена'
        })
    
    except Exception as e:
        print(f"Error toggling pause: {e}")
        conn.rollback()
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()