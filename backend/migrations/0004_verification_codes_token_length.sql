DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'verification_codes'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'verification_codes'
        AND column_name = 'code'
    ) THEN
      ALTER TABLE verification_codes
      ALTER COLUMN code TYPE VARCHAR(128);
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'verification_codes'
        AND column_name = 'type'
    ) THEN
      ALTER TABLE verification_codes
      ALTER COLUMN type TYPE VARCHAR(64);
    END IF;
  END IF;
END $$;
