package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/seva/animevista/internal/models"
)

type watchPartyInbound struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type watchPartyCreateInput struct {
	Content json.RawMessage `json:"content"`
}

type watchPartyContentState struct {
	AnimeSlug            string `json:"anime_slug"`
	SelectedEpisode      *int   `json:"selected_episode_number"`
	SelectedSeason       *int   `json:"selected_season"`
	SelectedVoiceGroupID *int   `json:"selected_voice_group_id"`
	SelectedType         string `json:"selected_type"`
	SelectedServerLabel  string `json:"selected_server_label"`
	SelectedSourceID     *int   `json:"selected_source_id"`
}

type watchPartySeekPayload struct {
	Seconds *float64 `json:"seconds"`
	Time    *float64 `json:"time"`
}

type watchPartyTimeUpdatePayload struct {
	Time float64 `json:"time"`
}

type watchPartySyncPayload struct {
	Time float64 `json:"time"`
}

type watchPartyAdStatePayload struct {
	IsAdPlaying bool `json:"is_ad_playing"`
}

type watchPartyEpisodePayload struct {
	Season        *int `json:"season"`
	Episode       *int `json:"episode"`
	TranslationID *int `json:"translationId"`
}

type watchPartyTransferPayload struct {
	NewOwnerID string `json:"newOwnerId"`
}

type watchPartyContentPayload struct {
	Content json.RawMessage `json:"content"`
}

type watchPartyChatPayload struct {
	Message string `json:"message"`
}

func (h *WatchPartyHub) CreateRoom(c *gin.Context) {
	userIDAny, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDAny.(int64)

	var input watchPartyCreateInput
	_ = c.ShouldBindJSON(&input)

	content := input.Content
	if len(content) == 0 {
		content = json.RawMessage(`{}`)
	}
	var cs watchPartyContentState
	_ = json.Unmarshal(content, &cs)
	if cs.AnimeSlug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "content.anime_slug is required"})
		return
	}

	season := 1
	episode := 1
	if cs.SelectedSeason != nil && *cs.SelectedSeason > 0 {
		season = *cs.SelectedSeason
	}
	if cs.SelectedEpisode != nil && *cs.SelectedEpisode > 0 {
		episode = *cs.SelectedEpisode
	}

	room := models.DBWatchPartyRoom{
		OwnerUserID: userID,
		CreatedAt:   time.Now(),
		ExpiresAt:   time.Now().Add(12 * time.Hour),
		CurrentSeason: season,
		CurrentEpisode: episode,
		ContentStateJSON: string(content),
	}
	if err := h.db.Create(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create room"})
		return
	}

	var u models.User
	_ = h.db.Select("username").First(&u, userID).Error
	username := u.Username
	if username == "" {
		username = "Anonymous"
	}

	member := models.DBWatchPartyRoomMember{
		RoomID:   room.ID,
		UserID:   userID,
		Username: username,
		IsOwner:  true,
		JoinedAt: time.Now(),
	}
	_ = h.db.Create(&member).Error

	c.JSON(http.StatusCreated, gin.H{
		"room_id":    room.ID,
		"expires_at": room.ExpiresAt,
	})
}

func (h *WatchPartyHub) GetRoom(c *gin.Context) {
	userIDAny, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDAny.(int64)
	roomID := c.Param("roomId")

	var room models.DBWatchPartyRoom
	if err := h.db.First(&room, "id = ?", roomID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}
	if time.Now().After(room.ExpiresAt) {
		c.JSON(http.StatusGone, gin.H{"error": "room expired"})
		return
	}

	isOwner := room.OwnerUserID == userID

	c.JSON(http.StatusOK, gin.H{
		"room": gin.H{
			"id":         room.ID,
			"owner_user_id": room.OwnerUserID,
			"created_at": room.CreatedAt,
			"expires_at": room.ExpiresAt,
			"content_state": json.RawMessage(room.ContentStateJSON),
			"state": gin.H{
				"is_playing":      room.CurrentIsPlaying,
				"time":            room.CurrentTimeSec,
				"season":          room.CurrentSeason,
				"episode":         room.CurrentEpisode,
				"translation_id":  room.CurrentTranslationID,
			},
		},
		"is_owner": isOwner,
	})
}

