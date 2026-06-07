package handlers

import (
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/config"
	"github.com/seva/animevista/internal/models"
	"gorm.io/gorm"
)

func derefStrSlice(p *[]string) []string {
	if p == nil {
		return []string{}
	}
	return *p
}

var slugNonAlnum = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(input string) string {
	s := strings.ToLower(input)
	s = slugNonAlnum.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	return s
}

func parseOptionalDate(value string) (*time.Time, error) {
	v := strings.TrimSpace(value)
	if v == "" {
		return nil, nil
	}
	if t, err := time.Parse("2006-01-02", v); err == nil {
		return &t, nil
	}
	if t, err := time.Parse(time.RFC3339, v); err == nil {
		return &t, nil
	} else {
		return nil, err
	}
}

type AdminMetaResponse struct {
	Genres    []models.Genre        `json:"genres"`
	Themes    []models.Theme        `json:"themes"`
	Producers []models.Producer     `json:"producers"`
	Studios   []models.Studio       `json:"studios"`
	Statuses  []models.Status       `json:"statuses"`
	Sources   []models.Source       `json:"sources"`
	Kinds     []models.KindOption   `json:"kinds"`
	Ratings   []models.RatingOption `json:"ratings"`
}

func AdminGetMeta(c *gin.Context) {
	var genres []models.Genre
	var themes []models.Theme
	var producers []models.Producer
	var studios []models.Studio
	var statuses []models.Status
	var sources []models.Source
	var kinds []models.KindOption
	var ratings []models.RatingOption

	app.DB.Find(&genres)
	app.DB.Find(&themes)
	app.DB.Find(&producers)
	app.DB.Find(&studios)
	app.DB.Find(&statuses)
	app.DB.Find(&sources)
	app.DB.Find(&kinds)
	app.DB.Find(&ratings)

	// Fetch translations for RU
	var ru models.Language
	if err := app.DB.Where("code = ?", "ru").First(&ru).Error; err == nil {
		var genreTrs []models.GenreTranslation
		app.DB.Where("language_id = ?", ru.ID).Find(&genreTrs)
		genreMap := make(map[int]models.GenreTranslation)
		for _, tr := range genreTrs {
			genreMap[tr.GenreID] = tr
		}
		for i := range genres {
			if tr, ok := genreMap[genres[i].ID]; ok {
				if tr.Name != "" {
					ruName := tr.Name
					genres[i].RUName = &ruName
				}
				genres[i].DescriptionRU = tr.Description
			}
		}

		var themeTrs []models.ThemeTranslation
		app.DB.Where("language_id = ?", ru.ID).Find(&themeTrs)
		themeMap := make(map[int]models.ThemeTranslation)
		for _, tr := range themeTrs {
			themeMap[tr.ThemeID] = tr
		}
		for i := range themes {
			if tr, ok := themeMap[themes[i].ID]; ok {
				if tr.Name != "" {
					ruName := tr.Name
					themes[i].RUName = &ruName
				}
				themes[i].DescriptionRU = tr.Description
			}
		}

		var studioTrs []models.StudioTranslation
		app.DB.Where("language_id = ?", ru.ID).Find(&studioTrs)
		studioMap := make(map[int]string)
		for _, tr := range studioTrs {
			studioMap[tr.StudioID] = tr.Name
		}
		for i := range studios {
			if ruName, ok := studioMap[studios[i].ID]; ok {
				studios[i].RUName = &ruName
			}
		}

		var statusTrs []models.StatusTranslation
		app.DB.Where("language_id = ?", ru.ID).Find(&statusTrs)
		statusMap := make(map[int]string)
		for _, tr := range statusTrs {
			statusMap[tr.StatusID] = tr.Name
		}
		for i := range statuses {
			if ruName, ok := statusMap[statuses[i].ID]; ok {
				statuses[i].RUName = &ruName
			}
		}

		var sourceTrs []models.SourceTranslation
		app.DB.Where("language_id = ?", ru.ID).Find(&sourceTrs)
		sourceMap := make(map[int]string)
		for _, tr := range sourceTrs {
			sourceMap[tr.SourceID] = tr.Name
		}
		for i := range sources {
			if ruName, ok := sourceMap[sources[i].ID]; ok {
				sources[i].RUName = &ruName
			}
		}
	}

	c.JSON(http.StatusOK, AdminMetaResponse{
		Genres:    genres,
		Themes:    themes,
		Producers: producers,
		Studios:   studios,
		Statuses:  statuses,
		Sources:   sources,
		Kinds:     kinds,
		Ratings:   ratings,
	})
}

