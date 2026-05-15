DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'video_sources'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'episodes'
  ) THEN
    EXECUTE 'TRUNCATE TABLE video_sources RESTART IDENTITY CASCADE';
    EXECUTE 'TRUNCATE TABLE episodes RESTART IDENTITY CASCADE';
  END IF;
END $$;

ALTER TABLE episodes DROP CONSTRAINT IF EXISTS episodes_group_id_fkey;
ALTER TABLE episodes DROP CONSTRAINT IF EXISTS episodes_anime_id_server_number_group_id_number_key;
ALTER TABLE episodes DROP CONSTRAINT IF EXISTS idx_episode_unique;

ALTER TABLE episodes DROP COLUMN IF EXISTS group_id;
ALTER TABLE episodes DROP COLUMN IF EXISTS server_number;
ALTER TABLE episodes DROP COLUMN IF EXISTS video_url;

ALTER TABLE episodes ADD COLUMN IF NOT EXISTS kind VARCHAR(50) NOT NULL DEFAULT 'tv';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'episodes'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'episodes_anime_id_number_key'
  ) THEN
    ALTER TABLE episodes ADD CONSTRAINT episodes_anime_id_number_key UNIQUE (anime_id, number);
  END IF;
END $$;

ALTER TABLE video_sources ADD COLUMN IF NOT EXISTS voice_group_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_video_sources_episode_voice_group ON video_sources (episode_id, voice_group_id);

