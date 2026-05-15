package models

type StatusTranslation struct {
	ID         int64    `gorm:"primaryKey;autoIncrement" json:"id"`
	StatusID   int      `gorm:"not null" json:"status_id"`
	LanguageID int      `gorm:"not null" json:"language_id"`
	Name       string   `gorm:"not null;type:varchar(255)" json:"name"`
	Status     Status   `gorm:"foreignKey:StatusID" json:"-"`
	Language   Language `gorm:"foreignKey:LanguageID" json:"-"`
}

type SourceTranslation struct {
	ID         int64    `gorm:"primaryKey;autoIncrement" json:"id"`
	SourceID   int      `gorm:"not null" json:"source_id"`
	LanguageID int      `gorm:"not null" json:"language_id"`
	Name       string   `gorm:"not null;type:varchar(255)" json:"name"`
	Source     Source   `gorm:"foreignKey:SourceID" json:"-"`
	Language   Language `gorm:"foreignKey:LanguageID" json:"-"`
}

type StudioTranslation struct {
	ID         int64    `gorm:"primaryKey;autoIncrement" json:"id"`
	StudioID   int      `gorm:"not null" json:"studio_id"`
	LanguageID int      `gorm:"not null" json:"language_id"`
	Name       string   `gorm:"not null;type:varchar(255)" json:"name"`
	Studio     Studio   `gorm:"foreignKey:StudioID" json:"-"`
	Language   Language `gorm:"foreignKey:LanguageID" json:"-"`
}

type GenreTranslation struct {
	ID         int64    `gorm:"primaryKey;autoIncrement" json:"id"`
	GenreID    int      `gorm:"not null" json:"genre_id"`
	LanguageID int      `gorm:"not null" json:"language_id"`
	Name       string   `gorm:"not null;type:varchar(255)" json:"name"`
	Genre      Genre    `gorm:"foreignKey:GenreID" json:"-"`
	Language   Language `gorm:"foreignKey:LanguageID" json:"-"`
}

type ThemeTranslation struct {
	ID         int64    `gorm:"primaryKey;autoIncrement" json:"id"`
	ThemeID    int      `gorm:"not null" json:"theme_id"`
	LanguageID int      `gorm:"not null" json:"language_id"`
	Name       string   `gorm:"not null;type:varchar(255)" json:"name"`
	Theme      Theme    `gorm:"foreignKey:ThemeID" json:"-"`
	Language   Language `gorm:"foreignKey:LanguageID" json:"-"`
}

type CollectionTypeTranslation struct {
	ID               int64          `gorm:"primaryKey;autoIncrement" json:"id"`
	CollectionTypeID int            `gorm:"not null" json:"collection_type_id"`
	LanguageID       int            `gorm:"not null" json:"language_id"`
	Name             string         `gorm:"not null;type:varchar(255)" json:"name"`
	CollectionType   CollectionType `gorm:"foreignKey:CollectionTypeID" json:"-"`
	Language         Language       `gorm:"foreignKey:LanguageID" json:"-"`
}
