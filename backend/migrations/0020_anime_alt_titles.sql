CREATE TABLE IF NOT EXISTS anime_alt_titles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  anime_id BIGINT NOT NULL REFERENCES anime (id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_anime_alt_titles_unique
  ON anime_alt_titles (anime_id, lower(title));

CREATE INDEX IF NOT EXISTS idx_anime_alt_titles_anime_id ON anime_alt_titles (anime_id);

CREATE OR REPLACE FUNCTION enforce_anime_alt_titles_max_5()
RETURNS trigger AS $$
BEGIN
  IF (SELECT count(*) FROM anime_alt_titles WHERE anime_id = NEW.anime_id) >= 5 THEN
    RAISE EXCEPTION 'Max 5 alternative titles per anime';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'anime_alt_titles'
  ) THEN
    DROP TRIGGER IF EXISTS trg_enforce_anime_alt_titles_max_5 ON anime_alt_titles;
    CREATE TRIGGER trg_enforce_anime_alt_titles_max_5
    BEFORE INSERT ON anime_alt_titles
    FOR EACH ROW
    EXECUTE FUNCTION enforce_anime_alt_titles_max_5();
  END IF;
END $$;
