## Goal

When an organizer clicks **Open** on their event card in `/organizer`, send them to a dedicated event overview page that shows branding, dates, attendee count, and LinkedIn-messages-sent count. Demo-only: use fake numbers for the LinkedIn count.

## Changes

### 1. New route: `src/routes/_authenticated/event.$eventId.overview.tsx`

URL: `/event/$eventId/overview`. Organizer-facing details page.

Loads from existing tables (no schema changes):
- `events` → `name`, `date_start`, `date_end`, `image_url`, `organizer_account_id`
- `get_event_code` RPC → event code
- `event_memberships` count → real attendees subscribed

Shows:
- Cover image (or branded placeholder) + event name
- Date range (formatted, e.g. "Mar 12 – Mar 14, 2026")
- Event code chip
- Two stat cards:
  - **Attendees subscribed** — real count from `event_memberships`
  - **LinkedIn messages sent** — fake demo number derived deterministically from `eventId` (hash → 30–180 range) so it's stable per event and looks plausible
- Action row: **Share** (→ `/event/$eventId/share`), **View attendees** (→ `/event/$eventId`), **Edit profile**

Standard `errorComponent` / `notFoundComponent` via `RouteErrorFallback` / `RouteNotFoundFallback`. If the current user is not the organizer, redirect to `/event/$eventId` (attendee view).

### 2. `src/routes/_authenticated/organizer.tsx`

Change the **Open** `<Link>` `to` from `/event/$eventId` to `/event/$eventId/overview`. Keep **Share** unchanged.

## Out of scope

- No new DB tables, columns, or RPCs. LinkedIn count is fake demo data only; clearly labeled.
- Attendee directory page (`/event/$eventId`) and attendee Open flow stay as they are.
- No changes to share / profile / attendee detail routes.
