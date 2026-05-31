package handlers

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
	"github.com/seva/animevista/ent"
	"github.com/seva/animevista/ent/anime"
	"github.com/seva/animevista/ent/schedule"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
)

type ScheduleItemDTO struct {
	ID              int64     `json:"id"`
	ReleaseDatetime time.Time `json:"release_datetime"`
	EpisodeNumber   int       `json:"episode_number"`
	Anime           struct {
		ID    int64  `json:"id"`
		Name  string `json:"name"`
		Russian string `json:"russian"`
		English string `json:"english"`
		URL   string `json:"url"`
		Image string `json:"image"`
	} `json:"anime"`
}

type AdminCreateScheduleInput struct {
	AnimeID       int64  `json:"anime_id" binding:"required"`
	EpisodeNumber int    `json:"episode_number" binding:"required"`
	ReleaseDate   string `json:"release_date" binding:"required"`
	ReleaseTime   string `json:"release_time" binding:"required"`
}

type AdminUpdateScheduleInput struct {
	AnimeID       int64  `json:"anime_id" binding:"required"`
	EpisodeNumber int    `json:"episode_number" binding:"required"`
	ReleaseDate   string `json:"release_date" binding:"required"`
	ReleaseTime   string `json:"release_time" binding:"required"`
}

func GetSchedule(c *gin.Context) {
	from, to, ok := parseScheduleRange(c)
	if !ok {
		return
	}
	items, err := queryScheduleRange(c.Request.Context(), app.Ent, from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load schedule"})
		return
	}
	c.JSON(http.StatusOK, items)
}

func AdminListSchedule(c *gin.Context) {
	from, to, ok := parseScheduleRange(c)
	if !ok {
		return
	}
	items, err := queryScheduleRange(c.Request.Context(), app.Ent, from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load schedule"})
		return
	}
	c.JSON(http.StatusOK, items)
}

func AdminCreateSchedule(c *gin.Context) {
	var input AdminCreateScheduleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.EpisodeNumber <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "episode_number must be positive"})
		return
	}
	datePart := strings.TrimSpace(input.ReleaseDate)
	timePart := strings.TrimSpace(input.ReleaseTime)
	if datePart == "" || timePart == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "release_date and release_time are required"})
		return
	}

	loc, _ := mustScheduleLocation()
	releaseDT, err := time.ParseInLocation("2006-01-02 15:04", datePart+" "+timePart, loc)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date/time. Use YYYY-MM-DD and 24h HH:MM"})
		return
	}
	releaseDT = releaseDT.UTC().Truncate(time.Minute)

	var a models.Anime
	if err := app.DB.Preload("Status").First(&a, input.AnimeID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anime not found"})
		return
	}
	if a.Status == nil || strings.ToLower(strings.TrimSpace(a.Status.Name)) != "ongoing" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only ongoing anime can be scheduled"})
		return
	}

	ctx := c.Request.Context()
	created, err := app.Ent.Schedule.
		Create().
		SetAnimeID(input.AnimeID).
		SetEpisodeNumber(input.EpisodeNumber).
		SetReleaseDatetime(releaseDT).
		Save(ctx)
	if err != nil {
		if isUniqueViolation(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Schedule entry with this anime and episode already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create schedule entry"})
		return
	}

	withAnime, err := app.Ent.Schedule.Query().Where(schedule.IDEQ(created.ID)).WithAnime(func(q *ent.AnimeQuery) {
		q.Select(anime.FieldID, anime.FieldName, anime.FieldURL, anime.FieldImage)
	}).Only(ctx)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"id": created.ID})
		return
	}

	if withAnime.Edges.Anime != nil {
		c.JSON(http.StatusCreated, mapScheduleItem(withAnime,
			map[int64]string{withAnime.Edges.Anime.ID: getAnimeTitleByCode(withAnime.Edges.Anime.ID, "ru")},
			map[int64]string{withAnime.Edges.Anime.ID: getAnimeTitleByCode(withAnime.Edges.Anime.ID, "en")},
		))
		return
	}
	c.JSON(http.StatusCreated, mapScheduleItem(withAnime, nil, nil))
}

