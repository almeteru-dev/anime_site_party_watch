package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
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

type moonanimeImportRequest struct {
	Mode string `json:"mode"`
}

type moonanimeRecentResponse struct {
	Status string                  `json:"status"`
	Data   []moonanimeEpisodeEntry `json:"data"`
	Pagination moonanimePagination `json:"pagination"`
}

type moonanimePagination struct {
	CurrentPage  int  `json:"current_page"`
	TotalPages   int  `json:"total_pages"`
	TotalItems   int  `json:"total_items"`
	PerPage      int  `json:"per_page"`
	HasNext      bool `json:"has_next"`
	HasPrevious  bool `json:"has_previous"`
	NextPage     *int `json:"next_page"`
	PreviousPage *int `json:"previous_page"`
}

type moonanimeEpisodeEntry struct {
	VideoID int64  `json:"video_id"`
	Slug    string `json:"slug"`
	URL     struct {
		Iframe string `json:"iframe"`
		Vod    string `json:"vod"`
	} `json:"url"`
	Episode int    `json:"episode"`
	Season  int    `json:"season"`
	Studio  string `json:"studio"`
	SelectedType string `json:"selected_type"`
	MalID   int    `json:"mal_id"`
}

type moonanimeImportStats struct {
	Mode            string `json:"mode"`
	CreatedEpisodes int    `json:"created_episodes"`
	CreatedSources  int    `json:"created_sources"`
	UpdatedSources  int    `json:"updated_sources"`
	TotalItems      int    `json:"total_items"`
}

func AdminMoonanimeImportEpisodes(c *gin.Context) {
	idStr := strings.TrimSpace(c.Param("id"))
	if idStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing anime id"})
		return
	}
	animeID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || animeID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid anime id"})
		return
	}

	var body moonanimeImportRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		body.Mode = "sync"
	}
	mode := strings.ToLower(strings.TrimSpace(body.Mode))
	if mode != "add" && mode != "sync" {
		mode = "sync"
	}

	stats, err := moonanimeImportEpisodesForAnime(c.Request.Context(), animeID, mode)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	msg := fmt.Sprintf("Moonanime import done: mode=%s, episodes +%d, sources +%d, updated %d, total %d", stats.Mode, stats.CreatedEpisodes, stats.CreatedSources, stats.UpdatedSources, stats.TotalItems)
	c.JSON(http.StatusOK, gin.H{"message": msg, "stats": stats})
}

