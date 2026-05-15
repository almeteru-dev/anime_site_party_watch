package handlers

import (
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/service"
)

type AdminTestVerificationEmailInput struct {
	ToEmail          string `json:"to_email" binding:"required,email"`
	VerificationLink string `json:"verification_link"`
}

func AdminTestVerificationEmail(c *gin.Context) {
	var input AdminTestVerificationEmailInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	link := strings.TrimSpace(input.VerificationLink)
	if link == "" {
		link = publicWebBaseURL() + "/verify-confirm?token=" + url.QueryEscape("test")
	}

	if err := service.SendVerificationEmail(input.ToEmail, link); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Sent"})
}
