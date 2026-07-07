## Change

In `src/routes/index.tsx`, replace the "Try the live demo →" `<Link to="/auth">` with a `<button>` that calls `signInAsDemoOrganizer()` directly (imported from `@/lib/demo-mode`). This is the same one-click demo mechanism used by the auth page's "I'm here for the demo" organizer button — it signs the visitor into the demo organizer account and lands them in the organizer dashboard where they can create an event and copy the shareable event link.

Keep the surrounding copy, styling, and layout identical (same underline/hover treatment, same paragraph). Only the element type and click behavior change.

No other files, no backend changes.