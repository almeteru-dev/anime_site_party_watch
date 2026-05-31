package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
	"gorm.io/gorm"
)

type ImportShikimoriCollectionsInput struct {
	OnExisting string `json:"on_existing"` // replace | skip
}

type shikiUser struct {
	ID       int    `json:"id"`
	Nickname string `json:"nickname"`
}

type shikiUserRate struct {
	TargetID   int    `json:"target_id"`
	TargetType string `json:"target_type"`
	Status     string `json:"status"`
	Score      int    `json:"score"`
	Episodes   int    `json:"episodes"`
}

func shikimoriGetUserByUsername(ctx context.Context, client *http.Client, username string, userAgent string) (shikiUser, error) {
	username = strings.TrimSpace(username)
	if username == "" {
		return shikiUser{}, errors.New("missing username")
	}
	apiURL := "https://shikimori.one/api/users/" + url.PathEscape(username)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return shikiUser{}, err
	}
	req.Header.Set("Accept", "application/json")
	if strings.TrimSpace(userAgent) == "" {
		userAgent = "LycorisLib"
	}
	req.Header.Set("User-Agent", userAgent)

	resp, err := client.Do(req)
	if err != nil {
		return shikiUser{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == 429 {
		time.Sleep(900 * time.Millisecond)
		return shikimoriGetUserByUsername(ctx, client, username, userAgent)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return shikiUser{}, fmt.Errorf("status=%d body=%s", resp.StatusCode, string(b))
	}
	var u shikiUser
	if err := json.NewDecoder(resp.Body).Decode(&u); err != nil {
		return shikiUser{}, err
	}
	if u.ID <= 0 {
		return shikiUser{}, errors.New("invalid shikimori user id")
	}
	return u, nil
}

func shikimoriFetchUserRates(ctx context.Context, client *http.Client, userID int, page int, limit int, userAgent string) ([]shikiUserRate, error) {
	if userID <= 0 {
		return nil, errors.New("invalid shikimori user id")
	}
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 100
	}
	q := url.Values{}
	q.Set("user_id", strconv.Itoa(userID))
	q.Set("target_type", "Anime")
	q.Set("limit", strconv.Itoa(limit))
	q.Set("page", strconv.Itoa(page))
	apiURL := "https://shikimori.one/api/v2/user_rates?" + q.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	if strings.TrimSpace(userAgent) == "" {
		userAgent = "LycorisLib"
	}
	req.Header.Set("User-Agent", userAgent)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == 429 {
		time.Sleep(900 * time.Millisecond)
		return shikimoriFetchUserRates(ctx, client, userID, page, limit, userAgent)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("status=%d body=%s", resp.StatusCode, string(b))
	}
	var rates []shikiUserRate
	if err := json.NewDecoder(resp.Body).Decode(&rates); err != nil {
		return nil, err
	}
	return rates, nil
}

