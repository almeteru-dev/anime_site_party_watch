CREATE TABLE IF NOT EXISTS user_watch_progress (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anime_id BIGINT NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  episode_number INT NOT NULL CHECK (episode_number > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, anime_id)
);

CREATE INDEX IF NOT EXISTS idx_user_watch_progress_user_updated ON user_watch_progress (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_watch_progress_user_anime ON user_watch_progress (user_id, anime_id);
