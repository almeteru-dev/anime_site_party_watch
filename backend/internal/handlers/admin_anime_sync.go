package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var scheduleSyncMu sync.Mutex
var scheduleSyncRunning bool
var scheduleSyncStartedAt time.Time
var scheduleSyncFinishedAt time.Time
var scheduleSyncLast syncResult

type shikiAnimeFull struct {
	ID           int   `json:"id"`
	MALID        *int  `json:"mal_id"`
	MyAnimeListID *int `json:"myanimelist_id"`
	Name         string `json:"name"`
	Russian      string `json:"russian"`
	Kind         string `json:"kind"`
	Status       string `json:"status"`
	Episodes     int    `json:"episodes"`
	EpisodesAired int   `json:"episodes_aired"`
	Duration     int    `json:"duration"`
	Score        string `json:"score"`
	AiredOn      *string `json:"aired_on"`
	ReleasedOn   *string `json:"released_on"`
	Rating       string  `json:"rating"`
	Description  string  `json:"description"`
	English      []string `json:"english"`
	Japanese     []string `json:"japanese"`
	Synonyms     []string `json:"synonyms"`
	Fansubbers   []string `json:"fansubbers"`
	Fandubbers   []string `json:"fandubbers"`
	Studios      []struct {
		Name string `json:"name"`
	} `json:"studios"`
	Genres []struct {
		Name    string `json:"name"`
		Russian string `json:"russian"`
		Kind    string `json:"kind"`
	} `json:"genres"`
	Videos []struct {
		Kind      string `json:"kind"`
		PlayerURL string `json:"player_url"`
	} `json:"videos"`
	Image        struct {
		Original string `json:"original"`
		Preview  string `json:"preview"`
	} `json:"image"`
}

type syncResult struct {
	Processed          int      `json:"processed"`
	CreatedAnime       int      `json:"created_anime"`
	UpdatedAnime       int      `json:"updated_anime"`
	InsertedSchedules  int      `json:"inserted_schedules"`
	UpdatedSchedules   int      `json:"updated_schedules"`
	SkippedNoBroadcast int      `json:"skipped_no_broadcast"`
	SkippedPast        int      `json:"skipped_past"`
	Errors             []string `json:"errors"`
}

type shikiCalendarItem struct {
	NextEpisode   int    `json:"next_episode"`
	NextEpisodeAt string `json:"next_episode_at"`
	Duration      int    `json:"duration"`
	Anime         struct {
		ID int `json:"id"`
	} `json:"anime"`
}

type jikanEnrichment struct {
	Synopsis  string
	Source    string
	Producers []string
	Themes    []string
	PosterURL string
	TrailerURL string
	TitleEnglish string
}

func AdminAnimeSyncSchedule(c *gin.Context) {
	scheduleSyncMu.Lock()
	if scheduleSyncRunning {
		startedAt := scheduleSyncStartedAt
		finishedAt := scheduleSyncFinishedAt
		last := scheduleSyncLast
		scheduleSyncMu.Unlock()
		c.JSON(http.StatusOK, gin.H{
			"status":       "running",
			"started_at":   startedAt,
			"finished_at":  finishedAt,
			"last_result":  last,
		})
		return
	}
	scheduleSyncRunning = true
	scheduleSyncStartedAt = time.Now().UTC()
	scheduleSyncFinishedAt = time.Time{}
	scheduleSyncMu.Unlock()

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 20*time.Minute)
		defer cancel()
		res := SyncScheduleFromJikanAndShikimori(ctx)
		scheduleSyncMu.Lock()
		scheduleSyncLast = res
		scheduleSyncFinishedAt = time.Now().UTC()
		scheduleSyncRunning = false
		scheduleSyncMu.Unlock()
	}()

	c.JSON(http.StatusAccepted, gin.H{"status": "started", "started_at": scheduleSyncStartedAt})
}

