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
        # Проверяем права доступа
        cursor.execute('SELECT player_id, research_points FROM countries WHERE id = ?', (country_id,))
        country = cursor.fetchone()
        
        if not country:
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
        # Игроки могут видеть только свою страну, админы - любую
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
        # Получаем текущее количество ОИ
        cursor.execute('SELECT player_id, research_points FROM countries WHERE id = ?', (country_id,))
        country = cursor.fetchone()
        
        if not country:
            return JSONResponse({'success': False, 'error': 'Страна не найдена'}, status_code=404)
        
        # Проверяем права доступа (только владелец страны может списывать ОИ)
        if user['role'] != 'admin' and country['player_id'] != user['id']:
            return JSONResponse({'success': False, 'error': 'Доступ запрещён'}, status_code=403)
        
        current_points = country['research_points']
        
        # Проверяем достаточно ли ОИ
        if current_points < cost:
            return JSONResponse({
                'success': False,
                'error': f'Недостаточно очков исследований. Требуется: {cost}, доступно: {current_points}'
            }, status_code=400)
        
        # Списываем ОИ
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