package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/seva/animevista/internal/app"
)

type MALTopAnimeRow struct {
	Rank     int   `json:"rank"`
	AnimeID  int64 `json:"anime_id"`
	Title    string `json:"title"`
	ImageURL string `json:"image_url,omitempty"`
}

type malRankingResponse struct {
	Data []struct {
		Node struct {
			ID          int64  `json:"id"`
			Title       string `json:"title"`
			MainPicture *struct {
				Large string `json:"large"`
			} `json:"main_picture"`
		} `json:"node"`
		Ranking struct {
			Rank int `json:"rank"`
		} `json:"ranking"`
	} `json:"data"`
}

func SyncMALTopAnime(ctx context.Context) error {
	clientID := strings.TrimSpace(os.Getenv("MAL_CLIENT_ID"))
	if clientID == "" {
		return errors.New("MAL_CLIENT_ID is missing")
	}

	reqCtx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, http.MethodGet, "https://api.myanimelist.net/v2/anime/ranking?ranking_type=all&limit=100", nil)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("X-MAL-CLIENT-ID", clientID)
	req.Header.Set("User-Agent", "LycorisLib-MALSync")

	hc := &http.Client{Timeout: 25 * time.Second}
	resp, err := hc.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("MAL request failed: status=%d", resp.StatusCode)
	}

	var parsed malRankingResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return err
	}

	if len(parsed.Data) == 0 {
		return errors.New("MAL returned empty data")
	}

	rows := make([]MALTopAnimeRow, 0, 100)
	for _, it := range parsed.Data {
		rank := it.Ranking.Rank
		if rank <= 0 {
			continue
		}
		id := it.Node.ID
		title := strings.TrimSpace(it.Node.Title)
		if id <= 0 || title == "" {
			continue
		}
		img := ""
		if it.Node.MainPicture != nil {
			img = strings.TrimSpace(it.Node.MainPicture.Large)
		}
		rows = append(rows, MALTopAnimeRow{Rank: rank, AnimeID: id, Title: title, ImageURL: img})
	}

	if len(rows) < 50 {
		return fmt.Errorf("MAL returned too few valid rows: %d", len(rows))
	}

	tx := app.DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer func() { _ = tx.Rollback().Error }()

	for _, r := range rows {
		if err := tx.Exec(
			`INSERT INTO mal_top_anime (rank, anime_id, title, image_url, updated_at)
			 VALUES (?, ?, ?, ?, NOW())
			 ON CONFLICT (rank) DO UPDATE
			 SET anime_id = EXCLUDED.anime_id,
			     title = EXCLUDED.title,
			     image_url = EXCLUDED.image_url,
			     updated_at = NOW()`,
			r.Rank,
			r.AnimeID,
			r.Title,
			r.ImageURL,
		).Error; err != nil {
			return err
		}
	}

	if err := tx.Commit().Error; err != nil {
		return err
	}
	return nil
}

