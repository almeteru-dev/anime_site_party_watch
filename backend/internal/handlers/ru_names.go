package handlers

import (
	"strings"
	"sync"

	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
)

var ruLangMu sync.Mutex
var ruLangID int

func getRuLanguageID() (int, error) {
	ruLangMu.Lock()
	defer ruLangMu.Unlock()

	if ruLangID != 0 {
		return ruLangID, nil
	}

	var lang models.Language
	if err := app.DB.Where("code = ?", "ru").First(&lang).Error; err != nil {
		return 0, err
	}
	ruLangID = lang.ID
	return ruLangID, nil
}

func normalizeOptionalName(v *string) *string {
	if v == nil {
		return nil
	}
	s := strings.TrimSpace(*v)
	if s == "" {
		return nil
	}
	return &s
}

func setStatusRUName(statusID int, ruName *string) error {
	ruID, err := getRuLanguageID()
	if err != nil {
		return err
	}
	n := normalizeOptionalName(ruName)
	if n == nil {
		return app.DB.Where("status_id = ? AND language_id = ?", statusID, ruID).Delete(&models.StatusTranslation{}).Error
	}
	return app.DB.Where("status_id = ? AND language_id = ?", statusID, ruID).
		Assign(models.StatusTranslation{Name: *n}).
		FirstOrCreate(&models.StatusTranslation{StatusID: statusID, LanguageID: ruID}).
		Error
}

func setSourceRUName(sourceID int, ruName *string) error {
	ruID, err := getRuLanguageID()
	if err != nil {
		return err
	}
	n := normalizeOptionalName(ruName)
	if n == nil {
		return app.DB.Where("source_id = ? AND language_id = ?", sourceID, ruID).Delete(&models.SourceTranslation{}).Error
	}
	return app.DB.Where("source_id = ? AND language_id = ?", sourceID, ruID).
		Assign(models.SourceTranslation{Name: *n}).
		FirstOrCreate(&models.SourceTranslation{SourceID: sourceID, LanguageID: ruID}).
		Error
}

func setGenreRUName(genreID int, ruName *string) error {
	ruID, err := getRuLanguageID()
	if err != nil {
		return err
	}
	n := normalizeOptionalName(ruName)
	if n == nil {
		return app.DB.Where("genre_id = ? AND language_id = ?", genreID, ruID).Delete(&models.GenreTranslation{}).Error
	}
	return app.DB.Where("genre_id = ? AND language_id = ?", genreID, ruID).
		Assign(models.GenreTranslation{Name: *n}).
		FirstOrCreate(&models.GenreTranslation{GenreID: genreID, LanguageID: ruID}).
		Error
}

func setStudioRUName(studioID int, ruName *string) error {
	ruID, err := getRuLanguageID()
	if err != nil {
		return err
	}
	n := normalizeOptionalName(ruName)
	if n == nil {
		return app.DB.Where("studio_id = ? AND language_id = ?", studioID, ruID).Delete(&models.StudioTranslation{}).Error
	}
	return app.DB.Where("studio_id = ? AND language_id = ?", studioID, ruID).
		Assign(models.StudioTranslation{Name: *n}).
		FirstOrCreate(&models.StudioTranslation{StudioID: studioID, LanguageID: ruID}).
		Error
}

func setThemeRUName(themeID int, ruName *string) error {
	ruID, err := getRuLanguageID()
	if err != nil {
		return err
	}
	n := normalizeOptionalName(ruName)
	if n == nil {
		return app.DB.Where("theme_id = ? AND language_id = ?", themeID, ruID).Delete(&models.ThemeTranslation{}).Error
	}
	return app.DB.Where("theme_id = ? AND language_id = ?", themeID, ruID).
		Assign(models.ThemeTranslation{Name: *n}).
		FirstOrCreate(&models.ThemeTranslation{ThemeID: themeID, LanguageID: ruID}).
		Error
}

func applyStatusRU(items []models.Status) error {
	ids := make([]int, 0, len(items))
	for _, it := range items {
		ids = append(ids, it.ID)
	}
	if len(ids) == 0 {
		return nil
	}
	ruID, err := getRuLanguageID()
	if err != nil {
		return err
	}
	var trs []models.StatusTranslation
	if err := app.DB.Where("language_id = ? AND status_id IN ?", ruID, ids).Find(&trs).Error; err != nil {
		return err
	}
	lookup := make(map[int]string, len(trs))
	for _, tr := range trs {
		lookup[tr.StatusID] = tr.Name
	}
	for i := range items {
		if v, ok := lookup[items[i].ID]; ok {
			vv := v
			items[i].RUName = &vv
		}
	}
	return nil
}