func moonanimeImportEpisodesForAnime(ctx context.Context, animeID int64, mode string) (moonanimeImportStats, error) {
	apiKey := strings.TrimSpace(config.AppConfig.MOONANIME_API_KEY)
	if apiKey == "" {
		return moonanimeImportStats{}, fmt.Errorf("MOONANIME_API_KEY is not set")
	}

	var anime models.Anime
	if err := app.DB.Where("id = ?", animeID).First(&anime).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return moonanimeImportStats{}, fmt.Errorf("anime not found")
		}
		return moonanimeImportStats{}, err
	}
	if anime.MALID == nil || *anime.MALID <= 0 {
		return moonanimeImportStats{}, fmt.Errorf("anime has no mal_id")
	}

	wantEpisodes := anime.Episodes
	if wantEpisodes <= 0 {
		wantEpisodes = 2500
	}
	entries, err := fetchMoonanimeRecentEpisodesAll(ctx, apiKey, *anime.MALID, wantEpisodes)
	if err != nil {
		return moonanimeImportStats{}, err
	}
	if len(entries) == 0 {
		return moonanimeImportStats{Mode: mode, TotalItems: 0}, nil
	}

	sort.Slice(entries, func(i, j int) bool {
		if entries[i].Season != entries[j].Season {
			return entries[i].Season < entries[j].Season
		}
		return entries[i].Episode < entries[j].Episode
	})

	tx := app.DB.Begin()
	if tx.Error != nil {
		return moonanimeImportStats{}, tx.Error
	}

	label, err := ensureVideoLabelTx(tx, "Moonanime", true)
	if err != nil {
		tx.Rollback()
		return moonanimeImportStats{}, err
	}

	var existingEpisodes []models.Episode
	if err := tx.Where("anime_id = ?", animeID).Find(&existingEpisodes).Error; err != nil {
		tx.Rollback()
		return moonanimeImportStats{}, err
	}
	episodeByNumber := make(map[int]*models.Episode, len(existingEpisodes))
	for i := range existingEpisodes {
		e := &existingEpisodes[i]
		episodeByNumber[e.Number] = e
	}

	var existingSources []models.VideoSource
	if err := tx.Where("label_id = ?", label.ID).Find(&existingSources).Error; err != nil {
		tx.Rollback()
		return moonanimeImportStats{}, err
	}
	sourceByEpisodeVoice := make(map[string]*models.VideoSource, len(existingSources))
	for i := range existingSources {
		s := &existingSources[i]
		if s.VoiceGroupID == nil {
			continue
		}
		key := fmt.Sprintf("%d:%d", s.EpisodeID, *s.VoiceGroupID)
		sourceByEpisodeVoice[key] = s
	}

	createdEpisodes := 0
	createdSources := 0
	updatedSources := 0
	maxEpisodeNumber := anime.Episodes

	for _, it := range entries {
		if it.Episode <= 0 {
			continue
		}
		iframe := strings.Trim(strings.TrimSpace(it.URL.Iframe), "` ")
		vod := strings.Trim(strings.TrimSpace(it.URL.Vod), "` ")
		if iframe == "" {
			continue
		}
		name := strings.TrimSpace(it.Studio)
		if name == "" {
			name = "Moonanime"
		}
		vgType := models.VoiceGroupTypeDub
		switch strings.ToLower(strings.TrimSpace(it.SelectedType)) {
		case "sub", "subbed", "subs", "subtitle", "subtitles":
			vgType = models.VoiceGroupTypeSub
		}
		vg, err := ensureVoiceGroupTx(tx, name, vgType)
		if err != nil {
			tx.Rollback()
			return moonanimeImportStats{}, err
		}

		number := it.Episode
		if number > maxEpisodeNumber {
			maxEpisodeNumber = number
		}
		existing := episodeByNumber[number]
		if existing == nil {
			e := models.Episode{AnimeID: animeID, Number: number, Kind: "tv"}
			if err := tx.Create(&e).Error; err != nil {
				tx.Rollback()
				return moonanimeImportStats{}, err
			}
			createdEpisodes++
			existing = &e
			episodeByNumber[number] = existing
		}

		key := fmt.Sprintf("%d:%d", existing.ID, vg.ID)
		if s := sourceByEpisodeVoice[key]; s != nil {
			if mode == "sync" {
				needSave := false
				if s.URL != iframe {
					s.URL = iframe
					needSave = true
				}
				if !s.IsActive {
					s.IsActive = true
					needSave = true
				}
				if vod != "" {
					if s.VodURL == nil || *s.VodURL != vod {
						s.VodURL = &vod
						needSave = true
					}
				}
				if needSave {
					if err := tx.Save(s).Error; err != nil {
						tx.Rollback()
						return moonanimeImportStats{}, err
					}
					updatedSources++
				}
			}
			continue
		}

		labelID := label.ID
		vgID := vg.ID
		audio := "dub"
		if vg.Type == models.VoiceGroupTypeSub {
			audio = "sub"
		}
		src := models.VideoSource{
			EpisodeID:          existing.ID,
			URL:                iframe,
			VodURL:             nil,
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
		if vod != "" {
			src.VodURL = &vod
		}
		if err := tx.Create(&src).Error; err != nil {
			tx.Rollback()
			return moonanimeImportStats{}, err
		}
		createdSources++
		sourceByEpisodeVoice[key] = &src
	}

	if maxEpisodeNumber > 0 && anime.Episodes < maxEpisodeNumber {
		if err := tx.Model(&models.Anime{}).Where("id = ?", anime.ID).Update("episodes", maxEpisodeNumber).Error; err != nil {
			tx.Rollback()
			return moonanimeImportStats{}, err
		}
	}

	if err := tx.Commit().Error; err != nil {
		return moonanimeImportStats{}, err
	}

	return moonanimeImportStats{
		Mode:            mode,
		CreatedEpisodes: createdEpisodes,
		CreatedSources:  createdSources,
		UpdatedSources:  updatedSources,
		TotalItems:      len(entries),
	}, nil
}

