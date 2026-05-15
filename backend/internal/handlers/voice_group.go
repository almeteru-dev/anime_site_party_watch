package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
)

func AdminListVoiceGroups(c *gin.Context) {
	var groups []models.VoiceGroup
	if err := app.DB.Order("type asc").Order("name asc").Find(&groups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch voice groups"})
		return
	}
	c.JSON(http.StatusOK, groups)
}

type AdminUpsertVoiceGroupInput struct {
	Name string `json:"name" binding:"required"`
	Type string `json:"type" binding:"required"` // dub | sub
}

func AdminCreateVoiceGroup(c *gin.Context) {
	var input AdminUpsertVoiceGroupInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	name := strings.TrimSpace(input.Name)
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	t := strings.ToLower(strings.TrimSpace(input.Type))
	if t != string(models.VoiceGroupTypeDub) && t != string(models.VoiceGroupTypeSub) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "type must be 'dub' or 'sub'"})
		return
	}

	group := models.VoiceGroup{Name: name, Type: models.VoiceGroupType(t)}
	if err := app.DB.Create(&group).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to create voice group"})
		return
	}

	c.JSON(http.StatusCreated, group)
}

func AdminUpdateVoiceGroup(c *gin.Context) {
	id := c.Param("id")
	var input AdminUpsertVoiceGroupInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var group models.VoiceGroup
	if err := app.DB.First(&group, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Voice group not found"})
		return
	}

	name := strings.TrimSpace(input.Name)
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	t := strings.ToLower(strings.TrimSpace(input.Type))
	if t != string(models.VoiceGroupTypeDub) && t != string(models.VoiceGroupTypeSub) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "type must be 'dub' or 'sub'"})
		return
	}

	group.Name = name
	group.Type = models.VoiceGroupType(t)
	if err := app.DB.Save(&group).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to update voice group"})
		return
	}

	c.JSON(http.StatusOK, group)
}

func AdminDeleteVoiceGroup(c *gin.Context) {
	id := c.Param("id")
	var group models.VoiceGroup
	if err := app.DB.First(&group, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Voice group not found"})
		return
	}

	if err := app.DB.Delete(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete voice group"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}
