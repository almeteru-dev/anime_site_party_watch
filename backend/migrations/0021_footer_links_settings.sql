INSERT INTO app_settings (key, value)
SELECT 'footer_contact_url', ''
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'footer_contact_url');

INSERT INTO app_settings (key, value)
SELECT 'footer_social_links', '{"telegram_url":"https://t.me/","vk":{"enabled":false,"url":""},"twitter":{"enabled":false,"url":""},"instagram":{"enabled":false,"url":""},"whatsapp":{"enabled":false,"url":""}}'
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'footer_social_links');
