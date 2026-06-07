ALTER TABLE video_sources
ADD COLUMN IF NOT EXISTS vod_url varchar(1000);

