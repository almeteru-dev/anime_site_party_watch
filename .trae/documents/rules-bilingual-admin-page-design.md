# Page Design — Bilingual Rules + Username Constraints
Desktop-first specifications for the public Rules page, the admin Rules editor, and the small header/auth UI changes required.

## Global Styles (applies to all pages)
- Layout system: Flexbox for header and page scaffolding; CSS Grid for content containers where beneficial.
- Max content width: 960–1100px centered; full-width background.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32px.
- Typography: body 16px; page title 28–32px; section title 18–20px; line-height ~1.5.
- Colors: inherit existing theme; ensure link hover has clear affordance; use a single “danger/error” color for validation.
- Buttons: primary (solid), secondary (outline), disabled state (reduced contrast + no pointer).
- Form errors: inline message below field + red border on invalid input.

---

## 1) Site Header (Global)
### Layout
- Horizontal flex row: left = logo/site name; center/left = main nav; right = auth/account actions.
- Responsive behavior: on smaller breakpoints, nav collapses into a menu button; “Rules” remains accessible.

### Meta Information
- N/A (global component).

### Structure & Components
1. **Nav links**
   - Add a “Rules” item.
   - Active state: underline/bolder color when current route is /rules.
2. **Interaction states**
   - Hover: subtle background or underline.
   - Focus: visible focus ring.

---

## 2) Public Rules Page (/rules)
### Meta Information
- Title: "Rules"
- Description: "Community and site rules."
- Open Graph:
  - og:title = "Rules"
  - og:description = "Read the rules before using the site."

### Layout
- Single-column stacked layout.
- Container centered with readable line length; content area uses typographic rhythm (headings, paragraphs, lists).

### Page Structure
1. **Page header section**
   - H1 "Rules"
   - Optional subtext: short explanation (kept minimal).
   - "Last updated" line (small, muted), if timestamp exists.
2. **Language resolution UI (minimal)**
   - If your site already has a language switcher, reuse it.
   - If not: a small segmented control or two links near the title:
     - "EN" and "RU"
     - When RU selected but RU content is empty, show EN content and display a subtle notice: "Russian version not available yet; showing English." (non-blocking).
3. **Rules content**
   - Render content in a styled prose container.
   - Support basic formatting (paragraphs, lists, headings) as provided by stored content.
4. **States**
   - Loading: skeleton lines in prose container.
   - Hard empty: if EN content is empty/missing, show: "Rules are not available yet." (no admin hints).
   - Error: generic message with retry link/button.

### Interactions
- Selecting RU triggers re-render based on RU availability; fallback to EN is automatic.

---

## 3) Admin Rules Editor (/admin/rules)
### Meta Information
- Title: "Admin — Rules"
- Description: "Edit public Rules content."

### Layout
- Two-level vertical layout:
  - Top: page title + save controls.
  - Body: language tabs + editor.

### Page Structure
1. **Access gate**
   - Unauthenticated: show sign-in CTA.
   - Authenticated non-admin: show "Access denied" + link back home.
2. **Header row**
   - H1 "Rules Editor"
   - Right side actions:
     - Primary button: "Save"
     - Secondary: "Reset" (optional, only if you already support it)
     - Save status indicator (e.g., "Saved", "Saving…", "Error")
3. **Language switch**
   - Tabs/segmented control: "English" | "Russian"
   - Each tab edits its own stored document.
4. **Editor**
   - Large textarea or existing rich editor component (keep consistent with your admin UI).
   - Helper text below: "Publicly visible at /rules".
   - Character count optional (only if already common in your UI).
5. **Dirty-state handling**
   - If unsaved changes exist and you navigate away: confirm dialog.

### Interactions
- Save:
  - Disabled while saving.
  - On success: show "Saved" and update "Last updated".
  - On failure: show inline error banner.

---

## 4) Registration/Profile — Username Field (existing pages)
### Meta Information
- No changes beyond existing page metadata.

### Layout
- Keep existing form layout; only update the username field behavior.

### Field Spec
- Label: "Username"
- Placeholder: "e.g. john_doe"
- Helper text: "4–30 chars. Use A–Z, 0–9, underscore (_), dot (.), hyphen (-)."
- Validation rules (same everywhere):
  - Length 4–30
  - ASCII-only
  - Allowed symbols: letters/digits/underscore/dot/hyphen

### Validation UI
- On blur (and optionally while typing): show first error message.
- On submit: block submission and scroll/focus to the field.
- Backend error mapping: if server rejects username, show the same message (avoid raw regex/DB errors).
