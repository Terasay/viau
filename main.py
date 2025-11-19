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

from fastapi import WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware


import string
import sqlite3
from email.mime.text import MIMEText
import secrets
import jwt
from datetime import datetime, timedelta


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
		mute_until TEXT
	)''')
	c.execute('''CREATE TABLE IF NOT EXISTS messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL,
		role TEXT NOT NULL,
		text TEXT NOT NULL,
		timestamp TEXT NOT NULL
	)''')
	conn.commit()
	conn.close()
# Эндпоинт для получения истории чата
@app.get('/chat/messages')
async def get_chat_messages():
	conn = sqlite3.connect(DB_FILE)
	c = conn.cursor()
	c.execute('SELECT username, role, text, timestamp FROM messages ORDER BY id DESC LIMIT 50')
	rows = c.fetchall()
	conn.close()
	# Возвращаем в обратном порядке (от старых к новым)
	messages = [
		{
			'username': row[0],
			'role': row[1],
			'text': row[2],
			'timestamp': row[3]
		}
		for row in reversed(rows)
	]
	return JSONResponse({'messages': messages})

# Эндпоинт для отправки сообщения
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

# --- WebSocket для чата ---
import asyncio


class ConnectionManager:
	def __init__(self):
		self.active_connections: list[WebSocket] = []
		self.online_users: dict[str, dict] = {}  # username -> {username, role}
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
			# Проверяем, есть ли ещё соединения с этим username
			if username_to_remove not in self.websocket_to_username.values():
				self.online_users.pop(username_to_remove, None)
		# После любого disconnect обновить онлайн
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
	# Сначала принимаем соединение
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
	c.execute('SELECT username, password, email, country, role, banned, muted, ban_until, mute_until FROM users WHERE username=?', (username,))
	user = c.fetchone()
	conn.close()
	return user

def get_user_by_email(email):
	conn = sqlite3.connect(DB_FILE)
	c = conn.cursor()
	c.execute('SELECT username, password, email, country, role, banned, muted, ban_until, mute_until FROM users WHERE email=?', (email,))
	user = c.fetchone()
	conn.close()
	return user

def create_user(username, password, email):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        INSERT INTO users (username, password, email, country, role, banned, muted)
        VALUES (?, ?, ?, NULL, 'user', 0, 0)
    ''', (username, password, email))
    conn.commit()
    conn.close()

def update_user_password(email, new_password):
	conn = sqlite3.connect(DB_FILE)
	c = conn.cursor()
	c.execute('UPDATE users SET password=? WHERE email=?', (new_password, email))
	conn.commit()
	conn.close()


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

@app.post('/login')
async def login(request: Request):
	data = await request.json()
	user = get_user_by_username(data['username'])
	if user and user[1] == data['password']:
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

@app.get('/me')
async def me(request: Request):
	token = request.headers.get('Authorization')
	payload = decode_jwt(token)
	if payload:
		user = get_user_by_username(payload['username'])
		return JSONResponse({
			'logged_in': True,
			'username': payload['username'],
			'role': user[4],  # строка 'admin' или 'user'
			'country': user[3],
			'muted': bool(user[6]),  # muted
			'banned': bool(user[5]),  # banned
			'ban_until': user[7],
			'mute_until': user[8]
		})
	return JSONResponse({'logged_in': False})

@app.get('/')
async def index():
	return FileResponse('index.html')


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
	c.execute('SELECT id, username, email, country, role, banned, muted, ban_until, mute_until FROM users')
	users = [
		{
			'id': row[0],
			'username': row[1],
			'email': row[2],
			'country': row[3],
			'role': row[4],
			'banned': bool(row[5]),
			'muted': bool(row[6]),
			'ban_until': row[7],
			'mute_until': row[8]
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
