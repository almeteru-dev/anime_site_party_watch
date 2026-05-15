package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
	"gorm.io/gorm"
)

func getOrCreateVideoLabelByName(tx *gorm.DB, name string) (*models.VideoLabel, error) {
	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		return nil, errors.New("name is required")
	}
	label := models.VideoLabel{Name: trimmed}
	if err := tx.Where("name = ?", trimmed).FirstOrCreate(&label).Error; err != nil {
		return nil, err
	}
	return &label, nil
}

func GetAnimeEpisodes(c *gin.Context) {
	identifier := c.Param("id")
	var animeID int64
	if parsed, err := strconv.ParseInt(identifier, 10, 64); err == nil {
		animeID = parsed
	} else {
		var anime models.Anime
		if err := app.DB.Select("id").Where("url = ?", identifier).First(&anime).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Anime not found"})
			return
		}
		animeID = anime.ID
	}

	q := app.DB.Where("anime_id = ?", animeID).Preload("VideoSources", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order asc")
	}).Preload("VideoSources.VideoLabel").Preload("VideoSources.VoiceGroup").Order("number asc")

	var episodes []models.Episode
	if err := q.Find(&episodes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch episodes"})
		return
	}

	c.JSON(http.StatusOK, episodes)
}

type AdminUpsertEpisodeInput struct {
	Number   int    `json:"number" binding:"required"`
	Duration int    `json:"duration"`
	Kind     string `json:"kind"`
}

type AdminCreateEpisodeSourceInput struct {
	LabelID            *int64                 `json:"label_id"`
	Label              string                 `json:"label"`
	Type               models.VideoSourceType `json:"type"`
	URL                string                 `json:"url"`
	VoiceGroupID       *int64                 `json:"voice_group_id"`
	IsIntegratedPlayer bool                   `json:"is_integrated_player"`
	IsDefault          bool                   `json:"is_default"`
	IsActive           bool                   `json:"is_active"`
	SortOrder          int                    `json:"sort_order"`
}

type AdminCreateEpisodeRequest struct {
	Episode       AdminUpsertEpisodeInput        `json:"episode"`
	InitialSource *AdminCreateEpisodeSourceInput `json:"initial_source"`
}

func AdminCreateEpisode(c *gin.Context) {
	animeIDStr := c.Param("id")
	animeID, err := strconv.ParseInt(animeIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid anime id"})
		return
	}

	body, _ := c.GetRawData()

	var input AdminUpsertEpisodeInput
	var initial *AdminCreateEpisodeSourceInput
	var wrapped AdminCreateEpisodeRequest
	if err := json.Unmarshal(body, &wrapped); err == nil && wrapped.Episode.Number != 0 {
		input = wrapped.Episode
		initial = wrapped.InitialSource
	} else {
		if err := json.Unmarshal(body, &input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
			return
		}
	}

	var anime models.Anime
	if err := app.DB.Select("id", "episodes").First(&anime, animeID).Error; err != nil {
		log.Printf("AdminCreateEpisode: anime not found (anime_id=%d): %v", animeID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Anime not found"})
		return
	}
	if input.Number > anime.Episodes {
		c.JSON(http.StatusBadRequest, gin.H{"error": "episode_number exceeds anime.episodes"})
		return
	}
	if input.Number < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "episode_number must be >= 1"})
		return
	}

	kind := strings.ToLower(strings.TrimSpace(input.Kind))
	if kind == "" {
		kind = "tv"
	}

	ep := models.Episode{
		AnimeID:  animeID,
		Number:   input.Number,
		Kind:     kind,
		Duration: input.Duration,
	}

	err = app.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&ep).Error; err != nil {
			return err
		}

		if initial == nil {
			return nil
		}

		src := models.VideoSource{
			EpisodeID:          ep.ID,
			Label:              strings.TrimSpace(initial.Label),
			Type:               initial.Type,
			URL:                initial.URL,
			IsIntegratedPlayer: initial.IsIntegratedPlayer,
			IsDefault:          initial.IsDefault,
			IsActive:           initial.IsActive,
			SortOrder:          initial.SortOrder,
		}

		if src.Type != models.VideoSourceTypeIframe && src.Type != models.VideoSourceTypeDirect {
			return errors.New("invalid source type")
		}
		if strings.TrimSpace(src.URL) == "" {
			return errors.New("url is required")
		}

		var resolvedLabel *models.VideoLabel
		if initial.LabelID != nil {
			var vl models.VideoLabel
			if err := tx.First(&vl, *initial.LabelID).Error; err != nil {
				return errors.New("unknown video label")
			}
			resolvedLabel = &vl
		}

		if resolvedLabel != nil {
			src.LabelID = &resolvedLabel.ID
			src.Label = resolvedLabel.Name
		} else if strings.TrimSpace(initial.Label) != "" {
			vl, err := getOrCreateVideoLabelByName(tx, initial.Label)
			if err != nil {
				return err
			}
			src.LabelID = &vl.ID
			src.Label = vl.Name
		} else {
			return errors.New("label_id or label is required")
		}

		if src.IsIntegratedPlayer {
			src.Audio = nil
			src.VoiceGroupID = nil
		} else {
			if initial.VoiceGroupID == nil {
				return errors.New("voice_group_id is required when not integrated")
			}
			var vg models.VoiceGroup
			if err := tx.First(&vg, *initial.VoiceGroupID).Error; err != nil {
				return errors.New("unknown voice group")
			}
			src.VoiceGroupID = &vg.ID
			v := strings.ToLower(strings.TrimSpace(string(vg.Type)))
			if v != "dub" && v != "sub" {
				return errors.New("invalid voice group type")
			}
			src.Audio = &v
		}

		if !src.IsActive {
			src.IsDefault = false
		}

		if src.IsDefault {
			if err := tx.Model(&models.VideoSource{}).Where("episode_id = ?", ep.ID).Update("is_default", false).Error; err != nil {
				return err
			}
		}

		if err := tx.Create(&src).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		log.Printf("AdminCreateEpisode: create failed (anime_id=%d number=%d): %v", animeID, input.Number, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": mapEpisodeDBError(err)})
		return
	}

	_ = app.DB.Preload("VideoSources").Preload("VideoSources.VideoLabel").Preload("VideoSources.VoiceGroup").First(&ep, ep.ID).Error
	c.JSON(http.StatusCreated, ep)
}

