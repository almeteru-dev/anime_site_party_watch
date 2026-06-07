package handlers

import (
	"sync"

	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
)

var ukLangMu sync.Mutex
var ukLangID int

func getUkLanguageID() (int, error) {
	ukLangMu.Lock()
	defer ukLangMu.Unlock()

	if ukLangID != 0 {
		return ukLangID, nil
	}

	var lang models.Language
	if err := app.DB.Where("code = ?", "uk").First(&lang).Error; err != nil {
		return 0, err
	}
	ukLangID = lang.ID
	return ukLangID, nil
}

func setStatusUKName(statusID int, ukName *string) error {
	ukID, err := getUkLanguageID()
	if err != nil {
		return err
	}
	n := normalizeOptionalName(ukName)
	if n == nil {
		return app.DB.Where("status_id = ? AND language_id = ?", statusID, ukID).Delete(&models.StatusTranslation{}).Error
	}
	return app.DB.Where("status_id = ? AND language_id = ?", statusID, ukID).
		Assign(models.StatusTranslation{Name: *n}).
		FirstOrCreate(&models.StatusTranslation{StatusID: statusID, LanguageID: ukID}).
		Error
}

func setSourceUKName(sourceID int, ukName *string) error {
	ukID, err := getUkLanguageID()
	if err != nil {
		return err
	}
	n := normalizeOptionalName(ukName)
	if n == nil {
		return app.DB.Where("source_id = ? AND language_id = ?", sourceID, ukID).Delete(&models.SourceTranslation{}).Error
	}
	return app.DB.Where("source_id = ? AND language_id = ?", sourceID, ukID).
		Assign(models.SourceTranslation{Name: *n}).
		FirstOrCreate(&models.SourceTranslation{SourceID: sourceID, LanguageID: ukID}).
		Error
}

func setStudioUKName(studioID int, ukName *string) error {
	ukID, err := getUkLanguageID()
	if err != nil {
		return err
	}
	n := normalizeOptionalName(ukName)
	if n == nil {
		return app.DB.Where("studio_id = ? AND language_id = ?", studioID, ukID).Delete(&models.StudioTranslation{}).Error
	}
	return app.DB.Where("studio_id = ? AND language_id = ?", studioID, ukID).
		Assign(models.StudioTranslation{Name: *n}).
		FirstOrCreate(&models.StudioTranslation{StudioID: studioID, LanguageID: ukID}).
		Error
}

func setGenreUKName(genreID int, ukName *string, ukDescription *string) error {
	ukID, err := getUkLanguageID()
	if err != nil {
		return err
	}
	n := normalizeOptionalName(ukName)
	d := normalizeOptionalName(ukDescription)
	if n == nil && d == nil {
		return app.DB.Where("genre_id = ? AND language_id = ?", genreID, ukID).Delete(&models.GenreTranslation{}).Error
	}
	nameToStore := ""
	if n != nil {
		nameToStore = *n
	} else {
		var tr models.GenreTranslation
		if err := app.DB.Where("genre_id = ? AND language_id = ?", genreID, ukID).First(&tr).Error; err == nil {
			nameToStore = tr.Name
		}
		if nameToStore == "" {
			var g models.Genre
			_ = app.DB.Select("name").First(&g, genreID).Error
			nameToStore = g.Name
		}
	}
	return app.DB.Where("genre_id = ? AND language_id = ?", genreID, ukID).
		Assign(map[string]any{"name": nameToStore, "description": d}).
		FirstOrCreate(&models.GenreTranslation{GenreID: genreID, LanguageID: ukID}).
		Error
}

func setThemeUKName(themeID int, ukName *string, ukDescription *string) error {
	ukID, err := getUkLanguageID()
	if err != nil {
		return err
	}
	n := normalizeOptionalName(ukName)
	d := normalizeOptionalName(ukDescription)
	if n == nil && d == nil {
		return app.DB.Where("theme_id = ? AND language_id = ?", themeID, ukID).Delete(&models.ThemeTranslation{}).Error
	}
	nameToStore := ""
	if n != nil {
		nameToStore = *n
	} else {
		var tr models.ThemeTranslation
		if err := app.DB.Where("theme_id = ? AND language_id = ?", themeID, ukID).First(&tr).Error; err == nil {
			nameToStore = tr.Name
		}
		if nameToStore == "" {
			var th models.Theme
			_ = app.DB.Select("name").First(&th, themeID).Error
			nameToStore = th.Name
		}
	}
	return app.DB.Where("theme_id = ? AND language_id = ?", themeID, ukID).
		Assign(map[string]any{"name": nameToStore, "description": d}).
		FirstOrCreate(&models.ThemeTranslation{ThemeID: themeID, LanguageID: ukID}).
		Error
}

type ukRefTranslation struct {
	ID          int
	Name        string
	Description *string
}

