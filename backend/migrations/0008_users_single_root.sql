DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'users_one_root'
  ) THEN
    CREATE UNIQUE INDEX users_one_root ON users (role) WHERE role = 'root';
  END IF;
END $$;
