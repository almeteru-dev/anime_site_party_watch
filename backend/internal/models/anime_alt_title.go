package models

import "time"

type AnimeAltTitle struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	AnimeID   int64     `gorm:"not null;index" json:"anime_id"`
	Title     string    `gorm:"not null;type:varchar(255)" json:"title"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
}

func (AnimeAltTitle) TableName() string {
	return "anime_alt_titles"
}
