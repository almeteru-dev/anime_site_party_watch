package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
)

type localizedFAQItem struct {
	models.FAQItem
	Question string `json:"question"`
	Answer   string `json:"answer"`
}

func pickFAQText(item models.FAQItem, acceptLanguage string) (string, string) {
	isRU := strings.HasPrefix(strings.ToLower(strings.TrimSpace(acceptLanguage)), "ru")
	q := item.Question
	a := item.Answer
	if isRU {
		if item.QuestionRU != nil && strings.TrimSpace(*item.QuestionRU) != "" {
			q = strings.TrimSpace(*item.QuestionRU)
		}
		if item.AnswerRU != nil && strings.TrimSpace(*item.AnswerRU) != "" {
			a = strings.TrimSpace(*item.AnswerRU)
		}
	}
	return q, a
}

func GetPublicFAQ(c *gin.Context) {
	var items []models.FAQItem
	if err := app.DB.Where("is_published = true").Order("priority asc").Order("id desc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch faq"})
		return
	}

	acceptLang := c.GetHeader("Accept-Language")
	out := make([]localizedFAQItem, 0, len(items))
	for _, it := range items {
		q, a := pickFAQText(it, acceptLang)
		out = append(out, localizedFAQItem{FAQItem: it, Question: q, Answer: a})
	}

	c.JSON(http.StatusOK, out)
}