func applyStatusUK(items []models.Status) error {
	ukID, err := getUkLanguageID()
	if err != nil {
		return err
	}
	ids := make([]int, 0, len(items))
	for _, it := range items {
		ids = append(ids, it.ID)
	}
	if len(ids) == 0 {
		return nil
	}
	var trs []models.StatusTranslation
	if err := app.DB.Where("language_id = ? AND status_id IN ?", ukID, ids).Find(&trs).Error; err != nil {
		return err
	}
	m := map[int]string{}
	for _, tr := range trs {
		m[tr.StatusID] = tr.Name
	}
	for i := range items {
		if v, ok := m[items[i].ID]; ok && v != "" {
			vv := v
			items[i].UKName = &vv
		}
	}
	return nil
}

func applySourceUK(items []models.Source) error {
	ukID, err := getUkLanguageID()
	if err != nil {
		return err
	}
	ids := make([]int, 0, len(items))
	for _, it := range items {
		ids = append(ids, it.ID)
	}
	if len(ids) == 0 {
		return nil
	}
	var trs []models.SourceTranslation
	if err := app.DB.Where("language_id = ? AND source_id IN ?", ukID, ids).Find(&trs).Error; err != nil {
		return err
	}
	m := map[int]string{}
	for _, tr := range trs {
		m[tr.SourceID] = tr.Name
	}
	for i := range items {
		if v, ok := m[items[i].ID]; ok && v != "" {
			vv := v
			items[i].UKName = &vv
		}
	}
	return nil
}

func applyStudioUK(items []models.Studio) error {
	ukID, err := getUkLanguageID()
	if err != nil {
		return err
	}
	ids := make([]int, 0, len(items))
	for _, it := range items {
		ids = append(ids, it.ID)
	}
	if len(ids) == 0 {
		return nil
	}
	var trs []models.StudioTranslation
	if err := app.DB.Where("language_id = ? AND studio_id IN ?", ukID, ids).Find(&trs).Error; err != nil {
		return err
	}
	m := map[int]string{}
	for _, tr := range trs {
		m[tr.StudioID] = tr.Name
	}
	for i := range items {
		if v, ok := m[items[i].ID]; ok && v != "" {
			vv := v
			items[i].UKName = &vv
		}
	}
	return nil
}

func applyGenreUK(items []models.Genre) error {
	ukID, err := getUkLanguageID()
	if err != nil {
		return err
	}
	ids := make([]int, 0, len(items))
	for _, it := range items {
		ids = append(ids, it.ID)
	}
	if len(ids) == 0 {
		return nil
	}
	var trs []models.GenreTranslation
	if err := app.DB.Where("language_id = ? AND genre_id IN ?", ukID, ids).Find(&trs).Error; err != nil {
		return err
	}
	m := map[int]ukRefTranslation{}
	for _, tr := range trs {
		m[tr.GenreID] = ukRefTranslation{ID: tr.GenreID, Name: tr.Name, Description: tr.Description}
	}
	for i := range items {
		if tr, ok := m[items[i].ID]; ok {
			if tr.Name != "" {
				vv := tr.Name
				items[i].UKName = &vv
			}
			items[i].DescriptionUK = tr.Description
		}
	}
	return nil
}

func applyThemeUK(items []models.Theme) error {
	ukID, err := getUkLanguageID()
	if err != nil {
		return err
	}
	ids := make([]int, 0, len(items))
	for _, it := range items {
		ids = append(ids, it.ID)
	}
	if len(ids) == 0 {
		return nil
	}
	var trs []models.ThemeTranslation
	if err := app.DB.Where("language_id = ? AND theme_id IN ?", ukID, ids).Find(&trs).Error; err != nil {
		return err
	}
	m := map[int]ukRefTranslation{}
	for _, tr := range trs {
		m[tr.ThemeID] = ukRefTranslation{ID: tr.ThemeID, Name: tr.Name, Description: tr.Description}
	}
	for i := range items {
		if tr, ok := m[items[i].ID]; ok {
			if tr.Name != "" {
				vv := tr.Name
				items[i].UKName = &vv
			}
			items[i].DescriptionUK = tr.Description
		}
	}
	return nil
}

