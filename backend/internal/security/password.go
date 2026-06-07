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

// prehashPassword returns SHA256(password + pepper) in hex form.
// Pepper is a secret global value stored in env var PEPPER_PASS.
func prehashPassword(password string) string {
	pepper := config.AppConfig.PEPPER_PASS
	sum := sha256.Sum256([]byte(password + pepper))
	return hex.EncodeToString(sum[:])
}

// HashPassword hashes a password using pepper+sha256 prehash and bcrypt.
func HashPassword(password string) (string, error) {
	pre := prehashPassword(password)
	h, err := bcrypt.GenerateFromPassword([]byte(pre), PasswordHashCost)
	if err != nil {
		return "", err
	}
	return string(h), nil
}

// VerifyPassword checks password against hash.
// It supports a legacy mode where password was fed directly into bcrypt (no pepper).
// Return values:
// - ok: the password matches
// - legacy: match used the legacy (no-pepper) scheme
func VerifyPassword(hash string, password string) (ok bool, legacy bool) {
	if hash == "" {
		return false, false
	}

	pre := prehashPassword(password)
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(pre)); err == nil {
		return true, false
	}

	// Legacy fallback: bcrypt(hash, rawPassword)
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err == nil {
		return true, true
	}

	return false, false
}
