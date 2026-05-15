DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'user_ratings'
      AND constraint_name = 'user_ratings_rating_range'
  ) THEN
    ALTER TABLE user_ratings DROP CONSTRAINT user_ratings_rating_range;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_ratings'
  ) THEN
    ALTER TABLE user_ratings
      ADD CONSTRAINT user_ratings_rating_range CHECK (rating >= 0 AND rating <= 9);
  END IF;
END $$;

