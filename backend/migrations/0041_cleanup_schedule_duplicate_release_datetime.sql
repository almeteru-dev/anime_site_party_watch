WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY anime_id, release_datetime
      ORDER BY episode_number DESC, updated_at DESC, id DESC
    ) AS rn
  FROM schedules
)
DELETE FROM schedules s
USING ranked r
WHERE s.id = r.id AND r.rn > 1;
