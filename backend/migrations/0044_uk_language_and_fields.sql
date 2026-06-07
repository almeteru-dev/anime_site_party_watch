INSERT INTO languages (code, name)
VALUES ('uk', 'Українська')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE kind_options
  ADD COLUMN IF NOT EXISTS uk_name VARCHAR(255);

ALTER TABLE rating_options
  ADD COLUMN IF NOT EXISTS description_uk TEXT;

ALTER TABLE faq_items
  ADD COLUMN IF NOT EXISTS question_uk VARCHAR(500);

ALTER TABLE faq_items
  ADD COLUMN IF NOT EXISTS answer_uk TEXT;
