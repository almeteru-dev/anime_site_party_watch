package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
)

type AdminSetAnimeGenresInput struct {
	GenreIDs []int `json:"genre_ids"`
}

func AdminSetAnimeGenres(c *gin.Context) {
	animeID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid anime id"})
		return
	}
	var input AdminSetAnimeGenresInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	var anime models.Anime
	if err := app.DB.First(&anime, animeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Anime not found"})
		return
	}

	var genres []models.Genre
	if len(input.GenreIDs) > 0 {
		if err := app.DB.Where("id IN ?", input.GenreIDs).Find(&genres).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to fetch genres"})
			return
		}
		if len(genres) != len(input.GenreIDs) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown genre id"})
			return
		}
	}

	if err := setAnimeGenres(anime.ID, input.GenreIDs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to update anime genres"})
		return
	}

	app.DB.Preload("Genres").First(&anime, anime.ID)
	c.JSON(http.StatusOK, gin.H{"genres": anime.Genres})
}
