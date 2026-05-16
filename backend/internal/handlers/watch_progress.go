package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
)

type UpsertWatchProgressInput struct {
	EpisodeNumber int `json:"episode_number" binding:"required"`
}

func GetMyAnimeWatchProgress(c *gin.Context) {
	uid, ok := userIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	animeID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || animeID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid anime id"})
		return
	}

	var episodeNumber int
	var updatedAt time.Time
	err = app.DB.Raw(
		`SELECT episode_number, updated_at FROM user_watch_progress WHERE user_id = ? AND anime_id = ? LIMIT 1`,
		uid,
		animeID,
	).Row().Scan(&episodeNumber, &updatedAt)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"anime_id": animeID, "episode_number": nil, "updated_at": nil})
		return
	}

	c.JSON(http.StatusOK, gin.H{"anime_id": animeID, "episode_number": episodeNumber, "updated_at": updatedAt})
}

func UpsertMyAnimeWatchProgress(c *gin.Context) {
	uid, ok := userIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	animeID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || animeID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid anime id"})
		return
	}

	var input UpsertWatchProgressInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.EpisodeNumber <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "episode_number must be > 0"})
		return
	}

	if err := app.DB.Exec(
		`INSERT INTO user_watch_progress (user_id, anime_id, episode_number)
		 VALUES (?, ?, ?)
		 ON CONFLICT (user_id, anime_id) DO UPDATE
		 SET episode_number = EXCLUDED.episode_number, updated_at = NOW()`,
		uid,
		animeID,
		input.EpisodeNumber,
	).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save watch progress"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"anime_id": animeID, "episode_number": input.EpisodeNumber})
}

