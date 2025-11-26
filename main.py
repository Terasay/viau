from fastapi import UploadFile, File, FastAPI, Request, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from email.mime.text import MIMEText
import base64
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import os
from dotenv import load_dotenv
import random
from pathlib import Path
import string
import sqlite3
import secrets
import jwt
from datetime import datetime, timedelta
import uuid
import asyncio
import bcrypt
from typing import Optional, Dict, List
from contextlib import contextmanager
from functools import wraps

# ============================================================================
# КОНФИГУРАЦИЯ
# ============================================================================

load_dotenv()

class Config:
    GMAIL_CLIENT_ID = os.getenv('GMAIL_CLIENT_ID')
    GMAIL_CLIENT_SECRET = os.getenv('GMAIL_CLIENT_SECRET')
    GMAIL_REFRESH_TOKEN = os.getenv('GMAIL_REFRESH_TOKEN')
    GMAIL_SENDER = os.getenv('GMAIL_SENDER')
    JWT_SECRET = os.getenv('JWT_SECRET', 'supersecretkey')  # Должен быть в .env!
    JWT_ALGORITHM = 'HS256'
    JWT_EXPIRATION_DAYS = 7
    MAX_UPLOAD_SIZE = 100 * 1024 * 1024  # 100 MB
    DB_FILE = 'users.db'
    VERIFICATION_CODE_LENGTH = 6
    VERIFICATION_CODE_EXPIRY = 15  # минут
    PASSWORD_MIN_LENGTH = 8
    MAX_LOGIN_ATTEMPTS = 5
    LOGIN_LOCKOUT_MINUTES = 15

config = Config()

# Директории
AVATARS_DIR = 'avatars'
MAPS_DIR = 'maps'
UPLOAD_DIR = 'uploads'

for directory in [AVATARS_DIR, MAPS_DIR, UPLOAD_DIR]:
    os.makedirs(directory, exist_ok=True)

# ============================================================================
# БАЗА ДАННЫХ
# ============================================================================

@contextmanager
def get_db():
    """Context manager для безопасной работы с БД"""
    conn = sqlite3.connect(config.DB_FILE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    """Инициализация базы данных с правильными индексами"""
    with get_db() as conn:
        c = conn.cursor()
        
        # Таблица пользователей
        c.execute('''CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            country TEXT,
            role TEXT DEFAULT 'user',
            banned INTEGER DEFAULT 0,
            muted INTEGER DEFAULT 0,
            ban_until TEXT,
            mute_until TEXT,
            avatar TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_login TEXT,
            login_attempts INTEGER DEFAULT 0,
            lockout_until TEXT
        )''')
        
        # Таблица сообщений
        c.execute('''CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            role TEXT NOT NULL,
            text TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            edited INTEGER DEFAULT 0,
            edited_at TEXT
        )''')
        
        # Таблица карт
        c.execute('''CREATE TABLE IF NOT EXISTS maps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            filename TEXT NOT NULL,
            uploaded_by TEXT NOT NULL,
            uploaded_at TEXT NOT NULL
        )''')
        
        # Таблица для временных кодов (верификация и восстановление)
        c.execute('''CREATE TABLE IF NOT EXISTS verification_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            code TEXT NOT NULL,
            code_type TEXT NOT NULL,
            username TEXT,
            password_hash TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            expires_at TEXT NOT NULL,
            used INTEGER DEFAULT 0
        )''')
        
        # Индексы для оптимизации
        c.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email, code_type)')
        
        conn.commit()

# ============================================================================
# УТИЛИТЫ БЕЗОПАСНОСТИ
# ============================================================================

