package handlers

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

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

	apiURL := "https://shikimori.one/api/animes?search=" + url.QueryEscape(q) + "&limit=20"
	client := &http.Client{Timeout: 12 * time.Second}
	req, err := http.NewRequest(http.MethodGet, apiURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to build request"})
		return
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "LycorisLib")

	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Shikimori request failed"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Shikimori returned non-200", "status": resp.StatusCode})
		return
	}

	var items []shikimoriAnimeListItem
	if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Invalid Shikimori response"})
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

	apiURL := "https://shikimori.one/api/animes/" + strconv.Itoa(id)
	client := &http.Client{Timeout: 12 * time.Second}
	req, err := http.NewRequest(http.MethodGet, apiURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to build request"})
		return
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "LycorisLib")

	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Shikimori request failed"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Shikimori returned non-200", "status": resp.StatusCode})
		return
	}

	var raw map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Invalid Shikimori response"})
		return
	}

	c.JSON(http.StatusOK, raw)
}