func ImportShikimoriCollections(c *gin.Context) {
	uid, ok := userIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var me models.User
	if err := app.DB.Select("id", "username").First(&me, uid).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	shikiUsername := strings.TrimSpace(me.Username)
	if shikiUsername == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing username"})
		return
	}

	var input ImportShikimoriCollectionsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	onExisting := strings.ToLower(strings.TrimSpace(input.OnExisting))
	if onExisting == "" {
		onExisting = "replace"
	}
	if onExisting != "replace" && onExisting != "skip" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid on_existing"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 45*time.Second)
	defer cancel()

	client := &http.Client{Timeout: 18 * time.Second}
	ua := fmt.Sprintf("LycorisLib-ShikimoriImport/%d", time.Now().Unix())
	user, err := shikimoriGetUserByUsername(ctx, client, shikiUsername, ua)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to fetch Shikimori user"})
		return
	}

	var collectionTypes []models.CollectionType
	if err := app.DB.Find(&collectionTypes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load collection types"})
		return
	}
	ctByName := map[string]int{}
	for _, ct := range collectionTypes {
		ctByName[strings.ToLower(strings.TrimSpace(ct.Name))] = ct.ID
	}

	imported := 0
	createdAnime := 0
	skippedExisting := 0
	ratingsImported := 0
	updatedEntries := 0

	const pageLimit = 100
	const maxPages = 20
	for page := 1; page <= maxPages; page++ {
		rates, err := shikimoriFetchUserRates(ctx, client, user.ID, page, pageLimit, ua)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to fetch Shikimori list"})
			return
		}
		if len(rates) == 0 {
			break
		}

		for _, r := range rates {
			if strings.ToLower(strings.TrimSpace(r.TargetType)) != "anime" {
				continue
			}
			status := strings.ToLower(strings.TrimSpace(r.Status))
			switch status {
			case "watching", "planned", "completed", "on_hold", "dropped", "rewatching":
			default:
				continue
			}
			if r.TargetID <= 0 {
				continue
			}

			animeID, animeEpisodes, animeStatusName, wasCreated, err := ensureAnimeByShikimoriID(ctx, client, r.TargetID, ua)
			if err != nil {
				continue
			}
			if wasCreated {
				createdAnime++
			}
			isReleased := strings.ToLower(strings.TrimSpace(animeStatusName)) == "released"
			if !isReleased && (status == "completed" || status == "rewatching") {
				status = "watching"
			}

			ctID, ok := ctByName[status]
			if !ok || ctID <= 0 {
				continue
			}

			episodesWatched := 0
			if status == "planned" {
				episodesWatched = 0
			} else if status == "completed" && animeEpisodes > 0 {
				episodesWatched = animeEpisodes
			} else {
				episodesWatched = r.Episodes
				if episodesWatched < 0 {
					episodesWatched = 0
				}
				if animeEpisodes > 0 && episodesWatched > animeEpisodes {
					episodesWatched = animeEpisodes
				}
			}

			var existing models.UserCollection
			err = app.DB.Where("user_id = ? AND anime_id = ?", uid, animeID).First(&existing).Error
			if err == nil {
				if onExisting == "skip" {
					skippedExisting++
					continue
				}
				existing.CollectionTypeID = ctID
				existing.EpisodesWatched = episodesWatched
				if err := app.DB.Save(&existing).Error; err != nil {
					continue
				}
				updatedEntries++
			} else if errors.Is(err, gorm.ErrRecordNotFound) {
				existing = models.UserCollection{
					UserID:           uid,
					AnimeID:          animeID,
					CollectionTypeID: ctID,
					EpisodesWatched:  episodesWatched,
				}
				if err := app.DB.Create(&existing).Error; err != nil {
					continue
				}
				imported++
			} else {
				continue
			}

			if r.Score >= 1 && r.Score <= 10 && (status == "completed" || status == "rewatching") {
				if err := upsertAnimeRating(uid, animeID, r.Score); err == nil {
					ratingsImported++
				}
			}
		}

		if len(rates) < pageLimit {
			break
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"shikimori_user_id":  user.ID,
		"imported":          imported,
		"updated":           updatedEntries,
		"skipped_existing":  skippedExisting,
		"created_anime":     createdAnime,
		"ratings_imported":  ratingsImported,
		"on_existing":       onExisting,
		"shikimori_username": shikiUsername,
	})
}

func ensureAnimeByShikimoriID(ctx context.Context, client *http.Client, shikiID int, userAgent string) (animeID int64, episodes int, statusName string, created bool, err error) {
	var anime models.Anime
	if err := app.DB.Preload("Status").Where("shikimori_id = ?", shikiID).First(&anime).Error; err == nil {
		return anime.ID, anime.Episodes, func() string {
			if anime.Status != nil {
				return anime.Status.Name
			}
			return ""
		}(), false, nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return 0, 0, "", false, err
	}

	full, err := shikimoriGetAnimeByID(ctx, client, shikiID, userAgent)
	if err != nil {
		return 0, 0, "", false, err
	}
	malID := 0
	if full.MALID != nil {
		malID = *full.MALID
	} else if full.MyAnimeListID != nil {
		malID = *full.MyAnimeListID
	}
	var enrichPtr *jikanEnrichment
	if malID > 0 {
		enrich, e := fetchJikanEnrichment(ctx, client, malID)
		if e == nil {
			enrichPtr = &enrich
		}
	}
	animeID, created, _, err = upsertAnimeFromShiki(full, malID, enrichPtr)
	if err != nil {
		return 0, 0, "", false, err
	}
	var refreshed models.Anime
	if err := app.DB.Preload("Status").First(&refreshed, animeID).Error; err != nil {
		return animeID, 0, "", created, nil
	}
	statusName = ""
	if refreshed.Status != nil {
		statusName = refreshed.Status.Name
	}
	return refreshed.ID, refreshed.Episodes, statusName, created, nil
}

func upsertAnimeRating(userID int64, animeID int64, score int) error {
	var avg float64
	var cnt int64
	return app.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(
			`INSERT INTO anime_ratings (user_id, anime_id, score)
			 VALUES (?, ?, ?)
			 ON CONFLICT (user_id, anime_id) DO UPDATE
			 SET score = EXCLUDED.score, updated_at = NOW()`,
			userID, animeID, score,
		).Error; err != nil {
			return err
		}
		row := tx.Raw(
			`SELECT COALESCE(AVG(score)::float8, 0.0) AS avg_score,
			        COALESCE(COUNT(*)::int8, 0)       AS cnt
			 FROM anime_ratings
			 WHERE anime_id = ?`,
			animeID,
		).Row()
		if err := row.Scan(&avg, &cnt); err != nil {
			return err
		}
		if err := tx.Exec(
			`UPDATE anime SET rating_avg = ?, rating_count = ? WHERE id = ?`,
			avg, cnt, animeID,
		).Error; err != nil {
			return err
		}
		return nil
	})
}
