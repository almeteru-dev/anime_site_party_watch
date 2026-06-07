package models

import "time"

type Anime struct {
	ID                  int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	SeasonNumber        int        `gorm:"not null;default:1" json:"season_number"`
	FirstSeasonID       *int64     `gorm:"column:first_season_id" json:"first_season_id"`
	StudioID            *int       `json:"studio_id"`
	ProducerID          *int       `json:"producer_id"`
	StatusID            *int       `json:"status_id"`
	SourceID            *int       `json:"source_id"`
	ShikimoriID         *int       `gorm:"column:shikimori_id" json:"shikimori_id"`
	MALID               *int       `gorm:"column:mal_id" json:"mal_id"`
	WorldArtID          *int       `gorm:"column:worldart_id" json:"worldart_id"`
	ShikiEnglish        []string   `gorm:"column:shiki_english;type:jsonb;serializer:json;not null;default:'[]'" json:"shiki_english"`
	ShikiJapanese       []string   `gorm:"column:shiki_japanese;type:jsonb;serializer:json;not null;default:'[]'" json:"shiki_japanese"`
	ShikiSynonyms       []string   `gorm:"column:shiki_synonyms;type:jsonb;serializer:json;not null;default:'[]'" json:"shiki_synonyms"`
	ShikiFansubbers     []string   `gorm:"column:shiki_fansubbers;type:jsonb;serializer:json;not null;default:'[]'" json:"shiki_fansubbers"`
	ShikiFandubbers     []string   `gorm:"column:shiki_fandubbers;type:jsonb;serializer:json;not null;default:'[]'" json:"shiki_fandubbers"`
	Name                string     `gorm:"not null;type:varchar(255)" json:"name"`
	IsFeatured          bool       `gorm:"not null;default:false;index" json:"is_featured"`
	FeaturedAt          *time.Time `gorm:"index" json:"featured_at"`
	Kind                string     `gorm:"type:varchar(50)" json:"kind"`
	KindRUName          *string    `gorm:"-" json:"kind_ru_name,omitempty"`
	KindUKName          *string    `gorm:"-" json:"kind_uk_name,omitempty"`
	URL                 string     `gorm:"unique;not null;type:varchar(255)" json:"url"`
	Duration            int        `json:"duration"`
	Rating              string     `gorm:"type:varchar(50)" json:"rating"`
	RatingDescriptionEN *string    `gorm:"-" json:"rating_description_en,omitempty"`
	RatingDescriptionRU *string    `gorm:"-" json:"rating_description_ru,omitempty"`
	RatingDescriptionUK *string    `gorm:"-" json:"rating_description_uk,omitempty"`
	ImageURL            string     `gorm:"column:image;type:varchar(500)" json:"image_url"`
	BackgroundURL       string     `gorm:"type:varchar(500);default:''" json:"background_url"`
	TrailerURL          string     `gorm:"type:varchar(1000)" json:"trailer_url"`
	Score               float64    `gorm:"type:decimal(3,2);default:0" json:"score"`
	RatingAvg           float64    `gorm:"type:double precision;default:0" json:"rating_avg"`
	RatingCount         int        `gorm:"default:0" json:"rating_count"`
	Episodes            int        `gorm:"default:0" json:"episodes"`
	EpisodesAired       int        `gorm:"default:0" json:"episodes_aired"`
	AiredOn             *time.Time `json:"aired_on"`
	ReleasedOn          *time.Time `json:"released_on"`

	Studio        *Studio             `gorm:"foreignKey:StudioID" json:"studio,omitempty"`
	Producer      *Producer           `gorm:"foreignKey:ProducerID" json:"producer,omitempty"`
	Producers     []Producer          `gorm:"many2many:anime_producers;" json:"producers,omitempty"`
	Status        *Status             `gorm:"foreignKey:StatusID" json:"status,omitempty"`
	Source        *Source             `gorm:"foreignKey:SourceID" json:"source,omitempty"`
	Genres        []Genre             `gorm:"many2many:anime_genres;" json:"genres,omitempty"`
	Themes        []Theme             `gorm:"many2many:anime_themes;" json:"themes,omitempty"`
	Translations  []AnimeTranslation  `gorm:"foreignKey:AnimeID" json:"translations,omitempty"`
	AltTitles     []AnimeAltTitle     `gorm:"foreignKey:AnimeID" json:"alt_titles,omitempty"`
	GalleryImages []AnimeGalleryImage `gorm:"foreignKey:AnimeID" json:"gallery_images,omitempty"`
	EpisodeItems  []Episode           `gorm:"foreignKey:AnimeID" json:"episode_items,omitempty"`
	Seasons       []Anime             `gorm:"-" json:"seasons,omitempty"`
}

func (Anime) TableName() string {
	return "anime"
}

type AnimeTranslation struct {
	ID          int64    `gorm:"primaryKey;autoIncrement" json:"id"`
	AnimeID     int64    `gorm:"not null" json:"anime_id"`
	LanguageID  int      `gorm:"not null" json:"language_id"`
	Title       string   `gorm:"not null;type:varchar(255)" json:"title"`
	Description string   `gorm:"type:text" json:"description"`
	Anime       Anime    `gorm:"foreignKey:AnimeID" json:"-"`
	Language    Language `gorm:"foreignKey:LanguageID" json:"language"`
}
