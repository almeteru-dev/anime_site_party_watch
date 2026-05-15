package service

import (
	"context"
	"log"
	"math"
	"time"

	"github.com/seva/animevista/ent"
	"github.com/seva/animevista/ent/anime"
	"github.com/seva/animevista/ent/userrating"
)

type animeRatingAggRow struct {
	AnimeID int64   `json:"anime_id"`
	Avg     float64 `json:"avg"`
}

func StartAnimeAverageRatingWorker(ctx context.Context, client *ent.Client) {
	ticker := time.NewTicker(time.Minute)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if err := recalcAnimeAverageRatings(ctx, client); err != nil {
					log.Printf("rating worker: %v", err)
				}
			}
		}
	}()
}

func recalcAnimeAverageRatings(ctx context.Context, client *ent.Client) error {
	rows := make([]animeRatingAggRow, 0)
	err := client.UserRating.
		Query().
		GroupBy(userrating.FieldAnimeID).
		Aggregate(ent.As(ent.Mean(userrating.FieldRating), "avg")).
		Scan(ctx, &rows)
	if err != nil {
		return err
	}

	ratedIDs := make([]int64, 0, len(rows))
	for _, row := range rows {
		rounded := math.Round(row.Avg*10) / 10
		_, err := client.Anime.
			UpdateOneID(row.AnimeID).
			SetAverageRating(rounded).
			SetUpdatedAt(time.Now()).
			Save(ctx)
		if err != nil {
			return err
		}
		ratedIDs = append(ratedIDs, row.AnimeID)
	}

	if len(ratedIDs) > 0 {
		_, err = client.Anime.
			Update().
			Where(anime.IDNotIn(ratedIDs...)).
			SetAverageRating(0).
			SetUpdatedAt(time.Now()).
			Save(ctx)
		if err != nil {
			return err
		}
	} else {
		_, err = client.Anime.
			Update().
			SetAverageRating(0).
			SetUpdatedAt(time.Now()).
			Save(ctx)
		if err != nil {
			return err
		}
	}

	return nil
}
