package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/models"
	"github.com/seva/animevista/internal/validation"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"log"
)

func adminRoleLevel(role string) int {
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

func canAssignRole(requesterRole string, desiredRole string) bool {
	if desiredRole == "root" {
		return false
	}
	if requesterRole == "root" {
		return desiredRole == "user" || desiredRole == "moderator" || desiredRole == "admin"
	}
	if requesterRole == "admin" {
		return desiredRole == "user" || desiredRole == "moderator"
	}
	return false
}

func canActOnTarget(requesterRole string, requesterID, targetID int64, targetRole string) bool {
	if targetRole == "root" {
		return false
	}
	if requesterRole == "root" {
		return requesterID != targetID
	}
	if requesterRole == "admin" {
		if targetRole == "admin" {
			return false
		}
		return requesterID != targetID
	}
	return false
}

type AdminListUsersResponse struct {
	Users []models.User `json:"users"`
	Total int64         `json:"total"`
}

func AdminListUsers(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	role := strings.TrimSpace(c.Query("role"))
	status := strings.TrimSpace(c.Query("status"))
	pageRaw := strings.TrimSpace(c.Query("page"))
	limitRaw := strings.TrimSpace(c.Query("limit"))

	page := 1
	limit := 50
	if pageRaw != "" {
		if v, err := strconv.Atoi(pageRaw); err == nil && v > 0 {
			page = v
		}
	}
	if limitRaw != "" {
		if v, err := strconv.Atoi(limitRaw); err == nil && v > 0 {
			if v > 200 {
				v = 200
			}
			limit = v
		}
	}
	offset := (page - 1) * limit

	db := app.DB.Model(&models.User{})

	if q != "" {
		qq := "%%" + strings.ToLower(q) + "%%"
		db = db.Where("LOWER(username) LIKE ? OR LOWER(email) LIKE ?", qq, qq)
	}

	if role != "" && role != "all" {
		if role != "user" && role != "moderator" && role != "admin" && role != "root" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
			return
		}
		db = db.Where("role = ?", role)
	}

	if status != "" && status != "all" {
		switch status {
		case "active":
			db = db.Where("is_banned = FALSE AND is_verified = TRUE")
		case "not_verified":
			db = db.Where("is_banned = FALSE AND is_verified = FALSE")
		case "banned":
			db = db.Where("is_banned = TRUE")
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
			return
		}
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		log.Printf("AdminListUsers: failed to count users: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count users"})
		return
	}

	var users []models.User
	if err := db.Select("id", "username", "email", "role", "is_verified", "is_banned", "ban_reason", "created_at").
		Order("created_at desc").Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		log.Printf("AdminListUsers: failed to fetch users: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, AdminListUsersResponse{Users: users, Total: total})
}

func AdminGetUser(c *gin.Context) {
	userIDRaw := c.Param("id")
	targetID, err := strconv.ParseInt(userIDRaw, 10, 64)
	if err != nil || targetID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user id"})
		return
	}

	var user models.User
	if err := app.DB.Select("id", "username", "email", "role", "is_verified", "is_banned", "ban_reason", "created_at").
		First(&user, targetID).Error; err != nil {
		log.Printf("AdminGetUser: user not found id=%d: %v", targetID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

type AdminUpdateUserInput struct {
	Username   *string `json:"username"`
	Email      *string `json:"email" binding:"omitempty,email"`
	Role       *string `json:"role"`
	IsVerified *bool   `json:"is_verified"`
}

func AdminUpdateUser(c *gin.Context) {
	userIDRaw := c.Param("id")
	targetID, err := strconv.ParseInt(userIDRaw, 10, 64)
	if err != nil || targetID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user id"})
		return
	}

	requesterIDAny, _ := c.Get("user_id")
	requesterID, _ := requesterIDAny.(int64)
	requesterRoleAny, _ := c.Get("role")
	requesterRole, _ := requesterRoleAny.(string)

	var input AdminUpdateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := app.DB.First(&user, targetID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if !canActOnTarget(requesterRole, requesterID, targetID, user.Role) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient privileges"})
		return
	}

	securityChanged := false

	if input.Role != nil {
		desiredRole := strings.TrimSpace(*input.Role)
		if desiredRole != "user" && desiredRole != "moderator" && desiredRole != "admin" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
			return
		}
		if !canAssignRole(requesterRole, desiredRole) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient privileges"})
			return
		}
		if user.Role != desiredRole {
			user.Role = desiredRole
			securityChanged = true
		}
	}

	if input.Username != nil {
		username := strings.TrimSpace(*input.Username)
		if username == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username is required"})
			return
		}
		user.Username = username
	}

	if input.Email != nil {
		email := strings.TrimSpace(*input.Email)
		if email == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
			return
		}
		user.Email = email
	}

	if input.IsVerified != nil {
		if user.IsBanned {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Banned status is managed separately"})
			return
		}
		if user.IsVerified != *input.IsVerified {
			user.IsVerified = *input.IsVerified
			securityChanged = true
		}
	}

	if securityChanged {
		user.TokenVersion++
	}

	if err := app.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

