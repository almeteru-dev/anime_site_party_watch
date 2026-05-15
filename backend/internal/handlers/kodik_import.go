package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/config"
	"github.com/seva/animevista/internal/models"
	"gorm.io/gorm"
)

type kodikTranslation struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	Type  string `json:"type"`
}

type kodikEpisodeData struct {
	Link        string   `json:"link"`
	Title       string   `json:"title"`
	Screenshots []string `json:"screenshots"`
}

type kodikSeason struct {
	Link     string                     `json:"link"`
	Episodes map[string]kodikEpisodeData `json:"episodes"`
}

type kodikItem struct {
	Translation    kodikTranslation         `json:"translation"`
	Seasons        map[string]kodikSeason   `json:"seasons"`
	BlockedSeasons any                     `json:"blocked_seasons"`
	Title          string                  `json:"title"`
}

type kodikSearchResponse struct {
	Results []kodikItem `json:"results"`
}

type adminKodikImportInput struct {
	Mode string `json:"mode"` // "add" | "sync"
}

type epKey struct {
	Season  int
	Episode int
}

func AdminKodikImportEpisodes(c *gin.Context) {
	animeID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || animeID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid anime id"})
		return
	}

	if strings.TrimSpace(config.AppConfig.KODIK_API_KEY) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "KODIK_API_KEY is not configured"})
		return
	}

	var in adminKodikImportInput
	_ = c.ShouldBindJSON(&in)
	mode := strings.ToLower(strings.TrimSpace(in.Mode))
	if mode == "" {
		mode = "sync"
	}
	if mode != "add" && mode != "sync" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid mode"})
		return
	}

	var anime models.Anime
	if err := app.DB.First(&anime, animeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Anime not found"})
		return
	}
	if anime.ShikimoriID == nil || *anime.ShikimoriID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anime has no shikimori_id"})
		return
	}

	resp, err := kodikSearchByShikimoriID(*anime.ShikimoriID)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}
	if len(resp.Results) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "No results from Kodik", "created_episodes": 0, "created_sources": 0, "updated_sources": 0})
		return
	}

	maxWanted := 0
	for _, item := range resp.Results {
		keys := make([]epKey, 0)
		seasonSet := map[int]struct{}{}
		for seasonStr, season := range item.Seasons {
			seasonNum, _ := strconv.Atoi(seasonStr)
			if seasonNum > 0 {
				seasonSet[seasonNum] = struct{}{}
			}
			for epStr := range season.Episodes {
				epNum, _ := strconv.Atoi(epStr)
				if seasonNum <= 0 || epNum <= 0 {
					continue
				}
				keys = append(keys, epKey{Season: seasonNum, Episode: epNum})
			}
		}
		if len(keys) == 0 {
			continue
		}
		useEpisodeNumbers := false
		if len(seasonSet) == 1 {
			if _, ok := seasonSet[1]; ok {
				useEpisodeNumbers = true
			}
		}
		candidate := 0
		if useEpisodeNumbers {
			for _, k := range keys {
				if k.Episode > candidate {
					candidate = k.Episode
				}
			}
		} else {
			candidate = len(keys)
		}
		if candidate > maxWanted {
			maxWanted = candidate
		}
	}

	tx := app.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	label, err := ensureVideoLabelTx(tx, "Kodik", true)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if maxWanted > 0 && anime.Episodes < maxWanted {
		if err := tx.Model(&models.Anime{}).Where("id = ?", anime.ID).Update("episodes", maxWanted).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		anime.Episodes = maxWanted
	}

	// Load existing episodes + sources
	var existingEpisodes []models.Episode
	if err := tx.Preload("VideoSources").Where("anime_id = ?", animeID).Find(&existingEpisodes).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	episodeByNumber := map[int]*models.Episode{}
	for i := range existingEpisodes {
		ep := &existingEpisodes[i]
		episodeByNumber[ep.Number] = ep
	}

	// Map existing sources by (episode_id, voice_group_id)
	sourceByEpisodeVoice := map[string]*models.VideoSource{}
	for i := range existingEpisodes {
		ep := &existingEpisodes[i]
		for j := range ep.VideoSources {
			s := &ep.VideoSources[j]
			if s.LabelID == nil || *s.LabelID != label.ID {
				continue
			}
			if s.VoiceGroupID == nil {
				continue
			}
			key := fmt.Sprintf("%d:%d", ep.ID, *s.VoiceGroupID)
			sourceByEpisodeVoice[key] = s
		}
	}

	createdEpisodes := 0
	createdSources := 0
	updatedSources := 0
	maxEpisodeNumber := 0

	// Aggregate series per translation
	for idx := range resp.Results {
		item := resp.Results[idx]
		trTitle := strings.TrimSpace(item.Translation.Title)
		if trTitle == "" {
			continue
		}
		trType := strings.ToLower(strings.TrimSpace(item.Translation.Type))
		vgType := models.VoiceGroupTypeDub
		if trType == "subtitles" {
			vgType = models.VoiceGroupTypeSub
		}
		vg, err := ensureVoiceGroupTx(tx, trTitle, vgType)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Flatten seasons/episodes to a stable sequential ordering
		keys := make([]epKey, 0)
		seasonSet := map[int]struct{}{}
		for seasonStr, season := range item.Seasons {
			seasonNum, _ := strconv.Atoi(seasonStr)
			if seasonNum > 0 {
				seasonSet[seasonNum] = struct{}{}
			}
			for epStr := range season.Episodes {
				epNum, _ := strconv.Atoi(epStr)
				if seasonNum <= 0 || epNum <= 0 {
					continue
				}
				keys = append(keys, epKey{Season: seasonNum, Episode: epNum})
			}
		}
		sort.Slice(keys, func(i, j int) bool {
			if keys[i].Season != keys[j].Season {
				return keys[i].Season < keys[j].Season
			}
			return keys[i].Episode < keys[j].Episode
		})
		useEpisodeNumbers := false
		if len(seasonSet) == 1 {
			if _, ok := seasonSet[1]; ok {
				useEpisodeNumbers = true
			}
		}

		seq := 0
		for _, k := range keys {
			season := item.Seasons[strconv.Itoa(k.Season)]
			ep := season.Episodes[strconv.Itoa(k.Episode)]
			if strings.TrimSpace(ep.Link) == "" {
				continue
			}
			seq++
			number := seq
			if useEpisodeNumbers {
				number = k.Episode
			}
			if number > maxEpisodeNumber {
				maxEpisodeNumber = number
			}

			existing := episodeByNumber[number]
			if existing == nil {
				e := models.Episode{AnimeID: animeID, Number: number, Kind: "tv"}
				if err := tx.Create(&e).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
					return
				}
				createdEpisodes++
				existing = &e
				episodeByNumber[number] = existing
			}

			key := fmt.Sprintf("%d:%d", existing.ID, vg.ID)
			if s := sourceByEpisodeVoice[key]; s != nil {
				if mode == "sync" && s.URL != ep.Link {
					s.URL = ep.Link
					s.IsActive = true
					if err := tx.Save(s).Error; err != nil {
						tx.Rollback()
						c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
						return
					}
					updatedSources++
				}
				continue
			}

			audio := "dub"
			if vg.Type == models.VoiceGroupTypeSub {
				audio = "sub"
			}
			labelID := label.ID
			vgID := vg.ID
			src := models.VideoSource{
				EpisodeID:          existing.ID,
				URL:                ep.Link,
				IsActive:           true,
				IsDefault:          false,
				SortOrder:          0,
				Audio:              &audio,
				IsIntegratedPlayer: false,
				LabelID:            &labelID,
				Label:              label.Name,
				VoiceGroupID:       &vgID,
				Type:               models.VideoSourceTypeIframe,
			}

			if err := tx.Create(&src).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			createdSources++
			sourceByEpisodeVoice[key] = &src
		}
	}

	if maxEpisodeNumber > 0 && anime.Episodes < maxEpisodeNumber {
		if err := tx.Model(&models.Anime{}).Where("id = ?", anime.ID).Update("episodes", maxEpisodeNumber).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"mode":            mode,
		"created_episodes": createdEpisodes,
		"created_sources":  createdSources,
		"updated_sources":  updatedSources,
		"translations":     len(resp.Results),
	})
}

