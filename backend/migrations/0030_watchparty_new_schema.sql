-- Миграция для новой схемы Watch Party (с нуля)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Удаляем старые таблицы чтобы избежать конфликтов
DROP TABLE IF EXISTS watch_party_room_messages;
DROP TABLE IF EXISTS watch_party_room_members;
DROP TABLE IF EXISTS watch_party_rooms;

-- Новая таблица комнат
CREATE TABLE watchparty_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    current_is_playing BOOLEAN DEFAULT false,
    current_time_sec FLOAT8 DEFAULT 0,
    current_season INTEGER DEFAULT 1,
    current_episode INTEGER DEFAULT 1,
    current_translation_id INTEGER DEFAULT 0
);

-- Индекс для быстрого поиска и очистки истекших комнат
CREATE INDEX idx_watchparty_rooms_expires_at ON watchparty_rooms(expires_at);
CREATE INDEX idx_watchparty_rooms_owner ON watchparty_rooms(owner_user_id);

-- Новая таблица участников комнат
CREATE TABLE watchparty_room_users (
    room_id UUID REFERENCES watchparty_rooms(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    username VARCHAR(255) NOT NULL,
    is_owner BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);
