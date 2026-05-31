DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM collection_types WHERE name = 'rewatching') THEN
    INSERT INTO collection_types (name) VALUES ('rewatching');
  END IF;
END $$;

DO $$
DECLARE
  ct_id INTEGER;
  ru_id INTEGER;
  en_id INTEGER;
BEGIN
  SELECT id INTO ct_id FROM collection_types WHERE name = 'rewatching' LIMIT 1;
  IF ct_id IS NULL THEN
    RETURN;
  END IF;

  SELECT id INTO ru_id FROM languages WHERE code = 'ru' LIMIT 1;
  SELECT id INTO en_id FROM languages WHERE code = 'en' LIMIT 1;

  IF ru_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM collection_type_translations
      WHERE collection_type_id = ct_id AND language_id = ru_id
    ) THEN
      INSERT INTO collection_type_translations (collection_type_id, language_id, name)
      VALUES (ct_id, ru_id, 'Пересматриваю');
    END IF;
  END IF;

  IF en_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM collection_type_translations
      WHERE collection_type_id = ct_id AND language_id = en_id
    ) THEN
      INSERT INTO collection_type_translations (collection_type_id, language_id, name)
      VALUES (ct_id, en_id, 'Rewatching');
    END IF;
  END IF;
END $$;
