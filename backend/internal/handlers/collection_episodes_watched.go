package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
	"gorm.io/gorm"
)

type UpdateEpisodesWatchedInput struct {
	EpisodesWatched int `json:"episodes_watched" binding:"required"`
}

func UpdateMyCollectionEpisodesWatched(c *gin.Context) {
	uid, ok := userIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	animeID, err := strconv.ParseInt(c.Param("animeId"), 10, 64)
	if err != nil || animeID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid anime id"})
		return
	}

	var input UpdateEpisodesWatchedInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.EpisodesWatched < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "episodes_watched must be >= 0"})
		return
	}

	var entry models.UserCollection
	err = app.DB.Where("user_id = ? AND anime_id = ?", uid, animeID).First(&entry).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Anime is not in your list"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load collection entry"})
		return
	}

	var ctName string
	if err := app.DB.Raw(
		`SELECT COALESCE(ct.name, '')
		 FROM user_collections uc
		 JOIN collection_types ct ON ct.id = uc.collection_type_id
		 WHERE uc.id = ?`,
		entry.ID,
	).Row().Scan(&ctName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load collection status"})
		return
	}
	status := strings.ToLower(strings.TrimSpace(ctName))
	if status != "watching" && status != "rewatching" && status != "on_hold" && status != "dropped" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Episodes can only be updated for Watching, Rewatching, On Hold or Dropped"})
		return
	}

	var anime models.Anime
	if err := app.DB.Select("id", "episodes").First(&anime, animeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Anime not found"})
		return
	}

	next := input.EpisodesWatched
	if anime.Episodes > 0 && next > anime.Episodes {
		next = anime.Episodes
	}

	entry.EpisodesWatched = next
	if err := app.DB.Save(&entry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update episodes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"anime_id": animeID, "episodes_watched": next})
}