class SecurityUtils:
    @staticmethod
    def hash_password(password: str) -> str:
        """Хеширование пароля с помощью bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Проверка пароля"""
        try:
            return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        except Exception:
            return False
    
    @staticmethod
    def generate_code(length: int = 6) -> str:
        """Генерация безопасного кода"""
        return ''.join(secrets.choice(string.digits) for _ in range(length))
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Очистка имени файла от опасных символов"""
        filename = os.path.basename(filename)
        return "".join(c for c in filename if c.isalnum() or c in ('_', '-', '.'))
    
    @staticmethod
    def validate_password_strength(password: str) -> tuple[bool, str]:
        """Проверка силы пароля"""
        if len(password) < config.PASSWORD_MIN_LENGTH:
            return False, f'Пароль должен содержать минимум {config.PASSWORD_MIN_LENGTH} символов'
        if not any(c.isdigit() for c in password):
            return False, 'Пароль должен содержать хотя бы одну цифру'
        if not any(c.isalpha() for c in password):
            return False, 'Пароль должен содержать хотя бы одну букву'
        return True, ''

# ============================================================================
# JWT УТИЛИТЫ
# ============================================================================

class JWTUtils:
    @staticmethod
    def create_token(username: str, role: str) -> str:
        """Создание JWT токена"""
        payload = {
            'username': username,
            'role': role,
            'exp': datetime.utcnow() + timedelta(days=config.JWT_EXPIRATION_DAYS),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)
    
    @staticmethod
    def decode_token(token: str) -> Optional[Dict]:
        """Декодирование JWT токена"""
        try:
            if token and token.startswith('Bearer '):
                token = token[7:]
            payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

async def get_current_user(request: Request) -> Dict:
    """Dependency для получения текущего пользователя"""
    token = request.headers.get('Authorization')
    if not token:
        raise HTTPException(status_code=401, detail='Unauthorized')
    
    payload = JWTUtils.decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail='Invalid or expired token')
    
    user = UserService.get_user_by_username(payload['username'])
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    
    return user

# ============================================================================
# СЕРВИСЫ
# ============================================================================

class UserService:
    @staticmethod
    def get_user_by_username(username: str) -> Optional[sqlite3.Row]:
        """Получение пользователя по имени"""
        with get_db() as conn:
            c = conn.cursor()
            c.execute('''SELECT * FROM users WHERE username=?''', (username,))
            return c.fetchone()
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[sqlite3.Row]:
        """Получение пользователя по email"""
        with get_db() as conn:
            c = conn.cursor()
            c.execute('''SELECT * FROM users WHERE email=?''', (email,))
            return c.fetchone()
    
    @staticmethod
    def create_user(username: str, password: str, email: str) -> bool:
        """Создание нового пользователя"""
        password_hash = SecurityUtils.hash_password(password)
        try:
            with get_db() as conn:
                c = conn.cursor()
                c.execute('''
                    INSERT INTO users (username, password_hash, email, role, banned, muted)
                    VALUES (?, ?, ?, 'user', 0, 0)
                ''', (username, password_hash, email))
                conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False
    
    @staticmethod
    def update_password(email: str, new_password: str) -> bool:
        """Обновление пароля"""
        password_hash = SecurityUtils.hash_password(new_password)
        with get_db() as conn:
            c = conn.cursor()
            c.execute('UPDATE users SET password_hash=? WHERE email=?', (password_hash, email))
            conn.commit()
        return True
    
    @staticmethod
    def check_login_attempts(username: str) -> tuple[bool, Optional[str]]:
        """Проверка попыток входа и блокировки"""
        user = UserService.get_user_by_username(username)
        if not user:
            return True, None
        
        # ✅ Безопасная проверка наличия поля
        lockout_until = user['lockout_until'] if 'lockout_until' in user.keys() else None
        
        if lockout_until:
            try:
                lockout_time = datetime.fromisoformat(lockout_until.replace('Z', ''))
                if datetime.utcnow() < lockout_time:
                    return False, f"Аккаунт заблокирован до {lockout_until}"
                else:
                    # Сброс блокировки
                    with get_db() as conn:
                        c = conn.cursor()
                        c.execute('UPDATE users SET login_attempts=0, lockout_until=NULL WHERE username=?', (username,))
                        conn.commit()
            except (ValueError, TypeError):
                # Некорректная дата - сбрасываем блокировку
                with get_db() as conn:
                    c = conn.cursor()
                    c.execute('UPDATE users SET login_attempts=0, lockout_until=NULL WHERE username=?', (username,))
                    conn.commit()
        
        return True, None
    
    @staticmethod
    def increment_login_attempts(username: str):
        """Увеличение счетчика попыток входа"""
        with get_db() as conn:
            c = conn.cursor()
            c.execute('SELECT login_attempts FROM users WHERE username=?', (username,))
            result = c.fetchone()
            
            if result:
                attempts = result[0] + 1
                lockout_until = None
                
                if attempts >= config.MAX_LOGIN_ATTEMPTS:
                    lockout_until = (datetime.utcnow() + timedelta(minutes=config.LOGIN_LOCKOUT_MINUTES)).isoformat() + 'Z'
                
                c.execute('''UPDATE users SET login_attempts=?, lockout_until=? WHERE username=?''',
                         (attempts, lockout_until, username))
                conn.commit()
    
    @staticmethod
    def reset_login_attempts(username: str):
        """Сброс счетчика попыток входа"""
        with get_db() as conn:
            c = conn.cursor()
            c.execute('UPDATE users SET login_attempts=0, lockout_until=NULL, last_login=? WHERE username=?',
                     (datetime.utcnow().isoformat() + 'Z', username))
            conn.commit()

class VerificationService:
    @staticmethod
    def create_verification_code(email: str, code_type: str, username: str = None, password: str = None) -> str:
        """Создание кода верификации"""
        code = SecurityUtils.generate_code(config.VERIFICATION_CODE_LENGTH)
        password_hash = SecurityUtils.hash_password(password) if password else None
        expires_at = (datetime.utcnow() + timedelta(minutes=config.VERIFICATION_CODE_EXPIRY)).isoformat() + 'Z'
        
        with get_db() as conn:
            c = conn.cursor()
            # Удаляем старые коды
            c.execute('DELETE FROM verification_codes WHERE email=? AND code_type=?', (email, code_type))
            # Создаем новый
            c.execute('''INSERT INTO verification_codes (email, code, code_type, username, password_hash, expires_at)
                         VALUES (?, ?, ?, ?, ?, ?)''',
                     (email, code, code_type, username, password_hash, expires_at))
            conn.commit()
        
        return code
    
    @staticmethod
    def verify_code(email: str, code: str, code_type: str) -> Optional[Dict]:
        """Проверка кода верификации"""
        with get_db() as conn:
            c = conn.cursor()
            c.execute('''SELECT * FROM verification_codes 
                        WHERE email=? AND code=? AND code_type=? AND used=0''',
                     (email, code, code_type))
            result = c.fetchone()
            
            if not result:
                return None
            
            expires_at = datetime.fromisoformat(result['expires_at'].replace('Z', ''))
            if datetime.utcnow() > expires_at:
                return None
            
            # Помечаем код как использованный
            c.execute('UPDATE verification_codes SET used=1 WHERE id=?', (result['id'],))
            conn.commit()
            
            return dict(result)

class EmailService:
    @staticmethod
    def send_email(to_email: str, subject: str, body: str):
        """Отправка email через Gmail API"""
        creds = Credentials(
            None,
            refresh_token=config.GMAIL_REFRESH_TOKEN,
            client_id=config.GMAIL_CLIENT_ID,
            client_secret=config.GMAIL_CLIENT_SECRET,
            token_uri='https://oauth2.googleapis.com/token',
            scopes=['https://mail.google.com/']
        )
        service = build('gmail', 'v1', credentials=creds)
        message = MIMEText(body)
        message['to'] = to_email
        message['from'] = config.GMAIL_SENDER
        message['subject'] = subject
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        
        try:
            service.users().messages().send(userId='me', body={'raw': raw}).execute()
        except Exception as e:
            print(f"Ошибка Gmail API: {e}")
            raise
    
    @staticmethod
    def send_verification_code(email: str, code: str):
        """Отправка кода верификации"""
        body = f'''Здравствуйте!

Ваш код подтверждения для регистрации: {code}

Код действителен в течение {config.VERIFICATION_CODE_EXPIRY} минут.

Если вы не запрашивали регистрацию, просто проигнорируйте это письмо.

С уважением, команда VIAU.'''
        EmailService.send_email(email, 'Код подтверждения регистрации', body)
    
    @staticmethod
    def send_reset_code(email: str, code: str):
        """Отправка кода восстановления пароля"""
        body = f'''Здравствуйте!

Ваш код для восстановления пароля: {code}

Код действителен в течение {config.VERIFICATION_CODE_EXPIRY} минут.

Если вы не запрашивали восстановление, просто проигнорируйте это письмо.

С уважением, команда VIAU.'''
        EmailService.send_email(email, 'Код восстановления пароля', body)

# ============================================================================
# FASTAPI ПРИЛОЖЕНИЕ
# ============================================================================

app = FastAPI(title="VIAU API", version="2.0")

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LimitUploadSizeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_upload_size: int):
        super().__init__(app)
        self.max_upload_size = max_upload_size

    async def dispatch(self, request: StarletteRequest, call_next):
        if request.method in ("POST", "PUT", "PATCH"):
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > self.max_upload_size:
                return JSONResponse(
                    {"success": False, "error": "File too large"}, 
                    status_code=413
                )
        return await call_next(request)

app.add_middleware(LimitUploadSizeMiddleware, max_upload_size=config.MAX_UPLOAD_SIZE)

# Статические файлы
app.mount('/js', StaticFiles(directory='js'), name='js')
app.mount('/css', StaticFiles(directory='css'), name='css')
app.mount('/uploads', StaticFiles(directory=UPLOAD_DIR), name='uploads')
app.mount('/avatars', StaticFiles(directory=AVATARS_DIR), name='avatars')
app.mount('/maps_files', StaticFiles(directory=MAPS_DIR), name='maps_files')

@app.on_event('startup')
def startup():
    init_db()
    # Очистка старых кодов при запуске
    with get_db() as conn:
        c = conn.cursor()
        c.execute('DELETE FROM verification_codes WHERE datetime(expires_at) < datetime("now")')
        conn.commit()

# ============================================================================
# ENDPOINTS - АУТЕНТИФИКАЦИЯ
# ============================================================================

@app.post('/register')
async def register(request: Request):
    """Регистрация нового пользователя"""
    data = await request.json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    email = data.get('email', '').strip()
    
    # Валидация
    if not username or not password or not email:
        return JSONResponse({'success': False, 'error': 'Все поля обязательны'}, status_code=400)
    
    if len(username) < 3:
        return JSONResponse({'success': False, 'error': 'Имя пользователя должно быть минимум 3 символа'}, status_code=400)
    
    is_strong, error_msg = SecurityUtils.validate_password_strength(password)
    if not is_strong:
        return JSONResponse({'success': False, 'error': error_msg}, status_code=400)
    
    if UserService.get_user_by_username(username):
        return JSONResponse({'success': False, 'error': 'Логин уже занят'}, status_code=400)
    
    if UserService.get_user_by_email(email):
        return JSONResponse({'success': False, 'error': 'Почта уже используется'}, status_code=400)
    
    # Создание кода верификации
    try:
        code = VerificationService.create_verification_code(email, 'registration', username, password)
        EmailService.send_verification_code(email, code)
        return JSONResponse({'success': True})
    except Exception as e:
        return JSONResponse({'success': False, 'error': 'Ошибка отправки почты'}, status_code=500)

@app.post('/verify')
async def verify(request: Request):
    """Подтверждение регистрации"""
    data = await request.json()
    email = data.get('email')
    code = data.get('code')
    
    verification = VerificationService.verify_code(email, code, 'registration')
    if not verification:
        return JSONResponse({'success': False, 'error': 'Неверный или истёкший код'}, status_code=400)
    
    # Создание пользователя
    success = UserService.create_user(verification['username'], verification['password_hash'], email)
    if not success:
        return JSONResponse({'success': False, 'error': 'Ошибка создания пользователя'}, status_code=500)
    
    user = UserService.get_user_by_username(verification['username'])
    token = JWTUtils.create_token(user['username'], user['role'])
    
    return JSONResponse({
        'success': True,
        'username': user['username'],
        'token': token,
        'role': user['role'],
        'country': user['country'],
        'muted': bool(user['muted'])
    })

@app.post('/login')
async def login(request: Request):
    """Вход в систему"""
    data = await request.json()
    username = data.get('username')
    password = data.get('password')
    
    # Проверка блокировки
    can_login, error_msg = UserService.check_login_attempts(username)
    if not can_login:
        return JSONResponse({'success': False, 'error': error_msg}, status_code=403)
    
    user = UserService.get_user_by_username(username)
    
    # Проверка пароля
    if not user or not SecurityUtils.verify_password(password, user['password_hash']):
        if user:
            UserService.increment_login_attempts(username)
        return JSONResponse({'success': False, 'error': 'Неверный логин или пароль'}, status_code=401)
    
    # Проверка бана
    if user['banned']:
        ban_until = user['ban_until']
        if ban_until:
            ban_dt = datetime.fromisoformat(ban_until.replace('Z', ''))
            if datetime.utcnow() >= ban_dt:
                # Снятие бана
                with get_db() as conn:
                    c = conn.cursor()
                    c.execute('UPDATE users SET banned=0, ban_until=NULL WHERE username=?', (username,))
                    conn.commit()
                user = UserService.get_user_by_username(username)
            else:
                return JSONResponse({'success': False, 'error': f'Аккаунт забанен до {ban_until}'}, status_code=403)
        else:
            return JSONResponse({'success': False, 'error': 'Аккаунт забанен'}, status_code=403)
    
    # Успешный вход
    UserService.reset_login_attempts(username)
    token = JWTUtils.create_token(user['username'], user['role'])
    
    return JSONResponse({
        'success': True,
        'username': user['username'],
        'token': token,
        'role': user['role'],
        'country': user['country'],
        'muted': bool(user['muted'])
    })

@app.post('/forgot')
async def forgot(request: Request):
    """Запрос на восстановление пароля"""
    data = await request.json()
    email = data.get('email')
    
    user = UserService.get_user_by_email(email)
    if not user:
        return JSONResponse({'success': False, 'error': 'Пользователь с такой почтой не найден'}, status_code=404)
    
    try:
        code = VerificationService.create_verification_code(email, 'reset')
        EmailService.send_reset_code(email, code)
        return JSONResponse({'success': True})
    except Exception:
        return JSONResponse({'success': False, 'error': 'Ошибка отправки почты'}, status_code=500)

@app.post('/reset')
async def reset(request: Request):
    """Сброс пароля"""
    data = await request.json()
    email = data.get('email')
    code = data.get('code')
    new_password = data.get('new_password') or data.get('password')
    
    verification = VerificationService.verify_code(email, code, 'reset')
    if not verification:
        return JSONResponse({'success': False, 'error': 'Неверный или истёкший код'}, status_code=400)
    
    is_strong, error_msg = SecurityUtils.validate_password_strength(new_password)
    if not is_strong:
        return JSONResponse({'success': False, 'error': error_msg}, status_code=400)
    
    UserService.update_password(email, new_password)
    return JSONResponse({'success': True})

@app.post('/change-password')
async def change_password(request: Request, user: dict = Depends(get_current_user)):
    """Смена пароля"""
    data = await request.json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not SecurityUtils.verify_password(current_password, user['password_hash']):
        return JSONResponse({'success': False, 'error': 'Неверный текущий пароль'}, status_code=400)
    
    is_strong, error_msg = SecurityUtils.validate_password_strength(new_password)
    if not is_strong:
        return JSONResponse({'success': False, 'error': error_msg}, status_code=400)
    
    UserService.update_password(user['email'], new_password)
    return JSONResponse({'success': True})

# ============================================================================
# ENDPOINTS - ПРОФИЛЬ И АВАТАРЫ
# ============================================================================

@app.get('/me')
async def get_me(request: Request):
    """Получение информации о текущем пользователе"""
    token = request.headers.get('Authorization')
    payload = JWTUtils.decode_token(token)
    
    if not payload:
        return JSONResponse({'logged_in': False})
    
    user = UserService.get_user_by_username(payload['username'])
    if not user:
        return JSONResponse({'logged_in': False})
    
    avatar_url = f'/avatars/{user["avatar"]}' if user['avatar'] else None
    
    return JSONResponse({
        'logged_in': True,
        'id': user['id'],
        'username': user['username'],
        'email': user['email'],
        'role': user['role'],
        'country': user['country'],
        'muted': bool(user['muted']),
        'banned': bool(user['banned']),
        'ban_until': user['ban_until'],
        'mute_until': user['mute_until'],
        'avatar': avatar_url
    })

@app.post('/avatar/upload')
async def upload_avatar(request: Request, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Загрузка аватара пользователя"""
    # Проверка типа файла
    if not file.content_type.startswith('image/'):
        return JSONResponse({'success': False, 'error': 'Только изображения разрешены'}, status_code=400)
    
    # Проверка размера (5 МБ)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        return JSONResponse({'success': False, 'error': 'Размер файла не должен превышать 5 МБ'}, status_code=400)
    
    # Проверка расширения
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in allowed_extensions:
        return JSONResponse({'success': False, 'error': 'Недопустимый формат файла'}, status_code=400)
    
    try:
        user_id = user['id']
        old_avatar = user['avatar']
        
        # Удаляем старый аватар
        if old_avatar:
            old_path = os.path.join(AVATARS_DIR, old_avatar)
            if os.path.exists(old_path):
                os.remove(old_path)
        
        # Генерируем безопасное имя файла
        filename = f"avatar_{user_id}_{uuid.uuid4().hex[:8]}{file_extension}"
        file_path = os.path.join(AVATARS_DIR, filename)
        
        # Сохраняем файл
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Обновляем БД
        with get_db() as conn:
            c = conn.cursor()
            c.execute('UPDATE users SET avatar=? WHERE id=?', (filename, user_id))
            conn.commit()
        
        return JSONResponse({
            'success': True,
            'avatar_url': f'/avatars/{filename}'
        })
    
    except Exception as e:
        print(f"Ошибка загрузки аватара: {e}")
        return JSONResponse({'success': False, 'error': 'Ошибка загрузки аватара'}, status_code=500)

