package models

import "time"

type VideoSourceType string

const (
	VideoSourceTypeIframe VideoSourceType = "iframe"
	VideoSourceTypeDirect VideoSourceType = "direct"
)

type VideoSource struct {
	ID                 int64           `gorm:"primaryKey;autoIncrement" json:"id"`
	EpisodeID          int64           `gorm:"not null;index" json:"episode_id"`
	VoiceGroupID       *int64          `gorm:"index" json:"voice_group_id,omitempty"`
	LabelID            *int64          `gorm:"index" json:"label_id"`
	Label              string          `gorm:"not null;type:varchar(255)" json:"label"`
	Type               VideoSourceType `gorm:"not null;type:varchar(50);default:'iframe'" json:"type"`
	URL                string          `gorm:"not null;type:varchar(500)" json:"url"`
	Audio              *string         `gorm:"type:varchar(10)" json:"audio,omitempty"`
	IsIntegratedPlayer bool            `gorm:"not null;default:false" json:"is_integrated_player"`
	IsDefault          bool            `gorm:"default:false" json:"is_default"`
	IsActive           bool            `gorm:"default:true" json:"is_active"`
	SortOrder          int             `gorm:"default:0" json:"sort_order"`
	CreatedAt          time.Time       `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`

	VideoLabel *VideoLabel `gorm:"foreignKey:LabelID" json:"video_label,omitempty"`
	VoiceGroup *VoiceGroup `gorm:"foreignKey:VoiceGroupID" json:"voice_group,omitempty"`

	Episode Episode `gorm:"foreignKey:EpisodeID;constraint:OnDelete:CASCADE" json:"-"`
}

type Episode struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	AnimeID   int64     `gorm:"not null;index;uniqueIndex:idx_episode_unique" json:"anime_id"`
	Number    int       `gorm:"not null;uniqueIndex:idx_episode_unique" json:"number"`
	Kind      string    `gorm:"not null;type:varchar(50);default:'tv'" json:"kind"`
	Duration  int       `json:"duration"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`

	Anime        Anime         `gorm:"foreignKey:AnimeID;constraint:OnDelete:CASCADE" json:"-"`
	VideoSources []VideoSource `gorm:"foreignKey:EpisodeID" json:"video_sources,omitempty"`
}
