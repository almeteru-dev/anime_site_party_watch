package models

import "time"

type WatchPartyRoom struct {
	ID              int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	OwnerUserID     int64      `json:"owner_user_id"`
	IsPublic        bool       `gorm:"not null;default:true" json:"is_public"`
	PasswordHash    *string    `gorm:"type:varchar(200)" json:"-"`
	InviteCode      string     `gorm:"not null;unique;type:varchar(32)" json:"invite_code"`
	Status          string     `gorm:"not null;default:'active';type:varchar(20)" json:"status"`
	DissolvedReason *string    `gorm:"type:varchar(50)" json:"dissolved_reason,omitempty"`
	DissolvedAt     *time.Time `json:"dissolved_at,omitempty"`
	ExpiresAt       time.Time  `json:"expires_at"`

	ContentStateJSON string    `gorm:"column:content_state;type:jsonb;not null;default:'{}'" json:"content_state"`
	IsPlaying        bool      `gorm:"not null;default:false" json:"is_playing"`
	PlaybackRate     float64   `gorm:"not null;default:1" json:"playback_rate"`
	PlaybackPosition float64   `gorm:"column:playback_position_sec;not null;default:0" json:"playback_position_sec"`
	PlaybackSeq      int64     `gorm:"not null;default:0" json:"playback_seq"`
	LastStateAt      time.Time `gorm:"not null;default:CURRENT_TIMESTAMP" json:"last_state_at"`
	CreatedAt        time.Time `gorm:"not null;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt        time.Time `gorm:"not null;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (WatchPartyRoom) TableName() string {
	return "watch_party_rooms"
}

type WatchPartyRoomMember struct {
	ID         int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	RoomID     int64      `gorm:"not null;index" json:"room_id"`
	UserID     int64      `gorm:"not null;index" json:"user_id"`
	Role       string     `gorm:"not null;default:'viewer';type:varchar(20)" json:"role"`
	JoinedAt   time.Time  `gorm:"not null;default:CURRENT_TIMESTAMP" json:"joined_at"`
	LastSeenAt time.Time  `gorm:"not null;default:CURRENT_TIMESTAMP" json:"last_seen_at"`
	LeftAt     *time.Time `json:"left_at,omitempty"`
}

func (WatchPartyRoomMember) TableName() string {
	return "watch_party_room_members"
}

type WatchPartyRoomMessage struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	RoomID    int64     `gorm:"not null;index" json:"room_id"`
	UserID    int64     `gorm:"not null;index" json:"user_id"`
	Message   string    `gorm:"not null;type:text" json:"message"`
	CreatedAt time.Time `gorm:"not null;default:CURRENT_TIMESTAMP" json:"created_at"`
}

func (WatchPartyRoomMessage) TableName() string {
	return "watch_party_room_messages"
}
