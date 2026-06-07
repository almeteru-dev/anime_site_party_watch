package handlers

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/config"
)

type malTokenRow struct {
	AccessToken  string    `json:"-"`
	RefreshToken string    `json:"-"`
	TokenType    string    `json:"token_type"`
	Scope        string    `json:"scope"`
	ExpiresAt    time.Time `json:"expires_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type malTokenResponse struct {
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
}

func randBase64URL(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func pkceChallenge(verifier string) string {
	sum := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

func AdminMALOAuthStart(c *gin.Context) {
	clientID := strings.TrimSpace(config.AppConfig.MAL_CLIENT_ID)
	clientSecret := strings.TrimSpace(config.AppConfig.MAL_CLIENT_SECRET)
	redirectURI := strings.TrimSpace(config.AppConfig.MAL_REDIRECT_URI)
	if clientID == "" || redirectURI == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "MAL client is not configured"})
		return
	}
	if clientSecret == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "MAL client secret is not configured (set MAL_CLIENT_SECRET)"})
		return
	}

	state, err := randBase64URL(24)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate state"})
		return
	}
	verifier, err := randBase64URL(64)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate verifier"})
		return
	}
	challenge := pkceChallenge(verifier)

	now := time.Now().UTC()
	exp := now.Add(10 * time.Minute)
	_ = app.DB.Exec(`DELETE FROM mal_oauth_state WHERE expires_at < NOW()`).Error
	if err := app.DB.Exec(
		`INSERT INTO mal_oauth_state (state, code_verifier, expires_at) VALUES (?, ?, ?)
		 ON CONFLICT (state) DO UPDATE SET code_verifier = EXCLUDED.code_verifier, expires_at = EXCLUDED.expires_at`,
		state,
		verifier,
		exp,
	).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store oauth state"})
		return
	}

	q := url.Values{}
	q.Set("response_type", "code")
	q.Set("client_id", clientID)
	q.Set("redirect_uri", redirectURI)
	q.Set("code_challenge", challenge)
	q.Set("code_challenge_method", "S256")
	q.Set("state", state)
	q.Set("scope", "read")
	u := url.URL{Scheme: "https", Host: "myanimelist.net", Path: "/v1/oauth2/authorize", RawQuery: q.Encode()}
	u.User = url.UserPassword(clientID, clientSecret)
	authorizeURL := u.String()
	
	c.JSON(http.StatusOK, gin.H{"authorize_url": authorizeURL})
}

func exchangeMALToken(form url.Values) (malTokenResponse, int, []byte, error) {
	client := &http.Client{Timeout: 20 * time.Second}
	req, err := http.NewRequest(http.MethodPost, "https://myanimelist.net/v1/oauth2/token", strings.NewReader(form.Encode()))
	if err != nil {
		return malTokenResponse{}, 0, nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "LycorisLib")
	resp, err := client.Do(req)
	if err != nil {
		return malTokenResponse{}, 0, nil, err
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return malTokenResponse{}, resp.StatusCode, nil, err
	}
	var out malTokenResponse
	_ = json.Unmarshal(b, &out)
	return out, resp.StatusCode, b, nil
}

func AdminMALOAuthCallback(c *gin.Context) {
	clientID := strings.TrimSpace(config.AppConfig.MAL_CLIENT_ID)
	clientSecret := strings.TrimSpace(config.AppConfig.MAL_CLIENT_SECRET)
	redirectURI := strings.TrimSpace(config.AppConfig.MAL_REDIRECT_URI)
	if clientID == "" || redirectURI == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "MAL client is not configured"})
		return
	}
	if clientSecret == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "MAL client secret is not configured (set MAL_CLIENT_SECRET)"})
		return
	}

	code := strings.TrimSpace(c.Query("code"))
	state := strings.TrimSpace(c.Query("state"))
	if code == "" || state == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing code/state"})
		return
	}

	var verifier string
	if err := app.DB.Raw(
		`SELECT code_verifier FROM mal_oauth_state WHERE state = ? AND expires_at > NOW()`,
		state,
	).Row().Scan(&verifier); err != nil || strings.TrimSpace(verifier) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired state"})
		return
	}
	_ = app.DB.Exec(`DELETE FROM mal_oauth_state WHERE state = ?`, state).Error
	_ = app.DB.Exec(`DELETE FROM mal_oauth_state WHERE expires_at < NOW()`).Error

	form := url.Values{}
	form.Set("client_id", clientID)
	form.Set("client_secret", clientSecret)
	form.Set("grant_type", "authorization_code")
	form.Set("code", code)
	form.Set("code_verifier", verifier)
	form.Set("redirect_uri", redirectURI)

	tr, status, body, err := exchangeMALToken(form)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "MAL token exchange failed"})
		return
	}
	if status < 200 || status >= 300 || strings.TrimSpace(tr.AccessToken) == "" || strings.TrimSpace(tr.RefreshToken) == "" {
		msg := "MAL token exchange failed"
		if len(body) > 0 {
			msg = msg + ": " + string(body)
		}
		c.JSON(http.StatusBadGateway, gin.H{"error": msg})
		return
	}

	expiresAt := time.Now().UTC().Add(time.Duration(tr.ExpiresIn) * time.Second)
	if err := app.DB.Exec(
		`INSERT INTO mal_oauth_tokens (id, access_token, refresh_token, token_type, scope, expires_at, updated_at)
		 VALUES (1, ?, ?, ?, ?, ?, NOW())
		 ON CONFLICT (id) DO UPDATE
		 SET access_token = EXCLUDED.access_token,
		     refresh_token = EXCLUDED.refresh_token,
		     token_type = EXCLUDED.token_type,
		     scope = EXCLUDED.scope,
		     expires_at = EXCLUDED.expires_at,
		     updated_at = NOW()`,
		strings.TrimSpace(tr.AccessToken),
		strings.TrimSpace(tr.RefreshToken),
		strings.TrimSpace(tr.TokenType),
		strings.TrimSpace(tr.Scope),
		expiresAt,
	).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store tokens"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"connected": true, "expires_at": expiresAt})
}

func AdminMALTokenStatus(c *gin.Context) {
	var row malTokenRow
	if err := app.DB.Raw(
		`SELECT access_token, refresh_token, COALESCE(token_type,''), COALESCE(scope,''), expires_at, updated_at
		 FROM mal_oauth_tokens WHERE id = 1`,
	).Scan(&row).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read tokens"})
		return
	}
	if strings.TrimSpace(row.AccessToken) == "" || strings.TrimSpace(row.RefreshToken) == "" {
		c.JSON(http.StatusOK, gin.H{"connected": false})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"connected":  true,
		"token_type": row.TokenType,
		"scope":      row.Scope,
		"expires_at":  row.ExpiresAt,
		"updated_at":  row.UpdatedAt,
	})
}

func refreshMALAccessToken() (time.Time, error) {
	clientID := strings.TrimSpace(config.AppConfig.MAL_CLIENT_ID)
	clientSecret := strings.TrimSpace(config.AppConfig.MAL_CLIENT_SECRET)
	if clientID == "" {
		return time.Time{}, http.ErrNoCookie
	}
	if clientSecret == "" {
		return time.Time{}, http.ErrNoCookie
	}
	var refresh string
	if err := app.DB.Raw(`SELECT refresh_token FROM mal_oauth_tokens WHERE id = 1`).Row().Scan(&refresh); err != nil {
		return time.Time{}, err
	}
	refresh = strings.TrimSpace(refresh)
	if refresh == "" {
		return time.Time{}, http.ErrNoCookie
	}
	form := url.Values{}
	form.Set("client_id", clientID)
	form.Set("client_secret", clientSecret)
	form.Set("grant_type", "refresh_token")
	form.Set("refresh_token", refresh)
	tr, status, body, err := exchangeMALToken(form)
	if err != nil {
		return time.Time{}, err
	}
	if status < 200 || status >= 300 || strings.TrimSpace(tr.AccessToken) == "" {
		_ = app.DB.Exec(`DELETE FROM mal_oauth_tokens WHERE id = 1`).Error
		_ = body
		return time.Time{}, http.ErrNoCookie
	}
	expiresAt := time.Now().UTC().Add(time.Duration(tr.ExpiresIn) * time.Second)
	if err := app.DB.Exec(
		`UPDATE mal_oauth_tokens
		 SET access_token = ?, refresh_token = COALESCE(NULLIF(?, ''), refresh_token), token_type = ?, scope = ?, expires_at = ?, updated_at = NOW()
		 WHERE id = 1`,
		strings.TrimSpace(tr.AccessToken),
		strings.TrimSpace(tr.RefreshToken),
		strings.TrimSpace(tr.TokenType),
		strings.TrimSpace(tr.Scope),
		expiresAt,
	).Error; err != nil {
		return time.Time{}, err
	}
	return expiresAt, nil
}

func AdminMALRefreshTokens(c *gin.Context) {
	if _, err := refreshMALAccessToken(); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to refresh"})
		return
	}
	AdminMALTokenStatus(c)
}

func AdminMALRevokeTokens(c *gin.Context) {
	_ = app.DB.Exec(`DELETE FROM mal_oauth_tokens WHERE id = 1`).Error
	_ = app.DB.Exec(`DELETE FROM mal_oauth_state WHERE expires_at < NOW()`).Error
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
