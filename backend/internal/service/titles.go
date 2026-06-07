package service

import (
	"github.com/seva/animevista/internal/models"
	"gorm.io/gorm"
)

func ListTitles(db *gorm.DB) ([]models.Title, error) {
	var out []models.Title
	if err := db.Order("id asc").Find(&out).Error; err != nil {
		return nil, err
	}
	return out, nil
}

func ListUserTitles(db *gorm.DB, userID int64) ([]models.Title, error) {
	var out []models.Title
	err := db.Raw(`
		SELECT t.*
		FROM titles t
		JOIN user_titles ut ON ut.title_id = t.id
		WHERE ut.user_id = ?
		ORDER BY ut.assigned_at DESC, t.id ASC
	`, userID).Scan(&out).Error
	if err != nil {
		return nil, err
	}
	return out, nil
}

