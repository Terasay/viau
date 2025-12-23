from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import sqlite3
import json
from datetime import datetime

router = APIRouter(prefix="/api/registration")

class ApplicationData(BaseModel):
    first_name: str
    last_name: str
    country_origin: str
    age: int
    country: str
    religion: Optional[str] = None
    ethnicity: Optional[str] = None
    relatives: Optional[str] = None
    referral_code: Optional[str] = None

def get_db():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Инициализация таблицы заявок"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS player_applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            username TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            country_origin TEXT NOT NULL,
            age INTEGER NOT NULL,
            country TEXT NOT NULL,
            religion TEXT,
            ethnicity TEXT,
            relatives TEXT,
            referral_code TEXT,
            status TEXT DEFAULT 'pending',
            rejection_reason TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            reviewed_by INTEGER,
            reviewed_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

init_db()

@router.post("/submit-application")
async def submit_application(data: ApplicationData, request: Request):
    """Отправка новой заявки на регистрацию игрока"""
    
    import sys
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
        cursor.execute(
            "SELECT id, status FROM player_applications WHERE user_id = ?",
            (user['id'],)
        )
        existing = cursor.fetchone()
        
        if existing:
            if existing['status'] == 'approved':
                return JSONResponse({
                    "success": False,
                    "error": "Ваша заявка уже одобрена. Вы являетесь игроком."
                }, status_code=400)
            
            if existing['status'] == 'pending':
                return JSONResponse({
                    "success": False,
                    "error": "Ваша заявка уже находится на рассмотрении."
                }, status_code=400)
        
        cursor.execute(
            "SELECT id FROM player_applications WHERE country = ? AND status != 'rejected'",
            (data.country,)
        )
        if cursor.fetchone():
            return JSONResponse({
                "success": False,
                "error": "Эта страна уже занята"
            }, status_code=400)
        
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO player_applications (
                user_id, username, first_name, last_name, country_origin, age, country,
                religion, ethnicity, relatives, referral_code, status,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user['id'],
            user['username'],
            data.first_name,
            data.last_name,
            data.country_origin,
            data.age,
            data.country,
            data.religion,
            data.ethnicity,
            data.relatives,
            data.referral_code,
            'pending',
            now,
            now
        ))
        
        conn.commit()
        
        return JSONResponse({
            "success": True,
            "message": "Заявка успешно отправлена на рассмотрение"
        })
        
    except Exception as e:
        conn.rollback()
        print(f"Error submitting application: {e}")
        return JSONResponse({
            "success": False,
            "error": "Ошибка при отправке заявки"
        }, status_code=500)
    finally:
        conn.close()

@router.post("/update-application")
async def update_application(data: ApplicationData, request: Request):
    """Обновление существующей заявки"""
    
    import sys
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
        cursor.execute(
            "SELECT id, status, country FROM player_applications WHERE user_id = ?",
            (user['id'],)
        )
        existing = cursor.fetchone()
        
        if not existing:
            return JSONResponse({
                "success": False,
                "error": "Заявка не найдена"
            }, status_code=404)
        
        if existing['status'] == 'approved':
            return JSONResponse({
                "success": False,
                "error": "Нельзя редактировать одобренную заявку"
            }, status_code=400)
        
        if existing['country'] != data.country:
            cursor.execute(
                "SELECT id FROM player_applications WHERE country = ? AND status != 'rejected' AND user_id != ?",
                (data.country, user['id'])
            )
            if cursor.fetchone():
                return JSONResponse({
                    "success": False,
                    "error": "Эта страна уже занята"
                }, status_code=400)
        
        now = datetime.now().isoformat()
        
        cursor.execute('''
            UPDATE player_applications SET
                first_name = ?,
                last_name = ?,
                country_origin = ?,
                age = ?,
                country = ?,
                religion = ?,
                ethnicity = ?,
                relatives = ?,
                referral_code = ?,
                status = 'pending',
                updated_at = ?,
                rejection_reason = NULL,
                reviewed_by = NULL,
                reviewed_at = NULL
            WHERE user_id = ?
        ''', (
            data.first_name,
            data.last_name,
            data.country_origin,
            data.age,
            data.country,
            data.religion,
            data.ethnicity,
            data.relatives,
            data.referral_code,
            now,
            user['id']
        ))
        
        conn.commit()
        
        return JSONResponse({
            "success": True,
            "message": "Заявка успешно обновлена"
        })
        
    except Exception as e:
        conn.rollback()
        print(f"Error updating application: {e}")
        return JSONResponse({
            "success": False,
            "error": "Ошибка при обновлении заявки"
        }, status_code=500)
    finally:
        conn.close()

