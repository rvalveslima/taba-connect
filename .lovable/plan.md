## Goal
Let you walk the full attendee flow end-to-end without building Nala's organizer screens first.

## What already exists
- A seeded demo event is in the DB: code `DEMO26`, id `2bb9c0d4-1f73-4a89-9232-9eb65c2b99bf`.
- `/join/$eventId` accepts that id and creates the membership after sign-in.

## What's missing for a clean e2e test
1. **No obvious entry point from `/app`.** After signing in you land on `/app` with no link into the demo event. You'd have to hand-type the join URL.
2. **No "join by code" path.** Tabitha's real flow is "type DEMO26", not "paste a UUID". Worth having now so the demo dry-run feels real.
3. **Hydration error on `/auth`** (visible in runtime errors) — not blocking, but I'll fix it quietly so signup doesn't flash.

## Plan

**1. Add a dev shortcut on `/app`** (the post-login landing)
- Big "Enter demo event" button → links to `/join/2bb9c0d4-1f73-4a89-9232-9eb65c2b99bf`.
- Small input: "Have a code?" → on submit, look up `events` by `event_code`, redirect to `/join/{id}`. Falls back gracefully if not found.
- Also list any events you're already a member of, each linking to `/event/{id}`. So once you've joined DEMO26 once, you re-enter with one click.

**2. Make `/join/$eventId` idempotent**
- If you're already a member, skip the insert and go straight to `/event/{id}/profile` (or `/event/{id}` if profile is filled). Right now re-joining might error on the unique membership.

**3. Quiet fixes**
- Resolve the `/auth` hydration mismatch (likely a `Suspense` boundary diff under SSR; the auth route should be `ssr: false` like the rest of the auth-adjacent flow).

## Out of scope
- Nala's organizer UI (event creation, dashboard counts) — still deferred to the next phase.
- Schema changes — none needed; DEMO26 already exists.

## After this lands
You can: sign up fresh → land on `/app` → click "Enter demo event" → fill profile → see attendee list → open a card → send opener. Open a second browser/incognito with a different account to test the two-attendee overlap.

Sound right, or do you want the demo entry point somewhere other than `/app` (e.g. directly on the marketing `/`)?