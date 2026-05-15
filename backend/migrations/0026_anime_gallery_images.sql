CREATE TABLE IF NOT EXISTS anime_gallery_images (
  id BIGSERIAL PRIMARY KEY,
  anime_id BIGINT NOT NULL,
  url VARCHAR(500) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_anime_gallery_images_anime FOREIGN KEY (anime_id) REFERENCES anime(id) ON DELETE CASCADE,
  CONSTRAINT uniq_anime_gallery_images_order UNIQUE (anime_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_anime_gallery_images_anime_id ON anime_gallery_images (anime_id);