type AdminCreateAnimeInput struct {
	URL             string    `json:"url"`
	Kind            string    `json:"kind"`
	Duration        int       `json:"duration"`
	Rating          string    `json:"rating"`
	EpisodesAired   int       `json:"episodes_aired"`
	AiredOn         string    `json:"aired_on"`
	ReleasedOn      string    `json:"released_on"`
	TrailerURL      string    `json:"trailer_url"`
	Score           float64   `json:"score"`
	Episodes        int       `json:"episodes"`
	PosterURL       string    `json:"poster_url"`
	BackgroundURL   string    `json:"background_url"`
	StudioID        *int      `json:"studio_id"`
	ProducerID      *int      `json:"producer_id"`
	ProducerIDs     []int     `json:"producer_ids"`
	StatusID        *int      `json:"status_id"`
	SourceID        *int      `json:"source_id"`
	ShikimoriID     *int      `json:"shikimori_id"`
	MALID           *int      `json:"mal_id"`
	WorldArtID      *int      `json:"worldart_id"`
	ShikiEnglish    *[]string `json:"shiki_english"`
	ShikiJapanese   *[]string `json:"shiki_japanese"`
	ShikiSynonyms   *[]string `json:"shiki_synonyms"`
	ShikiFansubbers *[]string `json:"shiki_fansubbers"`
	ShikiFandubbers *[]string `json:"shiki_fandubbers"`
	GenreIDs        []int     `json:"genre_ids"`
	ThemeIDs        []int     `json:"theme_ids"`
	TitleRU         string    `json:"title_ru" binding:"required"`
	TitleUK         string    `json:"title_uk"`
	TitleEN         string    `json:"title_en" binding:"required"`
	TitleENRomaji   string    `json:"title_en_romaji" binding:"required"`
	SeasonNumber    int       `json:"season_number" binding:"required"`
	FirstSeasonID   *int64    `json:"first_season_id"`
	DescriptionRU   string    `json:"description_ru"`
	DescriptionUK   string    `json:"description_uk"`
	DescriptionEN   string    `json:"description_en"`
	AltTitles       []string  `json:"alt_titles"`
	GalleryURLs     []string  `json:"gallery_urls"`
}

