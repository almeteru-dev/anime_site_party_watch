package handlers

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/config"
)

func AdminMoonanimeGetAnime(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	apiKey := strings.TrimSpace(config.AppConfig.MOONANIME_API_KEY)
	if apiKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "MOONANIME_API_KEY is not set"})
		return
	}

	status, b, err := moonanimeGetAnimeRaw(c.Request.Context(), apiKey, id)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Moonanime request failed"})
		return
	}
	if status >= 200 && status < 300 {
		var raw map[string]any
		if err := json.Unmarshal(b, &raw); err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": "Invalid Moonanime response"})
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
		"error":  "Moonanime returned non-200",
		"status": status,
		"body":   string(b),
	})
}

func moonanimeGetAnimeRaw(ctx context.Context, apiKey string, malID int) (int, []byte, error) {
	apiURL := "https://api.moonanime.art/api/7.0/anime/" + strconv.Itoa(malID) + "?api_key=" + apiKey
	client := &http.Client{Timeout: 20 * time.Second}

	var lastStatus int
	var lastBody []byte
	for attempt := 0; attempt < 3; attempt++ {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
		if err != nil {
			return 0, nil, err
		}
		req.Header.Set("Accept", "application/json")
		req.Header.Set("User-Agent", "LycorisLib")
		resp, err := client.Do(req)
		if err != nil {
			return 0, nil, err
		}
		b, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			return resp.StatusCode, nil, err
		}
		lastStatus = resp.StatusCode
		lastBody = b
		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			return lastStatus, lastBody, nil
		}
		if resp.StatusCode == 429 || resp.StatusCode == 502 || resp.StatusCode == 504 {
			time.Sleep(time.Duration(600+attempt*900) * time.Millisecond)
			continue
		}
		break
	}
	return lastStatus, lastBody, nil
}
