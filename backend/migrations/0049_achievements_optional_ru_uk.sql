ALTER TABLE achievements
  ALTER COLUMN name_ru DROP NOT NULL,
  ALTER COLUMN name_uk DROP NOT NULL;

UPDATE achievements SET name_ru = NULL WHERE name_ru = '';
UPDATE achievements SET name_uk = NULL WHERE name_uk = '';