func AdminAnimeSyncStatus(c *gin.Context) {
	scheduleSyncMu.Lock()
	running := scheduleSyncRunning
	startedAt := scheduleSyncStartedAt
	finishedAt := scheduleSyncFinishedAt
	last := scheduleSyncLast
	scheduleSyncMu.Unlock()
	c.JSON(http.StatusOK, gin.H{
		"status":       func() string { if running { return "running" }; if startedAt.IsZero() { return "idle" }; return "finished" }(),
		"started_at":   startedAt,
		"finished_at":  finishedAt,
		"last_result":  last,
	})
}

func SyncScheduleFromJikanAndShikimori(ctx context.Context) syncResult {
	start := time.Now()
	log.Printf("schedule-sync: start")
	defer func() {
		log.Printf("schedule-sync: done in %s", time.Since(start))
	}()

	return SyncScheduleFromShikimoriCalendar(ctx)
}

func SyncScheduleFromShikimoriCalendar(ctx context.Context) syncResult {
	rootTzName := getRootAdminTimezone()
	rootLoc, err := time.LoadLocation(rootTzName)
	if err != nil {
		log.Printf("schedule-sync: invalid root timezone %q: %v", rootTzName, err)
		rootLoc = time.UTC
	}

	items, fetchErr := fetchShikimoriCalendar(ctx)
	res := syncResult{}
	if fetchErr != nil {
		errStr := fmt.Sprintf("shikimori calendar fetch failed: %v", fetchErr)
		log.Printf("schedule-sync: %s", errStr)
		res.Errors = append(res.Errors, errStr)
		return res
	}

	client := &http.Client{Timeout: 18 * time.Second}
	userAgent := fmt.Sprintf("LycorisLib-ScheduleSync/%d", time.Now().Unix())

	nowRoot := time.Now().In(rootLoc)
	todayRootStart := time.Date(nowRoot.Year(), nowRoot.Month(), nowRoot.Day(), 0, 0, 0, 0, rootLoc)
	todayRootStartUTC := todayRootStart.UTC()

	for _, it := range items {
		select {
		case <-ctx.Done():
			res.Errors = append(res.Errors, "sync cancelled")
			return res
		default:
		}

		res.Processed++
		if it.Anime.ID <= 0 {
			continue
		}
		if it.NextEpisode <= 0 || strings.TrimSpace(it.NextEpisodeAt) == "" {
			res.SkippedNoBroadcast++
			continue
		}

		shikiFull, malID, enrich, err := fetchShikiAnimeWithJikanEnrichment(ctx, client, it.Anime.ID, userAgent)
		if err != nil {
			res.Errors = append(res.Errors, fmt.Sprintf("shiki_id=%d: shikimori: %v", it.Anime.ID, err))
			continue
		}

		animeID, created, updated, err := upsertAnimeFromShiki(shikiFull, malID, enrich)
		if err != nil {
			res.Errors = append(res.Errors, fmt.Sprintf("shiki_id=%d: upsert anime: %v", it.Anime.ID, err))
			continue
		}
		if created {
			res.CreatedAnime++
		}
		if updated {
			res.UpdatedAnime++
		}

		releaseAt, err := time.Parse(time.RFC3339Nano, strings.TrimSpace(it.NextEpisodeAt))
		if err != nil {
			res.SkippedNoBroadcast++
			continue
		}
		releaseRoot := releaseAt.In(rootLoc)
		if releaseRoot.Before(todayRootStart) {
			res.SkippedPast++
			continue
		}
		releaseUTC := releaseRoot.UTC()

		inserted, updatedSchedule, err := upsertScheduleFutureOnly(animeID, it.NextEpisode, releaseUTC, todayRootStartUTC)
		if err != nil {
			res.Errors = append(res.Errors, fmt.Sprintf("anime_id=%d: upsert schedule: %v", animeID, err))
			continue
		}
		if inserted {
			res.InsertedSchedules++
		}
		if updatedSchedule {
			res.UpdatedSchedules++
		}

		time.Sleep(350 * time.Millisecond)
	}

	return res
}

