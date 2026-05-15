# Admin CMS — Page Design (Desktop-first)

## Global Styles

* Layout system: CSS Grid for shell (sidebar + main), Flexbox inside components.

* Breakpoints: desktop-first; collapse sidebar to icon-only at \~1024px; stack form fields at \~768px.

* Design tokens

  * Background: #0B0F17, surface: #121A2A, border: rgba(255,255,255,0.08)

  * Text: primary #EAF0FF, secondary #A7B0C5

  * Accent: #6C7CFF (primary button), danger: #FF4D4F

  * Typography: 14px base; H1 24/28, H2 18/24, label 12/16

  * Buttons: primary filled + hover (slightly brighter), secondary outline, danger filled

  * Inputs: 40px height, 8px radius, clear error state (red border + helper text)

## Page: Admin Login (/admin/login)

### Layout

* Centered card (max-width 420px) on background; card uses Flexbox column gap 16.

### Meta Information

* Title: "Admin Login"

* Description: "Sign in to manage the anime catalog."

* OG: title mirrors page title.

### Page Structure

1. Header: product name + short hint "Admin access only".
2. Login Card

   * Email/username input

   * Password input (with show/hide toggle)

   * Primary button: "Sign in"

   * Error area (inline): invalid credentials / not authorized

### Interaction States

* Loading state on submit; disable inputs.

* On success, redirect to /admin.

## Page: Admin Dashboard — Anime List (/admin)

### Layout

* App shell grid: 260px sidebar + fluid main; sticky sidebar.

* Main content uses stacked sections with a top toolbar and a table.

### Meta Information

* Title: "Admin Dashboard"

* Description: "Manage anime entries."

### Sections & Components

1. Sidebar

   * Logo/title

   * Nav items: "Anime List" (active), "Add Anime"

   * Footer: admin email + Logout
2. Main Header / Toolbar

   * Page title: "Anime"

   * Search input (optional)

   * Primary button: "Add Anime" (links to /admin/animes/new)
3. Anime Table

   * Columns: RU title, EN (Romaji) title, type, status, year, actions

   * Row actions: Edit, Delete
4. Delete Confirmation Modal

   * Copy: "Delete this anime?" + irreversible warning

   * Buttons: Cancel, Delete (danger)

### Interaction States

* Skeleton loading for table.

* Toast/inline banner for success/error (delete failed, permission error).

## Page: Add Anime (/admin/animes/new)

### Layout

* Main area: form card max-width \~860px; two-column grid for desktop fields; single column on narrow screens.

### Meta Information

* Title: "Add Anime"

* Description: "Create a new anime entry."

### Sections & Components

1. Header

   * Title + breadcrumb: Admin / Anime / Add

   * Secondary button: "Back to list"
2. Anime Form

   * Text fields (required): "Title (RU)", "Title (EN Romaji)"

   * Dropdowns (fetched from backend): Type, Status, Season (optional)

   * Multi-select dropdown (fetched): Genres

   * Optional: Year (number), descriptions (RU/EN)

   * Form actions: Primary "Create", secondary "Cancel"

### Interaction States

* Dropdowns show loading + retry on failure.

* Client-side validation + server error mapping (field-level).

## Page: Edit Anime (/admin/animes/:id/edit)

### Layout

* Same as Add Anime for consistency.

### Meta Information

* Title: "Edit Anime"

* Description: "Update an existing anime entry."

### Sections & Components

1. Header

   * Title + breadcrumb: Admin / Anime / Edit

   * Secondary button: "Back to list"
2. Prefilled Anime Form

   * Load existing anime by id; allow edits to same fields as create

   * Primary "Save changes"; secondary "Cancel"

### Interaction States

* Initial loading skeleton; handle not-found and not-authorized states.