@app.post('/avatar/delete')
async def delete_avatar(request: Request, user: dict = Depends(get_current_user)):
    """Удаление аватара пользователя"""
    try:
        avatar_filename = user['avatar']
        
        # Удаляем файл
        if avatar_filename:
            avatar_path = os.path.join(AVATARS_DIR, avatar_filename)
            if os.path.exists(avatar_path):
                os.remove(avatar_path)
        
        # Обновляем БД
        with get_db() as conn:
            c = conn.cursor()
            c.execute('UPDATE users SET avatar=NULL WHERE id=?', (user['id'],))
            conn.commit()
        
        return JSONResponse({'success': True})
    
    except Exception as e:
        print(f"Ошибка удаления аватара: {e}")
        return JSONResponse({'success': False, 'error': 'Ошибка удаления аватара'}, status_code=500)

# ============================================================================
# ENDPOINTS - АДМИН ПАНЕЛЬ
# ============================================================================

def require_admin(user: dict = Depends(get_current_user)):
    """Dependency для проверки прав администратора"""
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail='Forbidden')
    return user

@app.get('/admin/users')
async def get_all_users(admin: dict = Depends(require_admin)):
    """Получение списка всех пользователей (только для админа)"""
    with get_db() as conn:
        c = conn.cursor()
        c.execute('''SELECT id, username, email, country, role, banned, muted, 
                     ban_until, mute_until, avatar, created_at, last_login 
                     FROM users ORDER BY created_at DESC''')
        users = [
            {
                'id': row['id'],
                'username': row['username'],
                'email': row['email'],
                'country': row['country'],
                'role': row['role'],
                'banned': bool(row['banned']),
                'muted': bool(row['muted']),
                'ban_until': row['ban_until'],
                'mute_until': row['mute_until'],
                'avatar': f'/avatars/{row["avatar"]}' if row['avatar'] else None,
                'created_at': row['created_at'],
                'last_login': row['last_login']
            }
            for row in c.fetchall()
        ]
    
    return JSONResponse({'users': users})