func hydrateAnimeRefsUK(animes []models.Anime) error {
	ukID, err := getUkLanguageID()
	if err != nil {
		return err
	}

	statusIDs := map[int]struct{}{}
	sourceIDs := map[int]struct{}{}
	studioIDs := map[int]struct{}{}
	genreIDs := map[int]struct{}{}
	themeIDs := map[int]struct{}{}
	kinds := map[string]struct{}{}
	ratings := map[string]struct{}{}

	for _, a := range animes {
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
		for _, th := range a.Themes {
			themeIDs[th.ID] = struct{}{}
		}
		if a.Kind != "" {
			kinds[a.Kind] = struct{}{}
		}
		if a.Rating != "" {
			ratings[a.Rating] = struct{}{}
		}
	}

	toIntSlice := func(m map[int]struct{}) []int {
		out := make([]int, 0, len(m))
		for id := range m {
			out = append(out, id)
		}
		return out
	}

	statusUK := map[int]string{}
	if ids := toIntSlice(statusIDs); len(ids) > 0 {
		var trs []models.StatusTranslation
		if err := app.DB.Where("language_id = ? AND status_id IN ?", ukID, ids).Find(&trs).Error; err != nil {
			return err
		}
		for _, tr := range trs {
			statusUK[tr.StatusID] = tr.Name
		}
	}

	sourceUK := map[int]string{}
	if ids := toIntSlice(sourceIDs); len(ids) > 0 {
		var trs []models.SourceTranslation
		if err := app.DB.Where("language_id = ? AND source_id IN ?", ukID, ids).Find(&trs).Error; err != nil {
			return err
		}
		for _, tr := range trs {
			sourceUK[tr.SourceID] = tr.Name
		}
	}

	studioUK := map[int]string{}
	if ids := toIntSlice(studioIDs); len(ids) > 0 {
		var trs []models.StudioTranslation
		if err := app.DB.Where("language_id = ? AND studio_id IN ?", ukID, ids).Find(&trs).Error; err != nil {
			return err
		}
		for _, tr := range trs {
			studioUK[tr.StudioID] = tr.Name
		}
	}

	genreUK := map[int]ukRefTranslation{}
	if ids := toIntSlice(genreIDs); len(ids) > 0 {
		var trs []models.GenreTranslation
		if err := app.DB.Where("language_id = ? AND genre_id IN ?", ukID, ids).Find(&trs).Error; err != nil {
			return err
		}
		for _, tr := range trs {
			genreUK[tr.GenreID] = ukRefTranslation{ID: tr.GenreID, Name: tr.Name, Description: tr.Description}
		}
	}

	themeUK := map[int]ukRefTranslation{}
	if ids := toIntSlice(themeIDs); len(ids) > 0 {
		var trs []models.ThemeTranslation
		if err := app.DB.Where("language_id = ? AND theme_id IN ?", ukID, ids).Find(&trs).Error; err != nil {
			return err
		}
		for _, tr := range trs {
			themeUK[tr.ThemeID] = ukRefTranslation{ID: tr.ThemeID, Name: tr.Name, Description: tr.Description}
		}
	}

	kindUK := map[string]string{}
	if len(kinds) > 0 {
		kindKeys := make([]string, 0, len(kinds))
		for k := range kinds {
			kindKeys = append(kindKeys, k)
		}
		var opts []models.KindOption
		if err := app.DB.Where("name IN ?", kindKeys).Find(&opts).Error; err != nil {
			return err
		}
		for _, o := range opts {
			if o.UKName != nil && *o.UKName != "" {
				kindUK[o.Name] = *o.UKName
			}
		}
	}

	ratingDesc := map[string]models.RatingOption{}
	if len(ratings) > 0 {
		ratingKeys := make([]string, 0, len(ratings))
		for r := range ratings {
			ratingKeys = append(ratingKeys, r)
		}
		var opts []models.RatingOption
		if err := app.DB.Where("name IN ?", ratingKeys).Find(&opts).Error; err != nil {
			return err
		}
		for _, o := range opts {
			ratingDesc[o.Name] = o
		}
	}

	for i := range animes {
		a := &animes[i]
		if a.Kind != "" {
			if v, ok := kindUK[a.Kind]; ok {
				vv := v
				a.KindUKName = &vv
			}
		}
		if a.Status != nil {
			if v, ok := statusUK[a.Status.ID]; ok {
				vv := v
				a.Status.UKName = &vv
			}
		}
		if a.Source != nil {
			if v, ok := sourceUK[a.Source.ID]; ok {
				vv := v
				a.Source.UKName = &vv
			}
		}
		if a.Studio != nil {
			if v, ok := studioUK[a.Studio.ID]; ok {
				vv := v
				a.Studio.UKName = &vv
			}
		}
		for j := range a.Genres {
			if tr, ok := genreUK[a.Genres[j].ID]; ok {
				if tr.Name != "" {
					vv := tr.Name
					a.Genres[j].UKName = &vv
				}
				a.Genres[j].DescriptionUK = tr.Description
			}
		}
		for j := range a.Themes {
			if tr, ok := themeUK[a.Themes[j].ID]; ok {
				if tr.Name != "" {
					vv := tr.Name
					a.Themes[j].UKName = &vv
				}
				a.Themes[j].DescriptionUK = tr.Description
			}
		}
		if a.Rating != "" {
			if o, ok := ratingDesc[a.Rating]; ok {
				a.RatingDescriptionEN = o.DescriptionEN
				a.RatingDescriptionUK = o.DescriptionUK
			}
		}
	}

	return nil
}

