package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
	"github.com/seva/animevista/internal/service"
	"gorm.io/gorm"
)

type jikanAnimeResp struct {
	Data struct {
		MalID         int64  `json:"mal_id"`
		Title         string `json:"title"`
		TitleEnglish  string `json:"title_english"`
		TitleJapanese string `json:"title_japanese"`
		Synopsis      string `json:"synopsis"`
		Type          string `json:"type"`
		Status        string `json:"status"`
		Source        string `json:"source"`
		Episodes      int    `json:"episodes"`
		Duration      string `json:"duration"`
		Rating        string `json:"rating"`
		Aired         struct {
			From *string `json:"from"`
		} `json:"aired"`
		Images struct {
			Webp struct {
				LargeImageURL string `json:"large_image_url"`
				ImageURL      string `json:"image_url"`
			} `json:"webp"`
			Jpg struct {
				LargeImageURL string `json:"large_image_url"`
				ImageURL      string `json:"image_url"`
			} `json:"jpg"`
		} `json:"images"`
		Trailer struct {
			Url string `json:"url"`
		} `json:"trailer"`
		Studios []struct {
			Name string `json:"name"`
		} `json:"studios"`
		Producers []struct {
			Name string `json:"name"`
		} `json:"producers"`
		Genres []struct {
			Name string `json:"name"`
		} `json:"genres"`
		Themes []struct {
			Name string `json:"name"`
		} `json:"themes"`
	} `json:"data"`
}

func mapJikanTypeToKind(v string) string {
	s := strings.ToLower(strings.TrimSpace(v))
	switch s {
	case "tv", "movie", "ova", "ona", "special":
		return s
	default:
		return "tv"
	}
}

func mapJikanStatusToInternal(v string) string {
	s := strings.ToLower(strings.TrimSpace(v))
	if strings.Contains(s, "finished") {
		return "released"
	}
	return "ongoing"
}

func mapJikanSourceToInternal(v string) string {
	s := strings.ToLower(strings.TrimSpace(v))
	if strings.Contains(s, "light") && strings.Contains(s, "novel") {
		return "light_novel"
	}
	if strings.Contains(s, "manga") {
		return "manga"
	}
	if s != "" {
		return "original"
	}
	return "original"
}

func mapJikanRatingToInternal(v string) string {
	s := strings.ToLower(strings.TrimSpace(v))
	if strings.Contains(s, "pg-13") {
		return "pg-13"
	}
	if strings.Contains(s, "r - 17") {
		return "r-17+"
	}
	if strings.Contains(s, "r+") {
		return "r+"
	}
	if strings.HasPrefix(s, "pg") {
		return "pg"
	}
	if strings.HasPrefix(s, "g") {
		return "g"
	}
	return ""
}

func pickJikanPoster(p jikanAnimeResp) string {
	if v := strings.TrimSpace(p.Data.Images.Webp.LargeImageURL); v != "" {
		return v
	}
	if v := strings.TrimSpace(p.Data.Images.Webp.ImageURL); v != "" {
		return v
	}
	if v := strings.TrimSpace(p.Data.Images.Jpg.LargeImageURL); v != "" {
		return v
	}
	return strings.TrimSpace(p.Data.Images.Jpg.ImageURL)
}

func parseJikanAiredDate(fromISO *string) *time.Time {
	if fromISO == nil {
		return nil
	}
	s := strings.TrimSpace(*fromISO)
	if s == "" {
		return nil
	}
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		v := t.UTC()
		return &v
	}
	return nil
}

func fetchJikanAnimeFull(ctx context.Context, malID int64) (jikanAnimeResp, error) {
	ctx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()
	url := "https://api.jikan.moe/v4/anime/" + strconv.FormatInt(malID, 10)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return jikanAnimeResp{}, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "LycorisLib-JikanHydrate")

	client := &http.Client{Timeout: 25 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return jikanAnimeResp{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == 429 || resp.StatusCode == 502 || resp.StatusCode == 503 || resp.StatusCode == 504 {
		time.Sleep(900 * time.Millisecond)
		return fetchJikanAnimeFull(ctx, malID)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return jikanAnimeResp{}, fmt.Errorf("jikan status=%d", resp.StatusCode)
	}
	var parsed jikanAnimeResp
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return jikanAnimeResp{}, err
	}
	if parsed.Data.MalID <= 0 {
		return jikanAnimeResp{}, errors.New("invalid jikan payload")
	}
	return parsed, nil
}

