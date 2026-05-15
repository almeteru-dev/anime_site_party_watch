# LycorisLib — Fullstack Anime Platform

LycorisLib is a modern platform designed for tracking anime, managing personal collections, and engaging with the community.

## 🎨 Frontend
The frontend is built with **Next.js** using the **App Router** architecture.

- **Tech Stack:**
  - **Framework:** Next.js 14+ (React)
  - **Language:** TypeScript
  - **Styling:** Tailwind CSS
  - **UI Components:** shadcn/ui
- **Key Pages:**
  - `Home`: Gallery sections and featured anime collections.
  - `Anime Details`: Detailed info, similar titles, and source material data.
  - `User Dashboard`: The hub for user management.
    - **Personal Collections**: Custom anime lists (Watching, Planned, Dropped) with advanced filtering.
- **Auth & Security System:**
  - Full user lifecycle management implemented via specialized pages:
    - `/login` & `/register` — Authentication and account creation.
    - `/verify-email` & `/verify-confirm` — Email verification workflow.
    - `/forgot-password` & `/reset-password` — Password recovery cycle.

## 🗄 Database
The database is powered by **PostgreSQL**, designed with multi-language support and strict relational integrity.

- **Schema Design:**
  - **i18n Support**: Dedicated translation tables for all dictionaries (genres, statuses, studios, sources).
  - **Media Sources**: Support for various source types (Manga, Light Novel, Original, etc.).
- **Authentication**: Tables prepared for storing secure password hashes, verification statuses, and user metadata.
- **Security**: System IDs use `BIGINT GENERATED ALWAYS AS IDENTITY` to prevent external ID tampering.

## ⚙️ Backend (Go)
The backend is implemented in **Go (Golang)**, focusing on high performance and clean architecture.

### Tooling & Libraries:
- **Framework:** `Gin` — High-performance HTTP framework for routing.
- **ORM:** `GORM` — For developer-friendly DB interactions.
- **Driver:** `pgx` — Modern, efficient PostgreSQL driver.
- **Validation:** `go-playground/validator` — For strict input validation (registration, passwords, etc.).

### Project Structure:
Following the **Standard Go Project Layout**:
```text
backend/
├── cmd/api/main.go          # Application entry point
├── internal/                # Private application logic
│   ├── handlers/            # API Route handlers (Auth, User, Anime)
│   ├── service/             # Business logic (Hashing, Token logic, Verification)
│   ├── repository/          # Database access layer (SQL)
│   └── models/              # Go structs representing DB tables
├── migrations/              # Database schema (schema.sql with source support)
├── configs/                 # Configuration management
└── .env                     # App secrets (DB_URL, SMTP_SETTINGS for emails)
