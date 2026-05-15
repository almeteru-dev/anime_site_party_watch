package handlers

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type footerToggleLink struct {
	Enabled bool   `json:"enabled"`
	URL     string `json:"url"`
}

type FooterSocialLinks struct {
	TelegramURL string           `json:"telegram_url"`
	VK          footerToggleLink `json:"vk"`
	Twitter     footerToggleLink `json:"twitter"`
	Instagram   footerToggleLink `json:"instagram"`
	WhatsApp    footerToggleLink `json:"whatsapp"`
}

type PublicFooterSettings struct {
	ContactURL  string            `json:"contact_url"`
	SocialLinks FooterSocialLinks `json:"social_links"`
}

func getFooterContactURL() string {
	var s models.AppSetting
	if err := app.DB.First(&s, "key = ?", "footer_contact_url").Error; err == nil {
		return strings.TrimSpace(s.Value)
	}
	return ""
}

func getFooterSocialLinks() FooterSocialLinks {
	var s models.AppSetting
	if err := app.DB.First(&s, "key = ?", "footer_social_links").Error; err == nil {
		var out FooterSocialLinks
		if json.Unmarshal([]byte(s.Value), &out) == nil {
			out.TelegramURL = strings.TrimSpace(out.TelegramURL)
			out.VK.URL = strings.TrimSpace(out.VK.URL)
			out.Twitter.URL = strings.TrimSpace(out.Twitter.URL)
			out.Instagram.URL = strings.TrimSpace(out.Instagram.URL)
			out.WhatsApp.URL = strings.TrimSpace(out.WhatsApp.URL)
			return out
		}
	}
	return FooterSocialLinks{TelegramURL: "https://t.me/"}
}

func isValidFooterURL(raw string) bool {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return true
	}
	if strings.HasPrefix(raw, "/") || strings.HasPrefix(raw, "#") {
		return true
	}
	u, err := url.Parse(raw)
	if err != nil {
		return false
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return false
	}
	return u.Host != ""
}

type AdminSetFooterLinksInput struct {
	ContactURL  string            `json:"contact_url"`
	SocialLinks FooterSocialLinks `json:"social_links"`
}

func AdminSetFooterLinks(c *gin.Context) {
	roleAny, _ := c.Get("role")
	role, _ := roleAny.(string)
	if role != "root" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Root access required"})
		return
	}

	var input AdminSetFooterLinksInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.ContactURL = strings.TrimSpace(input.ContactURL)
	input.SocialLinks.TelegramURL = strings.TrimSpace(input.SocialLinks.TelegramURL)
	input.SocialLinks.VK.URL = strings.TrimSpace(input.SocialLinks.VK.URL)
	input.SocialLinks.Twitter.URL = strings.TrimSpace(input.SocialLinks.Twitter.URL)
	input.SocialLinks.Instagram.URL = strings.TrimSpace(input.SocialLinks.Instagram.URL)
	input.SocialLinks.WhatsApp.URL = strings.TrimSpace(input.SocialLinks.WhatsApp.URL)

	if input.SocialLinks.TelegramURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "telegram_url is required"})
		return
	}
	if !isValidFooterURL(input.ContactURL) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid contact_url"})
		return
	}
	if !isValidFooterURL(input.SocialLinks.TelegramURL) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid telegram_url"})
		return
	}

	if input.SocialLinks.VK.Enabled && !isValidFooterURL(input.SocialLinks.VK.URL) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vk url"})
		return
	}
	if input.SocialLinks.Twitter.Enabled && !isValidFooterURL(input.SocialLinks.Twitter.URL) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid twitter url"})
		return
	}
	if input.SocialLinks.Instagram.Enabled && !isValidFooterURL(input.SocialLinks.Instagram.URL) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid instagram url"})
		return
	}
	if input.SocialLinks.WhatsApp.Enabled && !isValidFooterURL(input.SocialLinks.WhatsApp.URL) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid whatsapp url"})
		return
	}

	if input.SocialLinks.VK.Enabled && input.SocialLinks.VK.URL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "vk url is required when enabled"})
		return
	}
	if input.SocialLinks.Twitter.Enabled && input.SocialLinks.Twitter.URL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "twitter url is required when enabled"})
		return
	}
	if input.SocialLinks.Instagram.Enabled && input.SocialLinks.Instagram.URL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "instagram url is required when enabled"})
		return
	}
	if input.SocialLinks.WhatsApp.Enabled && input.SocialLinks.WhatsApp.URL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "whatsapp url is required when enabled"})
		return
	}

	blob, err := json.Marshal(input.SocialLinks)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encode social links"})
		return
	}

	err = app.DB.Transaction(func(tx *gorm.DB) error {
		updatedAt := time.Now()
		contact := models.AppSetting{Key: "footer_contact_url", Value: input.ContactURL, UpdatedAt: updatedAt}
		social := models.AppSetting{Key: "footer_social_links", Value: string(blob), UpdatedAt: updatedAt}
		if err := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "key"}},
			DoUpdates: clause.AssignmentColumns([]string{"value", "updated_at"}),
		}).Create(&contact).Error; err != nil {
			return err
		}
		if err := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "key"}},
			DoUpdates: clause.AssignmentColumns([]string{"value", "updated_at"}),
		}).Create(&social).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update footer settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Updated"})
}
