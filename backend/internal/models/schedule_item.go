package models

import "time"

type ScheduleItem struct {
	ID              int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	AnimeID          int64     `gorm:"column:anime_id;not null" json:"anime_id"`
	ReleaseDateTime  time.Time `gorm:"column:release_datetime;not null" json:"release_datetime"`
	EpisodeNumber    int       `gorm:"column:episode_number;not null" json:"episode_number"`
	CreatedAt        time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt        time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (ScheduleItem) TableName() string {
	return "schedules"
}

