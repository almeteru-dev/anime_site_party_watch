INSERT INTO app_settings (key, value)
SELECT 'registration_disabled', 'false'
WHERE NOT EXISTS (
  SELECT 1 FROM app_settings WHERE key = 'registration_disabled'
);
