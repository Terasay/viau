from fastapi import APIRouter, Request, UploadFile, File
from fastapi.responses import JSONResponse
import os
import sqlite3
import uuid
from pathlib import Path
from datetime import datetime

router = APIRouter(prefix='/api/maps', tags=['maps'])

MAPS_DIR = 'maps'
DB_FILE = 'users.db'

def decode_jwt(token):
    import jwt
    JWT_SECRET = 'supersecretkey'
    JWT_ALGORITHM = 'HS256'
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_user_by_username(username):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT username, password, email, country, role, banned, muted, ban_until, mute_until, avatar, id FROM users WHERE username=?', (username,))
    user = c.fetchone()
    conn.close()
    return user

@router.get('/list')
async def get_maps_list(request: Request):
    token = request.headers.get('Authorization')
    payload = decode_jwt(token)
    if not payload:
        return JSONResponse({'success': False, 'error': 'Unauthorized'}, status_code=401)
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT id, name, filename, uploaded_by, uploaded_at FROM maps ORDER BY id DESC')
    rows = c.fetchall()
    conn.close()
    
    maps = [
        {
            'id': row[0],
            'name': row[1],
            'file_url': f'/maps_files/{row[2]}',
            'uploaded_by': row[3],
            'uploaded_at': row[4]
        }
        for row in rows
    ]
    
    return JSONResponse({'success': True, 'maps': maps})

@router.post('/upload')
async def upload_map(request: Request):
    token = request.headers.get('Authorization')
    payload = decode_jwt(token)
    if not payload:
        return JSONResponse({'success': False, 'error': 'Unauthorized'}, status_code=401)
    
    user = get_user_by_username(payload['username'])
    if not user or user[4] != 'admin':
        return JSONResponse({'success': False, 'error': 'Only admins can upload maps'}, status_code=403)
    
    # Получить данные из формы
    form = await request.form()
    name = form.get('name', '').strip() if form.get('name') else ''
    file = form.get('file')
    
    if not name:
        return JSONResponse({'success': False, 'error': 'Map name is required'}, status_code=400)
    
    if not file:
        return JSONResponse({'success': False, 'error': 'File is required'}, status_code=400)
    
    if not file.content_type.startswith('image/'):
        return JSONResponse({'success': False, 'error': 'Only image files are allowed'}, status_code=400)
    
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(MAPS_DIR, unique_filename)
    
    try:
        with open(file_path, 'wb') as f:
            content = await file.read()
            f.write(content)
        
        timestamp = datetime.utcnow().isoformat() + 'Z'
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute(
            'INSERT INTO maps (name, filename, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?)',
            (name, unique_filename, user[0], timestamp)
        )
        conn.commit()
        map_id = c.lastrowid
        conn.close()
        
        return JSONResponse({
            'success': True,
            'map': {
                'id': map_id,
                'name': name,
                'file_url': f'/maps_files/{unique_filename}',
                'uploaded_by': user[0],
                'uploaded_at': timestamp
            }
        })
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        return JSONResponse({'success': False, 'error': f'Upload failed: {str(e)}'}, status_code=500)

@router.post('/edit')
async def edit_map(request: Request):
    token = request.headers.get('Authorization')
    payload = decode_jwt(token)
    if not payload:
        return JSONResponse({'success': False, 'error': 'Unauthorized'}, status_code=401)
    
    user = get_user_by_username(payload['username'])
    if not user or user[4] != 'admin':
        return JSONResponse({'success': False, 'error': 'Only admins can edit maps'}, status_code=403)
    
    data = await request.json()
    map_id = data.get('id')
    new_name = data.get('name', '').strip()
    
    if not map_id or not new_name:
        return JSONResponse({'success': False, 'error': 'Map ID and name are required'}, status_code=400)
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    c.execute('SELECT id FROM maps WHERE id=?', (map_id,))
    if not c.fetchone():
        conn.close()
        return JSONResponse({'success': False, 'error': 'Map not found'}, status_code=404)
    
    c.execute('UPDATE maps SET name=? WHERE id=?', (new_name, map_id))
    conn.commit()
    conn.close()
    
    return JSONResponse({'success': True})

@router.post('/delete')
async def delete_map(request: Request):
    token = request.headers.get('Authorization')
    payload = decode_jwt(token)
    if not payload:
        return JSONResponse({'success': False, 'error': 'Unauthorized'}, status_code=401)
    
    user = get_user_by_username(payload['username'])
    if not user or user[4] != 'admin':
        return JSONResponse({'success': False, 'error': 'Only admins can delete maps'}, status_code=403)
    
    data = await request.json()
    map_id = data.get('id')
    
    if not map_id:
        return JSONResponse({'success': False, 'error': 'Map ID is required'}, status_code=400)
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    c.execute('SELECT filename FROM maps WHERE id=?', (map_id,))
    row = c.fetchone()
    
    if not row:
        conn.close()
        return JSONResponse({'success': False, 'error': 'Map not found'}, status_code=404)
    
    filename = row[0]
    
    c.execute('DELETE FROM maps WHERE id=?', (map_id,))
    conn.commit()
    conn.close()
    
    file_path = os.path.join(MAPS_DIR, filename)
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Failed to delete file {filename}: {e}")
    
    return JSONResponse({'success': True})