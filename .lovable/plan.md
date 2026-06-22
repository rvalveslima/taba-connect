## Plan

Redesign the join page into a single, centered, compact card. No more huge red side panel.

### Layout
- Single column, centered vertically and horizontally on `bg-background`.
- Taba logo at top of card (using `<TabaLogo />`).
- Compact event header inside the card:
  - If `event.image_url` exists: small rounded banner image (e.g. ~h-32, full card width, `object-cover`) at top.
  - Below: small uppercase "You're joining" eyebrow, event name (h1, ~text-2xl), and date line if present.
- Divider, then the existing auth/join UI (Google, demo button, magic link form, signed-in state, organizer state) — unchanged in behavior and copy.
- Drop the "Build your own village / Two or three real connections" tagline (was part of removed red panel).

### Styling
- Card: `max-w-md mx-auto`, rounded, border, soft shadow, padding.
- Keep all existing buttons, links, error states, terms link, and the demo callout exactly as they are.
- Remove the entire `<aside>` and the 2-column grid wrapper.

### Out of scope
- No changes to auth logic, demo flow, or routing.
- No copy changes beyond removing the side-panel tagline.
