package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"gorm.io/gorm"

	"github.com/seva/animevista/internal/models"
)

// WatchPartyHub - центральный хаб для управления всеми комнатами Watch Party
type WatchPartyHub struct {
	rooms map[string]*models.InMemoryRoom // key: room ID (UUID)
	mu    sync.RWMutex
	db    *gorm.DB
}

// NewWatchPartyHub создает новый инстанс хаба
func NewWatchPartyHub(db *gorm.DB) *WatchPartyHub {
	hub := &WatchPartyHub{
		rooms: make(map[string]*models.InMemoryRoom),
		db:    db,
	}
	// Запускаем фоновый процесс очистки истекших комнат
	go hub.startJanitor()
	return hub
}

// startJanitor запускает периодическую проверку и удаление истекших комнат (каждые 15 минут)
func (h *WatchPartyHub) startJanitor() {
	ticker := time.NewTicker(15 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		h.mu.Lock()
		now := time.Now()
		// Собираем ID комнат, которые истекли
		var expiredRooms []string
		for id, room := range h.rooms {
			if room.ExpiresAt.Before(now) {
				expiredRooms = append(expiredRooms, id)
			}
		}
		h.mu.Unlock()

		// Удаляем истекшие комнаты
		for _, id := range expiredRooms {
			h.cleanupRoom(id)
		}

		// Также удаляем истекшие комнаты из базы данных
		if err := h.db.Where("expires_at < ?", now).Delete(&models.DBWatchPartyRoom{}).Error; err != nil {
			log.Printf("[WATCHPARTY] Failed to cleanup expired rooms in DB: %v", err)
		}
	}
}

// cleanupRoom удаляет комнату из памяти и закрывает все соединения пользователей
func (h *WatchPartyHub) cleanupRoom(roomID string) {
	clients := make([]*models.InMemoryUser, 0)
	h.mu.Lock()
	room, exists := h.rooms[roomID]
	if exists {
		for _, u := range room.Users {
			clients = append(clients, u)
		}
		delete(h.rooms, roomID)
	}
	h.mu.Unlock()

	if !exists {
		return
	}

	for _, user := range clients {
		_ = user.Conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, "Room expired"))
		_ = user.Conn.Close()
	}

	log.Printf("[WATCHPARTY] Cleaned up expired room: %s", roomID)
}

func (h *WatchPartyHub) DissolveRoom(roomID string, reason string) {
	clients := make([]*models.InMemoryUser, 0)
	h.mu.Lock()
	room, exists := h.rooms[roomID]
	if exists {
		for _, u := range room.Users {
			clients = append(clients, u)
		}
		delete(h.rooms, roomID)
	}
	h.mu.Unlock()

	if !exists {
		return
	}

	_ = h.db.Delete(&models.DBWatchPartyRoom{}, "id = ?", roomID).Error

	msg := models.WSMessage{Type: "room_closed", Payload: map[string]any{"reason": reason}}
	b, err := json.Marshal(msg)
	if err == nil {
		for _, c := range clients {
			_ = c.Conn.WriteMessage(websocket.TextMessage, b)
		}
	}
	for _, c := range clients {
		_ = c.Conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, "Room closed"))
		_ = c.Conn.Close()
	}
}

func (h *WatchPartyHub) AddChatMessage(roomID string, m models.InMemoryChatMessage) {
	clients := make([]*models.InMemoryUser, 0)
	h.mu.Lock()
	room, exists := h.rooms[roomID]
	if !exists {
		h.mu.Unlock()
		return
	}
	room.Chat = append(room.Chat, m)
	if len(room.Chat) > 50 {
		room.Chat = room.Chat[len(room.Chat)-50:]
	}
	for _, u := range room.Users {
		clients = append(clients, u)
	}
	h.mu.Unlock()

	h.sendToClients(clients, models.WSMessage{Type: "chat_message", Payload: m})
}

func (h *WatchPartyHub) GetChatSnapshot(roomID string) []models.InMemoryChatMessage {
	h.mu.RLock()
	room := h.rooms[roomID]
	if room == nil {
		h.mu.RUnlock()
		return nil
	}
	chat := make([]models.InMemoryChatMessage, len(room.Chat))
	copy(chat, room.Chat)
	h.mu.RUnlock()
	return chat
}

