DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'anime_alt_titles'
  ) THEN
    DROP TRIGGER IF EXISTS trg_enforce_anime_alt_titles_max_5 ON anime_alt_titles;
  END IF;
END $$;

DROP FUNCTION IF EXISTS enforce_anime_alt_titles_max_5();

