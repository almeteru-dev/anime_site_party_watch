package models

import "time"

type Achievement struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Code      string    `gorm:"unique;not null;type:varchar(64)" json:"code"`
	NameEn    string    `gorm:"not null;type:varchar(140)" json:"name_en"`
	NameRu    *string   `gorm:"type:varchar(140)" json:"name_ru"`
	NameUk    *string   `gorm:"type:varchar(140)" json:"name_uk"`
	Color     string    `gorm:"not null;type:varchar(32)" json:"color"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

type UserAchievement struct {
	ID            int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID        int64     `gorm:"not null" json:"user_id"`
	AchievementID int64     `gorm:"not null" json:"achievement_id"`
	AssignedBy    *int64    `json:"assigned_by"`
	AssignedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"assigned_at"`
}