func normalizeShikiRating(s string) string {
	v := strings.ToLower(strings.TrimSpace(s))
	v = strings.ReplaceAll(v, "_", "-")
	if v == "pg-13" {
		return v
	}
	if v == "r-17" {
		return "r-17+"
	}
	if v == "r-plus" {
		return "r+"
	}
	return v
}

func stripShikiBBCode(input string) string {
	s := strings.ReplaceAll(input, "[br]", "\n")
	s = strings.ReplaceAll(s, "[BR]", "\n")
	r := strings.NewReplacer("<br>", "\n", "<br/>", "\n", "<br />", "\n")
	s = r.Replace(s)
	s = regexpReplaceAllString(s, `\[(character|person|anime|manga|ranobe|seyu)=\d+[^\]]*\]([\s\S]*?)\[\/(character|person|anime|manga|ranobe|seyu)\]`, "$2")
	s = regexpReplaceAllString(s, `\[\/?(b|i|u|s|spoiler|quote|url|center|left|right|color|size)[^\]]*\]`, "")
	s = regexpReplaceAllString(s, `\[[^\]]+\]`, "")
	s = regexpReplaceAllString(s, `\n{3,}`, "\n\n")
	return strings.TrimSpace(s)
}

func regexpReplaceAllString(s, pattern string, repl string) string {
	re := regexp.MustCompile(pattern)
	return re.ReplaceAllString(s, repl)
}

func absShikiURL(path string) string {
	p := strings.TrimSpace(path)
	if p == "" {
		return ""
	}
	if strings.HasPrefix(p, "http://") || strings.HasPrefix(p, "https://") {
		return p
	}
	if strings.HasPrefix(p, "/") {
		return "https://shikimori.one" + p
	}
	return p
}

func isShikiMissingImage(path string) bool {
	p := strings.TrimSpace(path)
	return strings.Contains(p, "/assets/globals/missing_")
}

func uniqueAnimeURL(base string, shikiID int) string {
	base = strings.TrimSpace(base)
	if base == "" {
		base = fmt.Sprintf("shiki-%d", shikiID)
	}
	urlVal := base
	for i := 0; i < 5; i++ {
		var c int64
		_ = app.DB.Model(&models.Anime{}).Where("url = ?", urlVal).Count(&c)
		if c == 0 {
			return urlVal
		}
		if i == 0 {
			urlVal = fmt.Sprintf("%s-%d", base, shikiID)
		} else {
			urlVal = fmt.Sprintf("%s-%d-%d", base, shikiID, i)
		}
	}
	return fmt.Sprintf("%s-%d", base, time.Now().Unix())
}

func toJSON(v any) datatypes.JSON {
	b, err := json.Marshal(v)
	if err != nil {
		return datatypes.JSON([]byte("[]"))
	}
	return datatypes.JSON(b)
}

func ensureKindOption(name string) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil
	}
	var c int64
	_ = app.DB.Model(&models.KindOption{}).Where("name = ?", name).Count(&c)
	if c > 0 {
		return nil
	}
	return app.DB.Create(&models.KindOption{Name: name}).Error
}

func ensureRatingOption(name string) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil
	}
	var c int64
	_ = app.DB.Model(&models.RatingOption{}).Where("name = ?", name).Count(&c)
	if c > 0 {
		return nil
	}
	return app.DB.Create(&models.RatingOption{Name: name}).Error
}

func ensureStatus(name string, ruName *string) (int, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return 0, nil
	}
	var st models.Status
	if err := app.DB.Where("name = ?", name).First(&st).Error; err == nil {
		return st.ID, nil
	}
	st = models.Status{Name: name}
	if err := app.DB.Create(&st).Error; err != nil {
		return 0, err
	}
	_ = setStatusRUName(st.ID, ruName)
	return st.ID, nil
}

func ensureSource(name string) (int, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return 0, nil
	}
	var s models.Source
	if err := app.DB.Where("name = ?", name).First(&s).Error; err == nil {
		return s.ID, nil
	}
	s = models.Source{Name: name}
	if err := app.DB.Create(&s).Error; err != nil {
		return 0, err
	}
	return s.ID, nil
}

