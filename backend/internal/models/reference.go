package models

// Project Rule: We only support two languages: Russian (RU) and English (EN).
// For the English locale, we use Romaji titles/names only.

type Language struct {
	ID   int    `gorm:"primaryKey;autoIncrement" json:"id"`
	Code string `gorm:"unique;not null;type:varchar(10)" json:"code"`
	Name string `gorm:"not null;type:varchar(255)" json:"name"`
}

type Status struct {
	ID     int     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name   string  `gorm:"not null;type:varchar(255)" json:"name"`
	RUName *string `gorm:"-" json:"ru_name,omitempty"`
}

type Source struct {
	ID     int     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name   string  `gorm:"not null;type:varchar(255)" json:"name"`
	RUName *string `gorm:"-" json:"ru_name,omitempty"`
}

type CollectionType struct {
	ID   int    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name string `gorm:"not null;type:varchar(255)" json:"name"`
}

type Genre struct {
	ID     int     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name   string  `gorm:"not null;type:varchar(255)" json:"name"`
	RUName *string `gorm:"-" json:"ru_name,omitempty"`
}

type Theme struct {
	ID     int     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name   string  `gorm:"not null;type:varchar(255)" json:"name"`
	RUName *string `gorm:"-" json:"ru_name,omitempty"`
}

type Producer struct {
	ID   int    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name string `gorm:"not null;type:varchar(255)" json:"name"`
}

type Studio struct {
	ID     int     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name   string  `gorm:"not null;type:varchar(255)" json:"name"`
	RUName *string `gorm:"-" json:"ru_name,omitempty"`
}
