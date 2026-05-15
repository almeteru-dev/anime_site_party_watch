package handlers

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
)

type watchPartyClient struct {
	conn    *websocket.Conn
	roomID  int64
	userID  int64
	role    string
	sendMu  sync.Mutex
	closed  bool
	closeMu sync.Mutex
}

func (c *watchPartyClient) send(v any) {
	c.sendMu.Lock()
	defer c.sendMu.Unlock()
	if c.closed {
		return
	}
	_ = c.conn.WriteJSON(v)
}

func (c *watchPartyClient) close() {
	c.closeMu.Lock()
	defer c.closeMu.Unlock()
	if c.closed {
		return
	}
	c.closed = true
	_ = c.conn.Close()
}

type watchPartyHub struct {
	mu       sync.RWMutex
	rooms    map[int64]map[*watchPartyClient]struct{}
	buffering map[int64]map[int64]bool
	resumeAfterBuffering map[int64]bool
	upgrader websocket.Upgrader
}

var wpHub = &watchPartyHub{
	rooms: map[int64]map[*watchPartyClient]struct{}{},
	buffering: map[int64]map[int64]bool{},
	resumeAfterBuffering: map[int64]bool{},
	upgrader: websocket.Upgrader{
		ReadBufferSize:  4096,
		WriteBufferSize: 4096,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	},
}

func (h *watchPartyHub) setBuffering(roomID int64, userID int64, isBuffering bool) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.buffering[roomID] == nil {
		h.buffering[roomID] = map[int64]bool{}
	}
	if isBuffering {
		h.buffering[roomID][userID] = true
		return
	}
	delete(h.buffering[roomID], userID)
	if len(h.buffering[roomID]) == 0 {
		delete(h.buffering, roomID)
	}
}

func (h *watchPartyHub) anyBuffering(roomID int64) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.buffering[roomID]) > 0
}

func (h *watchPartyHub) setResumeAfterBuffering(roomID int64, v bool) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if !v {
		delete(h.resumeAfterBuffering, roomID)
		return
	}
	h.resumeAfterBuffering[roomID] = true
}

func (h *watchPartyHub) shouldResumeAfterBuffering(roomID int64) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.resumeAfterBuffering[roomID]
}

func (h *watchPartyHub) addClient(c *watchPartyClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.rooms[c.roomID] == nil {
		h.rooms[c.roomID] = map[*watchPartyClient]struct{}{}
	}
	h.rooms[c.roomID][c] = struct{}{}
}

func (h *watchPartyHub) removeClient(c *watchPartyClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	m := h.rooms[c.roomID]
	if m == nil {
		return
	}
	delete(m, c)
	if len(m) == 0 {
		delete(h.rooms, c.roomID)
		delete(h.buffering, c.roomID)
		delete(h.resumeAfterBuffering, c.roomID)
	}
}

func (h *watchPartyHub) broadcast(roomID int64, msg any) {
	h.mu.RLock()
	clients := h.rooms[roomID]
	list := make([]*watchPartyClient, 0, len(clients))
	for c := range clients {
		list = append(list, c)
	}
	h.mu.RUnlock()
	for _, c := range list {
		c.send(msg)
	}
}

func (h *watchPartyHub) broadcastPresence(roomID int64) {
	members, err := loadWatchPartyMembers(roomID)
	if err != nil {
		return
	}
	h.broadcast(roomID, ginH{"type": "presence", "members": members})
}

func (h *watchPartyHub) endRoom(roomID int64, status string, reason string) {
	now := time.Now()
	updates := map[string]any{
		"status":           status,
		"dissolved_reason": reason,
		"dissolved_at":     now,
		"updated_at":       now,
	}
	_ = app.DB.Model(&models.WatchPartyRoom{}).Where("id = ? AND status = 'active'", roomID).Updates(updates).Error
	h.broadcast(roomID, ginH{"type": "room_ended", "status": status, "reason": reason, "at": now})

	h.mu.RLock()
	clients := h.rooms[roomID]
	list := make([]*watchPartyClient, 0, len(clients))
	for c := range clients {
		list = append(list, c)
	}
	h.mu.RUnlock()
	for _, c := range list {
		c.close()
	}

	h.mu.Lock()
	delete(h.rooms, roomID)
	delete(h.buffering, roomID)
	delete(h.resumeAfterBuffering, roomID)
	h.mu.Unlock()
}

type ginH map[string]any

