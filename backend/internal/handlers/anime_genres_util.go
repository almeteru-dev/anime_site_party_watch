package handlers

import (
	"github.com/seva/animevista/internal/app"
	"gorm.io/gorm"
)

func setAnimeGenresTx(tx *gorm.DB, animeID int64, genreIDs []int) error {
	if err := tx.Exec("DELETE FROM anime_genres WHERE anime_id = ?", animeID).Error; err != nil {
		return err
	}
	for _, gid := range genreIDs {
		if err := tx.Exec("INSERT INTO anime_genres (anime_id, genre_id) VALUES (?, ?)", animeID, gid).Error; err != nil {
			return err
		}
	}
	return nil
}

func setAnimeGenres(animeID int64, genreIDs []int) error {
	return setAnimeGenresTx(app.DB, animeID, genreIDs)
}
