# Watch Party Rooms — Page Design Spec (Desktop-first)

## Global Styles (All Watch Party pages)
- Layout system: Hybrid CSS Grid (page shell) + Flexbox (component internals).
- Max content width: 1200px; center aligned; side gutters 24px.
- Color tokens
  - Background: #0B0F19 (app background), surfaces: #121A2A
  - Text primary: #E6EAF2, secondary: #A9B1C6
  - Accent: #6D5EF7 (primary action), success: #2ECC71, danger: #FF4D4F
  - Borders/dividers: rgba(255,255,255,0.08)
- Typography
  - H1 28/36, H2 20/28, body 14/20, small 12/16
  - Monospace for codes/invite: 12/16
- Buttons
  - Primary: accent background + white text, hover darken 8%, disabled 40% opacity
  - Secondary: transparent + 1px border, hover surface tint
  - Danger: red background for “Dissolve room”
- Links: accent color, underline on hover.
- Motion: 150–200ms transitions for hover/focus; no heavy animation.

## Page 1 — Create Watch Party

### Layout
- Grid: 2 columns on desktop (8/4 split).
  - Left: content selection + summary.
  - Right: room settings + CTA card.
- Spacing: 24px section gaps; cards 16px internal padding.

### Meta Information
- Title: “Create Watch Party”
- Description: “Start a watch party room and invite friends to watch in sync.”
- Open Graph
  - og:title: “Create Watch Party”
  - og:description: same as above

### Page Structure
1. Top navigation bar (reuse existing site nav if available)
2. Page header: title + short helper text
3. Main content grid (selection + settings)

### Sections & Components
1. Auth gate banner
   - If unauthenticated: inline callout with “Sign in to create a room” button.
   - After sign-in, return to this page with preserved selection state.
2. Content Selection Panel (left)
   - Search/select UI that reuses existing content primitives (title/episode/source).
   - Selected content summary card: poster/thumb (if available), title, episode/source fields.
3. Room Settings Card (right)
   - Read-only rules summary:
     - “Max duration: 12 hours”
     - “Room ends if owner leaves”
   - Primary CTA: “Create room”
   - On success: show invite link + “Go to room” button.

### Interaction & Validation
- “Create room” disabled until a content selection exists.
- Error states: show toast + inline error text for failed creation.

---

## Page 2 — Watch Party Room

### Layout
- Desktop 3-column dashboard layout using CSS Grid:
  - Left column (20%): Room info + participants
  - Center column (55–60%): Video player + playback controls + content info
  - Right column (20–25%): Chat
- Responsive behavior
  - ≥1024px: 3 columns as above.
  - 768–1023px: collapse left column into a top drawer; chat remains right.
  - <768px (optional later): stack player then tabs for Participants/Chat.

### Meta Information
- Title: “Watch Party Room” (append content title if available)
- Description: “Watch together with synchronized playback and chat.”
- Open Graph
  - og:title: “Watch Party Room”
  - og:description: same as above

### Page Structure
1. Top navigation bar
2. Room status header bar (sticky)
3. Main grid (participants / player / chat)

### Sections & Components
1. Room Status Header (sticky)
   - Left: Room name (generated), status pill: Active / Dissolved / Expired
   - Middle: current content label (title/episode)
   - Right actions:
     - “Copy invite link”
     - “Leave room”
     - Owner-only: “Dissolve room” (danger)
2. Participants Panel (left)
   - Participant list with:
     - Avatar + display name
     - Role badge: “Owner” for creator
   - Small helper text:
     - “Room ends if the owner leaves.”
   - Optional: “Last sync” indicator (timestamp) for debugging drift.
3. Player & Sync Panel (center)
   - Video player container (16:9)
   - Content Selection Display (read-only for participants)
     - Shows selected content details and “Changed by Owner” timestamp
   - Playback Controls
     - Owner: play/pause, seek scrubber, skip ±10s, rate selector (0.5–2x)
     - Participants: controls visually present but disabled; show tooltip “Only owner controls playback.”
   - Sync indicators
     - Small text: “Synced” / “Resyncing…” based on drift threshold
     - If drift > threshold: show brief non-blocking notice “Adjusting to host…”
4. Chat Panel (right)
   - Message list (scrollable)
     - Each message: author, time, message text
   - Composer
     - Text input + “Send” button
     - Enter to send; Shift+Enter for newline
   - Empty state: “Say hi to the room”

### Room End States (Dissolved / Expired)
- Replace main grid with an end-state card:
  - Title: “Room ended”
  - Reason text:
    - Dissolved manually / Owner left / Expired (12h max)
  - Actions: “Back to home” (or previous page), “Create a new room” (if authenticated)

---

## Page 3 — Join via Invite Link (Resolver)

### Layout
- Minimal centered card (single column) for loading/redirect.

### Meta Information
- Title: “Joining Watch Party…”
- Description: “Redirecting you to the watch party room.”

### Sections & Components
- Loading state: spinner + text “Joining room…”
- If room not found or ended:
  - Error card with “Room not available” and actions (Back / Create room)
- If user must authenticate:
  - Prompt “Sign in to join this room” with CTA to /login and return.
