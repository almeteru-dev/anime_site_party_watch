package config

import (
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	FRONTEND_URL    string
	BACKEND_URL     string
	ALLOWED_ORIGINS []string
	IS_PRODUCTION   bool
	PORT            string
	JWT_SECRET      string
	RESEND_API_KEY  string
	KODIK_API_KEY   string
	MOONANIME_API_KEY string
	PEPPER_PASS     string
	MAL_CLIENT_ID   string
	MAL_CLIENT_SECRET string
	MAL_REDIRECT_URI string
	DB_HOST         string
	DB_PORT         string
	DB_USER         string
	DB_PASSWORD     string
	DB_NAME         string
	DB_RESET        bool
	TRUSTED_PROXIES []string
	COOKIE_DOMAIN   string
	COOKIE_SAMESITE string
	COOKIE_SECURE   string
}

var AppConfig Config

func LoadConfig() {
	isProd := getEnvAsBool("IS_PRODUCTION", false)

	AppConfig = Config{
		IS_PRODUCTION:   isProd,
		PORT:            getEnv("PORT", "8080"),
		JWT_SECRET:      getEnv("JWT_SECRET", "your-secret-key"),
		RESEND_API_KEY:  getEnv("RESEND_API_KEY", ""),
		KODIK_API_KEY:   getEnv("KODIK_API_KEY", ""),
		MOONANIME_API_KEY: strings.TrimSpace(getEnv("MOONANIME_API_KEY", "")),
		PEPPER_PASS:     strings.TrimSpace(getEnv("PEPPER_PASS", "")),
		MAL_CLIENT_ID:   strings.TrimSpace(getEnv("MAL_CLIENT_ID", "")),
		MAL_CLIENT_SECRET: strings.TrimSpace(getEnv("MAL_CLIENT_SECRET", "")),
		MAL_REDIRECT_URI: strings.TrimSpace(getEnv("MAL_REDIRECT_URI", "http://localhost:3000/admin/mal/callback")),
		DB_HOST:         getEnv("DB_HOST", "localhost"),
		DB_PORT:         getEnv("DB_PORT", "5432"),
		DB_USER:         getEnv("DB_USER", "postgres"),
		DB_PASSWORD:     getEnv("DB_PASSWORD", ""),
		DB_NAME:         getEnv("DB_NAME", "animevista"),
		DB_RESET:        getEnvAsBool("DB_RESET", false),
		COOKIE_DOMAIN:   strings.TrimSpace(getEnv("COOKIE_DOMAIN", "")),
		COOKIE_SAMESITE: strings.TrimSpace(getEnv("COOKIE_SAMESITE", "lax")),
		COOKIE_SECURE:   strings.TrimSpace(getEnv("COOKIE_SECURE", "auto")),
	}

	if isProd {
		AppConfig.FRONTEND_URL = getEnv("FRONTEND_URL", "")
		AppConfig.BACKEND_URL = getEnv("BACKEND_URL", "")
		if AppConfig.FRONTEND_URL == "" {
			log.Println("CRITICAL: FRONTEND_URL is required in production environment.")
		}
	} else {
		AppConfig.FRONTEND_URL = getEnv("FRONTEND_URL", "http://localhost:3000")
		AppConfig.BACKEND_URL = getEnv("BACKEND_URL", "http://localhost:8080")
	}

	allowedOriginsStr := getEnv("ALLOWED_ORIGINS", "")
	if allowedOriginsStr != "" {
		AppConfig.ALLOWED_ORIGINS = splitCSV(allowedOriginsStr)
	} else {
		origins := []string{}
		if strings.TrimSpace(AppConfig.FRONTEND_URL) != "" {
			origins = append(origins, strings.TrimRight(strings.TrimSpace(AppConfig.FRONTEND_URL), "/"))
		}
		if !isProd {
			origins = append(origins, "http://localhost:3000")
		}
		AppConfig.ALLOWED_ORIGINS = uniqueNonEmpty(origins)
	}

	proxiesStr := getEnv("TRUSTED_PROXIES", "")
	if proxiesStr != "" {
		AppConfig.TRUSTED_PROXIES = splitCSV(proxiesStr)
	} else if !isProd {
		AppConfig.TRUSTED_PROXIES = []string{"127.0.0.1"}
	} else {
		AppConfig.TRUSTED_PROXIES = nil
	}
}

func (c Config) CookieSecure() bool {
	mode := strings.ToLower(strings.TrimSpace(c.COOKIE_SECURE))
	if mode == "true" || mode == "1" || mode == "yes" {
		return true
	}
	if mode == "false" || mode == "0" || mode == "no" {
		return false
	}
	return strings.HasPrefix(strings.ToLower(strings.TrimSpace(c.FRONTEND_URL)), "https://")
}

func (c Config) CookieSameSite() http.SameSite {
	s := strings.ToLower(strings.TrimSpace(c.COOKIE_SAMESITE))
	switch s {
	case "none":
		return http.SameSiteNoneMode
	case "strict":
		return http.SameSiteStrictMode
	default:
		return http.SameSiteLaxMode
	}
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	res := make([]string, 0, len(parts))
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			res = append(res, trimmed)
		}
	}
	return uniqueNonEmpty(res)
}

func uniqueNonEmpty(values []string) []string {
	seen := map[string]struct{}{}
	res := []string{}
	for _, v := range values {
		vv := strings.TrimSpace(v)
		if vv == "" {
			continue
		}
		if _, ok := seen[vv]; ok {
			continue
		}
		seen[vv] = struct{}{}
		res = append(res, vv)
	}
	return res
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getEnvAsBool(key string, fallback bool) bool {
	valStr := getEnv(key, "")
	if val, err := strconv.ParseBool(valStr); err == nil {
		return val
	}
	return fallback
}
