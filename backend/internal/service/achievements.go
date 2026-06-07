package service

import (
	"github.com/seva/animevista/internal/models"
	"gorm.io/gorm"
)

func ListAchievements(db *gorm.DB) ([]models.Achievement, error) {
	var out []models.Achievement
	if err := db.Order("id asc").Find(&out).Error; err != nil {
		return nil, err
	}
	return out, nil
}

func ListUserAchievements(db *gorm.DB, userID int64) ([]models.Achievement, error) {
	var out []models.Achievement
	err := db.Raw(`
		SELECT a.*
		FROM achievements a
		JOIN user_achievements ua ON ua.achievement_id = a.id
		WHERE ua.user_id = ?
		ORDER BY ua.assigned_at DESC, a.id ASC
	`, userID).Scan(&out).Error
	if err != nil {
		return nil, err
	}
	return out, nil
}

