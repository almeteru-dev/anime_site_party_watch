ALTER TABLE anime
  ADD COLUMN IF NOT EXISTS shikimori_id INTEGER,
  ADD COLUMN IF NOT EXISTS mal_id INTEGER,
  ADD COLUMN IF NOT EXISTS worldart_id INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_anime_shikimori_id ON anime (shikimori_id) WHERE shikimori_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_anime_mal_id ON anime (mal_id) WHERE mal_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_anime_worldart_id ON anime (worldart_id) WHERE worldart_id IS NOT NULL;
