ALTER TABLE anime
  ADD COLUMN IF NOT EXISTS shiki_english JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS shiki_japanese JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS shiki_synonyms JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS shiki_fansubbers JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS shiki_fandubbers JSONB NOT NULL DEFAULT '[]'::jsonb;
