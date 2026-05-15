package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
	"gorm.io/gorm"
)

type AdminSetAnimeThemesInput struct {
	ThemeIDs []int `json:"theme_ids"`
}

func AdminSetAnimeThemes(c *gin.Context) {
	animeID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid anime id"})
		return
	}
	var input AdminSetAnimeThemesInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	var anime models.Anime
	if err := app.DB.First(&anime, animeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Anime not found"})
		return
	}

	var themes []models.Theme
	if len(input.ThemeIDs) > 0 {
		if err := app.DB.Where("id IN ?", input.ThemeIDs).Find(&themes).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to fetch themes"})
			return
		}
		if len(themes) != len(input.ThemeIDs) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown theme id"})
			return
		}
	}

	if err := setAnimeThemes(anime.ID, input.ThemeIDs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to update anime themes"})
		return
	}

	app.DB.Preload("Themes").First(&anime, anime.ID)
	c.JSON(http.StatusOK, gin.H{"themes": anime.Themes})
}

func setAnimeThemes(animeID int64, themeIDs []int) error {
	return setAnimeThemesTx(app.DB, animeID, themeIDs)
}

func setAnimeThemesTx(tx *gorm.DB, animeID int64, themeIDs []int) error {
	if err := tx.Exec("DELETE FROM anime_themes WHERE anime_id = ?", animeID).Error; err != nil {
		return err
	}
	for _, tid := range themeIDs {
		if err := tx.Exec("INSERT INTO anime_themes (anime_id, theme_id) VALUES (?, ?)", animeID, tid).Error; err != nil {
			return err
		}
	}
	return nil
}
