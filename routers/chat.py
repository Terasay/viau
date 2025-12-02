from fastapi import APIRouter, Request, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import sqlite3
import uuid
import os
from datetime import datetime

router = APIRouter(prefix='/api/chat', tags=['chat'])  # Было: prefix='/chat'

DB_FILE = 'users.db'
UPLOAD_DIR = 'uploads'

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

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.online_users: dict[str, dict] = {}
        self.websocket_to_username: dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, username: str, role: str):
        self.active_connections.append(websocket)
        self.online_users[username] = {"username": username, "role": role}
        self.websocket_to_username[websocket] = username
        await self.broadcast_online_users()

    def disconnect(self, websocket: WebSocket):
        username_to_remove = self.websocket_to_username.pop(websocket, None)
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if username_to_remove:
            if username_to_remove not in self.websocket_to_username.values():
                self.online_users.pop(username_to_remove, None)
        import asyncio
        asyncio.create_task(self.broadcast_online_users())

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

    async def broadcast_online_users(self):
        online_list = list(self.online_users.values())
        for connection in self.active_connections:
            try:
                await connection.send_json({"type": "online_users", "users": online_list})
            except Exception:
                pass

manager = ConnectionManager()

@router.get('/messages')
async def get_chat_messages(before: int = None, limit: int = 50):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    if before:
        c.execute('SELECT id, username, role, text, timestamp FROM messages WHERE id < ? ORDER BY id DESC LIMIT ?', (before, limit))
    else:
        c.execute('SELECT id, username, role, text, timestamp FROM messages ORDER BY id DESC LIMIT ?', (limit,))
    
    rows = c.fetchall()
    conn.close()
    
    import json
    messages = []
    for row in reversed(rows):
        try:
            # Пытаемся распарсить как JSON
            text_data = json.loads(row[3])
            message = {
                'id': row[0],
                'username': row[1],
                'role': row[2],
                'text': text_data.get('text', row[3]),
                'timestamp': row[4]
            }
            if 'replyTo' in text_data and text_data['replyTo']:
                message['replyTo'] = text_data['replyTo']
        except (json.JSONDecodeError, TypeError):
            # Если не JSON, то обычный текст
            message = {
                'id': row[0],
                'username': row[1],
                'role': row[2],
                'text': row[3],
                'timestamp': row[4]
            }
        messages.append(message)
    
    return JSONResponse({'messages': messages})

@router.post('/send')
async def send_chat_message(request: Request):
    data = await request.json()
    token = request.headers.get('Authorization')
    payload = decode_jwt(token)
    if not payload:
        return JSONResponse({'success': False, 'error': 'Unauthorized'}, status_code=401)
    
    user = get_user_by_username(payload['username'])
    if not user:
        return JSONResponse({'success': False, 'error': 'User not found'}, status_code=404)
    if user[5]:
        return JSONResponse({'success': False, 'error': 'User banned'}, status_code=403)
    if user[6]:
        return JSONResponse({'success': False, 'error': 'User muted'}, status_code=403)
    
    text = data.get('text', '').strip()
    if not text:
        return JSONResponse({'success': False, 'error': 'Empty message'}, status_code=400)
    
    # Поддержка ответов
    reply_to = data.get('replyTo')
    message_data = {
        'text': text,
        'replyTo': reply_to
    }
    
    import json
    message_json = json.dumps(message_data, ensure_ascii=False)
    
    timestamp = datetime.utcnow().isoformat() + 'Z'
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('INSERT INTO messages (username, role, text, timestamp) VALUES (?, ?, ?, ?)',
              (user[0], user[4], message_json, timestamp))
    conn.commit()
    conn.close()
    
    return JSONResponse({'success': True})

@router.post('/upload')
async def chat_upload(request: Request, file: UploadFile = File(...)):
    token = request.headers.get('Authorization')
    payload = decode_jwt(token)
    if not payload:
        return JSONResponse({'success': False, 'error': 'Unauthorized'}, status_code=401)
    
    filename = str(uuid.uuid4()) + '_' + file.filename
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    try:
        with open(file_path, 'wb') as f:
            content = await file.read()
            f.write(content)
        url = f'/uploads/{filename}'
        return JSONResponse({'success': True, 'url': url})
    except Exception as e:
        return JSONResponse({'success': False, 'error': 'Ошибка сохранения файла'})

@router.post('/delete_message')
async def delete_message(request: Request):
    data = await request.json()
    token = request.headers.get('Authorization')
    payload = decode_jwt(token)
    if not payload:
        return JSONResponse({'success': False, 'error': 'Unauthorized'}, status_code=401)
    
    user = get_user_by_username(payload['username'])
    if not user:
        return JSONResponse({'success': False, 'error': 'User not found'}, status_code=404)
    
    message_id = data.get('id')
    if not message_id:
        return JSONResponse({'success': False, 'error': 'Message id required'}, status_code=400)
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT username FROM messages WHERE id=?', (message_id,))
    row = c.fetchone()
    
    if not row:
        conn.close()
        return JSONResponse({'success': False, 'error': 'Message not found'}, status_code=404)
    
    if row[0] != user[0] and user[4] != 'admin':
        conn.close()
        return JSONResponse({'success': False, 'error': 'Forbidden'}, status_code=403)
    
    c.execute('DELETE FROM messages WHERE id=?', (message_id,))
    conn.commit()
    conn.close()
    
    return JSONResponse({'success': True})

@router.post('/edit_message')
async def edit_message(request: Request):
    data = await request.json()
    token = request.headers.get('Authorization')
    payload = decode_jwt(token)
    if not payload:
        return JSONResponse({'success': False, 'error': 'Unauthorized'}, status_code=401)
    
    user = get_user_by_username(payload['username'])
    if not user:
        return JSONResponse({'success': False, 'error': 'User not found'}, status_code=404)
    
    message_id = data.get('id')
    new_text = data.get('text', '').strip()
    
    if not message_id or not new_text:
        return JSONResponse({'success': False, 'error': 'Message id and text required'}, status_code=400)
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT username FROM messages WHERE id=?', (message_id,))
    row = c.fetchone()
    
    if not row:
        conn.close()
        return JSONResponse({'success': False, 'error': 'Message not found'}, status_code=404)
    
    if row[0] != user[0] and user[4] != 'admin':
        conn.close()
        return JSONResponse({'success': False, 'error': 'Forbidden'}, status_code=403)
    
    c.execute('UPDATE messages SET text=? WHERE id=?', (new_text, message_id))
    conn.commit()
    conn.close()
    
    return JSONResponse({'success': True})