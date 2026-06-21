## Goal

Make the organizer-shared link/QR fully work: attendee opens it, sees the organizer's event (name, dates, cover image), signs up or signs in, joins that specific event, completes profile, lands on the event dashboard.

## What already exists

- `/event/$eventId/share` shows the share link + QR after event creation.
- `/join/$eventId` already loads the event, has new/existing auth tabs, creates an `event_memberships` row scoped to that event, then redirects to `/event/$eventId/profile`.
- `/event/$eventId/profile` and `/event/$eventId` (dashboard) already exist behind the auth gate.

So the pipes are in place — but two things break the experience today.

## Problems to fix

### 1. The join page can't load the event for a logged-out attendee
`events` currently has only `events_select_authenticated` (authenticated-only SELECT). The join route is public and its loader runs during SSR/anon — the query returns no row and the loader `throw redirect({ to: "/" })`s back to the homepage. The attendee never sees the event.

**Fix:** add an anon-readable policy on `events` so the join page can render event details before sign-in. The table only stores non-sensitive fields (name, dates, image_url, event_code, organizer id), so a `TO anon` SELECT policy is safe.

```sql
GRANT SELECT ON public.events TO anon;
CREATE POLICY events_select_anon ON public.events FOR SELECT TO anon USING (true);
```

### 2. The join page doesn't show the organizer's cover image
The loader doesn't select `image_url` and the UI doesn't render it, so the page feels generic instead of "this is TechForward 2026". Add `image_url` to the loader select and render it on the left/intro panel (with a graceful fallback to the current solid-color panel when no image was uploaded).

## Flow after the fix

1. Organizer creates event → `/event/$eventId/share` (already done).
2. Attendee opens `https://…/join/<eventId>` or scans the QR.
3. Public join page renders organizer's event name, dates, and cover image.
4. Attendee signs up (or signs in if returning) — `event_memberships` row created for that event, idempotent.
5. Redirect to `/event/$eventId/profile` to fill name/role/goals/etc.
6. Profile save continues to `/event/$eventId` dashboard (existing behavior).

## Files touched

- New migration: anon SELECT policy + GRANT on `public.events`.
- `src/routes/join.$eventId.tsx`: add `image_url` to loader select; render the cover image in the left panel when present.

No changes to the organizer flow, profile page, dashboard, or auth wiring.

## Verification

- Open the share link in an incognito window → join page shows the event name, date, and uploaded image.
- Complete signup → land on the profile page for that event → save → land on that event's dashboard.
- Re-open the same link while already signed in → "Join the event" one-click path still works.
