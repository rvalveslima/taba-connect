## Problem

The organizer just signed in (lands on `/organizer`), clicks **+ Create new event**, then clicks **Cancel** on the form. They get dropped on `/app` — the attendee landing page — which makes no sense for an organizer and doesn't match where they came from.

## Root cause

`src/routes/_authenticated/event.new.tsx` hard-codes its Cancel link (and header logo) to `/app`, regardless of who's using the page. Organizers should bounce back to `/organizer` (their landing page after login).

## Fix

In `src/routes/_authenticated/event.new.tsx`:
- Change the **Cancel** link from `/app` → `/organizer`.
- Change the header **logo** link from `/app` → `/organizer`.

Only this one file changes. The `/app` route itself stays (it's still the attendee landing page).

## Out of scope

- No changes to attendee flow or to the `/app` route.
- No changes to post-login routing (already correct: organizers → `/organizer`, attendees → `/app`).
