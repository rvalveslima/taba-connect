## How to share the E2E flow without "already logged in" collisions

The "already logged in" problem isn't a bug — your browser is signed in as one persona and every route then bypasses sign-in. Two practical ways to share:

**For non-Lovable testers (recommended):**
1. Top-right of the editor → **Share → Share preview**. That gives you a 7-day public preview URL that anyone can open without a Lovable login.
2. Tell each tester to open it in an **Incognito / Private window** (or a fresh browser profile). Each persona = one incognito window. Closing the window wipes the session.

**For yourself while testing locally:**
- Open `/app` → click "Sign out" before switching personas.
- Or just open a new Incognito window per persona (organizer, attendee A, attendee B).

I'll also make the testing surface friendlier so you stop getting trapped (see fix #1 and #2 below).

---

## QA scan — what's working

- Organizer flow: `/` → "Join as organizer" → `/auth?as=organizer` → demo login (`Tabaevent123`) → `/event/new` → image upload → `/event/$eventId/share` with QR + link. ✅
- Attendee flow: `/join/$eventId` (public, shows event name + dates + cover image) → sign up/in → membership created → `/event/$eventId/profile` → "Find people" → `/event/$eventId` dashboard. ✅
- Anon SELECT on `events` so logged-out attendees can preview shared links. ✅
- Membership insert is idempotent (no duplicate rows when the organizer joins their own event). ✅

## QA scan — bugs and rough edges to fix

### 1. Stale session hijacks the organizer flow
On `/auth?as=organizer`, the `useEffect` calls `getUser()` and, if any user is signed in, immediately redirects to `/event/new` — bypassing the demo login. So a tester signed in as an attendee who clicks "Join as organizer" silently becomes an organizer with their attendee account. Fix: when `as=organizer` and the current session's email doesn't match what they're about to type, surface a "You're signed in as X — sign out to continue as organizer" banner with a one-click sign-out, instead of auto-redirecting.

### 2. No way to switch accounts from `/auth`
Testers landing on `/auth` who are already signed in get bounced before they can sign in as someone else. Fix: add a small "Signed in as X — sign out" link at the top of `/auth` whenever a session exists, so personas can be swapped without hunting for `/app`.

### 3. `/auth` hydration warning in the console
React logs `Hydration failed … <AuthPage> vs <Suspense>` on every visit to `/auth`. Root cause: the route is `ssr: false`, so the server emits the suspense fallback and the client mounts the real component — TanStack's pending component contract triggers the warning. Cosmetic only (page works), but it pollutes the error overlay during testing. Fix: set an explicit `pendingComponent: () => null` on the `/auth` route so server and client agree on the initial markup.

### 4. `/app` "Loading…" can hang if the session is gone
In `src/routes/_authenticated/app.tsx`, `setLoading(false)` only runs after the membership query, but the early return on no user leaves `loading` permanently true. The `_authenticated` gate normally redirects first, but on a soft sign-out the dashboard can briefly stick on "Loading…". Fix: move `setLoading(false)` into a `finally`.

### 5. Unused `DEMO_EVENT_ID` constant in `/app`
`const DEMO_EVENT_ID = "…"` and `ACTIVE_WINDOW_MS` are declared and never used. Dead code — remove.

### 6. Profile page redirects logged-in attendee back to `/join/$eventId`
On `/event/$eventId/profile`, if the membership query returns nothing (RLS hiccup or stale data), the page redirects to `/join/$eventId` — which then sees an existing membership and bounces back to `/profile`. Potential redirect loop. Fix: when the redirect target would be the join page for an event the user already belongs to, send them to `/app` with a toast instead.

### 7. Join-by-code uses `ilike` without escaping
`/app` joins by code via `.ilike("event_code", trimmed)`. If a tester pastes a code with `%` or `_`, it becomes a wildcard. Low risk for the demo, but worth switching to `eq()` with `.toUpperCase()` since codes are uppercase A-Z/2-9.

### 8. Mobile QR + share panel polish
On `/event/$eventId/share` the QR canvas is fixed 180px and sits next to the URL input; on very narrow screens the layout already stacks, but the copy button can wrap awkwardly. Minor — confirm on a 360px viewport.

---

## What I'll change in build mode

- `src/routes/auth.tsx`: drop the unconditional auto-redirect on existing session; render a "Signed in as … sign out" banner at the top (both organizer and attendee modes); add `pendingComponent: () => null` to the route to silence the hydration warning.
- `src/routes/_authenticated/app.tsx`: `try/finally` on `setLoading`, remove the unused `DEMO_EVENT_ID` and `ACTIVE_WINDOW_MS`, switch join-by-code to `eq` + `.toUpperCase()`.
- `src/routes/_authenticated/event.$eventId.profile.tsx`: if membership is missing, redirect to `/app` with a toast instead of `/join/$eventId`.

No DB changes. No design changes. Nothing else touched.

## Verification

1. Incognito window → open share link → sign up as attendee → land on profile → save → land on dashboard.
2. In the same window click "Sign out" on `/app` → land on `/auth` → "Signed in as" banner is gone → sign in as a different email → land on `/app` clean.
3. While signed in as an attendee, click "Join as organizer" on `/` → land on `/auth?as=organizer` and see the "Signed in as X — sign out" banner (no silent redirect to `/event/new`).
4. Refresh `/auth` → no React hydration warning in the console.
