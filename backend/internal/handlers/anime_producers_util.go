package handlers

import (
	"github.com/seva/animevista/internal/app"
	"gorm.io/gorm"
)

func setAnimeProducersTx(tx *gorm.DB, animeID int64, producerIDs []int) error {
	if err := tx.Exec("DELETE FROM anime_producers WHERE anime_id = ?", animeID).Error; err != nil {
		return err
	}
	for _, pid := range producerIDs {
		if err := tx.Exec("INSERT INTO anime_producers (anime_id, producer_id) VALUES (?, ?)", animeID, pid).Error; err != nil {
			return err
		}
	}
	return nil
}

func setAnimeProducers(animeID int64, producerIDs []int) error {
	return setAnimeProducersTx(app.DB, animeID, producerIDs)
}

