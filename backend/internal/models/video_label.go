package models

type VideoLabel struct {
	ID               int64  `gorm:"primaryKey;autoIncrement" json:"id"`
	Name             string `gorm:"not null;unique;type:varchar(255)" json:"name"`
	IsExternalPlayer bool   `gorm:"not null;default:false" json:"is_external_player"`
}
