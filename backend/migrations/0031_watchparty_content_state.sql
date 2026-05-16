CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE watchparty_rooms
ADD COLUMN IF NOT EXISTS content_state_json JSONB NOT NULL DEFAULT '{}'::jsonb;