func AdminCreateAnime(c *gin.Context) {
	var input AdminCreateAnimeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := validateAnimeSeasonFields(input.SeasonNumber, input.FirstSeasonID, nil); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var ru, en models.Language
	if err := app.DB.Where("code = ?", "ru").First(&ru).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Missing RU language"})
		return
	}
	if err := app.DB.Where("code = ?", "en").First(&en).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Missing EN language"})
		return
	}
	var uk models.Language
	_ = app.DB.Where("code = ?", "uk").First(&uk).Error

	slug := slugify(input.TitleENRomaji)
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid title for slug generation"})
		return
	}

	var existing models.Anime
	if err := app.DB.Select("id", "url", "name").Where("url = ?", slug).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error":         "Anime already exists",
			"error_code":    "ANIME_EXISTS",
			"existing_id":   existing.ID,
			"existing_url":  existing.URL,
			"existing_name": existing.Name,
		})
		return
	}

	if input.ShikimoriID != nil {
		var ex models.Anime
		if err := app.DB.Select("id", "url", "name").Where("shikimori_id = ?", *input.ShikimoriID).First(&ex).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{
				"error":         "Anime already exists",
				"error_code":    "ANIME_EXISTS",
				"existing_id":   ex.ID,
				"existing_url":  ex.URL,
				"existing_name": ex.Name,
			})
			return
		}
	}
	if input.MALID != nil {
		var ex models.Anime
		if err := app.DB.Select("id", "url", "name").Where("mal_id = ?", *input.MALID).First(&ex).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{
				"error":         "Anime already exists",
				"error_code":    "ANIME_EXISTS",
				"existing_id":   ex.ID,
				"existing_url":  ex.URL,
				"existing_name": ex.Name,
			})
			return
		}
	}
	if input.WorldArtID != nil {
		var ex models.Anime
		if err := app.DB.Select("id", "url", "name").Where("worldart_id = ?", *input.WorldArtID).First(&ex).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{
				"error":         "Anime already exists",
				"error_code":    "ANIME_EXISTS",
				"existing_id":   ex.ID,
				"existing_url":  ex.URL,
				"existing_name": ex.Name,
			})
			return
		}
	}

	airedOn, err := parseOptionalDate(input.AiredOn)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid aired_on"})
		return
	}
	releasedOn, err := parseOptionalDate(input.ReleasedOn)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid released_on"})
		return
	}

	anime := models.Anime{
		SeasonNumber:    input.SeasonNumber,
		FirstSeasonID:   input.FirstSeasonID,
		Name:            input.TitleENRomaji,
		URL:             slug,
		Kind:            input.Kind,
		Duration:        input.Duration,
		Rating:          input.Rating,
		EpisodesAired:   input.EpisodesAired,
		AiredOn:         airedOn,
		ReleasedOn:      releasedOn,
		TrailerURL:      input.TrailerURL,
		Score:           input.Score,
		Episodes:        input.Episodes,
		StudioID:        input.StudioID,
		ProducerID:      input.ProducerID,
		StatusID:        input.StatusID,
		SourceID:        input.SourceID,
		ShikimoriID:     input.ShikimoriID,
		MALID:           input.MALID,
		WorldArtID:      input.WorldArtID,
		ShikiEnglish:    derefStrSlice(input.ShikiEnglish),
		ShikiJapanese:   derefStrSlice(input.ShikiJapanese),
		ShikiSynonyms:   derefStrSlice(input.ShikiSynonyms),
		ShikiFansubbers: derefStrSlice(input.ShikiFansubbers),
		ShikiFandubbers: derefStrSlice(input.ShikiFandubbers),
		ImageURL:        input.PosterURL,
		BackgroundURL:   input.BackgroundURL,
	}
	if strings.TrimSpace(anime.Kind) != "" {
		var k models.KindOption
		if err := app.DB.Where("name = ?", strings.TrimSpace(anime.Kind)).First(&k).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown kind (add it in Kinds & Ratings)"})
			return
		}
	}
	if strings.TrimSpace(anime.Rating) != "" {
		var r models.RatingOption
		if err := app.DB.Where("name = ?", strings.TrimSpace(anime.Rating)).First(&r).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown rating (add it in Kinds & Ratings)"})
			return
		}
	}
	if anime.TrailerURL == "" {
		anime.TrailerURL = "https://www.youtube.com/watch?v=I1Pk4UUJQg4"
	}
	if input.Episodes > 0 && input.EpisodesAired > input.Episodes {
		c.JSON(http.StatusBadRequest, gin.H{"error": "episodes_aired cannot exceed episodes"})
		return
	}

	if err := app.DB.Create(&anime).Error; err != nil {
		log.Printf("admin: create anime failed: %v", err)
		payload := gin.H{"error": "Failed to create anime"}
		if !config.AppConfig.IS_PRODUCTION {
			payload["details"] = err.Error()
		}
		c.JSON(http.StatusBadRequest, payload)
		return
	}
	if err := replaceAnimeAltTitlesTx(app.DB, anime.ID, input.AltTitles); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := replaceAnimeGalleryImagesTx(app.DB, anime.ID, input.GalleryURLs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	producerIDs := input.ProducerIDs
	if len(producerIDs) == 0 && input.ProducerID != nil {
		producerIDs = []int{*input.ProducerID}
	}
	if len(producerIDs) > 0 {
		var producers []models.Producer
		if err := app.DB.Where("id IN ?", producerIDs).Find(&producers).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := setAnimeProducers(anime.ID, producerIDs); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if anime.ProducerID == nil {
			first := producerIDs[0]
			anime.ProducerID = &first
			_ = app.DB.Model(&models.Anime{}).Where("id = ?", anime.ID).Update("producer_id", first).Error
		}
	}

	if len(input.GenreIDs) > 0 {
		var genres []models.Genre
		if err := app.DB.Where("id IN ?", input.GenreIDs).Find(&genres).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := setAnimeGenres(anime.ID, input.GenreIDs); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	if len(input.ThemeIDs) > 0 {
		var themes []models.Theme
		if err := app.DB.Where("id IN ?", input.ThemeIDs).Find(&themes).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := setAnimeThemes(anime.ID, input.ThemeIDs); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	_ = app.DB.Create(&models.AnimeTranslation{
		AnimeID:     anime.ID,
		LanguageID:  ru.ID,
		Title:       input.TitleRU,
		Description: input.DescriptionRU,
	}).Error
	ukTitle := strings.TrimSpace(input.TitleUK)
	ukDesc := strings.TrimSpace(input.DescriptionUK)
	if (ukTitle != "" || ukDesc != "") && uk.ID != 0 {
		if ukTitle == "" {
			ukTitle = input.TitleRU
		}
		_ = app.DB.Create(&models.AnimeTranslation{
			AnimeID:     anime.ID,
			LanguageID:  uk.ID,
			Title:       ukTitle,
			Description: ukDesc,
		}).Error
	}
	_ = app.DB.Create(&models.AnimeTranslation{
		AnimeID:     anime.ID,
		LanguageID:  en.ID,
		Title:       input.TitleEN,
		Description: input.DescriptionEN,
	}).Error

	var created models.Anime
	_ = app.DB.Preload("Studio").Preload("Producer").Preload("Producers").Preload("Status").Preload("Source").Preload("Genres").Preload("Themes").Preload("Translations.Language").Preload("AltTitles").
		Preload("GalleryImages", func(db *gorm.DB) *gorm.DB { return db.Order("sort_order asc, id asc") }).
		First(&created, anime.ID).Error

	c.JSON(http.StatusCreated, created)
}

type AdminUpdateAnimeInput struct {
	Kind            string    `json:"kind"`
	Duration        int       `json:"duration"`
	Rating          string    `json:"rating"`
	EpisodesAired   int       `json:"episodes_aired"`
	AiredOn         string    `json:"aired_on"`
	ReleasedOn      string    `json:"released_on"`
	TrailerURL      string    `json:"trailer_url"`
	Score           float64   `json:"score"`
	Episodes        int       `json:"episodes"`
	PosterURL       string    `json:"poster_url"`
	BackgroundURL   string    `json:"background_url"`
	StudioID        *int      `json:"studio_id"`
	ProducerID      *int      `json:"producer_id"`
	ProducerIDs     []int     `json:"producer_ids"`
	StatusID        *int      `json:"status_id"`
	SourceID        *int      `json:"source_id"`
	ShikimoriID     *int      `json:"shikimori_id"`
	MALID           *int      `json:"mal_id"`
	WorldArtID      *int      `json:"worldart_id"`
	ShikiEnglish    *[]string `json:"shiki_english"`
	ShikiJapanese   *[]string `json:"shiki_japanese"`
	ShikiSynonyms   *[]string `json:"shiki_synonyms"`
	ShikiFansubbers *[]string `json:"shiki_fansubbers"`
	ShikiFandubbers *[]string `json:"shiki_fandubbers"`
	GenreIDs        []int     `json:"genre_ids"`
	ThemeIDs        []int     `json:"theme_ids"`
	TitleRU         string    `json:"title_ru" binding:"required"`
	TitleUK         string    `json:"title_uk"`
	TitleEN         string    `json:"title_en" binding:"required"`
	TitleENRomaji   string    `json:"title_en_romaji" binding:"required"`
	SeasonNumber    int       `json:"season_number" binding:"required"`
	FirstSeasonID   *int64    `json:"first_season_id"`
	DescriptionRU   string    `json:"description_ru"`
	DescriptionUK   string    `json:"description_uk"`
	DescriptionEN   string    `json:"description_en"`
	AltTitles       []string  `json:"alt_titles"`
	GalleryURLs     []string  `json:"gallery_urls"`
}

func AdminUpdateAnime(c *gin.Context) {
	id := c.Param("id")

	var input AdminUpdateAnimeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	animeID, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := validateAnimeSeasonFields(input.SeasonNumber, input.FirstSeasonID, &animeID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var anime models.Anime
	if err := app.DB.First(&anime, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Anime not found"})
		return
	}

	var ru, en models.Language
	if err := app.DB.Where("code = ?", "ru").First(&ru).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Missing RU language"})
		return
	}
	if err := app.DB.Where("code = ?", "en").First(&en).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Missing EN language"})
		return
	}
	var uk models.Language
	_ = app.DB.Where("code = ?", "uk").First(&uk).Error

	slug := slugify(input.TitleENRomaji)
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid title for slug generation"})
		return
	}

	var exists int64
	_ = app.DB.Model(&models.Anime{}).Where("url = ? AND id <> ?", slug, anime.ID).Count(&exists)
	if exists > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Slug already exists"})
		return
	}

	airedOn, err := parseOptionalDate(input.AiredOn)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid aired_on"})
		return
	}
	releasedOn, err := parseOptionalDate(input.ReleasedOn)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid released_on"})
		return
	}

	anime.Name = input.TitleENRomaji
	anime.URL = slug
	anime.Kind = input.Kind
	anime.Duration = input.Duration
	anime.Rating = input.Rating
	if strings.TrimSpace(anime.Kind) != "" {
		var k models.KindOption
		if err := app.DB.Where("name = ?", strings.TrimSpace(anime.Kind)).First(&k).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown kind (add it in Kinds & Ratings)"})
			return
		}
	}
	if strings.TrimSpace(anime.Rating) != "" {
		var r models.RatingOption
		if err := app.DB.Where("name = ?", strings.TrimSpace(anime.Rating)).First(&r).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown rating (add it in Kinds & Ratings)"})
			return
		}
	}
	anime.EpisodesAired = input.EpisodesAired
	anime.AiredOn = airedOn
	anime.ReleasedOn = releasedOn
	anime.TrailerURL = input.TrailerURL
	if anime.TrailerURL == "" {
		anime.TrailerURL = "https://www.youtube.com/watch?v=I1Pk4UUJQg4"
	}
	if input.Episodes > 0 && input.EpisodesAired > input.Episodes {
		c.JSON(http.StatusBadRequest, gin.H{"error": "episodes_aired cannot exceed episodes"})
		return
	}
	anime.Score = input.Score
	anime.SeasonNumber = input.SeasonNumber
	anime.FirstSeasonID = input.FirstSeasonID
	anime.Episodes = input.Episodes
	anime.StudioID = input.StudioID
	anime.ProducerID = input.ProducerID
	anime.StatusID = input.StatusID
	anime.SourceID = input.SourceID
	anime.ShikimoriID = input.ShikimoriID
	anime.MALID = input.MALID
	anime.WorldArtID = input.WorldArtID
	if input.ShikiEnglish != nil {
		anime.ShikiEnglish = *input.ShikiEnglish
	}
	if input.ShikiJapanese != nil {
		anime.ShikiJapanese = *input.ShikiJapanese
	}
	if input.ShikiSynonyms != nil {
		anime.ShikiSynonyms = *input.ShikiSynonyms
	}
	if input.ShikiFansubbers != nil {
		anime.ShikiFansubbers = *input.ShikiFansubbers
	}
	if input.ShikiFandubbers != nil {
		anime.ShikiFandubbers = *input.ShikiFandubbers
	}

	anime.ImageURL = input.PosterURL
	anime.BackgroundURL = input.BackgroundURL

	tx := app.DB.Begin()
	if err := tx.Save(&anime).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := replaceAnimeAltTitlesTx(tx, anime.ID, input.AltTitles); err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := replaceAnimeGalleryImagesTx(tx, anime.ID, input.GalleryURLs); err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	producerIDs := input.ProducerIDs
	if len(producerIDs) == 0 && input.ProducerID != nil {
		producerIDs = []int{*input.ProducerID}
	}
	if len(producerIDs) > 0 {
		var producers []models.Producer
		if err := tx.Where("id IN ?", producerIDs).Find(&producers).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := setAnimeProducersTx(tx, anime.ID, producerIDs); err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		first := producerIDs[0]
		anime.ProducerID = &first
		_ = tx.Model(&models.Anime{}).Where("id = ?", anime.ID).Update("producer_id", first).Error
	}

	if len(input.GenreIDs) > 0 {
		var genres []models.Genre
		if err := tx.Where("id IN ?", input.GenreIDs).Find(&genres).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := setAnimeGenresTx(tx, anime.ID, input.GenreIDs); err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	} else {
		if err := setAnimeGenresTx(tx, anime.ID, []int{}); err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	if len(input.ThemeIDs) > 0 {
		var themes []models.Theme
		if err := tx.Where("id IN ?", input.ThemeIDs).Find(&themes).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := setAnimeThemesTx(tx, anime.ID, input.ThemeIDs); err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	} else {
		if err := setAnimeThemesTx(tx, anime.ID, []int{}); err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	var tRU models.AnimeTranslation
	_ = tx.Where("anime_id = ? AND language_id = ?", anime.ID, ru.ID).
		FirstOrCreate(&tRU, models.AnimeTranslation{AnimeID: anime.ID, LanguageID: ru.ID})
	tRU.Title = input.TitleRU
	tRU.Description = input.DescriptionRU
	if err := tx.Save(&tRU).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ukTitle := strings.TrimSpace(input.TitleUK)
	ukDesc := strings.TrimSpace(input.DescriptionUK)
	if uk.ID != 0 {
		if ukTitle == "" && ukDesc == "" {
			_ = tx.Where("anime_id = ? AND language_id = ?", anime.ID, uk.ID).Delete(&models.AnimeTranslation{}).Error
		} else {
			var tUK models.AnimeTranslation
			_ = tx.Where("anime_id = ? AND language_id = ?", anime.ID, uk.ID).
				FirstOrCreate(&tUK, models.AnimeTranslation{AnimeID: anime.ID, LanguageID: uk.ID})
			if ukTitle == "" {
				if strings.TrimSpace(tUK.Title) == "" {
					ukTitle = input.TitleRU
				} else {
					ukTitle = tUK.Title
				}
			}
			tUK.Title = ukTitle
			tUK.Description = ukDesc
			if err := tx.Save(&tUK).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
		}
	}

	var tEN models.AnimeTranslation
	_ = tx.Where("anime_id = ? AND language_id = ?", anime.ID, en.ID).
		FirstOrCreate(&tEN, models.AnimeTranslation{AnimeID: anime.ID, LanguageID: en.ID})
	tEN.Title = input.TitleEN
	tEN.Description = input.DescriptionEN
	if err := tx.Save(&tEN).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var updated models.Anime
	_ = app.DB.Preload("Studio").Preload("Producer").Preload("Producers").Preload("Status").Preload("Source").Preload("Genres").Preload("Themes").Preload("Translations.Language").Preload("AltTitles").
		Preload("GalleryImages", func(db *gorm.DB) *gorm.DB { return db.Order("sort_order asc, id asc") }).
		First(&updated, anime.ID).Error
	c.JSON(http.StatusOK, updated)
}

func AdminDeleteAnime(c *gin.Context) {
	id := c.Param("id")

	var anime models.Anime
	if err := app.DB.First(&anime, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Anime not found"})
		return
	}

	tx := app.DB.Begin()
	_ = tx.Where("anime_id = ?", anime.ID).Delete(&models.AnimeTranslation{}).Error
	_ = tx.Where("anime_id = ?", anime.ID).Delete(&models.UserCollection{}).Error
	_ = setAnimeGenresTx(tx, anime.ID, []int{})
	_ = setAnimeThemesTx(tx, anime.ID, []int{})
	if err := tx.Delete(&anime).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete anime"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete anime"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}
