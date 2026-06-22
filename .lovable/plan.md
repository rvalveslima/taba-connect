## Goal

Mirror the organizer demo experience on the attendee side. After the judge signs out as organizer on `/join/$eventId`, they click **"I'm here for the demo"** → land as a demo attendee on the Shebuilds event → fill their profile → reach a dashboard pre-populated with 20 fake attendees → tap into a fake profile → get a friendly "this is demo data" notice instead of opening LinkedIn.

Everything stays behind the existing `DEMO_MODE_ENABLED` flag so we can switch it off after the hackathon.

## Flow

```text
/join/<shebuilds>  (after sign-out)
   └─ "I'm here for the demo →"
        ├─ signs in as demo-attendee@taba.events
        ├─ ensures membership on Shebuilds
        └─ /event/<shebuilds>/profile     ← judge fills their goals
              └─ Find people
                   └─ /event/<shebuilds>/  ← dashboard, 20 seeded peers
                        └─ tap a card → attendee detail
                             └─ "Say hello on LinkedIn"
                                  → fake-profile guard:
                                    toast "Demo data — we can't actually
                                    send a LinkedIn message."
```

## Changes

### 1. `src/lib/demo-mode.ts`
- Add `DEMO_ATTENDEE_EMAIL = "demo-attendee@taba.events"`, `DEMO_ATTENDEE_PASSWORD`, fixed UUID `DEMO_ATTENDEE_ACCOUNT_ID`.
- Add `signInAsDemoAttendee()` helper (signs out, signs in with password, returns ok/false + toast).
- Add `FAKE_PROFILE_MARKER = "__demo_fake__"` — value we'll stuff into the seeded accounts' `linkedin_handle` so the UI can detect "this is fake data".
- Add `isDemoFakeProfile(linkedinHandle)` helper.

### 2. Database — one migration + one data insert

**Migration:** none needed (no schema changes). All seeding done via the `insert` tool.

**Data seed (insert tool):**
- Create `demo-attendee@taba.events` in `auth.users` + `auth.identities` + `public.accounts` (same pattern used for the demo organizer), with a blank profile so the judge fills it.
- Insert 20 `accounts` rows with realistic fake names, roles, companies, industries, languages — each with `linkedin_handle = '__demo_fake__'`.
- Insert 20 matching `event_memberships` rows on the Shebuilds event, each with diverse `goal_tags` (drawn from `INTEREST_TAGS`), varied `looking_for` / `give_back` copy, and `open_to_connect` mostly true.

These rows are idempotent-guarded with fixed UUIDs so re-running the seed doesn't duplicate.

### 3. `src/routes/join.$eventId.tsx`
- Import `DEMO_MODE_ENABLED`, `signInAsDemoAttendee`, `DEMO_EVENT_ID`.
- In the **no-session** branch (and also the **organizer "Sign out & join as attendee"** branch after sign-out), render a primary **"I'm here for the demo →"** button above the Google/magic-link form, only when `DEMO_MODE_ENABLED && eventId === DEMO_EVENT_ID`.
- On click: `signInAsDemoAttendee()` → `ensureMembershipAndGo(DEMO_ATTENDEE_ACCOUNT_ID)` → lands on `/event/<id>/profile`.
- Small caption under the button: "One-click demo attendee — you'll fill a quick profile next."

### 4. `src/routes/_authenticated/event.$eventId.attendee.$membershipId.tsx`
- When `linkedin_handle === FAKE_PROFILE_MARKER`, render the CTA as a plain button (not `<a href>`), and on click show a toast: **"Demo data — we can't actually send a LinkedIn message. Try the message copy instead."**
- Keep the "Copy message" path unchanged.
- Hide/replace the LinkedIn URL hint so we never produce `linkedin.com/in/__demo_fake__`.

### 5. (Optional polish) Dashboard banner
In `event.$eventId.index.tsx`, when the signed-in user is the demo attendee, show a one-line banner under the header: "Demo mode — these attendees are fictional." No behavior change.

## Out of scope

- No changes to organizer flow, RLS, or schema.
- No new routes.
- Real attendees on other events are unaffected — the demo button only appears on the Shebuilds event.
- Messaging (`messages` table) untouched.

## Kill switch

Set `DEMO_MODE_ENABLED = false` in `src/lib/demo-mode.ts` → both organizer and attendee demo buttons disappear; seeded fake attendees remain in the DB until manually removed (I'll provide a cleanup SQL on request).
