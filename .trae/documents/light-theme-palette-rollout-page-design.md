# Page Design Spec — Light Theme Palette Rollout
Desktop-first; scale down to tablet/mobile with a single-column stack and reduced paddings.

## Global Styles
### Design tokens (semantic)
Apply via CSS variables and Tailwind token utilities.

| Token | Light (intent) | Usage |
|---|---|---|
| --background | near-white | App/page background |
| --foreground | near-black | Primary text |
| --surface | white | Cards, popovers |
| --surface-2 | light gray | Sub-panels, table headers |
| --muted | gray | Secondary text |
| --border | light gray | Borders/dividers |
| --ring | brand tint | Focus rings |
| --brand | primary blue | Primary buttons/links |
| --brand-foreground | white | Text on brand |
| --danger | red | Errors/destructive |
| --warning | amber | Warnings |
| --success | green | Success states |

### Typography
- Base: 16px (public), 15–16px (admin), line-height 1.5–1.65.
- Headings: clear hierarchy (H1 28–32, H2 22–26, H3 18–20).
- Content width: prose containers max-width 720–800px for legal pages.

### Interaction + accessibility
- Links: underline on hover; visited color slightly muted but still AA-contrast.
- Focus: visible ring using --ring on all interactive elements.
- Remove hardcoded dark classes: replace fixed `text-white/bg-black` and scattered `dark:*` rules with token-based variants.

---

## Page: Public Site (Global UI Shell)
### Layout
- Hybrid: CSS Grid for page frame (header / main / footer), Flexbox inside components.
- Main content centered with max-width container; responsive padding (24px desktop, 16px mobile).

### Meta Information
- Title: Site name + page title
- Description: Page-specific summary
- Open Graph: title/description/url + preview image (existing)

### Page Structure
1. Header (sticky optional)
2. Main content area
3. Footer

### Sections & Components
- Header: logo, primary nav, search (if present), account/admin entry (if present).
- Components (site-wide): buttons, cards, inputs, badges, alerts, tables all mapped to semantic tokens.

---

## Page: Cookie Consent + Legal Pages (Privacy/Cookies)
### Layout
- Single-column readable document layout; no dense sidebars.
- Prose container: 720–800px; generous vertical rhythm (section spacing 24–32px).

### Meta Information
- Title: “Privacy Policy” / “Cookie Policy”
- Description: Short summary emphasizing transparency and consent

### Sections & Components
- Cookie banner/modal:
  - Primary CTA (Accept all) uses --brand
  - Secondary CTA (Reject / Manage) uses surface + border
  - Manage preferences view uses clear toggles with descriptive labels
- Legal content:
  - TOC (optional if long): sticky on desktop, collapsible on mobile
  - Headings + lists with comfortable spacing
  - Link styling high-contrast and clearly differentiated from body text

---

## Page: Admin Panel (Global UI Shell)
### Layout
- Desktop: left sidebar + main content (CSS Grid: 260px / 1fr).
- Mobile: sidebar collapses into sheet; main content full width.

### Meta Information
- Title: “Admin — {Section}”
- Description: Admin section summary (non-indexed if applicable)

### Sections & Components
- Sidebar: nav groups; active item uses subtle brand-tinted background.
- Top bar: breadcrumbs/title; right side includes **Theme Toggle (admin-only)**.
- Tables/forms: surface panels with clear borders and zebra/hover states using tokens.

---

## Page: Admin Appearance / Theme Settings
### Layout
- Settings card grid (2-column desktop, 1-column mobile).

### Meta Information
- Title: “Admin — Appearance”
- Description: Control admin UI theme preferences

### Sections & Components
- Theme mode control (admin-only): segmented control or select (Light / Dark / System).
- Preview note: clarifies it affects **admin UI only** and does not expose a public toggle.
- Persistence: helper text “Saved on this device” (if localStorage) or “Saved to your profile” (if server-backed preference exists).
