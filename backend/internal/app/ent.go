package app

import (
	"fmt"
	"log"
	"strings"

	_ "github.com/lib/pq"
	"github.com/seva/animevista/ent"
	"github.com/seva/animevista/internal/config"
)

var Ent *ent.Client

func PostgresDSN() string {
	c := config.AppConfig
	return fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		c.DB_HOST, c.DB_USER, c.DB_PASSWORD, c.DB_NAME, c.DB_PORT)
}

func InitEnt() {
	dsn := strings.TrimSpace(PostgresDSN())
	client, err := ent.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Failed to init ent client: %v", err)
	}
	Ent = client
}
