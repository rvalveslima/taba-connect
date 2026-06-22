## Problem

The screenshot is `/auth`, not `/join/:eventId`. The last change only updated the invite page. Attendees can still reach `/auth` (marketing "Sign in" links, refresh on a protected route, old links) and see email/password there.

## Fix

Make `/auth` show **Google + magic link** by default (attendee mode), and keep **Google + email/password** only when `?as=organizer` (the URL the marketing "Get started" buttons use).

### Edits in `src/routes/auth.tsx`

1. **Attendee branch (default, `isOrganizer === false`)** — replace the entire email/password form, "Forgot password" link, sign-in/sign-up toggle, and demo password effects with the magic-link UI:
   - Keep the existing "Continue with Google" button (uses `lovable.auth.signInWithOAuth`, redirects to `/app`).
   - Add an `or` divider, then an email field + "Email me a magic link" button calling `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + "/app" } })`.
   - After submit, show a "Check your inbox — link sent to {email}" panel with a "Use a different email" reset link (same pattern as `join.$eventId.tsx`).
   - Hide the "New to Taba? Create an account" toggle and the "Forgot password?" link for attendees.

2. **Organizer branch (`?as=organizer`)** — leave the current UI as-is: Google button, email/password form, demo-password hint, forgot-password flow. Redirect target stays `/organizer`.

3. **Cleanup** — keep `currentEmail` "Signed in as…" banner for both branches. Remove the sign-up `mode` toggle entirely for attendees (organizer demo flow already handles sign-up implicitly via `handleEmail`).

4. **Copy update** — attendee header stays "Sign in" / "Welcome back to your village." Button label "Email me a magic link" matches `/join`.

## Out of scope

- No changes to `/join/:eventId` (already magic-link).
- No changes to `/reset-password`, `/organizer`, or the marketing page.
- No DB, RLS, or email-template changes. Uses the default Supabase magic-link email.

## Files

- `src/routes/auth.tsx` — branch attendee vs organizer; add magic-link handler and "check your inbox" state for attendees.
