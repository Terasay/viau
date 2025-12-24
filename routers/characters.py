from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import sys
from datetime import datetime

router = APIRouter(prefix="/api/characters")

DB_FILE = 'users.db'

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_characters_db():
    """Инициализация таблицы персонажей"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS characters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            birth_year INTEGER NOT NULL,
            position TEXT NOT NULL,
            ethnicity TEXT,
            religion TEXT,
            relatives TEXT,
            friends TEXT,
            enemies TEXT,
            military INTEGER DEFAULT 0 CHECK(military >= 0 AND military <= 10),
            administration INTEGER DEFAULT 0 CHECK(administration >= 0 AND administration <= 10),
            diplomacy INTEGER DEFAULT 0 CHECK(diplomacy >= 0 AND diplomacy <= 10),
            intrigue INTEGER DEFAULT 0 CHECK(intrigue >= 0 AND intrigue <= 10),
            knowledge INTEGER DEFAULT 0 CHECK(knowledge >= 0 AND knowledge <= 10),
            user_id INTEGER,
            country TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    cursor.execute("PRAGMA table_info(characters)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'skill_points' not in columns:
        try:
            cursor.execute('ALTER TABLE characters ADD COLUMN skill_points INTEGER DEFAULT 0')
            conn.commit()
            print("Added skill_points column to characters table")
        except Exception as e:
            print(f"Error adding skill_points column: {e}")
    
    conn.commit()
    conn.close()

init_characters_db()

class CharacterData(BaseModel):
    first_name: str
    last_name: str
    birth_year: int
    position: str
    ethnicity: Optional[str] = None
    religion: Optional[str] = None
    relatives: Optional[str] = None
    friends: Optional[str] = None
    enemies: Optional[str] = None
    military: int = 0
    administration: int = 0
    diplomacy: int = 0
    intrigue: int = 0
    knowledge: int = 0
    user_id: Optional[int] = None
    country: Optional[str] = None

def calculate_birth_year(age: int) -> int:
    """Вычисляет год рождения на основе возраста и даты начала игры (1 января 1516 года)"""
    game_start_year = 1516
    return game_start_year - age

@router.get("/admin/all")
async def get_all_characters(request: Request):
    """Получение всех персонажей (только для админов)"""
    sys.path.append('..')
    from main import get_current_user
    
    user = await get_current_user(request)
    if not user:
        return JSONResponse({
            "success": False,
            "error": "Требуется авторизация"
        }, status_code=401)
    
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT *
            FROM characters
            ORDER BY created_at DESC
        ''')
        
        characters = cursor.fetchall()
        
        result_characters = []
        for char in characters:
            char_dict = dict(char)
            char_dict['name'] = f"{char_dict['first_name']} {char_dict['last_name']}"
            char_dict['country_name'] = char_dict.get('country', 'Не указана')
            result_characters.append(char_dict)
        
        return JSONResponse({
            "success": True,
            "characters": result_characters
        })
        
    except Exception as e:
        print(f"Error getting characters: {e}")
        return JSONResponse({
            "success": False,
            "error": "Ошибка при получении персонажей"
        }, status_code=500)
    finally:
        conn.close()

@router.post("/admin/add")
async def add_character(data: CharacterData, request: Request):
    """Добавление нового персонажа (только для админов)"""
    sys.path.append('..')
    from main import get_current_user
    
    user = await get_current_user(request)
    if not user:
        return JSONResponse({
            "success": False,
            "error": "Требуется авторизация"
        }, status_code=401)
    
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO characters (
                first_name, last_name, birth_year, position,
                ethnicity, religion, relatives, friends, enemies,
                military, administration, diplomacy, intrigue, knowledge,
                user_id, country, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.first_name,
            data.last_name,
            data.birth_year,
            data.position,
            data.ethnicity,
            data.religion,
            data.relatives,
            data.friends,
            data.enemies,
            data.military,
            data.administration,
            data.diplomacy,
            data.intrigue,
            data.knowledge,
            data.user_id,
            data.country,
            now,
            now
        ))
        
        conn.commit()
        
        return JSONResponse({
            "success": True,
            "message": "Персонаж добавлен",
            "character_id": cursor.lastrowid
        })
        
    except Exception as e:
        print(f"Error adding character: {e}")
        return JSONResponse({
            "success": False,
            "error": str(e)
        }, status_code=500)
    finally:
        conn.close()

@router.post("/admin/update")
async def update_character(request: Request):
    """Обновление персонажа (только для админов)"""
    sys.path.append('..')
    from main import get_current_user
    
    user = await get_current_user(request)
    if not user:
        return JSONResponse({
            "success": False,
            "error": "Требуется авторизация"
        }, status_code=401)
    
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    data = await request.json()
    character_id = data.get('id')
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        now = datetime.now().isoformat()
        
        cursor.execute('''
            UPDATE characters SET
                first_name = ?,
                last_name = ?,
                birth_year = ?,
                position = ?,
                ethnicity = ?,
                religion = ?,
                relatives = ?,
                friends = ?,
                enemies = ?,
                military = ?,
                administration = ?,
                diplomacy = ?,
                intrigue = ?,
                knowledge = ?,
                user_id = ?,
                country = ?,
                updated_at = ?
            WHERE id = ?
        ''', (
            data.get('first_name'),
            data.get('last_name'),
            data.get('birth_year'),
            data.get('position'),
            data.get('ethnicity'),
            data.get('religion'),
            data.get('relatives'),
            data.get('friends'),
            data.get('enemies'),
            data.get('military'),
            data.get('administration'),
            data.get('diplomacy'),
            data.get('intrigue'),
            data.get('knowledge'),
            data.get('user_id'),
            data.get('country'),
            now,
            character_id
        ))
        
        conn.commit()
        
        return JSONResponse({
            "success": True,
            "message": "Персонаж обновлён"
        })
        
    except Exception as e:
        print(f"Error updating character: {e}")
        return JSONResponse({
            "success": False,
            "error": str(e)
        }, status_code=500)
    finally:
        conn.close()

@router.post("/admin/delete")
async def delete_character(request: Request):
    """Удаление персонажа (только для админов)"""
    sys.path.append('..')
    from main import get_current_user
    
    user = await get_current_user(request)
    if not user:
        return JSONResponse({
            "success": False,
            "error": "Требуется авторизация"
        }, status_code=401)
    
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    data = await request.json()
    character_id = data.get('id')
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('DELETE FROM characters WHERE id = ?', (character_id,))
        conn.commit()
        
        return JSONResponse({
            "success": True,
            "message": "Персонаж удалён"
        })
        
    except Exception as e:
        print(f"Error deleting character: {e}")
        return JSONResponse({
            "success": False,
            "error": str(e)
        }, status_code=500)
    finally:
        conn.close()

@router.get("/my")
async def get_my_character(request: Request):
    """Получение персонажа текущего игрока"""
    sys.path.append('..')
    from main import get_current_user
    
    user = await get_current_user(request)
    if not user:
        return JSONResponse({
            "success": False,
            "error": "Требуется авторизация"
        }, status_code=401)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT *
            FROM characters
            WHERE user_id = ?
        ''', (user['id'],))
        
        character = cursor.fetchone()
        
        if not character:
            return JSONResponse({
                "success": False,
                "error": "Персонаж не найден"
            }, status_code=404)
        
        game_start_year = 1516
        age = game_start_year - character['birth_year']
        
        char_dict = dict(character)
        char_dict['age'] = age
        char_dict['country_name'] = char_dict.get('country', 'Не указана')
        
        return JSONResponse({
            "success": True,
            "character": char_dict
        })
        
    except Exception as e:
        print(f"Error getting my character: {e}")
        return JSONResponse({
            "success": False,
            "error": str(e)
        }, status_code=500)
    finally:
        conn.close()

@router.post("/upgrade-skill")
async def upgrade_skill(request: Request):
    """Прокачка навыка персонажа"""
    sys.path.append('..')
    from main import get_current_user
    
    user = await get_current_user(request)
    if not user:
        return JSONResponse({
            "success": False,
            "error": "Требуется авторизация"
        }, status_code=401)
    
    data = await request.json()
    skill = data.get('skill')
    
    valid_skills = ['military', 'administration', 'diplomacy', 'intrigue', 'knowledge']
    if skill not in valid_skills:
        return JSONResponse({
            "success": False,
            "error": "Неверный навык"
        }, status_code=400)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT * FROM characters 
            WHERE user_id = ?
        ''', (user['id'],))
        
        character = cursor.fetchone()
        
        if not character:
            return JSONResponse({
                "success": False,
                "error": "Персонаж не найден"
            }, status_code=404)
        
        if character['skill_points'] <= 0:
            return JSONResponse({
                "success": False,
                "error": "Недостаточно очков навыков"
            }, status_code=400)
        
        current_value = character[skill]
        if current_value >= 10:
            return JSONResponse({
                "success": False,
                "error": "Навык уже на максимуме"
            }, status_code=400)
        
        now = datetime.now().isoformat()
        cursor.execute(f'''
            UPDATE characters 
            SET {skill} = {skill} + 1, 
                skill_points = skill_points - 1,
                updated_at = ?
            WHERE user_id = ?
        ''', (now, user['id']))
        
        conn.commit()
        
        cursor.execute('SELECT * FROM characters WHERE user_id = ?', (user['id'],))
        updated_character = cursor.fetchone()
        
        return JSONResponse({
            "success": True,
            "character": dict(updated_character),
            "message": f"Навык повышен до {current_value + 1}"
        })
        
    except Exception as e:
        print(f"Error upgrading skill: {e}")
        conn.rollback()
        return JSONResponse({
            "success": False,
            "error": str(e)
        }, status_code=500)
    finally:
        conn.close()
        
@router.get("/admin/{character_id}")
async def get_character_by_id(character_id: int, request: Request):
    """Получить персонажа по ID (только для админов)"""
    sys.path.append('..')
    from main import get_current_user
    
    try:
        user = await get_current_user(request)
        if not user:
            return JSONResponse({
                "success": False,
                "error": "Не авторизован"
            }, status_code=401)
        
        if user.get('role') != 'admin':
            return JSONResponse({
                "success": False,
                "error": "Доступ запрещен"
            }, status_code=403)
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT *
            FROM characters
            WHERE id = ?
        ''', (character_id,))
        
        character = cursor.fetchone()
        
        if not character:
            return JSONResponse({
                "success": False,
                "error": "Персонаж не найден"
            }, status_code=404)
        
        char_dict = dict(character)
        game_start_year = 1516
        char_dict['age'] = game_start_year - char_dict['birth_year']
        char_dict['country_name'] = char_dict.get('country', 'Не указана')
        
        return JSONResponse({
            "success": True,
            "character": char_dict
        })
        
    except Exception as e:
        print(f"Error getting character by id: {e}")
        return JSONResponse({
            "success": False,
            "error": str(e)
        }, status_code=500)
    finally:
        conn.close()

@router.post("/admin/upgrade-skill")
async def admin_upgrade_skill(request: Request):
    """Прокачка навыка персонажа админом"""
    sys.path.append('..')
    from main import get_current_user
    
    conn = get_db()
    try:
        user = await get_current_user(request)
        if not user:
            return JSONResponse({
                "success": False,
                "error": "Не авторизован"
            }, status_code=401)
        
        if user.get('role') != 'admin':
            return JSONResponse({
                "success": False,
                "error": "Доступ запрещен"
            }, status_code=403)
        
        body = await request.json()
        skill = body.get('skill')
        character_id = body.get('character_id')
        
        if not skill or not character_id:
            return JSONResponse({
                "success": False,
                "error": "Не указан навык или ID персонажа"
            }, status_code=400)
        
        valid_skills = ['military', 'administration', 'diplomacy', 'intrigue', 'knowledge']
        if skill not in valid_skills:
            return JSONResponse({
                "success": False,
                "error": "Неверный навык"
            }, status_code=400)
        
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM characters WHERE id = ?', (character_id,))
        character = cursor.fetchone()
        
        if not character:
            return JSONResponse({
                "success": False,
                "error": "Персонаж не найден"
            }, status_code=404)
        
        if character['skill_points'] <= 0:
            return JSONResponse({
                "success": False,
                "error": "Недостаточно очков навыков"
            }, status_code=400)
        
        current_value = character[skill]
        if current_value >= 10:
            return JSONResponse({
                "success": False,
                "error": "Навык уже на максимуме"
            }, status_code=400)
        
        now = datetime.now().isoformat()
        cursor.execute(f'''
            UPDATE characters 
            SET {skill} = {skill} + 1, 
                skill_points = skill_points - 1,
                updated_at = ?
            WHERE id = ?
        ''', (now, character_id))
        
        conn.commit()
        
        cursor.execute('''
            SELECT *
            FROM characters
            WHERE id = ?
        ''', (character_id,))
        updated_character = cursor.fetchone()
        
        char_dict = dict(updated_character)
        game_start_year = 1516
        char_dict['age'] = game_start_year - char_dict['birth_year']
        char_dict['country_name'] = char_dict.get('country', 'Не указана')
        
        return JSONResponse({
            "success": True,
            "character": char_dict,
            "message": f"Навык повышен до {current_value + 1}"
        })
        
    except Exception as e:
        print(f"Error upgrading skill (admin): {e}")
        conn.rollback()
        return JSONResponse({
            "success": False,
            "error": str(e)
        }, status_code=500)
    finally:
        conn.close()