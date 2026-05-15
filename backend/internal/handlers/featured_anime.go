package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
	"gorm.io/gorm"
)

const featuredAnimeLimit = 5

var errFeaturedLimitReached = errors.New("featured_limit_reached")

func GetFeaturedAnimes(c *gin.Context) {
	var animes []models.Anime
	err := app.DB.Model(&models.Anime{}).
		Where("is_featured = TRUE").
		Preload("Studio").
		Preload("Status").
		Preload("Source").
		Preload("Genres").
		Preload("Translations.Language").
		Order("featured_at desc nulls last").
		Order("id desc").
		Limit(featuredAnimeLimit).
		Find(&animes).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch featured anime"})
		return
	}
	_ = hydrateAnimeRefsRU(animes)
	c.JSON(http.StatusOK, animes)
}

func AdminListFeaturedAnimes(c *gin.Context) {
	var animes []models.Anime
	err := app.DB.Model(&models.Anime{}).
		Where("is_featured = TRUE").
		Preload("Studio").
		Preload("Status").
		Preload("Source").
		Preload("Genres").
		Preload("Translations.Language").
		Order("featured_at desc nulls last").
		Order("id desc").
		Limit(featuredAnimeLimit).
		Find(&animes).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch featured anime"})
		return
	}
	_ = hydrateAnimeRefsRU(animes)
	c.JSON(http.StatusOK, animes)
}

type AdminSetFeaturedInput struct {
	Featured bool `json:"featured"`
}

func AdminSetAnimeFeatured(c *gin.Context) {
	idRaw := strings.TrimSpace(c.Param("id"))
	id, err := strconv.ParseInt(idRaw, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid anime id"})
		return
	}

	var input AdminSetFeaturedInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var updated models.Anime
	err = app.DB.Transaction(func(tx *gorm.DB) error {
		var a models.Anime
		if err := tx.Select("id", "is_featured").First(&a, id).Error; err != nil {
			return err
		}

		if input.Featured == a.IsFeatured {
			return tx.Model(&models.Anime{}).
				Preload("Studio").
				Preload("Status").
				Preload("Source").
				Preload("Genres").
				Preload("Translations.Language").
				First(&updated, id).Error
		}

		if input.Featured {
			var count int64
			if err := tx.Model(&models.Anime{}).Where("is_featured = TRUE").Count(&count).Error; err != nil {
				return err
			}
			if count >= featuredAnimeLimit {
				return errFeaturedLimitReached
			}
			now := time.Now()
			if err := tx.Model(&models.Anime{}).Where("id = ?", id).Updates(map[string]any{"is_featured": true, "featured_at": &now}).Error; err != nil {
				return err
			}
		} else {
			if err := tx.Model(&models.Anime{}).Where("id = ?", id).Updates(map[string]any{"is_featured": false, "featured_at": nil}).Error; err != nil {
				return err
			}
		}

		return tx.Model(&models.Anime{}).
			Preload("Studio").
			Preload("Status").
			Preload("Source").
			Preload("Genres").
			Preload("Translations.Language").
			First(&updated, id).Error
	})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Anime not found"})
			return
		}
		if err == errFeaturedLimitReached {
			c.JSON(http.StatusBadRequest, gin.H{"error": "maximum of 5 featured anime reached"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update featured status"})
		return
	}

	tmp := []models.Anime{updated}
	_ = hydrateAnimeRefsRU(tmp)
	updated = tmp[0]
	c.JSON(http.StatusOK, updated)
}
