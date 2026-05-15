DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'token_version'
  ) THEN
    -- already applied
  ELSE
    ALTER TABLE users
      ADD COLUMN token_version INTEGER NOT NULL DEFAULT 1;
  END IF;

  -- Ensure role column can hold new roles
  ALTER TABLE users
    ALTER COLUMN role TYPE VARCHAR(20);

  -- Optional: enforce allowed role values
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_role_allowed'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_role_allowed CHECK (role IN ('user', 'moderator', 'admin', 'root'));
  END IF;
END $$;

