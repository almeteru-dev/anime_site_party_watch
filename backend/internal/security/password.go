package security

import (
	"crypto/sha256"
	"encoding/hex"

	"github.com/seva/animevista/internal/config"
	"golang.org/x/crypto/bcrypt"
)

// PasswordHashCost is the bcrypt cost for newly generated hashes.
// We use an explicit value to avoid unexpected changes in DefaultCost.
const PasswordHashCost = 12

// HashPassword hashes a password using standard bcrypt.
func HashPassword(password string) (string, error) {
	h, err := bcrypt.GenerateFromPassword([]byte(password), PasswordHashCost)
	if err != nil {
		return "", err
	}
	return string(h), nil
}

// VerifyPassword checks password against hash.
// It supports a transition mode where the old password was pre-hashed with SHA256 + Pepper.
// Return values:
// - ok: the password matches
// - legacy: match used the old peppered scheme (should be re-hashed)
func VerifyPassword(hash string, password string) (ok bool, legacy bool) {
	if hash == "" {
		return false, false
	}

	// 1. Try standard bcrypt (the new/current way)
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err == nil {
		return true, false
	}

	// 2. Try old peppered scheme (if PEPPER_PASS is still available in config)
	// This allows users to login and have their hash updated to the standard one.
	if pepper := config.AppConfig.PEPPER_PASS; pepper != "" {
		sum := sha256.Sum256([]byte(password + pepper))
		pre := hex.EncodeToString(sum[:])
		if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(pre)); err == nil {
			return true, true
		}
	}

	return false, false
}
