# Page Design — Header Anime Search, Alt Titles (Admin), Public FAQ

## Global (Desktop-first)
### Layout
- Base layout: CSS Grid for page shell (header / main / footer), Flexbox inside components.
- Breakpoints: desktop ≥1024px primary; tablet ≥768px; mobile <768px stacks columns and uses full-width panels.

### Meta Information
- Default title template: `{Page Title} | Anime Site`
- Default description: concise per page; include `og:title`, `og:description`, `og:type=website`.

### Global Styles
- Background: `#0B0F17` (dark) with elevated surfaces `#111827`.
- Text: `#E5E7EB`; muted `#9CA3AF`.
- Accent: `#8B5CF6` (primary), hover lighten by ~8%.
- Typography: 14/16/18/24/32 scale; headings semibold.
- Buttons: primary solid accent; secondary outline; focus ring `2px` accent at 60% opacity.
- Inputs: rounded-md, subtle border, clear hover/focus states.

---

## 1) Global Header (Anime Search RU+EN)
### Page Structure
- Header row: left logo, center search, right nav/user controls.

### Sections & Components
1. Logo / Home link
   - Click navigates to `/`.
2. Search input (primary)
   - Placeholder: “Search anime (RU/EN)…”.
   - Debounced search (e.g., 250–400ms) calling `search_anime(q)`.
   - Keyboard support: ↑/↓ to move selection; Enter to open; Esc to close.
3. Suggestion dropdown
   - Width matches input; max height ~360px with scroll.
   - Each row: anime poster thumb (optional), title (prefer localized display), secondary line with the other language title (if available).
   - Empty state: “No matches”.
   - Loading state: skeleton rows.
4. Navigation
   - Include link to `/faq`.

### Responsive behavior
- Mobile: search opens full-width overlay panel; suggestions become full-screen list.

---

## 2) Public FAQ Page (/faq)
### Meta Information
- Title: “FAQ | Anime Site”
- Description: “Frequently asked questions about the site.”

### Page Structure
- Centered container (max-width 860px), stacked sections.

### Sections & Components
1. Page header
   - H1 “FAQ” + short intro.
2. FAQ accordion list
   - Data: fetch only `is_published=true`, sorted by `sort_order` then `updated_at`.
   - Accordion item
     - Header row: question text + chevron icon.
     - Body: rendered answer (Markdown) with safe allowed elements.
   - Interaction
     - Click toggles; only one open at a time (desktop), optional multi-open on mobile.
     - URL hash support: `#faq-{id}` scrolls and opens item.
3. Empty state
   - “No FAQs published yet.”

---

## 3) Admin Login (/admin/login)
### Meta Information
- Title: “Admin Login | Anime Site”

### Page Structure
- Centered auth card (max-width 420px) in a simple layout.

### Sections & Components
- Email + password fields, Sign in button.
- Error banner for invalid credentials.
- After success: redirect to `/admin/anime`.

---

## 4) Admin Anime Editor (/admin/anime/:id)
### Meta Information
- Title: “Edit Anime | Admin”

### Page Structure
- Two-column grid: left anime summary; right editor panels.

### Sections & Components
1. Anime summary card
   - Display primary titles (EN/RU) and ID.
2. Alternative titles panel
   - Table/list of existing alt titles with columns: Language, Title, Actions.
   - “Add alternative title” button (disabled when count=5).
   - Inline edit (or modal) with:
     - Language select (ru/en)
     - Title input
   - Validation
     - Non-empty, trimmed
     - Prevent duplicates per anime (case-insensitive)
     - Enforce max 5 (show clear error if backend rejects)
3. Save feedback
   - Toast on success; inline error on failure.

### Responsive behavior
- Mobile: collapses into stacked cards; alt titles table becomes vertical list.

---

## 5) Admin FAQ Manager (/admin/faq)
### Meta Information
- Title: “FAQs | Admin”

### Page Structure
- Top toolbar + split view (list on left, editor on right).

### Sections & Components
1. Toolbar
   - “New FAQ” button, filter (All / Published / Draft).
2. FAQ list
   - Rows: question, published badge, sort_order.
   - Click selects for edit.
3. FAQ editor
   - Fields: Question (text), Answer (Markdown textarea), Sort order (number), Published (toggle).
   - Publish behavior: when toggled on, set `published_at`.
   - Actions: Save, Delete (confirm dialog).
4. Preview
   - Embedded accordion preview rendering the selected FAQ as it would appear on /faq.

### Interaction states
- Unsaved changes warning when switching items.
- Disabled controls while saving.
