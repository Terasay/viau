from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/tech", tags=["technologies"])

# Данные по технологиям "Сухопутные войска" из Технологии.md
LAND_FORCES_TECH = {
    "category": "land_forces",
    "name": "Сухопутные войска",
    "lines": [
        {
            "id": "firearms",
            "name": "Огнестрельное оружие пехоты",
            "technologies": [
                # Базовый уровень (1500-1550)
                {"id": "arquebus", "name": "Аркебузы", "year": 1500, "tier": 0, "requires": []},
                {"id": "improved_arquebus", "name": "Улучшенные аркебузы", "year": 1520, "tier": 0, "requires": ["arquebus"]},
                {"id": "matchlock", "name": "Фитильные замки", "year": 1530, "tier": 0, "requires": ["improved_arquebus"]},
                {"id": "light_arquebus", "name": "Облегченные аркебузы", "year": 1540, "tier": 0, "requires": ["matchlock"]},
                
                # Ранняя эпоха (1550-1650)
                {"id": "early_muskets", "name": "Ранние мушкеты", "year": 1550, "tier": 1, "requires": ["matchlock"]},
                {"id": "musket_production_1", "name": "Мушкетное производство I", "year": 1560, "tier": 1, "requires": ["early_muskets"]},
                {"id": "extended_barrels", "name": "Удлиненные стволы", "year": 1570, "tier": 1, "requires": ["musket_production_1"]},
                {"id": "musket_production_2", "name": "Мушкетное производство II", "year": 1580, "tier": 1, "requires": ["extended_barrels"]},
                {"id": "wheellock", "name": "Колесцовый замок", "year": 1590, "tier": 1, "requires": ["musket_production_2"]},
                {"id": "light_muskets", "name": "Легкие мушкеты", "year": 1600, "tier": 1, "requires": ["wheellock"]},
                {"id": "ramrod_loading", "name": "Шомпольное заряжание", "year": 1610, "tier": 1, "requires": ["light_muskets"]},
                {"id": "caliber_std_1", "name": "Стандартизация калибров I", "year": 1620, "tier": 1, "requires": ["ramrod_loading"]},
                {"id": "grapeshot_charges", "name": "Картечные заряды", "year": 1630, "tier": 1, "requires": ["caliber_std_1"]},
                {"id": "paper_cartridges", "name": "Бумажные патроны", "year": 1640, "tier": 1, "requires": ["grapeshot_charges"]},
                
                # Кремневая эпоха (1650-1750)
                {"id": "early_flintlock", "name": "Ранний кремневый замок", "year": 1650, "tier": 2, "requires": ["paper_cartridges"]},
                {"id": "flintlock_musket_1", "name": "Кремневые мушкеты I", "year": 1660, "tier": 2, "requires": ["early_flintlock"]},
                {"id": "improved_flint_system", "name": "Улучшенная кремневая система", "year": 1670, "tier": 2, "requires": ["flintlock_musket_1"]},
                {"id": "flintlock_musket_2", "name": "Кремневые мушкеты II", "year": 1680, "tier": 2, "requires": ["improved_flint_system"]},
                {"id": "bayonet_knife", "name": "Штык-нож", "year": 1690, "tier": 2, "requires": ["flintlock_musket_2"]},
                {"id": "plug_bayonet", "name": "Багинетный штык", "year": 1700, "tier": 2, "requires": ["bayonet_knife"]},
                {"id": "socket_bayonet", "name": "Трубчатый штык", "year": 1710, "tier": 2, "requires": ["plug_bayonet"]},
                {"id": "durable_flints", "name": "Долговечные кремни", "year": 1720, "tier": 2, "requires": ["socket_bayonet"]},
                {"id": "improved_barrels", "name": "Улучшенные стволы", "year": 1730, "tier": 2, "requires": ["durable_flints"]},
                {"id": "production_std_2", "name": "Стандартизация производства II", "year": 1740, "tier": 2, "requires": ["improved_barrels"]},
                
                # Нарезная эпоха (1750-1820)
                {"id": "experimental_rifling", "name": "Экспериментальные нарезы", "year": 1750, "tier": 3, "requires": ["production_std_2"]},
                {"id": "rifles", "name": "Штуцеры", "year": 1760, "tier": 3, "requires": ["experimental_rifling"]},
                {"id": "jaeger_rifles", "name": "Нарезные винтовки егерей", "year": 1770, "tier": 3, "requires": ["rifles"]},
                {"id": "improved_accuracy", "name": "Улучшенная точность", "year": 1780, "tier": 3, "requires": ["jaeger_rifles"]},
                {"id": "rifle_production_1", "name": "Винтовочное производство I", "year": 1790, "tier": 3, "requires": ["improved_accuracy"]},
                {"id": "percussion_cap", "name": "Ударный капсюль", "year": 1800, "tier": 3, "requires": ["rifle_production_1"]},
                {"id": "caplock_rifles", "name": "Капсюльные винтовки", "year": 1810, "tier": 3, "requires": ["percussion_cap"]},
                {"id": "mass_rifle_production", "name": "Массовое производство винтовок", "year": 1820, "tier": 3, "requires": ["caplock_rifles"]},
                
                # Казнозарядная эпоха (1820-1870)
                {"id": "experimental_breechloader", "name": "Экспериментальное казнозарядное оружие", "year": 1820, "tier": 4, "requires": ["mass_rifle_production"]},
                {"id": "needle_gun", "name": "Игольчатая винтовка", "year": 1830, "tier": 4, "requires": ["experimental_breechloader"]},
                {"id": "unitary_cartridge", "name": "Унитарный патрон", "year": 1840, "tier": 4, "requires": ["needle_gun"]},
                {"id": "breechloader_1", "name": "Казнозарядные винтовки I", "year": 1850, "tier": 4, "requires": ["unitary_cartridge"]},
                {"id": "metallic_cartridge", "name": "Металлический патрон", "year": 1855, "tier": 4, "requires": ["breechloader_1"]},
                {"id": "breechloader_2", "name": "Казнозарядные винтовки II", "year": 1860, "tier": 4, "requires": ["metallic_cartridge"]},
                {"id": "centerfire", "name": "Центральный боёк", "year": 1865, "tier": 4, "requires": ["breechloader_2"]},
                {"id": "ammo_standardization", "name": "Стандартизация боеприпасов", "year": 1870, "tier": 4, "requires": ["centerfire"]},
                
                # Современная эпоха (1870-1900)
                {"id": "magazine_rifles_1", "name": "Магазинные винтовки I", "year": 1875, "tier": 5, "requires": ["ammo_standardization"]},
                {"id": "smokeless_powder", "name": "Бездымный порох", "year": 1880, "tier": 5, "requires": ["magazine_rifles_1"]},
                {"id": "magazine_rifles_2", "name": "Магазинные винтовки II", "year": 1885, "tier": 5, "requires": ["smokeless_powder"]},
                {"id": "smokeless_rifles", "name": "Винтовки под бездымный порох", "year": 1890, "tier": 5, "requires": ["magazine_rifles_2"]},
                {"id": "modern_small_arms", "name": "Современное стрелковое оружие", "year": 1895, "tier": 5, "requires": ["smokeless_rifles"]},
            ]
        },
        {
            "id": "artillery",
            "name": "Артиллерия",
            "technologies": [
                # Базовый уровень (1500-1550)
                {"id": "bronze_cannons", "name": "Бронзовые пушки", "year": 1500, "tier": 0, "requires": []},
                {"id": "improved_casting", "name": "Улучшенное литье", "year": 1510, "tier": 0, "requires": ["bronze_cannons"]},
                {"id": "standard_calibers", "name": "Стандартные калибры орудий", "year": 1520, "tier": 0, "requires": ["improved_casting"]},
                {"id": "light_field_guns", "name": "Легкие полевые пушки", "year": 1530, "tier": 0, "requires": ["standard_calibers"]},
                {"id": "improved_powder", "name": "Улучшенный порох", "year": 1540, "tier": 0, "requires": ["light_field_guns"]},
                
                # Развитие (1550-1700)
                {"id": "howitzers", "name": "Гаубицы", "year": 1550, "tier": 1, "requires": ["improved_powder"]},
                {"id": "mortars", "name": "Мортиры", "year": 1560, "tier": 1, "requires": ["howitzers"]},
                {"id": "field_artillery_1", "name": "Полевая артиллерия I", "year": 1570, "tier": 1, "requires": ["mortars"]},
                {"id": "iron_shot", "name": "Чугунные ядра", "year": 1580, "tier": 1, "requires": ["field_artillery_1"]},
                {"id": "canister_shot", "name": "Картечь", "year": 1590, "tier": 1, "requires": ["iron_shot"]},
                {"id": "light_guns", "name": "Легкие орудия", "year": 1600, "tier": 1, "requires": ["canister_shot"]},
                {"id": "improved_carriages", "name": "Улучшенные лафеты", "year": 1610, "tier": 1, "requires": ["light_guns"]},
                {"id": "field_artillery_2", "name": "Полевая артиллерия II", "year": 1620, "tier": 1, "requires": ["improved_carriages"]},
                {"id": "explosive_shells", "name": "Разрывные гранаты", "year": 1630, "tier": 1, "requires": ["field_artillery_2"]},
                {"id": "gun_standardization", "name": "Стандартизация орудий", "year": 1640, "tier": 1, "requires": ["explosive_shells"]},
                {"id": "limbers", "name": "Передки и зарядные ящики", "year": 1650, "tier": 1, "requires": ["gun_standardization"]},
                {"id": "horse_artillery", "name": "Конная артиллерия", "year": 1660, "tier": 1, "requires": ["limbers"]},
                {"id": "improved_fuses", "name": "Улучшенные запалы", "year": 1670, "tier": 1, "requires": ["horse_artillery"]},
                {"id": "precise_aiming", "name": "Точное прицеливание", "year": 1680, "tier": 1, "requires": ["improved_fuses"]},
                {"id": "artillery_school", "name": "Артиллерийская школа", "year": 1690, "tier": 1, "requires": ["precise_aiming"]},
                {"id": "field_artillery_3", "name": "Полевая артиллерия III", "year": 1700, "tier": 1, "requires": ["artillery_school"]},
            ]
        },
        {
            "id": "military_org",
            "name": "Военная организация",
            "technologies": [
                # Базовый уровень (1500-1550)
                {"id": "mercenary_armies", "name": "Наемные армии", "year": 1500, "tier": 0, "requires": []},
                {"id": "landsknechts", "name": "Ландскнехты", "year": 1510, "tier": 0, "requires": ["mercenary_armies"]},
                {"id": "military_discipline_1", "name": "Военная дисциплина I", "year": 1520, "tier": 0, "requires": ["landsknechts"]},
                {"id": "drill_training", "name": "Строевая подготовка", "year": 1530, "tier": 0, "requires": ["military_discipline_1"]},
                {"id": "military_regulations", "name": "Военные уставы", "year": 1540, "tier": 0, "requires": ["drill_training"]},
                
                # Развитие (1550-1700)
                {"id": "standing_army_1", "name": "Постоянная армия I", "year": 1550, "tier": 1, "requires": ["military_regulations"]},
                {"id": "national_regiments", "name": "Национальные полки", "year": 1560, "tier": 1, "requires": ["standing_army_1"]},
                {"id": "military_uniform", "name": "Военная униформа", "year": 1570, "tier": 1, "requires": ["national_regiments"]},
                {"id": "regimental_system", "name": "Полковая система", "year": 1580, "tier": 1, "requires": ["military_uniform"]},
                {"id": "standing_army_2", "name": "Постоянная армия II", "year": 1590, "tier": 1, "requires": ["regimental_system"]},
                {"id": "line_infantry_1", "name": "Линейная пехота I", "year": 1600, "tier": 1, "requires": ["standing_army_2"]},
                {"id": "military_discipline_2", "name": "Военная дисциплина II", "year": 1610, "tier": 1, "requires": ["line_infantry_1"]},
                {"id": "pike_and_shot", "name": "Пикинеры и мушкетеры", "year": 1620, "tier": 1, "requires": ["military_discipline_2"]},
                {"id": "line_infantry_2", "name": "Линейная пехота II", "year": 1630, "tier": 1, "requires": ["pike_and_shot"]},
                {"id": "volley_fire", "name": "Залповый огонь", "year": 1640, "tier": 1, "requires": ["line_infantry_2"]},
                {"id": "battalion_system", "name": "Батальонная система", "year": 1650, "tier": 1, "requires": ["volley_fire"]},
                {"id": "linear_tactics_1", "name": "Линейная тактика I", "year": 1660, "tier": 1, "requires": ["battalion_system"]},
                {"id": "bayonet_charge", "name": "Штыковая атака", "year": 1670, "tier": 1, "requires": ["linear_tactics_1"]},
                {"id": "grenadiers", "name": "Гренадеры", "year": 1680, "tier": 1, "requires": ["bayonet_charge"]},
                {"id": "linear_tactics_2", "name": "Линейная тактика II", "year": 1690, "tier": 1, "requires": ["grenadiers"]},
                {"id": "jaeger_units", "name": "Егерские части", "year": 1700, "tier": 1, "requires": ["linear_tactics_2"]},
            ]
        },
        {
            "id": "cavalry",
            "name": "Кавалерия",
            "technologies": [
                # Базовый уровень (1500-1550)
                {"id": "heavy_cavalry", "name": "Тяжелая кавалерия", "year": 1500, "tier": 0, "requires": []},
                {"id": "horse_equipment", "name": "Конское снаряжение", "year": 1510, "tier": 0, "requires": ["heavy_cavalry"]},
                {"id": "armored_cavalry", "name": "Латная кавалерия", "year": 1520, "tier": 0, "requires": ["horse_equipment"]},
                {"id": "cuirassiers", "name": "Кирасиры", "year": 1530, "tier": 0, "requires": ["armored_cavalry"]},
                {"id": "light_cavalry_1", "name": "Легкая кавалерия I", "year": 1540, "tier": 0, "requires": ["cuirassiers"]},
                
                # Развитие (1550-1700)
                {"id": "reiters", "name": "Рейтары", "year": 1550, "tier": 1, "requires": ["light_cavalry_1"]},
                {"id": "cavalry_pistols", "name": "Конные пистолеты", "year": 1560, "tier": 1, "requires": ["reiters"]},
                {"id": "dragoons_1", "name": "Драгуны I", "year": 1570, "tier": 1, "requires": ["cavalry_pistols"]},
                {"id": "carbines", "name": "Карабины", "year": 1580, "tier": 1, "requires": ["dragoons_1"]},
                {"id": "dragoons_2", "name": "Драгуны II", "year": 1590, "tier": 1, "requires": ["carbines"]},
                {"id": "cavalry_regiments", "name": "Кавалерийские полки", "year": 1600, "tier": 1, "requires": ["dragoons_2"]},
                {"id": "hussars", "name": "Гусары", "year": 1610, "tier": 1, "requires": ["cavalry_regiments"]},
                {"id": "light_cavalry_2", "name": "Легкая кавалерия II", "year": 1620, "tier": 1, "requires": ["hussars"]},
                {"id": "cavalry_charge", "name": "Кавалерийская атака", "year": 1630, "tier": 1, "requires": ["light_cavalry_2"]},
                {"id": "horse_grenadiers", "name": "Конно-гренадеры", "year": 1640, "tier": 1, "requires": ["cavalry_charge"]},
                {"id": "horse_breeding", "name": "Улучшенная селекция лошадей", "year": 1650, "tier": 1, "requires": ["horse_grenadiers"]},
                {"id": "uhlans", "name": "Уланы", "year": 1660, "tier": 1, "requires": ["horse_breeding"]},
                {"id": "cavalry_scouts", "name": "Кавалерийская разведка", "year": 1670, "tier": 1, "requires": ["uhlans"]},
                {"id": "dragoons_3", "name": "Драгуны III", "year": 1680, "tier": 1, "requires": ["cavalry_scouts"]},
                {"id": "horse_artillery_cav", "name": "Конная артиллерия", "year": 1690, "tier": 1, "requires": ["dragoons_3"]},
                {"id": "cuirassier_reform", "name": "Кирасирская реформа", "year": 1700, "tier": 1, "requires": ["horse_artillery_cav"]},
            ]
        }
    ]
}

@router.get("/categories")
async def get_tech_categories():
    """Получить список всех доступных категорий технологий"""
    return JSONResponse({
        "success": True,
        "categories": [
            {"id": "land_forces", "name": "Сухопутные войска"},
            {"id": "navy", "name": "Военно-морской флот"},
            {"id": "economy", "name": "Экономика"},
            {"id": "government", "name": "Государственное управление"}
        ]
    })

@router.get("/tree/{category}")
async def get_tech_tree(category: str):
    """Получить древо технологий для указанной категории"""
    if category == "land_forces":
        return JSONResponse({
            "success": True,
            "data": LAND_FORCES_TECH
        })
    else:
        return JSONResponse({
            "success": False,
            "error": "Категория в разработке"
        })

@router.get("/player/progress")
async def get_player_tech_progress():
    """Получить прогресс игрока по технологиям"""
    # TODO: Реализовать получение из БД
    return JSONResponse({
        "success": True,
        "researched": ["arquebus", "improved_arquebus", "matchlock"],  # Пример
        "researching": None,
        "research_progress": 0
    })
