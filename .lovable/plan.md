## Attendee join flow — Google sign-in + magic link

Replace the email/password attendee auth on `/join/:eventId` with two options: **Continue with Google** and **email magic link**. After authentication, the user is auto-joined to the event (same `ensureMembershipAndGo` logic).

### UX

When the visitor is not signed in, the right panel shows:

1. **Continue with Google** button (primary, at top) — uses the existing `lovable.auth.signInWithOAuth("google", ...)` flow with `redirect_uri` set back to `/join/{eventId}` so they land here, then auto-join runs.
2. Divider ("or").
3. **Email magic link** form — single email field + "Send me a magic link" button. Calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: <join url>, data: { name? } } })`. After sending: shows confirmation state ("Check your inbox — we sent a link to {email}").
4. Optional **name field** above email (only for first-time attendees) so we can seed `accounts.name`. Pre-empty is fine; name can also be set later on the profile screen, so this field is optional.

Remove the "New to Taba / I have an account" tabs — magic link unifies both. Keep the "already signed in" and "you're the organizer" branches unchanged.

### Auto-join after magic link

When the user returns via the magic link, the route already mounts, sees `hasSession === true`, and currently requires them to click "Join the event". To make it seamless, when `hasSession` becomes true AND it just transitioned from `false` (i.e., we just signed in via magic link/Google on this page), auto-call `ensureMembershipAndGo` instead of waiting for a click. Detect with a `useRef` flag set when we kick off Google/magic-link sign-in, or simply: if signed in and not the organizer, auto-join on mount.

### Files

- `src/routes/join.$eventId.tsx` — replace the unsigned-in branch (lines 247–347) with Google button + magic-link form; remove `handleNewAccount`, `handleExisting`, password state, and `authMode` state; add `handleGoogle` and `handleMagicLink`; add auto-join effect when session is present.

No DB, RLS, or server-function changes. Google provider is already wired (used on `/auth` via `lovable.auth.signInWithOAuth`).

### Out of scope

- `/auth` page (organizer + general sign-in) stays on email/password — only the attendee join flow changes.
- No email template customization (default Supabase magic-link email is used).