@app.post('/admin/set_status')
async def set_user_status(request: Request, admin: dict = Depends(require_admin)):
    """Изменение статуса бан/мут пользователя (только для админа)"""
    data = await request.json()
    user_id = data.get('id')
    action = data.get('action')
    value = data.get('value')
    until = data.get('until')
    
    if not user_id:
        return JSONResponse({'success': False, 'error': 'ID пользователя обязателен'}, status_code=400)
    
    if action not in ('ban', 'mute'):
        return JSONResponse({'success': False, 'error': 'Действие должно быть ban или mute'}, status_code=400)
    
    # Проверка даты
    if until:
        try:
            datetime.fromisoformat(until.replace('Z', ''))
        except ValueError:
            return JSONResponse({'success': False, 'error': 'Неверный формат даты'}, status_code=400)
    
    # Нельзя банить/мутить самого себя
    if user_id == admin['id']:
        return JSONResponse({'success': False, 'error': 'Нельзя изменить свой статус'}, status_code=400)
    
    with get_db() as conn:
        c = conn.cursor()
        
        # Проверяем существование пользователя
        c.execute('SELECT role FROM users WHERE id=?', (user_id,))
        target_user = c.fetchone()
        
        if not target_user:
            return JSONResponse({'success': False, 'error': 'Пользователь не найден'}, status_code=404)
        
        # Нельзя банить других админов
        if target_user['role'] == 'admin' and action == 'ban':
            return JSONResponse({'success': False, 'error': 'Нельзя банить администраторов'}, status_code=403)
        
        if action == 'ban':
            c.execute('UPDATE users SET banned=?, ban_until=? WHERE id=?', 
                     (1 if value else 0, until, user_id))
        elif action == 'mute':
            c.execute('UPDATE users SET muted=?, mute_until=? WHERE id=?', 
                     (1 if value else 0, until, user_id))
        
        conn.commit()
    
    return JSONResponse({'success': True})

