package models

import "time"

type Rule struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	BodyEn    string    `gorm:"column:body_en;type:text;not null" json:"body_en"`
	BodyRu    *string   `gorm:"column:body_ru;type:text" json:"body_ru"`
	BodyUk    *string   `gorm:"column:body_uk;type:text" json:"body_uk"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updated_at"`
}

