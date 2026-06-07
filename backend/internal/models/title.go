package models

import "time"

type Title struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Code      string    `gorm:"unique;not null;type:varchar(64)" json:"code"`
	NameEn    string    `gorm:"not null;type:varchar(140)" json:"name_en"`
	NameRu    *string   `gorm:"type:varchar(140)" json:"name_ru"`
	NameUk    *string   `gorm:"type:varchar(140)" json:"name_uk"`
	Color     string    `gorm:"not null;type:varchar(32)" json:"color"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

type UserTitle struct {
	ID       int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID   int64     `gorm:"not null" json:"user_id"`
	TitleID  int64     `gorm:"not null" json:"title_id"`
	AssignedBy *int64  `json:"assigned_by"`
	AssignedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"assigned_at"`
}

