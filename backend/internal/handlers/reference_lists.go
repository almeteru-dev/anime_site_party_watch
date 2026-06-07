package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
)

type shikiGenreItem struct {
	Name      string `json:"name"`
	Russian   string `json:"russian"`
	Kind      string `json:"kind"`
	EntryType string `json:"entry_type"`
}

func mapDeleteRefError(entity string, err error) string {
	if err == nil {
		return "Failed to delete " + entity
	}
	s := err.Error()
	if strings.Contains(s, "violates foreign key constraint") {
		return "Cannot delete " + entity + " (in use)"
	}
	return "Failed to delete " + entity
}

func AdminListStatuses(c *gin.Context) {
	var items []models.Status
	if err := app.DB.Order("name asc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch statuses"})
		return
	}
	_ = applyStatusRU(items)
	_ = applyStatusUK(items)
	c.JSON(http.StatusOK, items)
}

func AdminCreateStatus(c *gin.Context) {
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
	var exists int64
	_ = app.DB.Model(&models.Status{}).Where("name = ?", name).Count(&exists)
	if exists > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status already exists"})
		return
	}
	item := models.Status{Name: name}
	if err := app.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to create status"})
		return
	}
	if err := setStatusRUName(item.ID, input.RUName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save russian name"})
		return
	}
	_ = setStatusUKName(item.ID, input.UKName)
	item.RUName = normalizeOptionalName(input.RUName)
	item.UKName = normalizeOptionalName(input.UKName)
	c.JSON(http.StatusCreated, item)
}

func AdminUpdateStatus(c *gin.Context) {
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
	var item models.Status
	if err := app.DB.First(&item, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Status not found"})
		return
	}
	item.Name = name
	if err := app.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to update status"})
		return
	}
	if err := setStatusRUName(item.ID, input.RUName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save russian name"})
		return
	}
	_ = setStatusUKName(item.ID, input.UKName)
	item.RUName = normalizeOptionalName(input.RUName)
	item.UKName = normalizeOptionalName(input.UKName)
	c.JSON(http.StatusOK, item)
}

func AdminDeleteStatus(c *gin.Context) {
	if err := app.DB.Delete(&models.Status{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": mapDeleteRefError("status", err)})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

func AdminListStudios(c *gin.Context) {
	var items []models.Studio
	if err := app.DB.Order("name asc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch studios"})
		return
	}
	_ = applyStudioRU(items)
	_ = applyStudioUK(items)
	c.JSON(http.StatusOK, items)
}

func AdminCreateStudio(c *gin.Context) {
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
	var exists int64
	_ = app.DB.Model(&models.Studio{}).Where("name = ?", name).Count(&exists)
	if exists > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Studio already exists"})
		return
	}
	item := models.Studio{Name: name}
	if err := app.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to create studio"})
		return
	}
	if err := setStudioRUName(item.ID, input.RUName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save russian name"})
		return
	}
	_ = setStudioUKName(item.ID, input.UKName)
	item.RUName = normalizeOptionalName(input.RUName)
	item.UKName = normalizeOptionalName(input.UKName)
	c.JSON(http.StatusCreated, item)
}

func AdminUpdateStudio(c *gin.Context) {
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
	var item models.Studio
	if err := app.DB.First(&item, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Studio not found"})
		return
	}
	item.Name = name
	if err := app.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to update studio"})
		return
	}
	if err := setStudioRUName(item.ID, input.RUName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save russian name"})
		return
	}
	_ = setStudioUKName(item.ID, input.UKName)
	item.RUName = normalizeOptionalName(input.RUName)
	item.UKName = normalizeOptionalName(input.UKName)
	c.JSON(http.StatusOK, item)
}

func AdminDeleteStudio(c *gin.Context) {
	if err := app.DB.Delete(&models.Studio{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": mapDeleteRefError("studio", err)})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

type VideoLabelInput struct {
	Name             string `json:"name"`
	IsExternalPlayer bool   `json:"is_external_player"`
}

func AdminListVideoLabels(c *gin.Context) {
	var items []models.VideoLabel
	if err := app.DB.Order("name asc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch video labels"})
		return
	}
	c.JSON(http.StatusOK, items)
}

func AdminCreateVideoLabel(c *gin.Context) {
	var input VideoLabelInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	name := strings.TrimSpace(input.Name)
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}
	var exists int64
	_ = app.DB.Model(&models.VideoLabel{}).Where("name = ?", name).Count(&exists)
	if exists > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Video label already exists"})
		return
	}
	item := models.VideoLabel{Name: name, IsExternalPlayer: input.IsExternalPlayer}
	if err := app.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to create video label"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func AdminUpdateVideoLabel(c *gin.Context) {
	var input VideoLabelInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	name := strings.TrimSpace(input.Name)
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}
	var item models.VideoLabel
	if err := app.DB.First(&item, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Video label not found"})
		return
	}
	item.Name = name
	item.IsExternalPlayer = input.IsExternalPlayer
	if err := app.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to update video label"})
		return
	}
	c.JSON(http.StatusOK, item)
}

