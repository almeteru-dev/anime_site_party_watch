package models

type KindOption struct {
	ID     int     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name   string  `gorm:"not null;unique;type:varchar(50)" json:"name"`
	RUName *string `gorm:"column:ru_name;type:varchar(255)" json:"ru_name,omitempty"`
	UKName *string `gorm:"column:uk_name;type:varchar(255)" json:"uk_name,omitempty"`
}

func (KindOption) TableName() string {
	return "kind_options"
}
