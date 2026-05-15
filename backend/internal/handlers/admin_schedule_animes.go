package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/validation"
)

type AdminScheduleAnimeItem struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	URL      string `json:"url"`
	ImageURL string `json:"image_url"`
}

func AdminListOngoingAnimes(c *gin.Context) {
	q := validation.SanitizeSearchQuery(c.Query("q"))
	like := ""
	if q != "" {
		like = "%" + strings.ToLower(q) + "%"
	}

	rows := make([]AdminScheduleAnimeItem, 0)
	db := app.DB.Table("anime").
		Select("anime.id, anime.name, anime.url, anime.image AS image_url").
		Joins("JOIN statuses s ON s.id = anime.status_id").
		Where("s.name = ?", "ongoing")
	if like != "" {
		db = db.Where("LOWER(anime.name) LIKE ?", like)
	}
	if err := db.Order("anime.name asc").Limit(500).Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch animes"})
		return
	}

	c.JSON(http.StatusOK, rows)
}