type AdminCreateUserInput struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role"`
}

func AdminCreateUser(c *gin.Context) {
	requesterRoleAny, _ := c.Get("role")
	requesterRole, _ := requesterRoleAny.(string)
	if requesterRole != "admin" && requesterRole != "root" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient privileges"})
		return
	}

	var input AdminCreateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	username, err := validation.NormalizeAndValidateUsername(input.Username)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": validation.UsernameErrorMessage(c.GetHeader("Accept-Language"))})
		return
	}
	input.Username = username

	email, err := validation.NormalizeAndValidateEmail(input.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is incorrect"})
		return
	}
	input.Email = email

	role := strings.TrimSpace(input.Role)
	if role == "" {
		role = "user"
	}
	if role != "user" && role != "moderator" && role != "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}
	if !canAssignRole(requesterRole, role) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient privileges"})
		return
	}

	if err := validation.ValidatePassword(input.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := models.User{
		Username:     username,
		Email:        email,
		PasswordHash: string(hashedPassword),
		Role:         role,
		IsVerified:   true,
		IsBanned:     false,
		BanReason:    nil,
	}

	if err := app.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email or Username already exists"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

type AdminBanUserInput struct {
	Reason string `json:"reason" binding:"required"`
}

func AdminBanUser(c *gin.Context) {
	userIDRaw := c.Param("id")
	targetID, err := strconv.ParseInt(userIDRaw, 10, 64)
	if err != nil || targetID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user id"})
		return
	}

	requesterIDAny, _ := c.Get("user_id")
	requesterID, _ := requesterIDAny.(int64)
	requesterRoleAny, _ := c.Get("role")
	requesterRole, _ := requesterRoleAny.(string)
	if requesterID == targetID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot ban yourself"})
		return
	}

	var input AdminBanUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	reason := strings.TrimSpace(input.Reason)
	if reason == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ban reason is required"})
		return
	}

	var user models.User
	if err := app.DB.First(&user, targetID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if !canActOnTarget(requesterRole, requesterID, targetID, user.Role) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient privileges"})
		return
	}

	user.IsBanned = true
	user.BanReason = &reason
	if err := app.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to ban user"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func AdminUnbanUser(c *gin.Context) {
	userIDRaw := c.Param("id")
	targetID, err := strconv.ParseInt(userIDRaw, 10, 64)
	if err != nil || targetID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user id"})
		return
	}

	requesterIDAny, _ := c.Get("user_id")
	requesterID, _ := requesterIDAny.(int64)
	requesterRoleAny, _ := c.Get("role")
	requesterRole, _ := requesterRoleAny.(string)

	var user models.User
	if err := app.DB.First(&user, targetID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if !canActOnTarget(requesterRole, requesterID, targetID, user.Role) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient privileges"})
		return
	}

	user.IsBanned = false
	user.BanReason = nil
	if err := app.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unban user"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func AdminResetUserPasswordDefault(c *gin.Context) {
	userIDRaw := c.Param("id")
	targetID, err := strconv.ParseInt(userIDRaw, 10, 64)
	if err != nil || targetID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user id"})
		return
	}

	requesterIDAny, _ := c.Get("user_id")
	requesterID, _ := requesterIDAny.(int64)
	requesterRoleAny, _ := c.Get("role")
	requesterRole, _ := requesterRoleAny.(string)

	var user models.User
	if err := app.DB.First(&user, targetID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if !canActOnTarget(requesterRole, requesterID, targetID, user.Role) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient privileges"})
		return
	}

	password := getDefaultPassword()
	if err := validation.ValidatePassword(password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Default password is invalid"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	if err := app.DB.Model(&user).Updates(map[string]any{"password_hash": string(hashedPassword), "token_version": gorm.Expr("token_version + 1")}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password reset"})
}

func AdminDeleteUser(c *gin.Context) {
	userIDRaw := c.Param("id")
	targetID, err := strconv.ParseInt(userIDRaw, 10, 64)
	if err != nil || targetID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user id"})
		return
	}

	requesterIDAny, _ := c.Get("user_id")
	requesterID, _ := requesterIDAny.(int64)
	requesterRoleAny, _ := c.Get("role")
	requesterRole, _ := requesterRoleAny.(string)
	if requesterID == targetID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot delete yourself"})
		return
	}

	var user models.User
	if err := app.DB.First(&user, targetID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if !canActOnTarget(requesterRole, requesterID, targetID, user.Role) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient privileges"})
		return
	}

	if err := app.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}
