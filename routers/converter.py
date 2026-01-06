from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
import json
import os

router = APIRouter(prefix='/api/converter', tags=['converter'])

DATA_FILE = 'data/converter_data.json'

os.makedirs('data', exist_ok=True)

if not os.path.exists(DATA_FILE):
    initial_data = {
        "currencies": {
            "USD": {"name": "Доллар США", "rate": 1.0},
            "EUR": {"name": "Евро", "rate": 0.92},
            "RUB": {"name": "Российский рубль", "rate": 91.5},
            "GBP": {"name": "Фунт стерлингов", "rate": 0.79},
            "JPY": {"name": "Японская иена", "rate": 149.5},
            "CNY": {"name": "Китайский юань", "rate": 7.24},
            "KZT": {"name": "Казахстанский тенге", "rate": 450.0}
        },
        "resources": {
            "gold": {"name": "Золото", "rate": 1},
            "silver": {"name": "Серебро", "rate": 10},
            "bronze": {"name": "Бронза", "rate": 20},
            "iron": {"name": "Железо", "rate": 50},
            "wood": {"name": "Дерево", "rate": 100},
            "stone": {"name": "Камень", "rate": 80},
            "crystal": {"name": "Кристаллы", "rate": 5}
        }
    }
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(initial_data, f, ensure_ascii=False, indent=2)


def load_data():
    """Загрузить данные из JSON файла"""
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_data(data):
    """Сохранить данные в JSON файл"""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def verify_admin(token):
    """Проверка прав администратора"""
    try:
        from main import decode_jwt, get_user_by_username
        
        payload = decode_jwt(token)
        if not payload:
            return False
        
        user = get_user_by_username(payload['username'])
        if not user or user[4] != 'admin':
            return False
        
        return True
    except Exception as e:
        print(f"Ошибка проверки прав: {e}")
        return False

@router.get('/data')
async def get_converter_data():
    """Получить все данные конвертера (публичный эндпоинт)"""
    data = load_data()
    return JSONResponse({
        'success': True,
        'data': data
    })


@router.get('/currency-rates')
async def get_currency_rates():
    """Получить все курсы валют"""
    data = load_data()
    rates = {code: info['rate'] for code, info in data['currencies'].items()}
    return JSONResponse({
        'success': True,
        'rates': rates
    })


@router.get('/resource-rates')
async def get_resource_rates():
    """Получить все курсы ресурсов"""
    data = load_data()
    rates = {code: info['rate'] for code, info in data['resources'].items()}
    return JSONResponse({
        'success': True,
        'rates': rates
    })


@router.post('/convert-currency')
async def convert_currency(request: Request):
    """Конвертировать валюту"""
    req_data = await request.json()
    
    amount = req_data.get('amount')
    from_currency = req_data.get('from')
    to_currency = req_data.get('to')
    
    if not all([amount, from_currency, to_currency]):
        return JSONResponse({
            'success': False,
            'error': 'Все поля обязательны'
        }, status_code=400)
    
    data = load_data()
    currencies = data['currencies']
    
    if from_currency not in currencies or to_currency not in currencies:
        return JSONResponse({
            'success': False,
            'error': 'Неизвестная валюта'
        }, status_code=400)
    
    amount_in_usd = amount / currencies[from_currency]['rate']
    result = amount_in_usd * currencies[to_currency]['rate']
    
    rate = currencies[to_currency]['rate'] / currencies[from_currency]['rate']
    
    return JSONResponse({
        'success': True,
        'result': round(result, 2),
        'rate': rate
    })


@router.post('/convert-resource')
async def convert_resource(request: Request):
    """Конвертировать ресурс"""
    req_data = await request.json()
    
    amount = req_data.get('amount')
    from_resource = req_data.get('from')
    to_resource = req_data.get('to')
    
    if not all([amount is not None, from_resource, to_resource]):
        return JSONResponse({
            'success': False,
            'error': 'Все поля обязательны'
        }, status_code=400)
    
    data = load_data()
    resources = data['resources']
    
    if from_resource not in resources or to_resource not in resources:
        return JSONResponse({
            'success': False,
            'error': 'Неизвестный ресурс'
        }, status_code=400)
    
    amount_in_gold = amount / resources[from_resource]['rate']
    result = round(amount_in_gold * resources[to_resource]['rate'], 2)
    
    rate = resources[to_resource]['rate'] / resources[from_resource]['rate']
    
    return JSONResponse({
        'success': True,
        'result': result,
        'rate': rate
    })

