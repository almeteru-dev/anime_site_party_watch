package handlers

import (
	"errors"
	"strings"

	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
)

func validateAnimeSeasonFields(seasonNumber int, firstSeasonID *int64, selfID *int64) error {
	if seasonNumber <= 0 {
		return errors.New("season_number is required")
	}
	if seasonNumber == 1 {
		if firstSeasonID != nil {
			return errors.New("first_season_id must be empty when season_number=1")
		}
		return nil
	}
	if firstSeasonID == nil || *firstSeasonID <= 0 {
		return errors.New("first_season_id is required when season_number>1")
	}
	var root models.Anime
	if err := app.DB.Select("id", "season_number", "first_season_id").First(&root, *firstSeasonID).Error; err != nil {
		return errors.New("first_season_id does not exist")
	}
	if root.SeasonNumber != 1 || root.FirstSeasonID != nil {
		return errors.New("first_season_id must reference an anime with season_number=1")
	}
	var c int64
	q := app.DB.Model(&models.Anime{}).Where("first_season_id = ? AND season_number = ?", *firstSeasonID, seasonNumber)
	if selfID != nil && *selfID > 0 {
		q = q.Where("id <> ?", *selfID)
	}
	_ = q.Count(&c)
	if c > 0 {
		return errors.New("this season_number already exists for the selected first season")
	}
	return nil
}

func buildSeasonsForAnime(anime models.Anime) ([]models.Anime, error) {
	rootID := anime.ID
	if anime.FirstSeasonID != nil && *anime.FirstSeasonID > 0 {
		rootID = *anime.FirstSeasonID
	}
	var seasons []models.Anime
	if err := app.DB.Model(&models.Anime{}).
		Preload("Translations.Language").
		Where("id = ? OR first_season_id = ?", rootID, rootID).
		Order("season_number asc, id asc").
		Find(&seasons).Error; err != nil {
		return nil, err
	}
	if len(seasons) == 0 {
		return nil, nil
	}
	_ = hydrateAnimeRefsRU(seasons)
	for i := range seasons {
		seasons[i].Name = strings.TrimSpace(seasons[i].Name)
	}
	return seasons, nil
}

