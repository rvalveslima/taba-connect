# 1-Hour Demo Polish Plan

Goal: make the organizer flow feel intentional and confident on screen. No new features — only the small things that will read on a projector.

## What I'd touch (in priority order)

### 1. First impression — the organizer landing page (~15 min)
The page reviewers see right after login sets the tone.
- Tighten the hero/header copy so it names what this product *is* in one line.
- Make the primary CTA ("Create event" or similar) visually dominant; demote secondary actions.
- Ensure an empty state never appears during the demo — if there's a "no events yet" branch, double-check the seeded events show up here.

### 2. Event detail page — the attendee list (~20 min)
This is where the language filter we just fixed lives, and likely the screen you'll spend most demo time on.
- Verify the language filter visibly works on stage: pick one seeded language, watch the list shrink, clear it.
- Polish the filter bar: consistent pill spacing, active state clearly different from idle, count of results visible ("12 of 48 attendees").
- Make sure attendee rows have predictable heights (avatars, name, language chip) — jittery rows read as "unfinished."
- Add a subtle empty state for "no attendees match these filters" instead of a blank area.

### 3. Event creation flow (~10 min)
- Confirm Cancel returns to `/organizer` (we just fixed this) — click through it once.
- Check the form's required-field states and the submit button's loading state.
- Make sure success → redirects somewhere that looks alive, not a blank screen.

### 4. Cross-cutting polish (~10 min)
- **Loading states**: replace any raw "Loading…" text with a skeleton matching the final layout. Reviewers notice layout shift.
- **Toasts**: ensure create/update/delete actions show a toast. Silent success looks broken.
- **Mobile check**: open the demo URL on your phone once. If you'll demo on desktop only, skip.
- **Favicon + tab title**: set the event-detail route's `<title>` to the event name. Small but reads as "polished product."

### 5. Demo hygiene (~5 min, not code)
- Pre-open the 2–3 tabs you'll switch between.
- Sign in once, refresh, confirm session persists.
- Pick the *one* seeded event you'll demo and make sure its attendee list has variety across the 5 languages so the filter is visibly meaningful.

## What I'd skip for a 1-hour budget
- New features (AI matching, dashboards, charts).
- Redesigning the visual system.
- Animations beyond what's already there.
- Anything requiring a migration.

## Suggested order to ship now
1. Event detail polish (biggest visible payoff during demo).
2. Organizer landing polish (first impression).
3. Loading/toast pass across the flow.
4. Title tags + favicon check.

Tell me which item to start with — or say "all of it, in that order" and I'll work top-to-bottom until time's up.
