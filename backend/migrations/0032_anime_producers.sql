CREATE TABLE IF NOT EXISTS anime_producers (
  anime_id BIGINT NOT NULL REFERENCES anime (id) ON DELETE CASCADE,
  producer_id INTEGER NOT NULL REFERENCES producers (id) ON DELETE CASCADE,
  PRIMARY KEY (anime_id, producer_id)
);

CREATE INDEX IF NOT EXISTS idx_anime_producers_producer_id ON anime_producers (producer_id);

INSERT INTO anime_producers (anime_id, producer_id)
SELECT id, producer_id
FROM anime
WHERE producer_id IS NOT NULL
ON CONFLICT DO NOTHING;
