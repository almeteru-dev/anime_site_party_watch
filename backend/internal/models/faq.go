package models

import "time"

type FAQItem struct {
	ID          int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Question    string    `gorm:"not null;type:varchar(500)" json:"question"`
	QuestionRU  *string   `gorm:"type:varchar(500)" json:"question_ru,omitempty"`
	Answer      string    `gorm:"not null;type:text" json:"answer"`
	AnswerRU    *string   `gorm:"type:text" json:"answer_ru,omitempty"`
	IsPublished bool      `gorm:"not null;default:false" json:"is_published"`
	Priority    int       `gorm:"not null;default:0" json:"priority"`
	CreatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (FAQItem) TableName() string {
	return "faq_items"
}
