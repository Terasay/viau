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
app.mount('/js', StaticFiles(directory='js'), name='js')
app.mount('/css', StaticFiles(directory='css'), name='css')

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

def update_user_password(email, new_password):
	conn = sqlite3.connect(DB_FILE)
	c = conn.cursor()
	c.execute('UPDATE users SET password=? WHERE email=?', (new_password, email))
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
		if user[6]:
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
