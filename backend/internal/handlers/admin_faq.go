package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
)

type AdminFAQInput struct {
	Question    string `json:"question"`
	QuestionRU  string `json:"question_ru"`
	Answer      string `json:"answer"`
	AnswerRU    string `json:"answer_ru"`
	IsPublished bool   `json:"is_published"`
	Priority    int    `json:"priority"`
}

func AdminListFAQ(c *gin.Context) {
	var items []models.FAQItem
	if err := app.DB.Order("priority asc").Order("id desc").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch faq"})
		return
	}
	c.JSON(http.StatusOK, items)
}

func AdminCreateFAQ(c *gin.Context) {
	var input AdminFAQInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	question := strings.TrimSpace(input.Question)
	questionRU := strings.TrimSpace(input.QuestionRU)
	answer := strings.TrimSpace(input.Answer)
	answerRU := strings.TrimSpace(input.AnswerRU)
	if question == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Question is required"})
		return
	}
	if answer == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Answer is required"})
		return
	}

	var qRuPtr *string
	if questionRU != "" {
		qRuPtr = &questionRU
	}
	var aRuPtr *string
	if answerRU != "" {
		aRuPtr = &answerRU
	}

	item := models.FAQItem{
		Question:    question,
		QuestionRU:  qRuPtr,
		Answer:      answer,
		AnswerRU:    aRuPtr,
		IsPublished: input.IsPublished,
		Priority:    input.Priority,
	}
	if err := app.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to create faq"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func AdminUpdateFAQ(c *gin.Context) {
	idRaw := strings.TrimSpace(c.Param("id"))
	id, err := strconv.ParseInt(idRaw, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid faq id"})
		return
	}

	var input AdminFAQInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	var item models.FAQItem
	if err := app.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "FAQ not found"})
		return
	}

	question := strings.TrimSpace(input.Question)
	questionRU := strings.TrimSpace(input.QuestionRU)
	answer := strings.TrimSpace(input.Answer)
	answerRU := strings.TrimSpace(input.AnswerRU)
	if question == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Question is required"})
		return
	}
	if answer == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Answer is required"})
		return
	}

	item.Question = question
	if questionRU == "" {
		item.QuestionRU = nil
	} else {
		item.QuestionRU = &questionRU
	}
	item.Answer = answer
	if answerRU == "" {
		item.AnswerRU = nil
	} else {
		item.AnswerRU = &answerRU
	}
	item.IsPublished = input.IsPublished
	item.Priority = input.Priority
	if err := app.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to update faq"})
		return
	}
	c.JSON(http.StatusOK, item)
}

func AdminDeleteFAQ(c *gin.Context) {
	idRaw := strings.TrimSpace(c.Param("id"))
	id, err := strconv.ParseInt(idRaw, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid faq id"})
		return
	}

	var item models.FAQItem
	if err := app.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "FAQ not found"})
		return
	}
	if err := app.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to delete faq"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}
