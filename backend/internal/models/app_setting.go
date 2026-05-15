package models

import "time"

type AppSetting struct {
	Key       string    `gorm:"primaryKey;type:text" json:"key"`
	Value     string    `gorm:"type:text;not null" json:"value"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}
