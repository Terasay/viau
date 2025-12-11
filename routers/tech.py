from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/tech", tags=["technologies"])

# Данные по технологиям из Технологии.md

# СУХОПУТНЫЕ ВОЙСКА
LAND_FORCES_TECH = {
    "id": "land_forces",
    "name": "Сухопутные войска",
    "lines": [
        {
            "id": "firearms",
            "name": "Огнестрельное оружие пехоты",
            "technologies": [
                # Базовый уровень (1500-1550)
                {"id": "arquebus", "name": "Аркебузы", "year": 1500, "requires": []},
                {"id": "improved_arquebus", "name": "Улучшенные аркебузы", "year": 1520, "requires": ["arquebus"]},
                {"id": "matchlock", "name": "Фитильные замки", "year": 1530, "requires": ["improved_arquebus"]},
                {"id": "light_arquebus", "name": "Облегченные аркебузы", "year": 1540, "requires": ["matchlock"]},
                
                # Ранняя эпоха (1550-1650)
                {"id": "early_muskets", "name": "Ранние мушкеты", "year": 1550, "requires": ["light_arquebus"]},
                {"id": "musket_production_1", "name": "Мушкетное производство I", "year": 1560, "requires": ["early_muskets"]},
                {"id": "extended_barrels", "name": "Удлиненные стволы", "year": 1570, "requires": ["musket_production_1"]},
                {"id": "musket_production_2", "name": "Мушкетное производство II", "year": 1580, "requires": ["extended_barrels"]},
                {"id": "wheellock", "name": "Колесцовый замок", "year": 1590, "requires": ["musket_production_2"]},
                {"id": "light_muskets", "name": "Легкие мушкеты", "year": 1600, "requires": ["wheellock"]},
                {"id": "ramrod_loading", "name": "Шомпольное заряжание", "year": 1610, "requires": ["light_muskets"]},
                {"id": "caliber_std_1", "name": "Стандартизация калибров I", "year": 1620, "requires": ["ramrod_loading"]},
                {"id": "grapeshot_charges", "name": "Картечные заряды", "year": 1630, "requires": ["caliber_std_1"]},
                {"id": "paper_cartridges", "name": "Бумажные патроны", "year": 1640, "requires": ["grapeshot_charges"]},
                
                # Кремневая эпоха (1650-1750)
                {"id": "early_flintlock", "name": "Ранний кремневый замок", "year": 1650, "requires": ["paper_cartridges"]},
                {"id": "flintlock_musket_1", "name": "Кремневые мушкеты I", "year": 1660, "requires": ["early_flintlock"]},
                {"id": "improved_flint_system", "name": "Улучшенная кремневая система", "year": 1670, "requires": ["flintlock_musket_1"]},
                {"id": "flintlock_musket_2", "name": "Кремневые мушкеты II", "year": 1680, "requires": ["improved_flint_system"]},
                {"id": "bayonet_knife", "name": "Штык-нож", "year": 1690, "requires": ["flintlock_musket_2"]},
                {"id": "plug_bayonet", "name": "Багинетный штык", "year": 1700, "requires": ["bayonet_knife"]},
                {"id": "socket_bayonet", "name": "Трубчатый штык", "year": 1710, "requires": ["plug_bayonet"]},
                {"id": "durable_flints", "name": "Долговечные кремни", "year": 1720, "requires": ["socket_bayonet"]},
                {"id": "improved_barrels", "name": "Улучшенные стволы", "year": 1730, "requires": ["durable_flints"]},
                {"id": "production_std_2", "name": "Стандартизация производства II", "year": 1740, "requires": ["improved_barrels"]},
                
                # Нарезная эпоха (1750-1820)
                {"id": "experimental_rifling", "name": "Экспериментальные нарезы", "year": 1750, "requires": ["production_std_2"]},
                {"id": "rifles", "name": "Штуцеры", "year": 1760, "requires": ["experimental_rifling"]},
                {"id": "jaeger_rifles", "name": "Нарезные винтовки егерей", "year": 1770, "requires": ["rifles"]},
                {"id": "improved_accuracy", "name": "Улучшенная точность", "year": 1780, "requires": ["jaeger_rifles"]},
                {"id": "rifle_production_1", "name": "Винтовочное производство I", "year": 1790, "requires": ["improved_accuracy"]},
                {"id": "percussion_cap", "name": "Ударный капсюль", "year": 1800, "requires": ["rifle_production_1"]},
                {"id": "caplock_rifles", "name": "Капсюльные винтовки", "year": 1810, "requires": ["percussion_cap"]},
                {"id": "mass_rifle_production", "name": "Массовое производство винтовок", "year": 1820, "requires": ["caplock_rifles"]},
                
                # Казнозарядная эпоха (1820-1870)
                {"id": "experimental_breechloader", "name": "Экспериментальное казнозарядное оружие", "year": 1820, "requires": ["mass_rifle_production"]},
                {"id": "needle_gun", "name": "Игольчатая винтовка", "year": 1830, "requires": ["experimental_breechloader"]},
                {"id": "unitary_cartridge", "name": "Унитарный патрон", "year": 1840, "requires": ["needle_gun"]},
                {"id": "breechloader_1", "name": "Казнозарядные винтовки I", "year": 1850, "requires": ["unitary_cartridge"]},
                {"id": "metallic_cartridge", "name": "Металлический патрон", "year": 1855, "requires": ["breechloader_1"]},
                {"id": "breechloader_2", "name": "Казнозарядные винтовки II", "year": 1860, "requires": ["metallic_cartridge"]},
                {"id": "centerfire", "name": "Центральный боёк", "year": 1865, "requires": ["breechloader_2"]},
                {"id": "ammo_standardization", "name": "Стандартизация боеприпасов", "year": 1870, "requires": ["centerfire"]},
                
                # Современная эпоха (1870-1900)
                {"id": "magazine_rifles_1", "name": "Магазинные винтовки I", "year": 1875, "requires": ["ammo_standardization"]},
                {"id": "smokeless_powder", "name": "Бездымный порох", "year": 1880, "requires": ["magazine_rifles_1"]},
                {"id": "magazine_rifles_2", "name": "Магазинные винтовки II", "year": 1885, "requires": ["smokeless_powder"]},
                {"id": "smokeless_rifles", "name": "Винтовки под бездымный порох", "year": 1890, "requires": ["magazine_rifles_2"]},
                {"id": "modern_small_arms", "name": "Современное стрелковое оружие", "year": 1895, "requires": ["smokeless_rifles"]},
            ]
        },
        {
            "id": "artillery",
            "name": "Артиллерия",
            "technologies": [
                # Базовый уровень (1500-1550)
                {"id": "bronze_cannons", "name": "Бронзовые пушки", "year": 1500, "requires": []},
                {"id": "improved_casting", "name": "Улучшенное литье", "year": 1510, "requires": ["bronze_cannons"]},
                {"id": "standard_calibers", "name": "Стандартные калибры орудий", "year": 1520, "requires": ["improved_casting"]},
                {"id": "light_field_guns", "name": "Легкие полевые пушки", "year": 1530, "requires": ["standard_calibers"]},
                {"id": "improved_powder", "name": "Улучшенный порох", "year": 1540, "requires": ["light_field_guns"]},
                
                # Развитие (1550-1700)
                {"id": "howitzers", "name": "Гаубицы", "year": 1550, "requires": ["improved_powder"]},
                {"id": "mortars", "name": "Мортиры", "year": 1560, "requires": ["howitzers"]},
                {"id": "field_artillery_1", "name": "Полевая артиллерия I", "year": 1570, "requires": ["mortars"]},
                {"id": "iron_shot", "name": "Чугунные ядра", "year": 1580, "requires": ["field_artillery_1"]},
                {"id": "canister_shot", "name": "Картечь", "year": 1590, "requires": ["iron_shot"]},
                {"id": "light_guns", "name": "Легкие орудия", "year": 1600, "requires": ["canister_shot"]},
                {"id": "improved_carriages", "name": "Улучшенные лафеты", "year": 1610, "requires": ["light_guns"]},
                {"id": "field_artillery_2", "name": "Полевая артиллерия II", "year": 1620, "requires": ["improved_carriages"]},
                {"id": "explosive_shells", "name": "Разрывные гранаты", "year": 1630, "requires": ["field_artillery_2"]},
                {"id": "gun_standardization", "name": "Стандартизация орудий", "year": 1640, "requires": ["explosive_shells"]},
                {"id": "limbers", "name": "Передки и зарядные ящики", "year": 1650, "requires": ["gun_standardization"]},
                {"id": "horse_artillery", "name": "Конная артиллерия", "year": 1660, "requires": ["limbers"]},
                {"id": "improved_fuses", "name": "Улучшенные запалы", "year": 1670, "requires": ["horse_artillery"]},
                {"id": "precise_aiming", "name": "Точное прицеливание", "year": 1680, "requires": ["improved_fuses"]},
                {"id": "artillery_school", "name": "Артиллерийская школа", "year": 1690, "requires": ["precise_aiming"]},
                {"id": "field_artillery_3", "name": "Полевая артиллерия III", "year": 1700, "requires": ["artillery_school"]},
                
                # Промышленная эпоха (1700-1850)
                {"id": "steel_barrels", "name": "Стальные стволы", "year": 1710, "requires": ["field_artillery_3"]},
                {"id": "improved_range", "name": "Улучшенная дальность", "year": 1720, "requires": ["steel_barrels"]},
                {"id": "unicorns", "name": "Единороги", "year": 1730, "requires": ["improved_range"]},
                {"id": "grenade_launchers", "name": "Гранатометы", "year": 1740, "requires": ["unicorns"]},
                {"id": "canister_shells", "name": "Картечные снаряды", "year": 1750, "requires": ["grenade_launchers"]},
                {"id": "mountain_artillery", "name": "Горная артиллерия", "year": 1760, "requires": ["canister_shells"]},
                {"id": "siege_artillery", "name": "Осадная артиллерия", "year": 1770, "requires": ["mountain_artillery"]},
                {"id": "artillery_tables", "name": "Артиллерийские таблицы", "year": 1780, "requires": ["siege_artillery"]},
                {"id": "rockets", "name": "Ракеты", "year": 1790, "requires": ["artillery_tables"]},
                {"id": "shrapnel", "name": "Шрапнель", "year": 1800, "requires": ["rockets"]},
                {"id": "improved_howitzers", "name": "Улучшенные гаубицы", "year": 1810, "requires": ["shrapnel"]},
                {"id": "rifled_artillery_1", "name": "Нарезная артиллерия I", "year": 1820, "requires": ["improved_howitzers"]},
                {"id": "breech_loading_guns", "name": "Казнозарядные орудия", "year": 1830, "requires": ["rifled_artillery_1"]},
                {"id": "rifled_artillery_2", "name": "Нарезная артиллерия II", "year": 1840, "requires": ["breech_loading_guns"]},
                {"id": "steel_carriages", "name": "Стальные лафеты", "year": 1850, "requires": ["rifled_artillery_2"]},
                
                # Современная артиллерия (1850-1900)
                {"id": "rapid_fire_guns_1", "name": "Скорострельные орудия I", "year": 1855, "requires": ["steel_carriages"]},
                {"id": "smokeless_powder_artillery", "name": "Бездымный порох для артиллерии", "year": 1860, "requires": ["rapid_fire_guns_1"]},
                {"id": "high_explosive_shells", "name": "Фугасные снаряды", "year": 1865, "requires": ["smokeless_powder_artillery"]},
                {"id": "rapid_fire_guns_2", "name": "Скорострельные орудия II", "year": 1870, "requires": ["high_explosive_shells"]},
                {"id": "hydraulic_recoil", "name": "Гидравлические тормоза отката", "year": 1875, "requires": ["rapid_fire_guns_2"]},
                {"id": "heavy_artillery", "name": "Тяжелая артиллерия", "year": 1880, "requires": ["hydraulic_recoil"]},
                {"id": "long_range_artillery", "name": "Дальнобойная артиллерия", "year": 1885, "requires": ["heavy_artillery"]},
                {"id": "modern_sights", "name": "Современные прицелы", "year": 1890, "requires": ["long_range_artillery"]},
                {"id": "quick_firing_artillery", "name": "Скорострельная артиллерия", "year": 1895, "requires": ["modern_sights"]},
            ]
        },
        {
            "id": "military_org",
            "name": "Военная организация",
            "technologies": [
                # Базовый уровень (1500-1550)
                {"id": "mercenary_armies", "name": "Наемные армии", "year": 1500, "requires": []},
                {"id": "landsknechts", "name": "Ландскнехты", "year": 1510, "requires": ["mercenary_armies"]},
                {"id": "military_discipline_1", "name": "Военная дисциплина I", "year": 1520, "requires": ["landsknechts"]},
                {"id": "drill_training", "name": "Строевая подготовка", "year": 1530, "requires": ["military_discipline_1"]},
                {"id": "military_regulations", "name": "Военные уставы", "year": 1540, "requires": ["drill_training"]},
                
                # Развитие (1550-1700)
                {"id": "standing_army_1", "name": "Постоянная армия I", "year": 1550, "requires": ["military_regulations"]},
                {"id": "national_regiments", "name": "Национальные полки", "year": 1560, "requires": ["standing_army_1"]},
                {"id": "military_uniform", "name": "Военная униформа", "year": 1570, "requires": ["national_regiments"]},
                {"id": "regimental_system", "name": "Полковая система", "year": 1580, "requires": ["military_uniform"]},
                {"id": "standing_army_2", "name": "Постоянная армия II", "year": 1590, "requires": ["regimental_system"]},
                {"id": "line_infantry_1", "name": "Линейная пехота I", "year": 1600, "requires": ["standing_army_2"]},
                {"id": "military_discipline_2", "name": "Военная дисциплина II", "year": 1610, "requires": ["line_infantry_1"]},
                {"id": "pike_and_shot", "name": "Пикинеры и мушкетеры", "year": 1620, "requires": ["military_discipline_2"]},
                {"id": "line_infantry_2", "name": "Линейная пехота II", "year": 1630, "requires": ["pike_and_shot"]},
                {"id": "volley_fire", "name": "Залповый огонь", "year": 1640, "requires": ["line_infantry_2"]},
                {"id": "battalion_system", "name": "Батальонная система", "year": 1650, "requires": ["volley_fire"]},
                {"id": "linear_tactics_1", "name": "Линейная тактика I", "year": 1660, "requires": ["battalion_system"]},
                {"id": "bayonet_charge", "name": "Штыковая атака", "year": 1670, "requires": ["linear_tactics_1"]},
                {"id": "grenadiers", "name": "Гренадеры", "year": 1680, "requires": ["bayonet_charge"]},
                {"id": "linear_tactics_2", "name": "Линейная тактика II", "year": 1690, "requires": ["grenadiers"]},
                {"id": "jaeger_units", "name": "Егерские части", "year": 1700, "requires": ["linear_tactics_2"]},
            ]
        },
        {
            "id": "cavalry",
            "name": "Кавалерия",
            "technologies": [
                # Базовый уровень (1500-1550)
                {"id": "heavy_cavalry", "name": "Тяжелая кавалерия", "year": 1500, "requires": []},
                {"id": "horse_equipment", "name": "Конское снаряжение", "year": 1510, "requires": ["heavy_cavalry"]},
                {"id": "armored_cavalry", "name": "Латная кавалерия", "year": 1520, "requires": ["horse_equipment"]},
                {"id": "cuirassiers", "name": "Кирасиры", "year": 1530, "requires": ["armored_cavalry"]},
                {"id": "light_cavalry_1", "name": "Легкая кавалерия I", "year": 1540, "requires": ["cuirassiers"]},
                
                # Развитие (1550-1700)
                {"id": "reiters", "name": "Рейтары", "year": 1550, "requires": ["light_cavalry_1"]},
                {"id": "cavalry_pistols", "name": "Конные пистолеты", "year": 1560, "requires": ["reiters"]},
                {"id": "dragoons_1", "name": "Драгуны I", "year": 1570, "requires": ["cavalry_pistols"]},
                {"id": "carbines", "name": "Карабины", "year": 1580, "requires": ["dragoons_1"]},
                {"id": "dragoons_2", "name": "Драгуны II", "year": 1590, "requires": ["carbines"]},
                {"id": "cavalry_regiments", "name": "Кавалерийские полки", "year": 1600, "requires": ["dragoons_2"]},
                {"id": "hussars", "name": "Гусары", "year": 1610, "requires": ["cavalry_regiments"]},
                {"id": "light_cavalry_2", "name": "Легкая кавалерия II", "year": 1620, "requires": ["hussars"]},
                {"id": "cavalry_charge", "name": "Кавалерийская атака", "year": 1630, "requires": ["light_cavalry_2"]},
                {"id": "horse_grenadiers", "name": "Конно-гренадеры", "year": 1640, "requires": ["cavalry_charge"]},
                {"id": "horse_breeding", "name": "Улучшенная селекция лошадей", "year": 1650, "requires": ["horse_grenadiers"]},
                {"id": "uhlans", "name": "Уланы", "year": 1660, "requires": ["horse_breeding"]},
                {"id": "cavalry_scouts", "name": "Кавалерийская разведка", "year": 1670, "requires": ["uhlans"]},
                {"id": "dragoons_3", "name": "Драгуны III", "year": 1680, "requires": ["cavalry_scouts"]},
                {"id": "horse_artillery_cav", "name": "Конная артиллерия", "year": 1690, "requires": ["dragoons_3"]},
                {"id": "cuirassier_reform", "name": "Кирасирская реформа", "year": 1700, "requires": ["horse_artillery_cav"]},
            ]
        }
    ]
}

