CREATE TABLE IF NOT EXISTS rules (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  body_en TEXT NOT NULL,
  body_ru TEXT,
  body_uk TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rules_body_len CHECK (
    char_length(body_en) <= 10000 AND
    (body_ru IS NULL OR char_length(body_ru) <= 10000) AND
    (body_uk IS NULL OR char_length(body_uk) <= 10000)
  )
);

