package handlers

import (
	"context"
	"net/http"
	"strings"
	"time"
)

func fetchShikiAnimeWithJikanEnrichment(ctx context.Context, client *http.Client, shikiID int, userAgent string) (shikiAnimeFull, int, *jikanEnrichment, error) {
	shikiFull, err := shikimoriGetAnimeByID(ctx, client, shikiID, userAgent)
	if err != nil {
		return shikiAnimeFull{}, 0, nil, err
	}
	malID := 0
	if shikiFull.MALID != nil {
		malID = *shikiFull.MALID
	} else if shikiFull.MyAnimeListID != nil {
		malID = *shikiFull.MyAnimeListID
	}
	if malID <= 0 {
		return shikiFull, 0, nil, nil
	}
	e, err := fetchJikanEnrichment(ctx, client, malID)
	if err != nil {
		return shikiFull, malID, nil, nil
	}
	if strings.TrimSpace(e.PosterURL) == "" && strings.TrimSpace(shikiFull.Image.Original) != "" {
		e.PosterURL = absShikiURL(shikiFull.Image.Original)
	}
	time.Sleep(250 * time.Millisecond)
	return shikiFull, malID, &e, nil
}