func applySourceRU(items []models.Source) error {
	ids := make([]int, 0, len(items))
	for _, it := range items {
		ids = append(ids, it.ID)
	}
	if len(ids) == 0 {
		return nil
	}
	ruID, err := getRuLanguageID()
	if err != nil {
		return err
	}
	var trs []models.SourceTranslation
	if err := app.DB.Where("language_id = ? AND source_id IN ?", ruID, ids).Find(&trs).Error; err != nil {
		return err
	}
	lookup := make(map[int]string, len(trs))
	for _, tr := range trs {
		lookup[tr.SourceID] = tr.Name
	}
	for i := range items {
		if v, ok := lookup[items[i].ID]; ok {
			vv := v
			items[i].RUName = &vv
		}
	}
	return nil
}

func applyGenreRU(items []models.Genre) error {
	ids := make([]int, 0, len(items))
	for _, it := range items {
		ids = append(ids, it.ID)
	}
	if len(ids) == 0 {
		return nil
	}
	ruID, err := getRuLanguageID()
	if err != nil {
		return err
	}
	var trs []models.GenreTranslation
	if err := app.DB.Where("language_id = ? AND genre_id IN ?", ruID, ids).Find(&trs).Error; err != nil {
		return err
	}
	lookup := make(map[int]string, len(trs))
	for _, tr := range trs {
		lookup[tr.GenreID] = tr.Name
	}
	for i := range items {
		if v, ok := lookup[items[i].ID]; ok {
			vv := v
			items[i].RUName = &vv
		}
	}
	return nil
}

func applyStudioRU(items []models.Studio) error {
	ids := make([]int, 0, len(items))
	for _, it := range items {
		ids = append(ids, it.ID)
	}
	if len(ids) == 0 {
		return nil
	}
	ruID, err := getRuLanguageID()
	if err != nil {
		return err
	}
	var trs []models.StudioTranslation
	if err := app.DB.Where("language_id = ? AND studio_id IN ?", ruID, ids).Find(&trs).Error; err != nil {
		return err
	}
	lookup := make(map[int]string, len(trs))
	for _, tr := range trs {
		lookup[tr.StudioID] = tr.Name
	}
	for i := range items {
		if v, ok := lookup[items[i].ID]; ok {
			vv := v
			items[i].RUName = &vv
		}
	}
	return nil
}

func applyThemeRU(items []models.Theme) error {
	ids := make([]int, 0, len(items))
	for _, it := range items {
		ids = append(ids, it.ID)
	}
	if len(ids) == 0 {
		return nil
	}
	ruID, err := getRuLanguageID()
	if err != nil {
		return err
	}
	var trs []models.ThemeTranslation
	if err := app.DB.Where("language_id = ? AND theme_id IN ?", ruID, ids).Find(&trs).Error; err != nil {
		return err
	}
	lookup := make(map[int]string, len(trs))
	for _, tr := range trs {
		lookup[tr.ThemeID] = tr.Name
	}
	for i := range items {
		if v, ok := lookup[items[i].ID]; ok {
			vv := v
			items[i].RUName = &vv
		}
	}
	return nil
}

