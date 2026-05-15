package handlers

import (
	"errors"
	"net/url"
	"strings"

	"github.com/seva/animevista/internal/models"
	"gorm.io/gorm"
)

func normalizeGalleryURLs(raw []string) []string {
	seen := map[string]struct{}{}
	out := make([]string, 0, len(raw))
	for _, u := range raw {
		v := strings.TrimSpace(u)
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

func isValidHTTPURL(raw string) bool {
	u, err := url.Parse(strings.TrimSpace(raw))
	if err != nil {
		return false
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return false
	}
	return u.Host != ""
}

func replaceAnimeGalleryImagesTx(tx *gorm.DB, animeID int64, urls []string) error {
	next := normalizeGalleryURLs(urls)
	if len(next) > 6 {
		return errors.New("Max 6 gallery images per anime")
	}
	for _, u := range next {
		if !isValidHTTPURL(u) {
			return errors.New("Gallery image URLs must be valid http(s) links")
		}
	}

	if err := tx.Where("anime_id = ?", animeID).Delete(&models.AnimeGalleryImage{}).Error; err != nil {
		return err
	}
	if len(next) == 0 {
		return nil
	}

	items := make([]models.AnimeGalleryImage, 0, len(next))
	for i, u := range next {
		items = append(items, models.AnimeGalleryImage{AnimeID: animeID, URL: u, SortOrder: i})
	}
	return tx.Create(&items).Error
}
