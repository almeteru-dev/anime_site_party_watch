package app

import (
	"log"
	"time"

	"github.com/seva/animevista/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Seed(db *gorm.DB) {
	log.Println("Seeding database...")

	defaultTrailer := "https://www.youtube.com/watch?v=I1Pk4UUJQg4"

	// 0. Clean-up: Ensure only the supported locales exist (RU + EN)
	var unsupported []models.Language
	db.Where("code NOT IN ?", []string{"ru", "en"}).Find(&unsupported)
	if len(unsupported) > 0 {
		ids := make([]int, 0, len(unsupported))
		for _, l := range unsupported {
			ids = append(ids, l.ID)
		}
		if len(ids) > 0 {
			db.Where("language_id IN ?", ids).Delete(&models.AnimeTranslation{})
			db.Where("language_id IN ?", ids).Delete(&models.StatusTranslation{})
			db.Where("language_id IN ?", ids).Delete(&models.SourceTranslation{})
			db.Where("language_id IN ?", ids).Delete(&models.StudioTranslation{})
			db.Where("language_id IN ?", ids).Delete(&models.GenreTranslation{})
			db.Where("language_id IN ?", ids).Delete(&models.CollectionTypeTranslation{})
			// episodes have no translations in the new schema
		}
		db.Where("code NOT IN ?", []string{"ru", "en"}).Delete(&models.Language{})
	}

	// 1. Languages
	languages := []models.Language{
		{Code: "ru", Name: "Russian"},
		{Code: "en", Name: "Romaji"},
	}
	for _, lang := range languages {
		db.FirstOrCreate(&lang, models.Language{Code: lang.Code})
	}

	var ru, en models.Language
	db.Where("code = ?", "ru").First(&ru)
	db.Where("code = ?", "en").First(&en)

	// 1.5. Admin User
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin"), bcrypt.DefaultCost)
	adminUser := models.User{
		Username:     "admin",
		Email:        "admin@lycoris.tv",
		PasswordHash: string(hashedPassword),
		Role:         "admin",
		IsVerified:   true,
	}
	db.FirstOrCreate(&adminUser, models.User{Email: "admin@lycoris.tv"})

	var rootCount int64
	db.Model(&models.User{}).Where("role = ?", "root").Count(&rootCount)
	if rootCount == 0 {
		db.Model(&models.User{}).Where("id = ?", adminUser.ID).Update("role", "root")
	}

	// 1.6. Collection Types
	collectionTypes := []struct {
		Name   string
		RUName string
		ENName string
	}{
		{Name: "watching", RUName: "Смотрю", ENName: "Watching"},
		{Name: "planned", RUName: "Запланировано", ENName: "Planned"},
		{Name: "completed", RUName: "Просмотрено", ENName: "Completed"},
		{Name: "on_hold", RUName: "На паузе", ENName: "On Hold"},
		{Name: "dropped", RUName: "Брошено", ENName: "Dropped"},
	}
	for _, ct := range collectionTypes {
		collectionType := models.CollectionType{Name: ct.Name}
		db.FirstOrCreate(&collectionType, models.CollectionType{Name: ct.Name})

		db.FirstOrCreate(&models.CollectionTypeTranslation{
			CollectionTypeID: collectionType.ID,
			LanguageID:       ru.ID,
			Name:             ct.RUName,
		}, models.CollectionTypeTranslation{CollectionTypeID: collectionType.ID, LanguageID: ru.ID})

		db.FirstOrCreate(&models.CollectionTypeTranslation{
			CollectionTypeID: collectionType.ID,
			LanguageID:       en.ID,
			Name:             ct.ENName,
		}, models.CollectionTypeTranslation{CollectionTypeID: collectionType.ID, LanguageID: en.ID})
	}

	// 1.7. Voice Groups
	voiceGroups := []models.VoiceGroup{
		{Name: "Anidub", Type: models.VoiceGroupTypeDub},
		{Name: "SoftBox", Type: models.VoiceGroupTypeDub},
		{Name: "Subbed", Type: models.VoiceGroupTypeSub},
	}
	for _, vg := range voiceGroups {
		db.FirstOrCreate(&vg, models.VoiceGroup{Name: vg.Name})
	}

	// 1.8. Video Labels
	{
		label := models.VideoLabel{Name: "Kodik", IsExternalPlayer: true}
		db.FirstOrCreate(&label, models.VideoLabel{Name: "Kodik"})
	}

	kTV := "Сериал"
	kMovie := "Фильм"
	kOVA := "OVA"
	kONA := "ONA"
	kSpecial := "Спешл"
	kinds := []models.KindOption{
		{Name: "tv", RUName: &kTV},
		{Name: "movie", RUName: &kMovie},
		{Name: "ova", RUName: &kOVA},
		{Name: "ona", RUName: &kONA},
		{Name: "special", RUName: &kSpecial},
	}
	for _, k := range kinds {
		var existing models.KindOption
		if err := db.Where("name = ?", k.Name).First(&existing).Error; err == nil {
			if existing.RUName == nil || *existing.RUName == "" {
				existing.RUName = k.RUName
				db.Save(&existing)
			}
			continue
		}
		db.FirstOrCreate(&k, models.KindOption{Name: k.Name})
	}

	ratings := []models.RatingOption{{Name: "g"}, {Name: "pg"}, {Name: "pg-13"}, {Name: "r-17+"}, {Name: "r+"}}
	for _, r := range ratings {
		db.FirstOrCreate(&r, models.RatingOption{Name: r.Name})
	}

	// 2. Statuses
	statuses := []struct {
		Name   string
		RUName string
		ENName string
	}{
		{Name: "ongoing", RUName: "Онгоинг", ENName: "Ongoing"},
		{Name: "released", RUName: "Вышло", ENName: "Released"},
	}
	for _, s := range statuses {
		status := models.Status{Name: s.Name}
		db.FirstOrCreate(&status, models.Status{Name: s.Name})

		db.FirstOrCreate(&models.StatusTranslation{
			StatusID:   status.ID,
			LanguageID: ru.ID,
			Name:       s.RUName,
		}, models.StatusTranslation{StatusID: status.ID, LanguageID: ru.ID})

		db.FirstOrCreate(&models.StatusTranslation{
			StatusID:   status.ID,
			LanguageID: en.ID,
			Name:       s.ENName,
		}, models.StatusTranslation{StatusID: status.ID, LanguageID: en.ID})
	}

	// 3. Sources
	sources := []struct {
		Name   string
		RUName string
		ENName string
	}{
		{Name: "manga", RUName: "Манга", ENName: "Manga"},
		{Name: "light_novel", RUName: "Ранобэ", ENName: "Light Novel"},
		{Name: "original", RUName: "Оригинал", ENName: "Original"},
	}
	for _, src := range sources {
		source := models.Source{Name: src.Name}
		db.FirstOrCreate(&source, models.Source{Name: src.Name})

		db.FirstOrCreate(&models.SourceTranslation{
			SourceID:   source.ID,
			LanguageID: ru.ID,
			Name:       src.RUName,
		}, models.SourceTranslation{SourceID: source.ID, LanguageID: ru.ID})

		db.FirstOrCreate(&models.SourceTranslation{
			SourceID:   source.ID,
			LanguageID: en.ID,
			Name:       src.ENName,
		}, models.SourceTranslation{SourceID: source.ID, LanguageID: en.ID})
	}

	// 4. Genres
	genres := []struct {
		Name   string
		RUName string
		ENName string
	}{
		{Name: "Action", RUName: "Экшен", ENName: "Action"},
		{Name: "Comedy", RUName: "Комедия", ENName: "Comedy"},
		{Name: "Drama", RUName: "Драма", ENName: "Drama"},
		{Name: "Fantasy", RUName: "Фэнтези", ENName: "Fantasy"},
		{Name: "Adventure", RUName: "Приключения", ENName: "Adventure"},
	}
	for _, g := range genres {
		genre := models.Genre{Name: g.Name}
		db.FirstOrCreate(&genre, models.Genre{Name: g.Name})

		db.FirstOrCreate(&models.GenreTranslation{
			GenreID:    genre.ID,
			LanguageID: ru.ID,
			Name:       g.RUName,
		}, models.GenreTranslation{GenreID: genre.ID, LanguageID: ru.ID})

		db.FirstOrCreate(&models.GenreTranslation{
			GenreID:    genre.ID,
			LanguageID: en.ID,
			Name:       g.ENName,
		}, models.GenreTranslation{GenreID: genre.ID, LanguageID: en.ID})
	}

	// 5. Studios
	studios := []string{"Madhouse", "MAPPA", "Ufotable", "A-1 Pictures"}
	for _, s := range studios {
		db.FirstOrCreate(&models.Studio{Name: s}, models.Studio{Name: s})
	}

	// 6. Anime
	var releasedStatus models.Status
	db.Where("name = ?", "released").First(&releasedStatus)
	var mangaSource models.Source
	db.Where("name = ?", "manga").First(&mangaSource)
	var madhouse models.Studio
	db.Where("name = ?", "Madhouse").First(&madhouse)

	now := time.Now()
	year2023 := time.Date(2023, 1, 1, 0, 0, 0, 0, time.UTC)
	year2024 := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)

	animeList := []struct {
		Name    string
		URL     string
		RUTitle string
		ENTitle string // Romaji
		RUDesc  string
		ENDesc  string
		Poster  string
		AiredOn *time.Time
	}{
		{
			Name:    "Sousou no Frieren",
			URL:     "sousou-no-frieren",
			RUTitle: "Провожающая в последний путь Фрирен",
			ENTitle: "Sousou no Frieren",
			RUDesc:  "История о эльфийке-маге Фрирен и её путешествии после победы над Королем Демонов.",
			ENDesc:  "After the party of heroes defeated the Demon King, they restored peace to the land and returned to lives of solitude.",
			Poster:  "https://cdn.myanimelist.net/images/anime/1015/138006l.jpg",
			AiredOn: &year2023,
		},
		{
			Name:    "Kimetsu no Yaiba",
			URL:     "kimetsu-no-yaiba",
			RUTitle: "Истребитель демонов",
			ENTitle: "Kimetsu no Yaiba",
			RUDesc:  "Тандзиро Камадо становится истребителем демонов, чтобы спасти свою сестру Незуко.",
			ENDesc:  "Tanjirou Kamado's quiet life is shattered when he finds his family slaughtered by a demon.",
			Poster:  "https://cdn.myanimelist.net/images/anime/1286/99889l.jpg",
			AiredOn: &now,
		},
		{
			Name:    "Jujutsu Kaisen",
			URL:     "jujutsu-kaisen",
			RUTitle: "Магическая битва",
			ENTitle: "Jujutsu Kaisen",
			RUDesc:  "Юдзи Итадори поглощает проклятый палец и вступает в мир магов.",
			ENDesc:  "Yuji Itadori, a high school student with extraordinary physical abilities, eats a cursed finger.",
			Poster:  "https://cdn.myanimelist.net/images/anime/1171/109222l.jpg",
			AiredOn: &year2023,
		},
		{
			Name:    "Oshi no Ko",
			URL:     "oshi-no-ko",
			RUTitle: "Звёздное дитя",
			ENTitle: "Oshi no Ko",
			RUDesc:  "Закулисье мира айдолов и история о перерождении.",
			ENDesc:  "Dr. Goro is reborn as the son of the young starlet Ai Hoshino after her stalker murders him.",
			Poster:  "https://cdn.myanimelist.net/images/anime/1812/134736l.jpg",
			AiredOn: &year2023,
		},
		{
			Name:    "Solo Leveling",
			URL:     "solo-leveling",
			RUTitle: "Поднятие уровня в одиночку",
			ENTitle: "Ore dake Level Up na Ken",
			RUDesc:  "Слабейший охотник человечества получает уникальную способность повышать свой уровень.",
			ENDesc:  "In a world where hunters must battle deadly monsters to protect mankind, Sung Jinwoo finds himself in a 'Double Dungeon'.",
			Poster:  "https://cdn.myanimelist.net/images/anime/1024/138696l.jpg",
			AiredOn: &year2024,
		},
	}

	for _, a := range animeList {
		anime := models.Anime{}
		db.Where(models.Anime{URL: a.URL}).Assign(models.Anime{
			Name:       a.Name,
			URL:        a.URL,
			StatusID:   &releasedStatus.ID,
			SourceID:   &mangaSource.ID,
			StudioID:   &madhouse.ID,
			Kind:       "tv",
			Rating:     "pg-13",
			ImageURL:   a.Poster,
			TrailerURL: defaultTrailer,
			AiredOn:    a.AiredOn,
		}).FirstOrCreate(&anime)

		db.FirstOrCreate(&models.AnimeTranslation{
			AnimeID:     anime.ID,
			LanguageID:  ru.ID,
			Title:       a.RUTitle,
			Description: a.RUDesc,
		}, models.AnimeTranslation{AnimeID: anime.ID, LanguageID: ru.ID})

		db.FirstOrCreate(&models.AnimeTranslation{
			AnimeID:     anime.ID,
			LanguageID:  en.ID,
			Title:       a.ENTitle,
			Description: a.ENDesc,
		}, models.AnimeTranslation{AnimeID: anime.ID, LanguageID: en.ID})
	}

	_ = db.Model(&models.Anime{}).
		Where("trailer_url IS NULL OR trailer_url = ''").
		Update("trailer_url", defaultTrailer).Error

	log.Println("Seeding completed successfully")
}
