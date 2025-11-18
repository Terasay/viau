from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import sendgrid
from sendgrid.helpers.mail import Mail
import os
from dotenv import load_dotenv
import random
import string
import sqlite3
from email.mime.text import MIMEText
import secrets
import jwt
from datetime import datetime, timedelta


load_dotenv()
SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')

app = FastAPI()
app.mount('/js', StaticFiles(directory='js'), name='js')
app.mount('/css', StaticFiles(directory='css'), name='css')

DB_FILE = 'users.db'
VERIFICATION_CODES = {}
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
		muted INTEGER DEFAULT 0
	)''')
	conn.commit()
	conn.close()

def get_user_by_username(username):
	conn = sqlite3.connect(DB_FILE)
	c = conn.cursor()
	c.execute('SELECT username, password, email, country, role, banned, muted FROM users WHERE username=?', (username,))
	user = c.fetchone()
	conn.close()
	return user

def get_user_by_email(email):
	conn = sqlite3.connect(DB_FILE)
	c = conn.cursor()
	c.execute('SELECT username, password, email, country, role, banned, muted FROM users WHERE email=?', (email,))
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

def create_jwt(username, role):
	payload = {
		'username': username,
		'role': role,
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
	sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
	message = Mail(
		from_email='noreply@zxcmirok.ru',
		to_emails=email,
		subject='Код подтверждения регистрации',
		plain_text_content=f'Ваш код подтверждения: {code}'
	)
	try:
		response = sg.send(message)
		if response.status_code >= 400:
			print(f"SendGrid error: {response.status_code} {response.body}")
			raise Exception("Ошибка отправки через SendGrid")
	except Exception as e:
		print(f"Ошибка SendGrid: {e}")
		raise

@app.on_event('startup')
def startup():
	init_db()

@app.post('/login')
async def login(request: Request):
	data = await request.json()
	user = get_user_by_username(data['username'])
	if user and user[1] == data['password']:
		if user[6]:  # banned
			return JSONResponse({'success': False, 'error': 'Аккаунт забанен'})
		token = create_jwt(user[0], user[5])
		return JSONResponse({
			'success': True,
			'username': user[0],
			'token': token,
			'role': user[5],
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
		token = create_jwt(user[0], user[5])
		return JSONResponse({
			'success': True,
			'username': info['username'],
			'token': token,
			'role': user[5],
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
			'role': user[5],
			'country': user[3],
			'muted': bool(user[6]),
			'banned': bool(user[5])
		})
	return JSONResponse({'logged_in': False})

@app.get('/')
async def index():
	return FileResponse('index.html')