# ВОЕННО-МОРСКОЙ ФЛОТ
NAVY_TECH = {
    "id": "navy",
    "name": "Военно-морской флот",
    "lines": [
        {
            "id": "warships",
            "name": "Военные корабли",
            "technologies": [
                # Базовый уровень (1500-1550)
                {"id": "caravels", "name": "Каравеллы", "year": 1500, "requires": []},
                {"id": "improved_caravels", "name": "Улучшенные каравеллы", "year": 1510, "requires": ["caravels"]},
                {"id": "carracks", "name": "Каракки", "year": 1520, "requires": ["improved_caravels"]},
                {"id": "galleons_1", "name": "Галеоны I", "year": 1530, "requires": ["carracks"]},
                {"id": "improved_rigging", "name": "Улучшенное такелажное оснащение", "year": 1540, "requires": ["galleons_1"]},
                {"id": "galleons_2", "name": "Галеоны II", "year": 1550, "requires": ["improved_rigging"]},
                
                # Эпоха галеонов (1550-1650)
                {"id": "war_galleons", "name": "Военные галеоны", "year": 1560, "requires": ["galleons_2"]},
                {"id": "multi_deck_ships", "name": "Многопалубные корабли", "year": 1570, "requires": ["war_galleons"]},
                {"id": "heavy_galleons", "name": "Тяжелые галеоны", "year": 1580, "requires": ["multi_deck_ships"]},
                {"id": "improved_stability", "name": "Улучшенная остойчивость", "year": 1590, "requires": ["heavy_galleons"]},
                {"id": "ships_of_line_1", "name": "Линейные корабли I", "year": 1600, "requires": ["improved_stability"]},
                {"id": "three_deck_ships", "name": "Трехпалубные корабли", "year": 1610, "requires": ["ships_of_line_1"]},
                {"id": "ships_of_line_2", "name": "Линейные корабли II", "year": 1620, "requires": ["three_deck_ships"]},
                {"id": "improved_hull", "name": "Улучшенная конструкция корпуса", "year": 1630, "requires": ["ships_of_line_2"]},
                {"id": "ships_of_line_3", "name": "Линейные корабли III", "year": 1640, "requires": ["improved_hull"]},
                {"id": "heavy_ships_of_line", "name": "Тяжелые линкоры", "year": 1650, "requires": ["ships_of_line_3"]},
                
                # Классическая эпоха (1650-1750)
                {"id": "frigates_1", "name": "Фрегаты I", "year": 1660, "requires": ["heavy_ships_of_line"]},
                {"id": "corvettes", "name": "Корветы", "year": 1670, "requires": ["frigates_1"]},
                {"id": "frigates_2", "name": "Фрегаты II", "year": 1680, "requires": ["corvettes"]},
                {"id": "sloops", "name": "Шлюпы", "year": 1690, "requires": ["frigates_2"]},
                {"id": "brigs", "name": "Бриги", "year": 1700, "requires": ["sloops"]},
                {"id": "ships_of_line_4", "name": "Линейные корабли IV", "year": 1710, "requires": ["brigs"]},
                {"id": "frigates_3", "name": "Фрегаты III", "year": 1720, "requires": ["ships_of_line_4"]},
                {"id": "heavy_frigates", "name": "Тяжелые фрегаты", "year": 1730, "requires": ["frigates_3"]},
                {"id": "ships_of_line_5", "name": "Линейные корабли V", "year": 1740, "requires": ["heavy_frigates"]},
                {"id": "improved_frigates", "name": "Улучшенные фрегаты", "year": 1750, "requires": ["ships_of_line_5"]},
                
                # Переходная эпоха (1750-1830)
                {"id": "copper_plating", "name": "Медная обшивка днища", "year": 1760, "requires": ["improved_frigates"]},
                {"id": "fast_frigates", "name": "Быстроходные фрегаты", "year": 1770, "requires": ["copper_plating"]},
                {"id": "ships_of_line_6", "name": "Линейные корабли VI", "year": 1780, "requires": ["fast_frigates"]},
                {"id": "scout_ships", "name": "Разведывательные суда", "year": 1790, "requires": ["ships_of_line_6"]},
                {"id": "experimental_steamships", "name": "Экспериментальные паровые суда", "year": 1800, "requires": ["scout_ships"]},
                {"id": "paddle_steamers", "name": "Паровые колесные суда", "year": 1810, "requires": ["experimental_steamships"]},
                {"id": "steam_frigates_1", "name": "Паровые фрегаты I", "year": 1820, "requires": ["paddle_steamers"]},
                {"id": "screw_ships", "name": "Винтовые корабли", "year": 1830, "requires": ["steam_frigates_1"]},
                
                # Паровая эпоха (1830-1870)
                {"id": "steam_frigates_2", "name": "Паровые фрегаты II", "year": 1840, "requires": ["screw_ships"]},
                {"id": "steam_ships_of_line_1", "name": "Паровые линкоры I", "year": 1845, "requires": ["steam_frigates_2"]},
                {"id": "ironclads_1", "name": "Броненосцы I", "year": 1850, "requires": ["steam_ships_of_line_1"]},
                {"id": "iron_plating", "name": "Железная обшивка", "year": 1855, "requires": ["ironclads_1"]},
                {"id": "ironclads_2", "name": "Броненосцы II", "year": 1860, "requires": ["iron_plating"]},
                {"id": "turret_ironclads", "name": "Башенные броненосцы", "year": 1865, "requires": ["ironclads_2"]},
                {"id": "steam_ships_of_line_2", "name": "Паровые линкоры II", "year": 1870, "requires": ["turret_ironclads"]},
                
                # Современный флот (1870-1900)
                {"id": "cruisers_1", "name": "Крейсеры I", "year": 1875, "requires": ["steam_ships_of_line_2"]},
                {"id": "modern_battleships", "name": "Современные броненосцы", "year": 1880, "requires": ["cruisers_1"]},
                {"id": "cruisers_2", "name": "Крейсеры II", "year": 1885, "requires": ["modern_battleships"]},
                {"id": "pre_dreadnoughts", "name": "Эскадренные броненосцы", "year": 1890, "requires": ["cruisers_2"]},
                {"id": "dreadnoughts", "name": "Дредноуты", "year": 1895, "requires": ["pre_dreadnoughts"]},
            ]
        },
        {
            "id": "naval_weapons",
            "name": "Морское вооружение",
            "technologies": [
                # Базовый уровень (1500-1550)
                {"id": "falconets", "name": "Фальконеты", "year": 1500, "requires": []},
                {"id": "broadside_guns", "name": "Бортовые пушки", "year": 1510, "requires": ["falconets"]},
                {"id": "culverins", "name": "Кулеврины", "year": 1520, "requires": ["broadside_guns"]},
                {"id": "improved_naval_guns", "name": "Улучшенные морские пушки", "year": 1530, "requires": ["culverins"]},
                {"id": "gun_ports", "name": "Пушечные порты", "year": 1540, "requires": ["improved_naval_guns"]},
                {"id": "multi_tier_armament", "name": "Многоярусное вооружение", "year": 1550, "requires": ["gun_ports"]},
                
                # Развитие (1550-1700)
                {"id": "heavy_naval_guns", "name": "Тяжелые морские пушки", "year": 1560, "requires": ["multi_tier_armament"]},
                {"id": "caliber_standardization_navy", "name": "Стандартизация калибров", "year": 1570, "requires": ["heavy_naval_guns"]},
                {"id": "improved_carriages_navy", "name": "Улучшенные лафеты", "year": 1580, "requires": ["caliber_standardization_navy"]},
                {"id": "anti_ship_shot", "name": "Противокорабельные ядра", "year": 1590, "requires": ["improved_carriages_navy"]},
                {"id": "incendiary_shot", "name": "Зажигательные снаряды", "year": 1600, "requires": ["anti_ship_shot"]},
                {"id": "boarding_grapeshot", "name": "Картечь для абордажа", "year": 1610, "requires": ["incendiary_shot"]},
                {"id": "improved_naval_powder", "name": "Улучшенный порох для флота", "year": 1620, "requires": ["boarding_grapeshot"]},
                {"id": "long_range_guns", "name": "Дальнобойные пушки", "year": 1630, "requires": ["improved_naval_powder"]},
                {"id": "bomb_guns", "name": "Бомбические орудия", "year": 1640, "requires": ["long_range_guns"]},
                {"id": "ship_mortars", "name": "Мортиры на кораблях", "year": 1650, "requires": ["bomb_guns"]},
                {"id": "improved_aiming_navy", "name": "Улучшенное прицеливание", "year": 1660, "requires": ["ship_mortars"]},
                {"id": "naval_artillery_1", "name": "Корабельная артиллерия I", "year": 1670, "requires": ["improved_aiming_navy"]},
                {"id": "explosive_shells_navy", "name": "Разрывные снаряды", "year": 1680, "requires": ["naval_artillery_1"]},
                {"id": "naval_artillery_2", "name": "Корабельная артиллерия II", "year": 1690, "requires": ["explosive_shells_navy"]},
                {"id": "improved_shells_navy", "name": "Улучшенные снаряды", "year": 1700, "requires": ["naval_artillery_2"]},
                
                # Промышленная эпоха (1700-1840)
                {"id": "ammo_standardization_navy", "name": "Стандартизация боеприпасов", "year": 1710, "requires": ["improved_shells_navy"]},
                {"id": "improved_gun_decks", "name": "Улучшенные орудийные палубы", "year": 1720, "requires": ["ammo_standardization_navy"]},
                {"id": "carronades", "name": "Карронады", "year": 1730, "requires": ["improved_gun_decks"]},
                {"id": "naval_artillery_3", "name": "Корабельная артиллерия III", "year": 1740, "requires": ["carronades"]},
                {"id": "long_guns", "name": "Длинные пушки", "year": 1750, "requires": ["naval_artillery_3"]},
                {"id": "improved_rate_of_fire", "name": "Улучшенная скорострельность", "year": 1760, "requires": ["long_guns"]},
                {"id": "high_explosive_shells_navy", "name": "Фугасные снаряды", "year": 1770, "requires": ["improved_rate_of_fire"]},
                {"id": "naval_artillery_4", "name": "Корабельная артиллерия IV", "year": 1780, "requires": ["high_explosive_shells_navy"]},
                {"id": "naval_rockets", "name": "Ракетное оружие для флота", "year": 1790, "requires": ["naval_artillery_4"]},
                {"id": "improved_carronades", "name": "Улучшенные карронады", "year": 1800, "requires": ["naval_rockets"]},
                {"id": "rifled_naval_guns_1", "name": "Нарезные морские орудия I", "year": 1810, "requires": ["improved_carronades"]},
                {"id": "explosive_bombs", "name": "Разрывные бомбы", "year": 1820, "requires": ["rifled_naval_guns_1"]},
                {"id": "rifled_naval_guns_2", "name": "Нарезные морские орудия II", "year": 1830, "requires": ["explosive_bombs"]},
                {"id": "breech_loading_naval_guns", "name": "Казнозарядные морские пушки", "year": 1840, "requires": ["rifled_naval_guns_2"]},
                
                # Современное вооружение (1840-1900)
                {"id": "turret_guns_1", "name": "Башенные орудия I", "year": 1850, "requires": ["breech_loading_naval_guns"]},
                {"id": "armor_piercing_shells", "name": "Бронебойные снаряды", "year": 1855, "requires": ["turret_guns_1"]},
                {"id": "turret_guns_2", "name": "Башенные орудия II", "year": 1860, "requires": ["armor_piercing_shells"]},
                {"id": "quick_firing_naval_guns_1", "name": "Скорострельные морские пушки I", "year": 1865, "requires": ["turret_guns_2"]},
                {"id": "torpedoes", "name": "Торпеды", "year": 1870, "requires": ["quick_firing_naval_guns_1"]},
                {"id": "quick_firing_naval_guns_2", "name": "Скорострельные морские пушки II", "year": 1875, "requires": ["torpedoes"]},
                {"id": "heavy_naval_artillery", "name": "Тяжелая корабельная артиллерия", "year": 1880, "requires": ["quick_firing_naval_guns_2"]},
                {"id": "improved_torpedoes", "name": "Улучшенные торпеды", "year": 1885, "requires": ["heavy_naval_artillery"]},
                {"id": "quick_firing_guns_3", "name": "Скорострельные орудия III", "year": 1890, "requires": ["improved_torpedoes"]},
                {"id": "modern_naval_artillery", "name": "Современная морская артиллерия", "year": 1895, "requires": ["quick_firing_guns_3"]},
            ]
        },
        {
            "id": "navigation",
            "name": "Навигация и мореходство",
            "technologies": [
                # Базовый уровень (1500-1600)
                {"id": "compass", "name": "Компас", "year": 1500, "requires": []},
                {"id": "astrolabe", "name": "Астролябия", "year": 1510, "requires": ["compass"]},
                {"id": "sea_charts_1", "name": "Морские карты I", "year": 1520, "requires": ["astrolabe"]},
                {"id": "piloting", "name": "Лоцманское искусство", "year": 1530, "requires": ["sea_charts_1"]},
                {"id": "sea_charts_2", "name": "Морские карты II", "year": 1540, "requires": ["piloting"]},
                {"id": "navigation_tables", "name": "Навигационные таблицы", "year": 1550, "requires": ["sea_charts_2"]},
                {"id": "improved_sails", "name": "Улучшенные паруса", "year": 1560, "requires": ["navigation_tables"]},
                {"id": "lateen_sails", "name": "Косые паруса", "year": 1570, "requires": ["improved_sails"]},
                {"id": "sea_charts_3", "name": "Морские карты III", "year": 1580, "requires": ["lateen_sails"]},
                {"id": "star_navigation", "name": "Навигация по звездам", "year": 1590, "requires": ["sea_charts_3"]},
                {"id": "log_speed", "name": "Лаг (измеритель скорости)", "year": 1600, "requires": ["star_navigation"]},
                
                # Развитие (1600-1750)
                {"id": "quadrant", "name": "Квадрант", "year": 1610, "requires": ["log_speed"]},
                {"id": "improved_compass", "name": "Улучшенные компасы", "year": 1620, "requires": ["quadrant"]},
                {"id": "sea_charts_4", "name": "Морские карты IV", "year": 1630, "requires": ["improved_compass"]},
                {"id": "sextant", "name": "Секстант", "year": 1640, "requires": ["sea_charts_4"]},
                {"id": "naval_astronomy", "name": "Морская астрономия", "year": 1650, "requires": ["sextant"]},
                {"id": "barometer", "name": "Барометр", "year": 1660, "requires": ["naval_astronomy"]},
                {"id": "depth_sounder", "name": "Глубиномер", "year": 1670, "requires": ["barometer"]},
                {"id": "octant", "name": "Октант", "year": 1680, "requires": ["depth_sounder"]},
                {"id": "improved_sextant", "name": "Улучшенный секстант", "year": 1690, "requires": ["octant"]},
                {"id": "chronometers_1", "name": "Морские хронометры I", "year": 1700, "requires": ["improved_sextant"]},
                {"id": "longitude_finding", "name": "Точное определение долготы", "year": 1710, "requires": ["chronometers_1"]},
                {"id": "chronometers_2", "name": "Морские хронометры II", "year": 1720, "requires": ["longitude_finding"]},
                {"id": "scientific_cartography", "name": "Научная картография", "year": 1730, "requires": ["chronometers_2"]},
                {"id": "sea_charts_5", "name": "Морские карты V", "year": 1740, "requires": ["scientific_cartography"]},
                {"id": "improved_astronomy", "name": "Улучшенная астрономия", "year": 1750, "requires": ["sea_charts_5"]},
                
                # Точная навигация (1750-1850)
                {"id": "precision_chronometers", "name": "Прецизионные хронометры", "year": 1760, "requires": ["improved_astronomy"]},
                {"id": "sea_signals", "name": "Морские сигналы", "year": 1770, "requires": ["precision_chronometers"]},
                {"id": "semaphore", "name": "Семафорная связь", "year": 1780, "requires": ["sea_signals"]},
                {"id": "lighthouses", "name": "Морские маяки", "year": 1790, "requires": ["semaphore"]},
                {"id": "improved_lighthouses", "name": "Улучшенные маяки", "year": 1800, "requires": ["lighthouses"]},
                {"id": "precise_sea_charts", "name": "Точные морские карты", "year": 1810, "requires": ["improved_lighthouses"]},
                {"id": "hydrography", "name": "Гидрография", "year": 1820, "requires": ["precise_sea_charts"]},
                {"id": "oceanography", "name": "Океанография", "year": 1830, "requires": ["hydrography"]},
                {"id": "meteorology", "name": "Метеорология", "year": 1840, "requires": ["oceanography"]},
                {"id": "steam_navigation", "name": "Паровая навигация", "year": 1850, "requires": ["meteorology"]},
                
                # Современная навигация (1850-1900)
                {"id": "precise_depth_measurement", "name": "Точные измерения глубины", "year": 1855, "requires": ["steam_navigation"]},
                {"id": "improved_meteorology", "name": "Улучшенная метеорология", "year": 1860, "requires": ["precise_depth_measurement"]},
                {"id": "ocean_currents", "name": "Морские течения", "year": 1865, "requires": ["improved_meteorology"]},
                {"id": "radio_communication_1", "name": "Радиосвязь на море I", "year": 1870, "requires": ["ocean_currents"]},
                {"id": "modern_cartography", "name": "Современная картография", "year": 1875, "requires": ["radio_communication_1"]},
                {"id": "radio_communication_2", "name": "Радиосвязь на море II", "year": 1880, "requires": ["modern_cartography"]},
                {"id": "electric_lighthouses", "name": "Электрическое освещение маяков", "year": 1885, "requires": ["radio_communication_2"]},
                {"id": "precise_navigation", "name": "Точная навигация", "year": 1890, "requires": ["electric_lighthouses"]},
                {"id": "modern_navigation_systems", "name": "Современные навигационные системы", "year": 1895, "requires": ["precise_navigation"]},
            ]
        },
        {
            "id": "naval_doctrine",
            "name": "Морская доктрина и тактика",
            "technologies": [
                # Базовый уровень (1500-1600)
                {"id": "boarding_tactics", "name": "Абордажная тактика", "year": 1500, "requires": []},
                {"id": "ship_discipline", "name": "Корабельная дисциплина", "year": 1510, "requires": ["boarding_tactics"]},
                {"id": "marines_1", "name": "Морская пехота I", "year": 1520, "requires": ["ship_discipline"]},
                {"id": "boarding_weapons", "name": "Абордажное оружие", "year": 1530, "requires": ["marines_1"]},
                {"id": "marines_2", "name": "Морская пехота II", "year": 1540, "requires": ["boarding_weapons"]},
                {"id": "fleet_organization", "name": "Флотская организация", "year": 1550, "requires": ["marines_2"]},
                {"id": "squadrons", "name": "Эскадры", "year": 1560, "requires": ["fleet_organization"]},
                {"id": "naval_battles", "name": "Морские сражения", "year": 1570, "requires": ["squadrons"]},
                {"id": "pursuit_tactics", "name": "Тактика преследования", "year": 1580, "requires": ["naval_battles"]},
                {"id": "improved_boarding", "name": "Улучшенная абордажная тактика", "year": 1590, "requires": ["pursuit_tactics"]},
                {"id": "fleet_discipline", "name": "Флотская дисциплина", "year": 1600, "requires": ["improved_boarding"]},
                
                # Линейная тактика (1600-1750)
                {"id": "line_formation", "name": "Построение линией", "year": 1610, "requires": ["fleet_discipline"]},
                {"id": "linear_fleet_tactics_1", "name": "Линейная тактика флота I", "year": 1620, "requires": ["line_formation"]},
                {"id": "squadron_coordination", "name": "Координация эскадр", "year": 1630, "requires": ["linear_fleet_tactics_1"]},
                {"id": "linear_fleet_tactics_2", "name": "Линейная тактика флота II", "year": 1640, "requires": ["squadron_coordination"]},
                {"id": "fleet_signals", "name": "Флотские сигналы", "year": 1650, "requires": ["linear_fleet_tactics_2"]},
                {"id": "line_breaking", "name": "Тактика прорыва линии", "year": 1660, "requires": ["fleet_signals"]},
                {"id": "linear_fleet_tactics_3", "name": "Линейная тактика флота III", "year": 1670, "requires": ["line_breaking"]},
                {"id": "concentrated_fire", "name": "Сосредоточение огня", "year": 1680, "requires": ["linear_fleet_tactics_3"]},
                {"id": "maneuver_warfare", "name": "Маневренная война", "year": 1690, "requires": ["concentrated_fire"]},
                {"id": "cruiser_operations", "name": "Крейсерские операции", "year": 1700, "requires": ["maneuver_warfare"]},
                {"id": "port_blockade", "name": "Блокада портов", "year": 1710, "requires": ["cruiser_operations"]},
                {"id": "linear_fleet_tactics_4", "name": "Линейная тактика флота IV", "year": 1720, "requires": ["port_blockade"]},
                {"id": "fleet_artillery", "name": "Флотская артиллерия", "year": 1730, "requires": ["linear_fleet_tactics_4"]},
                {"id": "amphibious_operations", "name": "Десантные операции", "year": 1740, "requires": ["fleet_artillery"]},
                {"id": "convoy_system", "name": "Конвойная система", "year": 1750, "requires": ["amphibious_operations"]},
                
                # Эпоха реформ (1750-1850)
                {"id": "aggressive_tactics", "name": "Агрессивная тактика", "year": 1760, "requires": ["convoy_system"]},
                {"id": "improved_signals", "name": "Улучшенные сигналы", "year": 1770, "requires": ["aggressive_tactics"]},
                {"id": "force_concentration", "name": "Сосредоточение сил", "year": 1780, "requires": ["improved_signals"]},
                {"id": "tactical_flexibility", "name": "Тактическая гибкость", "year": 1790, "requires": ["force_concentration"]},
                {"id": "steam_tactics", "name": "Паровая тактика", "year": 1800, "requires": ["tactical_flexibility"]},
                {"id": "screw_maneuverability", "name": "Винтовая маневренность", "year": 1810, "requires": ["steam_tactics"]},
                {"id": "torpedo_tactics", "name": "Торпедная тактика", "year": 1820, "requires": ["screw_maneuverability"]},
                {"id": "ironclad_doctrine", "name": "Броненосная доктрина", "year": 1830, "requires": ["torpedo_tactics"]},
                {"id": "modern_naval_warfare", "name": "Современная морская война", "year": 1840, "requires": ["ironclad_doctrine"]},
                {"id": "cruiser_warfare", "name": "Крейсерская война", "year": 1850, "requires": ["modern_naval_warfare"]},
                
                # Современная доктрина (1850-1900)
                {"id": "ocean_fleet", "name": "Океанский флот", "year": 1855, "requires": ["cruiser_warfare"]},
                {"id": "sea_power_theory_1", "name": "Теория морской мощи I", "year": 1860, "requires": ["ocean_fleet"]},
                {"id": "high_seas_fleet", "name": "Флот открытого моря", "year": 1865, "requires": ["sea_power_theory_1"]},
                {"id": "sea_power_theory_2", "name": "Теория морской мощи II", "year": 1870, "requires": ["high_seas_fleet"]},
                {"id": "command_of_sea", "name": "Командование морем", "year": 1875, "requires": ["sea_power_theory_2"]},
                {"id": "modern_fleet_organization", "name": "Современная флотская организация", "year": 1880, "requires": ["command_of_sea"]},
                {"id": "squadron_maneuvers", "name": "Эскадренные маневры", "year": 1885, "requires": ["modern_fleet_organization"]},
                {"id": "grand_fleet", "name": "Большой флот", "year": 1890, "requires": ["squadron_maneuvers"]},
                {"id": "sea_dominance", "name": "Доминирование на море", "year": 1895, "requires": ["grand_fleet"]},
            ]
        }
    ]
}

