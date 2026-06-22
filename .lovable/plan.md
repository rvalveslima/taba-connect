## Problem

On the profile page, the header has a back link "← {eventName}" that points to `/event/$eventId` (the attendee dashboard). When an **organizer** clicks it:

- The dashboard loader checks for an `event_memberships` row for the current user.
- Organizers don't have a membership row, so the loader redirects to `/join/$eventId`, which (since they're signed in but the event is theirs) bounces again. The net effect is "nothing happens" / a redirect to `/auth`.

Attendees with no goal_tags hit a second redirect back to `/profile`, also looking like "nothing happens".

## Fix

Make the profile page's back link role-aware:

1. In `src/routes/_authenticated/event.$eventId.profile.tsx`, when loading the event, also fetch `organizer_account_id` and compute `isOrganizer = ev.organizer_account_id === userData.user.id`.
2. Replace the single `<Link to="/event/$eventId">` in the header with a conditional:
   - **Organizer** → `<Link to="/event/$eventId/share" params={{ eventId }}>← {eventName}</Link>` (the organizer's event page).
   - **Attendee** → keep `<Link to="/event/$eventId" params={{ eventId }}>← {eventName}</Link>`.
3. Also stop forcing organizers through the "must have membership" guard:
   - Currently the profile loader redirects to `/app` if there's no `event_memberships` row. For organizers, that's wrong (they shouldn't be on this page at all). If `isOrganizer && !mem`, redirect to `/event/$eventId/share` instead of showing a "not a member" error.

## Out of scope

- No DB or RLS changes.
- No changes to the attendee dashboard's own redirect logic.
- No styling changes beyond the link target.

## Files

- `src/routes/_authenticated/event.$eventId.profile.tsx` — add `isOrganizer` state, fetch `organizer_account_id`, branch the back link, branch the no-membership redirect.
