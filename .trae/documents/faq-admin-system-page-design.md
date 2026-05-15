# FAQ Admin System — Page Design
Desktop-first page specifications for a Next.js admin page with a table and create/edit form using react-hook-form + zod.

## Global Styles (Admin)
- Layout grid: 2-column admin shell (left sidebar + main content). Use CSS Grid for shell (`grid-template-columns: 240px 1fr`) and Flexbox inside sections.
- Spacing: 8px base; typical gaps 16/24/32.
- Typography: 14px body, 16px form labels, 20–24px page title.
- Colors (tokens):
  - Background: `--bg: #0b0f19` (or existing admin bg)
  - Surface: `--surface: #111827`
  - Border: `--border: rgba(255,255,255,0.08)`
  - Text: `--text: rgba(255,255,255,0.92)`, muted `--textMuted: rgba(255,255,255,0.65)`
  - Primary: `--primary: #3b82f6`, hover `--primaryHover: #2563eb`
  - Danger: `--danger: #ef4444`, hover `--dangerHover: #dc2626`
- Components:
  - Buttons: solid primary, ghost secondary, danger for delete. Disabled state reduces opacity and blocks pointer events.
  - Inputs/Textareas: full width, 40px input height, textarea min-height 120px, clear error state (border danger + helper text).
  - Table: sticky header (optional), row hover background on desktop.

---

## Page: FAQ Management

### Meta Information
- Title: “Admin — FAQ”
- Description: “Manage FAQ entries: create, edit, delete.”
- Open Graph: `og:title = Admin — FAQ`, `og:type = website` (no public sharing assumed).

### Layout
- Admin shell: CSS Grid (sidebar + main).
- Main content container: max-width 1200px, centered within main column, padding 24px.

### Page Structure
1. Top bar (within main): title + primary action
2. Content card: table list
3. Create/Edit form: modal or right-side drawer (desktop-first)
4. Delete confirmation: modal dialog

### Sections & Components

#### A) Header Row
- Left: Page title “FAQ”.
- Right: Primary button “Create FAQ”.
  - On click: open Create/Edit form in “create mode” with empty defaults.

#### B) FAQ Table Card
- Card container: surface background, border, 16–24px padding.
- Table columns (minimum):
  - Question (truncate to 1–2 lines)
  - Updated (humanized or ISO string)
  - Actions (right aligned)
- Row actions:
  - “Edit” button: opens Create/Edit form in “edit mode” and pre-fills fields by loading the FAQ (`GET /api/admin/faq/:id`) or from row data.
  - “Delete” button: opens Delete confirmation modal.
- States:
  - Loading: skeleton rows or spinner centered in table area.
  - Empty: message “No FAQs yet” + inline “Create FAQ” button.
  - Error: inline alert with API error message.

#### C) Create/Edit Form (Modal or Drawer)
- Container:
  - Desktop-first: right drawer width 420–520px OR centered modal max-width 640px.
  - Close icon (top-right) + Esc closes (if modal).
- Form library:
  - `react-hook-form` for state management.
  - `zod` schema for validation via `@hookform/resolvers/zod`.
- Fields (minimum):
  1. Question (input or textarea)
  2. Answer (textarea)
- Validation (zod):
  - `question`: required, min length (e.g., 3)
  - `answer`: required, min length (e.g., 3)
- Footer actions:
  - Primary: “Create” or “Save changes” (label depends on mode)
  - Secondary: “Cancel” (closes without saving)
- Submission behavior:
  - Create mode: `POST /api/admin/faq`
  - Edit mode: `PUT /api/admin/faq/:id`
  - Disable submit while request in-flight; show inline form-level error on failure.
  - On success: close form and refresh table.

#### D) Delete Confirmation Modal
- Title: “Delete FAQ?”
- Body: short warning text that the action is irreversible.
- Actions:
  - Danger primary: “Delete” triggers `DELETE /api/admin/faq/:id`
  - Secondary: “Cancel” closes
- Loading: disable buttons while deleting.

### Responsive Behavior (secondary)
- <= 768px: drawer becomes full-width, table container becomes horizontally scrollable.
- Sidebar collapses into top navigation (if your admin shell already supports it).
