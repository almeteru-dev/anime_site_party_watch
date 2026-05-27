package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
)

type NameInput struct {
	Name          string  `json:"name"`
	RUName        *string `json:"ru_name"`
	DescriptionEN *string `json:"description_en"`
	DescriptionRU *string `json:"description_ru"`
}

func AdminListKinds(c *gin.Context) {
	var items []models.KindOption
	if err := app.DB.Order("name asc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch kinds"})
		return
	}
	c.JSON(http.StatusOK, items)
}

func AdminCreateKind(c *gin.Context) {
	var input NameInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	name := strings.TrimSpace(input.Name)
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}
	ru := normalizeOptionalName(input.RUName)
	item := models.KindOption{Name: name, RUName: ru}
	if err := app.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to create kind"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func AdminUpdateKind(c *gin.Context) {
	var input NameInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	name := strings.TrimSpace(input.Name)
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}
	var item models.KindOption
	if err := app.DB.First(&item, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kind not found"})
		return
	}
	item.Name = name
	item.RUName = normalizeOptionalName(input.RUName)
	if err := app.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to update kind"})
		return
	}
	c.JSON(http.StatusOK, item)
}

func AdminDeleteKind(c *gin.Context) {
	if err := app.DB.Delete(&models.KindOption{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to delete kind"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

func AdminListRatings(c *gin.Context) {
	var items []models.RatingOption
	if err := app.DB.Order("name asc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ratings"})
		return
	}
	c.JSON(http.StatusOK, items)
}

func AdminCreateRating(c *gin.Context) {
	var input NameInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	name := strings.TrimSpace(input.Name)
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}
	descEn := normalizeOptionalName(input.DescriptionEN)
	descRu := normalizeOptionalName(input.DescriptionRU)
	item := models.RatingOption{Name: name, DescriptionEN: descEn, DescriptionRU: descRu}
	if err := app.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to create rating"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func AdminUpdateRating(c *gin.Context) {
	var input NameInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	name := strings.TrimSpace(input.Name)
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}
	var item models.RatingOption
	if err := app.DB.First(&item, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Rating not found"})
		return
	}
	item.Name = name
	item.DescriptionEN = normalizeOptionalName(input.DescriptionEN)
	item.DescriptionRU = normalizeOptionalName(input.DescriptionRU)
	if err := app.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to update rating"})
		return
	}
	c.JSON(http.StatusOK, item)
}

func AdminDeleteRating(c *gin.Context) {
	if err := app.DB.Delete(&models.RatingOption{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to delete rating"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}
