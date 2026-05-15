package handlers

import (
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
	"github.com/seva/animevista/internal/validation"
	"gorm.io/gorm/clause"
)

type AdminSetDefaultPasswordInput struct {
	Password string `json:"password" binding:"required"`
}

type AdminSetPrivateModeInput struct {
	Enabled bool `json:"enabled"`
}

type AdminSetRegistrationDisabledInput struct {
	Enabled bool `json:"enabled"`
}

type AdminSetScheduleTimezoneInput struct {
	Timezone string `json:"timezone" binding:"required"`
}

const scheduleTimezoneSettingKey = "schedule_timezone"

const defaultScheduleTimezone = "Etc/GMT-5"

var utcOffsetTZRe = regexp.MustCompile(`^(?:UTC|GMT)([+-])(\d{1,2})(?::?(\d{2}))?$`)

func AdminSetDefaultPassword(c *gin.Context) {
	roleAny, _ := c.Get("role")
	role, _ := roleAny.(string)
	if role != "root" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Root access required"})
		return
	}

	var input AdminSetDefaultPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	password := strings.TrimSpace(input.Password)
	if err := validation.ValidatePassword(password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	setting := models.AppSetting{Key: "default_password", Value: password, UpdatedAt: time.Now()}
	if err := app.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "key"}},
		DoUpdates: clause.AssignmentColumns([]string{"value", "updated_at"}),
	}).Create(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update default password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Updated"})
}

func getDefaultPassword() string {
	const fallback = "LycorisLib$1"
	var s models.AppSetting
	if err := app.DB.First(&s, "key = ?", "default_password").Error; err != nil {
		return fallback
	}
	if strings.TrimSpace(s.Value) == "" {
		return fallback
	}
	return s.Value
}

func getScheduleTimezone() string {
	const fallback = defaultScheduleTimezone
	var s models.AppSetting
	if err := app.DB.First(&s, "key = ?", scheduleTimezoneSettingKey).Error; err != nil {
		return fallback
	}
	val := strings.TrimSpace(s.Value)
	if val == "" {
		return fallback
	}
	if normalized, ok := normalizeScheduleTimezoneValue(val); ok {
		return normalized
	}
	if _, _, err := loadScheduleLocation(val); err == nil {
		return val
	}
	return fallback
}

func normalizeScheduleTimezoneValue(tz string) (string, bool) {
	trimmed := strings.TrimSpace(tz)
	if trimmed == "" {
		return defaultScheduleTimezone, true
	}
	if strings.EqualFold(trimmed, "utc") || strings.EqualFold(trimmed, "etc/utc") || strings.EqualFold(trimmed, "etc/gmt") {
		return "UTC", true
	}
	if isAllowedScheduleTimezone(trimmed) {
		return trimmed, true
	}
	if m := utcOffsetTZRe.FindStringSubmatch(strings.ToUpper(trimmed)); m != nil {
		sign := m[1]
		hours, _ := strconv.Atoi(m[2])
		mins := 0
		if m[3] != "" {
			mins, _ = strconv.Atoi(m[3])
		}
		if mins != 0 {
			return "", false
		}
		if sign == "+" {
			if hours == 0 {
				return "UTC", true
			}
			if hours >= 1 && hours <= 12 {
				return "Etc/GMT-" + strconv.Itoa(hours), true
			}
		}
		if sign == "-" {
			if hours >= 1 && hours <= 11 {
				return "Etc/GMT+" + strconv.Itoa(hours), true
			}
		}
	}
	return "", false
}

func isAllowedScheduleTimezone(tz string) bool {
	if tz == "UTC" {
		return true
	}
	if strings.HasPrefix(tz, "Etc/GMT-") {
		n, err := strconv.Atoi(strings.TrimPrefix(tz, "Etc/GMT-"))
		return err == nil && n >= 1 && n <= 12
	}
	if strings.HasPrefix(tz, "Etc/GMT+") {
		n, err := strconv.Atoi(strings.TrimPrefix(tz, "Etc/GMT+"))
		return err == nil && n >= 1 && n <= 11
	}
	return false
}

func loadScheduleLocation(tz string) (*time.Location, string, error) {
	trimmed := strings.TrimSpace(tz)
	if trimmed == "" {
		return time.UTC, "UTC", nil
	}
	if strings.EqualFold(trimmed, "utc") {
		return time.UTC, "UTC", nil
	}
	if loc, err := time.LoadLocation(trimmed); err == nil {
		return loc, trimmed, nil
	}

	m := utcOffsetTZRe.FindStringSubmatch(strings.ToUpper(trimmed))
	if m == nil {
		return nil, "", errors.New("invalid timezone")
	}
	sign := m[1]
	hours, _ := strconv.Atoi(m[2])
	mins := 0
	if m[3] != "" {
		mins, _ = strconv.Atoi(m[3])
	}
	if hours > 14 || mins > 59 {
		return nil, "", errors.New("invalid timezone")
	}
	offset := hours*3600 + mins*60
	if sign == "-" {
		offset = -offset
	}
	return time.FixedZone(trimmed, offset), trimmed, nil
}

func mustScheduleLocation() (*time.Location, string) {
	tz := getScheduleTimezone()
	loc, normalized, err := loadScheduleLocation(tz)
	if err != nil {
		return time.UTC, "UTC"
	}
	return loc, normalized
}

