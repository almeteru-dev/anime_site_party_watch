package middleware

import (
	"math"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
)

func ShikiImportRateLimit(window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		uidAny, ok := c.Get("user_id")
		uid, ok2 := uidAny.(int64)
		if !ok || !ok2 || uid <= 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		res := app.DB.Exec(
			`UPDATE users
			 SET last_shiki_import_at = NOW()
			 WHERE id = ?
			   AND (last_shiki_import_at IS NULL OR last_shiki_import_at <= NOW() - (?::interval))`,
			uid,
			window.String(),
		)
		if res.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Rate limit check failed"})
			c.Abort()
			return
		}
		if res.RowsAffected == 1 {
			c.Next()
			return
		}

		var seconds float64
		q := app.DB.Raw(
			`SELECT EXTRACT(EPOCH FROM (last_shiki_import_at + (?::interval) - NOW()))
			 FROM users
			 WHERE id = ?`,
			window.String(),
			uid,
		)
		if err := q.Row().Scan(&seconds); err != nil {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Too many requests"})
			c.Abort()
			return
		}
		if seconds < 0 {
			seconds = 0
		}

		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":               "Too many requests",
			"retry_after_seconds": int64(math.Ceil(seconds)),
		})
		c.Abort()
	}
}

