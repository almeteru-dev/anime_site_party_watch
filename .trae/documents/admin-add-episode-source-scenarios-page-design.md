# Page Design — Admin Add Episode Source Scenarios
Desktop-first; responsive down to mobile.

## Global Styles
- Layout system: CSS Grid for page structure; Flexbox for controls/toolbars.
- Spacing: 8px base scale (8/16/24/32).
- Typography: Page titles 24–28px; section titles 14–16px semibold; helper text 11–12px.
- Colors: use existing theme tokens (background / background-secondary / border / primary). Primary button emphasizes save actions; destructive uses red variants.
- Buttons: rounded-xl, clear hover states; disabled state reduces opacity and cursor.

---

## 1) Admin Anime Editor (Episodes section)

### Layout
- Two-column desktop grid:
  - Left: Episodes list + “Add Episode” form.
  - Right: “Video Sources” management for a selected episode (existing).
- Mobile: stacked sections; sources panel collapses under episodes.

### Meta Information
- Title: “Admin — Edit Anime”
- Description: “Manage anime metadata, episodes, and video sources.”
- OG: noindex (admin-only).

### Sections & Components
1. **Episodes Toolbar**
   - Voice group picker (dub/sub category + voice group dropdown).
   - Quick actions: “Add” / “Save episode” / “Cancel edit”.

2. **Add Episode Form**
   - Fields: Episode number (required), Duration.
   - Subsection: **Initial Source Config (optional)** as a bordered card.

3. **Initial Source Config Card (new UX grouping)**
   - Component: Scenario selector (radio group or segmented control)
     - Standard (Dub/Sub)
     - Integrated (Dub+Sub in one player)
     - External Player
   - Dynamic fields:
     - **Label**
       - Prefer select dropdown of existing labels; include “(External)” badge for external ones.
       - Optional input for new label (disabled when scenario=External).
     - **Type** (select): Iframe Embed / Direct (Artplayer)
     - **URL** (text input)
     - **Audio** (select dub/sub) ONLY when scenario=Standard
   - Inline helper text:
     - Standard: “Users can pick Dub/Sub on watch page.”
     - Integrated: “Dub/Sub selection hidden; source contains both.”
     - External: “Opens in new tab; Dub/Sub selection hidden.”
   - Validation messaging (below fields, small text):
     - Missing label/url/type errors.
     - External scenario: if selected label is not external, show “Choose an External video label.”

4. **Save Behavior**
   - Primary CTA: “Save Episode”
   - Loading state: button spinner + disable inputs.
   - Success: episode appears in list; the initial source appears under sources.

---

## 2) Public Watch Anime Page

### Layout
- Top: hero header (existing).
- Watch module: centered container max-width ~5xl.
- Player area: 16:9 with rounded-2xl border.
- Controls row: sources row + watchlist button; below that language/voice groups + episodes grid.

### Meta Information
- Title: “{Anime Title} — Watch”
- Description: “Watch episodes and switch sources.”
- OG: title + poster image.

### Sections & Components
1. **Player Surface**
   - Scenario Standard/Integrated: render iframe or Artplayer as today.
   - Scenario External:
     - Replace player content with an “External Player” panel:
       - Primary button: “Open Player” (target=_blank)
       - Secondary text: “This source plays on an external website.”
       - Keep source chips visible so users can switch back.

2. **Source Chips (Server selector)**
   - Horizontal chips for available sources.
   - Selected state: primary background.

3. **Language/Voice Group Selector (scenario-aware)**
   - Show only when the selected source is Standard.
   - Hide when selected source is Integrated OR External.

4. **Episodes Grid**
   - Always visible if episodes exist; independent of scenario.

### Interaction States
- Switching sources:
  - If switching between direct sources, preserve playback time when feasible.
  - If switching to External, stop embedded playback and show external panel.
- Errors:
  - If a source URL fails to load, show small inline error and encourage switching sources.
