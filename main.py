from fastapi import UploadFile, File
import uuid
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from email.mime.text import MIMEText
import base64
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import os
from dotenv import load_dotenv
import random
from pathlib import Path
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import string
import sqlite3
from email.mime.text import MIMEText
import secrets
import jwt
from datetime import datetime, timedelta
import bcrypt

from routers import converter, maps


load_dotenv()
GMAIL_CLIENT_ID = os.getenv('GMAIL_CLIENT_ID')
GMAIL_CLIENT_SECRET = os.getenv('GMAIL_CLIENT_SECRET')
GMAIL_REFRESH_TOKEN = os.getenv('GMAIL_REFRESH_TOKEN')
GMAIL_SENDER = os.getenv('GMAIL_SENDER')



app = FastAPI()
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)
app.mount('/js', StaticFiles(directory='js'), name='js')
app.mount('/css', StaticFiles(directory='css'), name='css')
app.include_router(converter.router)
app.include_router(maps.router)


AVATARS_DIR = 'avatars'
if not os.path.exists(AVATARS_DIR):
    os.makedirs(AVATARS_DIR)

MAPS_DIR = 'maps'
if not os.path.exists(MAPS_DIR):
    os.makedirs(MAPS_DIR)

# --- Middleware для увеличения лимита размера загружаемых файлов ---
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest

class LimitUploadSizeMiddleware(BaseHTTPMiddleware):
	def __init__(self, app, max_upload_size: int):
		super().__init__(app)
		self.max_upload_size = max_upload_size

	async def dispatch(self, request: StarletteRequest, call_next):
		# Проверяем только POST/PUT/PATCH
		if request.method in ("POST", "PUT", "PATCH"):
			content_length = request.headers.get("content-length")
			if content_length and int(content_length) > self.max_upload_size:
				return JSONResponse({"success": False, "error": "File too large"}, status_code=413)
		return await call_next(request)

# Установить лимит 100 МБ (можно изменить)
app.add_middleware(LimitUploadSizeMiddleware, max_upload_size=100 * 1024 * 1024)

