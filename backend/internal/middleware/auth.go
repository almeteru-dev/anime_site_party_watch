package middleware

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"log"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/config"
	"github.com/seva/animevista/internal/models"
	"gorm.io/gorm"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := c.Cookie("auth_token")
		if err != nil {
			log.Printf("AuthMiddleware: auth_token cookie missing: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required", "error_code": "REVOKED"})
			c.Abort()
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(config.AppConfig.JWT_SECRET), nil
		})

		if err != nil {
			log.Printf("AuthMiddleware: token parsing error: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token", "error_code": "REVOKED"})
			c.Abort()
			return
		}

		if !token.Valid {
			log.Println("AuthMiddleware: token is invalid")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token", "error_code": "REVOKED"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims", "error_code": "REVOKED"})
			c.Abort()
			return
		}

		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims", "error_code": "REVOKED"})
			c.Abort()
			return
		}
		userID := int64(userIDFloat)

		tokenVersionFloat, ok := claims["token_version"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token", "error_code": "REVOKED"})
			c.Abort()
			return
		}
		tokenVersion := int(tokenVersionFloat)

		var user models.User
		err = app.DB.Select("id", "role", "token_version", "is_banned", "ban_reason", "is_verified").First(&user, userID).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token", "error_code": "REVOKED"})
				c.Abort()
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate user"})
			c.Abort()
			return
		}

		if user.TokenVersion != tokenVersion {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token", "error_code": "REVOKED"})
			c.Abort()
			return
		}

		if user.IsBanned {
			reason := ""
			if user.BanReason != nil {
				reason = *user.BanReason
			}
			c.JSON(http.StatusForbidden, gin.H{
				"error":      "You have been banned. Reason: " + reason,
				"error_code": "BANNED",
				"ban_reason": reason,
			})
			c.Abort()
			return
		}

		if !user.IsVerified {
			c.JSON(http.StatusForbidden, gin.H{
				"error":      "Account is not verified",
				"error_code": "NOT_VERIFIED",
			})
			c.Abort()
			return
		}

		c.Set("user_id", user.ID)
		c.Set("role", user.Role)
		c.Next()
	}
}

func roleLevel(role string) int {
	switch role {
	case "root":
		return 4
	case "admin":
		return 3
	case "moderator":
		return 2
	case "user":
		return 1
	default:
		return 0
	}
}

func RequireMinRole(minRole string) gin.HandlerFunc {
	min := roleLevel(minRole)
	return func(c *gin.Context) {
		roleAny, exists := c.Get("role")
		role, ok := roleAny.(string)
		if !exists || !ok || roleLevel(role) < min {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient privileges"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func DenyModeratorDelete() gin.HandlerFunc {
	return func(c *gin.Context) {
		roleAny, _ := c.Get("role")
		role, _ := roleAny.(string)
		if role == "moderator" && strings.EqualFold(c.Request.Method, "DELETE") {
			if c.FullPath() == "/api/admin/schedule/:id" {
				c.Next()
				return
			}
			c.JSON(http.StatusForbidden, gin.H{"error": "Moderators cannot delete content"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		roleAny, exists := c.Get("role")
		role, _ := roleAny.(string)
		if !exists || (role != "admin" && role != "root") {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func RootOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		roleAny, exists := c.Get("role")
		role, _ := roleAny.(string)
		if !exists || role != "root" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Root access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}