# НАУКА И ОБРАЗОВАНИЕ
EDUCATION_TECH = {
    "id": "education",
    "name": "Наука и образование",
    "lines": [
        {
            "id": "education_system",
            "name": "Образовательная система",
            "technologies": [
                # БАЗОВЫЙ УРОВЕНЬ (1500-1650)
                {"id": "church_schools", "name": "Церковные школы", "year": 1500, "requires": []},
                {"id": "monastery_education", "name": "Монастырское образование", "year": 1510, "requires": ["church_schools"]},
                {"id": "city_schools", "name": "Городские школы", "year": 1520, "requires": ["monastery_education"]},
                {"id": "latin_schools", "name": "Латинские школы", "year": 1530, "requires": ["city_schools"]},
                {"id": "gymnasiums_1", "name": "Гимназии I", "year": 1540, "requires": ["latin_schools"]},
                {"id": "universities_1", "name": "Университеты I", "year": 1550, "requires": ["gymnasiums_1"]},
                {"id": "humanist_education", "name": "Гуманистическое образование", "year": 1560, "requires": ["universities_1"]},
                {"id": "gymnasiums_2", "name": "Гимназии II", "year": 1570, "requires": ["humanist_education"]},
                {"id": "universities_2", "name": "Университеты II", "year": 1580, "requires": ["gymnasiums_2"]},
                {"id": "classical_education", "name": "Классическое образование", "year": 1590, "requires": ["universities_2"]},
                {"id": "education_standards_1", "name": "Образовательные стандарты I", "year": 1600, "requires": ["classical_education"]},
                {"id": "academies", "name": "Академии", "year": 1610, "requires": ["education_standards_1"]},
                {"id": "universities_3", "name": "Университеты III", "year": 1620, "requires": ["academies"]},
                {"id": "education_standards_2", "name": "Образовательные стандарты II", "year": 1630, "requires": ["universities_3"]},
                {"id": "education_reform_1", "name": "Реформа образования I", "year": 1640, "requires": ["education_standards_2"]},
                {"id": "expanded_education", "name": "Расширенное образование", "year": 1650, "requires": ["education_reform_1"]},
                # ЭПОХА ПРОСВЕЩЕНИЯ (1650-1800)
                {"id": "scientific_societies", "name": "Научные общества", "year": 1660, "requires": ["expanded_education"]},
                {"id": "real_schools", "name": "Реальные школы", "year": 1670, "requires": ["scientific_societies"]},
                {"id": "universities_4", "name": "Университеты IV", "year": 1680, "requires": ["real_schools"]},
                {"id": "academies_of_sciences", "name": "Академии наук", "year": 1690, "requires": ["universities_4"]},
                {"id": "secular_education", "name": "Светское образование", "year": 1700, "requires": ["academies_of_sciences"]},
                {"id": "primary_schools_1", "name": "Начальные школы I", "year": 1710, "requires": ["secular_education"]},
                {"id": "education_reform_2", "name": "Образовательная реформа II", "year": 1720, "requires": ["primary_schools_1"]},
                {"id": "primary_schools_2", "name": "Начальные школы II", "year": 1730, "requires": ["education_reform_2"]},
                {"id": "vocational_education_1", "name": "Профессиональное образование I", "year": 1740, "requires": ["primary_schools_2"]},
                {"id": "universities_5", "name": "Университеты V", "year": 1750, "requires": ["vocational_education_1"]},
                {"id": "compulsory_primary_education", "name": "Обязательное начальное образование", "year": 1760, "requires": ["universities_5"]},
                {"id": "pedagogical_institutes", "name": "Педагогические институты", "year": 1770, "requires": ["compulsory_primary_education"]},
                {"id": "vocational_education_2", "name": "Профессиональное образование II", "year": 1780, "requires": ["pedagogical_institutes"]},
                {"id": "education_system_1", "name": "Образовательная система I", "year": 1790, "requires": ["vocational_education_2"]},
                {"id": "state_education", "name": "Государственное образование", "year": 1800, "requires": ["education_system_1"]},
                # СОВРЕМЕННАЯ ЭПОХА (1800-1900)
                {"id": "universal_primary_education_1", "name": "Всеобщее начальное образование I", "year": 1810, "requires": ["state_education"]},
                {"id": "technical_schools", "name": "Технические училища", "year": 1820, "requires": ["universal_primary_education_1"]},
                {"id": "universal_primary_education_2", "name": "Всеобщее начальное образование II", "year": 1830, "requires": ["technical_schools"]},
                {"id": "secondary_education_1", "name": "Среднее образование I", "year": 1840, "requires": ["universal_primary_education_2"]},
                {"id": "polytechnic_institutes", "name": "Политехнические институты", "year": 1850, "requires": ["secondary_education_1"]},
                {"id": "secondary_education_2", "name": "Среднее образование II", "year": 1860, "requires": ["polytechnic_institutes"]},
                {"id": "womens_education", "name": "Женское образование", "year": 1870, "requires": ["secondary_education_2"]},
                {"id": "higher_technical_education", "name": "Высшее техническое образование", "year": 1880, "requires": ["womens_education"]},
                {"id": "education_system_2", "name": "Образовательная система II", "year": 1890, "requires": ["higher_technical_education"]},
                {"id": "modern_education_system", "name": "Современная система образования", "year": 1900, "requires": ["education_system_2"]},
            ]
        },
        {
            "id": "scientific_research",
            "name": "Научные исследования",
            "technologies": [
                # БАЗОВЫЙ УРОВЕНЬ (1500-1650)
                {"id": "alchemy_natural_philosophy", "name": "Алхимия и натурфилософия", "year": 1500, "requires": []},
                {"id": "astronomical_observations", "name": "Астрономические наблюдения", "year": 1510, "requires": ["alchemy_natural_philosophy"]},
                {"id": "medical_research_1", "name": "Медицинские исследования I", "year": 1520, "requires": ["astronomical_observations"]},
                {"id": "anatomy", "name": "Анатомия", "year": 1530, "requires": ["medical_research_1"]},
                {"id": "botany", "name": "Ботаника", "year": 1540, "requires": ["anatomy"]},
                {"id": "experimental_method", "name": "Экспериментальный метод", "year": 1550, "requires": ["botany"]},
                {"id": "scientific_method_1", "name": "Научный метод I", "year": 1560, "requires": ["experimental_method"]},
                {"id": "optics", "name": "Оптика", "year": 1570, "requires": ["scientific_method_1"]},
                {"id": "medical_research_2", "name": "Медицинские исследования II", "year": 1580, "requires": ["optics"]},
                {"id": "mechanics", "name": "Механика", "year": 1590, "requires": ["medical_research_2"]},
                {"id": "scientific_method_2", "name": "Научный метод II", "year": 1600, "requires": ["mechanics"]},
                {"id": "telescope", "name": "Телескоп", "year": 1610, "requires": ["scientific_method_2"]},
                {"id": "microscope", "name": "Микроскоп", "year": 1620, "requires": ["telescope"]},
                {"id": "mathematics_1", "name": "Математика I", "year": 1630, "requires": ["microscope"]},
                {"id": "scientific_instruments", "name": "Научные инструменты", "year": 1640, "requires": ["mathematics_1"]},
                {"id": "experimental_science", "name": "Экспериментальная наука", "year": 1650, "requires": ["scientific_instruments"]},
                # НАУЧНАЯ РЕВОЛЮЦИЯ (1650-1750)
                {"id": "classical_mechanics", "name": "Классическая механика", "year": 1660, "requires": ["experimental_science"]},
                {"id": "mathematics_2", "name": "Математика II", "year": 1670, "requires": ["classical_mechanics"]},
                {"id": "scientific_laboratories_1", "name": "Научные лаборатории I", "year": 1680, "requires": ["mathematics_2"]},
                {"id": "physics_1", "name": "Физика I", "year": 1690, "requires": ["scientific_laboratories_1"]},
                {"id": "calculus", "name": "Исчисление", "year": 1700, "requires": ["physics_1"]},
                {"id": "scientific_laboratories_2", "name": "Научные лаборатории II", "year": 1710, "requires": ["calculus"]},
                {"id": "physics_2", "name": "Физика II", "year": 1720, "requires": ["scientific_laboratories_2"]},
                {"id": "astronomy", "name": "Астрономия", "year": 1730, "requires": ["physics_2"]},
                {"id": "mathematics_3", "name": "Математика III", "year": 1740, "requires": ["astronomy"]},
                {"id": "scientific_research_1", "name": "Научные исследования I", "year": 1750, "requires": ["mathematics_3"]},
                # ЭПОХА ПРОСВЕЩЕНИЯ (1750-1850)
                {"id": "chemistry_1", "name": "Химия I", "year": 1760, "requires": ["scientific_research_1"]},
                {"id": "natural_sciences", "name": "Естественные науки", "year": 1770, "requires": ["chemistry_1"]},
                {"id": "chemistry_2", "name": "Химия II", "year": 1780, "requires": ["natural_sciences"]},
                {"id": "electricity_1", "name": "Электричество I", "year": 1790, "requires": ["chemistry_2"]},
                {"id": "scientific_research_2", "name": "Научные исследования II", "year": 1800, "requires": ["electricity_1"]},
                {"id": "electricity_2", "name": "Электричество II", "year": 1810, "requires": ["scientific_research_2"]},
                {"id": "thermodynamics", "name": "Термодинамика", "year": 1820, "requires": ["electricity_2"]},
                {"id": "electromagnetism", "name": "Электромагнетизм", "year": 1830, "requires": ["thermodynamics"]},
                {"id": "scientific_method_3", "name": "Научный метод III", "year": 1840, "requires": ["electromagnetism"]},
                {"id": "scientific_research_3", "name": "Научные исследования III", "year": 1850, "requires": ["scientific_method_3"]},
                # СОВРЕМЕННАЯ НАУКА (1850-1900)
                {"id": "organic_chemistry", "name": "Органическая химия", "year": 1860, "requires": ["scientific_research_3"]},
                {"id": "theory_of_evolution", "name": "Теория эволюции", "year": 1865, "requires": ["organic_chemistry"]},
                {"id": "modern_physics_1", "name": "Современная физика I", "year": 1870, "requires": ["theory_of_evolution"]},
                {"id": "microbiology", "name": "Микробиология", "year": 1875, "requires": ["modern_physics_1"]},
                {"id": "electrical_engineering", "name": "Электротехника", "year": 1880, "requires": ["microbiology"]},
                {"id": "modern_physics_2", "name": "Современная физика II", "year": 1885, "requires": ["electrical_engineering"]},
                {"id": "medicine_and_hygiene", "name": "Медицина и гигиена", "year": 1890, "requires": ["modern_physics_2"]},
                {"id": "scientific_research_4", "name": "Научные исследования IV", "year": 1895, "requires": ["medicine_and_hygiene"]},
                {"id": "modern_science", "name": "Современная наука", "year": 1900, "requires": ["scientific_research_4"]},
            ]
        },
        {
            "id": "medicine_healthcare",
            "name": "Медицина и здравоохранение",
            "technologies": [
                # БАЗОВЫЙ УРОВЕНЬ (1500-1650)
                {"id": "folk_medicine", "name": "Народная медицина", "year": 1500, "requires": []},
                {"id": "barber_surgeons", "name": "Цирюльники-хирурги", "year": 1510, "requires": ["folk_medicine"]},
                {"id": "apothecaries", "name": "Аптекари", "year": 1520, "requires": ["barber_surgeons"]},
                {"id": "medical_schools_1", "name": "Медицинские школы I", "year": 1530, "requires": ["apothecaries"]},
                {"id": "anatomical_studies", "name": "Анатомические исследования", "year": 1540, "requires": ["medical_schools_1"]},
                {"id": "surgery_1", "name": "Хирургия I", "year": 1550, "requires": ["anatomical_studies"]},
                {"id": "medical_schools_2", "name": "Медицинские школы II", "year": 1560, "requires": ["surgery_1"]},
                {"id": "medicinal_herbs", "name": "Лекарственные травы", "year": 1570, "requires": ["medical_schools_2"]},
                {"id": "surgery_2", "name": "Хирургия II", "year": 1580, "requires": ["medicinal_herbs"]},
                {"id": "hospitals_1", "name": "Больницы I", "year": 1590, "requires": ["surgery_2"]},
                {"id": "medical_practice_1", "name": "Медицинская практика I", "year": 1600, "requires": ["hospitals_1"]},
                {"id": "hospitals_2", "name": "Больницы II", "year": 1610, "requires": ["medical_practice_1"]},
                {"id": "surgical_instruments", "name": "Хирургические инструменты", "year": 1620, "requires": ["hospitals_2"]},
                {"id": "medical_practice_2", "name": "Медицинская практика II", "year": 1630, "requires": ["surgical_instruments"]},
                {"id": "pharmacies", "name": "Аптеки", "year": 1640, "requires": ["medical_practice_2"]},
                {"id": "improved_surgery", "name": "Улучшенная хирургия", "year": 1650, "requires": ["pharmacies"]},
                # РАЗВИТИЕ (1650-1800)
                {"id": "medical_universities", "name": "Медицинские университеты", "year": 1660, "requires": ["improved_surgery"]},
                {"id": "anatomical_theaters", "name": "Анатомические театры", "year": 1670, "requires": ["medical_universities"]},
                {"id": "surgery_3", "name": "Хирургия III", "year": 1680, "requires": ["anatomical_theaters"]},
                {"id": "obstetrics", "name": "Акушерство", "year": 1690, "requires": ["surgery_3"]},
                {"id": "hospitals_3", "name": "Больницы III", "year": 1700, "requires": ["obstetrics"]},
                {"id": "medical_practice_3", "name": "Медицинская практика III", "year": 1710, "requires": ["hospitals_3"]},
                {"id": "military_medicine", "name": "Военная медицина", "year": 1720, "requires": ["medical_practice_3"]},
                {"id": "vaccination", "name": "Вакцинация", "year": 1730, "requires": ["military_medicine"]},
                {"id": "surgery_4", "name": "Хирургия IV", "year": 1740, "requires": ["vaccination"]},
                {"id": "city_hospitals", "name": "Городские больницы", "year": 1750, "requires": ["surgery_4"]},
                {"id": "improved_hygiene", "name": "Улучшенная гигиена", "year": 1760, "requires": ["city_hospitals"]},
                {"id": "medical_practice_4", "name": "Медицинская практика IV", "year": 1770, "requires": ["improved_hygiene"]},
                {"id": "clinical_medicine", "name": "Клиническая медицина", "year": 1780, "requires": ["medical_practice_4"]},
                {"id": "sanitation_1", "name": "Санитария I", "year": 1790, "requires": ["clinical_medicine"]},
                {"id": "public_health_1", "name": "Общественное здравоохранение I", "year": 1800, "requires": ["sanitation_1"]},
                # СОВРЕМЕННАЯ МЕДИЦИНА (1800-1900)
                {"id": "anesthesia", "name": "Анестезия", "year": 1810, "requires": ["public_health_1"]},
                {"id": "stethoscope_diagnostics", "name": "Стетоскоп и диагностика", "year": 1820, "requires": ["anesthesia"]},
                {"id": "improved_surgery_modern", "name": "Улучшенная хирургия", "year": 1830, "requires": ["stethoscope_diagnostics"]},
                {"id": "sanitation_2", "name": "Санитария II", "year": 1840, "requires": ["improved_surgery_modern"]},
                {"id": "antiseptics", "name": "Антисептика", "year": 1850, "requires": ["sanitation_2"]},
                {"id": "germ_theory", "name": "Микробная теория", "year": 1860, "requires": ["antiseptics"]},
                {"id": "asepsis", "name": "Асептика", "year": 1870, "requires": ["germ_theory"]},
                {"id": "modern_surgery", "name": "Современная хирургия", "year": 1880, "requires": ["asepsis"]},
                {"id": "public_health_2", "name": "Общественное здравоохранение II", "year": 1890, "requires": ["modern_surgery"]},
                {"id": "modern_medicine", "name": "Современная медицина", "year": 1900, "requires": ["public_health_2"]},
            ]
        },
        {
            "id": "printing_knowledge",
            "name": "Печать и распространение знаний",
            "technologies": [
                # БАЗОВЫЙ УРОВЕНЬ (1500-1650)
                {"id": "printing_press", "name": "Печатный станок", "year": 1500, "requires": []},
                {"id": "improved_printing", "name": "Улучшенная печать", "year": 1510, "requires": ["printing_press"]},
                {"id": "book_printing_1", "name": "Книгопечатание I", "year": 1520, "requires": ["improved_printing"]},
                {"id": "printing_houses", "name": "Типографии", "year": 1530, "requires": ["book_printing_1"]},
                {"id": "book_printing_2", "name": "Книгопечатание II", "year": 1540, "requires": ["printing_houses"]},
                {"id": "book_distribution", "name": "Распространение книг", "year": 1550, "requires": ["book_printing_2"]},
                {"id": "improved_fonts", "name": "Улучшенные шрифты", "year": 1560, "requires": ["book_distribution"]},
                {"id": "book_publishing_1", "name": "Книгоиздательство I", "year": 1570, "requires": ["improved_fonts"]},
                {"id": "libraries_1", "name": "Библиотеки I", "year": 1580, "requires": ["book_publishing_1"]},
                {"id": "book_publishing_2", "name": "Книгоиздательство II", "year": 1590, "requires": ["libraries_1"]},
                {"id": "mass_book_printing", "name": "Массовое книгопечатание", "year": 1600, "requires": ["book_publishing_2"]},
                {"id": "libraries_2", "name": "Библиотеки II", "year": 1610, "requires": ["mass_book_printing"]},
                {"id": "periodical_press", "name": "Периодическая печать", "year": 1620, "requires": ["libraries_2"]},
                {"id": "book_trade", "name": "Книжная торговля", "year": 1630, "requires": ["periodical_press"]},
                {"id": "public_libraries", "name": "Публичные библиотеки", "year": 1640, "requires": ["book_trade"]},
                {"id": "newspapers", "name": "Газеты", "year": 1650, "requires": ["public_libraries"]},
                # ЭПОХА ПРОСВЕЩЕНИЯ (1650-1800)
                {"id": "improved_printing_enlightenment", "name": "Улучшенная печать", "year": 1660, "requires": ["newspapers"]},
                {"id": "encyclopedias", "name": "Энциклопедии", "year": 1670, "requires": ["improved_printing_enlightenment"]},
                {"id": "literary_journals", "name": "Литературные журналы", "year": 1680, "requires": ["encyclopedias"]},
                {"id": "book_publishing_3", "name": "Книгоиздательство III", "year": 1690, "requires": ["literary_journals"]},
                {"id": "regular_newspapers", "name": "Регулярные газеты", "year": 1700, "requires": ["book_publishing_3"]},
                {"id": "mass_print_distribution", "name": "Массовое распространение печати", "year": 1710, "requires": ["regular_newspapers"]},
                {"id": "scientific_journals", "name": "Научные журналы", "year": 1720, "requires": ["mass_print_distribution"]},
                {"id": "improved_book_printing", "name": "Улучшенное книгопечатание", "year": 1730, "requires": ["scientific_journals"]},
                {"id": "reading_rooms", "name": "Читальные залы", "year": 1740, "requires": ["improved_book_printing"]},
                {"id": "book_industry", "name": "Книжная индустрия", "year": 1750, "requires": ["reading_rooms"]},
                {"id": "daily_newspapers", "name": "Ежедневные газеты", "year": 1760, "requires": ["book_industry"]},
                {"id": "libraries_3", "name": "Библиотеки III", "year": 1770, "requires": ["daily_newspapers"]},
                {"id": "mass_literacy", "name": "Массовая грамотность", "year": 1780, "requires": ["libraries_3"]},
                {"id": "book_publishing_4", "name": "Книгоиздательство IV", "year": 1790, "requires": ["mass_literacy"]},
                {"id": "magazine_industry", "name": "Журнальная индустрия", "year": 1800, "requires": ["book_publishing_4"]},
                # ИНДУСТРИАЛЬНАЯ ЭПОХА (1800-1900)
                {"id": "mechanized_printing", "name": "Механизированная печать", "year": 1810, "requires": ["magazine_industry"]},
                {"id": "steam_printing_machines", "name": "Паровые печатные машины", "year": 1820, "requires": ["mechanized_printing"]},
                {"id": "cheap_books", "name": "Дешевые книги", "year": 1830, "requires": ["steam_printing_machines"]},
                {"id": "mass_press", "name": "Массовая пресса", "year": 1840, "requires": ["cheap_books"]},
                {"id": "rotary_printing", "name": "Ротационная печать", "year": 1850, "requires": ["mass_press"]},
                {"id": "illustrated_magazines", "name": "Иллюстрированные журналы", "year": 1860, "requires": ["rotary_printing"]},
                {"id": "modern_book_publishing", "name": "Современное книгоиздательство", "year": 1870, "requires": ["illustrated_magazines"]},
                {"id": "mass_press_2", "name": "Массовая пресса II", "year": 1880, "requires": ["modern_book_publishing"]},
                {"id": "modern_printing", "name": "Современная полиграфия", "year": 1890, "requires": ["mass_press_2"]},
                {"id": "media_industry", "name": "Индустрия СМИ", "year": 1900, "requires": ["modern_printing"]},
            ]
        }
    ]
}

