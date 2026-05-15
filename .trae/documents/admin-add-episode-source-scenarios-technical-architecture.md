## 1.Architecture design
```mermaid
graph TD
  A["User Browser"] --> B["Next.js (React) Frontend"]
  B --> C["HTTP API (/api)"]
  C --> D["Go API (Gin)"]
  D --> E["PostgreSQL"]

  B --> F["External Video Providers"]

  subgraph "Frontend Layer"
    B
  end

  subgraph "Backend Layer"
    D
  end

  subgraph "Data Layer"
    E
  end

  subgraph "External Services"
    F
  end
```

## 2.Technology Description
- Frontend: Next.js (React) + TypeScript + tailwindcss + shadcn/ui
- Backend: Go + gin + gorm
- Database: PostgreSQL

## 3.Route definitions
| Route | Purpose |
|-------|---------|
| /anime/[slug] | Public watch page (episode + source playback) |
| /admin/animes/[id] | Admin anime editor (episodes + sources management) |
| /login | Admin login entry (existing) |

## 4.API definitions
### 4.1 Core API
**Create episode with optional initial source (refactor)**

`POST /api/admin/animes/:animeId/episodes`

Request (new shape; backwards-compatible server should still accept the old shape initially):
```ts
type CreateEpisodeRequest = {
  episode: { group_id: number; number: number; duration?: number }
  initial_source?: {
    scenario: "standard" | "integrated" | "external"
    label_id?: number | null
    label?: string
    type: "iframe" | "direct"
    url: string
    audio?: "dub" | "sub" // required for scenario=standard
  }
}
```

Server-side scenario validation rules:
- standard: require audio; force is_integrated_player=false
- integrated: ignore audio; force is_integrated_player=true
- external: require label_id resolves to video_labels.is_external_player=true; force “hide language selection” semantics (handled by watch UI using video_label.is_external_player)

Response:
- Return created episode including `video_sources[]` (and `video_sources[].video_label`) so the admin UI can immediately reflect the created state.

**Public watch data requirement**
- Ensure public endpoints used by the watch page preload `VideoSources.VideoLabel` so the frontend can detect `is_external_player`.

## 5.Server architecture diagram
```mermaid
graph TD
  A["Next.js Frontend"] --> B["HTTP Handlers (Gin)"]
  B --> C["Service / Validation"]
  C --> D["Repository (GORM)"]
  D --> E["PostgreSQL"]

  subgraph "Server"
    B
    C
    D
  end
```

## 6.Data model(if applicable)
### 6.1 Data model definition
```mermaid
erDiagram
  EPISODES ||--o{ VIDEO_SOURCES : has
  VIDEO_LABELS ||--o{ VIDEO_SOURCES : categorizes

  EPISODES {
    bigint id
    bigint anime_id
    bigint group_id
    int number
    int duration
  }

  VIDEO_SOURCES {
    bigint id
    bigint episode_id
    bigint label_id
    string label
    string type
    string url
    string audio
    boolean is_integrated_player
    boolean is_default
    boolean is_active
    int sort_order
  }

  VIDEO_LABELS {
    bigint id
    string name
    boolean is_external_player
  }
```

### 6.2 Data Definition Language
No new tables required.
- Reuse existing `video_sources.is_integrated_player` and `video_labels.is_external_player` to express the 3 scenarios.
- If you add the new `scenario` request wrapper, it is API-only (no DB migration).