@router.post('/convert-mixed')
async def convert_mixed(request: Request):
    """Конвертация между валютой и ресурсами"""
    req_data = await request.json()
    
    amount = req_data.get('amount')
    from_item = req_data.get('from')
    to_item = req_data.get('to')
    from_type = req_data.get('from_type')  # 'currency' или 'resource'
    to_type = req_data.get('to_type')  # 'currency' или 'resource'
    
    if not all([amount is not None, from_item, to_item, from_type, to_type]):
        return JSONResponse({
            'success': False,
            'error': 'Все поля обязательны'
        }, status_code=400)
    
    data = load_data()
    currencies = data['currencies']
    resources = data['resources']
    
    # Проверяем существование элементов
    if from_type == 'currency' and from_item not in currencies:
        return JSONResponse({
            'success': False,
            'error': 'Неизвестная валюта'
        }, status_code=400)
    
    if from_type == 'resource' and from_item not in resources:
        return JSONResponse({
            'success': False,
            'error': 'Неизвестный ресурс'
        }, status_code=400)
    
    if to_type == 'currency' and to_item not in currencies:
        return JSONResponse({
            'success': False,
            'error': 'Неизвестная валюта'
        }, status_code=400)
    
    if to_type == 'resource' and to_item not in resources:
        return JSONResponse({
            'success': False,
            'error': 'Неизвестный ресурс'
        }, status_code=400)
    
    # Конвертация в золото (базовая единица)
    if from_type == 'currency':
        amount_in_gold = amount / currencies[from_item]['rate']
    else:
        amount_in_gold = amount / resources[from_item]['rate']
    
    # Конвертация из золота в целевую единицу
    if to_type == 'currency':
        result = round(amount_in_gold * currencies[to_item]['rate'], 2)
        rate_value = currencies[to_item]['rate']
        if from_type == 'currency':
            rate_value = currencies[to_item]['rate'] / currencies[from_item]['rate']
        else:
            rate_value = currencies[to_item]['rate'] / resources[from_item]['rate']
        rate = round(rate_value, 2)
    else:
        result = round(amount_in_gold * resources[to_item]['rate'], 2)
        rate_value = resources[to_item]['rate']
        if from_type == 'currency':
            rate_value = resources[to_item]['rate'] / currencies[from_item]['rate']
        else:
            rate_value = resources[to_item]['rate'] / resources[from_item]['rate']
        rate = round(rate_value, 2)
    
    return JSONResponse({
        'success': True,
        'result': result,
        'rate': rate
    })

@router.get('/admin/all-data')
async def get_all_converter_data(request: Request):
    """Получить все данные для админ-панели"""
    token = request.headers.get('Authorization')
    if not verify_admin(token):
        return JSONResponse({'error': 'Unauthorized'}, status_code=403)
    
    data = load_data()
    return JSONResponse({
        'success': True,
        'data': data
    })


@router.post('/admin/currency/add')
async def add_currency(request: Request):
    """Добавить новую валюту"""
    token = request.headers.get('Authorization')
    if not verify_admin(token):
        return JSONResponse({'error': 'Unauthorized'}, status_code=403)
    
    req_data = await request.json()
    code = req_data.get('code', '').upper()
    name = req_data.get('name', '')
    rate = req_data.get('rate')
    
    if not code or not name or rate is None:
        return JSONResponse({
            'success': False,
            'error': 'Все поля обязательны'
        }, status_code=400)
    
    if len(code) != 3:
        return JSONResponse({
            'success': False,
            'error': 'Код валюты должен состоять из 3 букв'
        }, status_code=400)
    
    try:
        rate = float(rate)
        if rate <= 0:
            raise ValueError()
    except:
        return JSONResponse({
            'success': False,
            'error': 'Курс должен быть положительным числом'
        }, status_code=400)
    
    data = load_data()
    
    if code in data['currencies']:
        return JSONResponse({
            'success': False,
            'error': 'Валюта с таким кодом уже существует'
        }, status_code=400)
    
    data['currencies'][code] = {
        'name': name,
        'rate': rate
    }
    
    save_data(data)
    
    return JSONResponse({
        'success': True,
        'message': 'Валюта добавлена'
    })


@router.post('/admin/currency/update')
async def update_currency(request: Request):
    """Обновить валюту"""
    token = request.headers.get('Authorization')
    if not verify_admin(token):
        return JSONResponse({'error': 'Unauthorized'}, status_code=403)
    
    req_data = await request.json()
    code = req_data.get('code', '').upper()
    name = req_data.get('name')
    rate = req_data.get('rate')
    
    if not code:
        return JSONResponse({
            'success': False,
            'error': 'Код валюты обязателен'
        }, status_code=400)
    
    data = load_data()
    
    if code not in data['currencies']:
        return JSONResponse({
            'success': False,
            'error': 'Валюта не найдена'
        }, status_code=404)
    
    if name:
        data['currencies'][code]['name'] = name
    
    if rate is not None:
        try:
            rate = float(rate)
            if rate <= 0:
                raise ValueError()
            data['currencies'][code]['rate'] = rate
        except:
            return JSONResponse({
                'success': False,
                'error': 'Курс должен быть положительным числом'
            }, status_code=400)
    
    save_data(data)
    
    return JSONResponse({
        'success': True,
        'message': 'Валюта обновлена'
    })