func ensureStudio(name string) (int, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return 0, nil
	}
	var st models.Studio
	if err := app.DB.Where("name = ?", name).First(&st).Error; err == nil {
		return st.ID, nil
	}
	st = models.Studio{Name: name}
	if err := app.DB.Create(&st).Error; err != nil {
		return 0, err
	}
	return st.ID, nil
}

func ensureProducer(name string) (int, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return 0, nil
	}
	var p models.Producer
	if err := app.DB.Where("name = ?", name).First(&p).Error; err == nil {
		return p.ID, nil
	}
	p = models.Producer{Name: name}
	if err := app.DB.Create(&p).Error; err != nil {
		return 0, err
	}
	return p.ID, nil
}

func ensureGenre(name string, ruName *string) (int, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return 0, nil
	}
	var g models.Genre
	if err := app.DB.Where("name = ?", name).First(&g).Error; err == nil {
		if ruName != nil {
			_ = setGenreRUName(g.ID, ruName, nil)
		}
		return g.ID, nil
	}
	g = models.Genre{Name: name}
	if err := app.DB.Create(&g).Error; err != nil {
		return 0, err
	}
	_ = setGenreRUName(g.ID, ruName, nil)
	return g.ID, nil
}

func ensureTheme(name string, ruName *string) (int, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return 0, nil
	}
	var t models.Theme
	if err := app.DB.Where("name = ?", name).First(&t).Error; err == nil {
		if ruName != nil {
			_ = setThemeRUName(t.ID, ruName, nil)
		}
		return t.ID, nil
	}
	t = models.Theme{Name: name}
	if err := app.DB.Create(&t).Error; err != nil {
		return 0, err
	}
	_ = setThemeRUName(t.ID, ruName, nil)
	return t.ID, nil
}