func AdminUpdateEpisode(c *gin.Context) {
	epID := c.Param("id")
	var input AdminUpsertEpisodeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Number < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "episode_number must be >= 1"})
		return
	}

	var ep models.Episode
	if err := app.DB.First(&ep, epID).Error; err != nil {
		log.Printf("AdminUpdateEpisode: episode not found (episode_id=%s): %v", epID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Episode not found"})
		return
	}

	var anime models.Anime
	if err := app.DB.Select("id", "episodes").First(&anime, ep.AnimeID).Error; err == nil {
		if input.Number > anime.Episodes {
			c.JSON(http.StatusBadRequest, gin.H{"error": "episode_number exceeds anime.episodes"})
			return
		}
	}

	ep.Number = input.Number
	ep.Duration = input.Duration
	k := strings.ToLower(strings.TrimSpace(input.Kind))
	if k == "" {
		k = ep.Kind
		if k == "" {
			k = "tv"
		}
	}
	ep.Kind = k

	if err := app.DB.Save(&ep).Error; err != nil {
		log.Printf("AdminUpdateEpisode: save failed (episode_id=%s anime_id=%d number=%d): %v", epID, ep.AnimeID, input.Number, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": mapEpisodeDBError(err)})
		return
	}

	_ = app.DB.Preload("VideoSources").Preload("VideoSources.VideoLabel").Preload("VideoSources.VoiceGroup").First(&ep, ep.ID).Error
	c.JSON(http.StatusOK, ep)
}

func AdminDeleteEpisode(c *gin.Context) {
	epID := c.Param("id")
	var ep models.Episode
	if err := app.DB.First(&ep, epID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Episode not found"})
		return
	}

	if err := app.DB.Delete(&ep).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete episode"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

// Video Source Handlers

type AdminUpsertVideoSourceInput struct {
	LabelID            *int64                 `json:"label_id"`
	Label              string                 `json:"label"`
	Type               models.VideoSourceType `json:"type" binding:"required"`
	URL                string                 `json:"url" binding:"required"`
	VoiceGroupID       *int64                 `json:"voice_group_id"`
	IsIntegratedPlayer bool                   `json:"is_integrated_player"`
	IsDefault          bool                   `json:"is_default"`
	IsActive           bool                   `json:"is_active"`
	SortOrder          int                    `json:"sort_order"`
}

func AdminCreateVideoSource(c *gin.Context) {
	epIDStr := c.Param("id")
	epID, err := strconv.ParseInt(epIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid episode id"})
		return
	}

	var input AdminUpsertVideoSourceInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	source := models.VideoSource{
		EpisodeID:          epID,
		Label:              strings.TrimSpace(input.Label),
		Type:               input.Type,
		URL:                input.URL,
		IsIntegratedPlayer: input.IsIntegratedPlayer,
		IsDefault:          input.IsDefault,
		IsActive:           input.IsActive,
		SortOrder:          input.SortOrder,
	}

	if source.IsIntegratedPlayer {
		source.Audio = nil
		source.VoiceGroupID = nil
	} else {
		if input.VoiceGroupID == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "voice_group_id is required when not integrated"})
			return
		}
		var vg models.VoiceGroup
		if err := app.DB.First(&vg, *input.VoiceGroupID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown voice group"})
			return
		}
		source.VoiceGroupID = &vg.ID
		v := strings.ToLower(strings.TrimSpace(string(vg.Type)))
		source.Audio = &v
	}

	if input.LabelID == nil && strings.TrimSpace(input.Label) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "label_id or label is required"})
		return
	}

	err = app.DB.Transaction(func(tx *gorm.DB) error {
		if input.LabelID != nil {
			var label models.VideoLabel
			if err := tx.First(&label, *input.LabelID).Error; err != nil {
				return err
			}
			source.LabelID = &label.ID
			source.Label = label.Name
		} else {
			label, err := getOrCreateVideoLabelByName(tx, input.Label)
			if err != nil {
				return err
			}
			source.LabelID = &label.ID
			source.Label = label.Name
		}

		if source.IsDefault {
			if err := tx.Model(&models.VideoSource{}).Where("episode_id = ?", epID).Update("is_default", false).Error; err != nil {
				return err
			}
		}
		return tx.Create(&source).Error
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create video source"})
		return
	}

	_ = app.DB.Preload("VideoLabel").Preload("VoiceGroup").First(&source, source.ID).Error
	c.JSON(http.StatusCreated, source)
}

