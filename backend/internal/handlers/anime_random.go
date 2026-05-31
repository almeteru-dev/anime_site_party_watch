package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
)

func GetRandomAnime(c *gin.Context) {
	var url string
	err := app.DB.Raw(
		`SELECT url FROM anime WHERE url IS NOT NULL AND url <> '' ORDER BY RANDOM() LIMIT 1`,
	).Scan(&url).Error
	if err != nil || url == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "No anime"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"url": url})
}

