package models

import (
	"time"
)

type User struct {
	ID           int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Username     string    `gorm:"unique;not null;type:varchar(40)" json:"username"`
	Email        string    `gorm:"unique;not null;type:varchar(255)" json:"email"`
	PasswordHash string    `gorm:"not null;type:varchar(255)" json:"-"`
	AvatarURL    string    `gorm:"type:varchar(500)" json:"avatar_url"`
	Age          int       `json:"age"`
	IsVerified   bool      `gorm:"default:false" json:"is_verified"`
	Role         string    `gorm:"not null;default:'user';type:varchar(20)" json:"role"`
	TokenVersion int       `gorm:"not null;default:1" json:"-"`
	IsBanned     bool      `gorm:"default:false" json:"is_banned"`
	BanReason    *string   `gorm:"type:text" json:"ban_reason"`
	CreatedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
}

type UserCollection struct {
	ID               int64          `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID           int64          `gorm:"not null" json:"user_id"`
	AnimeID          int64          `gorm:"not null" json:"anime_id"`
	CollectionTypeID int            `gorm:"not null" json:"collection_type_id"`
	EpisodesWatched  int            `gorm:"default:0" json:"episodes_watched"`
	Score            float64        `gorm:"type:decimal(3,1)" json:"score"`
	CreatedAt        time.Time      `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt        time.Time      `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
	User             User           `gorm:"foreignKey:UserID" json:"-"`
	Anime            Anime          `gorm:"foreignKey:AnimeID" json:"anime"`
	CollectionType   CollectionType `gorm:"foreignKey:CollectionTypeID" json:"collection_type"`
}
