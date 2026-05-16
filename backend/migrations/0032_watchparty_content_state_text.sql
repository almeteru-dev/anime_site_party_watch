ALTER TABLE watchparty_rooms
ALTER COLUMN content_state_json TYPE TEXT USING content_state_json::text;

ALTER TABLE watchparty_rooms
ALTER COLUMN content_state_json SET DEFAULT '{}'::text;

