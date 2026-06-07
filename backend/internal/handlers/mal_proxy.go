package handlers

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func PublicMALAnimeSearch(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	if len([]rune(q)) < 2 {
		c.JSON(http.StatusOK, gin.H{"data": []any{}})
		return
	}
	limit := 12
	if v := strings.TrimSpace(c.Query("limit")); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= 50 {
			limit = n
		}
	}

	qs := url.Values{}
	qs.Set("q", q)
	qs.Set("limit", strconv.Itoa(limit))
	qs.Set("fields", "id,title,main_picture,alternative_titles,mean,rank,popularity,num_episodes,media_type,status,start_date")

	status, b, err := doMALGet("/anime", qs)
	if err != nil {
		if err == http.ErrNoCookie {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "MAL_CLIENT_ID is not configured"})
			return
		}
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Failed to reach MAL"})
		return
	}
	if status == 401 {
		if _, err := refreshMALAccessToken(); err == nil {
			status2, b2, err2 := doMALGet("/anime", qs)
			if err2 == nil {
				status, b = status2, b2
			}
		}
	}
	if status < 200 || status >= 300 {
		c.Data(http.StatusBadGateway, "application/json", b)
		return
	}

	var raw map[string]any
	if err := json.Unmarshal(b, &raw); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Invalid MAL response"})
		return
	}
	c.JSON(http.StatusOK, raw)
}

func PublicMALAnimeDetails(c *gin.Context) {
	idStr := strings.TrimSpace(c.Param("id"))
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	qs := url.Values{}
	qs.Set("fields", "id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,media_type,status,genres,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,studios")
	status, b, err := doMALGet("/anime/"+strconv.Itoa(id), qs)
	if err != nil {
		if err == http.ErrNoCookie {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "MAL_CLIENT_ID is not configured"})
			return
		}
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Failed to reach MAL"})
		return
	}
	if status == 401 {
		if _, err := refreshMALAccessToken(); err == nil {
			status2, b2, err2 := doMALGet("/anime/"+strconv.Itoa(id), qs)
			if err2 == nil {
				status, b = status2, b2
			}
		}
	}
	if status < 200 || status >= 300 {
		c.Data(http.StatusBadGateway, "application/json", b)
		return
	}
	var raw map[string]any
	if err := json.Unmarshal(b, &raw); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Invalid MAL response"})
		return
	}
	c.JSON(http.StatusOK, raw)
}
