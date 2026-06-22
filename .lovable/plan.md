## Goal
A judge clicks **"I'm here for the demo"** → lands directly in the Shebuilds organizer dashboard → grabs the attendee join link → runs the real attendee flow. Existing auth is untouched. Button is gated behind a single flag you can flip off after the demo.

## Status
- ✅ Demo organizer account `demo@taba.events` / `Tabaevent123` created in the database.
- ✅ **Shebuilds** event reassigned to that account.
- ⏭️ Code changes below pending your approval.

## Code changes

### 1. New file — `src/lib/demo-mode.ts`
The kill switch + shared sign-in helper:
```ts
export const DEMO_MODE_ENABLED = true; // flip to false after the hackathon
```
Also exports `signInAsDemoOrganizer()` — signs out any current user, signs in as the demo account, returns success/failure (toasts on error).

### 2. `src/routes/index.tsx` — homepage
Add a secondary **"I'm here for the demo →"** button:
- Next to "Join as organizer" in the hero
- Next to "Join as organizer" in the final CTA section

Both wrapped in `{DEMO_MODE_ENABLED && …}` so flipping the flag removes them everywhere. Clicking either runs `signInAsDemoOrganizer()` then `navigate("/organizer")`.

### 3. `src/routes/auth.tsx` — organizer sign-in page
Replace the current blue "Demo access — use any email with password Tabaevent123" info box with a real primary button:
> **I'm here for the demo →**

Gated by `DEMO_MODE_ENABLED`. Below it: divider, then the unchanged Continue with Google + email/password form for real organizers.

### 4. `src/routes/_authenticated/organizer.tsx` — dashboard hint
When the signed-in email is `demo@taba.events`, show a friendly banner above the events list:
> 👋 You're in the demo. Open **Shebuilds** below, then click **Share** to get the attendee join link.

No structural change; pure presentational hint so judges know the next click.

## Demo script
1. Homepage → **I'm here for the demo**
2. Lands on `/organizer` as demo user → sees Shebuilds card with banner
3. Click **Share** → copy attendee join link / scan QR
4. Open the join link on a phone → real attendee flow (Google sign-in) → profile → matches

## Turning the demo off later
Just tell me "disable demo mode" and I'll flip `DEMO_MODE_ENABLED` to `false`. All three buttons disappear instantly, the demo account stays in the DB harmlessly.

## Out of scope
- Attendee flow unchanged (still Google / magic link).
- No RLS or schema changes.
- No new public/anonymous routes.
