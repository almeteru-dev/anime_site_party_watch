package handlers

import (
	"math"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
	"gorm.io/gorm"
)

func userIDFromContext(c *gin.Context) (int64, bool) {
	uidAny, ok := c.Get("user_id")
	if !ok {
		return 0, false
	}
	switch v := uidAny.(type) {
	case int64:
		return v, v > 0
	case int:
		return int64(v), v > 0
	case uint:
		if v == 0 {
			return 0, false
		}
		return int64(v), true
	case uint64:
		if v == 0 {
			return 0, false
		}
		return int64(v), true
	case float64:
		if v <= 0 {
			return 0, false
		}
		return int64(v), true
	default:
		return 0, false
	}
}

type RateAnimeInput struct {
	AnimeID int64    `json:"anime_id" binding:"required"`
	Rating  *float64 `json:"rating"`
	Score   *int     `json:"score"`
}

func RateAnime(c *gin.Context) {
	uid, ok := userIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input RateAnimeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var score int
	if input.Score != nil {
		score = *input.Score
	} else if input.Rating != nil {
		if math.Trunc(*input.Rating) != *input.Rating {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Score must be an integer"})
			return
		}
		iv := int(*input.Rating)
		if iv >= 0 && iv <= 9 {
			score = iv + 1
		} else {
			score = iv
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "score is required"})
		return
	}

	if score < 1 || score > 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Score must be between 1 and 10"})
		return
	}

	var watchedCount int64
	err := app.DB.Model(&models.UserCollection{}).
		Joins("JOIN collection_types ct ON ct.id = user_collections.collection_type_id").
		Where("user_collections.user_id = ? AND user_collections.anime_id = ? AND ct.name = ?", uid, input.AnimeID, "completed").
		Count(&watchedCount).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate watch status"})
		return
	}
	if watchedCount == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only rate anime in your Watched list"})
		return
	}

	var avg float64
	var cnt int64
	err = app.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(
			`INSERT INTO anime_ratings (user_id, anime_id, score)
			 VALUES (?, ?, ?)
			 ON CONFLICT (user_id, anime_id) DO UPDATE
			 SET score = EXCLUDED.score, updated_at = NOW()`,
			uid, input.AnimeID, score,
		).Error; err != nil {
			return err
		}

		row := tx.Raw(
			`SELECT COALESCE(AVG(score)::float8, 0.0) AS avg_score,
			        COALESCE(COUNT(*)::int8, 0)       AS cnt
			 FROM anime_ratings
			 WHERE anime_id = ?`,
			input.AnimeID,
		).Row()
		if err := row.Scan(&avg, &cnt); err != nil {
			return err
		}

		if err := tx.Exec(
			`UPDATE anime SET rating_avg = ?, rating_count = ? WHERE id = ?`,
			avg, cnt, input.AnimeID,
		).Error; err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save rating"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"anime_id": input.AnimeID, "rating_avg": avg, "rating_count": cnt})
}

func GetAnimeAverageRating(c *gin.Context) {
	id64, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id64 <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid anime id"})
		return
	}

	var avg float64
	var cnt int
	err = app.DB.Raw(
		`SELECT COALESCE(rating_avg, 0.0), COALESCE(rating_count, 0) FROM anime WHERE id = ?`,
		id64,
	).Row().Scan(&avg, &cnt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Anime not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"anime_id": id64, "rating_avg": avg, "rating_count": cnt})
}

func GetMyAnimeRating(c *gin.Context) {
	uid, ok := userIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id64, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id64 <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid anime id"})
		return
	}

	var score int
	err = app.DB.Raw(
		`SELECT score FROM anime_ratings WHERE user_id = ? AND anime_id = ? LIMIT 1`,
		uid, id64,
	).Row().Scan(&score)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"anime_id": id64, "score": nil})
		return
	}

	c.JSON(http.StatusOK, gin.H{"anime_id": id64, "score": score})
}
