package handlers

import (
	"context"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
)

type adminMALTopRow struct {
	Rank      int       `json:"rank"`
	AnimeID   int64     `json:"anime_id"`
	Title     string    `json:"title"`
	ImageURL  string    `json:"image_url"`
	UpdatedAt time.Time `json:"updated_at"`
}

type adminUpsertMALTopInput struct {
	AnimeID  int64  `json:"anime_id"`
	Title    string `json:"title"`
	ImageURL string `json:"image_url"`
}

func AdminGetMALTopAnime(c *gin.Context) {
	var rows []adminMALTopRow
	err := app.DB.Raw(
		`SELECT rank, anime_id, title, COALESCE(image_url, '') AS image_url, updated_at
		 FROM mal_top_anime
		 ORDER BY rank ASC`,
	).Scan(&rows).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch MAL top"})
		return
	}
	c.JSON(http.StatusOK, rows)
}

func AdminUpsertMALTopAnime(c *gin.Context) {
	rank, err := strconv.Atoi(strings.TrimSpace(c.Param("rank")))
	if err != nil || rank <= 0 || rank > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rank"})
		return
	}

	var in adminUpsertMALTopInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if in.AnimeID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid anime_id"})
		return
	}
	in.Title = strings.TrimSpace(in.Title)
	in.ImageURL = strings.TrimSpace(in.ImageURL)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 45*time.Second)
	defer cancel()

	if in.Title == "" {
		j, err := fetchJikanAnimeFull(ctx, in.AnimeID)
		if err == nil {
			if v := strings.TrimSpace(j.Data.Title); v != "" {
				in.Title = v
			}
			if in.ImageURL == "" {
				in.ImageURL = pickJikanPoster(j)
			}
		}
	}
	if in.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title is required"})
		return
	}

	if err := app.DB.Exec(
		`INSERT INTO mal_top_anime (rank, anime_id, title, image_url, updated_at)
		 VALUES (?, ?, ?, ?, NOW())
		 ON CONFLICT (rank) DO UPDATE
		 SET anime_id = EXCLUDED.anime_id,
		     title = EXCLUDED.title,
		     image_url = EXCLUDED.image_url,
		     updated_at = NOW()`,
		rank,
		in.AnimeID,
		in.Title,
		in.ImageURL,
	).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upsert"})
		return
	}

	_, _, _, _ = upsertAnimeFromJikan(ctx, in.AnimeID)
		
	c.JSON(http.StatusOK, gin.H{"message": "Updated"})
}

func AdminDeleteMALTopAnime(c *gin.Context) {
	rank, err := strconv.Atoi(strings.TrimSpace(c.Param("rank")))
	if err != nil || rank <= 0 || rank > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rank"})
		return
	}
	if err := app.DB.Exec(`DELETE FROM mal_top_anime WHERE rank = ?`, rank).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