func AdminDeleteVideoLabel(c *gin.Context) {
	if err := app.DB.Delete(&models.VideoLabel{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": mapDeleteRefError("video label", err)})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

func AdminListSources(c *gin.Context) {
	var items []models.Source
	if err := app.DB.Order("name asc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sources"})
		return
	}
	_ = applySourceRU(items)
	_ = applySourceUK(items)
	c.JSON(http.StatusOK, items)
}

func AdminCreateSource(c *gin.Context) {
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
	var exists int64
	_ = app.DB.Model(&models.Source{}).Where("name = ?", name).Count(&exists)
	if exists > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Source already exists"})
		return
	}
	item := models.Source{Name: name}
	if err := app.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to create source"})
		return
	}
	if err := setSourceRUName(item.ID, input.RUName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save russian name"})
		return
	}
	_ = setSourceUKName(item.ID, input.UKName)
	item.RUName = normalizeOptionalName(input.RUName)
	item.UKName = normalizeOptionalName(input.UKName)
	c.JSON(http.StatusCreated, item)
}

func AdminUpdateSource(c *gin.Context) {
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
	var item models.Source
	if err := app.DB.First(&item, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Source not found"})
		return
	}
	item.Name = name
	if err := app.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to update source"})
		return
	}
	if err := setSourceRUName(item.ID, input.RUName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save russian name"})
		return
	}
	_ = setSourceUKName(item.ID, input.UKName)
	item.RUName = normalizeOptionalName(input.RUName)
	item.UKName = normalizeOptionalName(input.UKName)
	c.JSON(http.StatusOK, item)
}

func AdminDeleteSource(c *gin.Context) {
	if err := app.DB.Delete(&models.Source{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": mapDeleteRefError("source", err)})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

func AdminListGenres(c *gin.Context) {
	var items []models.Genre
	if err := app.DB.Order("name asc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch genres"})
		return
	}
	_ = applyGenreRU(items)
	_ = applyGenreUK(items)
	c.JSON(http.StatusOK, items)
}

func AdminCreateGenre(c *gin.Context) {
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
	var exists int64
	_ = app.DB.Model(&models.Genre{}).Where("name = ?", name).Count(&exists)
	if exists > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Genre already exists"})
		return
	}
	item := models.Genre{Name: name}
	item.DescriptionEN = normalizeOptionalName(input.DescriptionEN)
	if err := app.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to create genre"})
		return
	}
	if err := setGenreRUName(item.ID, input.RUName, input.DescriptionRU); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save russian name"})
		return
	}
	_ = setGenreUKName(item.ID, input.UKName, input.DescriptionUK)
	item.RUName = normalizeOptionalName(input.RUName)
	item.DescriptionRU = normalizeOptionalName(input.DescriptionRU)
	item.UKName = normalizeOptionalName(input.UKName)
	item.DescriptionUK = normalizeOptionalName(input.DescriptionUK)
	if item.RUName == nil && item.DescriptionRU != nil {
		v := item.Name
		item.RUName = &v
	}
	c.JSON(http.StatusCreated, item)
}

func AdminUpdateGenre(c *gin.Context) {
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
	var item models.Genre
	if err := app.DB.First(&item, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Genre not found"})
		return
	}
	item.Name = name
	item.DescriptionEN = normalizeOptionalName(input.DescriptionEN)
	if err := app.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to update genre"})
		return
	}
	if err := setGenreRUName(item.ID, input.RUName, input.DescriptionRU); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save russian name"})
		return
	}
	_ = setGenreUKName(item.ID, input.UKName, input.DescriptionUK)
	item.RUName = normalizeOptionalName(input.RUName)
	item.DescriptionRU = normalizeOptionalName(input.DescriptionRU)
	item.UKName = normalizeOptionalName(input.UKName)
	item.DescriptionUK = normalizeOptionalName(input.DescriptionUK)
	if item.RUName == nil && item.DescriptionRU != nil {
		v := item.Name
		item.RUName = &v
	}
	c.JSON(http.StatusOK, item)
}

