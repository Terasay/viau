from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
import sqlite3
import sys
from datetime import datetime

router = APIRouter(prefix="/api/tech", tags=["technologies"])

def get_db():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn

async def get_current_user(request: Request):
    """Получение текущего пользователя из токена"""
    from main import get_current_user as main_get_current_user
    return await main_get_current_user(request)

def init_tech_db():
    """Инициализация таблицы прогресса технологий"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS country_technologies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country_id TEXT NOT NULL,
            tech_id TEXT NOT NULL,
            researched_at TEXT NOT NULL,
            UNIQUE(country_id, tech_id),
            FOREIGN KEY (country_id) REFERENCES countries (id)
        )
    ''')
    
    conn.commit()
    conn.close()

init_tech_db()

# СУХОПУТНЫЕ ВОЙСКА
LAND_FORCES_TECH = {
    "id": "land_forces",
    "name": "Сухопутные войска",
    "lines": [
        {
            "id": "firearms",
            "name": "Огнестрельное оружие пехоты",
            "technologies": [
                {"id": "arquebus", "name": "Аркебузы", "year": 1500, "requires": []},
                {"id": "hand_cannons", "name": "Ручницы", "year": 1500, "requires": []},
                {"id": "matchlock", "name": "Фитильные замки", "year": 1525, "requires": ["arquebus", "gunpowder_production"]},
                {"id": "improved_gunpowder", "name": "Улучшенный порох", "year": 1530, "requires": ["basic_chemistry", "arquebus"]},
                {"id": "early_muskets", "name": "Ранние мушкеты", "year": 1545, "requires": ["matchlock"]},
                {"id": "musket_production_1", "name": "Мушкетное производство I", "year": 1565, "requires": ["early_muskets", "early_manufactories"]},
                {"id": "wheellock", "name": "Колесцовый замок", "year": 1585, "requires": ["matchlock"]},
                {"id": "light_muskets", "name": "Легкие мушкеты", "year": 1605, "requires": ["wheellock"]},
                {"id": "paper_cartridges", "name": "Бумажные патроны", "year": 1625, "requires": ["light_muskets", "improved_looms"]},
                {"id": "early_flintlock", "name": "Ранний кремневый замок", "year": 1650, "requires": ["light_muskets"]},
                {"id": "flintlock_musket_1", "name": "Кремневые мушкеты I", "year": 1670, "requires": ["early_flintlock"]},
                {"id": "improved_flint_system", "name": "Улучшенная кремневая система", "year": 1685, "requires": ["flintlock_musket_1"]},
                {"id": "socket_bayonet", "name": "Трубчатый штык", "year": 1700, "requires": ["early_muskets", "pike_and_shot"]},
                {"id": "flintlock_musket_2", "name": "Кремневые мушкеты II", "year": 1720, "requires": ["flintlock_musket_1"]},
                {"id": "improved_barrels", "name": "Улучшенные стволы", "year": 1740, "requires": ["flintlock_musket_2", "foundry_production"]},
                {"id": "experimental_rifling", "name": "Экспериментальные нарезы", "year": 1755, "requires": ["flintlock_musket_2", 'foundry_production']},
                {"id": "rifles", "name": "Штуцеры", "year": 1770, "requires": ["experimental_rifling", "rolling_mills_1"]},
                {"id": "jaeger_rifles", "name": "Нарезные винтовки егерей", "year": 1785, "requires": ["rifles", "jaeger_units"]},
                {"id": "percussion_cap", "name": "Ударный капсюль", "year": 1800, "requires": ["rifles"]},
                {"id": "caplock_rifles", "name": "Капсюльные винтовки", "year": 1815, "requires": ["percussion_cap"]},
                {"id": "mass_rifle_production", "name": "Массовое производство винтовок", "year": 1830, "requires": ["caplock_rifles", "industrial_production_prod"]},
                {"id": "needle_gun", "name": "Игольчатая винтовка", "year": 1840, "requires": ["caplock_rifles"]},
                {"id": "unitary_cartridge", "name": "Унитарный патрон", "year": 1850, "requires": ["needle_gun"]},
                {"id": "breechloader_1", "name": "Казнозарядные винтовки I", "year": 1860, "requires": ["unitary_cartridge"]},
                {"id": "metallic_cartridge", "name": "Металлический патрон", "year": 1865, "requires": ["unitary_cartridge", "cast_steel"]},
                {"id": "breechloader_2", "name": "Казнозарядные винтовки II", "year": 1870, "requires": ["metallic_cartridge", "breechloader_1"]},
                {"id": "magazine_rifles_1", "name": "Магазинные винтовки I", "year": 1880, "requires": ["breechloader_2", "interchangeable_parts"]},
                {"id": "smokeless_powder", "name": "Бездымный порох", "year": 1885, "requires": ["needle_gun", "chemical_industry"]},
                {"id": "magazine_rifles_2", "name": "Магазинные винтовки II", "year": 1890, "requires": ["magazine_rifles_1"]},
                {"id": "smokeless_rifles", "name": "Винтовки под бездымный порох", "year": 1895, "requires": ["magazine_rifles_2", "smokeless_powder"]},
                {"id": "modern_small_arms", "name": "Современное стрелковое оружие", "year": 1900, "requires": ["smokeless_rifles", "precision_tools"]},
            ]
        },
        {
            "id": "artillery",
            "name": "Артиллерия",
            "technologies": [
                {"id": "bronze_cannons", "name": "Бронзовые пушки", "year": 1500, "requires": []},
                {"id": "siege_mortars", "name": "Осадные мортиры", "year": 1500, "requires": []},
                {"id": "improved_casting", "name": "Улучшенное литье", "year": 1520, "requires": ["bronze_cannons", "siege_mortars", "cast_iron"]},
                {"id": "howitzers", "name": "Гаубицы", "year": 1530, "requires": ["improved_casting"]},
                {"id": "standard_calibers", "name": "Стандартные калибры орудий", "year": 1545, "requires": ["howitzers"]},
                {"id": "light_field_guns", "name": "Легкие полевые пушки", "year": 1565, "requires": ["standard_calibers"]},
                {"id": "field_artillery_1", "name": "Полевая артиллерия I", "year": 1585, "requires": ["light_field_guns"]},
                {"id": "iron_shot", "name": "Чугунные ядра", "year": 1600, "requires": ["field_artillery_1"]},
                {"id": "canister_shot", "name": "Картечь", "year": 1615, "requires": ["field_artillery_1"]},
                {"id": "improved_carriages", "name": "Улучшенные лафеты", "year": 1630, "requires": ["field_artillery_1", "quality_craftsmanship"]},
                {"id": "explosive_shells", "name": "Разрывные гранаты", "year": 1645, "requires": ["iron_shot", "gunpowder_production"]},
                {"id": "gun_standardization", "name": "Стандартизация орудий", "year": 1660, "requires": ["improved_carriages", "production_organization"]},
                {"id": "limbers", "name": "Передки и зарядные ящики", "year": 1675, "requires": ["gun_standardization"]},
                {"id": "horse_artillery", "name": "Конная артиллерия", "year": 1690, "requires": ["limbers", "cavalry_regiments"]},
                {"id": "improved_fuses", "name": "Улучшенные запалы", "year": 1705, "requires": ["gun_standardization"]},
                {"id": "artillery_school", "name": "Артиллерийская школа", "year": 1720, "requires": ["improved_fuses", "academies"]},
                {"id": "field_artillery_2", "name": "Полевая артиллерия II", "year": 1735, "requires": ["improved_fuses"]},
                {"id": "steel_barrels", "name": "Стальные стволы", "year": 1750, "requires": ["field_artillery_2", "quality_steel"]},
                {"id": "improved_range", "name": "Улучшенная дальность", "year": 1765, "requires": ["steel_barrels"]},
                {"id": "mountain_artillery", "name": "Горная артиллерия", "year": 1780, "requires": ["improved_range"]},
                {"id": "siege_artillery", "name": "Осадная артиллерия", "year": 1790, "requires": ["improved_range"]},
                {"id": "rockets", "name": "Ракеты", "year": 1800, "requires": ["improved_range"]},
                {"id": "shrapnel", "name": "Шрапнель", "year": 1815, "requires": ["improved_range"]},
                {"id": "rifled_artillery_1", "name": "Нарезная артиллерия I", "year": 1825, "requires": ["siege_artillery", "shrapnel"]},
                {"id": "breech_loading_artillery", "name": "Казнозарядные орудия", "year": 1835, "requires": ["rifled_artillery_1", "crucible_steel", "standardization"]},
                {"id": "rifled_artillery_2", "name": "Нарезная артиллерия II", "year": 1850, "requires": ["breech_loading_artillery"]},
                {"id": "steel_carriages", "name": "Стальные лафеты", "year": 1860, "requires": ["rifled_artillery_2", "mass_steel_production"]},
                {"id": "rapid_fire_guns_1", "name": "Скорострельные орудия I", "year": 1865, "requires": ["steel_carriages"]},
                {"id": "smokeless_powder_artillery", "name": "Бездымный порох для артиллерии", "year": 1875, "requires": ["rifled_artillery_2", "smokeless_powder"]},
                {"id": "high_explosive_shells", "name": "Фугасные снаряды", "year": 1880, "requires": ["rifled_artillery_2", "explosives"]},
                {"id": "hydraulic_recoil", "name": "Гидравлические тормоза отката", "year": 1885, "requires": ["steel_carriages", "precision_tools"]},
                {"id": "heavy_artillery", "name": "Тяжелая артиллерия", "year": 1890, "requires": ["hydraulic_recoil"]},
                {"id": "quick_firing_artillery", "name": "Скорострельная артиллерия", "year": 1895, "requires": ["heavy_artillery"]},
            ]
        },
        {
            "id": "military_org",
            "name": "Военная организация",
            "technologies": [
                {"id": "mercenary_armies", "name": "Наемные армии", "year": 1500, "requires": []},
                {"id": "militia_levies", "name": "Народное ополчение", "year": 1500, "requires": []},
                {"id": "landsknechts", "name": "Ландскнехты", "year": 1525, "requires": ["mercenary_armies"]},
                {"id": "military_discipline_1", "name": "Военная дисциплина I", "year": 1535, "requires": ["landsknechts"]},
                {"id": "standing_army_1", "name": "Постоянная армия", "year": 1555, "requires": ["militia_levies", "state_treasury"]},
                {"id": "military_uniform", "name": "Военная униформа", "year": 1580, "requires": ["standing_army_1", "dyeing"]},
                {"id": "regimental_system", "name": "Полковая система", "year": 1600, "requires": ["military_uniform"]},
                {"id": "line_infantry", "name": "Линейная пехота", "year": 1620, "requires": ["regimental_system", "flintlock_musket_1", "military_discipline_1"]},
                {"id": "pike_and_shot", "name": "Пикинеры и мушкетеры", "year": 1635, "requires": ["line_infantry"]},
                {"id": "volley_fire", "name": "Залповый огонь", "year": 1655, "requires": ["regimental_system", "paper_cartridges"]},
                {"id": "battalion_system", "name": "Батальонная система", "year": 1675, "requires": ["volley_fire"]},
                {"id": "linear_tactics", "name": "Линейная тактика", "year": 1695, "requires": ["battalion_system", "socket_bayonet"]},
                {"id": "grenadiers", "name": "Гренадеры", "year": 1720, "requires": ["linear_tactics", "explosive_shells"]},
                {"id": "jaeger_units", "name": "Егерские части", "year": 1750, "requires": ["grenadiers"]},
                {"id": "modern_fleet_organization", "name": "Современная армейская организация", "year": 1800, "requires": ["grenadiers", "rifled_artillery_2", "breechloader_2", "uhlans", "universities_2"]},
            ]
        },
        {
            "id": "cavalry",
            "name": "Кавалерия",
            "technologies": [
                {"id": "heavy_cavalry", "name": "Тяжелая кавалерия", "year": 1500, "requires": []},
                {"id": "light_cavalry_scouts", "name": "Легкая разведывательная кавалерия", "year": 1500, "requires": []},
                {"id": "cuirassiers", "name": "Кирасиры", "year": 1530, "requires": ["heavy_cavalry", "improved_smelting"]},
                {"id": "hussars_early", "name": "Ранние гусары", "year": 1535, "requires": ["light_cavalry_scouts", "improved_smelting"]},
                {"id": "cavalry_pistols", "name": "Конные пистолеты", "year": 1550, "requires": ["hussars_early", "cuirassiers", "wheellock"]},
                {"id": "reiters", "name": "Рейтары", "year": 1555, "requires": ["cavalry_pistols"]},
                {"id": "dragoons_1", "name": "Драгуны I", "year": 1575, "requires": ["hussars_early", "light_muskets"]},
                {"id": "cavalry_regiments", "name": "Кавалерийские полки", "year": 1600, "requires": ["reiters", "dragoons_1"]},
                {"id": "hussars", "name": "Гусары", "year": 1625, "requires": ["cavalry_regiments", "flintlock_musket_1", "quality_iron"]},
                {"id": "cavalry_charge", "name": "Кавалерийская атака", "year": 1650, "requires": ["hussars", "linear_tactics"]},
                {"id": "horse_breeding", "name": "Улучшенная селекция лошадей", "year": 1680, "requires": ["cavalry_regiments", "animal_selection"]},
                {"id": "uhlans", "name": "Уланы", "year": 1710, "requires": ["horse_breeding", "flintlock_musket_2"]},
                {"id": "dragoons_2", "name": "Драгуны II", "year": 1750, "requires": ["uhlans", "jaeger_rifles"]},
                {"id": "cuirassier_reform", "name": "Кирасирская реформа", "year": 1800, "requires": ["dragoons_2"]},
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
                {"id": "caravels", "name": "Каравеллы", "year": 1500, "requires": []},
                {"id": "galleys", "name": "Галеры", "year": 1500, "requires": []},
                {"id": "carracks", "name": "Каракки", "year": 1520, "requires": ["caravels", "improved_sails"]},
                {"id": "improved_galleys", "name": "Улучшенные галеры", "year": 1525, "requires": ["galleys"]},
                {"id": "galleons_1", "name": "Галеоны I", "year": 1540, "requires": ["carracks"]},
                {"id": "galleasses", "name": "Галеасы", "year": 1545, "requires": ["improved_galleys", "broadside_guns"]},
                {"id": "galleons_2", "name": "Галеоны II", "year": 1565, "requires": ["galleons_1", "galleasses"]},
                {"id": "war_galleons", "name": "Военные галеоны", "year": 1585, "requires": ["galleons_2", "multi_tier_armament"]},
                {"id": "ships_of_line_1", "name": "Линейные корабли I", "year": 1605, "requires": ["war_galleons"]},
                {"id": "multi_deck_ships", "name": "Многопалубные корабли", "year": 1625, "requires": ["ships_of_line_1", "improved_hull_construction"]},
                {"id": "ships_of_line_2", "name": "Линейные корабли II", "year": 1645, "requires": ["multi_deck_ships"]},
                {"id": "frigates_1", "name": "Фрегаты I", "year": 1665, "requires": ["ships_of_line_2"]},
                {"id": "ships_of_line_3", "name": "Линейные корабли III", "year": 1680, "requires": ["frigates_1", "naval_artillery_1"]},
                {"id": "corvettes", "name": "Корветы", "year": 1695, "requires": ["frigates_1"]},
                {"id": "ships_of_line_4", "name": "Линейные корабли IV", "year": 1715, "requires": ["ships_of_line_3", "chronometers_1"]},
                {"id": "frigates_2", "name": "Фрегаты II", "year": 1730, "requires": ["corvettes", "ships_of_line_4"]},
                {"id": "ships_of_line_5", "name": "Линейные корабли V", "year": 1745, "requires": ["frigates_2"]},
                {"id": "copper_plating", "name": "Медная обшивка днища", "year": 1765, "requires": ["ships_of_line_5", "copper_smelting"]},
                {"id": "fast_frigates", "name": "Быстроходные фрегаты", "year": 1780, "requires": ["copper_plating"]},
                {"id": "ships_of_line_6", "name": "Линейные корабли VI", "year": 1795, "requires": ["fast_frigates", "carronades"]},
                {"id": "experimental_steamships", "name": "Экспериментальные паровые суда", "year": 1810, "requires": ["ships_of_line_6", "steam_engine"]},
                {"id": "paddle_steamers", "name": "Паровые колесные суда", "year": 1820, "requires": ["experimental_steamships"]},
                {"id": "steam_frigates_1", "name": "Паровые фрегаты I", "year": 1835, "requires": ["paddle_steamers", "improved_steam_engines"]},
                {"id": "screw_ships", "name": "Винтовые корабли", "year": 1845, "requires": ["steam_frigates_1", "precision_engineering"]},
                {"id": "steam_ships_of_line", "name": "Паровые линкоры", "year": 1855, "requires": ["screw_ships"]},
                {"id": "ironclads_1", "name": "Броненосцы I", "year": 1860, "requires": ["steam_ships_of_line", "rolled_iron"]},
                {"id": "turret_ironclads", "name": "Башенные броненосцы", "year": 1870, "requires": ["ironclads_1", "turret_guns_1"]},
                {"id": "ironclads_2", "name": "Броненосцы II", "year": 1875, "requires": ["turret_ironclads", "mass_steel_production"]},
                {"id": "cruisers_1", "name": "Крейсеры I", "year": 1880, "requires": ["ironclads_2"]},
                {"id": "modern_battleships", "name": "Современные броненосцы", "year": 1885, "requires": ["cruisers_1", "heavy_naval_artillery"]},
                {"id": "cruisers_2", "name": "Крейсеры II", "year": 1890, "requires": ["modern_battleships"]},
                {"id": "pre_dreadnoughts", "name": "Эскадренные броненосцы", "year": 1895, "requires": ["cruisers_2"]},
                {"id": "dreadnoughts", "name": "Дредноуты", "year": 1900, "requires": ["pre_dreadnoughts", "modern_naval_artillery"]},
            ]
        },
        {
            "id": "naval_weapons",
            "name": "Морское вооружение",
            "technologies": [
                {"id": "falconets", "name": "Фальконеты", "year": 1500, "requires": []},
                {"id": "naval_bombards", "name": "Морские бомбарды", "year": 1500, "requires": []},
                {"id": "broadside_guns", "name": "Бортовые пушки", "year": 1515, "requires": ["falconets"]},
                {"id": "culverins", "name": "Кулеврины", "year": 1520, "requires": ["naval_bombards", "bronze_casting"]},
                {"id": "improved_naval_guns", "name": "Улучшенные морские пушки", "year": 1535, "requires": ["broadside_guns", "culverins"]},
                {"id": "gun_ports", "name": "Пушечные порты", "year": 1550, "requires": ["improved_naval_guns"]},
                {"id": "multi_tier_armament", "name": "Многоярусное вооружение", "year": 1570, "requires": ["gun_ports"]},
                {"id": "heavy_naval_guns", "name": "Тяжелые морские пушки", "year": 1585, "requires": ["multi_tier_armament", "iron_casting"]},
                {"id": "caliber_standardization_navy", "name": "Стандартизация калибров", "year": 1600, "requires": ["heavy_naval_guns"]},
                {"id": "improved_carriages_navy", "name": "Улучшенные лафеты", "year": 1615, "requires": ["caliber_standardization_navy"]},
                {"id": "anti_ship_shot", "name": "Противокорабельные ядра", "year": 1630, "requires": ["improved_carriages_navy"]},
                {"id": "incendiary_shot", "name": "Зажигательные снаряды", "year": 1645, "requires": ["anti_ship_shot", "gunpowder_chemistry"]},
                {"id": "boarding_grapeshot", "name": "Картечь для абордажа", "year": 1660, "requires": ["incendiary_shot"]},
                {"id": "long_range_guns", "name": "Дальнобойные пушки", "year": 1675, "requires": ["boarding_grapeshot"]},
                {"id": "naval_artillery_1", "name": "Корабельная артиллерия I", "year": 1690, "requires": ["long_range_guns"]},
                {"id": "explosive_shells_navy", "name": "Разрывные снаряды", "year": 1705, "requires": ["naval_artillery_1"]},
                {"id": "naval_artillery_2", "name": "Корабельная артиллерия II", "year": 1720, "requires": ["explosive_shells_navy"]},
                {"id": "carronades", "name": "Карронады", "year": 1735, "requires": ["naval_artillery_2"]},
                {"id": "naval_artillery_3", "name": "Корабельная артиллерия III", "year": 1750, "requires": ["carronades"]},
                {"id": "long_guns", "name": "Длинные пушки", "year": 1765, "requires": ["naval_artillery_3"]},
                {"id": "improved_rate_of_fire", "name": "Улучшенная скорострельность", "year": 1780, "requires": ["long_guns", "precision_machining"]},
                {"id": "naval_artillery_4", "name": "Корабельная артиллерия IV", "year": 1795, "requires": ["improved_rate_of_fire"]},
                {"id": "naval_rockets", "name": "Ракетное оружие для флота", "year": 1810, "requires": ["naval_artillery_4", "rockets"]},
                {"id": "rifled_naval_guns_1", "name": "Нарезные морские орудия I", "year": 1820, "requires": ["naval_rockets", "rifled_artillery"]},
                {"id": "explosive_bombs", "name": "Разрывные бомбы", "year": 1835, "requires": ["rifled_naval_guns_1"]},
                {"id": "breech_loading_naval_guns", "name": "Казнозарядные морские пушки", "year": 1845, "requires": ["explosive_bombs", "breech_loading_artillery"]},
                {"id": "turret_guns_1", "name": "Башенные орудия I", "year": 1855, "requires": ["breech_loading_naval_guns"]},
                {"id": "armor_piercing_shells", "name": "Бронебойные снаряды", "year": 1865, "requires": ["turret_guns_1", "hardened_steel"]},
                {"id": "turret_guns_2", "name": "Башенные орудия II", "year": 1870, "requires": ["armor_piercing_shells"]},
                {"id": "torpedoes", "name": "Торпеды", "year": 1875, "requires": ["turret_guns_2", "dynamite"]},
                {"id": "quick_firing_naval_guns", "name": "Скорострельные морские пушки", "year": 1880, "requires": ["torpedoes"]},
                {"id": "heavy_naval_artillery", "name": "Тяжелая корабельная артиллерия", "year": 1885, "requires": ["quick_firing_naval_guns"]},
                {"id": "improved_torpedoes", "name": "Улучшенные торпеды", "year": 1890, "requires": ["heavy_naval_artillery"]},
                {"id": "modern_naval_artillery", "name": "Современная морская артиллерия", "year": 1895, "requires": ["improved_torpedoes"]},
            ]
        },
        {
            "id": "navigation",
            "name": "Навигация и мореходство",
            "technologies": [
                {"id": "compass", "name": "Компас", "year": 1500, "requires": []},
                {"id": "coastal_piloting", "name": "Прибрежное лоцманство", "year": 1500, "requires": []},
                {"id": "astrolabe", "name": "Астролябия", "year": 1515, "requires": ["compass", "astronomical_observations"]},
                {"id": "sea_charts_1", "name": "Морские карты I", "year": 1525, "requires": ["coastal_piloting", "printing_press"]},
                {"id": "navigation_tables", "name": "Навигационные таблицы", "year": 1540, "requires": ["astrolabe", "sea_charts_1"]},
                {"id": "improved_sails", "name": "Улучшенные паруса", "year": 1555, "requires": ["navigation_tables"]},
                {"id": "sea_charts_2", "name": "Морские карты II", "year": 1575, "requires": ["improved_sails"]},
                {"id": "star_navigation", "name": "Навигация по звездам", "year": 1595, "requires": ["sea_charts_2"]},
                {"id": "log_speed", "name": "Лаг (измеритель скорости)", "year": 1615, "requires": ["star_navigation"]},
                {"id": "quadrant", "name": "Квадрант", "year": 1625, "requires": ["log_speed"]},
                {"id": "improved_compass", "name": "Улучшенные компасы", "year": 1640, "requires": ["quadrant", "precision_metalworking"]},
                {"id": "sextant", "name": "Секстант", "year": 1655, "requires": ["improved_compass", "optics"]},
                {"id": "naval_astronomy", "name": "Морская астрономия", "year": 1670, "requires": ["sextant"]},
                {"id": "barometer", "name": "Барометр", "year": 1685, "requires": ["naval_astronomy", "scientific_instruments"]},
                {"id": "depth_sounder", "name": "Глубиномер", "year": 1700, "requires": ["barometer"]},
                {"id": "chronometers_1", "name": "Морские хронометры I", "year": 1715, "requires": ["depth_sounder", "precision_clockmaking"]},
                {"id": "longitude_finding", "name": "Точное определение долготы", "year": 1730, "requires": ["chronometers_1"]},
                {"id": "scientific_cartography", "name": "Научная картография", "year": 1745, "requires": ["longitude_finding", "scientific_method_2"]},
                {"id": "chronometers_2", "name": "Морские хронометры II", "year": 1760, "requires": ["scientific_cartography"]},
                {"id": "sea_signals", "name": "Морские сигналы", "year": 1775, "requires": ["chronometers_2"]},
                {"id": "semaphore", "name": "Семафорная связь", "year": 1790, "requires": ["sea_signals"]},
                {"id": "lighthouses", "name": "Морские маяки", "year": 1805, "requires": ["semaphore"]},
                {"id": "precise_sea_charts", "name": "Точные морские карты", "year": 1820, "requires": ["lighthouses"]},
                {"id": "hydrography", "name": "Гидрография", "year": 1835, "requires": ["precise_sea_charts"]},
                {"id": "steam_navigation", "name": "Паровая навигация", "year": 1850, "requires": ["hydrography", "steam_frigates_1"]},
                {"id": "oceanography", "name": "Океанография", "year": 1860, "requires": ["steam_navigation", "scientific_research_3"]},
                {"id": "ocean_currents", "name": "Морские течения", "year": 1870, "requires": ["oceanography"]},
                {"id": "radio_communication_navy", "name": "Радиосвязь на море", "year": 1880, "requires": ["ocean_currents", "telegraph"]},
                {"id": "modern_cartography", "name": "Современная картография", "year": 1890, "requires": ["radio_communication_navy"]},
                {"id": "electric_lighthouses", "name": "Электрическое освещение маяков", "year": 1895, "requires": ["modern_cartography", "electric_lighting"]},
                {"id": "modern_navigation_systems", "name": "Современные навигационные системы", "year": 1900, "requires": ["electric_lighthouses"]},
            ]
        },
        {
            "id": "naval_doctrine",
            "name": "Морская доктрина и тактика",
            "technologies": [
                {"id": "boarding_tactics", "name": "Абордажная тактика", "year": 1500, "requires": []},
                {"id": "naval_gunnery", "name": "Корабельная стрельба", "year": 1500, "requires": []},
                {"id": "ship_discipline", "name": "Корабельная дисциплина", "year": 1520, "requires": ["boarding_tactics"]},
                {"id": "broadside_doctrine", "name": "Бортовой залп", "year": 1525, "requires": ["naval_gunnery", "broadside_guns"]},
                {"id": "marines_1", "name": "Морская пехота I", "year": 1540, "requires": ["ship_discipline"]},
                {"id": "fleet_organization", "name": "Флотская организация", "year": 1545, "requires": ["broadside_doctrine", "marines_1"]},
                {"id": "squadrons", "name": "Эскадры", "year": 1565, "requires": ["fleet_organization"]},
                {"id": "naval_battles", "name": "Морские сражения", "year": 1585, "requires": ["squadrons"]},
                {"id": "fleet_discipline", "name": "Флотская дисциплина", "year": 1605, "requires": ["naval_battles", "line_infantry"]},
                {"id": "line_formation", "name": "Построение линией", "year": 1620, "requires": ["fleet_discipline"]},
                {"id": "linear_fleet_tactics_1", "name": "Линейная тактика флота I", "year": 1640, "requires": ["line_formation", "ships_of_line_1"]},
                {"id": "squadron_coordination", "name": "Координация эскадр", "year": 1655, "requires": ["linear_fleet_tactics_1"]},
                {"id": "fleet_signals", "name": "Флотские сигналы", "year": 1670, "requires": ["squadron_coordination", "sea_signals"]},
                {"id": "line_breaking", "name": "Тактика прорыва линии", "year": 1685, "requires": ["fleet_signals"]},
                {"id": "concentrated_fire", "name": "Сосредоточение огня", "year": 1700, "requires": ["line_breaking"]},
                {"id": "cruiser_operations", "name": "Крейсерские операции", "year": 1715, "requires": ["concentrated_fire", "frigates_2"]},
                {"id": "port_blockade", "name": "Блокада портов", "year": 1730, "requires": ["cruiser_operations"]},
                {"id": "fleet_artillery", "name": "Флотская артиллерия", "year": 1745, "requires": ["port_blockade", "naval_artillery_3"]},
                {"id": "convoy_system", "name": "Конвойная система", "year": 1760, "requires": ["fleet_artillery"]},
                {"id": "aggressive_tactics", "name": "Агрессивная тактика", "year": 1775, "requires": ["convoy_system"]},
                {"id": "force_concentration", "name": "Сосредоточение сил", "year": 1790, "requires": ["aggressive_tactics"]},
                {"id": "tactical_flexibility", "name": "Тактическая гибкость", "year": 1805, "requires": ["force_concentration", "semaphore"]},
                {"id": "steam_tactics", "name": "Паровая тактика", "year": 1820, "requires": ["tactical_flexibility", "paddle_steamers"]},
                {"id": "screw_maneuverability", "name": "Винтовая маневренность", "year": 1835, "requires": ["steam_tactics", "screw_ships"]},
                {"id": "ironclad_doctrine", "name": "Броненосная доктрина", "year": 1850, "requires": ["screw_maneuverability", "ironclads_1"]},
                {"id": "modern_naval_warfare", "name": "Современная морская война", "year": 1860, "requires": ["ironclad_doctrine"]},
                {"id": "ocean_fleet", "name": "Океанский флот", "year": 1870, "requires": ["modern_naval_warfare"]},
                {"id": "sea_power_theory", "name": "Теория морской мощи", "year": 1880, "requires": ["ocean_fleet", "modern_fleet_organization"]},
                {"id": "command_of_sea", "name": "Командование морем", "year": 1890, "requires": ["sea_power_theory", "modern_battleships"]},
                {"id": "sea_dominance", "name": "Доминирование на море", "year": 1900, "requires": ["command_of_sea"]},
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
                {"id": "church_schools", "name": "Церковные школы", "year": 1500, "requires": []},
                {"id": "city_schools", "name": "Городские школы", "year": 1500, "requires": []},
                {"id": "monastery_education", "name": "Монастырское образование", "year": 1520, "requires": ["church_schools"]},
                {"id": "latin_schools", "name": "Латинские школы", "year": 1530, "requires": ["city_schools", "printing_press"]},
                {"id": "gymnasiums_1", "name": "Гимназии", "year": 1550, "requires": ["latin_schools"]},
                {"id": "universities_1", "name": "Университеты I", "year": 1570, "requires": ["gymnasiums_1"]},
                {"id": "humanist_education", "name": "Гуманистическое образование", "year": 1590, "requires": ["universities_1", "book_publishing_1"]},
                {"id": "academies", "name": "Академии", "year": 1610, "requires": ["humanist_education"]},
                {"id": "classical_education", "name": "Классическое образование", "year": 1630, "requires": ["academies"]},
                {"id": "scientific_societies", "name": "Научные общества", "year": 1660, "requires": ["classical_education", "experimental_science"]},
                {"id": "real_schools", "name": "Реальные школы", "year": 1680, "requires": ["classical_education"]},
                {"id": "universities_2", "name": "Университеты II", "year": 1700, "requires": ["scientific_societies", "real_schools"]},
                {"id": "secular_education", "name": "Светское образование", "year": 1720, "requires": ["universities_2", "encyclopedias"]},
                {"id": "primary_schools_1", "name": "Начальные школы I", "year": 1740, "requires": ["secular_education"]},
                {"id": "vocational_education_1", "name": "Профессиональное образование I", "year": 1750, "requires": ["primary_schools_1"]},
                {"id": "pedagogical_institutes", "name": "Педагогические институты", "year": 1785, "requires": ["secular_education"]},
                {"id": "compulsory_primary_education", "name": "Обязательное начальное образование", "year": 1770, "requires": ["vocational_education_1", "pedagogical_institutes", "mass_literacy"]},
                {"id": "state_education", "name": "Государственное образование", "year": 1800, "requires": ["compulsory_primary_education"]},
                {"id": "universal_primary_education", "name": "Всеобщее начальное образование", "year": 1815, "requires": ["state_education"]},
                {"id": "technical_schools", "name": "Технические училища", "year": 1825, "requires": ["universal_primary_education", "scientific_research_2"]},
                {"id": "secondary_education_1", "name": "Среднее образование I", "year": 1840, "requires": ["universal_primary_education"]},
                {"id": "polytechnic_institutes", "name": "Политехнические институты", "year": 1855, "requires": ["technical_schools", "industrial_chemistry"]},
                {"id": "secondary_education_2", "name": "Среднее образование II", "year": 1865, "requires": ["secondary_education_1"]},
                {"id": "womens_education", "name": "Женское образование", "year": 1875, "requires": ["secondary_education_2"]},
                {"id": "higher_technical_education", "name": "Высшее техническое образование", "year": 1885, "requires": ["polytechnic_institutes", "electrical_engineering"]},
                {"id": "education_system_2", "name": "Образовательная система II", "year": 1895, "requires": ["higher_technical_education", "womens_education"]},
                {"id": "modern_education_system", "name": "Современная система образования", "year": 1900, "requires": ["education_system_2", "modern_science"]},
            ]
        },
        {
            "id": "scientific_research",
            "name": "Научные исследования",
            "technologies": [
                {"id": "alchemy_natural_philosophy", "name": "Алхимия и натурфилософия", "year": 1500, "requires": []},
                {"id": "astronomical_observations", "name": "Астрономические наблюдения", "year": 1500, "requires": []},
                {"id": "medical_research_1", "name": "Медицинские исследования I", "year": 1520, "requires": ["alchemy_natural_philosophy"]},
                {"id": "anatomy", "name": "Анатомия", "year": 1530, "requires": ["medical_research_1", "barber_surgeons"]},
                {"id": "experimental_method", "name": "Экспериментальный метод", "year": 1540, "requires": ["astronomical_observations"]},
                {"id": "botany", "name": "Ботаника", "year": 1550, "requires": ["anatomy", "experimental_method"]},
                {"id": "scientific_method_1", "name": "Научный метод", "year": 1570, "requires": ["botany"]},
                {"id": "optics", "name": "Оптика", "year": 1585, "requires": ["scientific_method_1"]},
                {"id": "mechanics", "name": "Механика", "year": 1600, "requires": ["scientific_method_1", "improved_smelting"]},
                {"id": "telescope", "name": "Телескоп", "year": 1615, "requires": ["mechanics", "glass_production"]},
                {"id": "microscope", "name": "Микроскоп", "year": 1630, "requires": ["telescope"]},
                {"id": "scientific_instruments", "name": "Научные инструменты", "year": 1645, "requires": ["microscope"]},
                {"id": "experimental_science", "name": "Экспериментальная наука", "year": 1650, "requires": ["scientific_instruments"]},
                {"id": "classical_mechanics", "name": "Классическая механика", "year": 1665, "requires": ["scientific_instruments"]},
                {"id": "mathematics_2", "name": "Математика", "year": 1680, "requires": ["experimental_science"]},
                {"id": "scientific_laboratories_1", "name": "Научные лаборатории", "year": 1690, "requires": ["mathematics_2"]},
                {"id": "calculus", "name": "Исчисление", "year": 1705, "requires": ["experimental_science"]},
                {"id": "physics_1", "name": "Физика I", "year": 1720, "requires": ["mathematics_2"]},
                {"id": "astronomy", "name": "Астрономия", "year": 1735, "requires": ["physics_1"]},
                {"id": "scientific_research_1", "name": "Научные исследования I", "year": 1750, "requires": ["scientific_laboratories_1"]},
                {"id": "chemistry_1", "name": "Химия I", "year": 1765, "requires": ["scientific_research_1"]},
                {"id": "natural_sciences", "name": "Естественные науки", "year": 1780, "requires": ["scientific_research_1"]},
                {"id": "scientific_research_2", "name": "Научные исследования II", "year": 1810, "requires": ["natural_sciences"]},
                {"id": "thermodynamics", "name": "Термодинамика", "year": 1825, "requires": ["scientific_research_2", "steam_engine"]},
                {"id": "electromagnetism", "name": "Электромагнетизм", "year": 1840, "requires": ["thermodynamics"]},
                {"id": "scientific_research_3", "name": "Научные исследования III", "year": 1850, "requires": ["thermodynamics"]},
                {"id": "organic_chemistry", "name": "Органическая химия", "year": 1860, "requires": ["scientific_research_3"]},
                {"id": "theory_of_evolution", "name": "Теория эволюции", "year": 1870, "requires": ["scientific_research_3"]},
                {"id": "microbiology", "name": "Микробиология", "year": 1880, "requires": ["organic_chemistry"]},
                {"id": "electrical_engineering", "name": "Электротехника", "year": 1890, "requires": ["scientific_research_3", "dynamo"]},
                {"id": "modern_science", "name": "Современная наука", "year": 1900, "requires": ["electrical_engineering"]},
            ]
        },
        {
            "id": "medicine_healthcare",
            "name": "Медицина и здравоохранение",
            "technologies": [
                {"id": "folk_medicine", "name": "Народная медицина", "year": 1500, "requires": []},
                {"id": "barber_surgeons", "name": "Цирюльники-хирурги", "year": 1500, "requires": []},
                {"id": "apothecaries", "name": "Аптекари", "year": 1520, "requires": ["barber_surgeons"]},
                {"id": "medical_schools_1", "name": "Медицинские школы I", "year": 1535, "requires": ["apothecaries", "latin_schools"]},
                {"id": "anatomical_studies", "name": "Анатомические исследования", "year": 1550, "requires": ["apothecaries", "printing_press", "anatomy"]},
                {"id": "surgery_1", "name": "Хирургия I", "year": 1565, "requires": ["medical_schools_1"]},
                {"id": "medicinal_herbs", "name": "Лекарственные травы", "year": 1580, "requires": ["apothecaries", "botany"]},
                {"id": "hospitals_1", "name": "Больницы I", "year": 1595, "requires": ["surgery_1", "quality_craftsmanship"]},
                {"id": "surgical_instruments", "name": "Хирургические инструменты", "year": 1620, "requires": ["hospitals_1", "improved_smelting"]},
                {"id": "medical_universities", "name": "Медицинские университеты", "year": 1665, "requires": ["hospitals_1", "scientific_societies"]},
                {"id": "anatomical_theaters", "name": "Анатомические театры", "year": 1685, "requires": ["medical_universities"]},
                {"id": "surgery_2", "name": "Хирургия II", "year": 1705, "requires": ["medical_universities"]},
                {"id": "obstetrics", "name": "Акушерство", "year": 1720, "requires": ["surgery_2"]},
                {"id": "military_medicine", "name": "Военная медицина", "year": 1735, "requires": ["surgery_2"]},
                {"id": "vaccination", "name": "Вакцинация", "year": 1750, "requires": ["surgery_2", "microscope"]},
                {"id": "city_hospitals", "name": "Городские больницы", "year": 1765, "requires": ["surgery_2"]},
                {"id": "clinical_medicine", "name": "Клиническая медицина", "year": 1785, "requires": ["city_hospitals"]},
                {"id": "public_health_1", "name": "Общественное здравоохранение I", "year": 1800, "requires": ["city_hospitals"]},
                {"id": "anesthesia", "name": "Анестезия", "year": 1815, "requires": ["public_health_1", "chemistry_1"]},
                {"id": "stethoscope_diagnostics", "name": "Стетоскоп и диагностика", "year": 1830, "requires": ["public_health_1"]},
                {"id": "sanitation_1", "name": "Санитария I", "year": 1845, "requires": ["stethoscope_diagnostics"]},
                {"id": "antiseptics", "name": "Антисептика", "year": 1855, "requires": ["sanitation_1", "organic_chemistry"]},
                {"id": "germ_theory", "name": "Микробная теория", "year": 1865, "requires": ["antiseptics"]},
                {"id": "asepsis", "name": "Асептика", "year": 1875, "requires": ["germ_theory"]},
                {"id": "modern_surgery", "name": "Современная хирургия", "year": 1885, "requires": ["asepsis"]},
                {"id": "public_health_2", "name": "Общественное здравоохранение II", "year": 1895, "requires": ["modern_surgery"]},
                {"id": "modern_medicine", "name": "Современная медицина", "year": 1900, "requires": ["public_health_2"]},
            ]
        },
        {
            "id": "printing_knowledge",
            "name": "Печать и распространение знаний",
            "technologies": [
                {"id": "printing_press", "name": "Печатный станок", "year": 1500, "requires": []},
                {"id": "improved_printing", "name": "Улучшенная печать", "year": 1515, "requires": ["printing_press"]},
                {"id": "book_printing_1", "name": "Книгопечатание I", "year": 1530, "requires": ["improved_printing"]},
                {"id": "printing_houses", "name": "Типографии", "year": 1545, "requires": ["improved_printing"]},
                {"id": "book_distribution", "name": "Распространение книг", "year": 1560, "requires": ["printing_houses", "merchant_guilds"]},
                {"id": "book_publishing_1", "name": "Книгоиздательство I", "year": 1575, "requires": ["book_distribution"]},
                {"id": "libraries_1", "name": "Библиотеки I", "year": 1590, "requires": ["book_publishing_1", "public_buildings"]},
                {"id": "mass_book_printing", "name": "Массовое книгопечатание", "year": 1605, "requires": ["libraries_1"]},
                {"id": "periodical_press", "name": "Периодическая печать", "year": 1625, "requires": ["book_publishing_1"]},
                {"id": "newspapers", "name": "Газеты", "year": 1645, "requires": ["mass_book_printing"]},
                {"id": "improved_printing_enlightenment", "name": "Улучшенная печать", "year": 1665, "requires": ["mass_book_printing"]},
                {"id": "encyclopedias", "name": "Энциклопедии", "year": 1680, "requires": ["libraries_1"]},
                {"id": "book_publishing_2", "name": "Книгоиздательство II", "year": 1695, "requires": ["encyclopedias", "improved_printing_enlightenment"]},
                {"id": "regular_newspapers", "name": "Регулярные газеты", "year": 1710, "requires": ["newspapers"]},
                {"id": "scientific_journals", "name": "Научные журналы", "year": 1725, "requires": ["regular_newspapers", "scientific_societies"]},
                {"id": "book_industry", "name": "Книжная индустрия", "year": 1745, "requires": ["scientific_journals"]},
                {"id": "libraries_2", "name": "Библиотеки II", "year": 1765, "requires": ["book_industry"]},
                {"id": "mass_literacy", "name": "Массовая грамотность", "year": 1785, "requires": ["libraries_2"]},
                {"id": "magazine_industry", "name": "Журнальная индустрия", "year": 1800, "requires": ["book_industry"]},
                {"id": "mechanized_printing", "name": "Механизированная печать", "year": 1815, "requires": ["book_industry", "factory_system"]},
                {"id": "steam_printing_machines", "name": "Паровые печатные машины", "year": 1825, "requires": ["mechanized_printing", "industrial_steam_power"]},
                {"id": "cheap_books", "name": "Дешевые книги", "year": 1840, "requires": ["steam_printing_machines", "industrial_turbines"]},
                {"id": "mass_press", "name": "Массовая пресса", "year": 1855, "requires": ["cheap_books"]},
                {"id": "rotary_printing", "name": "Ротационная печать", "year": 1865, "requires": ["mass_press", "interchangeable_parts"]},
                {"id": "illustrated_magazines", "name": "Иллюстрированные журналы", "year": 1875, "requires": ["rotary_printing"]},
                {"id": "modern_book_publishing", "name": "Современное книгоиздательство", "year": 1885, "requires": ["rotary_printing"]},
                {"id": "modern_printing", "name": "Современная полиграфия", "year": 1895, "requires": ["modern_book_publishing"]},
                {"id": "media_industry", "name": "Индустрия СМИ", "year": 1900, "requires": ["illustrated_magazines", "modern_printing"]},
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
                {"id": "usury", "name": "Ростовщичество", "year": 1500, "requires": []},
                {"id": "money_changing", "name": "Меняльное дело", "year": 1500, "requires": []},
                {"id": "early_banks", "name": "Ранние банки", "year": 1530, "requires": ["usury", "money_changing"]},
                {"id": "bills_of_exchange", "name": "Вексели", "year": 1545, "requires": ["early_banks"]},
                {"id": "lending", "name": "Кредитование", "year": 1560, "requires": ["early_banks"]},
                {"id": "merchant_banks", "name": "Торговые банки", "year": 1580, "requires": ["early_banks"]},
                {"id": "state_credit", "name": "Государственный кредит", "year": 1600, "requires": ["lending"]},
                {"id": "stock_exchanges_early", "name": "Биржи", "year": 1620, "requires": ["lending"]},
                {"id": "stocks_bonds", "name": "Акции и облигации", "year": 1640, "requires": ["stock_exchanges_early"]},
                {"id": "central_banks", "name": "Центральные банки", "year": 1660, "requires": ["state_credit"]},
                {"id": "government_bonds", "name": "Государственные облигации", "year": 1680, "requires": ["central_banks", "stocks_bonds"]},
                {"id": "stock_trading", "name": "Биржевая торговля", "year": 1700, "requires": ["stock_exchanges_early"]},
                {"id": "paper_money", "name": "Бумажные деньги", "year": 1720, "requires": ["central_banks", "improved_printing_enlightenment"]},
                {"id": "insurance", "name": "Страхование", "year": 1735, "requires": ["merchant_banks"]},
                {"id": "assignats", "name": "Ассигнации", "year": 1750, "requires": ["paper_money"]},
                {"id": "securities", "name": "Ценные бумаги", "year": 1765, "requires": ["stock_trading", "assignats"]},
                {"id": "financial_markets", "name": "Финансовые рынки", "year": 1775, "requires": ["securities"]},
                {"id": "national_banks", "name": "Национальные банки", "year": 1790, "requires": ["central_banks", "financial_markets"]},
                {"id": "commercial_banks", "name": "Коммерческие банки", "year": 1810, "requires": ["central_banks", "financial_markets"]},
                {"id": "savings_banks", "name": "Сберегательные банки", "year": 1825, "requires": ["commercial_banks"]},
                {"id": "mortgage_lending", "name": "Ипотечное кредитование", "year": 1840, "requires": ["insurance"]},
                {"id": "stock_markets", "name": "Фондовые рынки", "year": 1850, "requires": ["financial_markets", "telegraph_trade"]},
                {"id": "investment_funds", "name": "Инвестиционные фонды", "year": 1860, "requires": ["stock_markets"]},
                {"id": "modern_banking", "name": "Современная банковская система", "year": 1870, "requires": ["commercial_banks", "investment_funds"]},
                {"id": "industrial_financing", "name": "Промышленное финансирование", "year": 1880, "requires": ["modern_banking"]},
                {"id": "insurance_companies", "name": "Страховые компании", "year": 1885, "requires": ["modern_banking"]},
                {"id": "international_finance", "name": "Международные финансы", "year": 1890, "requires": ["industrial_financing", "global_trade"]},
                {"id": "investment_banking", "name": "Инвестиционный банкинг", "year": 1895, "requires": ["industrial_financing", "modern_commerce"]},
                {"id": "modern_financial_system", "name": "Современная финансовая система", "year": 1900, "requires": ["investment_banking", "international_finance"]},
            ]
        },
        {
            "id": "trade_commerce",
            "name": "Торговля и коммерция",
            "technologies": [
                {"id": "local_trade", "name": "Местная торговля", "year": 1500, "requires": []},
                {"id": "market_trade", "name": "Рыночная торговля", "year": 1515, "requires": ["local_trade"]},
                {"id": "fairs", "name": "Ярмарки", "year": 1530, "requires": ["market_trade"]},
                {"id": "merchant_guilds", "name": "Гильдии купцов", "year": 1545, "requires": ["market_trade", "craft_guilds"]},
                {"id": "caravan_trade", "name": "Караванная торговля", "year": 1560, "requires": ["merchant_guilds"]},
                {"id": "maritime_trade", "name": "Морская торговля", "year": 1560, "requires": ["merchant_guilds"]},
                {"id": "trading_companies", "name": "Торговые компании", "year": 1580, "requires": ["caravan_trade", "maritime_trade"]},
                {"id": "warehouse_system", "name": "Складская система", "year": 1600, "requires": ["merchant_guilds"]},
                {"id": "trading_ports", "name": "Торговые порты", "year": 1620, "requires": ["maritime_trade", "port_warehouses"]},
                {"id": "trade_routes", "name": "Торговые маршруты", "year": 1635, "requires": ["maritime_trade", "caravan_trade"]},
                {"id": "colonial_trade", "name": "Колониальная торговля", "year": 1650, "requires": ["trade_routes"]},
                {"id": "trade_monopolies", "name": "Торговые монополии", "year": 1665, "requires": ["trade_routes"]},
                {"id": "merchant_fleet", "name": "Торговый флот", "year": 1685, "requires": ["colonial_trade", "frigates_1"]},
                {"id": "east_india_companies", "name": "Ост-Индские компании", "year": 1700, "requires": ["trade_monopolies", "merchant_fleet"]},
                {"id": "international_markets", "name": "Международные рынки", "year": 1715, "requires": ["east_india_companies"]},
                {"id": "triangular_trade", "name": "Треугольная торговля", "year": 1730, "requires": ["east_india_companies"]},
                {"id": "free_trade_movement", "name": "Движение свободной торговли", "year": 1750, "requires": ["international_markets"]},
                {"id": "trade_treaties", "name": "Торговые договоры", "year": 1760, "requires": ["international_markets"]},
                {"id": "abolition_monopolies", "name": "Отмена монополий", "year": 1770, "requires": ["trade_treaties"]},
                {"id": "international_commerce", "name": "Международная коммерция", "year": 1780, "requires": ["abolition_monopolies"]},
                {"id": "trade_infrastructure", "name": "Торговая инфраструктура", "year": 1790, "requires": ["international_commerce", "port_equipment"]},
                {"id": "trade_liberalization", "name": "Либерализация торговли", "year": 1800, "requires": ["trade_infrastructure"]},
                {"id": "steamship_trade", "name": "Пароходная торговля", "year": 1820, "requires": ["trade_infrastructure", "experimental_steamships"]},
                {"id": "customs_unions", "name": "Таможенные союзы", "year": 1830, "requires": ["trade_liberalization"]},
                {"id": "international_exhibitions", "name": "Международные выставки", "year": 1850, "requires": ["trade_liberalization"]},
                {"id": "telegraph_trade", "name": "Телеграфная торговля", "year": 1860, "requires": ["steamship_trade", "international_telegraph"]},
                {"id": "commodity_exchanges", "name": "Товарные биржи", "year": 1870, "requires": ["telegraph_trade"]},
                {"id": "railway_trade", "name": "Железнодорожная торговля", "year": 1875, "requires": ["trade_infrastructure", "railways"]},
                {"id": "global_trade", "name": "Глобальная торговля", "year": 1880, "requires": ["commodity_exchanges"]},
                {"id": "modern_commerce", "name": "Современная коммерция", "year": 1890, "requires": ["global_trade"]},
                {"id": "international_trade_system", "name": "Международная торговая система", "year": 1900, "requires": ["modern_commerce", "industrial_electrification"]},
            ]
        },
        {
            "id": "agriculture",
            "name": "Сельское хозяйство",
            "technologies": [
                {"id": "three_field_system", "name": "Трехполье", "year": 1500, "requires": []},
                {"id": "improved_plough", "name": "Улучшенный плуг", "year": 1520, "requires": ["agricultural_tools"]},
                {"id": "agricultural_tools", "name": "Сельскохозяйственные орудия", "year": 1530, "requires": ["three_field_system"]},
                {"id": "crop_rotation", "name": "Севооборот", "year": 1545, "requires": ["agricultural_tools"]},
                {"id": "fertilizers", "name": "Удобрения", "year": 1560, "requires": ["crop_rotation"]},
                {"id": "selection", "name": "Селекция", "year": 1580, "requires": ["crop_rotation"]},
                {"id": "land_drainage", "name": "Осушение земель", "year": 1600, "requires": ["fertilizers"]},
                {"id": "new_crops", "name": "Новые культуры", "year": 1620, "requires": ["selection"]},
                {"id": "improved_farming", "name": "Улучшенное земледелие", "year": 1640, "requires": ["new_crops"]},
                {"id": "four_field_system", "name": "Четырехполье", "year": 1660, "requires": ["improved_farming"]},
                {"id": "root_crops", "name": "Корнеплоды", "year": 1680, "requires": ["new_crops"]},
                {"id": "animal_selection", "name": "Селекция животных", "year": 1700, "requires": ["selection"]},
                {"id": "multi_field_rotation", "name": "Многопольный севооборот", "year": 1715, "requires": ["four_field_system"]},
                {"id": "grass_farming", "name": "Травосеяние", "year": 1730, "requires": ["multi_field_rotation"]},
                {"id": "drainage_systems", "name": "Дренажные системы", "year": 1740, "requires": ["improved_farming", "hydraulic_systems"]},
                {"id": "intensive_farming", "name": "Интенсивное земледелие", "year": 1760, "requires": ["multi_field_rotation"]},
                {"id": "plant_selection", "name": "Селекция растений", "year": 1770, "requires": ["grass_farming"]},
                {"id": "improved_livestock", "name": "Улучшенный скот", "year": 1780, "requires": ["animal_selection"]},
                {"id": "agricultural_science", "name": "Сельскохозяйственная наука", "year": 1790, "requires": ["plant_selection", "improved_livestock"]},
                {"id": "mechanical_seeders", "name": "Механические сеялки", "year": 1810, "requires": ["intensive_farming"]},
                {"id": "threshers", "name": "Молотилки", "year": 1820, "requires": ["intensive_farming"]},
                {"id": "mechanical_reapers", "name": "Механические жатки", "year": 1840, "requires": ["mechanical_seeders"]},
                {"id": "chemical_fertilizers", "name": "Химические удобрения", "year": 1850, "requires": ["organic_chemistry", "agricultural_science"]},
                {"id": "agricultural_machines", "name": "Сельскохозяйственные машины", "year": 1860, "requires": ["mechanical_reapers", "efficient_steam_engines"]},
                {"id": "steam_ploughs", "name": "Паровые плуги", "year": 1870, "requires": ["agricultural_machines"]},
                {"id": "combine_harvesters", "name": "Комбайны", "year": 1880, "requires": ["agricultural_machines", "quality_rolling"]},
                {"id": "modern_agriculture", "name": "Современное сельское хозяйство", "year": 1900, "requires": ["combine_harvesters", "chemical_fertilizers"]},
            ]
        },
        {
            "id": "resource_extraction",
            "name": "Добыча ресурсов",
            "technologies": [
                {"id": "open_pit_mining", "name": "Открытая добыча", "year": 1500, "requires": []},
                {"id": "shaft_mining", "name": "Шахтное дело", "year": 1520, "requires": ["open_pit_mining"]},
                {"id": "ore_mines", "name": "Рудники", "year": 1540, "requires": ["open_pit_mining"]},
                {"id": "mine_ventilation", "name": "Вентиляция шахт", "year": 1560, "requires": ["shaft_mining"]},
                {"id": "mine_drainage", "name": "Дренаж шахт", "year": 1570, "requires": ["mine_ventilation"]},
                {"id": "ore_extraction", "name": "Добыча руды", "year": 1590, "requires": ["shaft_mining"]},
                {"id": "deep_mines", "name": "Глубокие шахты", "year": 1610, "requires": ["mine_drainage"]},
                {"id": "coal_mining", "name": "Добыча угля", "year": 1630, "requires": ["ore_extraction"]},
                {"id": "improved_extraction", "name": "Улучшенная добыча", "year": 1650, "requires": ["deep_mines"]},
                {"id": "steam_pumps_mines", "name": "Паровые насосы для шахт", "year": 1670, "requires": ["improved_extraction", "savery_pump"]},
                {"id": "mine_safety", "name": "Безопасность шахт", "year": 1690, "requires": ["improved_extraction"]},
                {"id": "blasting_operations", "name": "Взрывные работы", "year": 1700, "requires": ["mine_safety", "gunpowder_production"]},
                {"id": "deep_mining", "name": "Глубокая разработка", "year": 1720, "requires": ["blasting_operations"]},
                {"id": "steam_hoists", "name": "Паровые подъемники", "year": 1740, "requires": ["deep_mining", "watt_engine"]},
                {"id": "vertical_shafts", "name": "Вертикальные шахты", "year": 1760, "requires": ["steam_hoists"]},
                {"id": "improved_ventilation", "name": "Улучшенная вентиляция", "year": 1770, "requires": ["deep_mining"]},
                {"id": "industrial_extraction", "name": "Промышленная добыча", "year": 1790, "requires": ["vertical_shafts"]},
                {"id": "steam_cutting_machines", "name": "Паровые врубовые машины", "year": 1810, "requires": ["industrial_extraction", "high_pressure_steam"]},
                {"id": "mine_railways", "name": "Железные рельсы в шахтах", "year": 1830, "requires": ["industrial_extraction", "rail_tracks"]},
                {"id": "dynamite_mining", "name": "Динамит для горных работ", "year": 1850, "requires": ["mine_railways", "dynamite"]},
                {"id": "deep_coal_mining", "name": "Глубокая добыча угля", "year": 1860, "requires": ["steam_cutting_machines"]},
                {"id": "mechanized_extraction", "name": "Механизированная добыча", "year": 1875, "requires": ["steam_cutting_machines", "compound_engines"]},
                {"id": "electric_mining", "name": "Электрическое горное оборудование", "year": 1890, "requires": ["mechanized_extraction", "electric_generators"]},
                {"id": "industrial_resource_extraction", "name": "Индустриальная добыча ресурсов", "year": 1900, "requires": ["electric_mining"]},
            ]
        },
        {
            "id": "tax_administration",
            "name": "Налоговая система и администрация",
            "technologies": [
                {"id": "feudal_taxes", "name": "Феодальные налоги", "year": 1500, "requires": []},
                {"id": "city_taxes", "name": "Городские налоги", "year": 1510, "requires": []},
                {"id": "tax_system_basic", "name": "Налоговая система", "year": 1530, "requires": ["city_taxes", "feudal_taxes"]},
                {"id": "customs_duties", "name": "Таможенные пошлины", "year": 1545, "requires": ["tax_system_basic"]},
                {"id": "excise_taxes", "name": "Акцизы", "year": 1560, "requires": ["tax_system_basic"]},
                {"id": "state_treasury", "name": "Государственная казна", "year": 1580, "requires": ["customs_duties", "excise_taxes"]},
                {"id": "tax_collectors", "name": "Налоговые сборщики", "year": 1600, "requires": ["state_treasury"]},
                {"id": "poll_tax", "name": "Подушная подать", "year": 1615, "requires": ["tax_collectors"]},
                {"id": "land_tax", "name": "Земельный налог", "year": 1630, "requires": ["tax_collectors"]},
                {"id": "trade_duties", "name": "Торговые пошлины", "year": 1645, "requires": ["customs_duties", "trading_companies"]},
                {"id": "unified_tax_system", "name": "Единая налоговая система", "year": 1660, "requires": ["poll_tax"]},
                {"id": "income_tax", "name": "Подоходный налог", "year": 1680, "requires": ["unified_tax_system"]},
                {"id": "tax_administration", "name": "Налоговая администрация", "year": 1700, "requires": ["unified_tax_system"]},
                {"id": "indirect_taxes", "name": "Косвенные налоги", "year": 1715, "requires": ["tax_administration"]},
                {"id": "state_budget", "name": "Государственный бюджет", "year": 1730, "requires": ["tax_administration", "central_banks"]},
                {"id": "financial_control", "name": "Финансовый контроль", "year": 1750, "requires": ["state_budget"]},
                {"id": "tax_reforms", "name": "Налоговые реформы", "year": 1770, "requires": ["state_budget"]},
                {"id": "efficient_tax_collection", "name": "Эффективный налоговый сбор", "year": 1785, "requires": ["tax_reforms"]},
                {"id": "progressive_taxation", "name": "Прогрессивное налогообложение", "year": 1810, "requires": ["tax_reforms"]},
                {"id": "profit_tax", "name": "Налог на прибыль", "year": 1830, "requires": ["tax_reforms"]},
                {"id": "tax_inspection", "name": "Налоговая инспекция", "year": 1850, "requires": ["efficient_tax_collection"]},
                {"id": "corporate_taxes", "name": "Корпоративные налоги", "year": 1865, "requires": ["efficient_tax_collection", "modern_banking"]},
                {"id": "financial_reporting", "name": "Финансовая отчетность", "year": 1880, "requires": ["corporate_taxes"]},
                {"id": "budget_planning", "name": "Бюджетное планирование", "year": 1890, "requires": ["corporate_taxes"]},
                {"id": "modern_fiscal_system", "name": "Современная фискальная система", "year": 1900, "requires": ["financial_reporting", "budget_planning"]},
            ]
        }
    ]
}

# ПРОМЫШЛЕННОСТЬ
INDUSTRY_TECH = {
    "id": "industry",
    "name": "Промышленность",
    "lines": [
        {
            "id": "metallurgy",
            "name": "Металлургия",
            "technologies": [
                {"id": "blacksmithing", "name": "Кузнечное дело", "year": 1500, "requires": []},
                {"id": "blast_furnaces_1", "name": "Доменные печи I", "year": 1510, "requires": ["blacksmithing"]},
                {"id": "iron_ore", "name": "Железная руда", "year": 1520, "requires": ["blast_furnaces_1"]},
                {"id": "blast_furnaces_2", "name": "Доменные печи II", "year": 1530, "requires": ["blast_furnaces_1"]},
                {"id": "cast_iron", "name": "Чугун", "year": 1540, "requires": ["iron_ore", "blast_furnaces_2"]},
                {"id": "wrought_iron", "name": "Кованое железо", "year": 1550, "requires": ["cast_iron"]},
                {"id": "improved_smelting", "name": "Улучшенная плавка", "year": 1560, "requires": ["blast_furnaces_2", "iron_ore"]},
                {"id": "quality_iron", "name": "Качественное железо", "year": 1570, "requires": ["improved_smelting"]},
                {"id": "steel_production_1", "name": "Стальное производство I", "year": 1580, "requires": ["improved_smelting"]},
                {"id": "charcoal", "name": "Древесный уголь", "year": 1620, "requires": ["blast_furnaces_1"]},
                {"id": "foundry_production", "name": "Литейное производство", "year": 1640, "requires": ["steel_production_1", "charcoal"]},
                {"id": "coal_for_metallurgy", "name": "Каменный уголь для металлургии", "year": 1660, "requires": ["charcoal", "blast_furnaces_2"]},
                {"id": "cast_iron_casting", "name": "Чугунное литье", "year": 1670, "requires": ["foundry_production", "cast_iron"]},
                {"id": "coking_coal", "name": "Коксование угля", "year": 1680, "requires": ["coal_for_metallurgy"]},
                {"id": "coke_blast_furnaces", "name": "Коксовые доменные печи", "year": 1690, "requires": ["coking_coal", "cast_iron_casting"]}, 
                {"id": "rolling_mills_1", "name": "Прокатные станы", "year": 1720, "requires": ["foundry_production"]},
                {"id": "puddling", "name": "Пудлингование", "year": 1730, "requires": ["coke_blast_furnaces"]},
                {"id": "quality_steel", "name": "Качественная сталь", "year": 1760, "requires": ["rolling_mills_1", "puddling"]},
                {"id": "iron_rolling", "name": "Прокат железа", "year": 1780, "requires": ["quality_steel"]},
                {"id": "cast_steel", "name": "Литая сталь", "year": 1800, "requires": ["quality_steel"]},
                {"id": "crucible_steel", "name": "Тигельная сталь", "year": 1810, "requires": ["cast_steel"]},
                {"id": "hot_blast", "name": "Горячее дутье", "year": 1820, "requires": ["iron_rolling"]},
                {"id": "quality_rolling", "name": "Качественный прокат", "year": 1840, "requires": ["hot_blast"]},
                {"id": "bessemer_process", "name": "Бессемеровский процесс", "year": 1850, "requires": ["quality_rolling"]},
                {"id": "mass_steel_production", "name": "Массовое производство стали", "year": 1865, "requires": ["bessemer_process"]},
                {"id": "open_hearth_process", "name": "Мартеновский процесс", "year": 1870, "requires": ["bessemer_process"]},
                {"id": "alloy_steel", "name": "Легированная сталь", "year": 1875, "requires": ["open_hearth_process"]},
                {"id": "high_quality_steel", "name": "Высококачественная сталь", "year": 1885, "requires": ["alloy_steel"]},
                {"id": "electrometallurgy", "name": "Электрометаллургия", "year": 1890, "requires": ["high_quality_steel"]},
                {"id": "industrial_metallurgy", "name": "Промышленная металлургия", "year": 1900, "requires": ["electrometallurgy"]},
            ]
        },
        {
            "id": "textiles",
            "name": "Текстильная промышленность",
            "technologies": [
                {"id": "hand_spinning", "name": "Ручное прядение", "year": 1500, "requires": []},
                {"id": "hand_weaving", "name": "Ручное ткачество", "year": 1510, "requires": ["hand_spinning"]},
                {"id": "improved_looms", "name": "Ткацкие станки", "year": 1530, "requires": ["hand_weaving"]},
                {"id": "wool_industry", "name": "Шерстяная промышленность", "year": 1540, "requires": ["hand_weaving"]},
                {"id": "textile_manufactory_1", "name": "Текстильные мануфактуры I", "year": 1560, "requires": ["improved_looms"]},
                {"id": "dyeing", "name": "Красильное дело", "year": 1570, "requires": ["textile_manufactory_1"]},
                {"id": "cotton_production", "name": "Хлопковое производство", "year": 1590, "requires": ["wool_industry"]},
                {"id": "textile_manufactory_2", "name": "Текстильные мануфактуры II", "year": 1610, "requires": ["dyeing"]},
                {"id": "printed_fabrics", "name": "Набивные ткани", "year": 1630, "requires": ["dyeing"]},
                {"id": "spinning_wheel_flyer", "name": "Прялка с рогулькой", "year": 1660, "requires": ["textile_manufactory_2"]},
                {"id": "flying_shuttle", "name": "Летучий челнок", "year": 1710, "requires": ["spinning_wheel_flyer"]},
                {"id": "spinning_jenny", "name": "Прядильная машина Харгривса", "year": 1720, "requires": ["flying_shuttle"]},
                {"id": "water_frame", "name": "Водяная прядильная машина", "year": 1730, "requires": ["flying_shuttle"]},
                {"id": "spinning_mule", "name": "Мюль-машина", "year": 1740, "requires": ["spinning_jenny", "water_frame"]},
                {"id": "mechanical_spinning", "name": "Механическое прядение", "year": 1750, "requires": ["spinning_mule"]},
                {"id": "power_loom", "name": "Механический ткацкий станок", "year": 1760, "requires": ["spinning_mule"]},
                {"id": "cotton_gin", "name": "Хлопкоочистительная машина", "year": 1790, "requires": ["mechanical_spinning"]},
                {"id": "factory_production_textile", "name": "Фабричное производство", "year": 1800, "requires": ["mechanical_spinning", "power_loom"]},
                {"id": "steam_powered_looms", "name": "Паровые ткацкие станки", "year": 1810, "requires": ["factory_production_textile"]},
                {"id": "jacquard_loom", "name": "Жаккардовый станок", "year": 1820, "requires": ["steam_powered_looms"]},
                {"id": "mass_fabric_production", "name": "Массовое производство тканей", "year": 1830, "requires": ["steam_powered_looms"]},
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
                {"id": "water_mills", "name": "Водяные мельницы", "year": 1500, "requires": []},
                {"id": "improved_water_wheels", "name": "Улучшенные водяные колеса", "year": 1510, "requires": ["water_mills"]},
                {"id": "windmills", "name": "Ветряные мельницы", "year": 1520, "requires": ["water_mills"]},
                {"id": "mechanical_transmissions", "name": "Механические передачи", "year": 1540, "requires": ["improved_water_wheels", "windmills"]},
                {"id": "industrial_water_wheels", "name": "Промышленные водяные колеса", "year": 1570, "requires": ["mechanical_transmissions"]},
                {"id": "pumps", "name": "Насосы", "year": 1590, "requires": ["industrial_water_wheels"]},
                {"id": "hydraulic_systems", "name": "Гидравлические системы", "year": 1600, "requires": ["industrial_water_wheels"]},
                {"id": "water_power", "name": "Водяная энергия", "year": 1640, "requires": ["pumps", "hydraulic_systems"]},
                {"id": "vacuum_pumps", "name": "Вакуумные насосы", "year": 1660, "requires": ["water_power"]},
                {"id": "savery_pump", "name": "Паровой насос Севери", "year": 1680, "requires": ["vacuum_pumps"]},
                {"id": "newcomen_engine", "name": "Паровая машина Ньюкомена", "year": 1690, "requires": ["savery_pump"]},
                {"id": "industrial_steam_engines", "name": "Промышленные паровые машины", "year": 1720, "requires": ["newcomen_engine"]},
                {"id": "watt_condenser", "name": "Конденсатор Уатта", "year": 1730, "requires": ["newcomen_engine"]},
                {"id": "watt_engine", "name": "Паровая машина Уатта", "year": 1740, "requires": ["watt_condenser"]},
                {"id": "rotary_steam_engine", "name": "Ротативная паровая машина", "year": 1760, "requires": ["industrial_steam_engines"]},
                {"id": "high_pressure_steam", "name": "Высокого давления паровые машины", "year": 1780, "requires": ["watt_engine"]},
                {"id": "industrial_steam_power", "name": "Промышленная паровая энергия", "year": 1800, "requires": ["rotary_steam_engine", "high_pressure_steam"]},
                {"id": "efficient_steam_engines", "name": "Эффективные паровые двигатели", "year": 1830, "requires": ["industrial_steam_power"]},
                {"id": "steam_turbines", "name": "Паровые турбины", "year": 1840, "requires": ["efficient_steam_engines"]},
                {"id": "compound_engines", "name": "Компаунд-машины", "year": 1850, "requires": ["efficient_steam_engines"]},
                {"id": "industrial_turbines", "name": "Промышленные турбины", "year": 1870, "requires": ["steam_turbines"]},
                {"id": "electric_generators", "name": "Электрогенераторы", "year": 1880, "requires": ["industrial_turbines"]},
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
                {"id": "alchemy", "name": "Алхимия", "year": 1500, "requires": []},
                {"id": "minerals", "name": "Минералы", "year": 1510, "requires": ["alchemy"]},
                {"id": "acids", "name": "Кислоты", "year": 1520, "requires": ["minerals"]},
                {"id": "alkalis", "name": "Щелочи", "year": 1530, "requires": ["minerals"]},
                {"id": "chemistry_basics", "name": "Основы химии", "year": 1550, "requires": ["acids", "alkalis"]},
                {"id": "experimental_chemistry", "name": "Экспериментальная химия", "year": 1570, "requires": ["chemistry_basics"]},
                {"id": "gunpowder_production", "name": "Производство пороха", "year": 1580, "requires": ["experimental_chemistry"]},
                {"id": "glass_production", "name": "Стекольное производство", "year": 1600, "requires": ["chemistry_basics"]},
                {"id": "saltpeter", "name": "Селитра", "year": 1640, "requires": ["gunpowder_production"]},
                {"id": "basic_chemistry", "name": "Основная химия", "year": 1650, "requires": ["experimental_chemistry"]},
                {"id": "hydrochloric_acid", "name": "Соляная кислота", "year": 1670, "requires": ["basic_chemistry"]},
                {"id": "sulfuric_acid", "name": "Серная кислота", "year": 1680, "requires": ["basic_chemistry"]},
                {"id": "industrial_chemistry_1", "name": "Промышленная химия I", "year": 1700, "requires": ["hydrochloric_acid", "sulfuric_acid"]},
                {"id": "chlorine", "name": "Хлор", "year": 1710, "requires": ["industrial_chemistry_1"]},
                {"id": "bleaching_powder", "name": "Отбеливающий порошок", "year": 1720, "requires": ["chlorine"]},
                {"id": "industrial_chemistry_2", "name": "Промышленная химия II", "year": 1740, "requires": ["industrial_chemistry_1"]},
                {"id": "ammonia", "name": "Аммиак", "year": 1760, "requires": ["industrial_chemistry_2"]},
                {"id": "leblanc_process", "name": "Процесс Леблана", "year": 1770, "requires": ["ammonia"]},
                {"id": "soda", "name": "Сода", "year": 1750, "requires": ["leblanc_process"]},
                {"id": "chemical_industry", "name": "Химическая промышленность", "year": 1780, "requires": ["leblanc_process"]},
                {"id": "solvay_process", "name": "Процесс Сольве", "year": 1830, "requires": ["chemical_industry"]},
                {"id": "chemical_fertilizers", "name": "Химические удобрения", "year": 1850, "requires": ["solvay_process"]},
                {"id": "aniline_dyes", "name": "Анилиновые красители", "year": 1860, "requires": ["chemical_fertilizers"]},
                {"id": "organic_chemistry", "name": "Органическая химия", "year": 1870, "requires": ["solvay_process"]},
                {"id": "explosives", "name": "Взрывчатые вещества", "year": 1875, "requires": ["organic_chemistry"]},
                {"id": "synthetic_dyes_chem", "name": "Синтетические красители", "year": 1880, "requires": ["organic_chemistry"]},
                {"id": "dynamite", "name": "Динамит", "year": 1880, "requires": ["explosives"]},
                {"id": "smokeless_powder_chem", "name": "Бездымный порох", "year": 1895, "requires": ["dynamite"]},
                {"id": "modern_chemical_industry", "name": "Современная химическая промышленность", "year": 1900, "requires": ["explosives", "synthetic_dyes_chem"]},
            ]
        },
        {
            "id": "production_methods",
            "name": "Производственные методы",
            "technologies": [
                {"id": "guild_production", "name": "Цеховое производство", "year": 1500, "requires": []},
                {"id": "craft_guilds", "name": "Ремесленные гильдии", "year": 1510, "requires": ["guild_production"]},
                {"id": "workshops", "name": "Мастерские", "year": 1520, "requires": ["guild_production"]},
                {"id": "labor_specialization", "name": "Специализация труда", "year": 1530, "requires": ["workshops"]},
                {"id": "quality_craftsmanship", "name": "Качественное ремесло", "year": 1540, "requires": ["workshops"]},
                {"id": "early_manufactories", "name": "Ранние мануфактуры", "year": 1570, "requires": ["workshops", "craft_guilds"]},
                {"id": "manufactory_production", "name": "Мануфактурное производство", "year": 1590, "requires": ["early_manufactories"]},
                {"id": "large_manufactories", "name": "Крупные мануфактуры", "year": 1630, "requires": ["manufactory_production"]},
                {"id": "production_organization", "name": "Организация производства", "year": 1670, "requires": ["large_manufactories"]},
                {"id": "machine_production", "name": "Машинное производство", "year": 1690, "requires": ["production_organization"]},
                {"id": "early_factories", "name": "Ранние фабрики", "year": 1700, "requires": ["machine_production"]},
                {"id": "mechanized_production", "name": "Механизированное производство", "year": 1710, "requires": ["machine_production"]},
                {"id": "standard_parts", "name": "Стандартные детали", "year": 1740, "requires": ["early_factories"]},
                {"id": "factory_system", "name": "Фабричная система", "year": 1750, "requires": ["mechanized_production", "standard_parts"]},
                {"id": "steam_factories", "name": "Паровые фабрики", "year": 1760, "requires": ["mechanized_production"]},
                {"id": "industrial_production_prod", "name": "Индустриальное производство", "year": 1780, "requires": ["steam_factories"]},
                {"id": "factory_production_methods", "name": "Заводское производство", "year": 1800, "requires": ["industrial_production_prod"]},
                {"id": "interchangeable_parts", "name": "Взаимозаменяемые детали", "year": 1810, "requires": ["industrial_production_prod", "iron_rolling"]},
                {"id": "standardization", "name": "Стандартизация", "year": 1820, "requires": ["interchangeable_parts"]},
                {"id": "machine_building", "name": "Машиностроение", "year": 1830, "requires": ["standardization"]},
                {"id": "precision_tools", "name": "Точные станки", "year": 1840, "requires": ["standardization"]},
                {"id": "assembly_line", "name": "Конвейерная сборка", "year": 1860, "requires": ["machine_building", "precision_tools"]},
                {"id": "mass_production", "name": "Массовое производство", "year": 1870, "requires": ["assembly_line"]},
                {"id": "production_electrification", "name": "Электрификация производства", "year": 1880, "requires": ["assembly_line", "electric_generators"]},
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
                {"id": "dirt_roads", "name": "Грунтовые дороги", "year": 1500, "requires": []},
                {"id": "paved_roads", "name": "Мощеные дороги", "year": 1520, "requires": ["dirt_roads"]},
                {"id": "road_construction", "name": "Дорожное строительство", "year": 1530, "requires": ["paved_roads"]},
                {"id": "post_stations_roads", "name": "Почтовые станции", "year": 1550, "requires": ["road_construction"]},
                {"id": "bridges", "name": "Мосты", "year": 1570, "requires": ["road_construction"]},
                {"id": "stone_bridges", "name": "Каменные мосты", "year": 1580, "requires": ["bridges"]},
                {"id": "road_network", "name": "Дорожная сеть", "year": 1590, "requires": ["bridges"]},
                {"id": "road_maintenance", "name": "Дорожное обслуживание", "year": 1620, "requires": ["road_network"]},
                {"id": "main_roads", "name": "Магистральные дороги", "year": 1650, "requires": ["road_network"]},
                {"id": "improved_bridges", "name": "Улучшенные мосты", "year": 1670, "requires": ["stone_bridges", "road_maintenance"]},
                {"id": "canals", "name": "Каналы", "year": 1680, "requires": ["improved_bridges"]},
                {"id": "locks", "name": "Шлюзы", "year": 1690, "requires": ["canals"]},
                {"id": "macadam_roads", "name": "Макадамовское покрытие", "year": 1720, "requires": ["main_roads"]},
                {"id": "river_navigation", "name": "Речное судоходство", "year": 1740, "requires": ["canals"]},
                {"id": "modern_bridges", "name": "Современные мосты", "year": 1760, "requires": ["improved_bridges"]},
                {"id": "navigable_canals", "name": "Судоходные каналы", "year": 1780, "requires": ["river_navigation"]},
                {"id": "transport_system", "name": "Транспортная система", "year": 1800, "requires": ["navigable_canals"]},
                {"id": "rail_tracks", "name": "Рельсовые пути", "year": 1810, "requires": ["transport_system", "iron_rolling"]},
                {"id": "steam_locomotives", "name": "Паровозы", "year": 1820, "requires": ["rail_tracks", "high_pressure_steam"]},
                {"id": "railways", "name": "Железные дороги", "year": 1830, "requires": ["steam_locomotives"]},
                {"id": "railway_network", "name": "Железнодорожная сеть", "year": 1840, "requires": ["railways"]},
                {"id": "railway_bridges", "name": "Железнодорожные мосты", "year": 1855, "requires": ["railways", "quality_rolling"]},
                {"id": "national_railway_network", "name": "Национальная железнодорожная сеть", "year": 1870, "requires": ["railway_network"]},
                {"id": "steel_rails", "name": "Стальные рельсы", "year": 1875, "requires": ["national_railway_network", "mass_steel_production"]},
                {"id": "railway_stations", "name": "Железнодорожные вокзалы", "year": 1880, "requires": ["steel_rails"]},
                {"id": "electric_trams", "name": "Электрические трамваи", "year": 1890, "requires": ["railway_stations", "electric_generators"]},
                {"id": "metro", "name": "Метрополитен", "year": 1895, "requires": ["railway_stations"]},
                {"id": "modern_transport_system", "name": "Современная транспортная система", "year": 1900, "requires": ["metro"]},
            ]
        },
        {
            "id": "urban_construction",
            "name": "Городское строительство",
            "technologies": [
                {"id": "wooden_construction", "name": "Деревянное строительство", "year": 1500, "requires": []},
                {"id": "stone_construction", "name": "Каменное строительство", "year": 1510, "requires": ["wooden_construction"]},
                {"id": "brick_production", "name": "Кирпичное производство", "year": 1520, "requires": ["wooden_construction"]},
                {"id": "city_fortifications", "name": "Городские укрепления", "year": 1530, "requires": ["stone_construction"]},
                {"id": "brick_construction", "name": "Кирпичное строительство", "year": 1540, "requires": ["brick_production"]},
                {"id": "multi_story_buildings", "name": "Многоэтажные здания", "year": 1560, "requires": ["brick_construction"]},
                {"id": "urban_planning", "name": "Городское планирование", "year": 1570, "requires": ["multi_story_buildings"]},
                {"id": "public_buildings", "name": "Общественные здания", "year": 1580, "requires": ["urban_planning"]},
                {"id": "sewerage", "name": "Канализация", "year": 1600, "requires": ["urban_planning"]},
                {"id": "water_supply", "name": "Водопроводы", "year": 1610, "requires": ["urban_planning"]},
                {"id": "urban_infrastructure", "name": "Городская инфраструктура", "year": 1650, "requires": ["sewerage", "water_supply"]},
                {"id": "regular_layout", "name": "Регулярная застройка", "year": 1660, "requires": ["urban_infrastructure"]},
                {"id": "bastion_fortifications", "name": "Бастионные укрепления", "year": 1700, "requires": ["city_fortifications"]},
                {"id": "public_parks", "name": "Общественные парки", "year": 1710, "requires": ["regular_layout"]},
                {"id": "street_lighting", "name": "Городское освещение", "year": 1720, "requires": ["regular_layout"]},
                {"id": "wide_streets", "name": "Широкие улицы", "year": 1730, "requires": ["regular_layout"]},
                {"id": "centralized_sewerage", "name": "Централизованная канализация", "year": 1780, "requires": ["wide_streets"]},
                {"id": "modern_development", "name": "Современная застройка", "year": 1800, "requires": ["centralized_sewerage"]},
                {"id": "industrial_districts", "name": "Промышленные кварталы", "year": 1810, "requires": ["modern_development"]},
                {"id": "reinforced_concrete", "name": "Железобетон", "year": 1820, "requires": ["modern_development", "cast_steel"]},
                {"id": "high_rise_development", "name": "Многоэтажная застройка", "year": 1830, "requires": ["reinforced_concrete"]},
                {"id": "gas_lighting", "name": "Газовое освещение", "year": 1840, "requires": ["street_lighting"]},
                {"id": "urban_sanitation", "name": "Городская санитария", "year": 1850, "requires": ["high_rise_development", "gas_lighting"]},
                {"id": "modern_sewerage", "name": "Современная канализация", "year": 1860, "requires": ["centralized_sewerage"]},
                {"id": "high_pressure_water", "name": "Водопровод высокого давления", "year": 1870, "requires": ["modern_sewerage"]},
                {"id": "electric_lighting", "name": "Электрическое освещение", "year": 1880, "requires": ["gas_lighting", "electric_generators"]},
                {"id": "skyscrapers", "name": "Небоскребы", "year": 1890, "requires": ["high_rise_development", "high_quality_steel"]},
                {"id": "modern_urban_planning", "name": "Современное городское планирование", "year": 1900, "requires": ["electric_lighting", "skyscrapers"]},
            ]
        },
        {
            "id": "port_infrastructure",
            "name": "Портовая инфраструктура",
            "technologies": [
                {"id": "wooden_piers", "name": "Деревянные причалы", "year": 1500, "requires": []},
                {"id": "port_facilities", "name": "Портовые сооружения", "year": 1510, "requires": ["wooden_piers"]},
                {"id": "improved_piers", "name": "Улучшенные причалы", "year": 1520, "requires": ["wooden_piers"]},
                {"id": "stone_moles", "name": "Каменные молы", "year": 1540, "requires": ["port_facilities"]},
                {"id": "port_warehouses", "name": "Портовые склады", "year": 1550, "requires": ["port_facilities"]},
                {"id": "harbors", "name": "Гавани", "year": 1560, "requires": ["port_warehouses"]},
                {"id": "docks", "name": "Доки", "year": 1570, "requires": ["harbors"]},
                {"id": "shipyards", "name": "Верфи", "year": 1610, "requires": ["harbors"]},
                {"id": "port_dredging", "name": "Портовое углубление", "year": 1620, "requires": ["docks"]},
                {"id": "port_infrastructure", "name": "Портовая инфраструктура", "year": 1640, "requires": ["shipyards", "port_dredging"]},
                {"id": "stone_docks", "name": "Каменные доки", "year": 1660, "requires": ["port_infrastructure"]},
                {"id": "dry_docks", "name": "Сухие доки", "year": 1670, "requires": ["port_infrastructure"]},
                {"id": "port_cranes", "name": "Портовые краны", "year": 1680, "requires": ["dry_docks"]},
                {"id": "deep_water_ports", "name": "Глубоководные порты", "year": 1720, "requires": ["port_infrastructure"]},
                {"id": "lighthouses", "name": "Маяки", "year": 1730, "requires": ["port_infrastructure"]},
                {"id": "modern_docks", "name": "Современные доки", "year": 1740, "requires": ["deep_water_ports"]},
                {"id": "port_equipment", "name": "Портовое оборудование", "year": 1750, "requires": ["modern_docks"]},
                {"id": "large_shipyards", "name": "Крупные верфи", "year": 1770, "requires": ["modern_docks"]},
                {"id": "stone_breakwaters", "name": "Каменные волноломы", "year": 1790, "requires": ["deep_water_ports"]},
                {"id": "modern_harbors", "name": "Современные гавани", "year": 1800, "requires": ["large_shipyards"]},
                {"id": "steam_cranes", "name": "Паровые краны", "year": 1810, "requires": ["modern_harbors", "industrial_steam_power"]},
                {"id": "iron_docks", "name": "Железные доки", "year": 1820, "requires": ["steam_cranes", "cast_iron"]},
                {"id": "modern_shipyards", "name": "Современные верфи", "year": 1830, "requires": ["iron_docks"]},
                {"id": "port_railway", "name": "Портовая железная дорога", "year": 1840, "requires": ["modern_shipyards", "railways"]},
                {"id": "steel_docks", "name": "Стальные доки", "year": 1850, "requires": ["port_railway", "quality_steel"]},
                {"id": "mechanized_loading", "name": "Механизированная погрузка", "year": 1860, "requires": ["steel_docks"]},
                {"id": "modern_port_infrastructure", "name": "Современная портовая инфраструктура", "year": 1870, "requires": ["mechanized_loading"]},
                {"id": "electric_cranes", "name": "Электрические краны", "year": 1880, "requires": ["modern_port_infrastructure", "electric_generators"]},
                {"id": "industrial_ports", "name": "Индустриальные порты", "year": 1900, "requires": ["electric_cranes"]},
            ]
        },
        {
            "id": "communications",
            "name": "Связь и коммуникации",
            "technologies": [
                {"id": "courier_service", "name": "Курьерская служба", "year": 1500, "requires": []},
                {"id": "postal_service", "name": "Почтовая служба", "year": 1520, "requires": ["courier_service", "post_stations_roads"]},
                {"id": "regular_mail", "name": "Регулярная почта", "year": 1540, "requires": ["postal_service"]},
                {"id": "state_post", "name": "Государственная почта", "year": 1560, "requires": ["postal_service"]},
                {"id": "postal_routes", "name": "Почтовые маршруты", "year": 1570, "requires": ["regular_mail"]},
                {"id": "post_offices", "name": "Почтовые конторы", "year": 1590, "requires": ["postal_routes"]},
                {"id": "postal_network", "name": "Почтовая сеть", "year": 1610, "requires": ["postal_routes", "road_network"]},
                {"id": "mail_coaches", "name": "Почтовые кареты", "year": 1620, "requires": ["postal_network"]},
                {"id": "postal_system", "name": "Почтовая система", "year": 1650, "requires": ["postal_network"]},
                {"id": "efficient_mail", "name": "Эффективная почта", "year": 1680, "requires": ["postal_system"]},
                {"id": "optical_telegraph", "name": "Оптический телеграф", "year": 1710, "requires": ["efficient_mail"]},
                {"id": "semaphore_communication", "name": "Семафорная связь", "year": 1720, "requires": ["optical_telegraph"]},
                {"id": "signal_towers", "name": "Сигнальные башни", "year": 1740, "requires": ["optical_telegraph"]},
                {"id": "telegraph_network", "name": "Телеграфная сеть", "year": 1750, "requires": ["semaphore_communication"]},
                {"id": "railway_mail", "name": "Железнодорожная почта", "year": 1780, "requires": ["railways", "efficient_mail"]},
                {"id": "modern_postal_system", "name": "Современная почтовая система", "year": 1800, "requires": ["railway_mail", "telegraph_network"]},      
                {"id": "electric_telegraph", "name": "Электрический телеграф", "year": 1820, "requires": ["modern_postal_system"]},
                {"id": "telegraph_lines", "name": "Телеграфные линии", "year": 1830, "requires": ["electric_telegraph"]},    
                {"id": "morse_code", "name": "Азбука Морзе", "year": 1840, "requires": ["electric_telegraph"]},
                {"id": "international_telegraph", "name": "Международный телеграф", "year": 1860, "requires": ["telegraph_lines"]},               
                {"id": "undersea_cables", "name": "Подводные кабели", "year": 1865, "requires": ["international_telegraph"]},
                {"id": "telephone", "name": "Телефон", "year": 1870, "requires": ["international_telegraph"]},     
                {"id": "telephone_lines", "name": "Телефонные линии", "year": 1875, "requires": ["telephone"]},
                {"id": "telephone_exchanges", "name": "Телефонные станции", "year": 1885, "requires": ["telephone_lines"]},
                {"id": "long_distance_communication", "name": "Междугородняя связь", "year": 1890, "requires": ["telephone_lines"]},
                {"id": "wireless_telegraph", "name": "Радиотелеграф", "year": 1895, "requires": ["long_distance_communication", "electric_grids"]},
                {"id": "modern_communications", "name": "Современные коммуникации", "year": 1900, "requires": ["wireless_telegraph"]},
            ]
        }
    ]
}

TECHNOLOGIES = {
    'land_forces': LAND_FORCES_TECH,
    'navy': NAVY_TECH,
    'education': EDUCATION_TECH,
    'economy': ECONOMY_TECH,
    'industry': INDUSTRY_TECH,
    'infrastructure': INFRASTRUCTURE_TECH
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

def is_tech_visible(tech_id: str, researched_ids: set, all_techs_map: dict, all_tech_ids_in_category: set) -> bool:
    """
    Определяет видимость технологии для игрока.
    Технология видна если:
    1. Нет требований (начальная технология)
    2. Изучена хотя бы одна из необходимых технологий (из requires)
    3. Изучена технология, которая зависит от данной
    """
    tech = all_techs_map.get(tech_id)
    if not tech:
        return False
    
    # Если нет требований - это начальная технология, она всегда видна
    requires = tech.get('requires', [])
    if not requires:
        return True
    
    # Фильтруем требования только в текущей категории
    requires_in_category = [r for r in requires if r in all_tech_ids_in_category]
    
    # Если хотя бы одно требование изучено - технология видна
    for req_id in requires_in_category:
        if req_id in researched_ids:
            return True
    
    # Проверяем, есть ли изученная технология, которая зависит от данной
    for other_tech_id, other_tech in all_techs_map.items():
        if other_tech_id in researched_ids:
            other_requires = other_tech.get('requires', [])
            if tech_id in other_requires:
                return True
    
    return False


@router.get("/tree/{category}")
async def get_tech_tree(category: str, request: Request, country_id: str = None, show_hidden: bool = False):
    user = await get_current_user(request)
    if not user:
        return JSONResponse({'success': False, 'error': 'Требуется авторизация'}, status_code=401)
    
    tech_data = None
    if category == "land_forces":
        tech_data = LAND_FORCES_TECH
    elif category == "navy":
        tech_data = NAVY_TECH
    elif category == "education":
        tech_data = EDUCATION_TECH
    elif category == "economy":
        tech_data = ECONOMY_TECH
    elif category == "industry":
        tech_data = INDUSTRY_TECH
    elif category == "infrastructure":
        tech_data = INFRASTRUCTURE_TECH
    
    if not tech_data:
        return JSONResponse({"success": False, "error": "Unknown category"}, status_code=404)
    
    # Собираем все ID технологий из текущей категории
    all_tech_ids_in_category = set()
    all_techs_map = {}
    for line in tech_data['lines']:
        for tech in line['technologies']:
            all_tech_ids_in_category.add(tech['id'])
            all_techs_map[tech['id']] = tech
    
    # Получаем изученные технологии страны
    researched_ids = set()
    if country_id:
        conn = get_db()
        cursor = conn.cursor()
        try:
            # Проверяем доступ
            is_admin = user.get('role') in ['admin', 'moderator']
            if not is_admin:
                cursor.execute("SELECT player_id FROM countries WHERE id = ?", (country_id,))
                country = cursor.fetchone()
                if not country or country['player_id'] != user['id']:
                    return JSONResponse({
                        "success": False,
                        "error": "Нет доступа к этой стране"
                    }, status_code=403)
            
            cursor.execute('''
                SELECT tech_id 
                FROM country_technologies 
                WHERE country_id = ?
            ''', (country_id,))
            
            researched_techs = cursor.fetchall()
            researched_ids = set(tech['tech_id'] for tech in researched_techs)
        finally:
            conn.close()
    
    # Определяем, нужно ли фильтровать скрытые технологии
    is_admin = user.get('role') in ['admin', 'moderator']
    filter_hidden = not (is_admin and show_hidden)
    
    sorted_tech_data = {
        'id': tech_data['id'],
        'name': tech_data['name'],
        'lines': []
    }
    
    for line in tech_data['lines']:
        sorted_line = {
            'id': line['id'],
            'name': line['name'],
            'technologies': []
        }
        
        for tech in line['technologies']:
            # Фильтруем скрытые технологии для обычных игроков
            if filter_hidden and not is_tech_visible(tech['id'], researched_ids, all_techs_map, all_tech_ids_in_category):
                continue
            
            tech_copy = tech.copy()
            # Фильтруем cross-category зависимости для корректного отображения дерева
            if tech.get('requires'):
                tech_copy['requires'] = [req for req in tech['requires'] if req in all_tech_ids_in_category]
            
            # Добавляем флаг hidden для админа, если он смотрит со show_hidden=True
            if is_admin and show_hidden:
                tech_copy['hidden'] = not is_tech_visible(tech['id'], researched_ids, all_techs_map, all_tech_ids_in_category)
            
            sorted_line['technologies'].append(tech_copy)
        
        # Сортируем для детерминированного порядка
        sorted_line['technologies'].sort(key=lambda t: (t['year'], t['id']))
        sorted_tech_data['lines'].append(sorted_line)
    
    return JSONResponse({"success": True, "data": sorted_tech_data})

@router.get("/player/progress")
async def get_player_tech_progress():
    # TODO: Оставлено для совместимости, позже удалить
    return JSONResponse({
        "success": True,
        "researched": [],
        "researching": None,
        "research_progress": 0
    })

@router.get("/country/{country_id}/progress")
async def get_country_tech_progress(country_id: str, request: Request):
    """Получить прогресс страны по технологиям"""
    sys.path.append('..')
    from main import get_current_user
    
    user = await get_current_user(request)
    if not user:
        return JSONResponse({
            "success": False,
            "error": "Требуется авторизация"
        }, status_code=401)
    
    if user.get('role') not in ['admin', 'moderator']:
        conn = get_db()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT player_id FROM countries WHERE id = ?", (country_id,))
            country = cursor.fetchone()
            if not country or country['player_id'] != user['id']:
                return JSONResponse({
                    "success": False,
                    "error": "Нет доступа к этой стране"
                }, status_code=403)
        finally:
            conn.close()
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT tech_id, researched_at 
            FROM country_technologies 
            WHERE country_id = ?
            ORDER BY researched_at ASC
        ''', (country_id,))
        
        researched_techs = cursor.fetchall()
        researched_ids = [tech['tech_id'] for tech in researched_techs]
        
        return JSONResponse({
            "success": True,
            "country_id": country_id,
            "researched": researched_ids,
            "researching": None,
            "research_progress": 0
        })
        
    except Exception as e:
        print(f"Error getting tech progress: {e}")
        return JSONResponse({
            "success": False,
            "error": "Ошибка получения прогресса"
        }, status_code=500)
    finally:
        conn.close()

class ResearchTechData(BaseModel):
    tech_id: str
    country_id: str

@router.post("/research")
async def research_technology(data: ResearchTechData, request: Request):
    """Изучить технологию для страны"""
    sys.path.append('..')
    from main import get_current_user
    
    user = await get_current_user(request)
    if not user:
        return JSONResponse({
            "success": False,
            "error": "Требуется авторизация"
        }, status_code=401)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT player_id, research_points FROM countries WHERE id = ?", (data.country_id,))
        country = cursor.fetchone()
        
        if not country:
            return JSONResponse({
                "success": False,
                "error": "Страна не найдена"
            }, status_code=404)
        
        is_admin = user.get('role') in ['admin', 'moderator']
        
        if not is_admin:
            if country['player_id'] != user['id']:
                return JSONResponse({
                    "success": False,
                    "error": "Нет доступа к этой стране"
                }, status_code=403)
        
        cursor.execute('''
            SELECT id FROM country_technologies 
            WHERE country_id = ? AND tech_id = ?
        ''', (data.country_id, data.tech_id))
        
        if cursor.fetchone():
            return JSONResponse({
                "success": False,
                "error": "Технология уже изучена"
            }, status_code=400)
        
        tech_cost = 0
        if not is_admin:
            tech_found = None
            for category_key in TECHNOLOGIES.keys():
                category_data = TECHNOLOGIES[category_key]
                for line in category_data.get('lines', []):
                    for tech in line.get('technologies', []):
                        if tech['id'] == data.tech_id:
                            tech_cost = tech.get('year', 0)
                            tech_found = tech
                            break
                    if tech_found:
                        break
                if tech_found:
                    break
            
            if not tech_found:
                return JSONResponse({
                    "success": False,
                    "error": "Технология не найдена"
                }, status_code=404)
            
            current_points = country['research_points']
            if current_points < tech_cost:
                return JSONResponse({
                    "success": False,
                    "error": f"Недостаточно очков исследований. Требуется: {tech_cost}, доступно: {current_points}"
                }, status_code=400)
            
            new_points = current_points - tech_cost
            cursor.execute(
                'UPDATE countries SET research_points = ? WHERE id = ?',
                (new_points, data.country_id)
            )
        
        now = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO country_technologies (country_id, tech_id, researched_at)
            VALUES (?, ?, ?)
        ''', (data.country_id, data.tech_id, now))
        
        conn.commit()
        
        response_data = {
            "success": True,
            "message": "Технология изучена",
            "tech_id": data.tech_id,
            "researched_at": now
        }
        
        if not is_admin:
            response_data["research_points_spent"] = tech_cost
            response_data["research_points_remaining"] = new_points
        
        return JSONResponse(response_data)
        
    except Exception as e:
        conn.rollback()
        print(f"Error researching technology: {e}")
        return JSONResponse({
            "success": False,
            "error": "Ошибка при изучении технологии"
        }, status_code=500)
    finally:
        conn.close()

@router.get("/admin/countries")
async def get_countries_for_tech_view(request: Request):
    sys.path.append('..')
    from main import get_current_user
    
    user = await get_current_user(request)
    if not user:
        return JSONResponse({
            "success": False,
            "error": "Требуется авторизация"
        }, status_code=401)
    
    if user.get('role') not in ['admin', 'moderator']:
        return JSONResponse({
            "success": False,
            "error": "Доступно только для администраторов"
        }, status_code=403)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT 
                c.id,
                c.country_name,
                c.ruler_first_name,
                c.ruler_last_name,
                c.player_id,
                u.username as player_username
            FROM countries c
            LEFT JOIN users u ON c.player_id = u.id
            ORDER BY c.country_name ASC
        ''')
        
        countries = cursor.fetchall()
        
        return JSONResponse({
            "success": True,
            "countries": [
                {
                    "id": country['id'],
                    "name": country['country_name'],
                    "ruler": f"{country['ruler_first_name']} {country['ruler_last_name']}",
                    "player": country['player_username']
                }
                for country in countries
            ]
        })
        
    except Exception as e:
        print(f"Error getting countries: {e}")
        return JSONResponse({
            "success": False,
            "error": "Ошибка получения списка стран"
        }, status_code=500)
    finally:
        conn.close()
