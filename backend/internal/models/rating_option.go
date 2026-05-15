package models

type RatingOption struct {
	ID   int    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name string `gorm:"not null;unique;type:varchar(50)" json:"name"`
}

func (RatingOption) TableName() string {
	return "rating_options"
}
