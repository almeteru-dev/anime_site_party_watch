package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
)

func WatchPartyRoomWS(c *gin.Context) {
	userIDAny, _ := c.Get("user_id")
	userID := userIDAny.(int64)
	roomID, err := strconv.ParseInt(c.Param("roomId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room"})
		return
	}

	var room models.WatchPartyRoom
	if err := app.DB.First(&room, roomID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}
	if room.Status != "active" || time.Now().After(room.ExpiresAt) {
		c.JSON(http.StatusGone, gin.H{"error": "Room ended"})
		return
	}

	role := "viewer"
	if room.OwnerUserID == userID {
		role = "owner"
		_ = upsertWatchPartyMemberJoined(roomID, userID, "owner")
	} else {
		var m models.WatchPartyRoomMember
		_ = app.DB.Where("room_id = ? AND user_id = ?", roomID, userID).Limit(1).Find(&m).Error
		if m.ID != 0 {
			if !room.IsPublic {
				if m.LeftAt != nil {
					c.JSON(http.StatusForbidden, gin.H{"error": "Join room first"})
					return
				}
			}
			r := m.Role
			if r == "" {
				r = "viewer"
			}
			role = r
			_ = upsertWatchPartyMemberJoined(roomID, userID, role)
		} else {
			if !room.IsPublic {
				c.JSON(http.StatusForbidden, gin.H{"error": "Join room first"})
				return
			}
			role = "viewer"
			_ = upsertWatchPartyMemberJoined(roomID, userID, role)
		}
	}

	conn, err := wpHub.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	client := &watchPartyClient{conn: conn, roomID: roomID, userID: userID, role: role}
	wpHub.addClient(client)

	members, _ := loadWatchPartyMembers(roomID)
	msgs, _ := loadWatchPartyMessages(roomID, 50)
	invite := ""
	if role == "owner" || role == "moderator" {
		invite = room.InviteCode
	}

	client.send(ginH{
		"type": "snapshot",
		"room": ginH{
			"id":                    room.ID,
			"owner_user_id":         room.OwnerUserID,
			"is_public":             room.IsPublic,
			"status":                room.Status,
			"expires_at":            room.ExpiresAt,
			"content_state":         json.RawMessage(room.ContentStateJSON),
			"is_playing":            room.IsPlaying,
			"playback_rate":         room.PlaybackRate,
			"playback_position_sec": room.PlaybackPosition,
			"playback_seq":          room.PlaybackSeq,
			"last_state_at":         room.LastStateAt,
			"invite_code":           invite,
		},
		"self": ginH{
			"user_id": userID,
			"role":    role,
		},
		"members":  members,
		"messages": msgs,
	})

	wpHub.broadcastPresence(roomID)

	_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	go func() {
		t := time.NewTicker(20 * time.Second)
		defer t.Stop()
		for {
			client.closeMu.Lock()
			closed := client.closed
			client.closeMu.Unlock()
			if closed {
				return
			}
			_ = conn.WriteControl(9, []byte("ping"), time.Now().Add(5*time.Second))
			<-t.C
		}
	}()

	for {
		var msg watchPartyInbound
		if err := conn.ReadJSON(&msg); err != nil {
			break
		}
		_ = app.DB.Model(&models.WatchPartyRoomMember{}).
			Where("room_id = ? AND user_id = ?", roomID, userID).
			Updates(map[string]any{"last_seen_at": time.Now(), "left_at": nil}).Error

		if role != "owner" {
			var m models.WatchPartyRoomMember
			if err := app.DB.Where("room_id = ? AND user_id = ?", roomID, userID).First(&m).Error; err == nil {
				if m.Role != "" {
					role = m.Role
				}
			}
		}

		switch strings.ToLower(strings.TrimSpace(msg.Type)) {
		case "chat_send":
			text := strings.TrimSpace(msg.Message)
			if text == "" {
				continue
			}
			if len(text) > 1000 {
				text = text[:1000]
			}
			m := models.WatchPartyRoomMessage{RoomID: roomID, UserID: userID, Message: text, CreatedAt: time.Now()}
			_ = app.DB.Create(&m).Error
			var u models.User
			_ = app.DB.Select("id", "username", "avatar_url").First(&u, userID).Error
			wpHub.broadcast(roomID, ginH{"type": "chat_message", "id": m.ID, "user_id": userID, "username": u.Username, "avatar_url": u.AvatarURL, "message": text, "created_at": m.CreatedAt})
		case "state_update":
			if role != "owner" && role != "moderator" {
				continue
			}
			if wpHub.anyBuffering(roomID) {
				if msg.IsPlaying != nil && *msg.IsPlaying {
					msg.IsPlaying = nil
				}
			}
			if msg.IsPlaying != nil && !*msg.IsPlaying {
				wpHub.setResumeAfterBuffering(roomID, false)
			}
			updates := map[string]any{}
			now := time.Now()
			if msg.Content != nil {
				updates["content_state"] = string(msg.Content)
			}
			if msg.IsPlaying != nil {
				updates["is_playing"] = *msg.IsPlaying
			}
			if msg.Rate != nil {
				updates["playback_rate"] = *msg.Rate
			}
			if msg.PositionSec != nil {
				updates["playback_position_sec"] = *msg.PositionSec
			}
			updates["playback_seq"] = room.PlaybackSeq + 1
			updates["last_state_at"] = now
			updates["updated_at"] = now
			if err := app.DB.Model(&models.WatchPartyRoom{}).Where("id = ? AND status = 'active'", roomID).Updates(updates).Error; err != nil {
				continue
			}
			room.PlaybackSeq++
			if v, ok := updates["content_state"]; ok {
				if s, ok2 := v.(string); ok2 {
					room.ContentStateJSON = s
				}
			}
			if v, ok := updates["is_playing"]; ok {
				if b, ok2 := v.(bool); ok2 {
					room.IsPlaying = b
				}
			}
			if v, ok := updates["playback_rate"]; ok {
				if f, ok2 := v.(float64); ok2 {
					room.PlaybackRate = f
				}
			}
			if v, ok := updates["playback_position_sec"]; ok {
				if f, ok2 := v.(float64); ok2 {
					room.PlaybackPosition = f
				}
			}
			room.LastStateAt = now
			wpHub.broadcast(roomID, ginH{
				"type":                  "state_update",
				"content_state":         json.RawMessage(room.ContentStateJSON),
				"is_playing":            room.IsPlaying,
				"playback_rate":         room.PlaybackRate,
				"playback_position_sec": room.PlaybackPosition,
				"playback_seq":          room.PlaybackSeq,
				"last_state_at":         room.LastStateAt,
				"by_user_id":            userID,
			})
		case "buffering":
			if msg.IsBuffering == nil {
				continue
			}
			wpHub.setBuffering(roomID, userID, *msg.IsBuffering)
			wpHub.broadcast(roomID, ginH{
				"type":                  "buffering",
				"user_id":               userID,
				"is_buffering":          *msg.IsBuffering,
				"playback_position_sec": msg.PositionSec,
			})
			if *msg.IsBuffering {
				if room.IsPlaying {
					wpHub.setResumeAfterBuffering(roomID, true)
					pos := room.PlaybackPosition
					if msg.PositionSec != nil {
						pos = *msg.PositionSec
					}
					now := time.Now()
					updates := map[string]any{
						"is_playing":            false,
						"playback_position_sec": pos,
						"playback_seq":          room.PlaybackSeq + 1,
						"last_state_at":         now,
						"updated_at":            now,
					}
					_ = app.DB.Model(&models.WatchPartyRoom{}).Where("id = ? AND status = 'active'", roomID).Updates(updates).Error
					room.IsPlaying = false
					room.PlaybackPosition = pos
					room.PlaybackSeq++
					room.LastStateAt = now
					wpHub.broadcast(roomID, ginH{
						"type":                  "state_update",
						"content_state":         json.RawMessage(room.ContentStateJSON),
						"is_playing":            room.IsPlaying,
						"playback_rate":         room.PlaybackRate,
						"playback_position_sec": room.PlaybackPosition,
						"playback_seq":          room.PlaybackSeq,
						"last_state_at":         room.LastStateAt,
						"by_user_id":            userID,
					})
				}
				continue
			}
			if !wpHub.anyBuffering(roomID) && wpHub.shouldResumeAfterBuffering(roomID) {
				wpHub.setResumeAfterBuffering(roomID, false)
				now := time.Now()
				updates := map[string]any{
					"is_playing":    true,
					"playback_seq":  room.PlaybackSeq + 1,
					"last_state_at": now,
					"updated_at":    now,
				}
				_ = app.DB.Model(&models.WatchPartyRoom{}).Where("id = ? AND status = 'active'", roomID).Updates(updates).Error
				room.IsPlaying = true
				room.PlaybackSeq++
				room.LastStateAt = now
				wpHub.broadcast(roomID, ginH{
					"type":                  "state_update",
					"content_state":         json.RawMessage(room.ContentStateJSON),
					"is_playing":            room.IsPlaying,
					"playback_rate":         room.PlaybackRate,
					"playback_position_sec": room.PlaybackPosition,
					"playback_seq":          room.PlaybackSeq,
					"last_state_at":         room.LastStateAt,
					"by_user_id":            userID,
				})
			}
		case "dissolve":
			if role != "owner" {
				continue
			}
			wpHub.endRoom(roomID, "dissolved", "manual")
			client.close()
			wpHub.removeClient(client)
			return
		default:
			continue
		}
	}

	markWatchPartyMemberLeft(roomID, userID)
	wpHub.removeClient(client)
	client.close()
	if role == "owner" {
		wpHub.endRoom(roomID, "dissolved", "owner_left")
		return
	}
	wpHub.broadcastPresence(roomID)
}
