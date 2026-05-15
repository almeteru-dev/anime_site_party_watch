DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'app_settings'
  ) THEN
    INSERT INTO app_settings(key, value)
    VALUES ('private_mode', 'false')
    ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;

