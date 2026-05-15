package models

import "time"

type VerificationCode struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    int64     `gorm:"not null" json:"user_id"`
	Email     string    `gorm:"not null" json:"email"`
	Code      string    `gorm:"not null" json:"code"`
	Type      string    `gorm:"not null" json:"type"` // "old_email", "new_email"
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
}
