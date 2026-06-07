package models

type Language struct {
	ID   int    `gorm:"primaryKey;autoIncrement" json:"id"`
	Code string `gorm:"unique;not null;type:varchar(10)" json:"code"`
	Name string `gorm:"not null;type:varchar(255)" json:"name"`
}

type Status struct {
	ID     int     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name   string  `gorm:"not null;type:varchar(255)" json:"name"`
	RUName *string `gorm:"-" json:"ru_name,omitempty"`
	UKName *string `gorm:"-" json:"uk_name,omitempty"`
}

type Source struct {
	ID     int     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name   string  `gorm:"not null;type:varchar(255)" json:"name"`
	RUName *string `gorm:"-" json:"ru_name,omitempty"`
	UKName *string `gorm:"-" json:"uk_name,omitempty"`
}

type CollectionType struct {
	ID   int    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name string `gorm:"not null;type:varchar(255)" json:"name"`
}

type Genre struct {
	ID     int     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name   string  `gorm:"not null;type:varchar(255)" json:"name"`
	RUName *string `gorm:"-" json:"ru_name,omitempty"`
	DescriptionEN *string `gorm:"column:description_en;type:text" json:"description_en,omitempty"`
	DescriptionRU *string `gorm:"-" json:"description_ru,omitempty"`
	UKName *string `gorm:"-" json:"uk_name,omitempty"`
	DescriptionUK *string `gorm:"-" json:"description_uk,omitempty"`
}

type Theme struct {
	ID     int     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name   string  `gorm:"not null;type:varchar(255)" json:"name"`
	RUName *string `gorm:"-" json:"ru_name,omitempty"`
	DescriptionEN *string `gorm:"column:description_en;type:text" json:"description_en,omitempty"`
	DescriptionRU *string `gorm:"-" json:"description_ru,omitempty"`
	UKName *string `gorm:"-" json:"uk_name,omitempty"`
	DescriptionUK *string `gorm:"-" json:"description_uk,omitempty"`
}

type Producer struct {
	ID   int    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name string `gorm:"not null;type:varchar(255)" json:"name"`
}

type Studio struct {
	ID     int     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name   string  `gorm:"not null;type:varchar(255)" json:"name"`
	RUName *string `gorm:"-" json:"ru_name,omitempty"`
	UKName *string `gorm:"-" json:"uk_name,omitempty"`
}
