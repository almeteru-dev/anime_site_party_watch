package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AdminTransferRootInput struct {
	TargetUserID int64  `json:"target_user_id" binding:"required"`
	Password     string `json:"password" binding:"required"`
}

func AdminTransferRoot(c *gin.Context) {
	roleAny, _ := c.Get("role")
	role, _ := roleAny.(string)
	if role != "root" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Root access required"})
		return
	}

	requesterAny, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	requesterID := requesterAny.(int64)

	var input AdminTransferRootInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.TargetUserID == requesterID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot transfer root to self"})
		return
	}

	password := strings.TrimSpace(input.Password)
	if password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password is required"})
		return
	}

	var requester models.User
	if err := app.DB.Select("id", "password_hash").First(&requester, requesterID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(requester.PasswordHash), []byte(password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid password"})
		return
	}

	var target models.User
	if err := app.DB.Select("id", "role").First(&target, input.TargetUserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Target user not found"})
		return
	}
	if target.Role != "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Target must be an admin"})
		return
	}

	err := app.DB.Transaction(func(tx *gorm.DB) error {
		lockReq := tx.Exec(`SELECT id FROM users WHERE id = ? AND role = 'root' FOR UPDATE`, requesterID)
		if lockReq.Error != nil {
			return lockReq.Error
		}
		if lockReq.RowsAffected != 1 {
			return gorm.ErrRecordNotFound
		}

		lockTgt := tx.Exec(`SELECT id FROM users WHERE id = ? AND role = 'admin' FOR UPDATE`, target.ID)
		if lockTgt.Error != nil {
			return lockTgt.Error
		}
		if lockTgt.RowsAffected != 1 {
			return gorm.ErrRecordNotFound
		}

		// Step 1: demote current root first to satisfy the unique "one root" constraint
		res1 := tx.Exec(`
			UPDATE users
			SET role = 'admin', token_version = token_version + 1
			WHERE id = ? AND role = 'root'
		`, requesterID)
		if res1.Error != nil {
			return res1.Error
		}
		if res1.RowsAffected != 1 {
			return gorm.ErrRecordNotFound
		}

		// Step 2: promote target admin to root
		res2 := tx.Exec(`
			UPDATE users
			SET role = 'root', token_version = token_version + 1
			WHERE id = ? AND role = 'admin'
		`, target.ID)
		if res2.Error != nil {
			return res2.Error
		}
		if res2.RowsAffected != 1 {
			return gorm.ErrRecordNotFound
		}

		return nil
	})
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Root transfer failed (roles changed concurrently)"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to transfer root"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Root transferred", "force_logout": true})
}
