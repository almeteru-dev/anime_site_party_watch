package handlers

import (
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
	"github.com/seva/animevista/internal/service"
	"gorm.io/gorm"
)

var (
	reAchievementCode = regexp.MustCompile(`^[a-z0-9][a-z0-9._-]{1,63}$`)
	reHexColor        = regexp.MustCompile(`^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$`)
)

type achievementInput struct {
	Code   string `json:"code"`
	NameEn string `json:"name_en"`
	NameRu string `json:"name_ru"`
	NameUk string `json:"name_uk"`
	Color  string `json:"color"`
}

func parseInt64Param(c *gin.Context, name string) (int64, error) {
	return strconv.ParseInt(c.Param(name), 10, 64)
}

func AdminListAchievements(c *gin.Context) {
	items, err := service.ListAchievements(app.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list achievements"})
		return
	}
	c.JSON(http.StatusOK, items)
}

func AdminCreateAchievement(c *gin.Context) {
	var input achievementInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.Code = strings.TrimSpace(input.Code)
	input.NameEn = strings.TrimSpace(input.NameEn)
	input.NameRu = strings.TrimSpace(input.NameRu)
	input.NameUk = strings.TrimSpace(input.NameUk)
	input.Color = strings.TrimSpace(input.Color)

	if !reAchievementCode.MatchString(input.Code) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid code"})
		return
	}
	if input.NameEn == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "English name is required"})
		return
	}
	if !reHexColor.MatchString(input.Color) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid color"})
		return
	}

	var nameRu *string
	var nameUk *string
	if input.NameRu != "" {
		v := input.NameRu
		nameRu = &v
	}
	if input.NameUk != "" {
		v := input.NameUk
		nameUk = &v
	}
	item := models.Achievement{Code: input.Code, NameEn: input.NameEn, NameRu: nameRu, NameUk: nameUk, Color: input.Color}
	if err := app.DB.Create(&item).Error; err != nil {
		if isUniqueViolation(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Achievement code already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create achievement"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func AdminUpdateAchievement(c *gin.Context) {
	id, err := parseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}

	var input achievementInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.Code = strings.TrimSpace(input.Code)
	input.NameEn = strings.TrimSpace(input.NameEn)
	input.NameRu = strings.TrimSpace(input.NameRu)
	input.NameUk = strings.TrimSpace(input.NameUk)
	input.Color = strings.TrimSpace(input.Color)

	if !reAchievementCode.MatchString(input.Code) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid code"})
		return
	}
	if input.NameEn == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "English name is required"})
		return
	}
	if !reHexColor.MatchString(input.Color) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid color"})
		return
	}

	var item models.Achievement
	if err := app.DB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Achievement not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load achievement"})
		return
	}

	var nameRu *string
	var nameUk *string
	if input.NameRu != "" {
		v := input.NameRu
		nameRu = &v
	}
	if input.NameUk != "" {
		v := input.NameUk
		nameUk = &v
	}
	updates := map[string]any{"code": input.Code, "name_en": input.NameEn, "name_ru": nameRu, "name_uk": nameUk, "color": input.Color, "updated_at": time.Now()}
	if err := app.DB.Model(&models.Achievement{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		if isUniqueViolation(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Achievement code already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update achievement"})
		return
	}

	if err := app.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load achievement"})
		return
	}
	c.JSON(http.StatusOK, item)
}

func AdminDeleteAchievement(c *gin.Context) {
	id, err := parseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	if err := app.DB.Delete(&models.Achievement{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete achievement"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

func AdminGetUserAchievements(c *gin.Context) {
	userID, err := parseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user id"})
		return
	}
	items, err := service.ListUserAchievements(app.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load user achievements"})
		return
	}
	c.JSON(http.StatusOK, items)
}

func AdminAssignAchievementToUser(c *gin.Context) {
	userID, err := parseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user id"})
		return
	}
	var input struct {
		AchievementID int64 `json:"achievement_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var ach models.Achievement
	if err := app.DB.Select("id").First(&ach, input.AchievementID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Achievement not found"})
		return
	}

	assignerAny, _ := c.Get("user_id")
	assigner, _ := assignerAny.(int64)
	ua := models.UserAchievement{UserID: userID, AchievementID: input.AchievementID, AssignedBy: &assigner}
	if err := app.DB.Where("user_id = ? AND achievement_id = ?", userID, input.AchievementID).FirstOrCreate(&ua).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign achievement"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Assigned"})
}

func AdminUnassignAchievementFromUser(c *gin.Context) {
	userID, err := parseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user id"})
		return
	}
	achID, err := parseInt64Param(c, "achievementId")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid achievement id"})
		return
	}

	if err := app.DB.Where("user_id = ? AND achievement_id = ?", userID, achID).Delete(&models.UserAchievement{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unassign achievement"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Unassigned"})
}

func AdminBulkAssignAchievementByRole(c *gin.Context) {
	achID, err := parseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	var input struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	role := strings.TrimSpace(input.Role)
	if role != "user" && role != "moderator" && role != "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	var ach models.Achievement
	if err := app.DB.Select("id").First(&ach, achID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Achievement not found"})
		return
	}

	assignerAny, _ := c.Get("user_id")
	assigner, _ := assignerAny.(int64)
	res := app.DB.Exec(
		`INSERT INTO user_achievements (user_id, achievement_id, assigned_by)
SELECT u.id, ?, ?
FROM users u
WHERE u.role = ?
ON CONFLICT (user_id, achievement_id) DO NOTHING`,
		achID,
		assigner,
		role,
	)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign achievement"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"assigned_count": res.RowsAffected})
}

func AdminBulkAssignAchievementByRegisteredBefore(c *gin.Context) {
	achID, err := parseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	var input struct {
		RegisteredBefore string `json:"registered_before" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	dateStr := strings.TrimSpace(input.RegisteredBefore)
	t, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date"})
		return
	}
	cutoff := t.Add(24 * time.Hour)

	var ach models.Achievement
	if err := app.DB.Select("id").First(&ach, achID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Achievement not found"})
		return
	}

	assignerAny, _ := c.Get("user_id")
	assigner, _ := assignerAny.(int64)
	res := app.DB.Exec(
		`INSERT INTO user_achievements (user_id, achievement_id, assigned_by)
SELECT u.id, ?, ?
FROM users u
WHERE u.created_at < ?
ON CONFLICT (user_id, achievement_id) DO NOTHING`,
		achID,
		assigner,
		cutoff,
	)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign achievement"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"assigned_count": res.RowsAffected})
}

func AdminBulkUnassignAchievementByRole(c *gin.Context) {
	achID, err := parseInt64Param(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	var input struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	role := strings.TrimSpace(input.Role)
	if role != "user" && role != "moderator" && role != "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	var ach models.Achievement
	if err := app.DB.Select("id").First(&ach, achID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Achievement not found"})
		return
	}

	res := app.DB.Exec(
		`DELETE FROM user_achievements ua
WHERE ua.achievement_id = ?
AND ua.user_id IN (SELECT id FROM users WHERE role = ?)`,
		achID,
		role,
	)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unassign achievement"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"removed_count": res.RowsAffected})
}
