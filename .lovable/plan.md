## Goal
After an organizer signs in (any email + `Tabaevent123`), land them on a page that lists every event they previously created with that email, instead of jumping straight into the new-event form. Same email → same `auth.users` row → same `organizer_account_id`, so the events are already persisted; we just need to surface them.

## Changes

### 1. New route: `/organizer` (organizer home)
File: `src/routes/_authenticated/organizer.tsx`

- Loads `events` where `organizer_account_id = auth.uid()`, ordered by `created_at desc`. Selects `id, name, date_start, date_end, event_code, image_url, created_at`.
- For each event, fetches attendee count via `event_memberships` count query keyed by `event_id`.
- Renders:
  - Header with TabaLogo + "Signed in as {email}" + Sign out.
  - H1 "Your events".
  - Primary CTA "+ Create new event" → `/event/new`.
  - Empty state when no events: friendly copy + same CTA.
  - List of cards (cover image thumb, name, dates, attendee count, event code). Each card has two actions:
    - "Open share page" → `/event/$eventId/share` (link + QR to resend to attendees).
    - "Open dashboard" → `/event/$eventId` (the attendee-style village view; organizer is a member of their own event so they have access).

### 2. Redirect organizer post-auth to the new home
File: `src/routes/auth.tsx`
- Change `postAuthTarget` for `isOrganizer` from `/event/new` to `/organizer`.
- The "Continue as {currentEmail}" banner already uses `postAuthTarget`, so it'll route correctly when an organizer is already signed in.

### 3. Share page: add a back-link to organizer home
File: `src/routes/_authenticated/event.$eventId.share.tsx`
- Add a small "← Your events" link in the header that goes to `/organizer`, so an organizer who just created an event can get back to the list.

### 4. Landing page CTA wording (small)
File: `src/routes/index.tsx`
- No behavior change; "Join as organizer" still goes to `/auth?as=organizer`. After sign-in they now hit `/organizer` and choose existing or new.

## Out of scope
- No DB schema changes — `events.organizer_account_id` and RLS (`events_select_authenticated`, `events_insert_as_organizer`) already do the right thing.
- No edits to attendee flow, profile, or dashboard.
- No deletion/edit of events from the organizer home in this pass (can be a follow-up).

## Verification
1. Sign in as organizer with `alice@test.com / Tabaevent123` → land on `/organizer` empty state → click Create → make event "Alpha" → share page → back-link returns to `/organizer` showing "Alpha".
2. Create a second event "Beta" → `/organizer` now lists both, newest first.
3. Sign out → sign back in with same email → both events still listed.
4. Sign in with a different email → see only that email's events (empty for a fresh address).
