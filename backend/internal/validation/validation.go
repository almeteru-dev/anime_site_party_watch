package validation

import (
	"errors"
	"net/mail"
	"strings"
	"unicode"
	"unicode/utf8"
)

const (
	UsernameMinRunes = 4
	UsernameMaxRunes = 35

	EmailMaxRunes       = 100
	EmailDomainMaxRunes = 50

	PasswordMinRunes = 8
	PasswordMaxRunes = 100

	SearchMaxRunes = 100
)

var (
	ErrUsernameIncorrect = errors.New("Username is incorrect")
	ErrEmailIncorrect    = errors.New("Email is incorrect")
	ErrPasswordIncorrect = errors.New("Password is incorrect")
)

// UsernameErrorMessage returns the localized error message for username validation.
func UsernameErrorMessage(acceptLanguage string) string {
	if isRussian(acceptLanguage) {
		return "Имя пользователя некорректно"
	}
	return "Username is incorrect"
}

// RegisterUsernameHint returns the localized hint for the registration form.
func RegisterUsernameHint(acceptLanguage string) string {
	if isRussian(acceptLanguage) {
		return "Можно использовать только английские буквы любого регистра, цифры и символы - и _"
	}
	return "You can only use English letters of any case, numbers, and symbols - and _"
}

// NormalizeAndValidateUsername trims spaces and validates username rules:
// - rune length between 4 and 35
// - only ASCII letters (any case), digits, hyphen (-), underscore (_)
// It returns a normalized (trimmed) username.
func NormalizeAndValidateUsername(username string) (string, error) {
	u := strings.TrimSpace(username)
	rc := utf8.RuneCountInString(u)
	if rc < UsernameMinRunes || rc > UsernameMaxRunes {
		return "", ErrUsernameIncorrect
	}
	for _, r := range u {
		if r > unicode.MaxASCII {
			return "", ErrUsernameIncorrect
		}
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			continue
		}
		return "", ErrUsernameIncorrect
	}
	return u, nil
}

// NormalizeAndValidateEmail performs strict email validation with length limits and sanitization.
// Rules:
// - trimmed input
// - max total length 100 runes
// - max domain length (after '@') 50 runes
// - rejects control chars and obvious HTML/script payload markers
// - uses net/mail parser but rejects "Name <addr>" formats (strict address only)
// It returns a normalized email (lowercased).
func NormalizeAndValidateEmail(email string) (string, error) {
	e := strings.TrimSpace(email)
	if e == "" {
		return "", ErrEmailIncorrect
	}
	if utf8.RuneCountInString(e) > EmailMaxRunes {
		return "", ErrEmailIncorrect
	}
	if containsControlOrUnsafe(e) {
		return "", ErrEmailIncorrect
	}
	if strings.ContainsAny(e, "<>\"'\x60") {
		return "", ErrEmailIncorrect
	}

	addr, err := mail.ParseAddress(e)
	if err != nil {
		return "", ErrEmailIncorrect
	}

	// Reject "Name <email@domain>" forms: accept only plain address.
	if !strings.EqualFold(e, addr.Address) {
		return "", ErrEmailIncorrect
	}

	canonical := strings.ToLower(addr.Address)
	parts := strings.Split(canonical, "@")
	if len(parts) != 2 {
		return "", ErrEmailIncorrect
	}
	local, domain := parts[0], parts[1]
	if local == "" || domain == "" {
		return "", ErrEmailIncorrect
	}
	if utf8.RuneCountInString(domain) > EmailDomainMaxRunes {
		return "", ErrEmailIncorrect
	}
	if !isValidDomain(domain) {
		return "", ErrEmailIncorrect
	}

	return canonical, nil
}

// ValidatePasswordAndConfirm validates password strength with DoS-safe checks
// (no expensive regex) and verifies confirm password matches.
func ValidatePasswordAndConfirm(password, confirm string) error {
	if err := ValidatePassword(password); err != nil {
		return err
	}
	if password != confirm {
		return errors.New("passwords do not match")
	}
	return nil
}