func AdminUpdateVideoSource(c *gin.Context) {
	sourceID := c.Param("id")
	var input AdminUpsertVideoSourceInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var source models.VideoSource
	if err := app.DB.First(&source, sourceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Video source not found"})
		return
	}

	if input.LabelID == nil && strings.TrimSpace(input.Label) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "label_id or label is required"})
		return
	}

	var resolvedLabel *models.VideoLabel
	if input.LabelID != nil {
		var label models.VideoLabel
		if err := app.DB.First(&label, *input.LabelID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown label"})
			return
		}
		resolvedLabel = &label
	} else {
		label, err := getOrCreateVideoLabelByName(app.DB, input.Label)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid label"})
			return
		}
		resolvedLabel = label
	}

	source.LabelID = &resolvedLabel.ID
	source.Label = resolvedLabel.Name
	source.Type = input.Type
	source.URL = input.URL
	source.IsIntegratedPlayer = input.IsIntegratedPlayer
	if source.IsIntegratedPlayer {
		source.Audio = nil
		source.VoiceGroupID = nil
	} else {
		if input.VoiceGroupID == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "voice_group_id is required when not integrated"})
			return
		}
		var vg models.VoiceGroup
		if err := app.DB.First(&vg, *input.VoiceGroupID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown voice group"})
			return
		}
		source.VoiceGroupID = &vg.ID
		v := strings.ToLower(strings.TrimSpace(string(vg.Type)))
		source.Audio = &v
	}
	source.IsDefault = input.IsDefault
	source.IsActive = input.IsActive
	source.SortOrder = input.SortOrder

	err := app.DB.Transaction(func(tx *gorm.DB) error {
		if source.IsDefault {
			if err := tx.Model(&models.VideoSource{}).Where("episode_id = ? AND id != ?", source.EpisodeID, source.ID).Update("is_default", false).Error; err != nil {
				return err
			}
		}
		return tx.Save(&source).Error
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update video source"})
		return
	}

	_ = app.DB.Preload("VideoLabel").First(&source, source.ID).Error
	c.JSON(http.StatusOK, source)
}

func AdminDeleteVideoSource(c *gin.Context) {
	sourceID := c.Param("id")
	var source models.VideoSource
	if err := app.DB.First(&source, sourceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Video source not found"})
		return
	}

	// Prevent deleting the last source
	var count int64
	app.DB.Model(&models.VideoSource{}).Where("episode_id = ?", source.EpisodeID).Count(&count)
	if count <= 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete the last video source"})
		return
	}

	if err := app.DB.Delete(&source).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete video source"})
		return
	}

	// If the deleted source was default, set another one as default
	if source.IsDefault {
		app.DB.Model(&models.VideoSource{}).Where("episode_id = ?", source.EpisodeID).Limit(1).Update("is_default", true)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

func AdminSetDefaultVideoSource(c *gin.Context) {
	sourceID := c.Param("id")
	var source models.VideoSource
	if err := app.DB.First(&source, sourceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Video source not found"})
		return
	}

	err := app.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.VideoSource{}).Where("episode_id = ?", source.EpisodeID).Update("is_default", false).Error; err != nil {
			return err
		}
		return tx.Model(&source).Update("is_default", true).Error
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set default video source"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Updated default source"})
}

func mapEpisodeDBError(err error) string {
	if err == nil {
		return "Unknown error"
	}

	s := err.Error()
	if strings.Contains(s, "null value in column \"server_number\"") || strings.Contains(s, "null value in column \"video_url\"") {
		return "Legacy episodes schema requires server_number/video_url (apply migrations)"
	}
	if strings.Contains(s, "relation \"video_labels\" does not exist") {
		return "Missing table video_labels (apply migrations)"
	}
	if strings.Contains(s, "relation \"video_sources\" does not exist") {
		return "Missing table video_sources (apply migrations)"
	}
	if strings.Contains(s, "episode_number exceeds anime.episodes") {
		return "episode_number exceeds anime.episodes"
	}
	if strings.Contains(s, "episodes_number_min") {
		return "episode_number must be >= 1"
	}
	if strings.Contains(s, "idx_episode_unique") || strings.Contains(s, "episodes_anime_id_server_number_group_id_number_key") || strings.Contains(s, "duplicate key") {
		return "Episode already exists for this voice group and number"
	}

	return "Failed to save episode"
}