func (h *WatchPartyHub) RoomWS(c *gin.Context) {
	userIDAny, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDAny.(int64)
	roomID := c.Param("roomId")

	var dbRoom models.DBWatchPartyRoom
	if err := h.db.First(&dbRoom, "id = ?", roomID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}
	if time.Now().After(dbRoom.ExpiresAt) {
		c.JSON(http.StatusGone, gin.H{"error": "room expired"})
		return
	}

	conn, err := WatchPartyUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	var u models.User
	_ = h.db.Select("username").First(&u, userID).Error
	username := u.Username
	if username == "" {
		username = "Anonymous"
	}

	inMemUserID := uuid.NewString()
	user := &models.InMemoryUser{
		ID:      inMemUserID,
		Name:    username,
		UserID:  userID,
		RoomID:  roomID,
		IsOwner: dbRoom.OwnerUserID == userID,
		Conn:    conn,
	}

	if err := h.AddUserToRoom(roomID, user); err != nil {
		_ = conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseInternalServerErr, "failed to join"))
		_ = conn.Close()
		return
	}

	initState := models.PlayerState{
		IsPlaying:     dbRoom.CurrentIsPlaying,
		Time:          dbRoom.CurrentTimeSec,
		Season:        dbRoom.CurrentSeason,
		Episode:       dbRoom.CurrentEpisode,
		TranslationID: dbRoom.CurrentTranslationID,
	}
	if st, ok := h.GetRoomStateSnapshot(roomID); ok {
		initState = st
	}
	chat := h.GetChatSnapshot(roomID)
	_ = conn.WriteJSON(models.WSMessage{Type: "init_state", Payload: gin.H{"self_id": inMemUserID, "is_owner": user.IsOwner, "state": initState, "chat": chat}})

	defer func() {
		_ = h.RemoveUserFromRoom(roomID, inMemUserID)
	}()

	for {
		_, b, err := conn.ReadMessage()
		if err != nil {
			return
		}

		var in watchPartyInbound
		if err := json.Unmarshal(b, &in); err != nil {
			continue
		}

		switch in.Type {
		case "play":
			if !user.IsOwner {
				continue
			}
			_ = h.db.Model(&models.DBWatchPartyRoom{}).Where("id = ?", roomID).Updates(map[string]any{
				"current_is_playing": true,
			}).Error
			h.UpdateRoomPlaying(roomID, true)
			_ = h.BroadcastExcept(roomID, user, models.WSMessage{Type: "play"})
		case "pause":
			if !user.IsOwner {
				continue
			}
			_ = h.db.Model(&models.DBWatchPartyRoom{}).Where("id = ?", roomID).Updates(map[string]any{
				"current_is_playing": false,
			}).Error
			h.UpdateRoomPlaying(roomID, false)
			_ = h.BroadcastExcept(roomID, user, models.WSMessage{Type: "pause"})
		case "seek":
			if !user.IsOwner {
				continue
			}
			var p watchPartySeekPayload
			_ = json.Unmarshal(in.Payload, &p)
			var t float64
			if p.Seconds != nil {
				t = *p.Seconds
			} else if p.Time != nil {
				t = *p.Time
			} else {
				continue
			}
			_ = h.db.Model(&models.DBWatchPartyRoom{}).Where("id = ?", roomID).Updates(map[string]any{
				"current_time_sec": t,
			}).Error
			h.UpdateOwnerTime(roomID, t, true)
			_ = h.BroadcastExcept(roomID, user, models.WSMessage{Type: "seek", Payload: gin.H{"time": t}})
		case "time":
			if !user.IsOwner {
				continue
			}
			var p watchPartySeekPayload
			_ = json.Unmarshal(in.Payload, &p)
			var t float64
			if p.Seconds != nil {
				t = *p.Seconds
			} else if p.Time != nil {
				t = *p.Time
			} else {
				continue
			}
			if t <= 0 {
				continue
			}
			h.UpdateOwnerTime(roomID, t, false)
		case "time_update":
			if !user.IsOwner {
				continue
			}
			var p watchPartyTimeUpdatePayload
			_ = json.Unmarshal(in.Payload, &p)
			if p.Time <= 0 {
				continue
			}
			h.UpdateOwnerTime(roomID, p.Time, false)
		case "sync":
			if !user.IsOwner {
				continue
			}
			var p watchPartySyncPayload
			_ = json.Unmarshal(in.Payload, &p)
			if p.Time <= 0 {
				continue
			}
			h.UpdateOwnerTime(roomID, p.Time, false)
			_ = h.BroadcastExcept(roomID, user, models.WSMessage{Type: "sync", Payload: gin.H{"time": p.Time}})
		case "ad_state":
			if !user.IsOwner {
				continue
			}
			var p watchPartyAdStatePayload
			_ = json.Unmarshal(in.Payload, &p)
			h.SetOwnerAdPlaying(roomID, p.IsAdPlaying)
		case "change_episode":
			if !user.IsOwner {
				continue
			}
			var p watchPartyEpisodePayload
			_ = json.Unmarshal(in.Payload, &p)
			updates := map[string]any{}
			out := map[string]any{}
			if p.Season != nil {
				updates["current_season"] = *p.Season
				out["season"] = *p.Season
			}
			if p.Episode != nil {
				updates["current_episode"] = *p.Episode
				out["episode"] = *p.Episode
			}
			if p.TranslationID != nil {
				updates["current_translation_id"] = *p.TranslationID
				out["translationId"] = *p.TranslationID
			}
			if len(updates) == 0 {
				continue
			}
			_ = h.db.Model(&models.DBWatchPartyRoom{}).Where("id = ?", roomID).Updates(updates).Error
			if season, ok := out["season"].(int); ok {
				episode, _ := out["episode"].(int)
				translationId, _ := out["translationId"].(int)
				h.UpdateRoomEpisode(roomID, season, episode, translationId)
			}
			_ = h.BroadcastExcept(roomID, user, models.WSMessage{Type: "change_episode", Payload: out})
		case "transfer_ownership":
			if !user.IsOwner {
				continue
			}
			var p watchPartyTransferPayload
			_ = json.Unmarshal(in.Payload, &p)
			if p.NewOwnerID == "" {
				continue
			}
			_ = h.TransferOwnership(roomID, user, p.NewOwnerID)
		case "content_state":
			if !user.IsOwner {
				continue
			}
			var p watchPartyContentPayload
			_ = json.Unmarshal(in.Payload, &p)
			if len(p.Content) == 0 {
				continue
			}
			var cs watchPartyContentState
			_ = json.Unmarshal(p.Content, &cs)
			if cs.AnimeSlug == "" {
				continue
			}

			updates := map[string]any{
				"content_state_json": string(p.Content),
			}
			if cs.SelectedSeason != nil {
				updates["current_season"] = *cs.SelectedSeason
			}
			if cs.SelectedEpisode != nil {
				updates["current_episode"] = *cs.SelectedEpisode
			}
			if cs.SelectedVoiceGroupID != nil {
				updates["current_translation_id"] = *cs.SelectedVoiceGroupID
			}
			_ = h.db.Model(&models.DBWatchPartyRoom{}).Where("id = ?", roomID).Updates(updates).Error

			_ = h.BroadcastExcept(roomID, user, models.WSMessage{Type: "content_state", Payload: json.RawMessage(p.Content)})
		case "chat_message":
			var p watchPartyChatPayload
			_ = json.Unmarshal(in.Payload, &p)
			msg := strings.TrimSpace(p.Message)
			if msg == "" {
				continue
			}
			if len(msg) > 2000 {
				msg = msg[:2000]
			}
			h.AddChatMessage(roomID, models.InMemoryChatMessage{
				ID:      uuid.NewString(),
				UserID:  user.UserID,
				Name:    user.Name,
				Message: msg,
				SentAt:  time.Now(),
			})
		case "dissolve":
			if !user.IsOwner {
				continue
			}
			h.DissolveRoom(roomID, "dissolved")
			return
		}
	}
}
