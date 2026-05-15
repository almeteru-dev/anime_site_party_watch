INSERT INTO app_settings (key, value)
VALUES ('schedule_timezone', 'UTC')
ON CONFLICT (key) DO NOTHING;

