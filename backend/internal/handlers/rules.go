package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
)

func ListRules(c *gin.Context) {
	var items []models.Rule
	if err := app.DB.Order("id ASC").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list rules"})
		return
	}
	c.JSON(http.StatusOK, items)
}

type ruleInput struct {
	BodyEn string `json:"body_en"`
	BodyRu string `json:"body_ru"`
	BodyUk string `json:"body_uk"`
}

func normalizeRuleInput(in *ruleInput) (string, *string, *string) {
	en := strings.TrimSpace(in.BodyEn)
	ruRaw := strings.TrimSpace(in.BodyRu)
	ukRaw := strings.TrimSpace(in.BodyUk)
	var ru *string
	var uk *string
	if ruRaw != "" {
		v := ruRaw
		ru = &v
	}
	if ukRaw != "" {
		v := ukRaw
		uk = &v
	}
	return en, ru, uk
}

func validateRuleText(s string) bool {
	return len([]rune(s)) <= 10000
}

func AdminCreateRule(c *gin.Context) {
	var input ruleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	en, ru, uk := normalizeRuleInput(&input)
	if en == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "English text is required"})
		return
	}
	if !validateRuleText(en) || (ru != nil && !validateRuleText(*ru)) || (uk != nil && !validateRuleText(*uk)) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Text is too long"})
		return
	}
	item := models.Rule{BodyEn: en, BodyRu: ru, BodyUk: uk, UpdatedAt: time.Now()}
	if err := app.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create rule"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func AdminUpdateRule(c *gin.Context) {
	id, err := parseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	var input ruleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	en, ru, uk := normalizeRuleInput(&input)
	if en == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "English text is required"})
		return
	}
	if !validateRuleText(en) || (ru != nil && !validateRuleText(*ru)) || (uk != nil && !validateRuleText(*uk)) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Text is too long"})
		return
	}
	updates := map[string]any{"body_en": en, "body_ru": ru, "body_uk": uk, "updated_at": time.Now()}
	if err := app.DB.Model(&models.Rule{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update rule"})
		return
	}
	var item models.Rule
	if err := app.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Rule not found"})
		return
	}
	c.JSON(http.StatusOK, item)
}

func AdminDeleteRule(c *gin.Context) {
	id, err := parseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	if err := app.DB.Delete(&models.Rule{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete rule"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

