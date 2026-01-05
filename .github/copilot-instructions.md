# VIAU: Multiplayer Strategy Game Platform

## Architecture Overview

**Tech Stack:** FastAPI (Python) backend + vanilla JavaScript frontend  
**Database:** SQLite (`users.db`) with manual schema migrations  
**Auth:** JWT tokens (stored in `localStorage`, passed as `Authorization` header)

### Core Components
- **Backend Router System** (`routers/`): Modular FastAPI routers, each with `router = APIRouter(prefix="/api/...")` and own DB initialization in `init_db()`
- **Frontend Pages:** Each HTML page (e.g., `game.html`, `chat.html`) has matching JS (`js/game.js`) and CSS (`css/game.css`)
- **Main Entry Point:** `main.py` imports all routers, mounts static directories, and handles global middleware

### Database Structure
- **Manual migrations via `ALTER TABLE`** - Check column existence with `PRAGMA table_info()` before adding
- **Key tables:**
  - `users` - Core auth, includes `referral_code`, `avatar`, `role` (user/admin/moderator)
  - `countries` - Player nations with `player_id` FK, stores `secret_coins`, `research_points`, `balance`
  - `country_*` tables - Resources, currencies, technologies, provinces (many-to-one with countries)
  - `game_state` - Singleton table for turn tracking (`id = 1`)

## Authentication Pattern

All API routes requiring auth follow this pattern:
```python
async def get_current_user(request: Request):
    sys.path.append('..')
    from main import get_current_user as main_get_current_user
    return await main_get_current_user(request)

@router.get("/protected-route")
async def protected_route(request: Request):
    user = await get_current_user(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Требуется авторизация'}, status_code=401)
```

Frontend always sends: `headers: { 'Authorization': localStorage.getItem('token') }`

## Router Module Conventions

1. **Structure:** Each router file starts with:
   ```python
   router = APIRouter(prefix="/api/<module>")
   def get_db(): conn = sqlite3.connect('users.db'); conn.row_factory = sqlite3.Row; return conn
   def init_db(): # CREATE TABLE IF NOT EXISTS with column checks
   ```

2. **Response Format:** Use `JSONResponse({'success': True/False, ...})` consistently
3. **Authorization Checks:** 
   - Verify `user['role']` for admin routes
   - Compare `user['id']` with `country['player_id']` for ownership
4. **Error Handling:** Always include `try/except` with `conn.close()` in `finally`

## Frontend Patterns

### State Management
Global state exposed via `window.gameState`:
```javascript
window.gameState = {
    getUser: () => currentUser,
    getCountry: () => currentCountry,
    updateCountry: (newCountry) => { /* updates UI */ }
};
```

### Theme System
Dark mode toggle via `localStorage.getItem('theme')` and `document.body.classList.add('dark-mode')`

### Access Control
Pages check user authentication on load:
```javascript
const token = localStorage.getItem('token');
const response = await fetch('/me', { headers: { 'Authorization': token } });
if (!response.ok) showAccessDenied();
```

## Key Business Logic

### Technology Research System
- Technologies loaded from `data/Технологии.md` (Markdown format with dependencies)
- Costs paid in `research_points` (stored in `countries` table)
- Progress tracked in `country_technologies` table
- See [routers/tech.py](routers/tech.py) for parsing logic

### Economic System
- Multi-currency support: `main_currency` + custom `country_currencies` entries
- Resources tracked separately in `country_resources`
- Tax settings per social layer in `country_tax_settings`
- See [routers/economic.py](routers/economic.py) for balance calculations

### Province & Buildings
- Provinces belong to countries (`country_id` FK)
- Buildings reference `building_types` and provide resource generation
- See [routers/provinces.py](routers/provinces.py)

## Development Workflow

### Running the Application
```powershell
# Backend (requires .env with Gmail OAuth credentials)
python main.py  # Runs on http://localhost:8000

# Frontend routes directly served by FastAPI (no separate server)
```

### Database Migrations
**Always check before adding columns:**
```python
cursor.execute("PRAGMA table_info(table_name)")
columns = [column[1] for column in cursor.fetchall()]
if 'new_column' not in columns:
    cursor.execute('ALTER TABLE table_name ADD COLUMN new_column TYPE')
```

### Password Security
- **New users:** Passwords hashed with bcrypt via `hash_password()`
- **Migration:** `migrate_plain_passwords()` in `main.py` converts legacy plain-text passwords

## Important Files

- [main.py](main.py) - App initialization, auth functions, email verification
- [routers/game_main.py](routers/game_main.py) - Turn management, game state
- [routers/economic.py](routers/economic.py) - Country creation, resource/currency management
- [js/game.js](js/game.js) - Main game UI controller
- [data/countries.json](data/countries.json) - Available nations list
- [data/rules.txt](data/rules.txt) - Game rules displayed to players

## Common Pitfalls

1. **Don't create `secret_coins` in users table** - They belong in `countries` table
2. **Router imports must use `sys.path.append('..')`** to import from `main.py`
3. **Always return `conn.close()` in finally blocks** to prevent DB locks
4. **JWT tokens expire after 7 days** - Set in `create_jwt()` function
5. **WebSocket chat in [routers/chat.py](routers/chat.py)** - Manages connection pool manually

## Coding Standards

- **Russian language** for all user-facing strings and error messages
- **No external frontend framework** - Pure vanilla JS/CSS
- **File uploads** limited to 100MB via `LimitUploadSizeMiddleware`
- **Static file serving** mounted per directory (`/js`, `/css`, `/data`, `/avatars`, `/maps_files`)
