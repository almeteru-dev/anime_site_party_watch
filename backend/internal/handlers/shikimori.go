package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type shikimoriAnimeListItem struct {
	ID           int     `json:"id"`
	MALID        *int    `json:"mal_id"`
	Name         string  `json:"name"`
	Russian      string  `json:"russian"`
	Kind         string  `json:"kind"`
	Status       string  `json:"status"`
	Episodes     int     `json:"episodes"`
	EpisodesAired int    `json:"episodes_aired"`
	Score        string  `json:"score"`
	AiredOn      *string `json:"aired_on"`
	ReleasedOn   *string `json:"released_on"`
}

func AdminShikimoriSearch(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	if q == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing q"})
		return
	}

	items, err := shikimoriSearchAnimeList(c.Request.Context(), q, 20)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Shikimori request failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func AdminShikimoriGetAnime(c *gin.Context) {
	idStr := strings.TrimSpace(c.Param("id"))
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}

	raw, err := shikimoriGetAnimeRaw(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Shikimori request failed"})
		return
	}
	c.JSON(http.StatusOK, raw)
}