func fetchMoonanimeRecentEpisodesAll(ctx context.Context, apiKey string, malID int, wantEpisodes int) ([]moonanimeEpisodeEntry, error) {
	client := &http.Client{Timeout: 20 * time.Second}
	baseURL := "https://api.moonanime.art/api/7.0"
	return fetchMoonanimeRecentEpisodesAllWith(ctx, client, baseURL, apiKey, malID, wantEpisodes)
}

func fetchMoonanimeRecentEpisodesAllWith(ctx context.Context, client *http.Client, baseURL string, apiKey string, malID int, wantEpisodes int) ([]moonanimeEpisodeEntry, error) {
	pageSize := 100
	if wantEpisodes <= 0 {
		wantEpisodes = 2500
	}

	byKey := map[string]moonanimeEpisodeEntry{}
	ordered := make([]moonanimeEpisodeEntry, 0, wantEpisodes)

	page := 1
	for {
		items, pagination, err := fetchMoonanimeRecentEpisodesPageWith(ctx, client, baseURL, apiKey, malID, pageSize, page)
		if err != nil {
			return nil, err
		}
		if len(items) == 0 {
			break
		}
		for _, it := range items {
			key := moonanimeEntryKey(it)
			if _, ok := byKey[key]; ok {
				continue
			}
			byKey[key] = it
			ordered = append(ordered, it)
		}
		if len(ordered) >= wantEpisodes {
			break
		}
		next := pagination.NextPage
		if next == nil {
			break
		}
		page = *next
	}

	return ordered, nil
}

func moonanimeEntryKey(it moonanimeEpisodeEntry) string {
	if it.VideoID > 0 {
		return fmt.Sprintf("vid:%d", it.VideoID)
	}
	return fmt.Sprintf("%d:%d:%d:%s:%s:%s", it.MalID, it.Season, it.Episode, strings.ToLower(strings.TrimSpace(it.Studio)), strings.ToLower(strings.TrimSpace(it.SelectedType)), strings.ToLower(strings.TrimSpace(it.Slug)))
}

func fetchMoonanimeRecentEpisodesPageWith(ctx context.Context, client *http.Client, baseURL string, apiKey string, malID int, limit int, page int) ([]moonanimeEpisodeEntry, moonanimePagination, error) {
	qLimit := limit
	if qLimit <= 0 {
		qLimit = 100
	}
	if qLimit > 100 {
		qLimit = 100
	}
	if page <= 0 {
		page = 1
	}
	url := fmt.Sprintf("%s/episodes/recent?api_key=%s&mal_id=%d&limit=%d&page=%d", strings.TrimRight(baseURL, "/"), apiKey, malID, qLimit, page)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, moonanimePagination{}, err
	}

	var lastStatus int
	var lastBody []byte
	for attempt := 0; attempt < 3; attempt++ {
		resp, err := client.Do(req)
		if err != nil {
			return nil, moonanimePagination{}, err
		}
		b, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			return nil, moonanimePagination{}, err
		}
		lastStatus = resp.StatusCode
		lastBody = b
		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			var parsed moonanimeRecentResponse
			if err := json.Unmarshal(b, &parsed); err != nil {
				return nil, moonanimePagination{}, err
			}
			if strings.ToLower(strings.TrimSpace(parsed.Status)) != "success" {
				return nil, moonanimePagination{}, fmt.Errorf("moonanime api status: %s", parsed.Status)
			}
			return parsed.Data, parsed.Pagination, nil
		}
		if resp.StatusCode == 429 || resp.StatusCode == 502 || resp.StatusCode == 504 {
			time.Sleep(time.Duration(600+attempt*900) * time.Millisecond)
			continue
		}
		break
	}
	return nil, moonanimePagination{}, fmt.Errorf("moonanime api error: status=%d: %s", lastStatus, strings.TrimSpace(string(lastBody)))
}