func ensureVideoLabelTx(tx *gorm.DB, name string, isExternal bool) (*models.VideoLabel, error) {
	var label models.VideoLabel
	err := tx.Where("name = ?", name).First(&label).Error
	if err == nil {
		return &label, nil
	}
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, err
	}
	label = models.VideoLabel{Name: name, IsExternalPlayer: isExternal}
	if err := tx.Create(&label).Error; err != nil {
		return nil, err
	}
	return &label, nil
}

func ensureVoiceGroupTx(tx *gorm.DB, name string, vgType models.VoiceGroupType) (*models.VoiceGroup, error) {
	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		return nil, fmt.Errorf("invalid voice group name")
	}
	var vg models.VoiceGroup
	err := tx.Where("name = ?", trimmed).First(&vg).Error
	if err == nil {
		if vg.Type == vgType {
			return &vg, nil
		}
		alt := fmt.Sprintf("%s (%s)", trimmed, string(vgType))
		return ensureVoiceGroupTx(tx, alt, vgType)
	}
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, err
	}
	vg = models.VoiceGroup{Name: trimmed, Type: vgType}
	if err := tx.Create(&vg).Error; err != nil {
		return nil, err
	}
	return &vg, nil
}

func kodikSearchByShikimoriID(shikiID int) (*kodikSearchResponse, error) {
	base := "https://kodik-api.com/search"
	q := url.Values{}
	q.Set("token", config.AppConfig.KODIK_API_KEY)
	q.Set("shikimori_id", strconv.Itoa(shikiID))
	q.Set("types", "anime-serial")
	q.Set("with_episodes_data", "true")
	q.Set("limit", "100")

	endpoint := base + "?" + q.Encode()
	client := &http.Client{Timeout: 25 * time.Second}
	tryOnce := func() (int, []byte, error) {
		req, err := http.NewRequest(http.MethodGet, endpoint, nil)
		if err != nil {
			return 0, nil, err
		}
		req.Header.Set("Accept", "application/json")
		req.Header.Set("User-Agent", "LycorisLib")
		resp, err := client.Do(req)
		if err != nil {
			return 0, nil, err
		}
		defer resp.Body.Close()
		b, err := io.ReadAll(resp.Body)
		if err != nil {
			return resp.StatusCode, nil, err
		}
		return resp.StatusCode, b, nil
	}

	var lastStatus int
	var lastBody []byte
	for attempt := 0; attempt < 3; attempt++ {
		status, body, err := tryOnce()
		if err != nil {
			return nil, fmt.Errorf("Kodik request failed")
		}
		lastStatus = status
		lastBody = body
		if status >= 200 && status < 300 {
			var out kodikSearchResponse
			if err := json.Unmarshal(body, &out); err != nil {
				return nil, fmt.Errorf("Invalid Kodik response")
			}
			return &out, nil
		}
		if status == 429 || status == 502 || status == 504 {
			time.Sleep(time.Duration(700+attempt*900) * time.Millisecond)
			continue
		}
		break
	}

	msg := "Kodik returned non-200"
	var parsed map[string]any
	if err := json.Unmarshal(lastBody, &parsed); err == nil {
		if s, ok := parsed["message"].(string); ok && strings.TrimSpace(s) != "" {
			msg = strings.TrimSpace(s)
		}
	}
	_ = lastStatus
	return nil, fmt.Errorf("%s", msg)
}
