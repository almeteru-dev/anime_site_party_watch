ALTER TABLE anime
  ADD COLUMN IF NOT EXISTS rating_avg DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS anime_ratings (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  anime_id BIGINT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_anime_ratings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_anime_ratings_anime FOREIGN KEY (anime_id) REFERENCES anime(id) ON DELETE CASCADE,
  CONSTRAINT uniq_anime_ratings_user_anime UNIQUE (user_id, anime_id)
);

CREATE INDEX IF NOT EXISTS idx_anime_ratings_anime_id ON anime_ratings (anime_id);
CREATE INDEX IF NOT EXISTS idx_anime_ratings_user_id ON anime_ratings (user_id);

