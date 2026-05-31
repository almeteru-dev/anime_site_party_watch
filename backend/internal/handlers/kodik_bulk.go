package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
)

type kodikBulkStartInput struct {
	Scope  string `json:"scope"` // all | ongoing | range
	Mode   string `json:"mode"`  // add | sync
	FromID int64  `json:"from_id"`
	ToID   int64  `json:"to_id"`
}

type kodikBulkStatus struct {
	Status          string    `json:"status"` // idle | running | finished
	Scope           string    `json:"scope"`
	Mode            string    `json:"mode"`
	FromID          int64     `json:"from_id,omitempty"`
	ToID            int64     `json:"to_id,omitempty"`
	StartedAt       time.Time `json:"started_at,omitempty"`
	FinishedAt      time.Time `json:"finished_at,omitempty"`
	Total           int       `json:"total"`
	Processed       int       `json:"processed"`
	Succeeded       int       `json:"succeeded"`
	Skipped         int       `json:"skipped"`
	CreatedEpisodes int       `json:"created_episodes"`
	CreatedSources  int       `json:"created_sources"`
	UpdatedSources  int       `json:"updated_sources"`
	Errors          []string  `json:"errors"`
}

var kodikBulkMu sync.Mutex
var kodikBulkRunning bool
var kodikBulkLast kodikBulkStatus

func AdminKodikBulkStatus(c *gin.Context) {
	kodikBulkMu.Lock()
	running := kodikBulkRunning
	last := kodikBulkLast
	kodikBulkMu.Unlock()
	if running {
		last.Status = "running"
	} else {
		if last.StartedAt.IsZero() {
			last.Status = "idle"
		} else {
			last.Status = "finished"
		}
	}
	c.JSON(http.StatusOK, last)
}

func AdminKodikBulkStart(c *gin.Context) {
	var in kodikBulkStartInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	scope := strings.ToLower(strings.TrimSpace(in.Scope))
	mode := strings.ToLower(strings.TrimSpace(in.Mode))
	if scope == "" {
		scope = "all"
	}
	if mode == "" {
		mode = "sync"
	}
	if mode != "add" && mode != "sync" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid mode"})
		return
	}
	if scope != "all" && scope != "ongoing" && scope != "range" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid scope"})
		return
	}
	fromID := in.FromID
	toID := in.ToID
	if scope == "range" {
		if fromID <= 0 || toID <= 0 || toID < fromID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id range"})
			return
		}
		if (toID-fromID)+1 > 100 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Range size must be <= 100"})
			return
		}
	}

	kodikBulkMu.Lock()
	if kodikBulkRunning {
		last := kodikBulkLast
		last.Status = "running"
		kodikBulkMu.Unlock()
		c.JSON(http.StatusOK, last)
		return
	}
	kodikBulkRunning = true
	kodikBulkLast = kodikBulkStatus{
		Status:    "running",
		Scope:     scope,
		Mode:      mode,
		FromID:    fromID,
		ToID:      toID,
		StartedAt: time.Now().UTC(),
		Errors:    []string{},
	}
	kodikBulkMu.Unlock()

	go func() {
		st := runKodikBulk(scope, mode, fromID, toID)
		kodikBulkMu.Lock()
		kodikBulkLast = st
		kodikBulkLast.FinishedAt = time.Now().UTC()
		kodikBulkRunning = false
		kodikBulkMu.Unlock()
	}()

	c.JSON(http.StatusAccepted, gin.H{"status": "started"})
}

func runKodikBulk(scope string, mode string, fromID int64, toID int64) kodikBulkStatus {
	st := kodikBulkStatus{
		Status:    "running",
		Scope:     scope,
		Mode:      mode,
		FromID:    fromID,
		ToID:      toID,
		StartedAt: time.Now().UTC(),
		Errors:    []string{},
	}

	var ids []int64
	q := app.DB.Table("anime").Select("anime.id").Where("anime.shikimori_id IS NOT NULL")
	if scope == "ongoing" {
		q = q.Joins("JOIN statuses s ON s.id = anime.status_id").Where("LOWER(s.name) = ?", "ongoing")
	}
	if scope == "range" {
		q = q.Where("anime.id BETWEEN ? AND ?", fromID, toID)
	}
	q = q.Order("anime.id ASC")
	if err := q.Scan(&ids).Error; err != nil {
		st.Errors = append(st.Errors, "Failed to load anime ids")
		return st
	}
	st.Total = len(ids)

	for _, animeID := range ids {
		st.Processed++
		stats, err := kodikImportEpisodesForAnime(animeID, mode)
		if err != nil {
			st.Errors = append(st.Errors, "anime_id="+strconv.FormatInt(animeID, 10)+": "+err.Error())
			time.Sleep(200 * time.Millisecond)
			continue
		}
		if stats.Translations == 0 {
			st.Skipped++
		} else {
			st.Succeeded++
			st.CreatedEpisodes += stats.CreatedEpisodes
			st.CreatedSources += stats.CreatedSources
			st.UpdatedSources += stats.UpdatedSources
		}
		time.Sleep(250 * time.Millisecond)
	}

	st.Status = "finished"
	return st
}
