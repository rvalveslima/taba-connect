
# Bug pass — error boundaries + friendly Supabase errors

Three connected fixes. No changes to demo flow, no useEffect→loader refactor (flagged only — separate effort).

## 1. Catch-all error & not-found boundaries via router defaults

`__root.tsx` already defines `errorComponent` + `notFoundComponent`, but those only fire when an error reaches the root. Per-route boundaries are needed so a child render/loader failure doesn't blank the screen above it.

The `_authenticated/route.tsx` layout is integration-managed (do not author). Instead:

- **`src/router.tsx`** — add `defaultErrorComponent` and `defaultNotFoundComponent` on `createRouter(...)`. These are inherited by every child route that doesn't define its own (including the managed `_authenticated` subtree). Components live in a new `src/components/route-fallbacks.tsx` and share the same look as the root fallbacks (branded card, "Try again" → `router.invalidate() + reset()`, "Go home" → `/`).
- **`src/routes/auth.tsx`** — add `errorComponent` (specifically for sign-in failures — friendly copy + "Back to sign in" / "Go home"). No loader, so no `notFoundComponent` needed.
- **`src/routes/_authenticated/app.tsx`**, **`event.new.tsx`**, **`event.$eventId.index.tsx`**, **`event.$eventId.share.tsx`**, **`event.$eventId.profile.tsx`**, **`event.$eventId.attendee.$membershipId.tsx`**, **`organizer.tsx`** — add `errorComponent` (and `notFoundComponent` where the route reads a `$param` so a missing record can render a real page instead of bubbling). Each boundary is a one-liner that renders a shared `<RouteErrorFallback>` / `<RouteNotFoundFallback>` from `route-fallbacks.tsx`.

These routes mostly fetch in `useEffect` today, so the boundary catches render-time throws and any future loader work — covered without forcing the refactor.

## 2. Map raw Supabase / network errors to friendly copy

New helper **`src/lib/supabase-errors.ts`**:

```ts
export function friendlyError(err: unknown, fallback: string): string
```

Logic (priority order):

| Detected signal | Friendly message |
|---|---|
| `PostgrestError.code === "23505"` (unique_violation) | context-specific override or "You've already done this." |
| `code === "23503"` (foreign_key) | "We couldn't find that event anymore." |
| `code === "42501"` or message contains `row-level security` / `permission denied` | "You don't have permission to do that." |
| `code === "PGRST116"` | "Couldn't find what you were looking for." |
| `TypeError` with `Failed to fetch` / `NetworkError` / offline | "Network hiccup — check your connection and try again." |
| Auth: `Invalid login credentials` | "That email and password don't match." |
| Auth: `User already registered` | "An account with that email already exists — try signing in." |
| Auth: `Email rate limit exceeded` | "Too many attempts. Wait a minute and try again." |
| Auth: `Email not confirmed` | "Confirm your email first — check your inbox." |
| Anything else | `fallback` arg |

In every branch, also `console.error(err)` so the raw message is in the console for debugging — only the toast/UI gets the friendly copy.

## 3. Wire the helper into the four sites

- **`src/routes/join.$eventId.tsx`** — replace the 4 `toast.error(err instanceof Error ? err.message : "...")` calls in `handleGoogle`, `handleMagicLink`, `handleJoinAsCurrentUser`, `handleDemoAttendee` with `toast.error(friendlyError(err, "<context fallback>"))`. Context fallbacks:
  - Google: "Google sign-in didn't work. Try again or use a magic link."
  - Magic link: "We couldn't send your magic link. Double-check your email."
  - Join: "Couldn't add you to the event. Try again in a moment."
  - Demo: "Demo couldn't start. Refresh and try again."
  - Special case: in `handleJoinAsCurrentUser`, if `insertErr.code === "23505"` (already a member), don't toast — just navigate to `/event/$eventId/profile` (idempotent join).

- **`src/routes/_authenticated/event.new.tsx`** (line 113) — replace with `toast.error(friendlyError(err, "Could not create event. Try again."))`. Image-upload errors get an inline context check (if the thrown error came from storage, override fallback with "Image upload failed — try a smaller file.").

- **`src/routes/_authenticated/app.tsx`** (line 91, `handleJoinByCode` catch) — separate the two outcomes:
  - `data === null` → already shows `toast.error(\`No event found for code "${trimmed}".\`)` (keep).
  - `error` thrown → `toast.error(friendlyError(err, "We couldn't look up that code. Try again."))` — picks up the network-vs-other distinction.

## Out of scope (flagged only)

- Migrating `useEffect`-based fetches in `_authenticated/*` to TanStack Query loaders. Real improvement (SSR, no flash, caching) but a bigger refactor — tackle in a dedicated pass.
- Other toast.error sites surfaced in the audit (#6–#9): they'll naturally use `friendlyError` once the helper exists; I'll convert the obvious ones (`waitlist-dialog.tsx`, `attendee.$membershipId.tsx` copy fallback, `event.$eventId.profile.tsx` save) in the same edit since the cost is low. If you'd rather scope this PR tighter, say so and I'll skip them.

## Verification

- Trigger a render throw in one `_authenticated` child (e.g. temporarily throw in component) → confirm the new boundary renders, not a blank screen.
- Sign in with wrong password on `/auth` → toast reads "That email and password don't match." (not the raw Supabase string).
- Join an event you're already a member of → no error toast; lands on profile page.
- Type a junk code in `/app` join-by-code → "No event found…". Disconnect network, retry → network-friendly toast.
- Create an event with a 10MB image (force upload error) → "Image upload failed…" toast.
