ALTER TABLE genres ADD COLUMN IF NOT EXISTS description_en TEXT;

ALTER TABLE genre_translations ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE themes ADD COLUMN IF NOT EXISTS description_en TEXT;

ALTER TABLE theme_translations ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE rating_options ADD COLUMN IF NOT EXISTS description_en TEXT;

ALTER TABLE rating_options ADD COLUMN IF NOT EXISTS description_ru TEXT;

