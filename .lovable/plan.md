# Accessibility Audit

Scanned the app routes and components. Overall the project is in good shape — shadcn primitives are intact, images all have alt text, every route has a single `<main>`, form inputs are properly labeled, and most interactive controls have visible text. No keyboard traps, no `tabIndex > 0`, no color-only state.

## Findings

### Critical (blocks users)
None.

### Warning (degrades experience)
1. **Viewport height uses `min-h-screen` everywhere** (12 routes/components). On mobile browsers with a dynamic URL bar, `100vh` overflows and bottom content gets clipped. Should be `min-h-dvh`.
   - Files: `terms.tsx`, `reset-password.tsx`, `auth.tsx`, `join.$eventId.tsx`, `index.tsx`, `route-fallbacks.tsx`, `_authenticated/{app,organizer,event.new,event.$eventId.index,event.$eventId.overview,event.$eventId.profile,event.$eventId.share,event.$eventId.attendee.$membershipId}.tsx`.
2. **`autoFocus` outside dialogs** in `event.$eventId.profile.tsx` (lines 346, 506). Auto-focusing on page load can disorient screen-reader and keyboard users by jumping past landmark navigation. Acceptable inside the waitlist dialog (already there), but should be removed from the in-page tag/language adders — focus the input via `ref.current?.focus()` triggered by the user's click instead (which is already what triggers `autoFocus` here, so the visible behavior won't change for sighted users).
3. **Loading text without `aria-live`** in `event.$eventId.attendee.$membershipId.tsx` (line 220) and `event.$eventId.profile.tsx` (line 205) — just `Loading…`. Screen readers don't announce the change. Either swap to a skeleton (like we just did on the attendees list) or wrap with `role="status" aria-live="polite"`.

### Info (best practice)
4. **`<canvas>` for QR code** in `share-panel.tsx` (line 37) has `aria-label="Join QR code"` but no fallback text inside. Add a visually-hidden text node with the join URL/code so screen readers can read the actual link, not just "QR code".
5. **Headings**: `event.$eventId.index.tsx` has `<h1>Attendees</h1>` — good. Quickly verified no skipped heading levels in audited routes.

## Proposed Fixes (in priority order)

I'd recommend fixing #1 and #2 — both are real mobile/AT issues, both are mechanical edits with no behavioral risk:

- **Fix #1**: project-wide find/replace `min-h-screen` → `min-h-dvh` across the 12 files listed. (No design impact; better mobile behavior.)
- **Fix #2**: remove the two `autoFocus` props in `event.$eventId.profile.tsx` and replace with a `useEffect`/`ref.focus()` triggered when `addingTag`/`adding` becomes true. (Same UX for sighted users, no surprise focus jump on initial mount.)
- **Fix #3** (optional): convert the two `Loading…` strings to skeletons matching their page layouts, consistent with what we just did on the attendee list.
- **Fix #4** (optional): add a visually-hidden span next to the QR canvas with the actual join URL.

Tell me which fixes to apply — "just 1 and 2", "all of them", or pick specific numbers.

Used the accessibility skill.