// BroadcastExcept рассылает сообщение всем пользователям комнаты, КРОМЕ отправителя
func (h *WatchPartyHub) BroadcastExcept(roomID string, sender *models.InMemoryUser, msg models.WSMessage) error {
	h.mu.RLock()
	defer h.mu.RUnlock()

	room, exists := h.rooms[roomID]
	if !exists {
		return nil
	}

	// Сериализуем сообщение один раз
	payload, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	// Отправляем всем, кроме отправителя
	for _, client := range room.Users {
		if client == sender {
			continue
		}
		if err := client.Conn.WriteMessage(websocket.TextMessage, payload); err != nil {
			log.Printf("[WATCHPARTY] Failed to send message to client %s: %v", client.ID, err)
		}
	}
	return nil
}

// Broadcast отправляет сообщение всем пользователям комнаты (включая отправителя, только для служебных сообщений)
func (h *WatchPartyHub) Broadcast(roomID string, msg models.WSMessage) error {
	h.mu.RLock()
	defer h.mu.RUnlock()

	room, exists := h.rooms[roomID]
	if !exists {
		return nil
	}

	payload, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	for _, client := range room.Users {
		if err := client.Conn.WriteMessage(websocket.TextMessage, payload); err != nil {
			log.Printf("[WATCHPARTY] Failed to send broadcast message to client %s: %v", client.ID, err)
		}
	}
	return nil
}

// AddUserToRoom добавляет нового пользователя в комнату
func (h *WatchPartyHub) AddUserToRoom(roomID string, user *models.InMemoryUser) error {
	h.mu.Lock()

	room, exists := h.rooms[roomID]
	if !exists {
		// Создаем комнату в памяти если она еще не существует
		var dbRoom models.DBWatchPartyRoom
		if err := h.db.First(&dbRoom, "id = ?", roomID).Error; err != nil {
			return err
		}

		room = &models.InMemoryRoom{
			ID:         roomID,
			OwnerUserID: dbRoom.OwnerUserID,
			Users:      make(map[string]*models.InMemoryUser),
			CreatedAt:  dbRoom.CreatedAt,
			ExpiresAt:  dbRoom.ExpiresAt,
			CurrentState: models.PlayerState{
				IsPlaying:      dbRoom.CurrentIsPlaying,
				Time:           dbRoom.CurrentTimeSec,
				Season:         dbRoom.CurrentSeason,
				Episode:        dbRoom.CurrentEpisode,
				TranslationID:  dbRoom.CurrentTranslationID,
			},
		}
		h.rooms[roomID] = room
	}

	// Добавляем пользователя в комнату
	room.Users[user.ID] = user
	log.Printf("[WATCHPARTY] User %s joined room %s", user.ID, roomID)
	usersPayload, clients := snapshotUsersLocked(room)
	h.mu.Unlock()

	h.sendUsersUpdate(clients, usersPayload)
	return nil
}

// RemoveUserFromRoom удаляет пользователя из комнаты
func (h *WatchPartyHub) RemoveUserFromRoom(roomID string, userID string) error {
	h.mu.Lock()

	room, exists := h.rooms[roomID]
	if !exists {
		h.mu.Unlock()
		return nil
	}

	user, exists := room.Users[userID]
	if !exists {
		h.mu.Unlock()
		return nil
	}

	delete(room.Users, userID)
	log.Printf("[WATCHPARTY] User %s left room %s", userID, roomID)

	// Если в комнате больше никого нет - удаляем её
	if len(room.Users) == 0 {
		delete(h.rooms, roomID)
		h.mu.Unlock()
		_ = user.Conn.Close()
		// Также удаляем из базы данных
		_ = h.db.Delete(&models.DBWatchPartyRoom{}, "id = ?", roomID).Error
		return nil
	}

	var promotedConn *websocket.Conn
	if user.IsOwner && len(room.Users) > 0 {
		for _, newOwner := range room.Users {
			newOwner.IsOwner = true
			room.OwnerID = newOwner.ID
			room.OwnerUserID = newOwner.UserID
			promotedConn = newOwner.Conn
			_ = h.db.Model(&models.DBWatchPartyRoom{}).Where("id = ?", roomID).Update("owner_user_id", newOwner.UserID).Error
			break
		}
	}
	usersPayload, clients := snapshotUsersLocked(room)
	h.mu.Unlock()

	_ = user.Conn.Close()
	if promotedConn != nil {
		_ = sendToConn(promotedConn, models.WSMessage{Type: "role_update", Payload: map[string]any{"is_owner": true}})
	}
	h.sendUsersUpdate(clients, usersPayload)
	return nil
}

func snapshotUsersLocked(room *models.InMemoryRoom) ([]map[string]interface{}, []*models.InMemoryUser) {
	users := make([]map[string]interface{}, 0, len(room.Users))
	clients := make([]*models.InMemoryUser, 0, len(room.Users))
	for _, u := range room.Users {
		users = append(users, map[string]interface{}{
			"id":      u.ID,
			"name":    u.Name,
			"isOwner": u.IsOwner,
		})
		clients = append(clients, u)
	}
	return users, clients
}

