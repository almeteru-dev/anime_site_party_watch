package handlers

import (
	"context"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
)

type moonanimeBulkStartInput struct {
	Scope  string `json:"scope"`
	Mode   string `json:"mode"`
	FromID int64  `json:"from_id"`
	ToID   int64  `json:"to_id"`
}

type moonanimeBulkStatus struct {
	Status          string    `json:"status"`
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

var moonanimeBulkMu sync.Mutex
var moonanimeBulkRunning bool
var moonanimeBulkLast moonanimeBulkStatus

func AdminMoonanimeBulkStatus(c *gin.Context) {
	moonanimeBulkMu.Lock()
	running := moonanimeBulkRunning
	last := moonanimeBulkLast
	moonanimeBulkMu.Unlock()
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

func AdminMoonanimeBulkStart(c *gin.Context) {
	var in moonanimeBulkStartInput
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

	moonanimeBulkMu.Lock()
	if moonanimeBulkRunning {
		last := moonanimeBulkLast
		last.Status = "running"
		moonanimeBulkMu.Unlock()
		c.JSON(http.StatusOK, last)
		return
	}
	moonanimeBulkRunning = true
	moonanimeBulkLast = moonanimeBulkStatus{
		Status:    "running",
		Scope:     scope,
		Mode:      mode,
		FromID:    fromID,
		ToID:      toID,
		StartedAt: time.Now().UTC(),
		Errors:    []string{},
	}
	moonanimeBulkMu.Unlock()

	go func() {
		st := runMoonanimeBulk(scope, mode, fromID, toID)
		moonanimeBulkMu.Lock()
		moonanimeBulkLast = st
		moonanimeBulkLast.FinishedAt = time.Now().UTC()
		moonanimeBulkRunning = false
		moonanimeBulkMu.Unlock()
	}()

	c.JSON(http.StatusAccepted, gin.H{"status": "started"})
}

func runMoonanimeBulk(scope string, mode string, fromID int64, toID int64) moonanimeBulkStatus {
	st := moonanimeBulkStatus{
		Status:    "running",
		Scope:     scope,
		Mode:      mode,
		FromID:    fromID,
		ToID:      toID,
		StartedAt: time.Now().UTC(),
		Errors:    []string{},
	}

	var ids []int64
	q := app.DB.Table("anime").Select("anime.id").Where("anime.mal_id IS NOT NULL")
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

	ctx := context.Background()
	for _, animeID := range ids {
		st.Processed++
		stats, err := moonanimeImportEpisodesForAnime(ctx, animeID, mode)
		if err != nil {
			st.Errors = append(st.Errors, "anime_id="+strconv.FormatInt(animeID, 10)+": "+err.Error())
			time.Sleep(200 * time.Millisecond)
			continue
		}
		if stats.TotalItems == 0 {
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

