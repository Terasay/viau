from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
import sqlite3
import sys
sys.path.append('..')

router = APIRouter(prefix="/api/game")

def get_db():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_game_state():
    """Инициализация таблицы глобального состояния игры"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS game_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            current_turn INTEGER NOT NULL DEFAULT 1,
            game_date TEXT NOT NULL DEFAULT '1 января 1516 г.',
            is_paused INTEGER DEFAULT 0,
            updated_at TEXT NOT NULL
        )
    ''')
    
    cursor.execute('SELECT id FROM game_state WHERE id = 1')
    if not cursor.fetchone():
        from datetime import datetime
        now = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO game_state (id, current_turn, game_date, is_paused, updated_at)
            VALUES (1, 1, '1 января 1516 г.', 0, ?)
        ''', (now,))
        conn.commit()
    
    conn.close()

init_game_state()

async def get_current_user(request: Request):
    """Получение текущего пользователя из токена"""
    from main import get_current_user as main_get_current_user
    return await main_get_current_user(request)

@router.get("/research-points/{country_id}")
async def get_research_points(country_id: str, request: Request):
    """Получение количества очков исследований для страны"""
    user = await get_current_user(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Требуется авторизация'}, status_code=401)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT player_id, research_points FROM countries WHERE id = ?', (country_id,))
        country = cursor.fetchone()
        
        if not country:
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
        if user['role'] not in ['admin', 'moderator']:
            if country['player_id'] != user['id']:
                return JSONResponse({'success': False, 'error': 'Доступ запрещён'}, status_code=403)
        
        return JSONResponse({
            'success': True,
            'research_points': country['research_points']
        })
    
    except Exception as e:
        print(f"Error getting research points: {e}")
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.post("/research-points/deduct")
async def deduct_research_points(request: Request):
    """Списание очков исследований при изучении технологии"""
    user = await get_current_user(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Требуется авторизация'}, status_code=401)
    
    data = await request.json()
    country_id = data.get('country_id')
    cost = data.get('cost', 0)
    
    if not country_id or cost <= 0:
        return JSONResponse({'success': False, 'error': 'Некорректные данные'}, status_code=400)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT player_id, research_points FROM countries WHERE id = ?', (country_id,))
        country = cursor.fetchone()
        
        if not country:
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
        if user['role'] != 'admin' and country['player_id'] != user['id']:
            return JSONResponse({'success': False, 'error': 'Доступ запрещён'}, status_code=403)
        
        current_points = country['research_points']
        
        if current_points < cost:
            return JSONResponse({
                'success': False,
                'error': f'Недостаточно очков исследований. Требуется: {cost}, доступно: {current_points}'
            }, status_code=400)
        
        new_points = current_points - cost
        cursor.execute(
            'UPDATE countries SET research_points = ? WHERE id = ?',
            (new_points, country_id)
        )
        conn.commit()
        
        return JSONResponse({
            'success': True,
            'research_points': new_points,
            'deducted': cost
        })
    
    except Exception as e:
        print(f"Error deducting research points: {e}")
        conn.rollback()
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()

@router.get("/turn")
async def get_game_turn():
    """Получение текущего хода игры (доступно всем)"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT current_turn, game_date, is_paused FROM game_state WHERE id = 1')
        state = cursor.fetchone()
        
        if not state:
            return JSONResponse({'success': False, 'error': 'Состояние игры не найдено'}, status_code=404)
        
        return JSONResponse({
            'success': True,
            'current_turn': state['current_turn'],
            'game_date': state['game_date'],
            'is_paused': bool(state['is_paused'])
        })
    
    except Exception as e:
        print(f"Error getting game turn: {e}")
        return JSONResponse({'success': False, 'error': str(e)}, status_code=500)
    finally:
        conn.close()