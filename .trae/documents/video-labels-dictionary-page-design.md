# Page Design — Video Labels Dictionary

## Global Styles (desktop-first)
- Layout system: CSS Grid for page shells; Flexbox for row-level alignment.
- Spacing: 8px base spacing scale (8/16/24/32).
- Typography: 14px body, 16px section headers, 20–24px page titles.
- Colors: neutral background (#0b0f14 or existing app bg), surface cards (#111827), primary accent (existing brand), danger for archive.
- Buttons: primary/secondary/ghost; hover = +4% brightness; disabled = 40% opacity.
- Chips/Badges: pill with label name; external-player badge variant.

---

## 1) Watch Page
### Meta Information
- Title: "Watch — {Anime Title} E{Episode}" 
- Description: "Watch {Anime Title} episode {Episode}."
- Open Graph: title + canonical URL; optional thumbnail if already supported.

### Layout
- Desktop: 2-column grid
  - Left (fluid): player area
  - Right (360–420px): episode/source panel
- Responsive
  - Tablet/mobile: stacked; player on top, panels below.

### Page Structure
1. Top bar (existing): anime title, episode selector/back.
2. Main content grid: Player + Side panel.

### Sections & Components
- Player Container
  - Standard mode: existing embedded player.
  - External-player mode: keep the existing external embed/open behavior; show a small “External player” hint next to label badge.
- Source List
  - Each source row shows: source name + **Label chip** (from `video_labels.name`).
  - Selecting a source triggers refetch/render using that source.
- Audio Controls (Dub/Sub)
  - Visible only when selected source label has `is_external_player=false`.
  - When hidden, the layout collapses (no empty reserved space).
- Edge states
  - Missing/archived label: show “Unknown label” chip in muted style.

---

## 2) Admin: Video Labels
### Meta Information
- Title: "Admin — Video Labels"
- Description: "Manage global video labels used by sources."

### Layout
- Desktop: centered content (max-width 1100–1200px).
- Main area uses card + table layout.

### Page Structure
1. Header row: page title + “Create label” primary button.
2. Labels table card.
3. Create/Edit drawer (right side) or modal (center).

### Sections & Components
- Labels Table
  - Columns: Name, External Player (Yes/No), Status (Active/Archived), Updated.
  - Row actions: Edit, Archive/Restore.
- Create/Edit Form
  - Fields: Name (required), External Player (toggle), Status (active toggle).
  - Validation: prevent empty name; warn on duplicate name.
- Safety
  - Archive confirmation dialog explaining impact (existing sources keep showing the label; new assignment blocked).

---

## 3) Admin: Episode Sources (Label Assignment)
### Meta Information
- Title: "Admin — Episode Sources"

### Layout
- Existing admin layout; extend source row editor.

### Sections & Components
- Source Row Editor
  - Replace free-text label input with a searchable dropdown:
    - Options display label name + external-player badge.
    - Default filtering to Active labels; archived visible only if already selected.
  - Save persists `label_id`.
- Display
  - If label is missing, show “Unknown/Deleted label” state with a prompt to reassign.