// ValidatePassword validates password length and basic complexity.
// - rune length between 8 and 100
// - only printable ASCII (33..126), disallow spaces and control characters
// - requires at least 1 uppercase letter, 1 digit, 1 special character
func ValidatePassword(password string) error {
	rc := utf8.RuneCountInString(password)
	if rc < PasswordMinRunes || rc > PasswordMaxRunes {
		return ErrPasswordIncorrect
	}
	if containsControlOrUnsafe(password) {
		return ErrPasswordIncorrect
	}

	var hasUpper, hasDigit, hasSpecial bool
	for _, r := range password {
		if r > unicode.MaxASCII {
			return ErrPasswordIncorrect
		}
		if r < 33 || r > 126 {
			return ErrPasswordIncorrect
		}
		if r >= 'A' && r <= 'Z' {
			hasUpper = true
		}
		if r >= '0' && r <= '9' {
			hasDigit = true
		}
		if isPasswordSpecial(r) {
			hasSpecial = true
		}
	}

	if !hasUpper || !hasDigit || !hasSpecial {
		return ErrPasswordIncorrect
	}
	return nil
}

// SanitizeLoginIdentifier trims and enforces length limits to protect login from resource abuse.
func SanitizeLoginIdentifier(identifier string) (string, error) {
	s := strings.TrimSpace(identifier)
	if s == "" {
		return "", errors.New("identifier is required")
	}
	if utf8.RuneCountInString(s) > EmailMaxRunes {
		return "", errors.New("identifier is too long")
	}
	if containsControlOrUnsafe(s) {
		return "", errors.New("identifier is incorrect")
	}
	return s, nil
}

// SanitizeSearchQuery trims, removes obviously dangerous characters, and caps rune length.
func SanitizeSearchQuery(q string) string {
	s := strings.TrimSpace(q)
	if s == "" {
		return ""
	}

	// Remove obvious HTML tag markers to reduce XSS trolling.
	s = strings.ReplaceAll(s, "<", "")
	s = strings.ReplaceAll(s, ">", "")

	// Drop control characters.
	filtered := make([]rune, 0, len([]rune(s)))
	for _, r := range s {
		if unicode.IsControl(r) {
			continue
		}
		filtered = append(filtered, r)
		if len(filtered) >= SearchMaxRunes {
			break
		}
	}

	return strings.TrimSpace(string(filtered))
}

func isRussian(acceptLanguage string) bool {
	lang := strings.ToLower(strings.TrimSpace(acceptLanguage))
	return strings.HasPrefix(lang, "ru")
}

func containsControlOrUnsafe(s string) bool {
	for _, r := range s {
		if unicode.IsControl(r) {
			return true
		}
	}
	return false
}

func isPasswordSpecial(r rune) bool {
	// Only treat a small safe set as "special" to keep checks predictable.
	switch r {
	case '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=', '[', ']', '{', '}', ';', ':', '\'', '"', '\\', '|', ',', '.', '<', '>', '/', '?':
		return true
	default:
		return false
	}
}

func isValidDomain(domain string) bool {
	if strings.HasPrefix(domain, ".") || strings.HasSuffix(domain, ".") {
		return false
	}
	if strings.Contains(domain, "..") {
		return false
	}

	labels := strings.Split(domain, ".")
	if len(labels) < 2 {
		return false
	}
	for _, label := range labels {
		if label == "" {
			return false
		}
		if len(label) > 63 {
			return false
		}
		for i, r := range label {
			if r > unicode.MaxASCII {
				return false
			}
			isAlphaNum := (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9')
			if isAlphaNum {
				continue
			}
			if r == '-' {
				if i == 0 || i == len(label)-1 {
					return false
				}
				continue
			}
			return false
		}
	}
	return true
}
