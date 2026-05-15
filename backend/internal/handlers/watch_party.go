package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/config"
	"github.com/seva/animevista/internal/models"
	"golang.org/x/crypto/bcrypt"
)

type WatchPartyCreateRoomInput struct {
	IsPublic bool            `json:"is_public"`
	Password string          `json:"password"`
	Content  json.RawMessage `json:"content"`
}

type WatchPartyCreateRoomResponse struct {
	RoomID     int64     `json:"room_id"`
	InviteCode string    `json:"invite_code"`
	ExpiresAt  time.Time `json:"expires_at"`
}

func randomInviteCode() (string, error) {
	b := make([]byte, 9)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	s := base64.RawURLEncoding.EncodeToString(b)
	s = strings.Trim(s, "=")
	if len(s) > 16 {
		s = s[:16]
	}
	return s, nil
}

func WatchPartyCreateRoom(c *gin.Context) {
	userIDAny, _ := c.Get("user_id")
	userID := userIDAny.(int64)

	var input WatchPartyCreateRoomInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if !input.IsPublic {
		if strings.TrimSpace(input.Password) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password is required for private rooms"})
			return
		}
		if len(input.Password) < 4 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password is too short"})
			return
		}
	}

	invite, err := randomInviteCode()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate invite"})
		return
	}

	var hash *string
	if !input.IsPublic {
		b, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		s := string(b)
		hash = &s
	}

	expires := time.Now().Add(12 * time.Hour)
	content := strings.TrimSpace(string(input.Content))
	if content == "" {
		content = "{}"
	}

	room := models.WatchPartyRoom{
		OwnerUserID:      userID,
		IsPublic:         input.IsPublic,
		PasswordHash:     hash,
		InviteCode:       invite,
		Status:           "active",
		ExpiresAt:        expires,
		ContentStateJSON: content,
		IsPlaying:        false,
		PlaybackRate:     1.0,
		PlaybackPosition: 0,
		PlaybackSeq:      0,
		LastStateAt:      time.Now(),
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := app.DB.Create(&room).Error; err != nil {
		log.Printf("watch_party: create room failed: %v", err)
		payload := gin.H{"error": "Failed to create room"}
		if !config.AppConfig.IS_PRODUCTION {
			payload["details"] = err.Error()
		}
		c.JSON(http.StatusInternalServerError, payload)
		return
	}
	_ = upsertWatchPartyMemberJoined(room.ID, userID, "owner")

	c.JSON(http.StatusCreated, WatchPartyCreateRoomResponse{RoomID: room.ID, InviteCode: room.InviteCode, ExpiresAt: room.ExpiresAt})
}

func WatchPartyResolveInvite(c *gin.Context) {
	code := strings.TrimSpace(c.Param("inviteCode"))
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invite"})
		return
	}
	var room models.WatchPartyRoom
	if err := app.DB.Select("id", "status", "expires_at", "is_public").Where("invite_code = ?", code).First(&room).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}
	if room.Status != "active" || time.Now().After(room.ExpiresAt) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not available"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"room_id": room.ID, "requires_password": !room.IsPublic})
}

func WatchPartyGetRoom(c *gin.Context) {
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
		c.JSON(http.StatusGone, gin.H{"error": "Room ended", "status": room.Status})
		return
	}

	role := "viewer"
	if room.OwnerUserID == userID {
		role = "owner"
	} else {
		var m models.WatchPartyRoomMember
		if err := app.DB.Where("room_id = ? AND user_id = ?", roomID, userID).First(&m).Error; err == nil {
			if m.Role != "" {
				role = m.Role
			}
		}
	}

	invite := ""
	if role == "owner" || role == "moderator" {
		invite = room.InviteCode
	}
	canJoin := true
	if !room.IsPublic {
		var m models.WatchPartyRoomMember
		if err := app.DB.Where("room_id = ? AND user_id = ? AND left_at IS NULL", roomID, userID).First(&m).Error; err != nil {
			canJoin = false
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"room": gin.H{
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
		"self_role":         role,
		"requires_password": !room.IsPublic,
		"needs_join":        !canJoin,
	})
}

type WatchPartyJoinRoomInput struct {
	Password string `json:"password"`
}

func WatchPartyJoinRoom(c *gin.Context) {
	userIDAny, _ := c.Get("user_id")
	userID := userIDAny.(int64)
	roomID, err := strconv.ParseInt(c.Param("roomId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room"})
		return
	}

	var input WatchPartyJoinRoomInput
	_ = c.ShouldBindJSON(&input)

	var room models.WatchPartyRoom
	if err := app.DB.First(&room, roomID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}
	if room.Status != "active" || time.Now().After(room.ExpiresAt) {
		c.JSON(http.StatusGone, gin.H{"error": "Room ended"})
		return
	}
	if !room.IsPublic {
		if strings.TrimSpace(input.Password) == "" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Password required", "error_code": "PASSWORD_REQUIRED"})
			return
		}
		if room.PasswordHash == nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Password required", "error_code": "PASSWORD_REQUIRED"})
			return
		}
		if err := bcrypt.CompareHashAndPassword([]byte(*room.PasswordHash), []byte(input.Password)); err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid password", "error_code": "INVALID_PASSWORD"})
			return
		}
	}

	role, err := getWatchPartyMemberRole(roomID, userID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Failed to join"})
		return
	}
	wpHub.broadcastPresence(roomID)
	c.JSON(http.StatusOK, gin.H{"status": "ok", "role": role})
}

type WatchPartySetRoleInput struct {
	Role string `json:"role"`
}

func WatchPartySetMemberRole(c *gin.Context) {
	userIDAny, _ := c.Get("user_id")
	callerID := userIDAny.(int64)
	roomID, err := strconv.ParseInt(c.Param("roomId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room"})
		return
	}
	targetID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user"})
		return
	}

	var room models.WatchPartyRoom
	if err := app.DB.Select("id", "owner_user_id", "status", "expires_at").First(&room, roomID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}
	if room.Status != "active" || time.Now().After(room.ExpiresAt) {
		c.JSON(http.StatusGone, gin.H{"error": "Room ended"})
		return
	}
	if room.OwnerUserID != callerID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only owner can change roles"})
		return
	}
	if targetID == room.OwnerUserID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot change owner role"})
		return
	}

	var input WatchPartySetRoleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	role := strings.ToLower(strings.TrimSpace(input.Role))
	if role != "moderator" && role != "viewer" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	updates := map[string]any{"role": role}
	if err := app.DB.Model(&models.WatchPartyRoomMember{}).Where("room_id = ? AND user_id = ?", roomID, targetID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to update role"})
		return
	}
	wpHub.broadcast(roomID, gin.H{"type": "role_updated", "user_id": targetID, "role": role})
	wpHub.broadcastPresence(roomID)
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func WatchPartyDissolveRoom(c *gin.Context) {
	userIDAny, _ := c.Get("user_id")
	callerID := userIDAny.(int64)
	roomID, err := strconv.ParseInt(c.Param("roomId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room"})
		return
	}
	var room models.WatchPartyRoom
	if err := app.DB.Select("id", "owner_user_id").First(&room, roomID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}
	if room.OwnerUserID != callerID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only owner can dissolve"})
		return
	}
	wpHub.endRoom(roomID, "dissolved", "manual")
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
