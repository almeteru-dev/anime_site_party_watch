package models

import "time"

type AnimeGalleryImage struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	AnimeID   int64     `gorm:"not null;index" json:"anime_id"`
	URL       string    `gorm:"not null;type:varchar(500)" json:"url"`
	SortOrder int       `gorm:"not null;default:0" json:"sort_order"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
}

func (AnimeGalleryImage) TableName() string {
	return "anime_gallery_images"
}
