package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func AdminJikanGetAnime(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}

	status, b, err := jikanGetAnimeRaw(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Jikan request failed"})
		return
	}
	if status >= 200 && status < 300 {
		var raw map[string]any
		if err := json.Unmarshal(b, &raw); err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": "Invalid Jikan response"})
			return
		}
		c.JSON(http.StatusOK, raw)
		return
	}
	code := http.StatusBadGateway
	if status == 429 || status == 502 || status == 504 {
		code = http.StatusServiceUnavailable
	}
	c.JSON(code, gin.H{
		"error":  "Jikan returned non-200",
		"status": status,
		"body":   string(b),
	})
}
