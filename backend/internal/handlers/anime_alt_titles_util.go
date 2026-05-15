package handlers

import (
	"strings"

	"github.com/seva/animevista/internal/models"
	"gorm.io/gorm"
)

func normalizeAltTitles(raw []string) []string {
	seen := map[string]struct{}{}
	out := make([]string, 0, len(raw))
	for _, t := range raw {
		v := strings.TrimSpace(t)
		if v == "" {
			continue
		}
		key := strings.ToLower(v)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, v)
	}
	return out
}

func replaceAnimeAltTitlesTx(tx *gorm.DB, animeID int64, titles []string) error {
	next := normalizeAltTitles(titles)

	if err := tx.Where("anime_id = ?", animeID).Delete(&models.AnimeAltTitle{}).Error; err != nil {
		return err
	}

	if len(next) == 0 {
		return nil
	}

	items := make([]models.AnimeAltTitle, 0, len(next))
	for _, t := range next {
		items = append(items, models.AnimeAltTitle{AnimeID: animeID, Title: t})
	}
	return tx.Create(&items).Error
}