@app.post('/admin/change_role')
async def change_user_role(request: Request, admin: dict = Depends(require_admin)):
    """Изменение роли пользователя (только для админа)"""
    data = await request.json()
    user_id = data.get('id')
    new_role = data.get('role')
    
    if not user_id or not new_role:
        return JSONResponse({'success': False, 'error': 'ID и роль обязательны'}, status_code=400)
    
    if new_role not in ('user', 'admin'):
        return JSONResponse({'success': False, 'error': 'Роль должна быть user или admin'}, status_code=400)
    
    # Нельзя изменить свою роль
    if user_id == admin['id']:
        return JSONResponse({'success': False, 'error': 'Нельзя изменить свою роль'}, status_code=400)
    
    with get_db() as conn:
        c = conn.cursor()
        c.execute('UPDATE users SET role=? WHERE id=?', (new_role, user_id))
        conn.commit()
    
    return JSONResponse({'success': True})

@app.delete('/admin/delete_user')
async def delete_user(request: Request, admin: dict = Depends(require_admin)):
    """Удаление пользователя (только для админа)"""
    data = await request.json()
    user_id = data.get('id')
    
    if not user_id:
        return JSONResponse({'success': False, 'error': 'ID пользователя обязателен'}, status_code=400)
    
    # Нельзя удалить самого себя
    if user_id == admin['id']:
        return JSONResponse({'success': False, 'error': 'Нельзя удалить свой аккаунт'}, status_code=400)
    
    with get_db() as conn:
        c = conn.cursor()
        
        # Получаем аватар перед удалением
        c.execute('SELECT avatar FROM users WHERE id=?', (user_id,))
        user = c.fetchone()
        
        if not user:
            return JSONResponse({'success': False, 'error': 'Пользователь не найден'}, status_code=404)
        
        # Удаляем аватар
        if user['avatar']:
            avatar_path = os.path.join(AVATARS_DIR, user['avatar'])
            if os.path.exists(avatar_path):
                os.remove(avatar_path)
        
        # Удаляем пользователя
        c.execute('DELETE FROM users WHERE id=?', (user_id,))
        conn.commit()
    
    return JSONResponse({'success': True})

