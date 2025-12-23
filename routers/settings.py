from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import json
import sys
import os

router = APIRouter(prefix="/api/settings")

RULES_FILE = 'data/rules.txt'
COUNTRIES_FILE = 'data/countries.json'

class RulesData(BaseModel):
    content: str

class CountryData(BaseModel):
    id: str
    name: str
    available: bool

class UpdateCountryData(BaseModel):
    old_id: str
    id: str
    name: str
    available: bool

class DeleteCountryData(BaseModel):
    id: str

async def check_admin(request: Request):
    """Проверка прав администратора"""
    sys.path.append('..')
    from main import get_current_user
    
    user = await get_current_user(request)
    if not user or user.get('role') != 'admin':
        return None
    return user

@router.get("/rules")
async def get_rules(request: Request):
    """Получение содержимого файла правил"""
    user = await check_admin(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Нет доступа'}, status_code=403)
    
    try:
        if not os.path.exists(RULES_FILE):
            return JSONResponse({'success': False, 'error': 'Файл правил не найден'})
        
        with open(RULES_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return JSONResponse({'success': True, 'content': content})
    except Exception as e:
        return JSONResponse({'success': False, 'error': str(e)})

@router.post("/rules")
async def update_rules(data: RulesData, request: Request):
    """Обновление файла правил"""
    user = await check_admin(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Нет доступа'}, status_code=403)
    
    try:
        os.makedirs(os.path.dirname(RULES_FILE), exist_ok=True)
        
        with open(RULES_FILE, 'w', encoding='utf-8') as f:
            f.write(data.content)
        
        return JSONResponse({'success': True})
    except Exception as e:
        return JSONResponse({'success': False, 'error': str(e)})

@router.get("/countries")
async def get_countries(request: Request):
    """Получение списка стран (доступно всем для формы регистрации)"""
    try:
        if not os.path.exists(COUNTRIES_FILE):
            return JSONResponse({'success': False, 'error': 'Файл стран не найден'})
        
        with open(COUNTRIES_FILE, 'r', encoding='utf-8') as f:
            countries = json.load(f)
        
        return JSONResponse({'success': True, 'countries': countries})
    except Exception as e:
        return JSONResponse({'success': False, 'error': str(e)})

@router.post("/countries/add")
async def add_country(data: CountryData, request: Request):
    """Добавление новой страны"""
    user = await check_admin(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Нет доступа'}, status_code=403)
    
    try:
        if not os.path.exists(COUNTRIES_FILE):
            countries = []
        else:
            with open(COUNTRIES_FILE, 'r', encoding='utf-8') as f:
                countries = json.load(f)
        
        if any(c['id'] == data.id for c in countries):
            return JSONResponse({'success': False, 'error': 'Страна с таким ID уже существует'})
        
        countries.append({
            'id': data.id,
            'name': data.name,
            'available': data.available
        })
        
        with open(COUNTRIES_FILE, 'w', encoding='utf-8') as f:
            json.dump(countries, f, ensure_ascii=False, indent=4)
        
        return JSONResponse({'success': True})
    except Exception as e:
        return JSONResponse({'success': False, 'error': str(e)})

@router.post("/countries/update")
async def update_country(data: UpdateCountryData, request: Request):
    """Обновление страны"""
    user = await check_admin(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Нет доступа'}, status_code=403)
    
    try:
        if not os.path.exists(COUNTRIES_FILE):
            return JSONResponse({'success': False, 'error': 'Файл стран не найден'})
        
        with open(COUNTRIES_FILE, 'r', encoding='utf-8') as f:
            countries = json.load(f)
        
        country_index = next((i for i, c in enumerate(countries) if c['id'] == data.old_id), None)
        if country_index is None:
            return JSONResponse({'success': False, 'error': 'Страна не найдена'})
        
        if data.old_id != data.id:
            if any(c['id'] == data.id for c in countries):
                return JSONResponse({'success': False, 'error': 'Страна с таким ID уже существует'})
        
        countries[country_index] = {
            'id': data.id,
            'name': data.name,
            'available': data.available
        }
        
        with open(COUNTRIES_FILE, 'w', encoding='utf-8') as f:
            json.dump(countries, f, ensure_ascii=False, indent=4)
        
        return JSONResponse({'success': True})
    except Exception as e:
        return JSONResponse({'success': False, 'error': str(e)})

@router.post("/countries/delete")
async def delete_country(data: DeleteCountryData, request: Request):
    """Удаление страны"""
    user = await check_admin(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Нет доступа'}, status_code=403)
    
    try:
        if not os.path.exists(COUNTRIES_FILE):
            return JSONResponse({'success': False, 'error': 'Файл стран не найден'})
        
        with open(COUNTRIES_FILE, 'r', encoding='utf-8') as f:
            countries = json.load(f)
        
        countries = [c for c in countries if c['id'] != data.id]
        
        with open(COUNTRIES_FILE, 'w', encoding='utf-8') as f:
            json.dump(countries, f, ensure_ascii=False, indent=4)
        
        return JSONResponse({'success': True})
    except Exception as e:
        return JSONResponse({'success': False, 'error': str(e)})

@router.get("/referral")
async def get_referral_code(request: Request):
    """Получение реферального кода пользователя"""
    sys.path.append('..')
    from main import get_current_user
    
    user = await get_current_user(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Нет доступа'}, status_code=403)
    
    try:
        import sqlite3
        DB_FILE = 'users.db'
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('SELECT referral_code FROM users WHERE username=?', (user['username'],))
        result = c.fetchone()
        conn.close()
        
        if result and result[0]:
            return JSONResponse({'success': True, 'referral_code': result[0]})
        else:
            return JSONResponse({'success': False, 'error': 'Реферальный код не найден'})
    except Exception as e:
        return JSONResponse({'success': False, 'error': str(e)})
