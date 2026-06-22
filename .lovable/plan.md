## What's already in place

The attendee demo flow is wired correctly end-to-end:

1. Demo link → `/auth` → "I'm here for the demo (attendee)" → magic-link sign-in as `demo-attendee@taba.events`.
2. Lands on `/app` and sees the **Shebuilds — Open event** card.
3. Clicking **Open event** goes to `/event/$eventId`, whose loader checks `goal_tags`. If empty, it redirects to `/event/$eventId/profile` (already implemented).
4. After saving the profile, the user lands on the attendees / match dashboard.

I already cleared the demo attendee's account fields and membership answers in the database, so right now the flow works as you described.

## The remaining gap

The demo attendee is a single shared account. As soon as the first demo person fills in the profile, the next person to run the demo inherits that profile and skips step 3 entirely — defeating the purpose.

## The fix

Reset the demo attendee back to a blank profile every time someone clicks "I'm here for the demo (attendee)". The reset runs server-side inside the existing `createDemoSession` server function, right before the magic link is minted, so it's automatic and the demo person never sees stale data.

### What gets reset on each demo sign-in (attendee role only)

On the `accounts` row for `demo-attendee@taba.events`:
- `name` → empty
- `role`, `company`, `location`, `industry`, `linkedin_handle` → cleared
- `languages` → cleared

On the `event_memberships` row for the Shebuilds demo event:
- `goal_tags` → empty (this is what triggers the redirect to `/profile`)
- `looking_for`, `give_back` → cleared
- `open_to_connect` → reset to default (true)
- The membership row itself is kept so the user still sees "Shebuilds — Open event" on `/app`.

The organizer demo is untouched.

## Files

- edit: `src/lib/demo-auth.functions.ts` — when `role === "attendee"`, run the reset (via `supabaseAdmin`) before generating the magic link. Uses the existing `DEMO_ATTENDEE_ACCOUNT_ID` and `DEMO_EVENT_ID` constants from `src/lib/demo-mode.ts`.

No UI, route, or schema changes needed — the existing profile-gate redirect in `event.$eventId.index.tsx` already enforces the rest.

## Out of scope

- Resetting between concurrent demo sessions (if two people start the demo within the same minute they'll race on the same account — acceptable for a demo).
- Resetting messages or other event data the demo attendee may have created.