func upsertAnimeFromJikan(ctx context.Context, malID int64) (animeID int64, created bool, updated bool, err error) {
	if malID <= 0 {
		return 0, false, false, errors.New("invalid mal id")
	}

	var ruLang models.Language
	if err := app.DB.Where("code = ?", "ru").First(&ruLang).Error; err != nil {
		return 0, false, false, errors.New("missing RU language")
	}
	var enLang models.Language
	if err := app.DB.Where("code = ?", "en").First(&enLang).Error; err != nil {
		return 0, false, false, errors.New("missing EN language")
	}

	j, err := fetchJikanAnimeFull(ctx, malID)
	if err != nil {
		return 0, false, false, err
	}

	title := strings.TrimSpace(j.Data.Title)
	titleEn := strings.TrimSpace(j.Data.TitleEnglish)
	titleJp := strings.TrimSpace(j.Data.TitleJapanese)
	if title == "" {
		title = titleEn
	}
	if title == "" {
		return 0, false, false, errors.New("missing title")
	}

	posterURL := pickJikanPoster(j)
	trailerURL := strings.TrimSpace(j.Data.Trailer.Url)
	statusName := mapJikanStatusToInternal(j.Data.Status)
	kindName := mapJikanTypeToKind(j.Data.Type)
	sourceName := mapJikanSourceToInternal(j.Data.Source)
	ratingName := mapJikanRatingToInternal(j.Data.Rating)
	airedOn := parseJikanAiredDate(j.Data.Aired.From)

	_ = ensureKindOption(kindName)
	if ratingName != "" {
		_ = ensureRatingOption(ratingName)
	}

	statusID, err := ensureStatus(statusName, nil)
	if err != nil {
		return 0, false, false, err
	}
	sourceID, err := ensureSource(sourceName)
	if err != nil {
		return 0, false, false, err
	}

	studioID := 0
	if len(j.Data.Studios) > 0 {
		if name := strings.TrimSpace(j.Data.Studios[0].Name); name != "" {
			if id, err := ensureStudio(name); err == nil {
				studioID = id
			}
		}
	}
	producerIDs := make([]int, 0, len(j.Data.Producers))
	for _, p := range j.Data.Producers {
		if name := strings.TrimSpace(p.Name); name != "" {
			if id, err := ensureProducer(name); err == nil {
				producerIDs = append(producerIDs, id)
			}
		}
	}
	genreIDs := make([]int, 0, len(j.Data.Genres))
	for _, g := range j.Data.Genres {
		if name := strings.TrimSpace(g.Name); name != "" {
			if id, err := ensureGenre(name, nil); err == nil {
				genreIDs = append(genreIDs, id)
			}
		}
	}
	themeIDs := make([]int, 0, len(j.Data.Themes))
	for _, t := range j.Data.Themes {
		if name := strings.TrimSpace(t.Name); name != "" {
			if id, err := ensureTheme(name, nil); err == nil {
				themeIDs = append(themeIDs, id)
			}
		}
	}

	englishArr := []string{}
	if titleEn != "" {
		englishArr = append(englishArr, titleEn)
	}
	japaneseArr := []string{}
	if titleJp != "" {
		japaneseArr = append(japaneseArr, titleJp)
	}

	var existing models.Anime
	findErr := app.DB.Preload("Genres").Preload("Themes").Preload("Producers").Where("mal_id = ?", malID).First(&existing).Error
	if findErr != nil && !errors.Is(findErr, gorm.ErrRecordNotFound) {
		return 0, false, false, findErr
	}

	enTitle := title
	if titleEn != "" {
		enTitle = titleEn
	}
	enDesc := strings.TrimSpace(j.Data.Synopsis)
	if enDesc == "null" {
		enDesc = ""
	}
	alt := buildAltTitles(enTitle, title, "", englishArr, japaneseArr, nil)

	if errors.Is(findErr, gorm.ErrRecordNotFound) {
	baseURL := slugify(title)
	uniqueURL := uniqueAnimeURL(baseURL, 0)
	malIDInt := int(malID)
	create := models.Anime{
		Name:            title,
		URL:             uniqueURL,
		Kind:            kindName,
		Episodes:        j.Data.Episodes,
		AiredOn:         airedOn,
		StatusID:        func() *int { if statusID > 0 { v := statusID; return &v }; return nil }(),
		StudioID:        func() *int { if studioID > 0 { v := studioID; return &v }; return nil }(),
		SourceID:        func() *int { if sourceID > 0 { v := sourceID; return &v }; return nil }(),
		MALID:           &malIDInt,
		ShikiEnglish:    englishArr,
		ShikiJapanese:   japaneseArr,
		ShikiSynonyms:   []string{},
		ShikiFansubbers: []string{},
		ShikiFandubbers: []string{},
		ImageURL:        posterURL,
		BackgroundURL:   posterURL,
		TrailerURL:      trailerURL,
		Rating:          ratingName,
	}
	if err := app.DB.Create(&create).Error; err != nil {
		return 0, false, false, err
	}
	_ = app.DB.Create(&models.AnimeTranslation{AnimeID: create.ID, LanguageID: ruLang.ID, Title: "", Description: ""}).Error
	_ = app.DB.Create(&models.AnimeTranslation{AnimeID: create.ID, LanguageID: enLang.ID, Title: enTitle, Description: enDesc}).Error

	_ = app.DB.Transaction(func(tx *gorm.DB) error {
		if len(genreIDs) > 0 {
			_ = setAnimeGenresTx(tx, create.ID, genreIDs)
		}
		if len(themeIDs) > 0 {
			_ = setAnimeThemesTx(tx, create.ID, themeIDs)
		}
		if len(producerIDs) > 0 {
			_ = setAnimeProducersTx(tx, create.ID, producerIDs)
			first := producerIDs[0]
			_ = tx.Model(&models.Anime{}).Where("id = ?", create.ID).Update("producer_id", first).Error
		}
		if len(alt) > 0 {
			_ = replaceAnimeAltTitlesTx(tx, create.ID, alt)
		}
		return nil
	})

	return create.ID, true, false, nil
	}

	updates := map[string]any{}
	malIDInt := int(malID)
	if existing.MALID == nil {
		updates["mal_id"] = malIDInt
	}
	if strings.TrimSpace(existing.Kind) == "" {
		updates["kind"] = kindName
	}
	if existing.Episodes == 0 && j.Data.Episodes > 0 {
		updates["episodes"] = j.Data.Episodes
	}
	if existing.AiredOn == nil && airedOn != nil {
		updates["aired_on"] = *airedOn
	}
	if strings.TrimSpace(existing.ImageURL) == "" && posterURL != "" {
		updates["image"] = posterURL
		updates["background_url"] = posterURL
	}
	if strings.TrimSpace(existing.TrailerURL) == "" && trailerURL != "" {
		updates["trailer_url"] = trailerURL
	}
	if strings.TrimSpace(existing.Rating) == "" && ratingName != "" {
		updates["rating"] = ratingName
	}
	if existing.StatusID == nil && statusID > 0 {
		updates["status_id"] = statusID
	}
	if existing.SourceID == nil && sourceID > 0 {
		updates["source_id"] = sourceID
	}
	if existing.StudioID == nil && studioID > 0 {
		updates["studio_id"] = studioID
	}
	if len(englishArr) > 0 {
		updates["shiki_english"] = toJSON(englishArr)
	}
	if len(japaneseArr) > 0 {
		updates["shiki_japanese"] = toJSON(japaneseArr)
	}

	if len(updates) > 0 {
		if err := app.DB.Model(&models.Anime{}).Where("id = ?", existing.ID).Updates(updates).Error; err != nil {
			return 0, false, false, err
		}
		updated = true
	}
	_ = upsertAnimeTranslation(existing.ID, enLang.ID, enTitle, enDesc)
	_ = app.DB.Transaction(func(tx *gorm.DB) error {
		if len(existing.Genres) == 0 && len(genreIDs) > 0 {
			_ = setAnimeGenresTx(tx, existing.ID, genreIDs)
		}
		if len(existing.Themes) == 0 && len(themeIDs) > 0 {
			_ = setAnimeThemesTx(tx, existing.ID, themeIDs)
		}
		if len(existing.Producers) == 0 && len(producerIDs) > 0 {
			_ = setAnimeProducersTx(tx, existing.ID, producerIDs)
			if existing.ProducerID == nil {
				first := producerIDs[0]
				_ = tx.Model(&models.Anime{}).Where("id = ?", existing.ID).Update("producer_id", first).Error
			}
		}
		if len(alt) > 0 {
			_ = replaceAnimeAltTitlesTx(tx, existing.ID, alt)
		}
		return nil
	})

	return existing.ID, false, updated, nil
}

func SyncMALTopAnimeAndHydrate(ctx context.Context) error {
	if err := service.SyncMALTopAnime(ctx); err != nil {
		return err
	}
	var ids []int64
	if err := app.DB.Raw(`SELECT anime_id FROM mal_top_anime ORDER BY rank ASC`).Scan(&ids).Error; err != nil {
		return err
	}
	for _, id := range ids {
		_, _, _, _ = upsertAnimeFromJikan(ctx, id)
		time.Sleep(250 * time.Millisecond)
	}
	return nil
}
