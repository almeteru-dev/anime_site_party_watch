package models

type RatingOption struct {
	ID            int     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name          string  `gorm:"not null;unique;type:varchar(50)" json:"name"`
	DescriptionEN *string `gorm:"column:description_en;type:text" json:"description_en,omitempty"`
	DescriptionRU *string `gorm:"column:description_ru;type:text" json:"description_ru,omitempty"`
}

func (RatingOption) TableName() string {
	return "rating_options"
}
