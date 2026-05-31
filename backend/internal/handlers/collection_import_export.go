package handlers

import (
	"bufio"
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
)

type ImportCollectionsFromJSONForm struct {
	OnExisting string `form:"on_existing"` // replace | skip
}

type shikiJSONItem struct {
	TargetID   int    `json:"target_id"`
	TargetType string `json:"target_type"`
	Status     string `json:"status"`
	Score      int    `json:"score"`
	Episodes   int    `json:"episodes"`
}

func ClearMyCollections(c *gin.Context) {
	uid, ok := userIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if err := app.DB.Where("user_id = ?", uid).Delete(&models.UserCollection{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear collections"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"cleared": true})
}

func ExportCollectionsToShikimoriJSON(c *gin.Context) {
	uid, ok := userIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var rows []struct {
		TargetID int
		Status   string
		Score    int
		Episodes int
	}
	err := app.DB.Raw(
		`SELECT a.shikimori_id AS target_id,
		        ct.name        AS status,
		        COALESCE(ar.score, 0) AS score,
		        COALESCE(uc.episodes_watched, 0) AS episodes
		 FROM user_collections uc
		 JOIN anime a ON a.id = uc.anime_id
		 JOIN collection_types ct ON ct.id = uc.collection_type_id
		 LEFT JOIN anime_ratings ar ON ar.user_id = uc.user_id AND ar.anime_id = uc.anime_id
		 WHERE uc.user_id = ? AND a.shikimori_id IS NOT NULL
		 ORDER BY uc.updated_at DESC`,
		uid,
	).Scan(&rows).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to export"})
		return
	}

	out := make([]shikiJSONItem, 0, len(rows))
	for _, r := range rows {
		st := strings.ToLower(strings.TrimSpace(r.Status))
		switch st {
		case "watching", "planned", "completed", "on_hold", "dropped", "rewatching":
		default:
			continue
		}
		score := r.Score
		if score < 0 {
			score = 0
		}
		if score > 10 {
			score = 10
		}
		out = append(out, shikiJSONItem{
			TargetID:   r.TargetID,
			TargetType: "Anime",
			Status:     st,
			Score:      score,
			Episodes:   r.Episodes,
		})
	}

	filename := "shikimori_animes_" + strconv.FormatInt(uid, 10) + ".json"
	c.Header("Content-Type", "application/json; charset=utf-8")
	c.Header("Content-Disposition", `attachment; filename="`+filename+`"`)
	enc := json.NewEncoder(c.Writer)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(out)
}

func ImportCollectionsFromJSON(c *gin.Context) {
	uid, ok := userIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var form ImportCollectionsFromJSONForm
	_ = c.ShouldBind(&form)
	onExisting := strings.ToLower(strings.TrimSpace(form.OnExisting))
	if onExisting == "" {
		onExisting = "replace"
	}
	if onExisting != "replace" && onExisting != "skip" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid on_existing"})
		return
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	if fileHeader.Size <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "empty file"})
		return
	}

	f, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read file"})
		return
	}
	defer f.Close()

	ctx, cancel := context.WithTimeout(c.Request.Context(), 75*time.Second)
	defer cancel()
	client := &http.Client{Timeout: 18 * time.Second}
	ua := "LycorisLib-JSONImport"

	var collectionTypes []models.CollectionType
	if err := app.DB.Find(&collectionTypes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load collection types"})
		return
	}
	ctByName := map[string]int{}
	for _, ct := range collectionTypes {
		ctByName[strings.ToLower(strings.TrimSpace(ct.Name))] = ct.ID
	}

	dec := json.NewDecoder(bufio.NewReader(f))
	dec.UseNumber()
	var items []shikiJSONItem
	if err := dec.Decode(&items); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	imported := 0
	updated := 0
	skipped := 0
	createdAnime := 0
	ratingsImported := 0

	for _, it := range items {
		if it.TargetID <= 0 {
			continue
		}
		if it.TargetType != "" && strings.ToLower(strings.TrimSpace(it.TargetType)) != "anime" {
			continue
		}
		status := strings.ToLower(strings.TrimSpace(it.Status))
		status = strings.ReplaceAll(status, "-", "_")
		status = strings.ReplaceAll(status, " ", "_")
		switch status {
		case "watching", "planned", "completed", "on_hold", "dropped", "rewatching":
		default:
			continue
		}

		animeID, animeEpisodes, animeStatusName, wasCreated, err := ensureAnimeByShikimoriID(ctx, client, it.TargetID, ua)
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
			episodesWatched = it.Episodes
			if episodesWatched < 0 {
				episodesWatched = 0
			}
			if animeEpisodes > 0 && episodesWatched > animeEpisodes {
				episodesWatched = animeEpisodes
			}
		}

		if onExisting == "skip" {
			res := app.DB.Exec(
				`INSERT INTO user_collections (user_id, anime_id, collection_type_id, episodes_watched)
				 VALUES (?, ?, ?, ?)
				 ON CONFLICT (user_id, anime_id) DO NOTHING`,
				uid, animeID, ctID, episodesWatched,
			)
			if res.Error != nil {
				continue
			}
			if res.RowsAffected == 0 {
				skipped++
				continue
			}
			imported++
		} else {
			res := app.DB.Exec(
				`INSERT INTO user_collections (user_id, anime_id, collection_type_id, episodes_watched)
				 VALUES (?, ?, ?, ?)
				 ON CONFLICT (user_id, anime_id) DO UPDATE
				 SET collection_type_id = EXCLUDED.collection_type_id,
				     episodes_watched = EXCLUDED.episodes_watched,
				     updated_at = NOW()`,
				uid, animeID, ctID, episodesWatched,
			)
			if res.Error != nil {
				continue
			}
			if res.RowsAffected == 1 {
				imported++
			} else {
				updated++
			}
		}

		if it.Score >= 1 && it.Score <= 10 && (status == "completed" || status == "rewatching") {
			if err := upsertAnimeRating(uid, animeID, it.Score); err == nil {
				ratingsImported++
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"on_existing":      onExisting,
		"imported":         imported,
		"updated":          updated,
		"skipped_existing": skipped,
		"created_anime":    createdAnime,
		"ratings_imported": ratingsImported,
	})
}