# ЭКОНОМИКА И ТОРГОВЛЯ
ECONOMY_TECH = {
    "id": "economy",
    "name": "Экономика и торговля",
    "lines": [
        {
            "id": "financial_system",
            "name": "Финансовая система",
            "technologies": [
                # БАЗОВЫЙ УРОВЕНЬ (1500-1650)
                {"id": "usury", "name": "Ростовщичество", "year": 1500, "requires": []},
                {"id": "money_changing", "name": "Меняльное дело", "year": 1510, "requires": ["usury"]},
                {"id": "early_banks", "name": "Ранние банки", "year": 1520, "requires": ["money_changing"]},
                {"id": "bills_of_exchange", "name": "Вексели", "year": 1530, "requires": ["early_banks"]},
                {"id": "banking_1", "name": "Банковское дело I", "year": 1540, "requires": ["bills_of_exchange"]},
                {"id": "lending", "name": "Кредитование", "year": 1550, "requires": ["banking_1"]},
                {"id": "banking_2", "name": "Банковское дело II", "year": 1560, "requires": ["lending"]},
                {"id": "checks_transfers", "name": "Чеки и переводы", "year": 1570, "requires": ["banking_2"]},
                {"id": "merchant_banks", "name": "Торговые банки", "year": 1580, "requires": ["checks_transfers"]},
                {"id": "banking_3", "name": "Банковское дело III", "year": 1590, "requires": ["merchant_banks"]},
                {"id": "state_credit", "name": "Государственный кредит", "year": 1600, "requires": ["banking_3"]},
                {"id": "exchanges_1", "name": "Биржи I", "year": 1610, "requires": ["state_credit"]},
                {"id": "stocks_bonds", "name": "Акции и облигации", "year": 1620, "requires": ["exchanges_1"]},
                {"id": "exchanges_2", "name": "Биржи II", "year": 1630, "requires": ["stocks_bonds"]},
                {"id": "financial_system_1", "name": "Финансовая система I", "year": 1640, "requires": ["exchanges_2"]},
                {"id": "investment_banks", "name": "Инвестиционные банки", "year": 1650, "requires": ["financial_system_1"]},
                # РАЗВИТИЕ (1650-1800)
                {"id": "central_banks_1", "name": "Центральные банки I", "year": 1660, "requires": ["investment_banks"]},
                {"id": "government_bonds", "name": "Государственные облигации", "year": 1670, "requires": ["central_banks_1"]},
                {"id": "stock_trading", "name": "Биржевая торговля", "year": 1680, "requires": ["government_bonds"]},
                {"id": "central_banks_2", "name": "Центральные банки II", "year": 1690, "requires": ["stock_trading"]},
                {"id": "paper_money_1", "name": "Бумажные деньги I", "year": 1700, "requires": ["central_banks_2"]},
                {"id": "financial_system_2", "name": "Финансовая система II", "year": 1710, "requires": ["paper_money_1"]},
                {"id": "paper_money_2", "name": "Бумажные деньги II", "year": 1720, "requires": ["financial_system_2"]},
                {"id": "insurance_1", "name": "Страхование I", "year": 1730, "requires": ["paper_money_2"]},
                {"id": "assignats", "name": "Ассигнации", "year": 1740, "requires": ["insurance_1"]},
                {"id": "insurance_2", "name": "Страхование II", "year": 1750, "requires": ["assignats"]},
                {"id": "securities", "name": "Ценные бумаги", "year": 1760, "requires": ["insurance_2"]},
                {"id": "financial_markets", "name": "Финансовые рынки", "year": 1770, "requires": ["securities"]},
                {"id": "banknotes", "name": "Банкноты", "year": 1780, "requires": ["financial_markets"]},
                {"id": "national_banks", "name": "Национальные банки", "year": 1790, "requires": ["banknotes"]},
                {"id": "financial_system_3", "name": "Финансовая система III", "year": 1800, "requires": ["national_banks"]},
                # СОВРЕМЕННАЯ ЭПОХА (1800-1900)
                {"id": "commercial_banks", "name": "Коммерческие банки", "year": 1810, "requires": ["financial_system_3"]},
                {"id": "savings_banks", "name": "Сберегательные банки", "year": 1820, "requires": ["commercial_banks"]},
                {"id": "financial_system_4", "name": "Финансовая система IV", "year": 1830, "requires": ["savings_banks"]},
                {"id": "mortgage_lending", "name": "Ипотечное кредитование", "year": 1840, "requires": ["financial_system_4"]},
                {"id": "stock_exchanges", "name": "Фондовые биржи", "year": 1850, "requires": ["mortgage_lending"]},
                {"id": "investment_funds", "name": "Инвестиционные фонды", "year": 1860, "requires": ["stock_exchanges"]},
                {"id": "modern_banking_system", "name": "Современная банковская система", "year": 1870, "requires": ["investment_funds"]},
                {"id": "industrial_financing", "name": "Промышленное финансирование", "year": 1880, "requires": ["modern_banking_system"]},
                {"id": "international_finance", "name": "Международные финансы", "year": 1890, "requires": ["industrial_financing"]},
                {"id": "modern_financial_system", "name": "Современная финансовая система", "year": 1900, "requires": ["international_finance"]},
            ]
        },
        {
            "id": "trade_commerce",
            "name": "Торговля и коммерция",
            "technologies": [
                # БАЗОВЫЙ УРОВЕНЬ (1500-1650)
                {"id": "local_trade", "name": "Местная торговля", "year": 1500, "requires": []},
                {"id": "market_trade", "name": "Рыночная торговля", "year": 1510, "requires": ["local_trade"]},
                {"id": "fairs_1", "name": "Ярмарки I", "year": 1520, "requires": ["market_trade"]},
                {"id": "merchant_guilds", "name": "Гильдии купцов", "year": 1530, "requires": ["fairs_1"]},
                {"id": "fairs_2", "name": "Ярмарки II", "year": 1540, "requires": ["merchant_guilds"]},
                {"id": "international_trade_1", "name": "Международная торговля I", "year": 1550, "requires": ["fairs_2"]},
                {"id": "trading_companies_1", "name": "Торговые компании I", "year": 1560, "requires": ["international_trade_1"]},
                {"id": "caravan_trade", "name": "Караванная торговля", "year": 1570, "requires": ["trading_companies_1"]},
                {"id": "trading_companies_2", "name": "Торговые компании II", "year": 1580, "requires": ["caravan_trade"]},
                {"id": "international_trade_2", "name": "Международная торговля II", "year": 1590, "requires": ["trading_companies_2"]},
                {"id": "warehouse_system", "name": "Складская система", "year": 1600, "requires": ["international_trade_2"]},
                {"id": "maritime_trade_1", "name": "Морская торговля I", "year": 1610, "requires": ["warehouse_system"]},
                {"id": "trading_ports", "name": "Торговые порты", "year": 1620, "requires": ["maritime_trade_1"]},
                {"id": "maritime_trade_2", "name": "Морская торговля II", "year": 1630, "requires": ["trading_ports"]},
                {"id": "trade_routes", "name": "Торговые маршруты", "year": 1640, "requires": ["maritime_trade_2"]},
                {"id": "colonial_trade_1", "name": "Колониальная торговля I", "year": 1650, "requires": ["trade_routes"]},
                # ЭПОХА МЕРКАНТИЛИЗМА (1650-1800)
                {"id": "trade_monopolies", "name": "Торговые монополии", "year": 1660, "requires": ["colonial_trade_1"]},
                {"id": "colonial_trade_2", "name": "Колониальная торговля II", "year": 1670, "requires": ["trade_monopolies"]},
                {"id": "merchant_fleet_1", "name": "Торговый флот I", "year": 1680, "requires": ["colonial_trade_2"]},
                {"id": "east_india_companies", "name": "Ост-Индские компании", "year": 1690, "requires": ["merchant_fleet_1"]},
                {"id": "merchant_fleet_2", "name": "Торговый флот II", "year": 1700, "requires": ["east_india_companies"]},
                {"id": "international_markets", "name": "Международные рынки", "year": 1710, "requires": ["merchant_fleet_2"]},
                {"id": "triangular_trade", "name": "Треугольная торговля", "year": 1720, "requires": ["international_markets"]},
                {"id": "merchant_fleet_3", "name": "Торговый флот III", "year": 1730, "requires": ["triangular_trade"]},
                {"id": "free_trade_1", "name": "Свободная торговля I", "year": 1740, "requires": ["merchant_fleet_3"]},
                {"id": "trade_treaties", "name": "Торговые договоры", "year": 1750, "requires": ["free_trade_1"]},
                {"id": "abolition_monopolies", "name": "Отмена монополий", "year": 1760, "requires": ["trade_treaties"]},
                {"id": "free_trade_2", "name": "Свободная торговля II", "year": 1770, "requires": ["abolition_monopolies"]},
                {"id": "international_commerce", "name": "Международная коммерция", "year": 1780, "requires": ["free_trade_2"]},
                {"id": "trade_infrastructure", "name": "Торговая инфраструктура", "year": 1790, "requires": ["international_commerce"]},
                {"id": "trade_liberalization", "name": "Либерализация торговли", "year": 1800, "requires": ["trade_infrastructure"]},
                # ИНДУСТРИАЛЬНАЯ ЭПОХА (1800-1900)
                {"id": "free_trade_3", "name": "Свободная торговля III", "year": 1810, "requires": ["trade_liberalization"]},
                {"id": "customs_unions", "name": "Таможенные союзы", "year": 1820, "requires": ["free_trade_3"]},
                {"id": "international_exhibitions", "name": "Международные выставки", "year": 1830, "requires": ["customs_unions"]},
                {"id": "trade_networks", "name": "Торговые сети", "year": 1840, "requires": ["international_exhibitions"]},
                {"id": "global_trade_1", "name": "Глобальная торговля I", "year": 1850, "requires": ["trade_networks"]},
                {"id": "telegraph_trade", "name": "Телеграфная торговля", "year": 1860, "requires": ["global_trade_1"]},
                {"id": "commodity_exchanges", "name": "Торговые биржи", "year": 1870, "requires": ["telegraph_trade"]},
                {"id": "global_trade_2", "name": "Глобальная торговля II", "year": 1880, "requires": ["commodity_exchanges"]},
                {"id": "modern_commerce", "name": "Современная коммерция", "year": 1890, "requires": ["global_trade_2"]},
                {"id": "international_trade_system", "name": "Международная торговая система", "year": 1900, "requires": ["modern_commerce"]},
            ]
        },
        {
            "id": "agriculture",
            "name": "Сельское хозяйство",
            "technologies": [
                # БАЗОВЫЙ УРОВЕНЬ (1500-1650)
                {"id": "three_field_system", "name": "Трехполье", "year": 1500, "requires": []},
                {"id": "improved_plough", "name": "Улучшенный плуг", "year": 1510, "requires": ["three_field_system"]},
                {"id": "crop_rotation_1", "name": "Севооборот I", "year": 1520, "requires": ["improved_plough"]},
                {"id": "agricultural_tools", "name": "Сельскохозяйственные орудия", "year": 1530, "requires": ["crop_rotation_1"]},
                {"id": "crop_rotation_2", "name": "Севооборот II", "year": 1540, "requires": ["agricultural_tools"]},
                {"id": "fertilizers_1", "name": "Удобрения I", "year": 1550, "requires": ["crop_rotation_2"]},
                {"id": "selection_1", "name": "Селекция I", "year": 1560, "requires": ["fertilizers_1"]},
                {"id": "improved_tools", "name": "Улучшенные орудия труда", "year": 1570, "requires": ["selection_1"]},
                {"id": "selection_2", "name": "Селекция II", "year": 1580, "requires": ["improved_tools"]},
                {"id": "crop_rotation_3", "name": "Севооборот III", "year": 1590, "requires": ["selection_2"]},
                {"id": "fertilizers_2", "name": "Удобрения II", "year": 1600, "requires": ["crop_rotation_3"]},
                {"id": "land_drainage", "name": "Осушение земель", "year": 1610, "requires": ["fertilizers_2"]},
                {"id": "new_crops", "name": "Новые культуры", "year": 1620, "requires": ["land_drainage"]},
                {"id": "selection_3", "name": "Селекция III", "year": 1630, "requires": ["new_crops"]},
                {"id": "agricultural_machinery_1", "name": "Сельскохозяйственная техника I", "year": 1640, "requires": ["selection_3"]},
                {"id": "improved_farming", "name": "Улучшенное земледелие", "year": 1650, "requires": ["agricultural_machinery_1"]},
                # АГРАРНАЯ РЕВОЛЮЦИЯ (1650-1800)
                {"id": "four_field_system", "name": "Четырехполье", "year": 1660, "requires": ["improved_farming"]},
                {"id": "root_crops", "name": "Корнеплоды", "year": 1670, "requires": ["four_field_system"]},
                {"id": "improved_fertilizers", "name": "Улучшенные удобрения", "year": 1680, "requires": ["root_crops"]},
                {"id": "animal_selection_1", "name": "Селекция животных I", "year": 1690, "requires": ["improved_fertilizers"]},
                {"id": "multi_field_rotation", "name": "Многопольный севооборот", "year": 1700, "requires": ["animal_selection_1"]},
                {"id": "agricultural_machinery_2", "name": "Сельскохозяйственная техника II", "year": 1710, "requires": ["multi_field_rotation"]},
                {"id": "animal_selection_2", "name": "Селекция животных II", "year": 1720, "requires": ["agricultural_machinery_2"]},
                {"id": "grass_farming", "name": "Травосеяние", "year": 1730, "requires": ["animal_selection_2"]},
                {"id": "drainage", "name": "Дренаж", "year": 1740, "requires": ["grass_farming"]},
                {"id": "agricultural_machinery_3", "name": "Сельскохозяйственная техника III", "year": 1750, "requires": ["drainage"]},
                {"id": "intensive_farming", "name": "Интенсивное земледелие", "year": 1760, "requires": ["agricultural_machinery_3"]},
                {"id": "plant_selection", "name": "Селекция растений", "year": 1770, "requires": ["intensive_farming"]},
                {"id": "improved_livestock", "name": "Улучшенный скот", "year": 1780, "requires": ["plant_selection"]},
                {"id": "agricultural_science", "name": "Сельскохозяйственная наука", "year": 1790, "requires": ["improved_livestock"]},
                {"id": "modern_farming", "name": "Современное земледелие", "year": 1800, "requires": ["agricultural_science"]},
                # МЕХАНИЗАЦИЯ (1800-1900)
                {"id": "mechanical_seeders", "name": "Механические сеялки", "year": 1810, "requires": ["modern_farming"]},
                {"id": "threshers", "name": "Молотилки", "year": 1820, "requires": ["mechanical_seeders"]},
                {"id": "agricultural_machines_1", "name": "Сельскохозяйственные машины I", "year": 1830, "requires": ["threshers"]},
                {"id": "mechanical_reapers", "name": "Механические жатки", "year": 1840, "requires": ["agricultural_machines_1"]},
                {"id": "chemical_fertilizers", "name": "Химические удобрения", "year": 1850, "requires": ["mechanical_reapers"]},
                {"id": "agricultural_machines_2", "name": "Сельскохозяйственные машины II", "year": 1860, "requires": ["chemical_fertilizers"]},
                {"id": "steam_ploughs", "name": "Паровые плуги", "year": 1870, "requires": ["agricultural_machines_2"]},
                {"id": "combine_harvesters", "name": "Комбайны", "year": 1880, "requires": ["steam_ploughs"]},
                {"id": "agricultural_machines_3", "name": "Сельскохозяйственные машины III", "year": 1890, "requires": ["combine_harvesters"]},
                {"id": "modern_agriculture", "name": "Современное сельское хозяйство", "year": 1900, "requires": ["agricultural_machines_3"]},
            ]
        },
        {
            "id": "resource_extraction",
            "name": "Добыча ресурсов",
            "technologies": [
                # БАЗОВЫЙ УРОВЕНЬ (1500-1650)
                {"id": "open_pit_mining", "name": "Открытая добыча", "year": 1500, "requires": []},
                {"id": "mining_1", "name": "Шахтное дело I", "year": 1510, "requires": ["open_pit_mining"]},
                {"id": "ore_mines", "name": "Рудники", "year": 1520, "requires": ["mining_1"]},
                {"id": "mining_2", "name": "Шахтное дело II", "year": 1530, "requires": ["ore_mines"]},
                {"id": "mine_ventilation", "name": "Вентиляция шахт", "year": 1540, "requires": ["mining_2"]},
                {"id": "mine_drainage_1", "name": "Дренаж шахт I", "year": 1550, "requires": ["mine_ventilation"]},
                {"id": "ore_extraction_1", "name": "Добыча руды I", "year": 1560, "requires": ["mine_drainage_1"]},
                {"id": "mining_3", "name": "Шахтное дело III", "year": 1570, "requires": ["ore_extraction_1"]},
                {"id": "mine_drainage_2", "name": "Дренаж шахт II", "year": 1580, "requires": ["mining_3"]},
                {"id": "ore_extraction_2", "name": "Добыча руды II", "year": 1590, "requires": ["mine_drainage_2"]},
                {"id": "mine_mechanisms", "name": "Шахтные механизмы", "year": 1600, "requires": ["ore_extraction_2"]},
                {"id": "deep_mines", "name": "Глубокие шахты", "year": 1610, "requires": ["mine_mechanisms"]},
                {"id": "coal_mining_1", "name": "Добыча угля I", "year": 1620, "requires": ["deep_mines"]},
                {"id": "mining_4", "name": "Шахтное дело IV", "year": 1630, "requires": ["coal_mining_1"]},
                {"id": "coal_mining_2", "name": "Добыча угля II", "year": 1640, "requires": ["mining_4"]},
                {"id": "improved_extraction", "name": "Улучшенная добыча", "year": 1650, "requires": ["coal_mining_2"]},
                # РАЗВИТИЕ (1650-1800)
                {"id": "steam_pumps_mines", "name": "Паровые насосы для шахт", "year": 1660, "requires": ["improved_extraction"]},
                {"id": "coal_extraction", "name": "Добыча каменного угля", "year": 1670, "requires": ["steam_pumps_mines"]},
                {"id": "mine_safety_1", "name": "Шахтная безопасность I", "year": 1680, "requires": ["coal_extraction"]},
                {"id": "blasting_operations", "name": "Взрывные работы", "year": 1690, "requires": ["mine_safety_1"]},
                {"id": "deep_mining", "name": "Глубокая разработка", "year": 1700, "requires": ["blasting_operations"]},
                {"id": "mining_5", "name": "Шахтное дело V", "year": 1710, "requires": ["deep_mining"]},
                {"id": "steam_hoists", "name": "Паровые подъемники", "year": 1720, "requires": ["mining_5"]},
                {"id": "coal_mining_3", "name": "Добыча угля III", "year": 1730, "requires": ["steam_hoists"]},
                {"id": "mine_safety_2", "name": "Шахтная безопасность II", "year": 1740, "requires": ["coal_mining_3"]},
                {"id": "vertical_shafts", "name": "Вертикальные шахты", "year": 1750, "requires": ["mine_safety_2"]},
                {"id": "industrial_extraction_1", "name": "Промышленная добыча I", "year": 1760, "requires": ["vertical_shafts"]},
                {"id": "improved_ventilation_mines", "name": "Улучшенная вентиляция", "year": 1770, "requires": ["industrial_extraction_1"]},
                {"id": "metal_extraction", "name": "Добыча металлов", "year": 1780, "requires": ["improved_ventilation_mines"]},
                {"id": "industrial_extraction_2", "name": "Промышленная добыча II", "year": 1790, "requires": ["metal_extraction"]},
                {"id": "mass_extraction", "name": "Массовая добыча", "year": 1800, "requires": ["industrial_extraction_2"]},
                # ИНДУСТРИАЛЬНАЯ ЭПОХА (1800-1900)
                {"id": "steam_cutting_machines", "name": "Паровые врубовые машины", "year": 1810, "requires": ["mass_extraction"]},
                {"id": "iron_rails_mines", "name": "Железные рельсы в шахтах", "year": 1820, "requires": ["steam_cutting_machines"]},
                {"id": "industrial_extraction_3", "name": "Промышленная добыча III", "year": 1830, "requires": ["iron_rails_mines"]},
                {"id": "dynamite_mining", "name": "Динамит для горных работ", "year": 1840, "requires": ["industrial_extraction_3"]},
                {"id": "deep_coal_mining", "name": "Глубокая добыча угля", "year": 1850, "requires": ["dynamite_mining"]},
                {"id": "mechanized_extraction_1", "name": "Механизированная добыча I", "year": 1860, "requires": ["deep_coal_mining"]},
                {"id": "mining_6", "name": "Шахтное дело VI", "year": 1870, "requires": ["mechanized_extraction_1"]},
                {"id": "mechanized_extraction_2", "name": "Механизированная добыча II", "year": 1880, "requires": ["mining_6"]},
                {"id": "modern_extraction", "name": "Современная добыча", "year": 1890, "requires": ["mechanized_extraction_2"]},
                {"id": "industrial_resource_extraction", "name": "Индустриальная добыча ресурсов", "year": 1900, "requires": ["modern_extraction"]},
            ]
        },
        {
            "id": "tax_administration",
            "name": "Налоговая система и администрация",
            "technologies": [
                # БАЗОВЫЙ УРОВЕНЬ (1500-1650)
                {"id": "feudal_taxes", "name": "Феодальные налоги", "year": 1500, "requires": []},
                {"id": "city_taxes", "name": "Городские налоги", "year": 1510, "requires": ["feudal_taxes"]},
                {"id": "tax_system_1", "name": "Налоговая система I", "year": 1520, "requires": ["city_taxes"]},
                {"id": "customs_duties", "name": "Таможенные пошлины", "year": 1530, "requires": ["tax_system_1"]},
                {"id": "tax_system_2", "name": "Налоговая система II", "year": 1540, "requires": ["customs_duties"]},
                {"id": "excise_taxes", "name": "Акцизы", "year": 1550, "requires": ["tax_system_2"]},
                {"id": "state_treasury", "name": "Государственная казна", "year": 1560, "requires": ["excise_taxes"]},
                {"id": "tax_collectors", "name": "Налоговые сборщики", "year": 1570, "requires": ["state_treasury"]},
                {"id": "tax_system_3", "name": "Налоговая система III", "year": 1580, "requires": ["tax_collectors"]},
                {"id": "poll_tax", "name": "Подушная подать", "year": 1590, "requires": ["tax_system_3"]},
                {"id": "financial_management_1", "name": "Финансовое управление I", "year": 1600, "requires": ["poll_tax"]},
                {"id": "land_tax", "name": "Земельный налог", "year": 1610, "requires": ["financial_management_1"]},
                {"id": "tax_system_4", "name": "Налоговая система IV", "year": 1620, "requires": ["land_tax"]},
                {"id": "trade_duties", "name": "Торговые пошлины", "year": 1630, "requires": ["tax_system_4"]},
                {"id": "financial_management_2", "name": "Финансовое управление II", "year": 1640, "requires": ["trade_duties"]},
                {"id": "tax_reforms_1", "name": "Налоговые реформы I", "year": 1650, "requires": ["financial_management_2"]},
                # ЭПОХА РЕФОРМ (1650-1800)
                {"id": "unified_tax_system", "name": "Единая налоговая система", "year": 1660, "requires": ["tax_reforms_1"]},
                {"id": "income_tax_1", "name": "Подоходный налог I", "year": 1670, "requires": ["unified_tax_system"]},
                {"id": "tax_administration_1", "name": "Налоговая администрация I", "year": 1680, "requires": ["income_tax_1"]},
                {"id": "indirect_taxes", "name": "Косвенные налоги", "year": 1690, "requires": ["tax_administration_1"]},
                {"id": "tax_reforms_2", "name": "Налоговые реформы II", "year": 1700, "requires": ["indirect_taxes"]},
                {"id": "state_budget_1", "name": "Государственный бюджет I", "year": 1710, "requires": ["tax_reforms_2"]},
                {"id": "tax_administration_2", "name": "Налоговая администрация II", "year": 1720, "requires": ["state_budget_1"]},
                {"id": "income_tax_2", "name": "Подоходный налог II", "year": 1730, "requires": ["tax_administration_2"]},
                {"id": "state_budget_2", "name": "Государственный бюджет II", "year": 1740, "requires": ["income_tax_2"]},
                {"id": "financial_control", "name": "Финансовый контроль", "year": 1750, "requires": ["state_budget_2"]},
                {"id": "tax_reforms_3", "name": "Налоговые реформы III", "year": 1760, "requires": ["financial_control"]},
                {"id": "efficient_tax_collection", "name": "Эффективный налоговый сбор", "year": 1770, "requires": ["tax_reforms_3"]},
                {"id": "state_budget_3", "name": "Государственный бюджет III", "year": 1780, "requires": ["efficient_tax_collection"]},
                {"id": "tax_administration_3", "name": "Налоговая администрация III", "year": 1790, "requires": ["state_budget_3"]},
                {"id": "modern_tax_system", "name": "Современная налоговая система", "year": 1800, "requires": ["tax_administration_3"]},
                # СОВРЕМЕННАЯ ЭПОХА (1800-1900)
                {"id": "progressive_taxation", "name": "Прогрессивное налогообложение", "year": 1810, "requires": ["modern_tax_system"]},
                {"id": "profit_tax", "name": "Налог на прибыль", "year": 1820, "requires": ["progressive_taxation"]},
                {"id": "state_budget_4", "name": "Государственный бюджет IV", "year": 1830, "requires": ["profit_tax"]},
                {"id": "tax_inspection", "name": "Налоговая инспекция", "year": 1840, "requires": ["state_budget_4"]},
                {"id": "modern_taxation_1", "name": "Современное налогообложение I", "year": 1850, "requires": ["tax_inspection"]},
                {"id": "corporate_taxes", "name": "Корпоративные налоги", "year": 1860, "requires": ["modern_taxation_1"]},
                {"id": "financial_reporting", "name": "Финансовая отчетность", "year": 1870, "requires": ["corporate_taxes"]},
                {"id": "modern_taxation_2", "name": "Современное налогообложение II", "year": 1880, "requires": ["financial_reporting"]},
                {"id": "budget_planning", "name": "Бюджетное планирование", "year": 1890, "requires": ["modern_taxation_2"]},
                {"id": "modern_fiscal_system", "name": "Современная фискальная система", "year": 1900, "requires": ["budget_planning"]},
            ]
        }
    ]
}

