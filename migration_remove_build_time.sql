-- Миграция для удаления времени строительства
-- Выполните этот скрипт если у вас уже есть данные в базе

-- Создаём новую таблицу building_types без поля build_time
CREATE TABLE IF NOT EXISTS building_types_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    base_cost INTEGER NOT NULL DEFAULT 1000,
    maintenance_cost INTEGER NOT NULL DEFAULT 100,
    effect_type TEXT,
    effect_value REAL
);

-- Копируем данные из старой таблицы
INSERT INTO building_types_new (id, name, description, base_cost, maintenance_cost, effect_type, effect_value)
SELECT id, name, description, base_cost, maintenance_cost, effect_type, effect_value
FROM building_types;

-- Удаляем старую таблицу
DROP TABLE building_types;

-- Переименовываем новую таблицу
ALTER TABLE building_types_new RENAME TO building_types;

-- Создаём новую таблицу buildings без поля construction_turn
CREATE TABLE IF NOT EXISTS buildings_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    province_id INTEGER NOT NULL,
    building_type_id INTEGER NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    built_at TEXT NOT NULL,
    FOREIGN KEY (province_id) REFERENCES provinces (id) ON DELETE CASCADE,
    FOREIGN KEY (building_type_id) REFERENCES building_types (id)
);

-- Копируем данные из старой таблицы
INSERT INTO buildings_new (id, province_id, building_type_id, level, built_at)
SELECT id, province_id, building_type_id, level, built_at
FROM buildings;

-- Удаляем старую таблицу
DROP TABLE buildings;

-- Переименовываем новую таблицу
ALTER TABLE buildings_new RENAME TO buildings;