func AdminDeleteGenre(c *gin.Context) {
	if err := app.DB.Delete(&models.Genre{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": mapDeleteRefError("genre", err)})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

func AdminListThemes(c *gin.Context) {
	var items []models.Theme
	if err := app.DB.Order("name asc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch themes"})
		return
	}
	_ = applyThemeRU(items)
	_ = applyThemeUK(items)
	c.JSON(http.StatusOK, items)
}

func AdminCreateTheme(c *gin.Context) {
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
	var exists int64
	_ = app.DB.Model(&models.Theme{}).Where("name = ?", name).Count(&exists)
	if exists > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Theme already exists"})
		return
	}
	item := models.Theme{Name: name}
	item.DescriptionEN = normalizeOptionalName(input.DescriptionEN)
	if err := app.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to create theme"})
		return
	}
	if err := setThemeRUName(item.ID, input.RUName, input.DescriptionRU); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save russian name"})
		return
	}
	_ = setThemeUKName(item.ID, input.UKName, input.DescriptionUK)
	item.RUName = normalizeOptionalName(input.RUName)
	item.DescriptionRU = normalizeOptionalName(input.DescriptionRU)
	item.UKName = normalizeOptionalName(input.UKName)
	item.DescriptionUK = normalizeOptionalName(input.DescriptionUK)
	if item.RUName == nil && item.DescriptionRU != nil {
		v := item.Name
		item.RUName = &v
	}
	c.JSON(http.StatusCreated, item)
}

func AdminUpdateTheme(c *gin.Context) {
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
	var item models.Theme
	if err := app.DB.First(&item, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Theme not found"})
		return
	}
	item.Name = name
	item.DescriptionEN = normalizeOptionalName(input.DescriptionEN)
	if err := app.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to update theme"})
		return
	}
	if err := setThemeRUName(item.ID, input.RUName, input.DescriptionRU); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save russian name"})
		return
	}
	_ = setThemeUKName(item.ID, input.UKName, input.DescriptionUK)
	item.RUName = normalizeOptionalName(input.RUName)
	item.DescriptionRU = normalizeOptionalName(input.DescriptionRU)
	item.UKName = normalizeOptionalName(input.UKName)
	item.DescriptionUK = normalizeOptionalName(input.DescriptionUK)
	if item.RUName == nil && item.DescriptionRU != nil {
		v := item.Name
		item.RUName = &v
	}
	c.JSON(http.StatusOK, item)
}

func AdminDeleteTheme(c *gin.Context) {
	if err := app.DB.Delete(&models.Theme{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": mapDeleteRefError("theme", err)})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

func AdminTranslateThemesFromShikimori(c *gin.Context) {
	client := &http.Client{Timeout: 18 * time.Second}
	req, err := http.NewRequest(http.MethodGet, "https://shikimori.one/api/genres", nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to build request"})
		return
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "LycorisLib")

	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch shikimori genres"})
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		c.JSON(http.StatusBadGateway, gin.H{"error": "shikimori returned non-200", "details": string(b)})
		return
	}

	var items []shikiGenreItem
	if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to parse shikimori response"})
		return
	}
	lookup := map[string]string{}
	for _, it := range items {
		en := strings.ToLower(strings.TrimSpace(it.Name))
		ru := strings.TrimSpace(it.Russian)
		if en == "" || ru == "" {
			continue
		}
		if _, exists := lookup[en]; exists {
			continue
		}
		lookup[en] = ru
	}

	var themes []models.Theme
	if err := app.DB.Order("name asc").Find(&themes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch themes"})
		return
	}
	_ = applyThemeRU(themes)

	updated := 0
	skipped := 0
	notFound := 0
	for _, th := range themes {
		cur := ""
		if th.RUName != nil {
			cur = strings.TrimSpace(*th.RUName)
		}
		if cur != "" {
			skipped++
			continue
		}
		ru, ok := lookup[strings.ToLower(strings.TrimSpace(th.Name))]
		if !ok {
			notFound++
			continue
		}
		ruCopy := ru
		if err := setThemeRUName(th.ID, &ruCopy, nil); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save russian name"})
			return
		}
		updated++
	}

	c.JSON(http.StatusOK, gin.H{
		"updated":   updated,
		"skipped":   skipped,
		"not_found": notFound,
	})
}

func AdminListProducers(c *gin.Context) {
	var items []models.Producer
	if err := app.DB.Order("name asc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch producers"})
		return
	}
	c.JSON(http.StatusOK, items)
}

func AdminCreateProducer(c *gin.Context) {
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
	var exists int64
	_ = app.DB.Model(&models.Producer{}).Where("name = ?", name).Count(&exists)
	if exists > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Producer already exists"})
		return
	}
	item := models.Producer{Name: name}
	if err := app.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to create producer"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func AdminUpdateProducer(c *gin.Context) {
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
	var item models.Producer
	if err := app.DB.First(&item, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Producer not found"})
		return
	}
	item.Name = name
	if err := app.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to update producer"})
		return
	}
	c.JSON(http.StatusOK, item)
}

func AdminDeleteProducer(c *gin.Context) {
	if err := app.DB.Delete(&models.Producer{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": mapDeleteRefError("producer", err)})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}