# ПРОМЫШЛЕННОСТЬ
# ПРОМЫШЛЕННОСТЬ
INDUSTRY_TECH = {
    "id": "industry",
    "name": "Промышленность",
    "lines": [
        {
            "id": "metallurgy",
            "name": "Металлургия",
            "technologies": [
                # Базовый уровень (1500-1600)
                {"id": "blacksmithing", "name": "Кузнечное дело", "year": 1500, "requires": []},
                {"id": "blast_furnaces_1", "name": "Доменные печи I", "year": 1510, "requires": ["blacksmithing"]},
                
                # Разветвление: руда и печи
                {"id": "iron_ore", "name": "Железная руда", "year": 1520, "requires": ["blast_furnaces_1"]},
                {"id": "blast_furnaces_2", "name": "Доменные печи II", "year": 1530, "requires": ["blast_furnaces_1"]},
                
                # Слияние веток
                {"id": "cast_iron", "name": "Чугун", "year": 1540, "requires": ["iron_ore", "blast_furnaces_2"]},
                {"id": "wrought_iron", "name": "Кованое железо", "year": 1550, "requires": ["cast_iron"]},
                
                # Разветвление: технологии плавки
                {"id": "improved_smelting", "name": "Улучшенная плавка", "year": 1560, "requires": ["wrought_iron"]},
                {"id": "quality_iron", "name": "Качественное железо", "year": 1570, "requires": ["wrought_iron"]},
                
                # Сталь требует обе ветки
                {"id": "steel_production_1", "name": "Стальное производство I", "year": 1580, "requires": ["improved_smelting", "quality_iron"]},
                
                # Развитие (1600-1750)
                {"id": "charcoal", "name": "Древесный уголь", "year": 1620, "requires": ["steel_production_1"]},
                {"id": "foundry_production", "name": "Литейное производство", "year": 1640, "requires": ["steel_production_1"]},
                
                # Разветвление: уголь и литье
                {"id": "coal_for_metallurgy", "name": "Каменный уголь для металлургии", "year": 1660, "requires": ["charcoal"]},
                {"id": "cast_iron_casting", "name": "Чугунное литье", "year": 1670, "requires": ["foundry_production"]},
                
                {"id": "coking_coal", "name": "Коксование угля", "year": 1680, "requires": ["coal_for_metallurgy"]},
                {"id": "coke_blast_furnaces", "name": "Коксовые доменные печи", "year": 1690, "requires": ["coking_coal", "cast_iron_casting"]},
                
                {"id": "rolling_mills_1", "name": "Прокатные станы I", "year": 1720, "requires": ["coke_blast_furnaces"]},
                {"id": "puddling", "name": "Пудлингование", "year": 1730, "requires": ["coke_blast_furnaces"]},
                
                # Промышленная революция (1750-1860)
                {"id": "quality_steel", "name": "Качественная сталь", "year": 1760, "requires": ["rolling_mills_1", "puddling"]},
                
                # Разветвление: прокат и литье
                {"id": "iron_rolling", "name": "Прокат железа", "year": 1780, "requires": ["quality_steel"]},
                {"id": "cast_steel", "name": "Литая сталь", "year": 1800, "requires": ["quality_steel"]},
                
                {"id": "crucible_steel", "name": "Тигельная сталь", "year": 1810, "requires": ["cast_steel"]},
                {"id": "hot_blast", "name": "Горячее дутье", "year": 1820, "requires": ["iron_rolling"]},
                
                {"id": "quality_rolling", "name": "Качественный прокат", "year": 1840, "requires": ["hot_blast", "crucible_steel"]},
                {"id": "bessemer_process", "name": "Бессемеровский процесс", "year": 1850, "requires": ["quality_rolling"]},
                
                # Сталелитейная эпоха (1860-1900)
                {"id": "mass_steel_production", "name": "Массовое производство стали", "year": 1865, "requires": ["bessemer_process"]},
                
                # Разветвление: мартен и легирование
                {"id": "open_hearth_process", "name": "Мартеновский процесс", "year": 1870, "requires": ["mass_steel_production"]},
                {"id": "alloy_steel", "name": "Легированная сталь", "year": 1875, "requires": ["mass_steel_production"]},
                
                {"id": "high_quality_steel", "name": "Высококачественная сталь", "year": 1885, "requires": ["open_hearth_process", "alloy_steel"]},
                {"id": "electrometallurgy", "name": "Электрометаллургия", "year": 1890, "requires": ["high_quality_steel"]},
                {"id": "industrial_metallurgy", "name": "Промышленная металлургия", "year": 1900, "requires": ["electrometallurgy"]},
            ]
        },
        {
            "id": "textiles",
            "name": "Текстильная промышленность",
            "technologies": [
                # Базовый уровень (1500-1650)
                {"id": "hand_spinning", "name": "Ручное прядение", "year": 1500, "requires": []},
                {"id": "hand_weaving", "name": "Ручное ткачество", "year": 1510, "requires": ["hand_spinning"]},
                
                # Разветвление: станки и материалы
                {"id": "improved_looms", "name": "Улучшенные станки", "year": 1530, "requires": ["hand_weaving"]},
                {"id": "wool_industry", "name": "Шерстяная промышленность", "year": 1540, "requires": ["hand_weaving"]},
                
                {"id": "textile_manufactory_1", "name": "Текстильные мануфактуры I", "year": 1560, "requires": ["improved_looms", "wool_industry"]},
                
                # Разветвление: обработка и производство
                {"id": "dyeing", "name": "Красильное дело", "year": 1570, "requires": ["textile_manufactory_1"]},
                {"id": "cotton_production", "name": "Хлопковое производство", "year": 1590, "requires": ["textile_manufactory_1"]},
                
                {"id": "textile_manufactory_2", "name": "Текстильные мануфактуры II", "year": 1610, "requires": ["dyeing", "cotton_production"]},
                {"id": "printed_fabrics", "name": "Набивные ткани", "year": 1630, "requires": ["dyeing"]},
                
                # Механизация (1650-1800)
                {"id": "spinning_wheel_flyer", "name": "Прялка с рогулькой", "year": 1660, "requires": ["textile_manufactory_2"]},
                {"id": "flying_shuttle", "name": "Летучий челнок", "year": 1710, "requires": ["spinning_wheel_flyer"]},
                
                # Разветвление: прядение и ткачество
                {"id": "spinning_jenny", "name": "Прядильная машина Харгривса", "year": 1720, "requires": ["flying_shuttle"]},
                {"id": "water_frame", "name": "Ватерная прядильная машина", "year": 1730, "requires": ["flying_shuttle"]},
                
                {"id": "spinning_mule", "name": "Мюль-машина", "year": 1740, "requires": ["spinning_jenny", "water_frame"]},
                
                # Разветвление: механическое прядение и ткачество
                {"id": "mechanical_spinning", "name": "Механическое прядение", "year": 1750, "requires": ["spinning_mule"]},
                {"id": "power_loom", "name": "Механический ткацкий станок", "year": 1760, "requires": ["spinning_mule"]},
                
                {"id": "cotton_gin", "name": "Хлопкоочистительная машина", "year": 1790, "requires": ["mechanical_spinning"]},
                {"id": "factory_production_textile", "name": "Фабричное производство", "year": 1800, "requires": ["mechanical_spinning", "power_loom"]},
                
                # Индустриальная эпоха (1800-1900)
                {"id": "steam_powered_looms", "name": "Паровые ткацкие станки", "year": 1810, "requires": ["factory_production_textile"]},
                {"id": "jacquard_loom", "name": "Жаккардовый станок", "year": 1820, "requires": ["steam_powered_looms"]},
                {"id": "mass_fabric_production", "name": "Массовое производство тканей", "year": 1830, "requires": ["jacquard_loom"]},
                
                # Разветвление: станки и красители
                {"id": "improved_looms_industrial", "name": "Улучшенные станки", "year": 1840, "requires": ["mass_fabric_production"]},
                {"id": "synthetic_dyes", "name": "Синтетические красители", "year": 1850, "requires": ["mass_fabric_production"]},
                
                {"id": "industrial_textiles", "name": "Промышленный текстиль", "year": 1860, "requires": ["improved_looms_industrial", "synthetic_dyes"]},
                {"id": "automated_looms", "name": "Автоматизированные станки", "year": 1880, "requires": ["industrial_textiles"]},
                {"id": "modern_textile_industry", "name": "Современная текстильная промышленность", "year": 1890, "requires": ["automated_looms"]},
            ]
        },
        {
            "id": "energy",
            "name": "Энергетика",
            "technologies": [
                # Базовый уровень (1500-1650)
                {"id": "water_mills", "name": "Водяные мельницы", "year": 1500, "requires": []},
                
                # Разветвление: водяные и ветряные
                {"id": "improved_water_wheels", "name": "Улучшенные водяные колеса", "year": 1510, "requires": ["water_mills"]},
                {"id": "windmills", "name": "Ветряные мельницы", "year": 1520, "requires": ["water_mills"]},
                
                {"id": "mechanical_transmissions", "name": "Механические передачи", "year": 1540, "requires": ["improved_water_wheels", "windmills"]},
                {"id": "industrial_water_wheels", "name": "Промышленные водяные колеса", "year": 1570, "requires": ["mechanical_transmissions"]},
                
                # Разветвление: гидравлика и насосы
                {"id": "pumps", "name": "Насосы", "year": 1590, "requires": ["industrial_water_wheels"]},
                {"id": "hydraulic_systems", "name": "Гидравлические системы", "year": 1600, "requires": ["industrial_water_wheels"]},
                
                {"id": "water_power", "name": "Водяная энергия", "year": 1640, "requires": ["pumps", "hydraulic_systems"]},
                
                # Паровая революция (1650-1800)
                {"id": "vacuum_pumps", "name": "Вакуумные насосы", "year": 1660, "requires": ["water_power"]},
                {"id": "savery_pump", "name": "Паровой насос Севери", "year": 1680, "requires": ["vacuum_pumps"]},
                {"id": "newcomen_engine", "name": "Паровая машина Ньюкомена", "year": 1690, "requires": ["savery_pump"]},
                {"id": "industrial_steam_engines", "name": "Промышленные паровые машины", "year": 1720, "requires": ["newcomen_engine"]},
                
                # Разветвление: Уатт и применение
                {"id": "watt_condenser", "name": "Конденсатор Уатта", "year": 1730, "requires": ["industrial_steam_engines"]},
                {"id": "watt_engine", "name": "Паровая машина Уатта", "year": 1740, "requires": ["watt_condenser"]},
                
                {"id": "rotary_steam_engine", "name": "Ротативная паровая машина", "year": 1760, "requires": ["watt_engine"]},
                {"id": "high_pressure_steam", "name": "Высокого давления паровые машины", "year": 1780, "requires": ["watt_engine"]},
                
                {"id": "industrial_steam_power", "name": "Промышленная паровая энергия", "year": 1800, "requires": ["rotary_steam_engine", "high_pressure_steam"]},
                
                # Промышленная эпоха (1800-1890)
                {"id": "efficient_steam_engines", "name": "Эффективные паровые двигатели", "year": 1830, "requires": ["industrial_steam_power"]},
                
                # Разветвление: турбины и компаунд
                {"id": "steam_turbines", "name": "Паровые турбины", "year": 1840, "requires": ["efficient_steam_engines"]},
                {"id": "compound_engines", "name": "Компаунд-машины", "year": 1850, "requires": ["efficient_steam_engines"]},
                
                {"id": "industrial_turbines", "name": "Промышленные турбины", "year": 1870, "requires": ["steam_turbines", "compound_engines"]},
                {"id": "electric_generators", "name": "Электрогенераторы", "year": 1880, "requires": ["industrial_turbines"]},
                
                # Электрическая эра (1890-1900)
                {"id": "dynamos", "name": "Динамо-машины", "year": 1891, "requires": ["electric_generators"]},
                {"id": "power_stations", "name": "Электростанции", "year": 1893, "requires": ["dynamos"]},
                {"id": "electric_grids", "name": "Электрические сети", "year": 1895, "requires": ["power_stations"]},
                {"id": "industrial_electrification", "name": "Промышленная электрификация", "year": 1900, "requires": ["electric_grids"]},
            ]
        },
        {
            "id": "chemistry",
            "name": "Химия и материалы",
            "technologies": [
                # Базовый уровень (1500-1700)
                {"id": "alchemy", "name": "Алхимия", "year": 1500, "requires": []},
                {"id": "minerals", "name": "Минералы", "year": 1510, "requires": ["alchemy"]},
                
                # Разветвление: кислоты и щелочи
                {"id": "acids", "name": "Кислоты", "year": 1520, "requires": ["minerals"]},
                {"id": "alkalis", "name": "Щелочи", "year": 1530, "requires": ["minerals"]},
                
                {"id": "chemistry_basics", "name": "Основы химии", "year": 1550, "requires": ["acids", "alkalis"]},
                
                # Разветвление: порох и стекло
                {"id": "experimental_chemistry", "name": "Экспериментальная химия", "year": 1570, "requires": ["chemistry_basics"]},
                {"id": "gunpowder_production", "name": "Порох производство", "year": 1580, "requires": ["experimental_chemistry"]},
                {"id": "glass_production", "name": "Стекольное производство", "year": 1600, "requires": ["experimental_chemistry"]},
                
                {"id": "saltpeter", "name": "Селитра", "year": 1640, "requires": ["gunpowder_production"]},
                {"id": "basic_chemistry", "name": "Основная химия", "year": 1650, "requires": ["saltpeter", "glass_production"]},
                
                # Разветвление: кислоты
                {"id": "hydrochloric_acid", "name": "Соляная кислота", "year": 1670, "requires": ["basic_chemistry"]},
                {"id": "sulfuric_acid", "name": "Серная кислота", "year": 1680, "requires": ["basic_chemistry"]},
                
                {"id": "industrial_chemistry_1", "name": "Промышленная химия I", "year": 1700, "requires": ["hydrochloric_acid", "sulfuric_acid"]},
                
                # Развитие (1700-1850)
                {"id": "chlorine", "name": "Хлор", "year": 1710, "requires": ["industrial_chemistry_1"]},
                {"id": "bleaching_powder", "name": "Отбеливающий порошок", "year": 1720, "requires": ["chlorine"]},
                {"id": "industrial_chemistry_2", "name": "Промышленная химия II", "year": 1740, "requires": ["bleaching_powder"]},
                
                # Разветвление: сода и аммиак
                {"id": "soda", "name": "Сода", "year": 1750, "requires": ["industrial_chemistry_2"]},
                {"id": "ammonia", "name": "Аммиак", "year": 1760, "requires": ["industrial_chemistry_2"]},
                
                {"id": "leblanc_process", "name": "Процесс Леблана", "year": 1770, "requires": ["soda", "ammonia"]},
                {"id": "chemical_industry", "name": "Химическая промышленность", "year": 1780, "requires": ["leblanc_process"]},
                {"id": "solvay_process", "name": "Процесс Сольве", "year": 1830, "requires": ["chemical_industry"]},
                {"id": "chemical_fertilizers", "name": "Химические удобрения", "year": 1850, "requires": ["solvay_process"]},
                
                # Органическая химия (1850-1900)
                {"id": "aniline_dyes", "name": "Анилиновые красители", "year": 1860, "requires": ["chemical_fertilizers"]},
                {"id": "organic_chemistry", "name": "Органическая химия", "year": 1870, "requires": ["aniline_dyes"]},
                
                # Разветвление: взрывчатка и красители
                {"id": "explosives", "name": "Взрывчатые вещества", "year": 1875, "requires": ["organic_chemistry"]},
                {"id": "synthetic_dyes_chem", "name": "Синтетические красители", "year": 1880, "requires": ["organic_chemistry"]},
                
                {"id": "dynamite", "name": "Динамит", "year": 1880, "requires": ["explosives"]},
                {"id": "smokeless_powder_chem", "name": "Бездымный порох", "year": 1895, "requires": ["dynamite", "synthetic_dyes_chem"]},
                {"id": "modern_chemical_industry", "name": "Современная химическая промышленность", "year": 1900, "requires": ["smokeless_powder_chem"]},
            ]
        },
        {
            "id": "production_methods",
            "name": "Производственные методы",
            "technologies": [
                # Базовый уровень (1500-1650)
                {"id": "guild_production", "name": "Цеховое производство", "year": 1500, "requires": []},
                {"id": "craft_guilds", "name": "Ремесленные гильдии", "year": 1510, "requires": ["guild_production"]},
                {"id": "workshops", "name": "Мастерские", "year": 1520, "requires": ["craft_guilds"]},
                
                # Разветвление: специализация и качество
                {"id": "labor_specialization", "name": "Специализация труда", "year": 1530, "requires": ["workshops"]},
                {"id": "quality_craftsmanship", "name": "Качественное ремесло", "year": 1540, "requires": ["workshops"]},
                
                {"id": "early_manufactories", "name": "Ранние мануфактуры", "year": 1570, "requires": ["labor_specialization", "quality_craftsmanship"]},
                {"id": "manufactory_production", "name": "Мануфактурное производство", "year": 1590, "requires": ["early_manufactories"]},
                {"id": "large_manufactories", "name": "Крупные мануфактуры", "year": 1630, "requires": ["manufactory_production"]},
                
                # Переход к фабрикам (1650-1800)
                {"id": "production_organization", "name": "Организация производства", "year": 1670, "requires": ["large_manufactories"]},
                {"id": "machine_production", "name": "Машинное производство", "year": 1690, "requires": ["production_organization"]},
                {"id": "early_factories", "name": "Ранние фабрики", "year": 1700, "requires": ["machine_production"]},
                
                # Разветвление: механизация и стандартизация
                {"id": "mechanized_production", "name": "Механизированное производство", "year": 1710, "requires": ["early_factories"]},
                {"id": "standard_parts", "name": "Стандартные детали", "year": 1740, "requires": ["early_factories"]},
                
                {"id": "factory_system", "name": "Фабричная система", "year": 1750, "requires": ["mechanized_production", "standard_parts"]},
                {"id": "steam_factories", "name": "Паровые фабрики", "year": 1760, "requires": ["factory_system"]},
                {"id": "industrial_production_prod", "name": "Индустриальное производство", "year": 1780, "requires": ["steam_factories"]},
                {"id": "factory_production_methods", "name": "Заводское производство", "year": 1800, "requires": ["industrial_production_prod"]},
                
                # Массовое производство (1800-1900)
                {"id": "interchangeable_parts", "name": "Взаимозаменяемые детали", "year": 1810, "requires": ["factory_production_methods"]},
                {"id": "standardization", "name": "Стандартизация", "year": 1820, "requires": ["interchangeable_parts"]},
                
                # Разветвление: машиностроение и точность
                {"id": "machine_building", "name": "Машиностроение", "year": 1830, "requires": ["standardization"]},
                {"id": "precision_tools", "name": "Точные станки", "year": 1840, "requires": ["standardization"]},
                
                {"id": "assembly_line", "name": "Конвейерная сборка", "year": 1860, "requires": ["machine_building", "precision_tools"]},
                {"id": "mass_production", "name": "Массовое производство", "year": 1870, "requires": ["assembly_line"]},
                {"id": "production_electrification", "name": "Электрификация производства", "year": 1880, "requires": ["mass_production"]},
                {"id": "modern_factories", "name": "Современные заводы", "year": 1895, "requires": ["production_electrification"]},
                {"id": "industrial_organization", "name": "Промышленная организация", "year": 1900, "requires": ["modern_factories"]},
            ]
        }
    ]
}

