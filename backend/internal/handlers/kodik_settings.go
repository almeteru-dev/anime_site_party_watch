package handlers

import (
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	kodikGeoblockKey     = "kodik_geoblock"
	kodikHideSelectorsKey = "kodik_hide_selectors"
	kodikSkipEnabledKey  = "kodik_skip_enabled"
	kodikSkipValueKey    = "kodik_skip_value"
)

type AdminSetKodikPlayerSettingsInput struct {
	SkipEnabled  bool   `json:"skip_enabled"`
	SkipValue    string `json:"skip_value"`
	Geoblock     string `json:"geoblock"`
	HideSelectors bool  `json:"hide_selectors"`
}

var countryListRe = regexp.MustCompile(`^[A-Z]{2}(?:,[A-Z]{2})*$`)

func normalizeCountryList(raw string) (string, bool) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return "", true
	}
	parts := strings.Split(trimmed, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		c := strings.ToUpper(strings.TrimSpace(p))
		if c == "" {
			continue
		}
		out = append(out, c)
	}
	if len(out) == 0 {
		return "", true
	}
	norm := strings.Join(out, ",")
	if !countryListRe.MatchString(norm) {
		return "", false
	}
	return norm, true
}

func getSettingValue(key string) (string, bool) {
	var s models.AppSetting
	if err := app.DB.First(&s, "key = ?", key).Error; err == nil {
		return strings.TrimSpace(s.Value), true
	}
	return "", false
}

func getBoolSetting(key string) bool {
	if v, ok := getSettingValue(key); ok {
		return strings.EqualFold(v, "true") || v == "1"
	}
	return false
}

func getKodikGeoblock() string {
	if v, ok := getSettingValue(kodikGeoblockKey); ok {
		return v
	}
	return ""
}

func getKodikHideSelectors() bool {
	return getBoolSetting(kodikHideSelectorsKey)
}

func getKodikSkipEnabled() bool {
	return getBoolSetting(kodikSkipEnabledKey)
}

func getKodikSkipValue() string {
	if v, ok := getSettingValue(kodikSkipValueKey); ok {
		return v
	}
	return ""
}

func AdminSetKodikPlayerSettings(c *gin.Context) {
	roleAny, _ := c.Get("role")
	role, _ := roleAny.(string)
	if role != "root" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Root access required"})
		return
	}

	var input AdminSetKodikPlayerSettingsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	geoblock, ok := normalizeCountryList(input.Geoblock)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid geoblock country list"})
		return
	}
	skipValue := strings.TrimSpace(input.SkipValue)

	updatedAt := time.Now()
	items := []models.AppSetting{
		{Key: kodikGeoblockKey, Value: geoblock, UpdatedAt: updatedAt},
		{Key: kodikHideSelectorsKey, Value: boolToString(input.HideSelectors), UpdatedAt: updatedAt},
		{Key: kodikSkipEnabledKey, Value: boolToString(input.SkipEnabled), UpdatedAt: updatedAt},
		{Key: kodikSkipValueKey, Value: skipValue, UpdatedAt: updatedAt},
	}

	err := app.DB.Transaction(func(tx *gorm.DB) error {
		for _, it := range items {
			if err := tx.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "key"}},
				DoUpdates: clause.AssignmentColumns([]string{"value", "updated_at"}),
			}).Create(&it).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update Kodik settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Updated"})
}

func boolToString(v bool) string {
	if v {
		return "true"
	}
	return "false"
}