func upsertAnimeFromShiki(a shikiAnimeFull, malID int, enrich *jikanEnrichment) (animeID int64, created bool, updated bool, err error) {
	var ruLang models.Language
	if err := app.DB.Where("code = ?", "ru").First(&ruLang).Error; err != nil {
		return 0, false, false, errors.New("missing RU language")
	}
	var enLang models.Language
	if err := app.DB.Where("code = ?", "en").First(&enLang).Error; err != nil {
		return 0, false, false, errors.New("missing EN language")
	}

	if a.ID <= 0 {
		return 0, false, false, errors.New("missing shikimori id")
	}
	if malID <= 0 {
		if a.MALID != nil {
			malID = *a.MALID
		} else if a.MyAnimeListID != nil {
			malID = *a.MyAnimeListID
		}
	}

	titleRomaji := strings.TrimSpace(a.Name)
	if titleRomaji == "" {
		titleRomaji = fmt.Sprintf("shiki-%d", a.ID)
	}
	titleEn := ""
	for _, v := range a.English {
		vv := strings.TrimSpace(v)
		if vv != "" {
			titleEn = vv
			break
		}
	}
	if titleEn == "" && enrich != nil {
		titleEn = strings.TrimSpace(enrich.TitleEnglish)
	}
	if titleEn == "" {
		titleEn = titleRomaji
	}
	titleRu := strings.TrimSpace(a.Russian)
	if titleRu == "" {
		titleRu = titleEn
	}

	var existing models.Anime
	find := app.DB.Select("id", "url", "name", "image", "shikimori_id", "mal_id")
	if malID > 0 {
		if err := find.Where("mal_id = ?", malID).First(&existing).Error; err != nil {
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				return 0, false, false, err
			}
		} else {
			existing.ID = existing.ID
		}
	}
	if existing.ID == 0 {
		if err := find.Where("shikimori_id = ?", a.ID).First(&existing).Error; err != nil {
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				return 0, false, false, err
			}
		}
	}

	score, _ := strconv.ParseFloat(strings.ReplaceAll(strings.TrimSpace(a.Score), ",", "."), 64)
	rating := normalizeShikiRating(a.Rating)
	_ = ensureKindOption(strings.TrimSpace(a.Kind))
	_ = ensureRatingOption(rating)

	posterURL := ""
	if enrich != nil {
		posterURL = strings.TrimSpace(enrich.PosterURL)
	}
	if posterURL == "" {
		if !isShikiMissingImage(a.Image.Original) {
			posterURL = absShikiURL(a.Image.Original)
		}
		if posterURL == "" && !isShikiMissingImage(a.Image.Preview) {
			posterURL = absShikiURL(a.Image.Preview)
		}
	}
	trailerURL := ""
	if enrich != nil {
		trailerURL = strings.TrimSpace(enrich.TrailerURL)
	}
	if trailerURL == "" {
		for _, v := range a.Videos {
			pu := strings.TrimSpace(v.PlayerURL)
			if pu == "" {
				continue
			}
			pu = strings.Replace(pu, "http://", "https://", 1)
			if strings.TrimSpace(v.Kind) == "pv" {
				trailerURL = pu
				break
			}
			if trailerURL == "" {
				trailerURL = pu
			}
		}
	}

	statusID := 0
	if s := strings.TrimSpace(a.Status); s != "" {
		ruMap := map[string]string{"ongoing": "Онгоинг", "released": "Вышло", "anons": "Анонс"}
		var ruPtr *string
		if v, ok := ruMap[s]; ok {
			vv := v
			ruPtr = &vv
		}
		id, _ := ensureStatus(s, ruPtr)
		statusID = id
	}

	studioID := 0
	if len(a.Studios) > 0 {
		id, _ := ensureStudio(a.Studios[0].Name)
		studioID = id
	}

	sourceID := 0
	if enrich != nil {
		id, _ := ensureSource(enrich.Source)
		sourceID = id
	}

	genreIDs := make([]int, 0)
	themeIDs := make([]int, 0)
	for _, g := range a.Genres {
		name := strings.TrimSpace(g.Name)
		if name == "" {
			continue
		}
		var ruPtr *string
		if strings.TrimSpace(g.Russian) != "" {
			vv := strings.TrimSpace(g.Russian)
			ruPtr = &vv
		}
		k := strings.ToLower(strings.TrimSpace(g.Kind))
		if k == "theme" {
			id, _ := ensureTheme(name, ruPtr)
			if id > 0 {
				themeIDs = append(themeIDs, id)
			}
			continue
		}
		id, _ := ensureGenre(name, ruPtr)
		if id > 0 {
			genreIDs = append(genreIDs, id)
		}
	}
	if enrich != nil {
		for _, th := range enrich.Themes {
			id, _ := ensureTheme(th, nil)
			if id > 0 {
				themeIDs = append(themeIDs, id)
			}
		}
	}
	genreIDs = uniqueInts(genreIDs)
	themeIDs = uniqueInts(themeIDs)

	producerIDs := make([]int, 0)
	if enrich != nil {
		for _, p := range enrich.Producers {
			id, _ := ensureProducer(p)
			if id > 0 {
				producerIDs = append(producerIDs, id)
			}
		}
	}
	producerIDs = uniqueInts(producerIDs)

	airedOn, err := parseOptionalDate(derefStr(a.AiredOn))
	if err != nil {
		airedOn = nil
	}
	releasedOn, err := parseOptionalDate(derefStr(a.ReleasedOn))
	if err != nil {
		releasedOn = nil
	}

	if existing.ID == 0 {
		slug := slugify(titleEn)
		if slug == "" {
			slug = fmt.Sprintf("shiki-%d", a.ID)
		}
		var byURL models.Anime
		if err := app.DB.Select("id", "url").Where("url = ?", slug).First(&byURL).Error; err == nil && byURL.ID > 0 {
			existing = byURL
		}
	}

	if existing.ID == 0 {
		slug := uniqueAnimeURL(slugify(titleRomaji), a.ID)
		if slug == "" {
			slug = fmt.Sprintf("shiki-%d", a.ID)
		}
		anime := models.Anime{
			SeasonNumber:    1,
			Name:            titleRomaji,
			URL:             slug,
			Kind:            strings.TrimSpace(a.Kind),
			Duration:        a.Duration,
			Rating:          rating,
			EpisodesAired:   a.EpisodesAired,
			Episodes:        a.Episodes,
			AiredOn:         airedOn,
			ReleasedOn:      releasedOn,
			Score:           score,
			StatusID:        func() *int { if statusID > 0 { v := statusID; return &v }; return nil }(),
			StudioID:        func() *int { if studioID > 0 { v := studioID; return &v }; return nil }(),
			SourceID:        func() *int { if sourceID > 0 { v := sourceID; return &v }; return nil }(),
			ShikimoriID:     ptrInt(a.ID),
			MALID:           ptrInt(malID),
			ShikiEnglish:    a.English,
			ShikiJapanese:   a.Japanese,
			ShikiSynonyms:   a.Synonyms,
			ShikiFansubbers: a.Fansubbers,
			ShikiFandubbers: a.Fandubbers,
			ImageURL:        posterURL,
			BackgroundURL:   posterURL,
			TrailerURL:      trailerURL,
		}
		if err := app.DB.Create(&anime).Error; err != nil {
			if strings.Contains(err.Error(), "anime_url_key") {
				var exByURL models.Anime
				if err2 := app.DB.Select("id").Where("url = ?", slug).First(&exByURL).Error; err2 == nil && exByURL.ID > 0 {
					existing = exByURL
					goto UPDATE_EXISTING
				}
			}
			return 0, false, false, err
		}
		ruDesc := ""
		if strings.TrimSpace(a.Description) != "" {
			ruDesc = stripShikiBBCode(a.Description)
		}
		enDesc := ""
		if enrich != nil {
			enDesc = strings.TrimSpace(enrich.Synopsis)
		}
		_ = app.DB.Create(&models.AnimeTranslation{AnimeID: anime.ID, LanguageID: ruLang.ID, Title: titleRu, Description: ruDesc}).Error
		_ = app.DB.Create(&models.AnimeTranslation{AnimeID: anime.ID, LanguageID: enLang.ID, Title: titleEn, Description: enDesc}).Error

		_ = app.DB.Transaction(func(tx *gorm.DB) error {
			if len(genreIDs) > 0 {
				if err := setAnimeGenresTx(tx, anime.ID, genreIDs); err != nil {
					return err
				}
			}
			if len(themeIDs) > 0 {
				if err := setAnimeThemesTx(tx, anime.ID, themeIDs); err != nil {
					return err
				}
			}
			if len(producerIDs) > 0 {
				if err := setAnimeProducersTx(tx, anime.ID, producerIDs); err != nil {
					return err
				}
				if anime.ProducerID == nil {
					first := producerIDs[0]
					if err := tx.Model(&models.Anime{}).Where("id = ?", anime.ID).Update("producer_id", first).Error; err != nil {
						return err
					}
				}
			}
		alt := buildAltTitles(titleEn, titleRomaji, titleRu, a.English, a.Japanese, a.Synonyms)
			if len(alt) > 0 {
				if err := replaceAnimeAltTitlesTx(tx, anime.ID, alt); err != nil {
					return err
				}
			}
			return nil
		})
		return anime.ID, true, false, nil
	}

	UPDATE_EXISTING:
	updates := map[string]any{}
	updates["name"] = titleRomaji
	if malID > 0 {
		updates["mal_id"] = malID
	}
	updates["shikimori_id"] = a.ID
	if v := strings.TrimSpace(a.Kind); v != "" {
		_ = ensureKindOption(v)
		updates["kind"] = v
	}
	if rating != "" {
		_ = ensureRatingOption(rating)
		updates["rating"] = rating
	}
	if a.Duration > 0 {
		updates["duration"] = a.Duration
	}
	if a.Episodes >= 0 {
		updates["episodes"] = a.Episodes
	}
	if a.EpisodesAired >= 0 {
		updates["episodes_aired"] = a.EpisodesAired
	}
	if airedOn != nil {
		updates["aired_on"] = *airedOn
	}
	if releasedOn != nil {
		updates["released_on"] = *releasedOn
	}
	if score > 0 {
		updates["score"] = score
	}
	if posterURL != "" {
		updates["image"] = posterURL
		updates["background_url"] = posterURL
	}
	if trailerURL != "" {
		updates["trailer_url"] = trailerURL
	}
	updates["shiki_english"] = toJSON(a.English)
	updates["shiki_japanese"] = toJSON(a.Japanese)
	updates["shiki_synonyms"] = toJSON(a.Synonyms)
	updates["shiki_fansubbers"] = toJSON(a.Fansubbers)
	updates["shiki_fandubbers"] = toJSON(a.Fandubbers)
	if statusID > 0 {
		updates["status_id"] = statusID
	}
	if studioID > 0 {
		updates["studio_id"] = studioID
	}
	if sourceID > 0 {
		updates["source_id"] = sourceID
	}

	if err := app.DB.Model(&models.Anime{}).Where("id = ?", existing.ID).Updates(updates).Error; err != nil {
		return 0, false, false, err
	}
	updated = len(updates) > 0

	ruDesc := ""
	if strings.TrimSpace(a.Description) != "" {
		ruDesc = stripShikiBBCode(a.Description)
	}
	enDesc := ""
	if enrich != nil {
		enDesc = strings.TrimSpace(enrich.Synopsis)
	}
	_ = upsertAnimeTranslation(existing.ID, ruLang.ID, titleRu, ruDesc)
	_ = upsertAnimeTranslation(existing.ID, enLang.ID, titleEn, enDesc)

	_ = app.DB.Transaction(func(tx *gorm.DB) error {
		var c int64
		_ = tx.Table("anime_genres").Where("anime_id = ?", existing.ID).Count(&c)
		if c == 0 && len(genreIDs) > 0 {
			if err := setAnimeGenresTx(tx, existing.ID, genreIDs); err != nil {
				return err
			}
		}
		c = 0
		_ = tx.Table("anime_themes").Where("anime_id = ?", existing.ID).Count(&c)
		if c == 0 && len(themeIDs) > 0 {
			if err := setAnimeThemesTx(tx, existing.ID, themeIDs); err != nil {
				return err
			}
		}
		c = 0
		_ = tx.Table("anime_producers").Where("anime_id = ?", existing.ID).Count(&c)
		if c == 0 && len(producerIDs) > 0 {
			if err := setAnimeProducersTx(tx, existing.ID, producerIDs); err != nil {
				return err
			}
			if err := tx.Model(&models.Anime{}).Where("id = ?", existing.ID).Update("producer_id", producerIDs[0]).Error; err != nil {
				return err
			}
		}
		c = 0
		_ = tx.Model(&models.AnimeAltTitle{}).Where("anime_id = ?", existing.ID).Count(&c)
		if c == 0 {
			alt := buildAltTitles(titleEn, titleRomaji, titleRu, a.English, a.Japanese, a.Synonyms)
			if len(alt) > 0 {
				if err := replaceAnimeAltTitlesTx(tx, existing.ID, alt); err != nil {
					return err
				}
			}
		}
		return nil
	})

	return existing.ID, false, updated, nil
}