def hash_password(password: str) -> str:
    """Хеширует пароль с помощью bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет соответствие пароля хешу"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


# --- Эндпоинт для загрузки файлов (изображения/документы) ---
UPLOAD_DIR = 'uploads'
if not os.path.exists(UPLOAD_DIR):
	os.makedirs(UPLOAD_DIR)

@app.post('/chat/upload')
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
		# Формируем ссылку для клиента
		url = f'/uploads/{filename}'
		return JSONResponse({'success': True, 'url': url})
	except Exception as e:
		return JSONResponse({'success': False, 'error': 'Ошибка сохранения файла'})
# Статические файлы для загруженных файлов

app.mount('/uploads', StaticFiles(directory=UPLOAD_DIR), name='uploads')
app.mount('/avatars', StaticFiles(directory=AVATARS_DIR), name='avatars')

@app.post('/reset')
async def reset(request: Request):
	data = await request.json()
	email = data.get('email')
	code = data.get('code')
	new_password = data.get('new_password') or data.get('password')
	info = RESET_CODES.get(email)
	if not info:
		return JSONResponse({'success': False, 'error': 'Нет запроса на восстановление'})
	if code != info['code']:
		return JSONResponse({'success': False, 'error': 'Неверный код'})
	if not new_password:
		return JSONResponse({'success': False, 'error': 'Пароль не может быть пустым'})
	update_user_password(email, new_password)
	RESET_CODES.pop(email)
	return JSONResponse({'success': True})

@app.post('/forgot')
async def forgot(request: Request):
	data = await request.json()
	email = data.get('email')
	user = get_user_by_email(email)
	if not user:
		return JSONResponse({'success': False, 'error': 'Пользователь с такой почтой не найден'})
	code = ''.join(random.choices(string.digits, k=6))
	RESET_CODES[email] = {
		'code': code,
		'email': email
	}
	try:
		send_reset_code(email, code)
	except Exception:
		return JSONResponse({'success': False, 'error': 'Ошибка отправки почты'})
	return JSONResponse({'success': True})

DB_FILE = 'users.db'
VERIFICATION_CODES = {}
RESET_CODES = {}
JWT_SECRET = 'supersecretkey'
JWT_ALGORITHM = 'HS256'

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        country TEXT,
        role TEXT DEFAULT 'user',
        banned INTEGER DEFAULT 0,
        muted INTEGER DEFAULT 0,
        ban_until TEXT,
        mute_until TEXT,
        avatar TEXT
    )''')
    
    # Проверяем, существует ли колонка avatar, если нет - добавляем
    c.execute("PRAGMA table_info(users)")
    columns = [column[1] for column in c.fetchall()]
    if 'avatar' not in columns:
        c.execute('ALTER TABLE users ADD COLUMN avatar TEXT')
    
    c.execute('''CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        role TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp TEXT NOT NULL
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS maps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        filename TEXT NOT NULL,
        uploaded_by TEXT NOT NULL,
        uploaded_at TEXT NOT NULL
    )''')
    conn.commit()
    conn.close()

app.mount('/maps_files', StaticFiles(directory=MAPS_DIR), name='maps_files')

@app.get('/maps/list')
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
	

@app.get('/chat/messages')
async def get_chat_messages():
	conn = sqlite3.connect(DB_FILE)
	c = conn.cursor()
	c.execute('SELECT id, username, role, text, timestamp FROM messages ORDER BY id DESC LIMIT 50')
	rows = c.fetchall()
	conn.close()
	# Возвращаем в обратном порядке (от старых к новым)
	messages = [
		{
			'id': row[0],
			'username': row[1],
			'role': row[2],
			'text': row[3],
			'timestamp': row[4]
		}
		for row in reversed(rows)
	]
	return JSONResponse({'messages': messages})

@app.post('/maps/upload')
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
    
    # Проверить тип файла
    if not file.content_type.startswith('image/'):
        return JSONResponse({'success': False, 'error': 'Only image files are allowed'}, status_code=400)
    
    # Генерировать уникальное имя файла
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(MAPS_DIR, unique_filename)
    
    try:
        # Сохранить файл
        with open(file_path, 'wb') as f:
            content = await file.read()
            f.write(content)
        
        # Сохранить в базу данных
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
                'file_url': f'/maps_files/{unique_filename}',  # Изменено с /maps/ на /maps_files/
                'uploaded_by': user[0],
                'uploaded_at': timestamp
            }
        })
    except Exception as e:
        # Удалить файл если возникла ошибка
        if os.path.exists(file_path):
            os.remove(file_path)
        return JSONResponse({'success': False, 'error': f'Upload failed: {str(e)}'}, status_code=500)

@app.post('/maps/edit')
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
    
    # Проверить существование карты
    c.execute('SELECT id FROM maps WHERE id=?', (map_id,))
    if not c.fetchone():
        conn.close()
        return JSONResponse({'success': False, 'error': 'Map not found'}, status_code=404)
    
    # Обновить название
    c.execute('UPDATE maps SET name=? WHERE id=?', (new_name, map_id))
    conn.commit()
    conn.close()
    
    return JSONResponse({'success': True})

@app.post('/maps/delete')
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
    
    # Получить имя файла
    c.execute('SELECT filename FROM maps WHERE id=?', (map_id,))
    row = c.fetchone()
    
    if not row:
        conn.close()
        return JSONResponse({'success': False, 'error': 'Map not found'}, status_code=404)
    
    filename = row[0]
    
    # Удалить из базы данных
    c.execute('DELETE FROM maps WHERE id=?', (map_id,))
    conn.commit()
    conn.close()
    
    # Удалить файл
    file_path = os.path.join(MAPS_DIR, filename)
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Failed to delete file {filename}: {e}")
    
    return JSONResponse({'success': True})

@app.post('/chat/send')
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
	timestamp = datetime.utcnow().isoformat() + 'Z'
	conn = sqlite3.connect(DB_FILE)
	c = conn.cursor()
	c.execute('INSERT INTO messages (username, role, text, timestamp) VALUES (?, ?, ?, ?)',
			  (user[0], user[4], text, timestamp))
	conn.commit()
	conn.close()
	return JSONResponse({'success': True})

import asyncio

@app.post('/change-password')
async def change_password(request: Request):
    data = await request.json()
    token = request.headers.get('Authorization')
    payload = decode_jwt(token)
    if not payload:
        return JSONResponse({'success': False, 'error': 'Unauthorized'}, status_code=401)
    
    user = get_user_by_username(payload['username'])
    if not user:
        return JSONResponse({'success': False, 'error': 'User not found'}, status_code=404)
    
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not verify_password(current_password, user[1]):  # Проверяем через bcrypt
        return JSONResponse({'success': False, 'error': 'Неверный текущий пароль'})
    
    update_user_password(user[2], new_password)  # user[2] = email
    return JSONResponse({'success': True})

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

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
	await websocket.accept()
	try:
		data = await websocket.receive_json()
		token = data.get("token")
		payload = decode_jwt(token)
		if not payload:
			await websocket.send_json({"error": "Unauthorized"})
			await websocket.close()
			return
		user = get_user_by_username(payload["username"])
		if not user:
			await websocket.send_json({"error": "User not found"})
			await websocket.close()
			return
		if user[5]:
			await websocket.send_json({"error": "User banned"})
			await websocket.close()
			return
		await manager.connect(websocket, user[0], user[4])
		while True:
			data = await websocket.receive_json()
			text = data.get("text", "").strip()
			# Повторно проверяем mute/ban
			user = get_user_by_username(payload["username"])
			if not user:
				await websocket.send_json({"error": "User not found"})
				continue
			if user[5]:
				await websocket.send_json({"error": "User banned"})
				continue
			if user[6]:
				await websocket.send_json({"error": "User muted"})
				continue
			if not text:
				await websocket.send_json({"error": "Empty message"})
				continue
			timestamp = datetime.utcnow().isoformat() + 'Z'
			# Сохраняем сообщение в БД
			conn = sqlite3.connect(DB_FILE)
			c = conn.cursor()
			c.execute('INSERT INTO messages (username, role, text, timestamp) VALUES (?, ?, ?, ?)',
					  (user[0], user[4], text, timestamp))
			conn.commit()
			conn.close()
			msg = {
				"username": user[0],
				"role": user[4],
				"text": text,
				"timestamp": timestamp
			}
			await manager.broadcast({"type": "message", "message": msg})
	except WebSocketDisconnect:
		manager.disconnect(websocket)

def get_user_by_username(username):
	conn = sqlite3.connect(DB_FILE)
	c = conn.cursor()
	c.execute('SELECT username, password, email, country, role, banned, muted, ban_until, mute_until, avatar, id FROM users WHERE username=?', (username,))
	user = c.fetchone()
	conn.close()
	return user

def get_user_by_email(email):
	conn = sqlite3.connect(DB_FILE)
	c = conn.cursor()
	c.execute('SELECT username, password, email, country, role, banned, muted, ban_until, mute_until, avatar, id  FROM users WHERE email=?', (email,))
	user = c.fetchone()
	conn.close()
	return user

def create_user(username, password, email):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    hashed_password = hash_password(password)  # Хешируем пароль
    c.execute('''
        INSERT INTO users (username, password, email, country, role, banned, muted)
        VALUES (?, ?, ?, NULL, 'user', 0, 0)
    ''', (username, hashed_password, email))
    conn.commit()
    conn.close()

def update_user_password(email, new_password):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    hashed_password = hash_password(new_password)  # Хешируем новый пароль
    c.execute('UPDATE users SET password=? WHERE email=?', (hashed_password, email))
    conn.commit()
    conn.close()

# Эндпоинт для удаления сообщения
@app.post('/chat/delete_message')
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
	# Только автор или админ может удалить
	if row[0] != user[0] and user[4] != 'admin':
		conn.close()
		return JSONResponse({'success': False, 'error': 'Forbidden'}, status_code=403)
	c.execute('DELETE FROM messages WHERE id=?', (message_id,))
	conn.commit()
	conn.close()
	return JSONResponse({'success': True})

# Эндпоинт для редактирования сообщения
@app.post('/chat/edit_message')
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
	# Только автор или админ может редактировать
	if row[0] != user[0] and user[4] != 'admin':
		conn.close()
		return JSONResponse({'success': False, 'error': 'Forbidden'}, status_code=403)
	c.execute('UPDATE messages SET text=? WHERE id=?', (new_text, message_id))
	conn.commit()
	conn.close()
	return JSONResponse({'success': True})

def create_jwt(username, role):
	# Преобразуем роль к строке
	role_str = str(role)
	if role_str == '1':
		role_str = 'admin'
	elif role_str == '0':
		role_str = 'user'
	payload = {
		'username': username,
		'role': role_str,
		'exp': datetime.utcnow() + timedelta(days=7)
	}
	return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt(token):
	try:
		payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
		return payload
	except jwt.ExpiredSignatureError:
		return None
	except jwt.InvalidTokenError:
		return None

def send_verification_code(email, code):
	creds = Credentials(
		None,
		refresh_token=GMAIL_REFRESH_TOKEN,
		client_id=GMAIL_CLIENT_ID,
		client_secret=GMAIL_CLIENT_SECRET,
		token_uri='https://oauth2.googleapis.com/token',
		scopes=['https://mail.google.com/']
	)
	service = build('gmail', 'v1', credentials=creds)
	message = MIMEText(f'Здравствуйте!\n\nВаш код подтверждения для регистрации: {code}\n\nЕсли вы не запрашивали регистрацию, просто проигнорируйте это письмо.\n\nС уважением, команда VIAU.')
	message['to'] = email
	message['from'] = GMAIL_SENDER
	message['subject'] = 'Код подтверждения регистрации'
	raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
	try:
		service.users().messages().send(userId='me', body={'raw': raw}).execute()
	except Exception as e:
		print(f"Ошибка Gmail API: {e}")
		raise

def migrate_plain_passwords():
    """Мигрирует все незахешированные пароли в bcrypt"""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT id, username, password FROM users')
    users = c.fetchall()
    
    migrated_count = 0
    for user in users:
        user_id, username, password = user
        # Проверяем, является ли пароль уже bcrypt-хешем
        # bcrypt хеши начинаются с $2b$ или $2a$ и имеют длину 60 символов
        if not password.startswith('$2b$') and not password.startswith('$2a$'):
            # Это plain text пароль, хешируем его
            hashed = hash_password(password)
            c.execute('UPDATE users SET password=? WHERE id=?', (hashed, user_id))
            migrated_count += 1
            print(f"Мигрирован пароль для пользователя: {username}")
    
    conn.commit()
    conn.close()
    
    if migrated_count > 0:
        print(f"Всего мигрировано паролей: {migrated_count}")
    else:
        print("Все пароли уже захешированы")

def send_reset_code(email, code):
	creds = Credentials(
		None,
		refresh_token=GMAIL_REFRESH_TOKEN,
		client_id=GMAIL_CLIENT_ID,
		client_secret=GMAIL_CLIENT_SECRET,
		token_uri='https://oauth2.googleapis.com/token',
		scopes=['https://mail.google.com/']
	)
	service = build('gmail', 'v1', credentials=creds)
	message = MIMEText(f'Здравствуйте!\n\nВаш код для восстановления пароля: {code}\n\nЕсли вы не запрашивали восстановление, просто проигнорируйте это письмо.\n\nС уважением, команда VIAU.')
	message['to'] = email
	message['from'] = GMAIL_SENDER
	message['subject'] = 'Код восстановления пароля'
	raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
	try:
		service.users().messages().send(userId='me', body={'raw': raw}).execute()
	except Exception as e:
		print(f"Ошибка Gmail API: {e}")
		raise

@app.on_event('startup')
def startup():
    init_db()
    migrate_plain_passwords()  

@app.post('/login')
async def login(request: Request):
    data = await request.json()
    user = get_user_by_username(data['username'])
    if user and verify_password(data['password'], user[1]):  # Проверяем пароль через bcrypt
        banned = bool(user[5])
        ban_until = user[7]
        now = datetime.utcnow()
        # Проверка временного бана
        if banned:
            if ban_until:
                try:
                    ban_dt = datetime.fromisoformat(ban_until.replace('Z', ''))
                except Exception:
                    ban_dt = None
                if ban_dt and now >= ban_dt:
                    # Срок бана истек, снимаем бан
                    conn = sqlite3.connect(DB_FILE)
                    c = conn.cursor()
                    c.execute('UPDATE users SET banned=0, ban_until=NULL WHERE username=?', (user[0],))
                    conn.commit()
                    conn.close()
                    # Получаем свежие данные пользователя
                    user = get_user_by_username(data['username'])
                    banned = bool(user[5])
            # После обновления, если бан всё ещё есть — отказ
            if banned:
                if ban_until:
                    return JSONResponse({'success': False, 'error': f'Аккаунт забанен до {ban_until}'})
                else:
                    return JSONResponse({'success': False, 'error': 'Аккаунт забанен'})
        # Если бан снят, разрешаем вход
        token = create_jwt(user[0], user[4])
        return JSONResponse({
            'success': True,
            'username': user[0],
            'token': token,
            'role': user[4],
            'country': user[3],
            'muted': bool(user[6])
        })
    return JSONResponse({'success': False, 'error': 'Неверный логин или пароль'})

@app.get('/user/{username}/avatar')
async def get_user_avatar(username: str):
    user = get_user_by_username(username)
    if not user:
        return JSONResponse({'success': False, 'error': 'User not found'}, status_code=404)
    
    avatar_url = None
    if len(user) > 9 and user[9]:
        avatar_url = f'/avatars/{user[9]}'
    
    return JSONResponse({
        'success': True,
        'avatar': avatar_url
    })

@app.post('/register')
async def register(request: Request):
	data = await request.json()
	if get_user_by_username(data['username']):
		return JSONResponse({'success': False, 'error': 'Логин уже занят'})
	if get_user_by_email(data['email']):
		return JSONResponse({'success': False, 'error': 'Почта уже используется'})
	code = ''.join(random.choices(string.digits, k=6))
	VERIFICATION_CODES[data['email']] = {
		'code': code,
		'username': data['username'],
		'password': data['password'],
		'email': data['email']
	}
	try:
		send_verification_code(data['email'], code)
	except Exception:
		return JSONResponse({'success': False, 'error': 'Ошибка отправки почты'})
	return JSONResponse({'success': True})

@app.post('/verify')
async def verify(request: Request):
	data = await request.json()
	info = VERIFICATION_CODES.get(data.get('email'))
	if not info:
		return JSONResponse({'success': False, 'error': 'Нет ожидающей регистрации'})
	if data['code'] == info['code']:
		create_user(info['username'], info['password'], info['email'])
		VERIFICATION_CODES.pop(info['email'])
		user = get_user_by_username(info['username'])
		token = create_jwt(user[0], user[4])
		return JSONResponse({
			'success': True,
			'username': info['username'],
			'token': token,
			'role': user[4],
			'country': user[3],
			'muted': bool(user[6])
		})
	return JSONResponse({'success': False, 'error': 'Неверный код'})

@app.post('/avatar/upload')
async def upload_avatar(request: Request, file: UploadFile = File(...)):
    token = request.headers.get('Authorization')
    payload = decode_jwt(token)
    if not payload:
        return JSONResponse({'success': False, 'error': 'Unauthorized'}, status_code=401)
    
    user = get_user_by_username(payload['username'])
    if not user:
        return JSONResponse({'success': False, 'error': 'User not found'}, status_code=404)
    
    # Проверка типа файла
    if not file.content_type.startswith('image/'):
        return JSONResponse({'success': False, 'error': 'Только изображения разрешены'}, status_code=400)
    
    # Проверка размера (5 МБ)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        return JSONResponse({'success': False, 'error': 'Размер файла не должен превышать 5 МБ'}, status_code=400)
    
    try:
        user_id = user[10]  # user[10] = id
        avatar_filename = user[9]  # user[9] = avatar
        
        # Удаляем старый аватар если есть
        if avatar_filename:
            old_avatar_path = os.path.join(AVATARS_DIR, avatar_filename)
            if os.path.exists(old_avatar_path):
                os.remove(old_avatar_path)
        
        # Генерируем имя файла: avatar_userid.расширение
        file_extension = Path(file.filename).suffix
        filename = f"avatar_{user_id}{file_extension}"
        file_path = os.path.join(AVATARS_DIR, filename)
        
        # Сохраняем файл
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Обновляем базу данных
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('UPDATE users SET avatar=? WHERE id=?', (filename, user_id))
        conn.commit()
        conn.close()
        
        return JSONResponse({
            'success': True,
            'avatar_url': f'/avatars/{filename}'
        })
    
    except Exception as e:
        print(f"Ошибка загрузки аватара: {e}")
        return JSONResponse({'success': False, 'error': 'Ошибка загрузки аватара'}, status_code=500)


@app.post('/avatar/delete')
async def delete_avatar(request: Request):
    token = request.headers.get('Authorization')
    payload = decode_jwt(token)
    if not payload:
        return JSONResponse({'success': False, 'error': 'Unauthorized'}, status_code=401)
    
    user = get_user_by_username(payload['username'])
    if not user:
        return JSONResponse({'success': False, 'error': 'User not found'}, status_code=404)
    
    try:
        user_id = user[10]  # user[10] = id
        avatar_filename = user[9]  # user[9] = avatar
        
        # Удаляем файл аватара
        if avatar_filename:
            avatar_path = os.path.join(AVATARS_DIR, avatar_filename)
            if os.path.exists(avatar_path):
                os.remove(avatar_path)
        
        # Обновляем базу данных
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('UPDATE users SET avatar=NULL WHERE id=?', (user_id,))
        conn.commit()
        conn.close()
        
        return JSONResponse({'success': True})
    
    except Exception as e:
        print(f"Ошибка удаления аватара: {e}")
        return JSONResponse({'success': False, 'error': 'Ошибка удаления аватара'}, status_code=500)


@app.get('/me')
async def me(request: Request):
    token = request.headers.get('Authorization')
    payload = decode_jwt(token)
    if payload:
        user = get_user_by_username(payload['username'])
        if not user:
            return JSONResponse({'logged_in': False})
        
        avatar_url = None
        if len(user) > 9 and user[9]:
            avatar_url = f'/avatars/{user[9]}'
        
        return JSONResponse({
            'logged_in': True,
            'id': user[10] if len(user) > 10 else None,
            'username': user[0],
            'email': user[2],
            'role': user[4],
            'country': user[3],
            'muted': bool(user[6]),
            'banned': bool(user[5]),
            'ban_until': user[7],
            'mute_until': user[8],
            'avatar': avatar_url
        })
    return JSONResponse({'logged_in': False})

@app.get('/')
async def index():
	return FileResponse('index.html')

@app.get('/converter')
async def converter_page():
    return FileResponse('converter.html')

@app.get('/admin')
async def admin_page():
    return FileResponse('admin.html')

# Эндпоинт для получения всех пользователей (только для админа)
@app.get('/admin/users')
async def admin_users(request: Request):
	token = request.headers.get('Authorization')
	payload = decode_jwt(token)
	role = payload.get('role') if payload else None
	if role != 'admin':
		return JSONResponse({'detail': 'Forbidden'}, status_code=403)
	conn = sqlite3.connect(DB_FILE)
	c = conn.cursor()
	c.execute('SELECT username, password, email, country, role, banned, muted, ban_until, mute_until, avatar, id FROM users')
	users = [
		{
			'id': row[10],
			'username': row[0],
			'email': row[2],
			'country': row[3],
			'role': row[4],
			'banned': bool(row[5]),
			'muted': bool(row[6]),
			'ban_until': row[7],
			'mute_until': row[8],
			'avatar': f'/avatars/{row[9]}' if row[9] else None
		}
		for row in c.fetchall()
	]
	conn.close()
	return JSONResponse({'users': users})

# Эндпоинт для изменения статуса бан/мут пользователя
@app.post('/admin/set_status')
async def admin_set_status(request: Request):
	token = request.headers.get('Authorization')
	payload = decode_jwt(token)
	role = payload.get('role') if payload else None
	if role != 'admin':
		return JSONResponse({'detail': 'Forbidden'}, status_code=403)
	data = await request.json()
	user_id = data.get('id')
	action = data.get('action')  # 'ban' или 'mute'
	value = data.get('value')    # True/False
	until = data.get('until')    # строка даты или None
	if action not in ('ban', 'mute'):
		return JSONResponse({'success': False, 'error': 'Некорректное действие'})
	conn = sqlite3.connect(DB_FILE)
	c = conn.cursor()
	if action == 'ban':
		c.execute('UPDATE users SET banned=?, ban_until=? WHERE id=?', (1 if value else 0, until, user_id))
	elif action == 'mute':
		c.execute('UPDATE users SET muted=?, mute_until=? WHERE id=?', (1 if value else 0, until, user_id))
	conn.commit()
	conn.close()
	return JSONResponse({'success': True})
