from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

router = APIRouter(prefix="/converter", tags=["converter"])

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

# Курсы валют (относительно USD)
CURRENCY_RATES = {
    "USD": 1.0,
    "EUR": 0.92,
    "RUB": 91.5,
    "GBP": 0.79,
    "JPY": 149.5,
    "CNY": 7.24,
    "KZT": 450.0
}

# Курсы ресурсов (относительно золота)
RESOURCE_RATES = {
    "gold": 1,
    "silver": 10,
    "bronze": 20,
    "iron": 50,
    "wood": 100,
    "stone": 80,
    "crystal": 5
}


class CurrencyConversion(BaseModel):
    amount: float
    from_currency: str = None
    to: str = None

    class Config:
        fields = {'from_currency': {'alias': 'from'}}


class ResourceConversion(BaseModel):
    amount: int
    from_resource: str = None
    to: str = None

    class Config:
        fields = {'from_resource': {'alias': 'from'}}


@router.get('/currency-rates')
async def get_currency_rates():
    """Получить все курсы валют"""
    return JSONResponse({
        'success': True,
        'rates': CURRENCY_RATES
    })


@router.get('/resource-rates')
async def get_resource_rates():
    """Получить все курсы ресурсов"""
    return JSONResponse({
        'success': True,
        'rates': RESOURCE_RATES
    })


@router.post('/convert-currency')
async def convert_currency(request: Request):
    """Конвертировать валюту"""
    data = await request.json()
    
    amount = data.get('amount')
    from_currency = data.get('from')
    to_currency = data.get('to')
    
    if not all([amount, from_currency, to_currency]):
        return JSONResponse({
            'success': False,
            'error': 'Все поля обязательны'
        }, status_code=400)
    
    if from_currency not in CURRENCY_RATES or to_currency not in CURRENCY_RATES:
        return JSONResponse({
            'success': False,
            'error': 'Неизвестная валюта'
        }, status_code=400)
    
    # Конвертация через USD
    amount_in_usd = amount / CURRENCY_RATES[from_currency]
    result = amount_in_usd * CURRENCY_RATES[to_currency]
    
    # Курс между валютами
    rate = CURRENCY_RATES[to_currency] / CURRENCY_RATES[from_currency]
    
    return JSONResponse({
        'success': True,
        'result': round(result, 2),
        'rate': rate
    })


@router.post('/convert-resource')
async def convert_resource(request: Request):
    """Конвертировать ресурс"""
    data = await request.json()
    
    amount = data.get('amount')
    from_resource = data.get('from')
    to_resource = data.get('to')
    
    if not all([amount is not None, from_resource, to_resource]):
        return JSONResponse({
            'success': False,
            'error': 'Все поля обязательны'
        }, status_code=400)
    
    if from_resource not in RESOURCE_RATES or to_resource not in RESOURCE_RATES:
        return JSONResponse({
            'success': False,
            'error': 'Неизвестный ресурс'
        }, status_code=400)
    
    # Конвертация через золото
    amount_in_gold = amount / RESOURCE_RATES[from_resource]
    result = int(amount_in_gold * RESOURCE_RATES[to_resource])
    
    # Курс между ресурсами
    rate = RESOURCE_RATES[to_resource] / RESOURCE_RATES[from_resource]
    
    return JSONResponse({
        'success': True,
        'result': result,
        'rate': rate
    })


@router.get('/page')
async def converter_page():
    """Отдать HTML страницу конвертера"""
    return FileResponse('converter.html')