-- Compatibility migration for legacy episodes schema (0001_schema.sql)
-- The current API creates episodes without legacy columns (server_number, video_url).
-- Add safe defaults so inserts succeed, and optionally backfill video_sources from legacy data.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'episodes'
      AND column_name = 'server_number'
  ) THEN
    EXECUTE 'ALTER TABLE episodes ALTER COLUMN server_number SET DEFAULT 1';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'episodes'
      AND column_name = 'video_url'
  ) THEN
    EXECUTE 'ALTER TABLE episodes ALTER COLUMN video_url SET DEFAULT ''''';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'episodes'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'episodes' AND column_name = 'video_url'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'episodes' AND column_name = 'server_number'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'video_labels'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'video_sources'
  ) THEN
    INSERT INTO video_labels (name)
    SELECT DISTINCT 'Server ' || e.server_number::text
    FROM episodes e
    WHERE e.server_number IS NOT NULL
    ON CONFLICT (name) DO NOTHING;

    INSERT INTO video_sources (episode_id, label, label_id, type, url, is_default, is_active, sort_order, created_at)
    SELECT
      e.id,
      'Server ' || e.server_number::text,
      vl.id,
      'iframe',
      e.video_url,
      TRUE,
      TRUE,
      0,
      COALESCE(e.created_at, CURRENT_TIMESTAMP)
    FROM episodes e
    JOIN video_labels vl ON vl.name = ('Server ' || e.server_number::text)
    WHERE e.video_url IS NOT NULL
      AND btrim(e.video_url) <> ''
      AND NOT EXISTS (
        SELECT 1 FROM video_sources vs WHERE vs.episode_id = e.id
      );
  END IF;
END $$;
