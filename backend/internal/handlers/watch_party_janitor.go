package handlers

import (
	"time"

	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
)

func StartWatchPartyJanitor(stop <-chan struct{}) {
	t := time.NewTicker(60 * time.Second)
	defer t.Stop()
	for {
		select {
		case <-stop:
			return
		case <-t.C:
			now := time.Now()
			var rooms []models.WatchPartyRoom
			_ = app.DB.Select("id").Where("status = 'active' AND expires_at <= ?", now).Find(&rooms).Error
			for _, r := range rooms {
				wpHub.endRoom(r.ID, "expired", "expired")
			}
		}
	}
}
