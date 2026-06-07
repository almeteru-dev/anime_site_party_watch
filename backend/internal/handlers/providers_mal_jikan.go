package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/config"
)

func getMALAccessToken() (string, error) {
	var access string
	var expiresAt time.Time
	err := app.DB.Raw(`SELECT access_token, expires_at FROM mal_oauth_tokens WHERE id = 1`).Row().Scan(&access, &expiresAt)
	if err != nil {
		return "", err
	}
	access = strings.TrimSpace(access)
	if access == "" {
		return "", http.ErrNoCookie
	}
	now := time.Now().UTC()
	if expiresAt.Before(now.Add(60 * time.Second)) {
		if _, err := refreshMALAccessToken(); err != nil {
			return "", err
		}
		if err := app.DB.Raw(`SELECT access_token FROM mal_oauth_tokens WHERE id = 1`).Row().Scan(&access); err != nil {
			return "", err
		}
		access = strings.TrimSpace(access)
		if access == "" {
			return "", http.ErrNoCookie
		}
	}
	return access, nil
}

func doMALGet(path string, qs url.Values) (int, []byte, error) {
	clientID := strings.TrimSpace(config.AppConfig.MAL_CLIENT_ID)
	if clientID == "" {
		return 0, nil, http.ErrNoCookie
	}
	access, _ := getMALAccessToken()
	base := "https://api.myanimelist.net/v2" + path
	if qs != nil && len(qs) > 0 {
		base += "?" + qs.Encode()
	}
	client := &http.Client{Timeout: 20 * time.Second}
	req, err := http.NewRequest(http.MethodGet, base, nil)
	if err != nil {
		return 0, nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "LycorisLib")
	if clientID != "" {
		req.Header.Set("X-MAL-CLIENT-ID", clientID)
	}
	if strings.TrimSpace(access) != "" {
		req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(access))
	}
	resp, err := client.Do(req)
	if err != nil {
		return 0, nil, err
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return resp.StatusCode, nil, err
	}
	return resp.StatusCode, b, nil
}

func fetchJikanEnrichment(ctx context.Context, client *http.Client, malID int) (jikanEnrichment, error) {
	apiURL := "https://api.jikan.moe/v4/anime/" + strconv.Itoa(malID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return jikanEnrichment{}, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "LycorisLib")

	resp, err := client.Do(req)
	if err != nil {
		return jikanEnrichment{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == 429 || resp.StatusCode == 502 || resp.StatusCode == 504 {
		time.Sleep(900 * time.Millisecond)
		return fetchJikanEnrichment(ctx, client, malID)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return jikanEnrichment{}, fmt.Errorf("status=%d body=%s", resp.StatusCode, string(b))
	}
	var raw map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return jikanEnrichment{}, err
	}
	data, _ := raw["data"].(map[string]any)
	if data == nil {
		return jikanEnrichment{}, errors.New("missing data")
	}
	out := jikanEnrichment{}
	if v, ok := data["synopsis"].(string); ok {
		out.Synopsis = strings.TrimSpace(v)
	}
	if v, ok := data["title_english"].(string); ok {
		out.TitleEnglish = strings.TrimSpace(v)
	}
	if v, ok := data["source"].(string); ok {
		out.Source = strings.TrimSpace(v)
	}
	if arr, ok := data["producers"].([]any); ok {
		for _, it := range arr {
			m, _ := it.(map[string]any)
			name, _ := m["name"].(string)
			name = strings.TrimSpace(name)
			if name != "" {
				out.Producers = append(out.Producers, name)
			}
		}
	}
	if arr, ok := data["themes"].([]any); ok {
		for _, it := range arr {
			m, _ := it.(map[string]any)
			name, _ := m["name"].(string)
			name = strings.TrimSpace(name)
			if name != "" {
				out.Themes = append(out.Themes, name)
			}
		}
	}
	if images, ok := data["images"].(map[string]any); ok {
		if webp, ok := images["webp"].(map[string]any); ok {
			if v, ok := webp["large_image_url"].(string); ok {
				out.PosterURL = strings.TrimSpace(v)
			}
			if out.PosterURL == "" {
				if v, ok := webp["image_url"].(string); ok {
					out.PosterURL = strings.TrimSpace(v)
				}
			}
		}
		if out.PosterURL == "" {
			if jpg, ok := images["jpg"].(map[string]any); ok {
				if v, ok := jpg["large_image_url"].(string); ok {
					out.PosterURL = strings.TrimSpace(v)
				}
				if out.PosterURL == "" {
					if v, ok := jpg["image_url"].(string); ok {
						out.PosterURL = strings.TrimSpace(v)
					}
				}
			}
		}
	}
	if tr, ok := data["trailer"].(map[string]any); ok {
		if v, ok := tr["embed_url"].(string); ok {
			out.TrailerURL = strings.TrimSpace(v)
		}
		if out.TrailerURL == "" {
			if v, ok := tr["url"].(string); ok {
				out.TrailerURL = strings.TrimSpace(v)
			}
		}
		out.TrailerURL = strings.Replace(out.TrailerURL, "http://", "https://", 1)
	}
	return out, nil
}

func fetchJikanAnimeFull(ctx context.Context, malID int64) (jikanAnimeResp, error) {
	ctx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()
	url := "https://api.jikan.moe/v4/anime/" + strconv.FormatInt(malID, 10)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return jikanAnimeResp{}, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "LycorisLib-JikanHydrate")

	client := &http.Client{Timeout: 25 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return jikanAnimeResp{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == 429 || resp.StatusCode == 502 || resp.StatusCode == 503 || resp.StatusCode == 504 {
		time.Sleep(900 * time.Millisecond)
		return fetchJikanAnimeFull(ctx, malID)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return jikanAnimeResp{}, fmt.Errorf("jikan status=%d", resp.StatusCode)
	}
	var parsed jikanAnimeResp
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return jikanAnimeResp{}, err
	}
	if parsed.Data.MalID <= 0 {
		return jikanAnimeResp{}, errors.New("invalid jikan payload")
	}
	return parsed, nil
}

func jikanGetAnimeRaw(ctx context.Context, id int) (int, []byte, error) {
	apiURL := "https://api.jikan.moe/v4/anime/" + strconv.Itoa(id)
	client := &http.Client{Timeout: 20 * time.Second}

	var lastStatus int
	var lastBody []byte
	for attempt := 0; attempt < 3; attempt++ {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
		if err != nil {
			return 0, nil, err
		}
		req.Header.Set("Accept", "application/json")
		req.Header.Set("User-Agent", "LycorisLib")
		resp, err := client.Do(req)
		if err != nil {
			return 0, nil, err
		}
		b, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			return resp.StatusCode, nil, err
		}
		lastStatus = resp.StatusCode
		lastBody = b
		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			return lastStatus, lastBody, nil
		}
		if resp.StatusCode == 429 || resp.StatusCode == 502 || resp.StatusCode == 504 {
			time.Sleep(time.Duration(600+attempt*900) * time.Millisecond)
			continue
		}
		break
	}
	return lastStatus, lastBody, nil
}