func AdminUpdateSchedule(c *gin.Context) {
	id64, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id64 <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid schedule id"})
		return
	}

	var input AdminUpdateScheduleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.EpisodeNumber <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "episode_number must be positive"})
		return
	}
	datePart := strings.TrimSpace(input.ReleaseDate)
	timePart := strings.TrimSpace(input.ReleaseTime)
	if datePart == "" || timePart == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "release_date and release_time are required"})
		return
	}

	loc, _ := mustScheduleLocation()
	releaseDT, err := time.ParseInLocation("2006-01-02 15:04", datePart+" "+timePart, loc)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date/time. Use YYYY-MM-DD and 24h HH:MM"})
		return
	}
	releaseDT = releaseDT.UTC().Truncate(time.Minute)

	var a models.Anime
	if err := app.DB.Preload("Status").First(&a, input.AnimeID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Anime not found"})
		return
	}
	if a.Status == nil || strings.ToLower(strings.TrimSpace(a.Status.Name)) != "ongoing" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only ongoing anime can be scheduled"})
		return
	}

	ctx := c.Request.Context()
	_, err = app.Ent.Schedule.
		UpdateOneID(id64).
		SetAnimeID(input.AnimeID).
		SetEpisodeNumber(input.EpisodeNumber).
		SetReleaseDatetime(releaseDT).
		Save(ctx)
	if err != nil {
		if isUniqueViolation(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Schedule entry with this release_datetime already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update schedule entry"})
		return
	}

	withAnime, err := app.Ent.Schedule.Query().Where(schedule.IDEQ(id64)).WithAnime(func(q *ent.AnimeQuery) {
		q.Select(anime.FieldID, anime.FieldName, anime.FieldURL, anime.FieldImage)
	}).Only(ctx)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"id": id64})
		return
	}

	if withAnime.Edges.Anime != nil {
		c.JSON(http.StatusOK, mapScheduleItem(withAnime,
			map[int64]string{withAnime.Edges.Anime.ID: getAnimeTitleByCode(withAnime.Edges.Anime.ID, "ru")},
			map[int64]string{withAnime.Edges.Anime.ID: getAnimeTitleByCode(withAnime.Edges.Anime.ID, "en")},
		))
		return
	}
	c.JSON(http.StatusOK, mapScheduleItem(withAnime, nil, nil))
}

func getAnimeTitleByCode(animeID int64, code string) string {
	if animeID <= 0 {
		return ""
	}
	code = strings.TrimSpace(code)
	if code == "" {
		return ""
	}
	type row struct {
		Title string `gorm:"column:title"`
	}
	var out row
	_ = app.DB.Table("anime_translations as at").
		Select("at.title").
		Joins("join languages l on l.id = at.language_id").
		Where("l.code = ? AND at.anime_id = ?", code, animeID).
		Limit(1).
		Scan(&out).Error
	return out.Title
}

func AdminDeleteSchedule(c *gin.Context) {
	id64, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id64 <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid schedule id"})
		return
	}
	ctx := c.Request.Context()
	if err := app.Ent.Schedule.DeleteOneID(id64).Exec(ctx); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

func AdminPurgeOldSchedules(c *gin.Context) {
	roleAny, _ := c.Get("role")
	role, _ := roleAny.(string)
	if role != "root" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Root access required"})
		return
	}

	cutoff := time.Now().UTC().AddDate(0, -1, 0).Truncate(time.Minute)
	ctx := c.Request.Context()
	deleted, err := app.Ent.Schedule.Delete().Where(schedule.ReleaseDatetimeLT(cutoff)).Exec(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to purge schedules"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"deleted_count": deleted})
}