@router.get("/my-application")
async def get_my_application(request: Request):
    """Получение заявки текущего пользователя"""
    
    import sys
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
            SELECT 
                id, first_name, last_name, country_origin, age, country,
                religion, ethnicity, relatives, referral_code, status, rejection_reason,
                created_at, updated_at, reviewed_at
            FROM player_applications
            WHERE user_id = ?
        ''', (user['id'],))
        
        application = cursor.fetchone()
        
        if application:
            return JSONResponse({
                "success": True,
                "application": {
                    "id": application['id'],
                    "first_name": application['first_name'],
                    "last_name": application['last_name'],
                    "country_origin": application['country_origin'],
                    "age": application['age'],
                    "country": application['country'],
                    "religion": application['religion'],
                    "ethnicity": application['ethnicity'],
                    "relatives": application['relatives'],
                    "referral_code": application['referral_code'],
                    "status": application['status'],
                    "rejection_reason": application['rejection_reason'],
                    "created_at": application['created_at'],
                    "updated_at": application['updated_at'],
                    "reviewed_at": application['reviewed_at']
                }
            })
        else:
            return JSONResponse({
                "success": True,
                "application": None
            })
            
    except Exception as e:
        print(f"Error getting application: {e}")
        return JSONResponse({
            "success": False,
            "error": "Ошибка при получении заявки"
        }, status_code=500)
    finally:
        conn.close()

@router.post("/cancel-application")
async def cancel_application(request: Request):
    """Отзыв заявки"""
    
    import sys
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
        cursor.execute(
            "SELECT id, status FROM player_applications WHERE user_id = ?",
            (user['id'],)
        )
        existing = cursor.fetchone()
        
        if not existing:
            return JSONResponse({
                "success": False,
                "error": "Заявка не найдена"
            }, status_code=404)
        
        if existing['status'] == 'approved':
            return JSONResponse({
                "success": False,
                "error": "Нельзя отозвать одобренную заявку"
            }, status_code=400)
        
        cursor.execute("DELETE FROM player_applications WHERE user_id = ?", (user['id'],))
        conn.commit()
        
        return JSONResponse({
            "success": True,
            "message": "Заявка успешно отозвана"
        })
        
    except Exception as e:
        conn.rollback()
        print(f"Error canceling application: {e}")
        return JSONResponse({
            "success": False,
            "error": "Ошибка при отзыве заявки"
        }, status_code=500)
    finally:
        conn.close()

@router.get("/occupied-countries")
async def get_occupied_countries(request: Request):
    """Получение списка занятых стран"""
    
    import sys
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
        cursor.execute("SELECT country FROM player_applications WHERE status != 'rejected'")
        countries = [row['country'] for row in cursor.fetchall()]
        
        return JSONResponse({
            "success": True,
            "countries": countries
        })
        
    except Exception as e:
        print(f"Error getting occupied countries: {e}")
        return JSONResponse({
            "success": False,
            "countries": []
        }, status_code=500)
    finally:
        conn.close()

@router.get("/admin/all-applications")
async def get_all_applications(request: Request):
    """Получение всех заявок для админ панели"""
    
    import sys
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
            SELECT 
                id, user_id, username,
                first_name, last_name, country_origin, age,
                country, religion, ethnicity, relatives, referral_code,
                status, rejection_reason, created_at, updated_at,
                reviewed_by, reviewed_at
            FROM player_applications
            ORDER BY created_at DESC
        ''')
        
        applications = cursor.fetchall()
        
        return JSONResponse({
            "success": True,
            "applications": [dict(app) for app in applications]
        })
        
    except Exception as e:
        print(f"Error getting applications: {e}")
        return JSONResponse({
            "success": False,
            "error": "Ошибка при получении заявок"
        }, status_code=500)
    finally:
        conn.close()

