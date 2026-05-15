CREATE TABLE IF NOT EXISTS video_labels (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  is_external_player BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS video_sources (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  episode_id BIGINT NOT NULL REFERENCES episodes (id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  label_id BIGINT REFERENCES video_labels (id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'iframe',
  url VARCHAR(500) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE video_sources ADD COLUMN IF NOT EXISTS label_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'video_sources'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'video_sources_label_id_fkey'
  ) THEN
    ALTER TABLE video_sources
      ADD CONSTRAINT video_sources_label_id_fkey
      FOREIGN KEY (label_id) REFERENCES video_labels(id)
      ON DELETE SET NULL;
  END IF;
END $$;

INSERT INTO video_labels (name)
SELECT DISTINCT label
FROM video_sources
WHERE label IS NOT NULL AND btrim(label) <> ''
ON CONFLICT (name) DO NOTHING;

UPDATE video_sources vs
SET label_id = vl.id
FROM video_labels vl
WHERE vs.label_id IS NULL
  AND btrim(vs.label) <> ''
  AND vl.name = vs.label;

CREATE INDEX IF NOT EXISTS idx_video_sources_label_id ON video_sources (label_id);
