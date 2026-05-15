# LycorisLib — Scheduling Admin Page Design (Desktop-first)

## Global Styles
- Layout system: CSS Grid for page frames (header + content), Flexbox inside cards/rows.
- Spacing scale: 4/8/12/16/24/32.
- Typography:
  - Page title: 24px/32px, semibold
  - Section title: 18px/24px, semibold
  - Body: 14px/20px
  - Table meta: 12px/16px
- Colors (tokens):
  - `--bg`: #0B0F17
  - `--panel`: #111827
  - `--panel-2`: #0F172A
  - `--text`: #E5E7EB
  - `--muted`: #9CA3AF
  - `--border`: rgba(255,255,255,0.08)
  - `--primary`: #7C3AED
  - `--danger`: #EF4444
  - `--success`: #10B981
- Buttons:
  - Primary: solid `--primary`, hover brighten + subtle shadow
  - Secondary: transparent with `--border`, hover background `--panel-2`
  - Danger: solid `--danger`, hover darken
  - Disabled: 40% opacity + `cursor:not-allowed`
- Inputs:
  - 40px height, 8px radius, background `--panel-2`, border `--border`
  - Focus ring: 2px `--primary` at 40% opacity
- Toasts: top-right stack, auto-dismiss 4–6s, persistent on errors until closed.

## Page 1: Login

### Meta Information
- Title: "LycorisLib Admin — Login"
- Description: "Sign in to manage schedules in LycorisLib."
- Open Graph:
  - `og:title`: "LycorisLib Admin"
  - `og:description`: "Scheduling administration"

### Page Structure
- Centered auth card on a full-height background.
- Grid: single-column, max width 420px.

### Sections & Components
1. **Header / Branding**
   - LycorisLib wordmark
   - Subtitle: "Scheduling Admin"
2. **Login Card**
   - Email input
   - Password input
   - Primary button: "Sign in"
   - Inline error region under the button (auth failure, network issues)
3. **Post-login behavior**
   - On success: redirect to `/admin/schedules`.

### Responsive behavior
- Desktop-first; on small screens, card uses 16px margins and full width.

---

## Page 2: Admin Schedules

### Meta Information
- Title: "LycorisLib Admin — Schedules"
- Description: "Manage schedules grouped by weekday; root tools for timezone and cleanup."
- Open Graph:
  - `og:title`: "LycorisLib Schedules"
  - `og:description`: "Weekday-grouped schedule management"

### Page Structure
- App frame: fixed top header + scrollable content.
- Content grid:
  - Left: main weekday schedule list (primary)
  - Right: admin tools sidebar (timezone + purge + create)
- Desktop widths:
  - Main: min 720px
  - Sidebar: 360px
  - Gap: 24px

### Sections & Components

#### A) Top Header
- Left: "LycorisLib" + current page label "Schedules"
- Right:
  - Current user email
  - Role badge ("Admin" or "Root")
  - "Sign out" button

#### B) Weekday-grouped schedule list (Main column)
- 7 stacked weekday panels: Monday → Sunday
- Each weekday panel includes:
  - Panel header: weekday name + count badge + expand/collapse toggle
  - Panel body: table-like list

**Schedule row layout (table-like list)**
- Columns:
  - Name
  - Time (HH:mm)
  - Status
  - Next run (UTC as technical detail + optionally show local in global timezone)
  - Actions (Edit, Delete)
- Row interactions:
  - Hover highlight on row
  - Delete uses a confirm dialog

#### C) Create/Edit schedule (Sidebar card)
- Card title: "Create schedule" (or "Edit schedule")
- Fields:
  - Name (text)
  - Weekday (select: Mon–Sun)
  - Time (time input; displayed and stored as "HH:mm")
  - Status (select)
- Actions:
  - Primary: Save
  - Secondary: Cancel (when editing)
- Validation:
  - Require name
  - Require weekday
  - Require valid HH:mm

#### D) Global timezone (Root-only) (Sidebar card)
- Card title: "Global timezone"
- Controls:
  - Timezone select (IANA TZ list; searchable)
  - Secondary button: "Preview impact" (dry run)
  - Primary button: "Save and recalculate"

**Confirmation modal (required)**
- Title: "Recalculate schedules for new timezone?"
- Content:
  - Old timezone → New timezone
  - Affected schedules count
  - Warning text: "LycorisLib recomputes derived run times from schedule definitions. It does not apply cumulative time shifts."
- Actions:
  - Primary: "Confirm"
  - Secondary: "Cancel"

**Non-root view**
- Card present but locked:
  - Show message: "Root permission required"
  - Disabled inputs

#### E) Purge old schedules (Root-only) (Sidebar card)
- Card title: "Cleanup"
- Primary danger button: "Purge schedules older than 1 month"
- Confirmation modal:
  - Shows count to delete (fetched via preview query/RPC)
  - Requires typing "PURGE" (optional but recommended for safety)
  - Primary danger: "Delete"
  - Secondary: "Cancel"
- Result:
  - Toast: "Deleted N schedules"

### States & Error handling
- Loading skeletons for weekday panels.
- Empty state per weekday:
  - "No schedules for this weekday"
- Error banner at top of content area for failed RPC actions (timezone change, purge).

### Responsive behavior
- At <1024px:
  - Sidebar moves below main list, full width.
  - Weekday panels remain stacked.
- At <640px:
  - Schedule row collapses to a 2-line card layout with an overflow actions menu.

### Motion
- Expand/collapse weekday panels: 150–200ms height/opacity transition.
- Modals: 120ms fade