# ============================================================================
# ENDPOINTS - ЧАТ
# ============================================================================

@app.get('/chat/messages')
async def get_chat_messages():
    """Получение последних сообщений чата"""
    with get_db() as conn:
        c = conn.cursor()
        c.execute('''SELECT id, username, role, text, timestamp, edited, edited_at 
                     FROM messages ORDER BY id DESC LIMIT 50''')
        rows = c.fetchall()
    
    messages = [
        {
            'id': row['id'],
            'username': row['username'],
            'role': row['role'],
            'text': row['text'],
            'timestamp': row['timestamp'],
            'edited': bool(row['edited']),
            'edited_at': row['edited_at']
        }
        for row in reversed(rows)
    ]
    
    return JSONResponse({'messages': messages})

@app.post('/chat/send')
async def send_chat_message(request: Request, user: dict = Depends(get_current_user)):
    """Отправка сообщения в чат"""
    data = await request.json()
    text = data.get('text', '').strip()
    
    # Проверки
    if user['banned']:
        return JSONResponse({'success': False, 'error': 'Пользователь забанен'}, status_code=403)
    
    if user['muted']:
        # Проверка временного мута
        if user['mute_until']:
            mute_dt = datetime.fromisoformat(user['mute_until'].replace('Z', ''))
            if datetime.utcnow() >= mute_dt:
                # Снимаем мут
                with get_db() as conn:
                    c = conn.cursor()
                    c.execute('UPDATE users SET muted=0, mute_until=NULL WHERE id=?', (user['id'],))
                    conn.commit()
            else:
                return JSONResponse({'success': False, 'error': 'Пользователь в муте'}, status_code=403)
        else:
            return JSONResponse({'success': False, 'error': 'Пользователь в муте'}, status_code=403)
    
    if not text:
        return JSONResponse({'success': False, 'error': 'Пустое сообщение'}, status_code=400)
    
    if len(text) > 2000:
        return JSONResponse({'success': False, 'error': 'Сообщение слишком длинное'}, status_code=400)
    
    # Сохранение сообщения
    timestamp = datetime.utcnow().isoformat() + 'Z'
    
    with get_db() as conn:
        c = conn.cursor()
        c.execute('''INSERT INTO messages (username, role, text, timestamp, edited) 
                     VALUES (?, ?, ?, ?, 0)''',
                 (user['username'], user['role'], text, timestamp))
        conn.commit()
    
    return JSONResponse({'success': True})

