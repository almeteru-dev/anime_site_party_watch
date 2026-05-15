package app

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/seva/animevista/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() {
	dsn := PostgresDSN()

	var err error
	DB, err = gorm.Open(postgres.New(postgres.Config{DSN: dsn, PreferSimpleProtocol: true}), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connection established")

	reset := config.AppConfig.DB_RESET
	if reset {
		if err := dropAllTables(DB); err != nil {
			log.Fatalf("Failed to reset database: %v", err)
		}
	}

	if err := runSQLMigrations(DB, "migrations"); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	log.Println("Database migrations applied")

	// Run Seeder
	Seed(DB)

	InitEnt()
}

func dropAllTables(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	return db.Exec(`
DROP TABLE IF EXISTS user_collections CASCADE;
DROP TABLE IF EXISTS anime_genres CASCADE;
		DROP TABLE IF EXISTS anime_ratings CASCADE;
DROP TABLE IF EXISTS video_sources CASCADE;
DROP TABLE IF EXISTS video_labels CASCADE;
DROP TABLE IF EXISTS faq_items CASCADE;
DROP TABLE IF EXISTS collection_type_translations CASCADE;
DROP TABLE IF EXISTS genre_translations CASCADE;
DROP TABLE IF EXISTS studio_translations CASCADE;
DROP TABLE IF EXISTS source_translations CASCADE;
DROP TABLE IF EXISTS status_translations CASCADE;
DROP TABLE IF EXISTS anime_translations CASCADE;
DROP TABLE IF EXISTS anime_alt_titles CASCADE;
		DROP TABLE IF EXISTS anime_gallery_images CASCADE;
DROP TABLE IF EXISTS episodes CASCADE;
DROP TABLE IF EXISTS voice_groups CASCADE;
DROP TABLE IF EXISTS rating_options CASCADE;
DROP TABLE IF EXISTS kind_options CASCADE;
DROP TABLE IF EXISTS anime CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS studios CASCADE;
DROP TABLE IF EXISTS genres CASCADE;
DROP TABLE IF EXISTS collection_types CASCADE;
DROP TABLE IF EXISTS sources CASCADE;
DROP TABLE IF EXISTS statuses CASCADE;
DROP TABLE IF EXISTS languages CASCADE;
`).Error
}

func runSQLMigrations(db *gorm.DB, migrationsDir string) error {
	if err := db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			name TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`).Error; err != nil {
		return fmt.Errorf("create schema_migrations: %w", err)
	}

	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("read migrations dir: %w", err)
	}

	files := make([]string, 0)
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		name := e.Name()
		if strings.HasSuffix(name, ".sql") {
			files = append(files, name)
		}
	}
	sort.Strings(files)

	var appliedCount int64
	if err := db.Raw(`SELECT COUNT(*) FROM schema_migrations`).Row().Scan(&appliedCount); err != nil {
		return fmt.Errorf("count schema_migrations: %w", err)
	}

	if appliedCount == 0 {
		var hasAnimeTable bool
		if err := db.Raw(`SELECT to_regclass('public.anime') IS NOT NULL`).Row().Scan(&hasAnimeTable); err != nil {
			return fmt.Errorf("detect anime table: %w", err)
		}
		if hasAnimeTable {
			var hasBackgroundURL bool
			var hasGallery bool
			var hasVoiceGroupID bool
			_ = db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='anime' AND column_name='background_url')`).Row().Scan(&hasBackgroundURL)
			_ = db.Raw(`SELECT to_regclass('public.anime_gallery_images') IS NOT NULL`).Row().Scan(&hasGallery)
			_ = db.Raw(`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='video_sources' AND column_name='voice_group_id')`).Row().Scan(&hasVoiceGroupID)

			if hasBackgroundURL || hasGallery || hasVoiceGroupID {
				for _, name := range files {
					if err := db.Exec(`INSERT INTO schema_migrations (name) VALUES (?) ON CONFLICT (name) DO NOTHING`, name).Error; err != nil {
						return fmt.Errorf("bootstrap schema_migrations (%s): %w", name, err)
					}
				}
				return nil
			}
		}
	}

	for _, name := range files {
		var already bool
		if err := db.Raw(`SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE name = ?)`, name).Row().Scan(&already); err != nil {
			return fmt.Errorf("check migration %s: %w", name, err)
		}
		if already {
			continue
		}

		path := filepath.Join(migrationsDir, name)
		b, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", name, err)
		}
		sql := strings.TrimSpace(string(b))
		if sql == "" {
			continue
		}
		if err := db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Exec(sql).Error; err != nil {
				return err
			}
			return tx.Exec(`INSERT INTO schema_migrations (name) VALUES (?)`, name).Error
		}); err != nil {
			return fmt.Errorf("exec migration %s: %w", name, err)
		}
	}
	return nil
}
