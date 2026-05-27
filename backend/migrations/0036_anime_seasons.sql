ALTER TABLE anime
  ADD COLUMN IF NOT EXISTS season_number integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS first_season_id bigint NULL;

ALTER TABLE anime
  ADD CONSTRAINT anime_first_season_fk
  FOREIGN KEY (first_season_id) REFERENCES anime(id)
  ON DELETE SET NULL;

ALTER TABLE anime
  ADD CONSTRAINT anime_season_number_positive CHECK (season_number >= 1);

ALTER TABLE anime
  ADD CONSTRAINT anime_season_relation_check CHECK (
    (season_number = 1 AND first_season_id IS NULL) OR
    (season_number > 1 AND first_season_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_anime_first_season_id ON anime(first_season_id);
CREATE INDEX IF NOT EXISTS idx_anime_first_season_season_number ON anime(first_season_id, season_number);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_anime_season_in_group
  ON anime(first_season_id, season_number)
  WHERE first_season_id IS NOT NULL;

