# Surface Terms & Code of Conduct in the attendee experience

The `/terms` page already exists. The attendee journey has two natural commit points where consent should be visible. Recommendation: add a short, consistent "By joining, you agree to our Terms & Code of Conduct" line directly under the primary action button at each step. Linking (not a checkbox) keeps friction low while still putting the terms in front of every attendee before they commit.

## Where to add it

1. **`src/routes/join.$eventId.tsx`** — the main attendee entry point.
   - Under the "Join the event" button (signed-in path, ~line 226).
   - Under the submit button of the inline sign-up / join form (~line 307).
   - Under the "Continue" button on the email-lookup step (~line 273).
   - Single shared snippet so the wording stays identical.

2. **`src/routes/auth.tsx`** — generic signup path (used when attendees create an account outside the join flow).
   - Under the Sign-up submit button, same snippet.

3. **Footer of `src/routes/index.tsx`** — already public, but add a small "Terms & Code of Conduct" link in the footer for discoverability after the fact. (Optional — confirm if you want this.)

## What the snippet looks like

```tsx
<p className="mt-3 text-center text-xs text-muted-foreground">
  By joining, you agree to our{" "}
  <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">
    Terms & Code of Conduct
  </Link>.
</p>
```

Opens in the same tab (it's a first-party page). `<Link>` from `@tanstack/react-router` so it stays client-side.

## Why this approach (vs alternatives)

- **Inline link under the CTA** (recommended): zero added clicks, legally meaningful because it sits at the moment of consent, matches how Eventbrite / Luma / Partiful handle it.
- **Required checkbox**: stronger consent record, but adds friction to a flow we're trying to keep one-tap. Recommend only if you want an auditable opt-in.
- **Modal on first join**: high friction, attendees dismiss without reading. Skip.

## Out of scope

No changes to `/terms` copy, no new route, no DB column to record acceptance (can add later if you want an audit trail — let me know).

## Open question

Do you want option A (inline link, recommended) or option B (required checkbox that blocks the button until ticked)? And should I add the footer link on the homepage too?