@router.get("/admin/pending-applications")
async def get_pending_applications(request: Request):
    """Получение всех заявок на рассмотрении (только для админов)"""
    
    import sys
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
            SELECT 
                id, user_id, username, character_name, country, age,
                experience, playtime, motivation, skills, additional_info,
                status, created_at, updated_at
            FROM player_applications
            WHERE status = 'pending'
            ORDER BY created_at DESC
        ''')
        
        applications = cursor.fetchall()
        
        return JSONResponse({
            "success": True,
            "applications": [dict(app) for app in applications]
        })
        
    except Exception as e:
        print(f"Error getting applications: {e}")
        return JSONResponse({
            "success": False,
            "error": "Ошибка при получении заявок"
        }, status_code=500)
    finally:
        conn.close()

class ApproveApplicationData(BaseModel):
    application_id: int
    first_name: str
    last_name: str
    country_origin: str
    age: int
    assigned_country: str
    religion: Optional[str] = None
    ethnicity: Optional[str] = None
    referral_code: Optional[str] = None
    relatives: Optional[str] = None

@router.post("/admin/approve-application")
async def approve_application(data: ApproveApplicationData, request: Request):
    """Одобрение заявки (только для админов)"""
    
    import sys
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
        cursor.execute(
            "SELECT user_id, status FROM player_applications WHERE id = ?",
            (data.application_id,)
        )
        application = cursor.fetchone()
        
        if not application:
            return JSONResponse({
                "success": False,
                "error": "Заявка не найдена"
            }, status_code=404)
        
        if application['status'] != 'pending':
            return JSONResponse({
                "success": False,
                "error": "Можно одобрить только заявки на рассмотрении"
            }, status_code=400)
        
        user_id = application['user_id']
        now = datetime.now().isoformat()
        
        cursor.execute('''
            UPDATE player_applications SET
                first_name = ?,
                last_name = ?,
                country_origin = ?,
                age = ?,
                country = ?,
                religion = ?,
                ethnicity = ?,
                referral_code = ?,
                relatives = ?,
                status = 'approved',
                reviewed_by = ?,
                reviewed_at = ?,
                updated_at = ?
            WHERE id = ?
        ''', (
            data.first_name,
            data.last_name,
            data.country_origin,
            data.age,
            data.assigned_country,
            data.religion,
            data.ethnicity,
            data.referral_code,
            data.relatives,
            user['id'],
            now,
            now,
            data.application_id
        ))
        
        cursor.execute('''
            UPDATE users SET
                role = 'player',
                country = ?
            WHERE id = ?
        ''', (data.assigned_country, user_id))
        
        from routers.characters import calculate_birth_year
        birth_year = calculate_birth_year(data.age)
        
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
            birth_year,
            'Правитель',
            data.ethnicity,
            data.religion,
            None,
            None,
            None,
            1,
            1,
            1,
            1,
            1,
            user_id,
            data.assigned_country,
            now,
            now
        ))
        
        import json
        countries_path = 'data/countries.json'
        country_name = data.assigned_country
        
        try:
            with open(countries_path, 'r', encoding='utf-8') as f:
                countries_list = json.load(f)
            
            for country_data in countries_list:
                if country_data['id'] == data.assigned_country:
                    country_name = country_data['name']
                    country_data['available'] = False
                    break
            
            with open(countries_path, 'w', encoding='utf-8') as f:
                json.dump(countries_list, f, ensure_ascii=False, indent=4)
        except Exception as e:
            print(f"Error loading country name from countries.json: {e}")
        
        from routers.economic import create_country
        country_created = create_country(
            country_id=data.assigned_country,
            player_id=user_id,
            ruler_first_name=data.first_name,
            ruler_last_name=data.last_name,
            country_name=country_name,
            currency='Золото',
            conn=conn,
            cursor=cursor
        )
        
        if not country_created:
            print(f"Warning: Failed to create country record for {data.assigned_country}")
            conn.rollback()
            return JSONResponse({
                "success": False,
                "error": "Не удалось создать запись страны"
            }, status_code=500)
        
        conn.commit()
        
        return JSONResponse({
            "success": True,
            "message": "Заявка одобрена, пользователь получил роль player"
        })
        
        return JSONResponse({
            "success": True,
            "message": "Заявка одобрена"
        })
        
    except Exception as e:
        conn.rollback()
        print(f"Error approving application: {e}")
        return JSONResponse({
            "success": False,
            "error": "Ошибка при одобрении заявки"
        }, status_code=500)
    finally:
        conn.close()

class RejectApplicationData(BaseModel):
    application_id: int
    reason: str

@router.post("/admin/reject-application")
async def reject_application(data: RejectApplicationData, request: Request):
    """Отклонение заявки (только для админов)"""
    
    import sys
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
        cursor.execute(
            "SELECT status FROM player_applications WHERE id = ?",
            (data.application_id,)
        )
        application = cursor.fetchone()
        
        if not application:
            return JSONResponse({
                "success": False,
                "error": "Заявка не найдена"
            }, status_code=404)
        
        if application['status'] != 'pending':
            return JSONResponse({
                "success": False,
                "error": "Можно отклонить только заявки на рассмотрении"
            }, status_code=400)
        
        now = datetime.now().isoformat()
        
        cursor.execute('''
            UPDATE player_applications SET
                status = 'rejected',
                rejection_reason = ?,
                reviewed_by = ?,
                reviewed_at = ?,
                updated_at = ?
            WHERE id = ?
        ''', (data.reason, user['id'], now, now, data.application_id))
        
        conn.commit()
        
        return JSONResponse({
            "success": True,
            "message": "Заявка отклонена"
        })
        
    except Exception as e:
        conn.rollback()
        print(f"Error rejecting application: {e}")
        return JSONResponse({
            "success": False,
            "error": "Ошибка при отклонении заявки"
        }, status_code=500)
    finally:
        conn.close()
