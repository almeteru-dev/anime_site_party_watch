ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_release_datetime_key;

DROP INDEX IF EXISTS schedules_release_datetime_key;

ALTER TABLE schedules
  ADD CONSTRAINT schedules_anime_episode_unique UNIQUE (anime_id, episode_number);

