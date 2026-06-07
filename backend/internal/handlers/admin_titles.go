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
	reTitleCode = regexp.MustCompile(`^[a-z0-9][a-z0-9._-]{1,63}$`)
	reHexColor2 = regexp.MustCompile(`^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$`)
)

type titleInput struct {
	Code   string `json:"code"`
	NameEn string `json:"name_en"`
	NameRu string `json:"name_ru"`
	NameUk string `json:"name_uk"`
	Color  string `json:"color"`
}

func parseInt64Param2(c *gin.Context, name string) (int64, error) {
	return strconv.ParseInt(c.Param(name), 10, 64)
}

func AdminListTitles(c *gin.Context) {
	items, err := service.ListTitles(app.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list titles"})
		return
	}
	c.JSON(http.StatusOK, items)
}

func AdminCreateTitle(c *gin.Context) {
	var input titleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.Code = strings.TrimSpace(input.Code)
	input.NameEn = strings.TrimSpace(input.NameEn)
	input.NameRu = strings.TrimSpace(input.NameRu)
	input.NameUk = strings.TrimSpace(input.NameUk)
	input.Color = strings.TrimSpace(input.Color)

	if !reTitleCode.MatchString(input.Code) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid code"})
		return
	}
	if input.NameEn == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "English name is required"})
		return
	}
	if !reHexColor2.MatchString(input.Color) {
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

	item := models.Title{Code: input.Code, NameEn: input.NameEn, NameRu: nameRu, NameUk: nameUk, Color: input.Color}
	if err := app.DB.Create(&item).Error; err != nil {
		if isUniqueViolation(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Title code already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create title"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func AdminUpdateTitle(c *gin.Context) {
	id, err := parseInt64Param2(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	var input titleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.Code = strings.TrimSpace(input.Code)
	input.NameEn = strings.TrimSpace(input.NameEn)
	input.NameRu = strings.TrimSpace(input.NameRu)
	input.NameUk = strings.TrimSpace(input.NameUk)
	input.Color = strings.TrimSpace(input.Color)

	if !reTitleCode.MatchString(input.Code) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid code"})
		return
	}
	if input.NameEn == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "English name is required"})
		return
	}
	if !reHexColor2.MatchString(input.Color) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid color"})
		return
	}

	var item models.Title
	if err := app.DB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Title not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load title"})
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
	if err := app.DB.Model(&models.Title{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		if isUniqueViolation(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Title code already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update title"})
		return
	}

	if err := app.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load title"})
		return
	}
	c.JSON(http.StatusOK, item)
}

func AdminDeleteTitle(c *gin.Context) {
	id, err := parseInt64Param2(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	if err := app.DB.Delete(&models.Title{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete title"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

func AdminGetUserTitles(c *gin.Context) {
	userID, err := parseInt64Param2(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user id"})
		return
	}
	items, err := service.ListUserTitles(app.DB, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load user titles"})
		return
	}
	c.JSON(http.StatusOK, items)
}

func AdminAssignTitleToUser(c *gin.Context) {
	userID, err := parseInt64Param2(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user id"})
		return
	}
	var input struct {
		TitleID int64 `json:"title_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var t models.Title
	if err := app.DB.Select("id").First(&t, input.TitleID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Title not found"})
		return
	}

	assignerAny, _ := c.Get("user_id")
	assigner, _ := assignerAny.(int64)
	ut := models.UserTitle{UserID: userID, TitleID: input.TitleID, AssignedBy: &assigner}
	if err := app.DB.Where("user_id = ? AND title_id = ?", userID, input.TitleID).FirstOrCreate(&ut).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign title"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Assigned"})
}

func AdminUnassignTitleFromUser(c *gin.Context) {
	userID, err := parseInt64Param2(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user id"})
		return
	}
	titleID, err := parseInt64Param2(c, "titleId")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid title id"})
		return
	}

	if err := app.DB.Where("user_id = ? AND title_id = ?", userID, titleID).Delete(&models.UserTitle{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unassign title"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Unassigned"})
}

func AdminBulkAssignTitleByRole(c *gin.Context) {
	titleID, err := parseInt64Param2(c, "id")
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

	var t models.Title
	if err := app.DB.Select("id").First(&t, titleID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Title not found"})
		return
	}

	assignerAny, _ := c.Get("user_id")
	assigner, _ := assignerAny.(int64)
	res := app.DB.Exec(
		`INSERT INTO user_titles (user_id, title_id, assigned_by)
SELECT u.id, ?, ?
FROM users u
WHERE u.role = ?
ON CONFLICT (user_id, title_id) DO NOTHING`,
		titleID,
		assigner,
		role,
	)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign title"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"assigned_count": res.RowsAffected})
}

func AdminBulkAssignTitleByRegisteredBefore(c *gin.Context) {
	titleID, err := parseInt64Param2(c, "id")
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
	tm, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date"})
		return
	}
	cutoff := tm.Add(24 * time.Hour)

	var t models.Title
	if err := app.DB.Select("id").First(&t, titleID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Title not found"})
		return
	}

	assignerAny, _ := c.Get("user_id")
	assigner, _ := assignerAny.(int64)
	res := app.DB.Exec(
		`INSERT INTO user_titles (user_id, title_id, assigned_by)
SELECT u.id, ?, ?
FROM users u
WHERE u.created_at < ?
ON CONFLICT (user_id, title_id) DO NOTHING`,
		titleID,
		assigner,
		cutoff,
	)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign title"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"assigned_count": res.RowsAffected})
}

func AdminBulkUnassignTitleByRole(c *gin.Context) {
	titleID, err := parseInt64Param2(c, "id")
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

	var t models.Title
	if err := app.DB.Select("id").First(&t, titleID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Title not found"})
		return
	}

	res := app.DB.Exec(
		`DELETE FROM user_titles ut
WHERE ut.title_id = ?
AND ut.user_id IN (SELECT id FROM users WHERE role = ?)`,
		titleID,
		role,
	)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unassign title"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"removed_count": res.RowsAffected})
}
