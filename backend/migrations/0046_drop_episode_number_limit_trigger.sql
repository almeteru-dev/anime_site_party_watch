DO $$
BEGIN
  DROP TRIGGER IF EXISTS trg_enforce_episode_number_limit ON episodes;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

DROP FUNCTION IF EXISTS enforce_episode_number_limit();