func uniqueInts(in []int) []int {
	seen := map[int]struct{}{}
	out := make([]int, 0, len(in))
	for _, v := range in {
		if v <= 0 {
			continue
		}
		if _, ok := seen[v]; ok {
			continue
		}
		seen[v] = struct{}{}
	out = append(out, v)
	}
	return out
}

func buildAltTitles(titleEn, titleRomaji, titleRu string, en []string, jp []string, syn []string) []string {
	seen := map[string]string{}
	add := func(s string) {
		v := strings.TrimSpace(s)
		if v == "" {
			return
		}
		k := strings.ToLower(v)
		if k == strings.ToLower(strings.TrimSpace(titleEn)) || k == strings.ToLower(strings.TrimSpace(titleRu)) || k == strings.ToLower(strings.TrimSpace(titleRomaji)) {
			return
		}
		if _, ok := seen[k]; ok {
			return
		}
		seen[k] = v
	}
	for _, s := range en {
		add(s)
	}
	for _, s := range jp {
		add(s)
	}
	for _, s := range syn {
		add(s)
	}
	keys := make([]string, 0, len(seen))
	for k := range seen {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	res := make([]string, 0, len(keys))
	for _, k := range keys {
		res = append(res, seen[k])
	}
	return res
}

func upsertAnimeTranslation(animeID int64, langID int, title string, desc string) error {
	title = strings.TrimSpace(title)
	desc = strings.TrimSpace(desc)
	if title == "" {
		return nil
	}
	return app.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "anime_id"}, {Name: "language_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"title", "description"}),
	}).Create(&models.AnimeTranslation{AnimeID: animeID, LanguageID: langID, Title: title, Description: desc}).Error
}

