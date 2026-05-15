package handlers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
	"gorm.io/gorm"
)

// GetUserCollection fetches all anime in a user's collection
func GetUserCollection(c *gin.Context) {
	userID := c.Param("userId")
	var collections []models.UserCollection

	err := app.DB.Preload("Anime").
		Preload("Anime.Translations.Language").
		Preload("CollectionType").
		Where("user_id = ?", userID).
		Find(&collections).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch collection"})
		return
	}

	c.JSON(http.StatusOK, collections)
}

// UpdateCollectionEntry adds or updates an anime in the user's collection
func UpdateCollectionEntry(c *gin.Context) {
	var input struct {
		UserID           int64   `json:"user_id" binding:"required"`
		AnimeID          int64   `json:"anime_id" binding:"required"`
		CollectionTypeID int     `json:"collection_type_id" binding:"required"`
		EpisodesWatched  int     `json:"episodes_watched"`
		Score            float64 `json:"score"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var collection models.UserCollection
	result := app.DB.Where("user_id = ? AND anime_id = ?", input.UserID, input.AnimeID).First(&collection)

	if result.Error == nil {
		// Update existing entry
		collection.CollectionTypeID = input.CollectionTypeID
		collection.EpisodesWatched = input.EpisodesWatched
		collection.Score = input.Score
		app.DB.Save(&collection)
	} else {
		// Create new entry
		collection = models.UserCollection{
			UserID:           input.UserID,
			AnimeID:          input.AnimeID,
			CollectionTypeID: input.CollectionTypeID,
			EpisodesWatched:  input.EpisodesWatched,
			Score:            input.Score,
		}
		if err := app.DB.Create(&collection).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add to collection"})
			return
		}
	}

	c.JSON(http.StatusOK, collection)
}

// RemoveFromCollection deletes an entry from the user's collection
func RemoveFromCollection(c *gin.Context) {
	userID := c.Param("userId")
	animeID := c.Param("animeId")

	err := app.DB.Where("user_id = ? AND anime_id = ?", userID, animeID).
		Delete(&models.UserCollection{}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove from collection"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from collection"})
}

type AddToCollectionInput struct {
	AnimeID int64  `json:"anime_id" binding:"required"`
	Status  string `json:"status" binding:"required"` // watching | planned | completed | on_hold | dropped
}

func GetMyCollections(c *gin.Context) {
	uidVal, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID, ok := uidVal.(int64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var collections []models.UserCollection
	err := app.DB.Preload("Anime").
		Preload("Anime.Translations.Language").
		Preload("Anime.Genres").
		Preload("Anime.Studio").
		Preload("Anime.Status").
		Preload("Anime.Source").
		Preload("CollectionType").
		Where("user_id = ?", userID).
		Find(&collections).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch collection"})
		return
	}

	c.JSON(http.StatusOK, collections)
}

func AddToMyCollection(c *gin.Context) {
	uidVal, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID, ok := uidVal.(int64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input AddToCollectionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	status := strings.ToLower(strings.TrimSpace(input.Status))
	if status != "watching" && status != "planned" && status != "completed" && status != "on_hold" && status != "dropped" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	var collectionType models.CollectionType
	if err := app.DB.Where("name = ?", status).First(&collectionType).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown collection type"})
		return
	}

	var existing models.UserCollection
	err := app.DB.Where("user_id = ? AND anime_id = ?", userID, input.AnimeID).First(&existing).Error
	if err == nil {
		existing.CollectionTypeID = collectionType.ID
		if err := app.DB.Save(&existing).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update collection"})
			return
		}
		c.JSON(http.StatusOK, existing)
		return
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update collection"})
		return
	}

	entry := models.UserCollection{
		UserID:           userID,
		AnimeID:          input.AnimeID,
		CollectionTypeID: collectionType.ID,
	}
	if err := app.DB.Create(&entry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add to collection"})
		return
	}

	c.JSON(http.StatusCreated, entry)
}

func RemoveFromMyCollection(c *gin.Context) {
	uidVal, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID, ok := uidVal.(int64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	animeID := c.Param("animeId")
	err := app.DB.Where("user_id = ? AND anime_id = ?", userID, animeID).Delete(&models.UserCollection{}).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove from collection"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from collection"})
}