func hydrateAnimeRefsRU(animes []models.Anime) error {
	if len(animes) == 0 {
		return nil
	}
	ruID, err := getRuLanguageID()
	if err != nil {
		return err
	}

	statusIDs := make(map[int]struct{})
	sourceIDs := make(map[int]struct{})
	studioIDs := make(map[int]struct{})
	genreIDs := make(map[int]struct{})
	themeIDs := make(map[int]struct{})
	kindNames := make(map[string]struct{})

	for _, a := range animes {
		if a.Kind != "" {
			kindNames[a.Kind] = struct{}{}
		}
		if a.Status != nil {
			statusIDs[a.Status.ID] = struct{}{}
		}
		if a.Source != nil {
			sourceIDs[a.Source.ID] = struct{}{}
		}
		if a.Studio != nil {
			studioIDs[a.Studio.ID] = struct{}{}
		}
		for _, g := range a.Genres {
			genreIDs[g.ID] = struct{}{}
		}
		for _, t := range a.Themes {
			themeIDs[t.ID] = struct{}{}
		}
	}

	toSlice := func(m map[int]struct{}) []int {
		out := make([]int, 0, len(m))
		for id := range m {
			out = append(out, id)
		}
		return out
	}

	statusSlice := toSlice(statusIDs)
	sourceSlice := toSlice(sourceIDs)
	studioSlice := toSlice(studioIDs)
	genreSlice := toSlice(genreIDs)
	themeSlice := toSlice(themeIDs)
	kindSlice := make([]string, 0, len(kindNames))
	for k := range kindNames {
		kindSlice = append(kindSlice, k)
	}

	statusRU := map[int]string{}
	sourceRU := map[int]string{}
	studioRU := map[int]string{}
	genreRU := map[int]string{}
	themeRU := map[int]string{}
	kindRU := map[string]*string{}

	if len(statusSlice) > 0 {
		var trs []models.StatusTranslation
		if err := app.DB.Where("language_id = ? AND status_id IN ?", ruID, statusSlice).Find(&trs).Error; err != nil {
			return err
		}
		for _, tr := range trs {
			statusRU[tr.StatusID] = tr.Name
		}
	}
	if len(sourceSlice) > 0 {
		var trs []models.SourceTranslation
		if err := app.DB.Where("language_id = ? AND source_id IN ?", ruID, sourceSlice).Find(&trs).Error; err != nil {
			return err
		}
		for _, tr := range trs {
			sourceRU[tr.SourceID] = tr.Name
		}
	}
	if len(studioSlice) > 0 {
		var trs []models.StudioTranslation
		if err := app.DB.Where("language_id = ? AND studio_id IN ?", ruID, studioSlice).Find(&trs).Error; err != nil {
			return err
		}
		for _, tr := range trs {
			studioRU[tr.StudioID] = tr.Name
		}
	}
	if len(genreSlice) > 0 {
		var trs []models.GenreTranslation
		if err := app.DB.Where("language_id = ? AND genre_id IN ?", ruID, genreSlice).Find(&trs).Error; err != nil {
			return err
		}
		for _, tr := range trs {
			genreRU[tr.GenreID] = tr.Name
		}
	}
	if len(themeSlice) > 0 {
		var trs []models.ThemeTranslation
		if err := app.DB.Where("language_id = ? AND theme_id IN ?", ruID, themeSlice).Find(&trs).Error; err != nil {
			return err
		}
		for _, tr := range trs {
			themeRU[tr.ThemeID] = tr.Name
		}
	}
	if len(kindSlice) > 0 {
		var kinds []models.KindOption
		if err := app.DB.Select("name, ru_name").Where("name IN ?", kindSlice).Find(&kinds).Error; err != nil {
			if strings.Contains(err.Error(), "ru_name") {
				if err2 := app.DB.Select("name").Where("name IN ?", kindSlice).Find(&kinds).Error; err2 != nil {
					return err2
				}
			} else {
				return err
			}
		}
		for _, k := range kinds {
			kindRU[k.Name] = k.RUName
		}
	}

	for i := range animes {
		a := &animes[i]
		if a.Kind != "" {
			if v, ok := kindRU[a.Kind]; ok {
				a.KindRUName = v
			}
		}
		if a.Status != nil {
			if v, ok := statusRU[a.Status.ID]; ok {
				vv := v
				a.Status.RUName = &vv
			}
		}
		if a.Source != nil {
			if v, ok := sourceRU[a.Source.ID]; ok {
				vv := v
				a.Source.RUName = &vv
			}
		}
		if a.Studio != nil {
			if v, ok := studioRU[a.Studio.ID]; ok {
				vv := v
				a.Studio.RUName = &vv
			}
		}
		for j := range a.Genres {
			if v, ok := genreRU[a.Genres[j].ID]; ok {
				vv := v
				a.Genres[j].RUName = &vv
			}
		}
		for j := range a.Themes {
			if v, ok := themeRU[a.Themes[j].ID]; ok {
				vv := v
				a.Themes[j].RUName = &vv
			}
		}
	}

	return nil
}
