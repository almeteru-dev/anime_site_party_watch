# Page Design — Multi-Server Episode Video Sources

## Global Styles (All Pages)
- Desktop-first container: max-width 1200px; 24px side padding; 12-column grid.
- Typography: base 16px; headings 28/22/18; body 16/14.
- Colors (tokens):
  - Background: #0B0F17
  - Surface: #121826
  - Text: #E5E7EB
  - Muted: #9CA3AF
  - Primary: #6366F1
  - Danger: #EF4444
  - Border: rgba(255,255,255,0.08)
- Buttons:
  - Primary filled; hover: +8% brightness; disabled: 50% opacity.
  - Secondary outline; hover: surface highlight.
- Inputs: full-width; 40px height; error state with danger border + helper text.
- Transitions: 150–200ms for hover/focus and tab switching.

## Page: Watch Episode
### Layout
- Hybrid: stacked layout with CSS Grid.
- Desktop: 2 rows (player, details) with a right-side column for server list if space permits (grid template: 8/4).
- Tablet/mobile: single column; server list becomes horizontal scroll pills.

### Meta Information
- Title: "{Anime Title} — Episode {N}"
- Description: "Watch episode {N} and switch streaming sources."
- Open Graph: title + canonical watch URL.

### Page Structure
1. Top navigation bar
2. Player area (surface card)
3. Source switcher (tabs/pills)
4. Status + error area

### Sections & Components
- Top Nav
  - Left: site logo + breadcrumb back to anime.
  - Right: optional actions (e.g., report issue) only if already in scope.
- Player Card
  - Header: selected source label + type badge ("Iframe"/"Direct").
  - Body (player):
    - If `source_type=iframe`: responsive iframe wrapper (16:9) with sandbox defaults.
    - If `source_type=direct`: HTML5 <video> with controls, poster if available.
  - Loading state: skeleton with spinner overlay.
- Source Switcher
  - Pill list: each pill shows `label`; default pill marked.
  - Interaction: click pill -> update selected source; write to localStorage key `episode:{id}:sourceId`.
- Error Handling
  - Inline alert when iframe fails or video errors.
  - CTA buttons: "Try default" and "Switch source" (focus server list).

## Page: Admin Login
### Layout
- Centered card (max-width 420px) using Flexbox.

### Meta Information
- Title: "Admin Login"
- Description: "Sign in to manage episodes and sources."

### Sections & Components
- Login Card
  - Email input, password input.
  - Primary button: "Sign in".
  - Error banner for auth failures.
  - Small text showing session state after login.

## Page: Admin Episodes (List)
### Layout
- Desktop: two-column header (title + actions) and a full-width table.
- Table uses sticky header; row hover highlighting.

### Meta Information
- Title: "Episodes — Admin"
- Description: "Manage episodes and streaming sources."

### Sections & Components
- Header
  - Title + count.
  - Actions: "New episode".
  - Search input (basic text search).
- Episodes Table
  - Columns: Episode number, title, updated, actions (Edit).
  - Empty state: "No episodes yet" + CTA to create.

## Page: Admin Episode Editor
### Layout
- Desktop split: left main form, right side panel for quick actions (Grid 8/4).
- Mobile: stacked sections.

### Meta Information
- Title: "Edit Episode — Admin" (or "New Episode")
- Description: "Edit episode metadata and video sources."

### Sections & Components
- Episode Form (Main)
  - Fields: title/number/slug (match your existing episode model).
  - Save button row: primary "Save", secondary "Cancel".
- Video Sources Panel (Core)
  - Sources Table
    - Columns: Order, Label, Type, URL, Default, Active, Actions.
    - Order: numeric input or drag handle (choose one; keep behavior consistent).
  - Add Source
    - Button "Add source" opens inline row editor.
    - Defaults for new row: label "Server X", type "iframe", active true, default false.
  - Edit Source
    - Inline editable fields; URL validation.
  - Delete Source
    - Confirmation dialog; block deletion if it’s the last remaining source.
  - Default Source Behavior
    - Radio-like toggle: selecting default unsets others (immediate UI feedback).

## Responsive Behavior (All Pages)
- Breakpoints: 1200/992/768/480.
- Tables become card lists under 768px.
- Source switcher becomes horizontal scroll pills under 768px.
- Admin editor right panel collapses below form on small screens.
