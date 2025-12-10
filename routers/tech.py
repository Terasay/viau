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

@router.get("/categories")
async def get_tech_categories():
    """Получить список всех доступных категорий технологий"""
    return JSONResponse({
        "success": True,
        "categories": [
            {"id": "land_forces", "name": "Сухопутные войска"},
            {"id": "navy", "name": "Военно-морской флот"}
        ]
    })

@router.get("/tree/{category}")
async def get_tech_tree(category: str):
    """Получить древо технологий для указанной категории"""
    if category == "land_forces":
        return JSONResponse({"success": True, "data": LAND_FORCES_TECH})
    elif category == "navy":
        return JSONResponse({"success": True, "data": NAVY_TECH})
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
