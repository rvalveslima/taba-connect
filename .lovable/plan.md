## Goal

Connect the pieces that already exist into one continuous attendee journey, and fill in the missing bits: organizer share UI (link + QR), a proper landing page with a current-event banner, and the missing dashboard filters (language, company, goals, open-to-connect).

## What already works (keep as-is)

- `/join/$eventId` — login / signup gate, creates membership, sends user to profile
- `/event/$eventId/profile` — two-zone profile (You + event-scoped), saves and redirects to dashboard
- `/event/$eventId` — dashboard with attendee cards, overlap-sorted
- Auth gate via `_authenticated` layout

## What changes

### 1. Organizer share screen (link + QR)
On the organizer's event page (existing screen — will locate it on entry to build mode), add a "Share with attendees" panel that shows:
- The full join URL (`https://<host>/join/<eventId>`) with a copy button
- A QR code rendering the same URL
- The short event code as a fallback

Use `qrcode` (tiny, pure-JS) — added via `bun add qrcode`. Rendered to a canvas client-side, no server work.

### 2. Landing page rework — `/app`
Replace the current "demo + your events" layout with the requested structure:

- **Current event banner** (top): if the user just joined an event (most-recent membership in the last N hours, or passed via `?event=<id>` from the join flow) show a prominent banner with event name + dates + a primary CTA "Continue to event". Clicking takes them into `/event/$eventId` (or `/event/$eventId/profile` if their profile for that event is still empty).
- **Past events** (below): the existing list, minus the demo box.
- Empty state when there are zero events.

The "currentness" rule: most recent `event_memberships.joined_at` within the last 24h is treated as the active event for the banner. Everything older falls into Past.

### 3. Profile entry point
Card click on the landing currently goes straight to `/event/$eventId`. Update it to route to `/event/$eventId/profile` when the membership has no `goal_tags` yet (profile incomplete) and to the dashboard otherwise. One query already pulls `goal_tags`; just branch on it.

### 4. Dashboard filters — `/event/$eventId/`
Today it filters by role + a single tag. Expand to the full set:

- **Role** (existing dropdown)
- **Language** — dropdown of languages present across attendees (read from `accounts.languages`)
- **Company** — dropdown of companies present (`accounts.company`)
- **Goals** — multi-select chips against `event_memberships.goal_tags` (replaces today's single-tag filter; AND across selected)
- **Open to connect** — toggle that hides anyone with `open_to_connect = false`

Also add the missing fields to the attendee query (`languages`, `company`) and surface `company` on the card subtitle (Role · Company).

A "Clear filters" link appears when any filter is active. Sort order (overlap desc, name asc) stays.

## Technical details

- **New dep**: `qrcode` (~20kB). Imported only in the organizer share component.
- **Route changes**: no new routes. Edits to `src/routes/_authenticated/app.tsx`, `src/routes/_authenticated/event.$eventId.index.tsx`, and the organizer event page (located on entry to build mode).
- **Schema**: no migration. All needed columns exist (`accounts.languages`, `accounts.company`, `event_memberships.open_to_connect`, `goal_tags`).
- **Profile-incomplete branch**: detected client-side by `goal_tags is null or length 0` on the user's own membership for that event.
- **Current-event window**: 24h since `joined_at`. Chosen because it cleanly captures "the event they just joined" without needing an event-date check, and avoids surprises if dates aren't set.

## Out of scope (ask if you want them next)

- Editing the organizer flow beyond adding the share panel
- Notifications / email when someone joins
- "Mark event as past" manual control
- Persisting filter state in the URL

