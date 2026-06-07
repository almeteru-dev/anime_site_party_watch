package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"sync/atomic"
	"testing"
)

func TestFetchMoonanimeRecentEpisodesAllWith_PaginatesToWantedCount(t *testing.T) {
	var calls int64
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt64(&calls, 1)
		q := r.URL.Query()
		page, _ := strconv.Atoi(q.Get("page"))
		limit, _ := strconv.Atoi(q.Get("limit"))
		if page <= 0 {
			page = 1
		}
		if limit <= 0 {
			limit = 100
		}
		if limit > 100 {
			limit = 100
		}

		want := 1053
		start := (page - 1) * limit
		if start >= want {
			_ = json.NewEncoder(w).Encode(moonanimeRecentResponse{Status: "success", Data: []moonanimeEpisodeEntry{}, Pagination: moonanimePagination{CurrentPage: page, TotalPages: 11, TotalItems: want, PerPage: limit, NextPage: nil}})
			return
		}
		end := start + limit
		if end > want {
			end = want
		}
		items := make([]moonanimeEpisodeEntry, 0, end-start)
		for i := start; i < end; i++ {
			n := i + 1
			items = append(items, moonanimeEpisodeEntry{
				VideoID: int64(n),
				Slug:    "x",
				URL: struct {
					Iframe string `json:"iframe"`
					Vod    string `json:"vod"`
				}{Iframe: "https://example.com/" + strconv.Itoa(n)},
				Episode:      n,
				Season:       1,
				Studio:       "Moon",
				SelectedType: "dubbed",
				MalID:        9253,
			})
		}
		var next *int
		if end < want {
			n := page + 1
			next = &n
		}
		_ = json.NewEncoder(w).Encode(moonanimeRecentResponse{Status: "success", Data: items, Pagination: moonanimePagination{CurrentPage: page, TotalPages: 11, TotalItems: want, PerPage: limit, NextPage: next}})
	}))
	defer srv.Close()

	ctx := context.Background()
	client := srv.Client()
	baseURL := srv.URL
	items, err := fetchMoonanimeRecentEpisodesAllWith(ctx, client, baseURL, "k", 9253, 1053)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(items) != 1053 {
		t.Fatalf("expected %d items, got %d", 1053, len(items))
	}
	if got := atomic.LoadInt64(&calls); got != 11 {
		t.Fatalf("expected %d requests, got %d", 11, got)
	}
}
