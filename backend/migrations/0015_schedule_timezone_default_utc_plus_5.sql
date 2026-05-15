DO $$
DECLARE
  cur_tz TEXT;
BEGIN
  SELECT value INTO cur_tz FROM app_settings WHERE key = 'schedule_timezone';

  IF cur_tz IS NULL THEN
    INSERT INTO app_settings (key, value)
    VALUES ('schedule_timezone', 'Etc/GMT-5')
    ON CONFLICT (key) DO NOTHING;
    RETURN;
  END IF;

  cur_tz := btrim(cur_tz);

  IF cur_tz = '' OR lower(cur_tz) IN ('utc', 'etc/utc', 'etc/gmt') THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'schedules'
    ) THEN
      UPDATE schedules
      SET release_datetime = release_datetime - INTERVAL '5 hours';
    END IF;

    UPDATE app_settings
    SET value = 'Etc/GMT-5', updated_at = CURRENT_TIMESTAMP
    WHERE key = 'schedule_timezone';
  END IF;
END $$;
