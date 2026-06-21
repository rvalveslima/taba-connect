## Fix: organizer login page hydration glitch

**Problem.** Clicking "Join as organizer" navigates to `/auth?as=organizer`, but a hydration-mismatch error overlay blocks the login form from appearing. Root cause: the password `useState` is seeded from the `as=organizer` search param during the initial render, which produces different markup between the SSR shell and the client mount.

**Fix.** Keep the initial render deterministic; apply the organizer prefill on the client only.

### Changes
- `src/routes/auth.tsx`:
  - Change `useState(isOrganizer ? "Tabaevent123" : "")` to `useState("")`.
  - Add a `useEffect([isOrganizer])` that sets the password to `Tabaevent123` when organizer mode is active and the field is still empty.

### Verify
- Reload `/`, click "Join as organizer" → `/auth?as=organizer` renders the form with the demo banner, the password field prefilled, and no error overlay. Submitting an email signs in (or auto-signs-up) and redirects to `/event/new`.

No other files touched.