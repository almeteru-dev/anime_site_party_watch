DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'schedules'
  ) THEN
    CREATE TABLE schedules (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      anime_id BIGINT NOT NULL REFERENCES anime (id) ON DELETE CASCADE,
      release_datetime TIMESTAMP NOT NULL,
      episode_number INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX schedules_release_datetime_unique ON schedules (release_datetime);
    CREATE INDEX schedules_anime_id_idx ON schedules (anime_id);
    CREATE INDEX schedules_release_datetime_idx ON schedules (release_datetime);
  END IF;
END $$;

