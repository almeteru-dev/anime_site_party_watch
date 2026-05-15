package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func AdminJikanGetAnime(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}

	apiURL := "https://api.jikan.moe/v4/anime/" + strconv.Itoa(id)
	client := &http.Client{Timeout: 20 * time.Second}

	tryOnce := func() (*http.Response, []byte, error) {
		req, err := http.NewRequest(http.MethodGet, apiURL, nil)
		if err != nil {
			return nil, nil, err
		}
		req.Header.Set("Accept", "application/json")
		req.Header.Set("User-Agent", "LycorisLib")
		resp, err := client.Do(req)
		if err != nil {
			return nil, nil, err
		}
		defer resp.Body.Close()
		b, err := io.ReadAll(resp.Body)
		if err != nil {
			return resp, nil, err
		}
		return resp, b, nil
	}

	var lastStatus int
	var lastBody string
	for attempt := 0; attempt < 3; attempt++ {
		resp, b, err := tryOnce()
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": "Jikan request failed"})
			return
		}
		lastStatus = resp.StatusCode
		lastBody = string(b)

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			var raw map[string]any
			if err := json.Unmarshal(b, &raw); err != nil {
				c.JSON(http.StatusBadGateway, gin.H{"error": "Invalid Jikan response"})
				return
			}
			c.JSON(http.StatusOK, raw)
			return
		}

		if resp.StatusCode == 429 || resp.StatusCode == 502 || resp.StatusCode == 504 {
			time.Sleep(time.Duration(600+attempt*900) * time.Millisecond)
			continue
		}
		break
	}

	code := http.StatusBadGateway
	if lastStatus == 429 || lastStatus == 502 || lastStatus == 504 {
		code = http.StatusServiceUnavailable
	}
	c.JSON(code, gin.H{
		"error":  "Jikan returned non-200",
		"status": lastStatus,
		"body":   lastBody,
	})
}

