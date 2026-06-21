## Pass A — correctness & security (do first)

Small, focused, removes real risks. No new screens.

### A1. Input validation on profile save
Add a zod schema to `src/routes/_authenticated/event.$eventId.profile.tsx` and validate before the Supabase update. Caps:
- `name` 1–100, trim, required
- `role`, `company`, `location` ≤ 120, trim, optional
- `linkedin_handle` ≤ 200, see A2
- `looking_for`, `give_back` ≤ 500, trim
- `languages` ≤ 20 entries, each ≤ 40
- `goal_tags` only values present in `INTEREST_TAGS`

On failure, surface the first message via `toast.error` and don't navigate.

### A2. LinkedIn handle: normalize + sanitize
Save format: bare handle only (e.g. `raquel-lima`). Logic at save:
- accept `https://linkedin.com/in/<handle>`, `linkedin.com/in/<handle>`, `/in/<handle>`, `/<handle>`, or `<handle>`
- strip protocol/host/path; keep the segment after `/in/` (or the whole input if no slashes)
- reject if it contains `:`, whitespace, `<`, `>`, or `"` (blocks `javascript:` and HTML injection)
- regex: `^[A-Za-z0-9-_.]{2,100}$`

On render (attendee detail page), always construct `https://www.linkedin.com/in/<encodeURIComponent(handle)>` — never use the raw stored value as href.

### A3. Profile-completeness gating
On `/event/$eventId/` (dashboard), if the user's own membership has empty `goal_tags`, redirect to `/event/$eventId/profile` instead of rendering. The landing page already routes incomplete profiles correctly; this closes the direct-URL hole.

### A4. Sign-out hygiene
In `/app` and the dashboard's sign-out handler:
```
await queryClient.cancelQueries();
queryClient.clear();
await supabase.auth.signOut();
navigate({ to: "/auth", replace: true });
```
We don't use React Query yet, but the pattern is cheap and future-proofs it. If we have no `queryClient` in scope, just keep `signOut` + `replace: true` — that part is already correct.

### A5. Enable HIBP leaked-password check
Call `configure_auth` with `password_hibp_enabled: true` (keep other flags at current values: `disable_signup: false`, `auto_confirm_email: false` unless you want demo mode, `external_anonymous_users_enabled: false`).

---

## Pass B — missing features

### B1. Organizer "create event" screen
New route `src/routes/_authenticated/event.new.tsx`. Form: name (required), date_start, date_end, event_code (auto-generated 6-char if blank). On submit:
1. `INSERT INTO events` with `organizer_account_id = auth.uid()`
2. `INSERT INTO event_memberships` so the organizer is also an attendee (needed for the share/dashboard to load)
3. navigate to `/event/$eventId`

Add a "Create event" button on `/app` next to the join-by-code panel.

### B2. Google sign-in: configure provider
Call `configure_social_auth` with `providers: ["google"]`. The button on `/auth` already calls `lovable.auth.signInWithOAuth("google")`, so no code change.

### B3. Password reset
- Add "Forgot password?" link on `/auth` (sign-in mode) → calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/reset-password` })`
- Create public route `/reset-password` that shows a new-password form and calls `supabase.auth.updateUser({ password })`, then redirects to `/app`

### B4. Email-confirmation handling on `/auth`
After `signUp` succeeds with no session returned, don't navigate to `/app` (that loops back to `/auth`). Show: "Check your email to confirm your account, then sign in." Stay on the page.

### B5. Messaging UI
Smallest useful version: on the attendee detail page, list prior messages between me and them (already permitted by RLS), keep the send form. Add a small "Messages" link in the dashboard header that lists threads (group by `recipient_membership_id`). Inbox is optional — confirm if you want it now or later.

### B6. Filter state in URL
Move dashboard filters (`role`, `company`, `goal`, `language`, `openOnly`) into search params via `validateSearch` + `zodValidator`. Filters survive refresh and are shareable.

---

## Notes / out of scope

- **Auth email templates** (branded reset/confirm emails) — separate setup that needs an email domain. Skipping unless you ask.
- **Edit-after-create for events** — organizers can't currently change name/dates from the UI. Add later if needed.
- **Leave-event button** — RLS allows it, no UI. Skipping unless you ask.
- **Real "past" semantics** based on `date_end < today` — small, can fold into B1 or do separately.

I'll execute Pass A in one batch, then Pass B in a second batch. Approve and I'll start.