@app.post('/chat/edit_message')
async def edit_message(request: Request, user: dict = Depends(get_current_user)):
    """Редактирование сообщения"""
    data = await request.json()
    message_id = data.get('id')
    new_text = data.get('text', '').strip()
    
    if not message_id or not new_text:
        return JSONResponse({'success': False, 'error': 'ID и текст обязательны'}, status_code=400)
    
    if len(new_text) > 2000:
        return JSONResponse({'success': False, 'error': 'Сообщение слишком длинное'}, status_code=400)
    
    with get_db() as conn:
        c = conn.cursor()
        c.execute('SELECT username FROM messages WHERE id=?', (message_id,))
        message = c.fetchone()
        
        if not message:
            return JSONResponse({'success': False, 'error': 'Сообщение не найдено'}, status_code=404)
        
        # Только автор или админ может редактировать
        if message['username'] != user['username'] and user['role'] != 'admin':
            return JSONResponse({'success': False, 'error': 'Нет прав'}, status_code=403)
        
        edited_at = datetime.utcnow().isoformat() + 'Z'
        c.execute('UPDATE messages SET text=?, edited=1, edited_at=? WHERE id=?', 
                 (new_text, edited_at, message_id))
        conn.commit()
    
    return JSONResponse({'success': True})

@app.post('/chat/delete_message')
async def delete_message(request: Request, user: dict = Depends(get_current_user)):
    """Удаление сообщения"""
    data = await request.json()
    message_id = data.get('id')
    
    if not message_id:
        return JSONResponse({'success': False, 'error': 'ID сообщения обязателен'}, status_code=400)
    
    with get_db() as conn:
        c = conn.cursor()
        c.execute('SELECT username FROM messages WHERE id=?', (message_id,))
        message = c.fetchone()
        
        if not message:
            return JSONResponse({'success': False, 'error': 'Сообщение не найдено'}, status_code=404)
        
        # Только автор или админ может удалять
        if message['username'] != user['username'] and user['role'] != 'admin':
            return JSONResponse({'success': False, 'error': 'Нет прав'}, status_code=403)
        
        c.execute('DELETE FROM messages WHERE id=?', (message_id,))
        conn.commit()
    
    return JSONResponse({'success': True})

