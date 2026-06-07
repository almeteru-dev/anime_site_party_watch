package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
)

type PublicCatalogMetaResponse struct {
	Genres    []models.Genre        `json:"genres"`
	Themes    []models.Theme        `json:"themes"`
	Statuses  []models.Status       `json:"statuses"`
	Studios   []models.Studio       `json:"studios"`
	Producers []models.Producer     `json:"producers"`
	Sources   []models.Source       `json:"sources"`
	Ratings   []models.RatingOption `json:"ratings"`
	Kinds     []models.KindOption   `json:"kinds"`
	YearMin   int                   `json:"year_min"`
	YearMax   int                   `json:"year_max"`
}

func GetPublicCatalogMeta(c *gin.Context) {
	var genres []models.Genre
	var themes []models.Theme
	var statuses []models.Status
	var studios []models.Studio
	var producers []models.Producer
	var sources []models.Source
	var ratings []models.RatingOption
	var kinds []models.KindOption

	if err := app.DB.Order("name asc").Find(&genres).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch genres"})
		return
	}
	_ = applyGenreRU(genres)
	_ = applyGenreUK(genres)
	if err := app.DB.Order("name asc").Find(&themes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch themes"})
		return
	}
	_ = applyThemeRU(themes)
	_ = applyThemeUK(themes)
	if err := app.DB.Order("name asc").Find(&statuses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch statuses"})
		return
	}
	_ = applyStatusRU(statuses)
	_ = applyStatusUK(statuses)
	if err := app.DB.Order("name asc").Find(&studios).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch studios"})
		return
	}
	_ = applyStudioRU(studios)
	_ = applyStudioUK(studios)
	if err := app.DB.Order("name asc").Find(&producers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch producers"})
		return
	}
	if err := app.DB.Order("name asc").Find(&sources).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sources"})
		return
	}
	_ = applySourceRU(sources)
	_ = applySourceUK(sources)
	if err := app.DB.Order("name asc").Find(&ratings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ratings"})
		return
	}
	if err := app.DB.Select("id, name, ru_name").Order("name asc").Find(&kinds).Error; err != nil {
		if strings.Contains(err.Error(), "ru_name") {
			if err2 := app.DB.Select("id, name").Order("name asc").Find(&kinds).Error; err2 != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch kinds"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch kinds"})
			return
		}
	}

	yearMin := 1990
	yearMax := time.Now().Year()

	var minVal *int
	var maxVal *int
	app.DB.Raw(
		"SELECT MIN(EXTRACT(YEAR FROM aired_on))::int FROM anime WHERE aired_on IS NOT NULL",
	).Scan(&minVal)
	app.DB.Raw(
		"SELECT MAX(EXTRACT(YEAR FROM aired_on))::int FROM anime WHERE aired_on IS NOT NULL",
	).Scan(&maxVal)

	if minVal != nil {
		yearMin = *minVal
	}
	if maxVal != nil {
		yearMax = *maxVal
	}
	if yearMin > yearMax {
		yearMin, yearMax = yearMax, yearMin
	}

	c.JSON(http.StatusOK, PublicCatalogMetaResponse{
		Genres:    genres,
		Themes:    themes,
		Statuses:  statuses,
		Studios:   studios,
		Producers: producers,
		Sources:   sources,
		Ratings:   ratings,
		Kinds:     kinds,
		YearMin:   yearMin,
		YearMax:   yearMax,
	})
}