func (h *WatchPartyHub) sendUsersUpdate(clients []*models.InMemoryUser, usersPayload []map[string]interface{}) {
	h.sendToClients(clients, models.WSMessage{Type: "users_update", Payload: usersPayload})
}

func (h *WatchPartyHub) sendToClients(clients []*models.InMemoryUser, msg models.WSMessage) {
	b, err := json.Marshal(msg)
	if err != nil {
		return
	}
	for _, c := range clients {
		_ = c.Conn.WriteMessage(websocket.TextMessage, b)
	}
}

func (h *WatchPartyHub) GetRoomStateSnapshot(roomID string) (models.PlayerState, bool) {
	h.mu.RLock()
	room := h.rooms[roomID]
	if room == nil {
		h.mu.RUnlock()
		return models.PlayerState{}, false
	}
	st := room.CurrentState
	h.mu.RUnlock()
	return st, true
}

func (h *WatchPartyHub) SetOwnerAdPlaying(roomID string, isAdPlaying bool) {
	h.mu.Lock()
	room := h.rooms[roomID]
	if room != nil {
		room.OwnerAdPlaying = isAdPlaying
	}
	h.mu.Unlock()
}

func (h *WatchPartyHub) UpdateOwnerTime(roomID string, seconds float64, force bool) {
	h.mu.Lock()
	room := h.rooms[roomID]
	if room != nil {
		if force || !room.OwnerAdPlaying {
			room.CurrentState.Time = seconds
		}
	}
	h.mu.Unlock()
}

func (h *WatchPartyHub) UpdateRoomPlaying(roomID string, isPlaying bool) {
	h.mu.Lock()
	room := h.rooms[roomID]
	if room != nil {
		room.CurrentState.IsPlaying = isPlaying
	}
	h.mu.Unlock()
}

func (h *WatchPartyHub) UpdateRoomEpisode(roomID string, season, episode, translationID int) {
	h.mu.Lock()
	room := h.rooms[roomID]
	if room != nil {
		if season > 0 {
			room.CurrentState.Season = season
		}
		if episode > 0 {
			room.CurrentState.Episode = episode
		}
		room.CurrentState.TranslationID = translationID
	}
	h.mu.Unlock()
}

// TransferOwnership передает права владения другому пользователю
func (h *WatchPartyHub) TransferOwnership(roomID string, currentOwner *models.InMemoryUser, newOwnerID string) error {
	h.mu.Lock()

	room, exists := h.rooms[roomID]
	if !exists {
		h.mu.Unlock()
		return nil
	}

	if !currentOwner.IsOwner {
		h.mu.Unlock()
		return nil // Только владелец может передавать права
	}

	newOwner, exists := room.Users[newOwnerID]
	if !exists {
		h.mu.Unlock()
		return nil
	}

	// Обновляем права
	currentOwner.IsOwner = false
	newOwner.IsOwner = true
	room.OwnerID = newOwner.ID
	room.OwnerUserID = newOwner.UserID
	currentOwnerConn := currentOwner.Conn
	newOwnerConn := newOwner.Conn
	newOwnerUserID := newOwner.UserID
	usersPayload, clients := snapshotUsersLocked(room)
	h.mu.Unlock()

	// Обновляем в базе данных
	if err := h.db.Model(&models.DBWatchPartyRoom{}).Where("id = ?", roomID).Updates(map[string]interface{}{
		"owner_user_id": newOwnerUserID,
	}).Error; err != nil {
		log.Printf("[WATCHPARTY] Failed to update owner in DB: %v", err)
	}

	_ = sendToConn(currentOwnerConn, models.WSMessage{Type: "role_update", Payload: map[string]any{"is_owner": false}})
	_ = sendToConn(newOwnerConn, models.WSMessage{Type: "role_update", Payload: map[string]any{"is_owner": true}})
	h.sendUsersUpdate(clients, usersPayload)
	log.Printf("[WATCHPARTY] Ownership transferred from %s to %s in room %s", currentOwner.ID, newOwnerID, roomID)
	return nil
}

func sendToConn(conn *websocket.Conn, msg models.WSMessage) error {
	if conn == nil {
		return nil
	}
	b, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	return conn.WriteMessage(websocket.TextMessage, b)
}

// Upgrader для WebSocket соединений
var WatchPartyUpgrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	CheckOrigin: func(r *http.Request) bool {
		// В продакшене здесь должна быть проверка на разрешенные origins
		return true
	},
}
