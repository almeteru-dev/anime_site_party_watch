package models

type VoiceGroupType string

const (
	VoiceGroupTypeDub VoiceGroupType = "dub"
	VoiceGroupTypeSub VoiceGroupType = "sub"
)

type VoiceGroup struct {
	ID   int64          `gorm:"primaryKey;autoIncrement" json:"id"`
	Name string         `gorm:"not null;uniqueIndex;type:varchar(255)" json:"name"`
	Type VoiceGroupType `gorm:"not null;type:varchar(10)" json:"type"`
}