func parseScheduleRange(c *gin.Context) (time.Time, time.Time, bool) {
	fromStr := strings.TrimSpace(c.Query("from"))
	toStr := strings.TrimSpace(c.Query("to"))
	if fromStr == "" || toStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "from and to are required (YYYY-MM-DD)"})
		return time.Time{}, time.Time{}, false
	}
	loc, _ := mustScheduleLocation()
	fromLocal, err := time.ParseInLocation("2006-01-02", fromStr, loc)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid from date"})
		return time.Time{}, time.Time{}, false
	}
	toLocal, err := time.ParseInLocation("2006-01-02", toStr, loc)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid to date"})
		return time.Time{}, time.Time{}, false
	}
	toExclusiveLocal := toLocal.AddDate(0, 0, 1)
	return fromLocal.UTC(), toExclusiveLocal.UTC(), true
}

func queryScheduleRange(ctx context.Context, client *ent.Client, from time.Time, toExclusive time.Time) ([]ScheduleItemDTO, error) {
	rows, err := client.Schedule.
		Query().
		Where(
			schedule.ReleaseDatetimeGTE(from),
			schedule.ReleaseDatetimeLT(toExclusive),
		).
		Order(ent.Asc(schedule.FieldReleaseDatetime)).
		WithAnime(func(q *ent.AnimeQuery) {
			q.Select(anime.FieldID, anime.FieldName, anime.FieldURL, anime.FieldImage)
		}).
		All(ctx)
	if err != nil {
		return nil, err
	}

	ruTitles := map[int64]string{}
	enTitles := map[int64]string{}
	animeIDs := make([]int64, 0, len(rows))
	seen := map[int64]struct{}{}
	for _, r := range rows {
		if r.Edges.Anime != nil {
			id := r.Edges.Anime.ID
			if _, ok := seen[id]; !ok {
				seen[id] = struct{}{}
				animeIDs = append(animeIDs, id)
			}
		}
	}
	if len(animeIDs) > 0 {
		type row struct {
			AnimeID int64  `gorm:"column:anime_id"`
			Title   string `gorm:"column:title"`
			Code    string `gorm:"column:code"`
		}
		var trs []row
		_ = app.DB.Table("anime_translations as at").
			Select("at.anime_id, at.title, l.code as code").
			Joins("join languages l on l.id = at.language_id").
			Where("l.code IN ('ru','en') AND at.anime_id IN ?", animeIDs).
			Scan(&trs).Error
		for _, trow := range trs {
			if trow.Code == "ru" {
				ruTitles[trow.AnimeID] = trow.Title
			}
			if trow.Code == "en" {
				enTitles[trow.AnimeID] = trow.Title
			}
		}
	}

	items := make([]ScheduleItemDTO, 0, len(rows))
	for _, r := range rows {
		items = append(items, mapScheduleItem(r, ruTitles, enTitles))
	}
	return items, nil
}

func mapScheduleItem(s *ent.Schedule, ruTitles map[int64]string, enTitles map[int64]string) ScheduleItemDTO {
	var dto ScheduleItemDTO
	dto.ID = s.ID
	dto.ReleaseDatetime = s.ReleaseDatetime.UTC().Truncate(time.Minute)
	dto.EpisodeNumber = s.EpisodeNumber
	if s.Edges.Anime != nil {
		dto.Anime.ID = s.Edges.Anime.ID
		dto.Anime.Name = s.Edges.Anime.Name
		if ruTitles != nil {
			if v, ok := ruTitles[s.Edges.Anime.ID]; ok {
				dto.Anime.Russian = v
			}
		}
		if enTitles != nil {
			if v, ok := enTitles[s.Edges.Anime.ID]; ok {
				dto.Anime.English = v
			}
		}
		dto.Anime.URL = s.Edges.Anime.URL
		dto.Anime.Image = s.Edges.Anime.Image
	}
	return dto
}

func isUniqueViolation(err error) bool {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) {
		return string(pqErr.Code) == "23505"
	}
	return false
}