@router.post('/admin/currency/delete')
async def delete_currency(request: Request):
    """Удалить валюту"""
    token = request.headers.get('Authorization')
    if not verify_admin(token):
        return JSONResponse({'error': 'Unauthorized'}, status_code=403)
    
    req_data = await request.json()
    code = req_data.get('code', '').upper()
    
    if not code:
        return JSONResponse({
            'success': False,
            'error': 'Код валюты обязателен'
        }, status_code=400)
    
    data = load_data()
    
    if code not in data['currencies']:
        return JSONResponse({
            'success': False,
            'error': 'Валюта не найдена'
        }, status_code=404)
    
    if code == 'USD':
        return JSONResponse({
            'success': False,
            'error': 'Нельзя удалить базовую валюту USD'
        }, status_code=400)
    
    del data['currencies'][code]
    save_data(data)
    
    return JSONResponse({
        'success': True,
        'message': 'Валюта удалена'
    })


@router.post('/admin/resource/add')
async def add_resource(request: Request):
    """Добавить новый ресурс"""
    token = request.headers.get('Authorization')
    if not verify_admin(token):
        return JSONResponse({'error': 'Unauthorized'}, status_code=403)
    
    req_data = await request.json()
    code = req_data.get('code', '').lower()
    name = req_data.get('name', '')
    rate = req_data.get('rate')
    
    if not code or not name or rate is None:
        return JSONResponse({
            'success': False,
            'error': 'Все поля обязательны'
        }, status_code=400)
    
    try:
        rate = int(rate)
        if rate <= 0:
            raise ValueError()
    except:
        return JSONResponse({
            'success': False,
            'error': 'Курс должен быть положительным целым числом'
        }, status_code=400)
    
    data = load_data()
    
    if code in data['resources']:
        return JSONResponse({
            'success': False,
            'error': 'Ресурс с таким кодом уже существует'
        }, status_code=400)
    
    data['resources'][code] = {
        'name': name,
        'rate': rate
    }
    
    save_data(data)
    
    return JSONResponse({
        'success': True,
        'message': 'Ресурс добавлен'
    })


@router.post('/admin/resource/update')
async def update_resource(request: Request):
    """Обновить ресурс"""
    token = request.headers.get('Authorization')
    if not verify_admin(token):
        return JSONResponse({'error': 'Unauthorized'}, status_code=403)
    
    req_data = await request.json()
    code = req_data.get('code', '').lower()
    name = req_data.get('name')
    rate = req_data.get('rate')
    
    if not code:
        return JSONResponse({
            'success': False,
            'error': 'Код ресурса обязателен'
        }, status_code=400)
    
    data = load_data()
    
    if code not in data['resources']:
        return JSONResponse({
            'success': False,
            'error': 'Ресурс не найден'
        }, status_code=404)
    
    if name:
        data['resources'][code]['name'] = name
    
    if rate is not None:
        try:
            rate = int(rate)
            if rate <= 0:
                raise ValueError()
            data['resources'][code]['rate'] = rate
        except:
            return JSONResponse({
                'success': False,
                'error': 'Курс должен быть положительным целым числом'
            }, status_code=400)
    
    save_data(data)
    
    return JSONResponse({
        'success': True,
        'message': 'Ресурс обновлен'
    })


@router.post('/admin/resource/delete')
async def delete_resource(request: Request):
    """Удалить ресурс"""
    token = request.headers.get('Authorization')
    if not verify_admin(token):
        return JSONResponse({'error': 'Unauthorized'}, status_code=403)
    
    req_data = await request.json()
    code = req_data.get('code', '').lower()
    
    if not code:
        return JSONResponse({
            'success': False,
            'error': 'Код ресурса обязателен'
        }, status_code=400)
    
    data = load_data()
    
    if code not in data['resources']:
        return JSONResponse({
            'success': False,
            'error': 'Ресурс не найден'
        }, status_code=404)
    
    if code == 'gold':
        return JSONResponse({
            'success': False,
            'error': 'Нельзя удалить базовый ресурс gold'
        }, status_code=400)
    
    del data['resources'][code]
    save_data(data)
    
    return JSONResponse({
        'success': True,
        'message': 'Ресурс удален'
    })