@app.post('/chat/upload')
async def chat_upload(request: Request, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Загрузка файла в чат"""
    # Проверка типа файла
    allowed_types = {'image/', 'video/', 'application/pdf', 'text/'}
    if not any(file.content_type.startswith(t) for t in allowed_types):
        return JSONResponse({'success': False, 'error': 'Недопустимый тип файла'}, status_code=400)
    
    # Проверка размера (50 МБ для чата)
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        return JSONResponse({'success': False, 'error': 'Файл слишком большой'}, status_code=400)
    
    try:
        # Генерируем безопасное имя
        file_extension = Path(file.filename).suffix.lower()
        safe_name = SecurityUtils.sanitize_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{safe_name}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Сохраняем
        with open(file_path, 'wb') as f:
            f.write(content)
        
        url = f'/uploads/{unique_filename}'
        return JSONResponse({'success': True, 'url': url})
    
    except Exception as e:
        print(f"Ошибка загрузки файла: {e}")
        return JSONResponse({'success': False, 'error': 'Ошибка сохранения файла'}, status_code=500)

# ============================================================================
# WEBSOCKET - РЕАЛТАЙМ ЧАТ
# ============================================================================

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.online_users: Dict[str, Dict] = {}
        self.websocket_to_username: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, username: str, role: str):
        self.active_connections.append(websocket)
        self.online_users[username] = {"username": username, "role": role}
        self.websocket_to_username[websocket] = username
        await self.broadcast_online_users()

    def disconnect(self, websocket: WebSocket):
        username = self.websocket_to_username.pop(websocket, None)
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if username and username not in self.websocket_to_username.values():
            self.online_users.pop(username, None)
        
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
    """WebSocket для реалтайм чата"""
    await websocket.accept()
    
    try:
        # Аутентификация
        data = await websocket.receive_json()
        token = data.get("token")
        payload = JWTUtils.decode_token(token)
        
        if not payload:
            await websocket.send_json({"error": "Unauthorized"})
            await websocket.close()
            return
        
        user = UserService.get_user_by_username(payload["username"])
        if not user:
            await websocket.send_json({"error": "User not found"})
            await websocket.close()
            return
        
        if user['banned']:
            await websocket.send_json({"error": "User banned"})
            await websocket.close()
            return
        
        await manager.connect(websocket, user['username'], user['role'])
        
        # Обработка сообщений
        while True:
            data = await websocket.receive_json()
            text = data.get("text", "").strip()
            
            # Повторная проверка статуса
            user = UserService.get_user_by_username(payload["username"])
            if not user:
                await websocket.send_json({"error": "User not found"})
                continue
            
            if user['banned']:
                await websocket.send_json({"error": "User banned"})
                continue
            
            if user['muted']:
                # Проверка временного мута
                if user['mute_until']:
                    mute_dt = datetime.fromisoformat(user['mute_until'].replace('Z', ''))
                    if datetime.utcnow() < mute_dt:
                        await websocket.send_json({"error": "User muted"})
                        continue
                else:
                    await websocket.send_json({"error": "User muted"})
                    continue
            
            if not text or len(text) > 2000:
                await websocket.send_json({"error": "Invalid message"})
                continue
            
            # Сохранение и broadcast
            timestamp = datetime.utcnow().isoformat() + 'Z'
            
            with get_db() as conn:
                c = conn.cursor()
                c.execute('''INSERT INTO messages (username, role, text, timestamp, edited) 
                            VALUES (?, ?, ?, ?, 0)''',
                         (user['username'], user['role'], text, timestamp))
                conn.commit()
            
            msg = {
                "username": user['username'],
                "role": user['role'],
                "text": text,
                "timestamp": timestamp,
                "edited": False
            }
            await manager.broadcast({"type": "message", "message": msg})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# ============================================================================
# ENDPOINTS - КАРТЫ
# ============================================================================

@app.get('/maps/list')
async def get_maps_list(user: dict = Depends(get_current_user)):
    """Получение списка карт"""
    with get_db() as conn:
        c = conn.cursor()
        c.execute('''SELECT id, name, filename, uploaded_by, uploaded_at 
                     FROM maps ORDER BY id DESC''')
        rows = c.fetchall()
    
    maps = [
        {
            'id': row['id'],
            'name': row['name'],
            'file_url': f'/maps_files/{row["filename"]}',
            'uploaded_by': row['uploaded_by'],
            'uploaded_at': row['uploaded_at']
        }
        for row in rows
    ]
    
    return JSONResponse({'success': True, 'maps': maps})

@app.post('/maps/upload')
async def upload_map(request: Request, admin: dict = Depends(require_admin)):
    """Загрузка карты (только для админа)"""
    form = await request.form()
    name = form.get('name', '').strip()
    file = form.get('file')
    
    if not name:
        return JSONResponse({'success': False, 'error': 'Название карты обязательно'}, status_code=400)
    
    if not file:
        return JSONResponse({'success': False, 'error': 'Файл обязателен'}, status_code=400)
    
    # Проверка типа файла
    if not file.content_type.startswith('image/'):
        return JSONResponse({'success': False, 'error': 'Только изображения'}, status_code=400)
    
    # Проверка размера (20 МБ)
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        return JSONResponse({'success': False, 'error': 'Файл слишком большой'}, status_code=400)
    
    try:
        # Генерация имени
        file_extension = Path(file.filename).suffix.lower()
        unique_filename = f"map_{uuid.uuid4().hex}{file_extension}"
        file_path = os.path.join(MAPS_DIR, unique_filename)
        
        # Сохранение
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Добавление в БД
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        with get_db() as conn:
            c = conn.cursor()
            c.execute('''INSERT INTO maps (name, filename, uploaded_by, uploaded_at) 
                        VALUES (?, ?, ?, ?)''',
                     (name, unique_filename, admin['username'], timestamp))
            conn.commit()
            map_id = c.lastrowid
        
        return JSONResponse({
            'success': True,
            'map': {
                'id': map_id,
                'name': name,
                'file_url': f'/maps_files/{unique_filename}',
                'uploaded_by': admin['username'],
                'uploaded_at': timestamp
            }
        })
    
    except Exception as e:
        # Откат при ошибке
        if os.path.exists(file_path):
            os.remove(file_path)
        print(f"Ошибка загрузки карты: {e}")
        return JSONResponse({'success': False, 'error': 'Ошибка загрузки'}, status_code=500)

@app.post('/maps/edit')
async def edit_map(request: Request, admin: dict = Depends(require_admin)):
    """Редактирование названия карты (только для админа)"""
    data = await request.json()
    map_id = data.get('id')
    new_name = data.get('name', '').strip()
    
    if not map_id or not new_name:
        return JSONResponse({'success': False, 'error': 'ID и название обязательны'}, status_code=400)
    
    with get_db() as conn:
        c = conn.cursor()
        c.execute('SELECT id FROM maps WHERE id=?', (map_id,))
        
        if not c.fetchone():
            return JSONResponse({'success': False, 'error': 'Карта не найдена'}, status_code=404)
        
        c.execute('UPDATE maps SET name=? WHERE id=?', (new_name, map_id))
        conn.commit()
    
    return JSONResponse({'success': True})

@app.post('/maps/delete')
async def delete_map(request: Request, admin: dict = Depends(require_admin)):
    """Удаление карты (только для админа)"""
    data = await request.json()
    map_id = data.get('id')
    
    if not map_id:
        return JSONResponse({'success': False, 'error': 'ID карты обязателен'}, status_code=400)
    
    with get_db() as conn:
        c = conn.cursor()
        c.execute('SELECT filename FROM maps WHERE id=?', (map_id,))
        map_data = c.fetchone()
        
        if not map_data:
            return JSONResponse({'success': False, 'error': 'Карта не найдена'}, status_code=404)
        
        filename = map_data['filename']
        
        # Удаление из БД
        c.execute('DELETE FROM maps WHERE id=?', (map_id,))
        conn.commit()
    
    # Удаление файла
    file_path = os.path.join(MAPS_DIR, filename)
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Ошибка удаления файла карты: {e}")
    
    return JSONResponse({'success': True})

# ============================================================================
# ГЛАВНАЯ СТРАНИЦА
# ============================================================================

@app.get('/')
async def index():
    """Главная страница"""
    return FileResponse('index.html')