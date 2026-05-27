package models

import (
	"time"

	"github.com/gorilla/websocket"
)

// User - участник комнаты, модель для хранения в памяти (in-memory)
type InMemoryUser struct {
	ID       string
	Name     string
	IsOwner  bool
	Conn     *websocket.Conn
	UserID   int64 // Внутренний ID пользователя из БД
	RoomID   string
}

// Room - комната совместного просмотра in-memory
type InMemoryRoom struct {
	ID         string              // UUID комнаты
	OwnerID    string              // ID пользователя-владельца (in-memory)
	OwnerUserID int64              // Внутренний ID владельца из БД
	Users      map[string]*InMemoryUser // key: in-memory user ID
	CreatedAt  time.Time
	ExpiresAt  time.Time
	CurrentState PlayerState
	OwnerAdPlaying bool
	Chat       []InMemoryChatMessage
}

type InMemoryChatMessage struct {
	ID       string    `json:"id"`
	UserID   int64     `json:"user_id"`
	Name     string    `json:"name"`
	Message  string    `json:"message"`
	SentAt   time.Time `json:"sent_at"`
}

// PlayerState - текущее состояние плеера для всех участников
type PlayerState struct {
	IsPlaying     bool    `json:"is_playing"`
	Time          float64 `json:"time"`
	Season        int     `json:"season"`
	Episode       int     `json:"episode"`
	TranslationID int     `json:"translationId"`
}

// Message - сообщение, передаваемое через WebSocket между клиентами и сервером
type WSMessage struct {
	Type    string      `json:"type"` // play, pause, seek, change_episode, transfer_ownership, users_update
	Payload interface{} `json:"payload"`
}

// DB модель для PostgreSQL (GORM)
type DBWatchPartyRoom struct {
	ID              string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	OwnerUserID     int64     `gorm:"not null;index" json:"owner_user_id"`
	CreatedAt       time.Time `gorm:"not null;default:CURRENT_TIMESTAMP" json:"created_at"`
	ExpiresAt       time.Time `gorm:"not null;index" json:"expires_at"` // Автоматически удаляется через 12 часов
	CurrentIsPlaying bool     `gorm:"not null;default:false" json:"current_is_playing"`
	CurrentTimeSec  float64   `gorm:"column:current_time_sec;not null;default:0" json:"current_time_sec"`
	CurrentSeason   int       `gorm:"not null;default:1" json:"current_season"`
	CurrentEpisode  int       `gorm:"not null;default:1" json:"current_episode"`
	CurrentTranslationID int `gorm:"not null;default:0" json:"current_translation_id"`
	ContentStateJSON string `gorm:"column:content_state_json;type:text;not null;default:'{}'" json:"-"`
}

func (DBWatchPartyRoom) TableName() string {
	return "watchparty_rooms"
}

// DB модель участников комнаты
type DBWatchPartyRoomMember struct {
	RoomID     string    `gorm:"primaryKey;type:uuid;references:watchparty_rooms.id;onDelete:CASCADE" json:"room_id"`
	UserID     int64     `gorm:"primaryKey" json:"user_id"`
	Username   string    `gorm:"not null;type:varchar(255)" json:"username"`
	IsOwner    bool      `gorm:"not null;default:false" json:"is_owner"`
	JoinedAt   time.Time `gorm:"not null;default:CURRENT_TIMESTAMP" json:"joined_at"`
}

func (DBWatchPartyRoomMember) TableName() string {
	return "watchparty_room_users"
}