func recalcScheduleUTC(oldUTC time.Time, oldLoc *time.Location, newLoc *time.Location) time.Time {
	oldLocal := oldUTC.In(oldLoc)
	newLocal := time.Date(oldLocal.Year(), oldLocal.Month(), oldLocal.Day(), oldLocal.Hour(), oldLocal.Minute(), 0, 0, newLoc)
	return newLocal.UTC().Truncate(time.Minute)
}

func AdminSetScheduleTimezone(c *gin.Context) {
	roleAny, _ := c.Get("role")
	role, _ := roleAny.(string)
	if role != "root" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Root access required"})
		return
	}

	var input AdminSetScheduleTimezoneInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	normalized, ok := normalizeScheduleTimezoneValue(input.Timezone)
	if !ok || !isAllowedScheduleTimezone(normalized) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid timezone"})
		return
	}

	newLoc, newTz, err := loadScheduleLocation(normalized)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid timezone"})
		return
	}

	oldTz := getScheduleTimezone()
	oldLoc, _, _ := loadScheduleLocation(oldTz)
	if oldLoc == nil {
		oldLoc = time.UTC
		oldTz = "UTC"
	}

	if strings.EqualFold(strings.TrimSpace(oldTz), strings.TrimSpace(newTz)) {
		c.JSON(http.StatusOK, gin.H{"message": "No change", "timezone": oldTz, "recalculated": 0})
		return
	}

	ctx := c.Request.Context()
	dbTx := app.DB.Begin()
	if dbTx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer func() {
		_ = dbTx.Rollback().Error
	}()

	tx, err := app.Ent.Tx(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer func() {
		_ = tx.Rollback()
	}()

	rows, err := tx.Schedule.Query().All(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load schedules"})
		return
	}

	newTimes := make(map[int64]time.Time, len(rows))
	seen := make(map[int64]int64, len(rows))
	for _, s := range rows {
		newUTC := recalcScheduleUTC(s.ReleaseDatetime, oldLoc, newLoc)
		newTimes[s.ID] = newUTC
		key := newUTC.Unix()
		if prev, ok := seen[key]; ok {
			c.JSON(http.StatusConflict, gin.H{"error": "Timezone change would create duplicate release times", "conflict_ids": []int64{prev, s.ID}})
			return
		}
		seen[key] = s.ID
	}

	for id, dt := range newTimes {
		if _, err := tx.Schedule.UpdateOneID(id).SetReleaseDatetime(dt).Save(ctx); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to recalculate schedules"})
			return
		}
	}

	setting := models.AppSetting{Key: scheduleTimezoneSettingKey, Value: newTz, UpdatedAt: time.Now()}
	if err := dbTx.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "key"}},
		DoUpdates: clause.AssignmentColumns([]string{"value", "updated_at"}),
	}).Create(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to persist timezone setting"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit recalculation"})
		return
	}

	if err := dbTx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit timezone setting"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Updated",
		"old_timezone": oldTz,
		"timezone":     newTz,
		"recalculated": len(rows),
	})
}

func AdminSetPrivateMode(c *gin.Context) {
	roleAny, _ := c.Get("role")
	role, _ := roleAny.(string)
	if role != "root" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Root access required"})
		return
	}

	var input AdminSetPrivateModeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	val := "false"
	if input.Enabled {
		val = "true"
	}

	setting := models.AppSetting{Key: "private_mode", Value: val, UpdatedAt: time.Now()}
	if err := app.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "key"}},
		DoUpdates: clause.AssignmentColumns([]string{"value", "updated_at"}),
	}).Create(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update private mode"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Updated", "enabled": input.Enabled})
}

func AdminSetRegistrationDisabled(c *gin.Context) {
	roleAny, _ := c.Get("role")
	role, _ := roleAny.(string)
	if role != "root" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Root access required"})
		return
	}

	var input AdminSetRegistrationDisabledInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	val := "false"
	if input.Enabled {
		val = "true"
	}

	setting := models.AppSetting{Key: "registration_disabled", Value: val, UpdatedAt: time.Now()}
	if err := app.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "key"}},
		DoUpdates: clause.AssignmentColumns([]string{"value", "updated_at"}),
	}).Create(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update registration setting"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Updated", "enabled": input.Enabled})
}

func isRegistrationDisabled() bool {
	var s models.AppSetting
	if err := app.DB.First(&s, "key = ?", "registration_disabled").Error; err == nil {
		v := strings.TrimSpace(s.Value)
		return strings.EqualFold(v, "true") || v == "1"
	}
	return false
}

func GetPublicSettings(c *gin.Context) {
	enabled := false
	var s models.AppSetting
	if err := app.DB.First(&s, "key = ?", "private_mode").Error; err == nil {
		enabled = strings.EqualFold(strings.TrimSpace(s.Value), "true") || strings.TrimSpace(s.Value) == "1"
	}
	c.JSON(http.StatusOK, gin.H{
		"private_mode":          enabled,
		"registration_disabled": isRegistrationDisabled(),
		"schedule_timezone":     getScheduleTimezone(),
		"footer_contact_url":    getFooterContactURL(),
		"footer_social_links":   getFooterSocialLinks(),
		"kodik_geoblock":        getKodikGeoblock(),
		"kodik_hide_selectors":  getKodikHideSelectors(),
		"kodik_skip_enabled":    getKodikSkipEnabled(),
		"kodik_skip_value":      getKodikSkipValue(),
	})
}
