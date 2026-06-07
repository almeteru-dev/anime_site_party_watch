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
)

func shikimoriSearchAnimeList(ctx context.Context, q string, limit int) ([]shikimoriAnimeListItem, error) {
	q = strings.TrimSpace(q)
	if q == "" {
		return nil, errors.New("missing q")
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 50 {
		limit = 50
	}
	apiURL := "https://shikimori.one/api/animes?search=" + url.QueryEscape(q) + "&limit=" + strconv.Itoa(limit)
	client := &http.Client{Timeout: 12 * time.Second}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "LycorisLib")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == 429 {
		time.Sleep(900 * time.Millisecond)
		return shikimoriSearchAnimeList(ctx, q, limit)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("status=%d body=%s", resp.StatusCode, string(b))
	}
	var items []shikimoriAnimeListItem
	if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
		return nil, err
	}
	return items, nil
}

func shikimoriGetAnimeRaw(ctx context.Context, id int) (map[string]any, error) {
	if id <= 0 {
		return nil, errors.New("invalid id")
	}
	apiURL := "https://shikimori.one/api/animes/" + strconv.Itoa(id)
	client := &http.Client{Timeout: 12 * time.Second}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "LycorisLib")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == 429 {
		time.Sleep(900 * time.Millisecond)
		return shikimoriGetAnimeRaw(ctx, id)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("status=%d body=%s", resp.StatusCode, string(b))
	}
	var raw map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return nil, err
	}
	return raw, nil
}

func fetchShikimoriCalendar(ctx context.Context) ([]shikiCalendarItem, error) {
	apiURL := "https://shikimori.one/api/calendar"
	client := &http.Client{Timeout: 18 * time.Second}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", fmt.Sprintf("LycorisLib-ScheduleSync/%d", time.Now().Unix()))

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == 429 {
		time.Sleep(900 * time.Millisecond)
		return fetchShikimoriCalendar(ctx)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("status=%d body=%s", resp.StatusCode, string(b))
	}
	var items []shikiCalendarItem
	if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
		return nil, err
	}
	return items, nil
}

func shikimoriGetAnimeByID(ctx context.Context, client *http.Client, id int, userAgent string) (shikiAnimeFull, error) {
	if id <= 0 {
		return shikiAnimeFull{}, errors.New("invalid shikimori id")
	}
	apiURL := "https://shikimori.one/api/animes/" + strconv.Itoa(id)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return shikiAnimeFull{}, err
	}
	req.Header.Set("Accept", "application/json")
	if strings.TrimSpace(userAgent) == "" {
		userAgent = "LycorisLib"
	}
	req.Header.Set("User-Agent", userAgent)

	resp, err := client.Do(req)
	if err != nil {
		return shikiAnimeFull{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == 429 {
		time.Sleep(900 * time.Millisecond)
		return shikimoriGetAnimeByID(ctx, client, id, userAgent)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return shikiAnimeFull{}, fmt.Errorf("status=%d body=%s", resp.StatusCode, string(b))
	}
	var full shikiAnimeFull
	if err := json.NewDecoder(resp.Body).Decode(&full); err != nil {
		return shikiAnimeFull{}, err
	}
	full.ID = id
	if full.MALID == nil && full.MyAnimeListID != nil {
		mid := *full.MyAnimeListID
		full.MALID = &mid
	}
	return full, nil
}

func shikimoriGetUserByUsername(ctx context.Context, client *http.Client, username string, userAgent string) (shikiUser, error) {
	username = strings.TrimSpace(username)
	if username == "" {
		return shikiUser{}, errors.New("missing username")
	}
	apiURL := "https://shikimori.one/api/users/" + url.PathEscape(username)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return shikiUser{}, err
	}
	req.Header.Set("Accept", "application/json")
	if strings.TrimSpace(userAgent) == "" {
		userAgent = "LycorisLib"
	}
	req.Header.Set("User-Agent", userAgent)

	resp, err := client.Do(req)
	if err != nil {
		return shikiUser{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == 429 {
		time.Sleep(900 * time.Millisecond)
		return shikimoriGetUserByUsername(ctx, client, username, userAgent)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return shikiUser{}, fmt.Errorf("status=%d body=%s", resp.StatusCode, string(b))
	}
	var u shikiUser
	if err := json.NewDecoder(resp.Body).Decode(&u); err != nil {
		return shikiUser{}, err
	}
	if u.ID <= 0 {
		return shikiUser{}, errors.New("invalid shikimori user id")
	}
	return u, nil
}

func shikimoriFetchUserRates(ctx context.Context, client *http.Client, userID int, page int, limit int, userAgent string) ([]shikiUserRate, error) {
	if userID <= 0 {
		return nil, errors.New("invalid shikimori user id")
	}
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 100
	}
	q := url.Values{}
	q.Set("user_id", strconv.Itoa(userID))
	q.Set("target_type", "Anime")
	q.Set("limit", strconv.Itoa(limit))
	q.Set("page", strconv.Itoa(page))
	apiURL := "https://shikimori.one/api/v2/user_rates?" + q.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	if strings.TrimSpace(userAgent) == "" {
		userAgent = "LycorisLib"
	}
	req.Header.Set("User-Agent", userAgent)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == 429 {
		time.Sleep(900 * time.Millisecond)
		return shikimoriFetchUserRates(ctx, client, userID, page, limit, userAgent)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("status=%d body=%s", resp.StatusCode, string(b))
	}
	var rates []shikiUserRate
	if err := json.NewDecoder(resp.Body).Decode(&rates); err != nil {
		return nil, err
	}
	return rates, nil
}

