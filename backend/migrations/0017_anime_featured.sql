ALTER TABLE anime
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE anime
  ADD COLUMN IF NOT EXISTS featured_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_anime_is_featured ON anime (is_featured);
CREATE INDEX IF NOT EXISTS idx_anime_featured_at ON anime (featured_at);

UPDATE anime
SET featured_at = COALESCE(featured_at, CURRENT_TIMESTAMP)
WHERE is_featured = TRUE AND featured_at IS NULL;
