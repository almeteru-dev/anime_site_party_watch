# Page Design — Voice Groups + Episodes + Admin Tabs + RU/EN Player

## Global Styles (desktop-first)
- Layout system: CSS Grid for page scaffolding, Flexbox for toolbars/controls.
- Max content width: 1120–1280px container; full-bleed hero allowed.
- Spacing scale: 4/8/12/16/24/32.
- Colors: dark UI (existing), primary accent for active selection; destructive red for delete.
- Typography: base 14–16px, headings 20/24/32.
- Buttons: primary (solid), secondary (outline), ghost (minimal); hover increases contrast.
- Language: all UI text must support **RU** and **EN (Romaji)** only (no additional locales).

---

## 1) Home
### Meta Information
- Title: “AnimeVista — Home”
- Description: “Browse anime and open details to watch episodes.”

### Page Structure
- Header row: logo + primary nav + RU/EN toggle.
- Main: anime grid (cards).

### Sections & Components
- RU/EN Toggle
  - Two-segment control: RU | EN (Romaji).
  - Persists selection (client state + localStorage).
- Anime Grid
  - Card: poster, title (based on selected language), quick metadata.
  - Click navigates to `/anime/:slug`.

---

## 2) Anime Details (with Player section)
### Meta Information
- Title: “{Title} — Watch”
- Description: Uses RU title when RU selected; Romaji title when EN selected.
- Open Graph: poster image, canonical URL by slug.

### Page Structure
- Top: hero header (poster + titles + meta).
- Middle: Player module (video + selectors).
- Bottom: synopsis + related info.

### Sections & Components
- Hero Header
  - Poster image; Title RU + Title Romaji (one prominent based on toggle; other as secondary).
  - CTA: “Start watching” scrolls to player.
- Player
  - Video area (16:9):
    - If `video_url` is an iframe/embed → render iframe.
    - Else render HTML5 video player.
    - If no episodes available → show trailer.
  - Server selector: segmented “Server 1 / 2 / 3” (only show available servers if API provides).
  - Type selector: “Dubbed” / “Subbed” (label localized RU/EN).
  - Voice group chips:
    - Display `name_ru` or `name_en_romaji` based on toggle.
    - Default selection: `is_default=true`, else first by `display_order`.
  - Episode grid:
    - Numbered buttons; active highlighted.
    - Disabled state if no episodes.

---

## 3) Admin Login
### Meta Information
- Title: “Admin — Login”
- Description: “Sign in to manage anime content.”

### Page Structure
- Centered panel (max 420px): email/password.

### Sections & Components
- Login form: email, password, submit.
- Error banner: auth failure.

---

## 4) Admin Anime Editor (step-by-step tabs)
### Meta Information
- Title: “Admin — Edit Anime”
- Description: “Step-by-step editor for anime, voice groups, and episodes.”

### Layout
- Desktop: 2-column grid.
  - Left: vertical step tabs.
  - Right: active step content.
- Responsive: tabs become horizontal at top on small screens.

### Steps (Tabs) & Requirements
1. Basics
   - Slug preview (read-only).
   - Poster URL, Trailer URL.
2. Translations (RU + Romaji)
   - Required: Title RU, Title Romaji.
   - Optional: Description RU, Description Romaji.
3. Metadata
   - Studio, Status, Source, Genres, Episodes count, Duration.
4. Voice Groups
   - List voice groups for this anime.
   - Create/edit: name_ru, name_en_romaji, type (dub/sub), display_order, is_default.
   - Validation: exactly one default per (anime, type) recommended.
5. Episodes
   - Filters: server number + voice group.
   - Add/edit episode: episode_number, video_url, duration, is_published.
   - Validation: block duplicates for (anime_id, voice_group_id, episode_number).
6. Review & Save
   - Summary of changes + final Save.

### Interaction & States
- Tabs show completion markers for required fields.
- Save is disabled until required fields in Basics/Translations are filled.
- Destructive actions (delete group/episode) require confirmation modal.