type watchPartyInbound struct {
	Type        string          `json:"type"`
	Message     string          `json:"message"`
	Payload     json.RawMessage `json:"payload"`
	Content     json.RawMessage `json:"content"`
	IsBuffering *bool           `json:"is_buffering"`
	IsPlaying   *bool           `json:"is_playing"`
	Rate        *float64        `json:"playback_rate"`
	PositionSec *float64        `json:"playback_position_sec"`
}

type watchPartyMemberView struct {
	UserID    int64      `json:"user_id"`
	Username  string     `json:"username"`
	AvatarURL string     `json:"avatar_url"`
	Role      string     `json:"role"`
	JoinedAt  time.Time  `json:"joined_at"`
	LastSeen  time.Time  `json:"last_seen_at"`
	LeftAt    *time.Time `json:"left_at,omitempty"`
}

type watchPartyMessageView struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	Username  string    `json:"username"`
	AvatarURL string    `json:"avatar_url"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}

func loadWatchPartyMembers(roomID int64) ([]watchPartyMemberView, error) {
	var out []watchPartyMemberView
	err := app.DB.Raw(
		"SELECT m.user_id, u.username, u.avatar_url, m.role, m.joined_at, m.last_seen_at, m.left_at FROM watch_party_room_members m JOIN users u ON u.id = m.user_id WHERE m.room_id = ? AND m.left_at IS NULL ORDER BY m.role ASC, m.joined_at ASC",
		roomID,
	).Scan(&out).Error
	return out, err
}

func loadWatchPartyMessages(roomID int64, limit int) ([]watchPartyMessageView, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	var out []watchPartyMessageView
	err := app.DB.Raw(
		"SELECT msg.id, msg.user_id, u.username, u.avatar_url, msg.message, msg.created_at FROM watch_party_room_messages msg JOIN users u ON u.id = msg.user_id WHERE msg.room_id = ? ORDER BY msg.created_at DESC LIMIT ?",
		roomID,
		limit,
	).Scan(&out).Error
	if len(out) > 1 {
		for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
			out[i], out[j] = out[j], out[i]
		}
	}
	return out, err
}

func upsertWatchPartyMemberJoined(roomID int64, userID int64, role string) error {
	now := time.Now()
	var existing models.WatchPartyRoomMember
	_ = app.DB.Where("room_id = ? AND user_id = ?", roomID, userID).Limit(1).Find(&existing).Error
	if existing.ID != 0 {
		updates := map[string]any{
			"last_seen_at": now,
			"left_at":      nil,
		}
		if role != "" {
			updates["role"] = role
		}
		return app.DB.Model(&models.WatchPartyRoomMember{}).Where("id = ?", existing.ID).Updates(updates).Error
	}
	member := models.WatchPartyRoomMember{
		RoomID:     roomID,
		UserID:     userID,
		Role:       role,
		JoinedAt:   now,
		LastSeenAt: now,
		LeftAt:     nil,
	}
	return app.DB.Create(&member).Error
}

func markWatchPartyMemberLeft(roomID int64, userID int64) {
	now := time.Now()
	_ = app.DB.Model(&models.WatchPartyRoomMember{}).
		Where("room_id = ? AND user_id = ? AND left_at IS NULL", roomID, userID).
		Updates(map[string]any{"left_at": now, "last_seen_at": now}).Error
}

func getWatchPartyMemberRole(roomID int64, userID int64) (string, error) {
	var room models.WatchPartyRoom
	if err := app.DB.Select("id", "owner_user_id", "status", "expires_at").First(&room, roomID).Error; err != nil {
		return "", err
	}
	if room.Status != "active" {
		return "", errRoomEnded
	}
	if time.Now().After(room.ExpiresAt) {
		return "", errRoomEnded
	}
	if room.OwnerUserID == userID {
		_ = upsertWatchPartyMemberJoined(roomID, userID, "owner")
		return "owner", nil
	}
	var m models.WatchPartyRoomMember
	_ = app.DB.Where("room_id = ? AND user_id = ?", roomID, userID).Limit(1).Find(&m).Error
	if m.ID != 0 {
		role := m.Role
		if role == "" {
			role = "viewer"
		}
		_ = upsertWatchPartyMemberJoined(roomID, userID, role)
		return role, nil
	}
	_ = upsertWatchPartyMemberJoined(roomID, userID, "viewer")
	return "viewer", nil
}

var errRoomEnded = &watchPartyErr{msg: "Room ended"}

type watchPartyErr struct{ msg string }

func (e *watchPartyErr) Error() string { return e.msg }
