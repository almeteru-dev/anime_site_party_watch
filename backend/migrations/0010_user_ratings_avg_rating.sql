DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'anime' AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE anime
      ADD COLUMN average_rating NUMERIC(3,1) NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'anime' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE anime
      ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_ratings'
  ) THEN
    CREATE TABLE user_ratings (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      anime_id BIGINT NOT NULL REFERENCES anime (id) ON DELETE CASCADE,
      rating NUMERIC(3,1) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT user_ratings_rating_range CHECK (rating >= 0 AND rating <= 10),
      CONSTRAINT user_ratings_user_anime_unique UNIQUE (user_id, anime_id)
    );
    CREATE INDEX user_ratings_anime_id_idx ON user_ratings(anime_id);
  END IF;
END $$;
