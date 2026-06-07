CREATE TABLE IF NOT EXISTS achievements (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code VARCHAR(64) UNIQUE NOT NULL,
  name_en VARCHAR(140) NOT NULL,
  name_ru VARCHAR(140) NOT NULL,
  name_uk VARCHAR(140) NOT NULL,
  color VARCHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  achievement_id BIGINT NOT NULL REFERENCES achievements (id) ON DELETE CASCADE,
  assigned_by BIGINT REFERENCES users (id) ON DELETE SET NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements (user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements (achievement_id);

