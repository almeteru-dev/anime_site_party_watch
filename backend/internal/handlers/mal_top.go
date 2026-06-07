package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
	"github.com/seva/animevista/internal/service"
	"gorm.io/gorm"
)

func GetMALTopAnime(c *gin.Context) {
	var rows []service.MALTopAnimeRow
	err := app.DB.Raw(
		`SELECT rank, anime_id, title, COALESCE(image_url, '') AS image_url
		 FROM mal_top_anime
		 ORDER BY rank ASC`,
	).Scan(&rows).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch top anime"})
		return
	}
	c.JSON(http.StatusOK, rows)
}

func GetMALTopAnimeCatalog(c *gin.Context) {
	var animes []models.Anime
	err := app.DB.
		Model(&models.Anime{}).
		Joins("JOIN mal_top_anime m ON m.anime_id = anime.mal_id").
		Preload("Status").
		Preload("Studio").
		Preload("Source").
		Preload("Genres").
		Preload("Themes").
		Preload("Producers").
		Preload("Translations", func(db *gorm.DB) *gorm.DB { return db.Preload("Language") }).
		Order("m.rank ASC").
		Limit(100).
		Find(&animes).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch top anime"})
		return
	}
	if err := hydrateAnimeRefsRU(animes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load refs"})
		return
	}
	_ = hydrateAnimeRefsUK(animes)
	c.JSON(http.StatusOK, animes)
}

func AdminSyncMALTopAnime(c *gin.Context) {
	ctx := c.Request.Context()
	ctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()
	if err := SyncMALTopAnimeAndHydrate(ctx); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "MAL top anime synced"})
}
