package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/seva/animevista/internal/app"
	"github.com/seva/animevista/internal/validation"
)

type AnimeSearchItem struct {
	ID      int64  `json:"id"`
	URL     string `json:"url"`
	Image   string `json:"image_url"`
	TitleRU string `json:"title_ru"`
	TitleEN string `json:"title_en"`
}

func SearchAnimes(c *gin.Context) {
	q := validation.SanitizeSearchQuery(c.Query("q"))
	if len([]rune(q)) < 2 {
		c.JSON(http.StatusOK, []AnimeSearchItem{})
		return
	}

	like := "%" + q + "%"
	qLower := strings.ToLower(q)

	rows := make([]AnimeSearchItem, 0, 10)
	err := app.DB.Raw(
		`
		SELECT
		  a.id AS id,
		  a.url AS url,
		  COALESCE(a.image, '') AS image_url,
		  COALESCE((
			SELECT at_ru.title
			FROM anime_translations at_ru
			JOIN languages l_ru ON l_ru.id = at_ru.language_id
			WHERE at_ru.anime_id = a.id AND l_ru.code = 'ru'
			LIMIT 1
		  ), '') AS title_ru,
		  COALESCE((
			SELECT at_en.title
			FROM anime_translations at_en
			JOIN languages l_en ON l_en.id = at_en.language_id
			WHERE at_en.anime_id = a.id AND l_en.code = 'en'
			LIMIT 1
		  ), a.name) AS title_en
		FROM anime a
		WHERE
		  a.name ILIKE ? OR
		  EXISTS (
			SELECT 1
			FROM anime_translations at
			WHERE at.anime_id = a.id AND at.title ILIKE ?
		  ) OR
		  EXISTS (
			SELECT 1
			FROM anime_alt_titles t
			WHERE t.anime_id = a.id AND t.title ILIKE ?
		  )
		ORDER BY
		  CASE
			WHEN lower(a.name) = ? THEN 0
			WHEN EXISTS (
			  SELECT 1
			  FROM anime_translations at
			  WHERE at.anime_id = a.id AND lower(at.title) = ?
			) THEN 0
			WHEN lower(a.name) LIKE (? || '%') THEN 1
			WHEN EXISTS (
			  SELECT 1
			  FROM anime_translations at
			  WHERE at.anime_id = a.id AND lower(at.title) LIKE (? || '%')
			) THEN 1
			ELSE 2
		  END,
		  a.score DESC,
		  a.id DESC
		LIMIT 10
		`,
		like,
		like,
		like,
		qLower,
		qLower,
		qLower,
		qLower,
	).Scan(&rows).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search"})
		return
	}

	c.JSON(http.StatusOK, rows)
}