# ИНФРАСТРУКТУРА
INFRASTRUCTURE_TECH = {
    "id": "infrastructure",
    "name": "Инфраструктура",
    "lines": [
        {
            "id": "roads_transport",
            "name": "Дороги и транспорт",
            "technologies": [
                # Базовый уровень (1500-1650)
                {"id": "dirt_roads", "name": "Грунтовые дороги", "year": 1500, "requires": []},
                {"id": "improved_dirt_roads", "name": "Улучшенные грунтовые дороги", "year": 1510, "requires": ["dirt_roads"]},
                {"id": "paved_roads_1", "name": "Мощеные дороги I", "year": 1520, "requires": ["improved_dirt_roads"]},
                {"id": "road_construction", "name": "Дорожное строительство", "year": 1530, "requires": ["paved_roads_1"]},
                {"id": "paved_roads_2", "name": "Мощеные дороги II", "year": 1540, "requires": ["road_construction"]},
                {"id": "post_stations_roads", "name": "Почтовые станции", "year": 1550, "requires": ["paved_roads_2"]},
                {"id": "road_network_1", "name": "Дорожная сеть I", "year": 1560, "requires": ["post_stations_roads"]},
                {"id": "bridges_1", "name": "Мосты I", "year": 1570, "requires": ["road_network_1"]},
                {"id": "stone_bridges", "name": "Каменные мосты", "year": 1580, "requires": ["bridges_1"]},
                {"id": "road_network_2", "name": "Дорожная сеть II", "year": 1590, "requires": ["stone_bridges"]},
                {"id": "post_roads", "name": "Почтовые тракты", "year": 1600, "requires": ["road_network_2"]},
                {"id": "bridges_2", "name": "Мосты II", "year": 1610, "requires": ["post_roads"]},
                {"id": "road_maintenance", "name": "Дорожное обслуживание", "year": 1620, "requires": ["bridges_2"]},
                {"id": "road_network_3", "name": "Дорожная сеть III", "year": 1630, "requires": ["road_maintenance"]},
                {"id": "large_bridges", "name": "Крупные мосты", "year": 1640, "requires": ["road_network_3"]},
                {"id": "main_roads", "name": "Магистральные дороги", "year": 1650, "requires": ["large_bridges"]},
                
                # Эпоха улучшений (1650-1800)
                {"id": "road_surfacing", "name": "Дорожные покрытия", "year": 1660, "requires": ["main_roads"]},
                {"id": "improved_bridges", "name": "Улучшенные мосты", "year": 1670, "requires": ["road_surfacing"]},
                {"id": "canals_1", "name": "Каналы I", "year": 1680, "requires": ["improved_bridges"]},
                {"id": "locks", "name": "Шлюзы", "year": 1690, "requires": ["canals_1"]},
                {"id": "canals_2", "name": "Каналы II", "year": 1700, "requires": ["locks"]},
                {"id": "road_system", "name": "Дорожная система", "year": 1710, "requires": ["canals_2"]},
                {"id": "macadam_roads", "name": "Макадамовское покрытие", "year": 1720, "requires": ["road_system"]},
                {"id": "canals_3", "name": "Каналы III", "year": 1730, "requires": ["macadam_roads"]},
                {"id": "river_navigation", "name": "Речное судоходство", "year": 1740, "requires": ["canals_3"]},
                {"id": "improved_canals", "name": "Улучшенные каналы", "year": 1750, "requires": ["river_navigation"]},
                {"id": "modern_bridges", "name": "Современные мосты", "year": 1760, "requires": ["improved_canals"]},
                {"id": "road_infrastructure", "name": "Дорожная инфраструктура", "year": 1770, "requires": ["modern_bridges"]},
                {"id": "navigable_canals", "name": "Судоходные каналы", "year": 1780, "requires": ["road_infrastructure"]},
                {"id": "quality_roads", "name": "Качественные дороги", "year": 1790, "requires": ["navigable_canals"]},
                {"id": "transport_system", "name": "Транспортная система", "year": 1800, "requires": ["quality_roads"]},
                
                # Железнодорожная эпоха (1800-1870)
                {"id": "rail_tracks", "name": "Рельсовые пути", "year": 1810, "requires": ["transport_system"]},
                {"id": "steam_locomotives_1", "name": "Паровозы I", "year": 1820, "requires": ["rail_tracks"]},
                {"id": "railways_1", "name": "Железные дороги I", "year": 1825, "requires": ["steam_locomotives_1"]},
                {"id": "steam_locomotives_2", "name": "Паровозы II", "year": 1830, "requires": ["railways_1"]},
                {"id": "railways_2", "name": "Железные дороги II", "year": 1835, "requires": ["steam_locomotives_2"]},
                {"id": "railway_network_1", "name": "Железнодорожная сеть I", "year": 1840, "requires": ["railways_2"]},
                {"id": "improved_locomotives", "name": "Улучшенные локомотивы", "year": 1845, "requires": ["railway_network_1"]},
                {"id": "railway_network_2", "name": "Железнодорожная сеть II", "year": 1850, "requires": ["improved_locomotives"]},
                {"id": "railway_bridges", "name": "Железнодорожные мосты", "year": 1855, "requires": ["railway_network_2"]},
                {"id": "railway_network_3", "name": "Железнодорожная сеть III", "year": 1860, "requires": ["railway_bridges"]},
                {"id": "modern_locomotives", "name": "Современные локомотивы", "year": 1865, "requires": ["railway_network_3"]},
                {"id": "national_railway_network", "name": "Национальная железнодорожная сеть", "year": 1870, "requires": ["modern_locomotives"]},
                
                # Современная эпоха (1870-1900)
                {"id": "steel_rails", "name": "Стальные рельсы", "year": 1875, "requires": ["national_railway_network"]},
                {"id": "railway_stations", "name": "Железнодорожные вокзалы", "year": 1880, "requires": ["steel_rails"]},
                {"id": "high_speed_trains", "name": "Скоростные поезда", "year": 1885, "requires": ["railway_stations"]},
                {"id": "electric_trams", "name": "Электрические трамваи", "year": 1890, "requires": ["high_speed_trains"]},
                {"id": "metro", "name": "Метрополитен", "year": 1895, "requires": ["electric_trams"]},
                {"id": "modern_transport_system", "name": "Современная транспортная система", "year": 1900, "requires": ["metro"]},
            ]
        },
        {
            "id": "urban_construction",
            "name": "Городское строительство",
            "technologies": [
                # Базовый уровень (1500-1650)
                {"id": "wooden_construction", "name": "Деревянное строительство", "year": 1500, "requires": []},
                {"id": "stone_construction", "name": "Каменное строительство", "year": 1510, "requires": ["wooden_construction"]},
                {"id": "brick_production", "name": "Кирпичное производство", "year": 1520, "requires": ["stone_construction"]},
                {"id": "city_fortifications_1", "name": "Городские укрепления I", "year": 1530, "requires": ["brick_production"]},
                {"id": "brick_construction", "name": "Кирпичное строительство", "year": 1540, "requires": ["city_fortifications_1"]},
                {"id": "city_fortifications_2", "name": "Городские укрепления II", "year": 1550, "requires": ["brick_construction"]},
                {"id": "multi_story_buildings", "name": "Многоэтажные здания", "year": 1560, "requires": ["city_fortifications_2"]},
                {"id": "urban_planning_1", "name": "Городское планирование I", "year": 1570, "requires": ["multi_story_buildings"]},
                {"id": "public_buildings", "name": "Общественные здания", "year": 1580, "requires": ["urban_planning_1"]},
                {"id": "city_fortifications_3", "name": "Городские укрепления III", "year": 1590, "requires": ["public_buildings"]},
                {"id": "sewerage_1", "name": "Канализация I", "year": 1600, "requires": ["city_fortifications_3"]},
                {"id": "water_supply", "name": "Водопроводы", "year": 1610, "requires": ["sewerage_1"]},
                {"id": "urban_planning_2", "name": "Городское планирование II", "year": 1620, "requires": ["water_supply"]},
                {"id": "improved_sewerage", "name": "Улучшенная канализация", "year": 1630, "requires": ["urban_planning_2"]},
                {"id": "administrative_buildings", "name": "Административные здания", "year": 1640, "requires": ["improved_sewerage"]},
                {"id": "urban_infrastructure_1", "name": "Городская инфраструктура I", "year": 1650, "requires": ["administrative_buildings"]},
                
                # Развитие (1650-1800)
                {"id": "regular_layout", "name": "Регулярная застройка", "year": 1660, "requires": ["urban_infrastructure_1"]},
                {"id": "city_squares", "name": "Городские площади", "year": 1670, "requires": ["regular_layout"]},
                {"id": "improved_water_supply", "name": "Улучшенные водопроводы", "year": 1680, "requires": ["city_squares"]},
                {"id": "urban_infrastructure_2", "name": "Городская инфраструктура II", "year": 1690, "requires": ["improved_water_supply"]},
                {"id": "bastion_fortifications", "name": "Бастионные укрепления", "year": 1700, "requires": ["urban_infrastructure_2"]},
                {"id": "public_parks", "name": "Общественные парки", "year": 1710, "requires": ["bastion_fortifications"]},
                {"id": "street_lighting_1", "name": "Городское освещение I", "year": 1720, "requires": ["public_parks"]},
                {"id": "wide_streets", "name": "Широкие улицы", "year": 1730, "requires": ["street_lighting_1"]},
                {"id": "urban_infrastructure_3", "name": "Городская инфраструктура III", "year": 1740, "requires": ["wide_streets"]},
                {"id": "improved_lighting", "name": "Улучшенное освещение", "year": 1750, "requires": ["urban_infrastructure_3"]},
                {"id": "stone_embankments", "name": "Каменные набережные", "year": 1760, "requires": ["improved_lighting"]},
                {"id": "urban_improvement", "name": "Городское благоустройство", "year": 1770, "requires": ["stone_embankments"]},
                {"id": "centralized_sewerage", "name": "Централизованная канализация", "year": 1780, "requires": ["urban_improvement"]},
                {"id": "urban_planning_3", "name": "Городское планирование III", "year": 1790, "requires": ["centralized_sewerage"]},
                {"id": "modern_development", "name": "Современная застройка", "year": 1800, "requires": ["urban_planning_3"]},
                
                # Индустриальная эпоха (1800-1900)
                {"id": "industrial_districts", "name": "Промышленные кварталы", "year": 1810, "requires": ["modern_development"]},
                {"id": "reinforced_concrete", "name": "Железобетон", "year": 1820, "requires": ["industrial_districts"]},
                {"id": "high_rise_development", "name": "Многоэтажная застройка", "year": 1830, "requires": ["reinforced_concrete"]},
                {"id": "gas_lighting", "name": "Газовое освещение", "year": 1840, "requires": ["high_rise_development"]},
                {"id": "urban_sanitation", "name": "Городская санитария", "year": 1850, "requires": ["gas_lighting"]},
                {"id": "modern_sewerage", "name": "Современная канализация", "year": 1860, "requires": ["urban_sanitation"]},
                {"id": "high_pressure_water", "name": "Водопровод высокого давления", "year": 1870, "requires": ["modern_sewerage"]},
                {"id": "electric_lighting", "name": "Электрическое освещение", "year": 1880, "requires": ["high_pressure_water"]},
                {"id": "skyscrapers", "name": "Небоскребы", "year": 1890, "requires": ["electric_lighting"]},
                {"id": "modern_urban_planning", "name": "Современное городское планирование", "year": 1900, "requires": ["skyscrapers"]},
            ]
        },
        {
            "id": "port_infrastructure",
            "name": "Портовая инфраструктура",
            "technologies": [
                # Базовый уровень (1500-1650)
                {"id": "wooden_piers", "name": "Деревянные причалы", "year": 1500, "requires": []},
                {"id": "port_facilities", "name": "Портовые сооружения", "year": 1510, "requires": ["wooden_piers"]},
                {"id": "improved_piers", "name": "Улучшенные причалы", "year": 1520, "requires": ["port_facilities"]},
                {"id": "port_warehouses_1", "name": "Портовые склады I", "year": 1530, "requires": ["improved_piers"]},
                {"id": "stone_moles", "name": "Каменные молы", "year": 1540, "requires": ["port_warehouses_1"]},
                {"id": "port_warehouses_2", "name": "Портовые склады II", "year": 1550, "requires": ["stone_moles"]},
                {"id": "harbors_1", "name": "Гавани I", "year": 1560, "requires": ["port_warehouses_2"]},
                {"id": "docks", "name": "Доки", "year": 1570, "requires": ["harbors_1"]},
                {"id": "harbors_2", "name": "Гавани II", "year": 1580, "requires": ["docks"]},
                {"id": "improved_docks", "name": "Улучшенные доки", "year": 1590, "requires": ["harbors_2"]},
                {"id": "port_infrastructure_1", "name": "Портовая инфраструктура I", "year": 1600, "requires": ["improved_docks"]},
                {"id": "shipyards_1", "name": "Верфи I", "year": 1610, "requires": ["port_infrastructure_1"]},
                {"id": "port_dredging", "name": "Портовое углубление", "year": 1620, "requires": ["shipyards_1"]},
                {"id": "shipyards_2", "name": "Верфи II", "year": 1630, "requires": ["port_dredging"]},
                {"id": "port_infrastructure_2", "name": "Портовая инфраструктура II", "year": 1640, "requires": ["shipyards_2"]},
                {"id": "large_harbors", "name": "Крупные гавани", "year": 1650, "requires": ["port_infrastructure_2"]},
                
                # Развитие (1650-1800)
                {"id": "stone_docks", "name": "Каменные доки", "year": 1660, "requires": ["large_harbors"]},
                {"id": "dry_docks_1", "name": "Сухие доки I", "year": 1670, "requires": ["stone_docks"]},
                {"id": "port_cranes", "name": "Портовые краны", "year": 1680, "requires": ["dry_docks_1"]},
                {"id": "dry_docks_2", "name": "Сухие доки II", "year": 1690, "requires": ["port_cranes"]},
                {"id": "improved_shipyards", "name": "Улучшенные верфи", "year": 1700, "requires": ["dry_docks_2"]},
                {"id": "port_infrastructure_3", "name": "Портовая инфраструктура III", "year": 1710, "requires": ["improved_shipyards"]},
                {"id": "deep_water_ports", "name": "Глубоководные порты", "year": 1720, "requires": ["port_infrastructure_3"]},
                {"id": "lighthouses_port", "name": "Маяки", "year": 1730, "requires": ["deep_water_ports"]},
                {"id": "modern_docks", "name": "Современные доки", "year": 1740, "requires": ["lighthouses_port"]},
                {"id": "port_equipment", "name": "Портовое оборудование", "year": 1750, "requires": ["modern_docks"]},
                {"id": "improved_lighthouses", "name": "Улучшенные маяки", "year": 1760, "requires": ["port_equipment"]},
                {"id": "large_shipyards", "name": "Крупные верфи", "year": 1770, "requires": ["improved_lighthouses"]},
                {"id": "port_infrastructure_4", "name": "Портовая инфраструктура IV", "year": 1780, "requires": ["large_shipyards"]},
                {"id": "stone_breakwaters", "name": "Каменные волноломы", "year": 1790, "requires": ["port_infrastructure_4"]},
                {"id": "modern_harbors", "name": "Современные гавани", "year": 1800, "requires": ["stone_breakwaters"]},
                
                # Индустриальная эпоха (1800-1900)
                {"id": "steam_cranes", "name": "Паровые краны", "year": 1810, "requires": ["modern_harbors"]},
                {"id": "iron_docks", "name": "Железные доки", "year": 1820, "requires": ["steam_cranes"]},
                {"id": "modern_shipyards", "name": "Современные верфи", "year": 1830, "requires": ["iron_docks"]},
                {"id": "port_railway", "name": "Портовая железная дорога", "year": 1840, "requires": ["modern_shipyards"]},
                {"id": "steel_docks", "name": "Стальные доки", "year": 1850, "requires": ["port_railway"]},
                {"id": "mechanized_loading", "name": "Механизированная погрузка", "year": 1860, "requires": ["steel_docks"]},
                {"id": "modern_port_infrastructure", "name": "Современная портовая инфраструктура", "year": 1870, "requires": ["mechanized_loading"]},
                {"id": "electric_cranes", "name": "Электрические краны", "year": 1880, "requires": ["modern_port_infrastructure"]},
                {"id": "modern_shipyards_2", "name": "Современные верфи II", "year": 1890, "requires": ["electric_cranes"]},
                {"id": "industrial_ports", "name": "Индустриальные порты", "year": 1900, "requires": ["modern_shipyards_2"]},
            ]
        },
        {
            "id": "communications",
            "name": "Связь и коммуникации",
            "technologies": [
                # Базовый уровень (1500-1700)
                {"id": "courier_service", "name": "Курьерская служба", "year": 1500, "requires": []},
                {"id": "post_stations_comm_1", "name": "Почтовые станции I", "year": 1510, "requires": ["courier_service"]},
                {"id": "postal_service", "name": "Почтовая служба", "year": 1520, "requires": ["post_stations_comm_1"]},
                {"id": "post_stations_comm_2", "name": "Почтовые станции II", "year": 1530, "requires": ["postal_service"]},
                {"id": "regular_mail", "name": "Регулярная почта", "year": 1540, "requires": ["post_stations_comm_2"]},
                {"id": "postal_routes", "name": "Почтовые тракты", "year": 1550, "requires": ["regular_mail"]},
                {"id": "state_post", "name": "Государственная почта", "year": 1560, "requires": ["postal_routes"]},
                {"id": "mail_routes", "name": "Почтовые маршруты", "year": 1570, "requires": ["state_post"]},
                {"id": "improved_mail", "name": "Улучшенная почта", "year": 1580, "requires": ["mail_routes"]},
                {"id": "post_offices", "name": "Почтовые конторы", "year": 1590, "requires": ["improved_mail"]},
                {"id": "fast_mail", "name": "Быстрая почта", "year": 1600, "requires": ["post_offices"]},
                {"id": "postal_network_1", "name": "Почтовая сеть I", "year": 1610, "requires": ["fast_mail"]},
                {"id": "mail_coaches", "name": "Почтовые кареты", "year": 1620, "requires": ["postal_network_1"]},
                {"id": "postal_network_2", "name": "Почтовая сеть II", "year": 1630, "requires": ["mail_coaches"]},
                {"id": "regular_routes", "name": "Регулярные маршруты", "year": 1640, "requires": ["postal_network_2"]},
                {"id": "postal_system", "name": "Почтовая система", "year": 1650, "requires": ["regular_routes"]},
                {"id": "improved_postal_service", "name": "Улучшенная почтовая служба", "year": 1660, "requires": ["postal_system"]},
                {"id": "post_stations_comm_3", "name": "Почтовые станции III", "year": 1670, "requires": ["improved_postal_service"]},
                {"id": "efficient_mail", "name": "Эффективная почта", "year": 1680, "requires": ["post_stations_comm_3"]},
                {"id": "postal_network_3", "name": "Почтовая сеть III", "year": 1690, "requires": ["efficient_mail"]},
                {"id": "modern_postal_service", "name": "Современная почтовая служба", "year": 1700, "requires": ["postal_network_3"]},
                
                # Эпоха инноваций (1700-1850)
                {"id": "optical_telegraph_1", "name": "Оптический телеграф I", "year": 1710, "requires": ["modern_postal_service"]},
                {"id": "semaphore_communication", "name": "Семафорная связь", "year": 1720, "requires": ["optical_telegraph_1"]},
                {"id": "optical_telegraph_2", "name": "Оптический телеграф II", "year": 1730, "requires": ["semaphore_communication"]},
                {"id": "signal_towers", "name": "Сигнальные башни", "year": 1740, "requires": ["optical_telegraph_2"]},
                {"id": "telegraph_network_1", "name": "Телеграфная сеть I", "year": 1750, "requires": ["signal_towers"]},
                {"id": "improved_semaphore", "name": "Улучшенный семафор", "year": 1760, "requires": ["telegraph_network_1"]},
                {"id": "telegraph_network_2", "name": "Телеграфная сеть II", "year": 1770, "requires": ["improved_semaphore"]},
                {"id": "railway_mail", "name": "Железнодорожная почта", "year": 1780, "requires": ["telegraph_network_2"]},
                {"id": "fast_communication", "name": "Быстрая связь", "year": 1790, "requires": ["railway_mail"]},
                {"id": "modern_postal_system", "name": "Современная почтовая система", "year": 1800, "requires": ["fast_communication"]},
                {"id": "electric_telegraph_1", "name": "Электрический телеграф I", "year": 1810, "requires": ["modern_postal_system"]},
                {"id": "telegraph_lines", "name": "Телеграфные линии", "year": 1820, "requires": ["electric_telegraph_1"]},
                {"id": "electric_telegraph_2", "name": "Электрический телеграф II", "year": 1830, "requires": ["telegraph_lines"]},
                {"id": "morse_code", "name": "Азбука Морзе", "year": 1840, "requires": ["electric_telegraph_2"]},
                {"id": "telegraph_network_3", "name": "Телеграфная сеть III", "year": 1850, "requires": ["morse_code"]},
                
                # Электрическая эпоха (1850-1900)
                {"id": "undersea_cables", "name": "Подводные кабели", "year": 1860, "requires": ["telegraph_network_3"]},
                {"id": "international_telegraph", "name": "Международный телеграф", "year": 1865, "requires": ["undersea_cables"]},
                {"id": "telephone_1", "name": "Телефон I", "year": 1870, "requires": ["international_telegraph"]},
                {"id": "telephone_lines", "name": "Телефонные линии", "year": 1875, "requires": ["telephone_1"]},
                {"id": "telephone_2", "name": "Телефон II", "year": 1880, "requires": ["telephone_lines"]},
                {"id": "telephone_exchanges", "name": "Телефонные станции", "year": 1885, "requires": ["telephone_2"]},
                {"id": "long_distance_communication", "name": "Междугородняя связь", "year": 1890, "requires": ["telephone_exchanges"]},
                {"id": "wireless_telegraph", "name": "Радиотелеграф", "year": 1895, "requires": ["long_distance_communication"]},
                {"id": "modern_communications", "name": "Современные коммуникации", "year": 1900, "requires": ["wireless_telegraph"]},
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
            {"id": "education", "name": "Наука и образование"},
            {"id": "economy", "name": "Экономика и торговля"},
            {"id": "industry", "name": "Промышленность"},
            {"id": "infrastructure", "name": "Инфраструктура"}
        ]
    })

@router.get("/tree/{category}")
async def get_tech_tree(category: str):
    """Получить древо технологий для указанной категории"""
    if category == "land_forces":
        return JSONResponse({"success": True, "data": LAND_FORCES_TECH})
    elif category == "navy":
        return JSONResponse({"success": True, "data": NAVY_TECH})
    elif category == "education":
        return JSONResponse({"success": True, "data": EDUCATION_TECH})
    elif category == "economy":
        return JSONResponse({"success": True, "data": ECONOMY_TECH})
    elif category == "industry":
        return JSONResponse({"success": True, "data": INDUSTRY_TECH})
    elif category == "infrastructure":
        return JSONResponse({"success": True, "data": INFRASTRUCTURE_TECH})
    else:
        return JSONResponse({"success": False, "error": "Unknown category"}, status_code=404)

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
