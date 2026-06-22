
## Goal

On the attendee match page (`src/routes/_authenticated/event.$eventId.attendee.$membershipId.tsx`), show every shared goal tag explicitly instead of truncating to "Product and Design +1 more", and have each shared goal count as its own "thing in common".

## Changes

**File:** `src/routes/_authenticated/event.$eventId.attendee.$membershipId.tsx`

1. **`commonGroundBullets(me, them, overlap)`** — rewrite so it returns one bullet per shared goal, plus a bullet per shared language (non-English prioritized), plus an industry bullet when matching. Drop the "+N more" truncation and the `.slice(0, 3)` cap.
   - One bullet per overlap tag: `Both focused on {tag}`
   - One bullet per shared language: `Both speak {lang}`
   - One bullet for shared industry: `Both in {industry}`

2. **Count** — the `OverlapCircles count={bullets.length}` and the "{N} things in common" label already use `bullets.length`, so once bullets are 1-per-match the count updates automatically and each goal counts toward the total.

3. Keep the rest of the page (Wants/Gives, "One thing to ask about", suggested message, CTA) unchanged.

## Out of scope

No schema changes. No changes to the home grid card preview. Suggested message opener still uses the top 2 overlapping tags to keep the message short.
