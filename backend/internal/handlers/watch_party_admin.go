package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/models"
)

func (h *WatchPartyHub) AdminPurgeOfflineRooms(c *gin.Context) {
	olderThanMinutes := int64(60)
	if v := c.Query("older_than_minutes"); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil && n > 0 {
			olderThanMinutes = n
		}
	}

	cutoff := time.Now().UTC().Add(-time.Duration(olderThanMinutes) * time.Minute)
	activeIDs := h.ActiveRoomIDs()

	q := h.db.Model(&models.DBWatchPartyRoom{}).Where("created_at < ?", cutoff)
	if len(activeIDs) > 0 {
		q = q.Where("id NOT IN ?", activeIDs)
	}
	res := q.Delete(&models.DBWatchPartyRoom{})
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to purge rooms"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"deleted_count": res.RowsAffected})
}
