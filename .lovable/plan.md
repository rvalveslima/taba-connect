## Goal
When an attendee signs out, the page they land on (`/auth`) should include the same "I'm here for the demo" one-click button that exists on the join page — right now that button only appears for organizers.

## Change
In `src/routes/auth.tsx`, add a demo-attendee block that mirrors the existing organizer demo block, but only renders on the attendee variant of the page (the default — i.e. when `as !== "organizer"`).

- Import `signInAsDemoAttendee` from `@/lib/demo-mode` (alongside the existing `signInAsDemoOrganizer` import).
- Above the Google button, when `!isOrganizer && DEMO_MODE_ENABLED && !magicLinkSent`, render:
  - A primary "I'm here for the demo →" button that calls `signInAsDemoAttendee()`, then on success `navigate({ to: "/app", replace: true })`.
  - Helper copy: "One-click access as a demo attendee."
  - The same "or sign in" divider used in the organizer block.
- No changes to the magic-link form, Google button, organizer flow, or sign-out logic. Attendee sign-out already routes to `/auth`; this just makes that page useful for demos.

## Out of scope
- No routing changes for sign-out (already correct).
- No copy or layout changes beyond inserting the demo block.
- No changes to the organizer demo block or join page.