func upsertSchedule(animeID int64, episodeNumber int, releaseUTC time.Time) error {
	if animeID <= 0 || episodeNumber <= 0 {
		return errors.New("invalid schedule keys")
	}
	releaseUTC = releaseUTC.UTC().Truncate(time.Minute)
	item := models.ScheduleItem{AnimeID: animeID, EpisodeNumber: episodeNumber, ReleaseDateTime: releaseUTC}
	return app.DB.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "anime_id"}, {Name: "episode_number"}},
		DoUpdates: clause.AssignmentColumns([]string{"release_datetime", "updated_at"}),
	}).Create(&item).Error
}

func upsertScheduleFutureOnly(animeID int64, episodeNumber int, releaseUTC time.Time, todayStartUTC time.Time) (inserted bool, updated bool, err error) {
	if animeID <= 0 || episodeNumber <= 0 {
		return false, false, errors.New("invalid schedule keys")
	}
	releaseUTC = releaseUTC.UTC().Truncate(time.Minute)
	if !todayStartUTC.IsZero() {
		_ = app.DB.Exec(
			`DELETE FROM schedules
			 WHERE anime_id = ?
			   AND release_datetime = ?
			   AND episode_number <> ?
			   AND release_datetime >= ?`,
			animeID,
			releaseUTC,
			episodeNumber,
			todayStartUTC.UTC().Truncate(time.Minute),
		).Error
	}
	var existing models.ScheduleItem
	err = app.DB.Where("anime_id = ? AND episode_number = ?", animeID, episodeNumber).First(&existing).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			item := models.ScheduleItem{AnimeID: animeID, EpisodeNumber: episodeNumber, ReleaseDateTime: releaseUTC}
			if err := app.DB.Create(&item).Error; err != nil {
				return false, false, err
			}
			return true, false, nil
		}
		return false, false, err
	}

	if !todayStartUTC.IsZero() && existing.ReleaseDateTime.Before(todayStartUTC) {
		return false, false, nil
	}
	if existing.ReleaseDateTime.Equal(releaseUTC) {
		return false, false, nil
	}
	if err := app.DB.Model(&models.ScheduleItem{}).Where("id = ?", existing.ID).Updates(map[string]any{"release_datetime": releaseUTC, "updated_at": time.Now().UTC()}).Error; err != nil {
		return false, false, err
	}
	return false, true, nil
}

func getRootAdminTimezone() string {
	// mock / placeholder: можно заменить на реальные настройки root-пользователя
	tz := "Europe/Moscow"
	var s models.AppSetting
	if err := app.DB.Where("key = ?", "schedule_timezone").First(&s).Error; err == nil {
		v := strings.TrimSpace(s.Value)
		if v != "" {
			tz = v
		}
	}
	return tz
}

func ptrInt(v int) *int {
	if v <= 0 {
		return nil
	}
	vv := v
	return &vv
}

func derefStr(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}
