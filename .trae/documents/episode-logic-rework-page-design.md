# Page Design Spec — Episode Logic Rework (Desktop-first)

## Global Styles (all pages)
- Layout: 12-column CSS Grid container (max-width 1200–1280px), 24px gutters; internal spacing in 8px steps.
- Theme: dark-first.
  - Background: #0B0F17, Surface: #121A28, Border: rgba(255,255,255,0.08)
  - Primary: #6D5EF8, Primary hover: #7F73FF
  - Text: #E8EEF9, Muted: rgba(232,238,249,0.72)
- Typography: 14/16 body, 18/20 section headers, 24/28 page headers.
- Buttons: solid primary + subtle secondary; disabled state 40% opacity; focus ring 2px primary.
- Links: underline on hover; never rely on color alone.
- Language labels: only two options visible in UI: **RU** and **EN (Romaji)**.

---

## Page: Home
### Meta Information
- Title: "Anime"
- Description: "Browse anime and start watching episodes."

### Page Structure
- Stacked sections.

### Sections & Components
1. Top bar
   - Left: site logo
   - Right: language toggle (RU / EN (Romaji))
2. Anime grid
   - Card grid (4 columns desktop)
   - Each card: poster, title (based on language), CTA to details

---

## Page: Anime Details
### Meta Information
- Title: "{Anime Title}"
- Description: "Anime details and available voice groups."

### Layout
- Two-column: main content + right rail.

### Sections & Components
1. Header block (main)
   - Poster, title (RU/EN), short metadata
2. Voice groups (right rail)
   - List of voice groups (RU/EN names)
   - Primary CTA: "Watch" (opens player using default voice group)

---

## Page: Watch / Player
### Meta Information
- Title: "Watch — {Anime Title}"
- Description: "Watch episodes with voice group selection."

### Layout
- Desktop split: video left, controls right (sticky).

### Sections & Components
1. Video area (left, 16:9)
   - Player container
   - Loading skeleton; error panel with retry
   - Episode info bar: "Ep {episode_number}" + voice group name + server chip ("Server {server_number}")
2. Control panel (right)
   - Voice group selector
     - Tabs if <= 5 groups; otherwise dropdown
     - Shows RU/EN group names depending on language toggle
   - Episode list
     - Scrollable list; each row: episode_number, active state
     - Disabled state when episode not available

---

## Page: Admin Login
### Meta Information
- Title: "Admin Login"
- Description: "Sign in to manage voice groups and episodes."

### Layout
- Centered card (max-width 420px).

### Sections & Components
- Email + password fields
- Submit button
- Inline error text (auth failure)

---

## Page: Admin Episode Management
### Meta Information
- Title: "Episode Management"
- Description: "Manage voice groups and episodes for an anime."

### Layout
- 3-panel layout (desktop):
  - Left: voice groups
  - Center: episodes table
  - Right: editor form

### Sections & Components
1. Voice Groups panel
   - List with drag/ordering controls (or up/down buttons)
   - Create/Edit form fields:
     - name_ru (required)
     - name_en_romaji (required)
     - is_default toggle
2. Episodes panel
   - Filter row: voice group select, search by episode number
   - Table columns: episode_number, server_number, is_published, updated_at
   - Row actions: edit, delete
3. Episode editor panel
   - Fields: episode_number (int), group_id (select), server_number (int), video_url (text), is_published (toggle)
   - Save / Cancel
   - Client-side validation: block duplicate (anime_id + group_id + episode_number) before submit
